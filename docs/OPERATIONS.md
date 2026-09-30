# Operational checks

`/up` is Laravel's basic liveness endpoint. Railway web deployments use `/health`
for readiness. A ready response requires a working database, the heartbeat table,
and every file referenced by the local Vite manifest, including lazy page chunks,
CSS and imported assets. A missing schema or asset returns HTTP 503. Probes do not
start sessions, create cookies or expose database errors. PostgreSQL probes use a
separate connection with a three-second connect timeout and a two-second SQL
statement timeout; they do not change application connection settings.

`/health/scheduler` checks the shared database and the scheduler's last completed
tick. A missing heartbeat or one older than five minutes returns HTTP 503. The
payload includes the scheduler's own release and deployment IDs. Web readiness
does not depend on scheduler freshness, so either service can roll out first.

The scheduler runs `operations:scheduler-tick` once per minute. A heartbeat is
written only after `schedule:run` and all executed tasks finish successfully.
Exceptions and nonzero task exit codes leave the previous heartbeat intact and
stop the runner so Railway's existing failure restart policy can take effect.
The runner waits up to five minutes for the database and heartbeat migration at
startup, before executing any tasks. Run migrations through web's configured
preDeploy command; this startup grace covers a concurrent scheduler rollout.
A tick longer than a minute starts the next tick at the next minute boundary
instead of overlapping the previous tick.

A stale heartbeat is an alert, not proof the scheduler process has stopped.
Newsletter delivery can take more than five minutes. The monitor never restarts
a Railway `SUCCESS` scheduler based on stale heartbeat alone.

## Release identity

Responses prefer `RAILWAY_GIT_COMMIT_SHA` and `RAILWAY_DEPLOYMENT_ID`, supplied by
Railway. `APP_BUILD_VERSION` and `APP_DEPLOYMENT_ID` are fallbacks for deployments
outside Railway. `local` means neither source was supplied; it is not a release
identifier. Read both the web response and scheduler heartbeat when confirming
a rollout. Local manifest readiness does not certify CDN publication; check the
asset-sync workflow and public asset URLs separately.

## Recovery policy

The production monitor checks web and scheduler separately. After three failed
probes it records a separate incident for the affected service. It can request
one restart of that service's latest existing image only when Railway confirms
that deployment crashed or stopped. Database failures and missing web assets
require investigation. A failed latest build never selects an older image.
Existing open incidents suppress repeated recovery attempts.

The monitor never mutates PostgreSQL and never rolls an application back to an
older image. Database recovery requires diagnosis and a separate operator action.

## Pull request checks

`.github/workflows/ci.yml` runs PHP tests, image tests, the production frontend
build, SSR metadata tests and Chromium browser tests. A separate job uses a
fresh PostgreSQL 17 service for real booking/operation concurrency and readiness
timeout tests. No production credentials or databases are used.

The final check is named `Required PR checks` and fails unless both jobs pass.
The workflow creates that check; branch protection must require it before GitHub
will block a merge on failure. Repository branch settings are managed separately.
