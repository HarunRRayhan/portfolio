#!/usr/bin/env bash

# Print the one current application image eligible for recovery. PostgreSQL is
# deliberately excluded, even if callers accidentally pass its component name.
select_redeploy_id() {
  local component="$1" deployments="$2" health="${3:-}"
  [[ -n "$health" ]] || health='{}'
  case "$component" in web|scheduler) ;; *) return 0 ;; esac
  jq -r --arg component "$component" --argjson health "$health" '
    if $health.checks.database == false or ($component == "web" and $health.checks.assets == false) then empty
    else
      (.[$component].edges // []) | map(.node) | sort_by(.createdAt) | reverse | .[0]
      | select(.canRedeploy == true)
      | select(.status == "CRASHED" or (.status == "REMOVED" and .deploymentStopped == true)
        or (.status == "SUCCESS" and .deploymentStopped == true))
      | .id
    end
  ' <<< "$deployments"
}
