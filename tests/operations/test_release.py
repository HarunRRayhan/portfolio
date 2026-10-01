import importlib.util
import io
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest
import urllib.error
from unittest.mock import patch

SCRIPT = Path(__file__).resolve().parents[2] / 'scripts/release-production.py'


class ReleaseTests(unittest.TestCase):
    def setUp(self):
        environment = patch.dict(os.environ, {'RAILWAY_ENVIRONMENT_ID': 'isolated-test'})
        environment.start()
        self.addCleanup(environment.stop)
        spec = importlib.util.spec_from_file_location('release', SCRIPT)
        self.release = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(self.release)

    def test_failed_or_cancelled_ci_blocks_activation(self):
        for conclusion in ['failure', 'cancelled', 'skipped']:
            self.release.github_runs = lambda sha: [{'name': 'PR checks', 'event': 'push', 'head_sha': sha, 'status': 'completed', 'conclusion': conclusion, 'run_number': 1}]
            with self.assertRaises(RuntimeError):
                self.release.wait_ci('a' * 40)

    def test_ci_requires_exact_commit(self):
        self.release.github_runs = lambda sha: [{'name': 'PR checks', 'event': 'push', 'head_sha': 'b' * 40, 'status': 'completed', 'conclusion': 'success', 'run_number': 1}]
        clock = iter([0, 0, 2])
        with patch.object(self.release.time, 'sleep'), patch.object(self.release.time, 'monotonic', side_effect=lambda: next(clock)):
            with self.assertRaises(TimeoutError):
                self.release.wait_ci('a' * 40, timeout=1)

    def test_successful_ci_for_exact_commit_passes(self):
        self.release.github_runs = lambda sha: [{'name': 'PR checks', 'event': 'push', 'head_sha': sha, 'status': 'completed', 'conclusion': 'success', 'run_number': 1}]
        self.release.wait_ci('a' * 40)

    def test_inflight_deployment_blocks_new_mutation(self):
        self.release.deployments = lambda service: [{'id': 'pending', 'status': 'DEPLOYING', 'meta': {'commitHash': 'b' * 40}}]
        with patch.object(self.release, 'graphql') as mutation:
            with self.assertRaises(RuntimeError):
                self.release.deploy_service('web', 'a' * 40)
            mutation.assert_not_called()

    def test_scheduler_waits_for_successful_web(self):
        events = []
        self.release.deploy_service = lambda service, sha: events.append((service, sha))
        self.release.release('a' * 40, 'web', 'scheduler')
        self.assertEqual(events, [('web', 'a' * 40), ('scheduler', 'a' * 40)])

    def test_failed_web_never_deploys_scheduler(self):
        events = []
        def fail(service, sha):
            events.append(service)
            raise RuntimeError('web failed')
        self.release.deploy_service = fail
        with self.assertRaises(RuntimeError):
            self.release.release('a' * 40, 'web', 'scheduler')
        self.assertEqual(events, ['web'])

    def test_rejects_non_exact_revision(self):
        with self.assertRaises(ValueError):
            self.release.release('main', 'web', 'scheduler')

    def test_new_success_uses_explicit_sha_without_latest_commit(self):
        responses = iter([[], [{'id': 'new', 'status': 'SUCCESS', 'meta': {'commitHash': 'a' * 40}}]])
        self.release.deployments = lambda service: next(responses)
        with patch.object(self.release, 'graphql', return_value={'serviceInstanceDeploy': True}) as mutation:
            self.assertEqual(self.release.deploy_service('web', 'a' * 40), 'new')
            query, variables = mutation.call_args.args
            self.assertIn('latestCommit:false', query)
            self.assertIn('commitSha:$sha', query)
            self.assertEqual(variables['sha'], 'a' * 40)

    def test_uncertain_web_request_reconciles_before_scheduler(self):
        events = []
        records = iter([
            ('web', []),
            ('web', [{'id': 'web-new', 'status': 'BUILDING', 'meta': {'commitHash': 'a' * 40}}]),
            ('web', [{'id': 'web-new', 'status': 'SUCCESS', 'meta': {'commitHash': 'a' * 40}}]),
            ('scheduler', []),
            ('scheduler', [{'id': 'scheduler-new', 'status': 'SUCCESS', 'meta': {'commitHash': 'a' * 40}}]),
        ])
        def deployments(service):
            expected, response = next(records)
            self.assertEqual(service, expected)
            events.append(('read', service, response))
            return response
        def mutation(query, variables):
            events.append(('mutation', variables['service']))
            if variables['service'] == 'web':
                raise self.release.UncertainRequestError('request timed out')
            return {'serviceInstanceDeploy': True}
        self.release.deployments = deployments
        with patch.object(self.release, 'graphql', side_effect=mutation) as request, patch.object(self.release.time, 'sleep'):
            self.release.release('a' * 40, 'web', 'scheduler')
        self.assertEqual(request.call_count, 2)
        self.assertEqual([event for event in events if event[0] == 'mutation'], [('mutation', 'web'), ('mutation', 'scheduler')])

    def test_uncertain_request_without_new_deployment_expires(self):
        self.release.deployments = lambda service: [{'id': 'old', 'status': 'SUCCESS', 'meta': {'commitHash': 'a' * 40}}]
        clock = iter([0, 0, 2])
        with patch.object(self.release, 'graphql', side_effect=self.release.UncertainRequestError('timeout')) as mutation:
            with patch.object(self.release.time, 'sleep'), patch.object(self.release.time, 'monotonic', side_effect=lambda: next(clock)):
                with self.assertRaises(TimeoutError):
                    self.release.deploy_service('web', 'a' * 40, timeout=1)
        self.assertEqual(mutation.call_count, 1)

    def test_explicit_deployment_rejection_does_not_poll(self):
        for result in [False, None]:
            with patch.object(self.release, 'deployments', return_value=[]) as records:
                with patch.object(self.release, 'graphql', return_value={'serviceInstanceDeploy': result}) as mutation:
                    with self.assertRaisesRegex(RuntimeError, 'did not accept'):
                        self.release.deploy_service('web', 'a' * 40)
                self.assertEqual(records.call_count, 1)
                self.assertEqual(mutation.call_count, 1)

    def test_definite_graphql_error_does_not_reconcile(self):
        with patch.object(self.release, 'deployments', return_value=[]) as records:
            with patch.object(self.release, 'graphql', side_effect=RuntimeError('GraphQL rejected')):
                with self.assertRaisesRegex(RuntimeError, 'GraphQL rejected'):
                    self.release.deploy_service('web', 'a' * 40)
            self.assertEqual(records.call_count, 1)

    def test_mutation_timeout_is_not_retried(self):
        with patch.dict(os.environ, {'RAILWAY_PROJECT_TOKEN': 'isolated-test-token'}):
            with patch.object(self.release.urllib.request, 'urlopen', side_effect=TimeoutError) as request:
                with self.assertRaises(self.release.UncertainRequestError):
                    self.release.graphql('mutation { operation }', {})
                self.assertEqual(request.call_count, 1)

    def test_http_error_is_definite_and_not_retried(self):
        error = urllib.error.HTTPError(
            'https://backboard.railway.com/graphql/v2', 401, 'Unauthorized', hdrs=None, fp=io.BytesIO(b''),
        )
        self.addCleanup(error.close)
        with patch.dict(os.environ, {'RAILWAY_PROJECT_TOKEN': 'isolated-test-token'}):
            with patch.object(self.release.urllib.request, 'urlopen', side_effect=error) as request:
                with self.assertRaises(RuntimeError) as caught:
                    self.release.graphql('mutation { operation }', {})
                self.assertNotIsInstance(caught.exception, self.release.UncertainRequestError)
                self.assertEqual(request.call_count, 1)

    def test_query_timeout_has_bounded_retries(self):
        with patch.dict(os.environ, {'RAILWAY_PROJECT_TOKEN': 'isolated-test-token'}):
            with patch.object(self.release.time, 'sleep'), patch.object(self.release.urllib.request, 'urlopen', side_effect=TimeoutError) as request:
                with self.assertRaises(RuntimeError):
                    self.release.graphql('query { operation }', {})
                self.assertEqual(request.call_count, 3)

    def test_old_deployment_success_cannot_satisfy_release(self):
        self.release.deployments = lambda service: [{'id': 'old', 'status': 'SUCCESS', 'meta': {'commitHash': 'a' * 40}}]
        self.release.graphql = lambda *args: {'serviceInstanceDeploy': True}
        clock = iter([0, 0, 2])
        with patch.object(self.release.time, 'sleep'), patch.object(self.release.time, 'monotonic', side_effect=lambda: next(clock)):
            with self.assertRaises(TimeoutError):
                self.release.deploy_service('web', 'a' * 40, timeout=1)

    def test_matching_new_failed_deployment_fails(self):
        responses = iter([[], [{'id': 'new', 'status': 'FAILED', 'meta': {'commitHash': 'a' * 40}}]])
        self.release.deployments = lambda service: next(responses)
        self.release.graphql = lambda *args: {'serviceInstanceDeploy': True}
        with self.assertRaises(RuntimeError):
            self.release.deploy_service('web', 'a' * 40)

    def test_cdn_verification_rejects_mismatched_bytes(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory)
            (path / 'manifest.json').write_text(json.dumps({'app': {'file': 'app.js'}}))
            (path / 'app.js').write_bytes(b'expected')
            self.release.fetch = lambda url: b'stale'
            with self.assertRaises(RuntimeError):
                self.release.verify_assets(path, 'https://cdn.example')

    def test_cdn_verifies_referenced_css_and_assets(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory)
            (path / 'manifest.json').write_text(json.dumps({'app': {'file': 'app.js', 'css': ['app.css'], 'assets': ['font.woff2']}}))
            for name in ['app.js', 'app.css', 'font.woff2']:
                (path / name).write_bytes(name.encode())
            fetched = []
            def fetch(url):
                fetched.append(url)
                return (path / url.rsplit('/', 1)[1]).read_bytes()
            self.release.fetch = fetch
            self.release.verify_assets(path, 'https://cdn.example')
            self.assertEqual(len(fetched), 4)


