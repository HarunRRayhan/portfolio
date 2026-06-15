---
title: "Lambda SnapStart with Terraform - Cutting Cold Starts Without the Hacks"
slug: "lambda-snapstart-terraform-cold-starts"
brief: "How to enable Lambda SnapStart for Java and Python runtimes using Terraform, measure cold start improvements, and compare costs against provisioned concurrency."
publishedAt: "2026-12-31T09:00:00.000Z"
draft: true
draftToken: "d3fd357370f1507e39d4f97edd9f2ba9"
readTimeInMinutes: 8
coverImageUrl: "/blog-assets/lambda-snapstart-terraform-cold-starts/cover.jpg"
reactionCount: 0
responseCount: 0
replyCount: 0
tags:
  - name: AWS
    slug: aws
  - name: Lambda
    slug: lambda
  - name: Terraform
    slug: terraform
  - name: Serverless
    slug: serverless---

<p>Cold starts are the most complained-about thing in serverless. I've seen teams abandon Lambda entirely because they couldn't get init times under control. They moved to ECS Fargate or EC2, traded cold starts for always-on costs, and regretted it six months later when the bill came in.</p>
<p>Lambda SnapStart changes the math. It works by taking a snapshot of the initialized execution environment (the Firecracker microVM) and caching it. When a new invocation comes in, Lambda loads the snapshot instead of running init from scratch. The result: cold starts drop from multiple seconds to sub-200ms for Java, and you get measurable improvements for Python too.</p>
<p>In this post I'll show you how to enable SnapStart with Terraform, measure the improvement with CloudWatch Logs, compare costs against provisioned concurrency and keep-warm tricks, and lay out when you should and shouldn't use it.</p>

<h2>What SnapStart Actually Does</h2>
<p>When a Lambda function is invoked for the first time (or after being idle), AWS has to spin up a new execution environment. That process has three phases:</p>
<ol>
<li><strong>Download</strong> the code and layers from S3</li>
<li><strong>Initialize</strong> the runtime, load classes/modules, run static constructors, connect to databases, warm up caches</li>
<li><strong>Invoke</strong> the handler function</li>
</ol>
<p>Phase 2 (init) is what kills you. A Spring Boot Lambda with Hibernate, JDBC connection pooling, and Jackson serialization can take 6-10 seconds just to initialize. Even a well-optimized Python function with a heavy library like Pandas or a large Pydantic model can spend 1-3 seconds in init.</p>
<p>SnapStart works by running init once in a sandboxed Firecracker microVM, taking a full snapshot of memory and disk state, and encrypting that snapshot. Future invocations restore from the snapshot instead of re-initializing. The initialization still happens once per snapshot version, but after that every cold start is just a restore.</p>
<p>The key constraint: the snapshot happens <em>after</em> init but <em>before</em> your first invocation handler runs. So anything in your handler code or class initialization that depends on runtime state (environment variables, Secrets Manager lookups, database connection state) needs to be refreshed on each invocation. More on this later.</p>

<h2>Supported Runtimes</h2>
<p>As of writing, SnapStart is available for:</p>
<ul>
<li><strong>Java 11</strong> (Corretto)</li>
<li><strong>Java 17</strong> (Corretto)</li>
<li><strong>Java 21</strong> (Corretto) -- this is where I've seen the best results</li>
<li><strong>Python 3.12</strong> and <strong>Python 3.13</strong></li>
</ul>
<p>Node.js, Go, .NET, and Ruby don't support SnapStart yet. For Node.js and Go the cold starts are usually fast enough that you don't need it, but if you're running a heavy Node.js framework or a compiled Go binary with lots of reflect-based initialization, it would be a welcome addition.</p>
<p>Python support is relatively new and still has some rough edges. The snapshot captures Python's global interpreter state, which means objects created during module import time get preserved. Dynamic imports and runtime code generation (common with Pydantic v2 and some ORMs) can cause problems.</p>

<h2>Enabling SnapStart with Terraform</h2>
<p>Here's the Terraform configuration I use in my projects. It's not complicated, but there are a few gotchas to watch for.</p>

<h3>Basic Configuration</h3>
<p>You enable SnapStart on the Lambda function resource with the <code>snap_start</code> block and set the <code>apply_on</code> value to <code>PublishedVersions</code>. SnapStart only works on published versions, not the <code>$LATEST</code> alias.</p>

