---
title: "Running Long AI Workloads on Lambda MicroVMs Without Going Broke"
slug: "lambda-microvm-long-ai-workloads"
brief: "How to run long AI inference workloads on AWS Lambda MicroVMs with real cost controls, timeout handling, and concurrency management."
draft: true
draftToken: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6"
publishedAt: "2026-06-27T09:00:00.000Z"
readTimeInMinutes: 12
coverImageUrl: "/blog-assets/lambda-microvm-long-ai-workloads/cover.jpg"
reactionCount: 0
responseCount: 0
replyCount: 0
tags:
  - name: AWS
    slug: aws
  - name: Lambda
    slug: lambda
  - name: Serverless
    slug: serverless
  - name: AI
    slug: ai
  - name: Cost Optimization
    slug: cost-optimization
---

<p>I ran into a wall earlier this year. I had a Bedrock inference job that needed to process a large batch of documents. Each document took about 12 minutes to complete. Lambda's standard 15 minute timeout meant I was cutting it close on every single invocation. Some ran over by a few seconds and got killed. No error, no partial output. Just a silent failure that I found three days later when I checked the logs.</p>

<p>That is when I started paying attention to Lambda MicroVMs and how they handle long running workloads. The short version is that Lambda now supports up to 15 minutes out of the box, and with the right setup you can handle even longer jobs without switching to a different compute service. The trick is knowing where the limits actually are and how to design around them.</p>

<p>This post is the playbook I built from that incident. It covers the timeout strategies, the cost controls, the concurrency planning, and the patterns that saved me from both cold starts and surprise bills.</p>

<h2>Where Lambda MicroVMs Actually Max Out</h2>

<p>Lambda functions run inside MicroVMs that AWS manages for you. Each MicroVM is a lightweight virtual machine that starts fast, runs your code, and gets torn down. The 15 minute timeout is a hard wall. You cannot extend it. If your workload consistently needs more time, you need a different approach, not a bigger timeout.</p>

<p>But here is the thing. Most AI workloads do not need to run for 15 continuous minutes. They need to run for a few seconds of compute with several seconds of waiting mixed in. The waiting is what kills you. An API call to Bedrock that takes 30 seconds to respond is 30 seconds of Lambda billable time. A chain of three such calls is 90 seconds. Throw in some retries and you are past the 5 minute mark before you know it.</p>

<p>The fix is not to make each Lambda run faster. The fix is to stop waiting inside the Lambda.</p>

<h2>The Async Pattern That Saved Me 40%</h2>

<p>I switched from synchronous Bedrock inference to the async invoke pattern. Instead of calling <code>bedrock.invokeModel()</code> and waiting for the response, I call <code>bedrock.startInvokeModel()</code>, get back a job ARN, and return immediately. A separate poller function checks the job status and processes the result when it is ready.</p>

<p>Here is what that looks like in practice:</p>

<pre><code>async function processDocument(doc) {
  const job = await bedrock.startInvokeModel({
    modelId: 'anthropic.claude-sonnet-v2',
    body: JSON.stringify({ prompt: doc.prompt }),
  });

  // Store the job ARN in DynamoDB with a TTL
  await dynamo.put({
    TableName: process.env.JOBS_TABLE,
    Item: {
      jobId: job.jobArn,
      documentId: doc.id,
      status: 'processing',
      ttl: Math.floor(Date.now() / 1000) + 86400,
    },
  }).promise();

  return { jobId: job.jobArn, status: 'submitted' };
}</code></pre>

<p>The Lambda returns in under 100 milliseconds. No waiting. No timeout risk. The actual inference runs in the background and the poller picks it up when Bedrock finishes.</p>

<p>This pattern cut my Lambda bill by about 40% on that batch job. The functions that were idling for 12 minutes waiting for Bedrock were replaced by functions that ran for 80 milliseconds and returned. The cost difference is substantial when you scale it across thousands of documents.</p>