class SchedulerStartupTests(unittest.TestCase):
    def test_runtime_config_is_refreshed_before_any_tick(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory)
            fake_php = path / 'php'
            fake_php.write_text('#!/bin/sh\necho "$*" >> "$CALL_LOG"\n[ "$2" = "config:cache" ] && exit 0\nexit 42\n')
            fake_php.chmod(0o755)
            log = path / 'calls'
            result = subprocess.run(['bash', str(SCRIPT.with_name('run-scheduler.sh'))], env={**os.environ, 'PATH': str(path) + ':' + os.environ['PATH'], 'CALL_LOG': str(log)}, capture_output=True)
            self.assertEqual(result.returncode, 42)
            self.assertEqual(log.read_text().splitlines(), ['artisan config:cache --no-interaction', 'artisan operations:scheduler-tick --no-interaction'])

    def test_failed_config_refresh_never_runs_tasks(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory)
            fake_php = path / 'php'
            fake_php.write_text('#!/bin/sh\necho "$*" >> "$CALL_LOG"\nexit 42\n')
            fake_php.chmod(0o755)
            log = path / 'calls'
            subprocess.run(['bash', str(SCRIPT.with_name('run-scheduler.sh'))], env={**os.environ, 'PATH': str(path) + ':' + os.environ['PATH'], 'CALL_LOG': str(log)}, capture_output=True)
            self.assertEqual(log.read_text().splitlines(), ['artisan config:cache --no-interaction'])


if __name__ == '__main__':
    unittest.main()