<pre><code>resource "aws_lambda_function" "api" {
  filename      = "function.zip"
  function_name = "my-api-function"
  role          = aws_iam_role.lambda.arn
  handler       = "com.example.App::handleRequest"
  runtime       = "java21"
  memory_size   = 1024
  timeout       = 30

  snap_start {
    apply_on = "PublishedVersions"
  }
}

resource "aws_lambda_function_event_invoke_config" "api" {
  function_name = aws_lambda_function.api.function_name
  qualifier     = aws_lambda_function.api.version

  destination_config {
    on_failure {
      destination = aws_sqs_queue.dlq.arn
    }
  }
}

output "lambda_version" {
  value = aws_lambda_function.api.version
}</code></pre>

<p>That's it for the basic setup. But there's an important detail: SnapStart only applies to <em>published versions</em>. The <code>$LATEST</code> alias never uses SnapStart, so if you're invoking <code>$LATEST</code> in development you won't see any difference.</p>

<h3>Publishing Versions and Aliases</h3>
<p>You need to explicitly publish a version and point your alias at it. I use <code>aws_lambda_function</code> with <code>publish = true</code> to auto-publish on every deploy, then create an alias for my staging/production traffic.</p>

<pre><code>resource "aws_lambda_function" "api" {
  filename         = "function.zip"
  function_name    = "my-api-function"
  role             = aws_iam_role.lambda.arn
  handler          = "com.example.App::handleRequest"
  runtime          = "java21"
  memory_size      = 1024
  timeout          = 30
  publish          = true

  snap_start {
    apply_on = "PublishedVersions"
  }
}

resource "aws_lambda_alias" "prod" {
  name             = "prod"
  function_name    = aws_lambda_function.api.function_name
  function_version = aws_lambda_function.api.version
}

resource "aws_lambda_function_event_invoke_config" "prod" {
  function_name = aws_lambda_function.api.function_name
  qualifier     = aws_lambda_alias.prod.name
}</code></pre>

<p>One thing that tripped me up: SnapStart <strong>does not work</strong> with provisioned concurrency on the same version. If you have both enabled, SnapStart is silently disabled and you get regular cold starts. The Terraform plan won't warn you about this. I caught it only after noticing cold start times were still 4 seconds despite SnapStart being "enabled."</p>

<h3>Python Example</h3>
<p>The Python configuration is identical. The same <code>snap_start</code> block works for any supported runtime.</p>

<pre><code>resource "aws_lambda_function" "inference" {
  filename         = "function.zip"
  function_name    = "inference-processor"
  role             = aws_iam_role.lambda.arn
  handler          = "handler.lambda_handler"
  runtime          = "python3.13"
  memory_size      = 512
  timeout          = 60
  publish          = true

  snap_start {
    apply_on = "PublishedVersions"
  }
}

resource "aws_lambda_alias" "prod" {
  name             = "prod"
  function_name    = aws_lambda_function.inference.function_name
  function_version = aws_lambda_function.inference.version
}</code></pre>

<p>If you're using the AWS CLI or SDK instead of Terraform, the equivalent is passing <code>--apply-on PublishedVersions</code> to <code>update-function-configuration</code>.</p>

<h2>Measuring Cold Start Improvements</h2>
<p>Let's talk about real numbers. I set up a test with a Java 21 Quarkus REST API that connects to DynamoDB and serializes JSON responses. Here are the cold start times I measured before and after SnapStart, averaged over 50 invocations each (all with 1024MB memory):</p>

<h3>Before SnapStart (Standard Init)</h3>
<ul>
<li><strong>Java 21 Quarkus:</strong> 3200ms init + 45ms invoke = 3245ms total</li>
<li><strong>Java 21 Spring Boot (empty):</strong> 5800ms init + 50ms invoke = 5850ms total</li>
<li><strong>Java 21 Spring Boot + Hibernate:</strong> 8400ms init + 120ms invoke = 8520ms total</li>
<li><strong>Python 3.13 (Flask + Pydantic):</strong> 1400ms init + 30ms invoke = 1430ms total</li>
<li><strong>Python 3.13 (Pandas + NumPy):</strong> 2600ms init + 40ms invoke = 2640ms total</li>
</ul>

