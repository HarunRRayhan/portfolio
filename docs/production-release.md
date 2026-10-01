# Production release

The `Build and Sync Assets to R2` workflow publishes the frontend before it activates the application. It runs only for `main`, including manual dispatches. Its concurrency group lets the current release finish before another starts.

The asset job builds and uploads the files, then compares the public CDN bytes with the local manifest, its referenced assets, and every generated blog cover. Each failed fetch or mismatch gets at most three attempts. An upload failure or unresolved mismatch blocks activation. Older hashed files remain available under the existing retention policy.

The activation job waits for the latest `ci.yml` push or manual run for the exact commit to finish successfully. Failed, cancelled, skipped, and timed-out checks block deployment. It then calls Railway with `commitSha` and `latestCommit:false`, waits for a new successful web deployment carrying that SHA, and repeats for the scheduler. An existing deployment cannot satisfy this check. If that call's reply is missing or unreadable, the job keeps the deployment IDs captured before the call and polls for a new deployment of that SHA. The mutation is sent once. A GraphQL rejection or an HTTP error status stops the job immediately.

## One-time Railway transition

Before merging this workflow, configure the GitHub `production` environment:

- Secret: `RAILWAY_PROJECT_TOKEN`.
- Variables: `RAILWAY_ENVIRONMENT_ID`, `RAILWAY_WEB_SERVICE_ID`, `RAILWAY_SCHEDULER_SERVICE_ID`.

Disable native GitHub autodeploy for both services while keeping their repository source connected. Otherwise the old push trigger can still activate the app before CDN publication. Use `Project-Access-Token` authentication for these API calls. Save each trigger's complete settings before removal:

```graphql
query($environment:String!,$project:String!,$service:String!) {
  deploymentTriggers(environmentId:$environment,projectId:$project,serviceId:$service,first:100) {
    edges { node { id branch repository checkSuites serviceId environmentId } }
  }
}
```

Also save `serviceInstance { rootDirectory railwayConfigFile source { repo } }` in the rollback record. Remove the matching production trigger with `deploymentTriggerDelete(id:$id)`. Query again to confirm there are no triggers for either production service. Also read `serviceInstance(environmentId:$environment,serviceId:$service) { source { repo } }` to confirm the source remains connected. Don't remove either service or change the production database.

Railway's [Wait for CI](https://docs.railway.com/deployments/github-autodeploys) isn't the release gate: Railway can ignore a cancelled workflow when another workflow on the commit succeeded. The explicit dependent job requires successful asset verification and CI.

## Verification and recovery

Run `python3 -m unittest discover -s tests/operations -p 'test_*.py'` for release ordering, failure handling, CDN verification, and scheduler startup checks. Run the relevant PHPUnit suite and build before shipping.

After release, inspect the web and scheduler deployment IDs and exact commit independently. Verify `/health`, `/health/scheduler`, the scheduler heartbeat, live HTML, and CDN assets. Railway's origin and GitHub's CDN build can have different valid bundle hashes; inspect both manifests.

If that poll expires without a confirmed deployment, inspect Railway before retrying. Startup checks refuse a new release while either service has an unfinished deployment. Read requests get three attempts; deployment mutations get one. A retry of the workflow creates fresh deployments. If web succeeds but scheduler fails, the release remains partial; repair and redeploy the scheduler at the same SHA after checking its logs. A failed activation doesn't roll back uploaded assets or a successful web deployment. Don't restore native push triggers unless you're intentionally abandoning the gate.

The normal web pre-deploy command still owns migrations in `railway.web.json`. This release script doesn't execute SQL or payment checks. The scheduler refreshes only Laravel's configuration cache at container startup, so runtime deployment identity replaces the build-time `local` value without clearing shared cache locks or application data.