<h2>Reserved Concurrency Is Your Budget Control</h2>

<p>The second biggest mistake I made was ignoring concurrency limits. When you have a long running job and a high traffic spike hits at the same time, Lambda scales up to handle both. If you do not cap it, you can end up with 500 concurrent invocations each running for 10 minutes. That is 5,000 compute minutes in a short window. The bill adds up fast.</p>

<p>I set reserved concurrency on every function that handles AI workloads. The number depends on the criticality of the function and the cost per invocation.</p>

<pre><code>resource "aws_lambda_function" "hrr_doc_processor" {
  function_name = "hrr-doc-processor-${var.environment}"
  role          = aws_iam_role.hrr_lambda_role.arn
  filename      = "function.zip"
  handler       = "index.handler"
  runtime       = "nodejs22.x"
  timeout       = 60

  reserved_concurrent_executions = 10
}</code></pre>

<p>Ten concurrent executions means at most ten documents are processed at any given moment. If the queue backs up, it backs up in SQS, not in Lambda. The cost is predictable because the max compute time is bounded: 10 functions times 60 seconds times the number of batches.</p>

<p>I use a separate, higher concurrency cap for the short running poller functions. They run for under a second each and cost pennies. The expensive work is the inference itself, and that is where I keep the tightest cap.</p>

<h2>Warm Pool Strategy for Cold Starts</h2>

<p>Cold starts are painful on AI workloads because the dependency chain is heavy. Your function needs the AWS SDK, the Bedrock client, any serialization libraries, and sometimes a local model runtime. Loading all of that on every invocation adds 2 to 5 seconds to the p99 latency.</p>

<p>The fix is a combination of provisioned concurrency and a warmup script. Provisioned concurrency keeps a set number of environments initialized and ready. You pay for the idle time, but the tradeoff makes sense when the workload is steady.</p>

<p>I set provisioned concurrency to match my base traffic level. For the doc processor, that is 2 always-warm environments. Traffic spikes above that level take the cold start penalty, but the base load never does.</p>

<pre><code>resource "aws_lambda_provisioned_concurrency_config" "hrr_base" {
  function_name                     = aws_lambda_function.hrr_doc_processor.function_name
  qualifier                         = aws_lambda_alias.hrr_prod.name
  provisioned_concurrent_executions = 2
}</code></pre>

<p>I also added a CloudWatch Events rule that pings the function every 5 minutes during business hours. This keeps the warm pool alive during peak periods without provisioning extra capacity overnight.</p>

<h2>SnapStart for Node.js and Python</h2>

<p>Lambda SnapStart takes a snapshot of the initialized execution environment and caches it. On the next invocation, Lambda loads the snapshot instead of running the initialization code from scratch. This cuts cold start latency from seconds to milliseconds.</p>

<p>I enabled it on the poller functions and saw the init duration drop from 2.1 seconds to under 200 milliseconds. The tradeoff is that SnapStart is not compatible with all runtimes or all SDK features. You need to test it with your specific dependency chain before enabling it in production.</p>

<p>For the doc processor, SnapStart did not work well because the Bedrock client initialization includes some state that does not survive the snapshot. I kept it on the simple functions and left the complex ones on provisioned concurrency.</p>

<h2>The SQS + Lambda Throttle Pattern</h2>

<p>When a function hits its reserved concurrency limit, new invocations are throttled. Lambda can send those throttled events to a dead letter queue or you can catch them with a CloudWatch alarm. I do both.</p>

<p>The DLQ catches the overflow and stores it for reprocessing. The CloudWatch alarm notifies me when throttling happens so I can decide whether to increase the concurrency cap or let the queue drain slowly.</p>

<pre><code>resource "aws_lambda_function_event_invoke_config" "hrr_dlq" {
  function_name = aws_lambda_function.hrr_doc_processor.function_name

  destination_config {
    on_failure {
      destination = aws_sqs_queue.hrr_dlq.arn
    }
  }

  maximum_retry_attempts = 3
  maximum_event_age_in_seconds = 3600
}</code></pre>