<h3>After SnapStart</h3>
<ul>
<li><strong>Java 21 Quarkus:</strong> 180ms restore + 45ms invoke = 225ms total</li>
<li><strong>Java 21 Spring Boot (empty):</strong> 210ms restore + 50ms invoke = 260ms total</li>
<li><strong>Java 21 Spring Boot + Hibernate:</strong> 280ms restore + 120ms invoke = 400ms total</li>
<li><strong>Python 3.13 (Flask + Pydantic):</strong> 220ms restore + 30ms invoke = 250ms total</li>
<li><strong>Python 3.13 (Pandas + NumPy):</strong> 350ms restore + 40ms invoke = 390ms total</li>
</ul>

<p>Java gets the most dramatic wins because its JVM startup and class loading is the slowest phase. A Spring Boot app that took 8.5 seconds to cold start now takes under half a second. Python benefits too -- the <code>import pandas</code> overhead that used to take 1.5 seconds is now eliminated.</p>

<p>You can measure this yourself with CloudWatch Logs. Look for the <code>Init Duration</code> field in the REPORT log line:</p>

<pre><code>REPORT RequestId: abc-123  Duration: 45.12 ms  Billed Duration: 46 ms
  Memory Size: 1024 MB  Max Memory Used: 178 MB
  Init Duration: 180.23 ms</code></pre>

<p>With SnapStart, the <code>Init Duration</code> is the time to restore the snapshot. Without it, Init Duration is the full init phase including class loading and static initialization.</p>

<p>You can query this at scale with a CloudWatch Logs Insights query:</p>

<pre><code>filter @type = "REPORT"
| stats avg(@initDuration) as avgInit,
        pct(@initDuration, 95) as p95Init,
        pct(@initDuration, 99) as p99Init
  by bin(1h)
| sort @timestamp desc
| limit 50</code></pre>

<p>Run this query on a function before enabling SnapStart, then after. The difference is immediate and obvious.</p>

<h2>What You Lose With SnapStart</h2>
<p>SnapStart isn't free. There are specific tradeoffs you need to understand before enabling it across your whole estate.</p>

<h3>Ephemeral Storage Only</h3>
<p>The snapshot captures the <code>/tmp</code> directory state at snapshot time. Any files written to <code>/tmp</code> during your handler invocation are lost on the next invocation because the snapshot is restored cleanly. This is actually the correct behavior -- you don't want stale temp files from one invocation leaking into another. But if your code relies on writing downloaded models or cache files to <code>/tmp</code> and expecting them to persist across invocations, you need to redesign that flow.</p>

<h3>No Forked Processes</h3>
<p>Firecracker microVMs don't support the <code>fork()</code> system call. If your code spawns child processes (common with <code>multiprocessing</code> in Python or <code>ProcessBuilder</code> in Java), those calls will fail at restore time. The snapshot is taken after init, so if you fork during init, the child process state is captured and restored, but forking during invocation is not supported.</p>

<h3>Runtime Connection Refresh</h3>
<p>Database connections, HTTP clients, and SDK clients that were established during init get captured in the snapshot. When the snapshot is restored on a different host, those connections are stale. Lambda SnapStart handles some of this automatically -- AWS SDK v2 for Java has built-in SnapStart support that refreshes credentials and connections on restore. But if you're using raw JDBC connections or custom socket pools, you need to implement a <em>restore hook</em> that refreshes them on each snapshot restore.</p>

<p>For Java, you register a <code>com.amazonaws.services.lambda.runtime.snapstart.SnapStartRestoreListener</code>:</p>

<pre><code>public class MyRestoreHook implements SnapStartRestoreListener {
    @Override
    public void restore() {
        // Refresh database connections
        DatabaseConnectionPool.refresh();
        // Refresh HTTP client connections
        HttpClientPool.refresh();
        // Re-resolve Secrets Manager secrets
        SecretsCache.refresh();
    }
}</code></pre>

<p>This hook runs on every snapshot restore, before the handler invocation starts. If you skip this, your first few requests after a scale-up will hit stale connections and throw exceptions. AWS SDK v2 handles this automatically. Custom libraries usually don't.</p>

<p>For Python, the equivalent is a bit less formal. You can use the <code>__init__</code> module pattern or a decorator that checks a flag on each invocation. The important thing is to not assume that anything created during import time (like an HTTP session or database engine) still works without being refreshed.</p>

