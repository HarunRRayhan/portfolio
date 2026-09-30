#!/usr/bin/env bash
set -Eeuo pipefail
# shellcheck source=scripts/monitor-recovery.sh
source "$(dirname "${BASH_SOURCE[0]}")/monitor-recovery.sh"

case "${MONITOR_COMPONENT:-}" in
  web) health_path='/health'; incident_title='[monitor] harun.dev outage'; service_id="$RAILWAY_WEB_SERVICE_ID" ;;
  scheduler) health_path='/health/scheduler'; incident_title='[monitor] harun.dev scheduler outage'; service_id="$RAILWAY_SCHEDULER_SERVICE_ID" ;;
  *) echo 'Unsupported monitor component' >&2; exit 1 ;;
esac
graphql_url='https://backboard.railway.com/graphql/v2'
health_body='{}'
health_detail=''
health_check() {
  local response_file code
  response_file="$(mktemp)"
  code="$(curl -sS --max-time 20 -H 'Cache-Control: no-cache' -o "$response_file" -w '%{http_code}' \
    "https://harun.dev${health_path}?monitor=${GITHUB_RUN_ID}-${GITHUB_RUN_ATTEMPT}-${RANDOM}" || true)"
  health_body="$(cat "$response_file")"
  rm -f "$response_file"
  if ! jq -e 'type == "object"' >/dev/null 2>&1 <<< "$health_body"; then health_body='{}'; fi
  health_detail="HTTP ${code:-000}, checks=$(jq -c '.checks // {}' <<< "$health_body")"
  [[ "$code" == '200' ]] && jq -e '.status == "ok"' >/dev/null <<< "$health_body"
}
find_open_incident() {
  gh api --paginate "repos/${GITHUB_REPOSITORY}/issues?state=open&per_page=100" \
    | jq -r --arg title "$incident_title" '.[] | select(.pull_request == null and .title == $title) | .number' | head -n 1
}
close_incident() {
  gh issue comment "$1" --repo "$GITHUB_REPOSITORY" --body "${MONITOR_COMPONENT} recovered at $(date -u). ${health_detail}."
  gh issue close "$1" --repo "$GITHUB_REPOSITORY" --reason completed
}
for attempt in 1 2 3; do
  if health_check; then
    issue_number="$(find_open_incident || true)"
    [[ -z "$issue_number" ]] || close_incident "$issue_number"
    echo "${MONITOR_COMPONENT} healthy: ${health_detail}"
    exit 0
  fi
  echo "Readiness ${attempt}/3 failed: ${health_detail}"
  [[ "$attempt" -eq 3 ]] || sleep 20
done

incident_number="$(find_open_incident || true)"
railway_error=''
deployments='{}'
# GraphQL variables are literal; jq supplies their values separately.
# shellcheck disable=SC2016
query='query($environmentId:String!, $serviceId:String!) { deployments(input:{environmentId:$environmentId,serviceId:$serviceId,includeDeleted:true},first:20) { edges { node { id status createdAt deploymentStopped canRedeploy } } } }'
if [[ -z "${RAILWAY_TOKEN:-}" || -z "${RAILWAY_PROJECT_ID:-}" ]]; then
  railway_error='Railway project credentials are not configured.'
else
  payload="$(jq -cn --arg query "$query" --arg environment "$RAILWAY_ENVIRONMENT_ID" --arg service "$service_id" \
    '{query:$query,variables:{environmentId:$environment,serviceId:$service}}')"
  response="$(curl -sS --max-time 30 -H "Project-Access-Token: ${RAILWAY_TOKEN}" -H 'Content-Type: application/json' \
    --data "$payload" "$graphql_url" || true)"
  if ! jq -e '(.errors // [] | length) == 0 and (.data.deployments.edges | type) == "array"' >/dev/null 2>&1 <<< "$response"; then
    railway_error='Railway deployment state could not be confirmed; manual investigation required.'
  else
    deployments="$(jq -c --arg component "$MONITOR_COMPONENT" '{($component):.data.deployments}' <<< "$response")"
  fi
fi
body_file="$(mktemp)"
trap 'rm -f "$body_file"' EXIT
cat > "$body_file" <<EOF_BODY
${MONITOR_COMPONENT} readiness failed three consecutive checks at $(date -u).

- Health: ${health_detail}
- Workflow: https://github.com/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}
- Deployment state: ${deployments}
- Query result: ${railway_error:-confirmed}

Recovery can restart only this service's latest image when Railway confirms it
crashed or stopped. Database or missing-asset failures require investigation.
Stale scheduler heartbeats alert only: long scheduled jobs may still be running.
PostgreSQL is never automatically changed, and older application images are never rolled back.
EOF_BODY
if [[ -n "$incident_number" ]]; then
  echo "Existing incident #${incident_number}; no repeated automatic recovery."
  exit 1
fi
incident_url="$(gh issue create --repo "$GITHUB_REPOSITORY" --title "$incident_title" --body-file "$body_file")"
incident_number="${incident_url##*/}"
redeploy_id=''
if [[ -z "$railway_error" ]]; then
  redeploy_id="$(select_redeploy_id "$MONITOR_COMPONENT" "$deployments" "$health_body")"
fi
if [[ -z "$redeploy_id" ]]; then
  gh issue comment "$incident_number" --repo "$GITHUB_REPOSITORY" --body 'No safe automatic recovery candidate; investigate the recorded dependency and deployment state.'
  exit 1
fi
# shellcheck disable=SC2016
mutation='mutation($id:String!){deploymentRedeploy(id:$id,usePreviousImageTag:true){id status}}'
payload="$(jq -cn --arg query "$mutation" --arg id "$redeploy_id" '{query:$query,variables:{id:$id}}')"
response="$(curl -sS --max-time 30 -H "Project-Access-Token: ${RAILWAY_TOKEN}" -H 'Content-Type: application/json' \
  --data "$payload" "$graphql_url" || true)"
if ! jq -e '.data.deploymentRedeploy.id != null' >/dev/null 2>&1 <<< "$response"; then
  gh issue comment "$incident_number" --repo "$GITHUB_REPOSITORY" --body "Current-image restart request failed for ${MONITOR_COMPONENT}; manual investigation required."
  exit 1
fi
gh issue comment "$incident_number" --repo "$GITHUB_REPOSITORY" --body "Requested one current-image restart of ${MONITOR_COMPONENT} deployment ${redeploy_id}."
for attempt in 1 2 3 4 5; do
  sleep 30
  if health_check; then close_incident "$incident_number"; exit 0; fi
done
echo 'Recovery requested; readiness remains unhealthy.' >&2
exit 1
