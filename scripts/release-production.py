#!/usr/bin/env python3
"""Verify published assets, then deploy an exact revision through Railway."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import time
import urllib.request


def fetch(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'harundev-release'}), timeout=45) as response:
        return response.read()


def verify_assets(build, base, covers=None, attempts=1):
    manifest = json.loads((build / 'manifest.json').read_text())
    files = {'manifest.json'}
    for entry in manifest.values():
        files.add(entry['file'])
        files.update(entry.get('css', []))
        files.update(entry.get('assets', []))
    targets = [(build / name, '/build/' + name) for name in sorted(files)]
    if covers is not None:
        if not covers.is_dir() or not any(covers.iterdir()):
            raise RuntimeError('Generated blog covers are missing')
        targets.extend((path, '/blog-assets/card-variants/' + path.relative_to(covers).as_posix())
                       for path in sorted(covers.rglob('*')) if path.is_file())
    for name in files:
        if '..' in Path(name).parts or name.startswith('/'):
            raise ValueError('Unsafe manifest path')
    for path, url in targets:
        expected = hashlib.sha256(path.read_bytes()).digest()
        for attempt in range(attempts):
            try:
                if expected != hashlib.sha256(fetch(base.rstrip('/') + url)).digest():
                    raise RuntimeError(f'CDN content mismatch: {url}')
                break
            except (OSError, RuntimeError):
                if attempt + 1 == attempts:
                    raise
                time.sleep(10)
    print(f'CDN verified: {len(targets)} manifest, asset and cover files', flush=True)


def github_runs(sha):
    repository = os.environ['GITHUB_REPOSITORY']
    request = urllib.request.Request(
        f'https://api.github.com/repos/{repository}/actions/workflows/ci.yml/runs?head_sha={sha}&per_page=100',
        headers={'Authorization': 'Bearer ' + os.environ['GITHUB_TOKEN'],
                 'Accept': 'application/vnd.github+json', 'User-Agent': 'harundev-release'},
    )
    with urllib.request.urlopen(request, timeout=45) as response:
        return json.load(response)['workflow_runs']


def wait_ci(sha, timeout=1800):
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        runs = [run for run in github_runs(sha) if run['head_sha'] == sha
                and run['event'] in {'push', 'workflow_dispatch'}]
        if runs:
            latest = max(runs, key=lambda run: run['run_number'])
            if latest['status'] == 'completed':
                if latest['conclusion'] != 'success':
                    raise RuntimeError('Required PR checks workflow did not succeed for release commit')
                print(f'Required PR checks passed for {sha}', flush=True)
                return
        time.sleep(10)
    raise TimeoutError('Required PR checks not confirmed for release commit')


def graphql(query, variables):
    request = urllib.request.Request(
        'https://backboard.railway.com/graphql/v2',
        data=json.dumps({'query': query, 'variables': variables}).encode(),
        headers={'Content-Type': 'application/json', 'User-Agent': 'harundev-release',
                 'Project-Access-Token': os.environ['RAILWAY_PROJECT_TOKEN']},
    )
    attempts = 3 if query.lstrip().startswith('query') else 1
    for attempt in range(attempts):
        try:
            with urllib.request.urlopen(request, timeout=45) as response:
                payload = json.load(response)
            break
        except OSError:
            if attempt + 1 == attempts:
                raise RuntimeError('Railway request unavailable; reconcile deployment before retrying') from None
            time.sleep(10)
    if payload.get('errors'):
        # Do not log API response bodies; they can contain configuration values.
        raise RuntimeError('Railway GraphQL request failed; inspect Railway separately')
    return payload['data']


def deployments(service):
    data = graphql('query($environment:String!,$service:String!){deployments(input:{environmentId:$environment,serviceId:$service},first:20){edges{node{id status meta}}}}',
                   {'environment': os.environ['RAILWAY_ENVIRONMENT_ID'], 'service': service})
    return [edge['node'] for edge in data['deployments']['edges']]


def ensure_idle(service, records=None):
    if records is None:
        records = deployments(service)
    settled = {'SUCCESS', 'FAILED', 'CRASHED', 'REMOVED', 'SKIPPED', 'CANCELED', 'CANCELLED', 'SLEEPING'}
    for deployment in records:
        if deployment['status'] not in settled:
            raise RuntimeError(f'Service {service} has an unfinished deployment; reconcile before releasing')


def deploy_service(service, sha, timeout=1200):
    records = deployments(service)
    ensure_idle(service, records)
    previous = {deployment['id'] for deployment in records}
    result = graphql('mutation($environment:String!,$service:String!,$sha:String!){serviceInstanceDeploy(environmentId:$environment,serviceId:$service,commitSha:$sha,latestCommit:false)}',
                     {'environment': os.environ['RAILWAY_ENVIRONMENT_ID'], 'service': service, 'sha': sha})
    if result.get('serviceInstanceDeploy') is not True:
        raise RuntimeError('Railway did not accept deployment')
    # Never blindly retry this mutation after an uncertain response.
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        for deployment in deployments(service):
            meta = deployment.get('meta') or {}
            if isinstance(meta, str):
                meta = json.loads(meta)
            if deployment['id'] in previous or meta.get('commitHash') != sha:
                continue
            status = deployment['status']
            if status == 'SUCCESS':
                print(f'Service {service}: {deployment["id"]} SUCCESS at {sha}', flush=True)
                return deployment['id']
            if status in {'FAILED', 'CRASHED', 'REMOVED', 'SKIPPED', 'CANCELED', 'CANCELLED'}:
                raise RuntimeError(f'Deployment {deployment["id"]} ended with {status}')
        time.sleep(10)
    raise TimeoutError('Deployment not confirmed; reconcile Railway before retrying')


def release(sha, web, scheduler):
    if not re.fullmatch(r'[0-9a-f]{40}', sha):
        raise ValueError('Release requires a full commit SHA')
    deploy_service(web, sha)
    deploy_service(scheduler, sha)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest='command', required=True)
    assets = sub.add_parser('verify-assets')
    assets.add_argument('--build', type=Path, default=Path('public/build'))
    assets.add_argument('--base', default='https://cdn.harun.dev')
    assets.add_argument('--covers', type=Path, default=Path('public/blog-assets/card-variants'))
    checks = sub.add_parser('wait-ci')
    checks.add_argument('--sha', required=True)
    deploy = sub.add_parser('deploy')
    deploy.add_argument('--sha', required=True)
    args = parser.parse_args()
    if args.command == 'verify-assets':
        verify_assets(args.build, args.base, args.covers, attempts=3)
    elif args.command == 'wait-ci':
        wait_ci(args.sha)
    else:
        for key in ('RAILWAY_PROJECT_TOKEN', 'RAILWAY_ENVIRONMENT_ID', 'RAILWAY_WEB_SERVICE_ID', 'RAILWAY_SCHEDULER_SERVICE_ID'):
            if not os.environ.get(key):
                raise ValueError(f'Missing {key}')
        ensure_idle(os.environ['RAILWAY_WEB_SERVICE_ID'])
        ensure_idle(os.environ['RAILWAY_SCHEDULER_SERVICE_ID'])
        release(args.sha, os.environ['RAILWAY_WEB_SERVICE_ID'], os.environ['RAILWAY_SCHEDULER_SERVICE_ID'])


if __name__ == '__main__':
    main()