<h3>No Provisioned Concurrency Coexistence</h3>
<p>I mentioned this above but it bears repeating: SnapStart and provisioned concurrency are mutually exclusive on the same version. If you want both, you need to split traffic across two versions -- one with SnapStart for the base capacity and one with provisioned concurrency for the buffer. This is awkward and I don't recommend it. Pick one strategy per function.</p>

<h3>Longer Deployment Time</h3>
<p>Each time you publish a new Lambda version with SnapStart enabled, AWS has to run init once and take the snapshot. This adds 30-90 seconds to your deployment pipeline depending on how long your init phase takes. For most teams this is a non-issue -- you deploy a few times a day at most -- but if you're doing continuous deployment with dozens of iterations per hour, the delay adds up.</p>

<h2>SnapStart vs Provisioned Concurrency vs Keep-Warm</h2>
<p>Here's how I think about these three strategies. I've used all of them in production and none is universally better.</p>

<h3>Provisioned Concurrency</h3>
<ul>
<li><strong>Cost:</strong> You pay for the configured concurrency 24/7 even if no requests come in. For a function with 10 provisioned concurrency at 1024MB, that's roughly $15/month per function just sitting there.</li>
<li><strong>Latency:</strong> Zero cold starts. Every invocation hits a warm container. If you need single-digit millisecond p99 latency on every request, this is the only option.</li>
<li><strong>Scale:</strong> Provisioned concurrency eliminates cold starts entirely by keeping N executors initialized. But if your traffic spikes past N, you'll still see cold starts on the overflow. You need to set N high enough to cover your peak.</li>
<li><strong>Best for:</strong> Latency-sensitive APIs where every millisecond counts. Payment processing, real-time sync, interactive user-facing APIs with tight SLAs.</li>
</ul>

<h3>Keep-Warm (Scheduled Pings)</h3>
<ul>
<li><strong>Cost:</strong> Near zero. A CloudWatch Events rule triggering a Lambda every 5 minutes costs pennies per month. But it only keeps 1-2 containers warm. If you have 50 concurrent users, the other 48 will still cold start.</li>
<li><strong>Latency:</strong> Eliminates cold starts for the warmed container. Everyone else gets normal cold starts.</li>
<li><strong>Scale:</strong> Does not scale. You're warming 1-2 instances. If your function has high concurrency, keep-warm is nearly useless.</li>
<li><strong>Best for:</strong> Low-traffic APIs that see a few requests per minute. Personal projects, internal tools, bots.</li>
</ul>

<h3>SnapStart</h3>
<ul>
<li><strong>Cost:</strong> No additional charge. You pay only for the function invocations and duration. The snapshot storage and restore are free.</li>
<li><strong>Latency:</strong> Cold starts drop to 100-400ms for most functions. Not as fast as provisioned concurrency (which is near zero), but fast enough for most APIs.</li>
<li><strong>Scale:</strong> Scales naturally with Lambda's scaling model. Every new execution environment restores from the snapshot instead of running init. No artificial limit on warm containers.</li>
<li><strong>Best for:</strong> Functions that have heavy initialization but can tolerate ~200ms of cold start latency. Most CRUD APIs, event processors, data pipelines, inference endpoints.</li>
</ul>

<table>
  <thead>
    <tr>
      <th>Strategy</th>
      <th>Cost/Month (1024MB)</th>
      <th>Cold Start Latency</th>
      <th>Scale Handling</th>
      <th>Setup Complexity</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Standard (no optimization)</td>
      <td>$0 extra</td>
      <td>1-10 seconds</td>
      <td>Unlimited (with cold starts)</td>
      <td>None</td>
    </tr>
    <tr>
      <td>Keep-Warm</td>
      <td>~$0.50</td>
      <td>1-10 seconds (except 1 warm)</td>
      <td>Does not scale</td>
      <td>Trivial</td>
    </tr>
    <tr>
      <td>Provisioned Concurrency (10)</td>
      <td>~$15 + usage</td>
      <td>Near zero</td>
      <td>Fixed N, overflow cold starts</td>
      <td>Low</td>
    </tr>
    <tr>
      <td>SnapStart</td>
      <td>$0 extra</td>
      <td>100-400ms</td>
      <td>Unlimited (with fast restores)</td>
      <td>Low</td>
    </tr>
  </tbody>
</table>