<p>This pattern costs almost nothing when things are running normally. The DLQ sits empty and the alarm never fires. But when something goes wrong, I have a clear record of what was dropped and a queue to reprocess it from.</p>

<h2>How I Monitor the Cost Per Invocation</h2>

<p>Cost control on Lambda comes down to three metrics: invocation count, duration, and concurrency. I track all three with CloudWatch custom dashboards and a weekly budget report.</p>

<p>The dashboard shows me the p50 and p99 duration for each function. If the p99 starts creeping up, it usually means a cold start problem or a slow downstream dependency. I set an alarm at p99 > 30 seconds for the long running functions and p99 > 3 seconds for the short ones.</p>

<p>The budget report is a simple Lambda function that runs every Monday morning. It queries the Cost Explorer API and compares the current week to the previous four weeks. If the cost exceeded the threshold, it posts a summary to a Slack webhook.</p>

<pre><code>async function checkLambdaCost() {
  const cost = await costExplorer.getCostAndUsage({
    TimePeriod: {
      Start: '2026-06-20',
      End: '2026-06-27',
    },
    Granularity: 'DAILY',
    Metrics: ['UnblendedCost'],
    Filter: {
      Dimensions: {
        Key: 'SERVICE',
        Values: ['AWS Lambda'],
      },
    },
  }).promise();

  const total = cost.ResultsByTime.reduce(
    (sum, day) => sum + parseFloat(day.Total.UnblendedCost.Amount), 0
  );

  if (total > parseFloat(process.env.COST_THRESHOLD)) {
    await notifySlack(`Lambda cost this week: $${total.toFixed(2)}`);
  }
}</code></pre>

<p>The Slack notification is low friction enough that I actually read it. I caught a runaway retry loop within an hour of deploying a bad config because the budget report fired on Monday morning. Without it, I would have missed the extra $300 in charges until the end of the billing cycle.</p>

<h2>The Patterns That Did Not Work</h2>

<p>Not every optimization survived production. Some approaches I tried made things worse:</p>

<ul>
  <li><strong>Increasing memory to reduce duration.</strong> Lambda pricing scales with memory. Doubling the memory from 1 GB to 2 GB doubles the cost per millisecond. If the function does not actually need the extra memory for compute, you end up paying more for the same work. Profile first, then increase.</li>
  <li><strong>Nesting Lambda invocations.</strong> Having one Lambda call another Lambda directly sounds clean but creates a dependency chain that is hard to debug. SQS between functions is better because it decouples the invocations and provides a retry mechanism.</li>
  <li><strong>Using Step Functions for everything.</strong> Step Functions is great for orchestration, but each state transition adds latency and cost. For simple async patterns, SQS + Lambda with a poller is cheaper and faster.</li>
</ul>

<h2>What I Would Do Differently</h2>

<p>If I were starting this project today, I would set up the concurrency limits and the async pattern from day one. I wasted the first week building a synchronous pipeline that worked fine in testing and broke under load. The async approach added about half a day of development time and saved me weeks of debugging.</p>

<p>I would also add the budget alarm earlier. The first month of running this pipeline cost about $400 more than I expected because I had not set any cost boundaries. The alarm would have caught it in the first week instead of the fourth.</p>

<p>The MicroVM model is still the right choice for AI workloads on AWS. You get the isolation, the fast scaling, and the pay-per-use pricing. But you need to design for the platform's limits instead of fighting against them. The async pattern, reserved concurrency, and warm pool strategy turned a fragile pipeline into something I do not worry about anymore.</p>

<p>Hope you enjoyed this walkthrough. If you are running similar AI workloads on Lambda and have found other patterns that work, let me know. Follow me on Twitter at <a href="https://x.com/HarunRRayhan" target="_blank">@HarunRRayhan</a> for more real world AWS stories.</p>