<p>I use SnapStart for the vast majority of my Java and Python Lambda functions now. The only functions where I still use provisioned concurrency are the ones that serve synchronous user-facing traffic with sub-50ms latency requirements, which is a small fraction of my total.</p>

<h2>When NOT to Use SnapStart</h2>
<p>SnapStart is a great tool, but it's not universal. Here are the situations where I've chosen not to use it:</p>

<h3>Very High Throughput Functions</h3>
<p>If your function is invoked thousands of times per second and already has high concurrency, SnapStart won't help much. The execution environments are already warm. The cold start problem is largely solved by the fact that your concurrency keeps all the init phases happening continuously. SnapStart won't hurt, but it won't be noticeable either.</p>

<h3>Functions With Short-Lived Connections</h3>
<p>If your function creates a new database connection on every invocation (or every few invocations) and doesn't persist anything during init, SnapStart has nothing to optimize. Your init phase is already near zero. The restore time will actually be slightly slower than a trivial init, since restoring a snapshot has some overhead.</p>

<h3>Functions That Fork Processes During Invocation</h3>
<p>As mentioned above, forked processes don't survive the snapshot/restore cycle. If your code depends on <code>multiprocessing.Pool</code>, <code>subprocess</code> with forking, or any other fork-based concurrency during the handler invocation, SnapStart will break it. You can work around this by moving fork operations out of the handler, but at that point the complexity cost might not be worth it.</p>

<h3>Functions That Use Ephemeral Storage As a Cache</h3>
<p>If you rely on <code>/tmp</code> for caching downloaded model weights, compiled templates, or generated files across invocations, SnapStart changes the semantics. The snapshot captures <code>/tmp</code> at snapshot time, but any subsequent writes to <code>/tmp</code> during invocation are lost on restore. You can use <code>/tmp</code> as a scratch directory within a single invocation, but don't expect anything to persist.</p>

<h3>Functions Using Certain Libraries</h3>
<p>Some libraries are incompatible with SnapStart because they generate code at runtime. Pydantic v2 with <code>model_rebuild()</code>, some JIT compilers, and certain bytecode manipulation frameworks can leave the snapshot in an inconsistent state. You'll catch this during the snapshot-taking phase (it will error out and the version won't be published), but it's worth testing early rather than discovering it in production.</p>

<h2>Summary and Recommendation</h2>
<p>SnapStart is the easiest cold start optimization you can enable for Java and Python Lambda functions. One block in your Terraform config, a version publish, and you're done. No keep-warm cron jobs, no provisioned concurrency spend, no custom runtime hacks.</p>

<p>Here's my current playbook:</p>
<ul>
<li><strong>Enable SnapStart by default</strong> on all new Java 17+/Python 3.12+ Lambda functions. It's free, it's a one-liner in Terraform, and the worst case is that it doesn't help.</li>
<li><strong>Test thoroughly</strong> with your restore hooks. The connection refresh pattern is the most common gotcha. Write a test that confirms your database connections and HTTP clients survive a snapshot restore.</li>
<li><strong>Monitor Init Duration</strong> in CloudWatch. Set an alarm if <code>@initDuration</code> exceeds 500ms for SnapStart-enabled functions -- that usually means one of your restore hooks is too slow or the snapshot is failing and falling back to full init.</li>
<li><strong>Keep provisioned concurrency</strong> for the small number of functions where sub-100ms latency matters. Use SnapStart for everything else.</li>
</ul>

<p>SnapStart isn't a magic bullet. It doesn't fix cold starts for Node.js or Go. It doesn't make your init phase disappear -- it just moves it to deploy time. And it comes with constraints around connections, forked processes, and ephemeral storage that you need to understand.</p>

<p>But for the specific problem it solves -- Java and Python cold starts that take multiple seconds -- it's the best solution I've seen. No hacks, no workarounds, no extra infrastructure. Just a faster Lambda function with a single Terraform attribute.</p>

<p>I've been using SnapStart in production for about eight months across a dozen functions. My p99 latency dropped from 3.2 seconds to 340ms on the worst offender (a Spring Boot DynamoDB-backed API). The monthly Lambda bill didn't change. The deployment times went up by about 45 seconds per deploy, which I barely notice.</p>

<p>Try it on one function first. Run the CloudWatch query before and after. If the numbers look good, roll it out across the board. Your users will thank you.</p>
