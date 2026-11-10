---
title: "How to Catch AWS Lambda Jobs That Succeed but Write Nothing"
seoTitle: "Catch AWS Lambda Jobs That Succeed but Write Nothing"
slug: "catch-lambda-jobs-that-succeed-but-write-nothing"
brief: "Tooling catches crashes and misses empty success. Here's a contract, EMF metrics, a Step Functions check, and a regression test for jobs that write nothing."
publishedAt: "2099-06-01T18:00:00.000Z"
draft: true
draftToken: "2e1a2d6ed774753fa8e5ff4874f20330"
readTimeInMinutes: 15
coverImageUrl: "/blog-assets/catch-lambda-jobs-that-succeed-but-write-nothing/cover-v3.jpg"
reactionCount: 0
responseCount: 0
replyCount: 0
tags:
  - name: AWS
    slug: aws
  - name: Lambda
    slug: lambda
  - name: Step Functions
    slug: step-functions
  - name: Observability
    slug: observability
  - name: AI
    slug: ai
---

<p>A session commit reports success, and the memory extraction behind it produced zero memories. Nothing failed, no metric moved, the run is marked done, and whatever the model learned is gone.</p>

<p>That's the failure <a href="https://dev.to/pm25coder/the-extraction-returned-zero-memories-and-nothing-screamed-3c7c" target="_blank" rel="noopener noreferrer">pm25coder wrote up on dev.to</a> in September, from <a href="https://github.com/volcengine/OpenViking/issues/4580" target="_blank" rel="noopener noreferrer">issue #4580 on volcengine/OpenViking</a>. The title says it better than I can: "The extraction returned zero memories, and nothing screamed."</p>

<p>It isn't my incident. But the pipelines I've written up on this blog have the same hole. Neither the <a href="/blog/running-ai-background-jobs-serverlessly-with-sqs-lambda-bedrock">SQS and Bedrock job handler</a> nor the <a href="/blog/rag-ingestion-pipeline-step-functions-lambda">RAG ingestion state machine</a> compares what went in with what landed.</p>

<p>The rule I'd add to both: <strong>a pipeline that processes a non-empty input and writes nothing has failed, even if every status says OK.</strong> The one exception is when it can say why.</p>

<h2>Every green light here is telling the truth</h2>

<p>Our tooling is built to catch crashes. An empty success isn't a crash, so each layer reports correctly on the narrow thing it measures.</p>

<ul>
  <li>Lambda's <code>Errors</code> metric counts invocations that end in a function error. A handler that returns normally isn't one.</li>
  <li>SQS deletes the messages when the handler returns an empty <code>batchItemFailures</code>.</li>
  <li>A Step Functions Map state over an empty array has nothing to fail on.</li>
  <li>Retries don't fire, because nothing threw.</li>
</ul>

<figure><img src="/blog-assets/catch-lambda-jobs-that-succeed-but-write-nothing/diagram-empty-success.jpg" alt="Diagram of one SQS batch: the queue delivers 10 messages to the Lambda handler (Lambda Errors 0), which calls the Bedrock model (stopReason tool_use, 19 memories), which saves to the memory store, which accepts the call and writes 0 rows. The handler returns an empty batchItemFailures list (Invocation Success), and SQS deletes all 10 messages, so the input is gone." width="1600" height="900" loading="lazy" decoding="async"><figcaption>Every check mark is true. The two crosses are what actually happened, and nothing on the left side of the diagram can see them.</figcaption></figure>

<p>Run the bug yourself before reading any code. The figure below runs one ten-message SQS batch through a memory-extract Lambda. Pick what goes wrong, run the batch, and compare what AWS shows with what actually landed. Then switch the handler to the contract from the next section and run the same bug again. Flip <code>function_response_types</code> off too, because that one bites people who did everything else right.</p>

<div data-blog-activity="zero-write-batch"></div>

<p>The <a href="/blog/llm-observability-langfuse-lambda-cloudwatch">Langfuse and CloudWatch setup</a> I wrote about earlier won't catch this either. It tells you what the model did and what it cost. This post is about one narrower question: did anything land?</p>

<h2>The contract is three fields and one excuse</h2>

<p>Every batch, extraction, and ingest Lambda returns the same shape: <code>{ok, itemsWritten, errors[]}</code>. I'd add a fourth, optional field. SQS is at-least-once, so a redelivered message can legitimately write nothing, because the first delivery already did. The idempotent re-run in the RAG post does the same thing on purpose. Without a way to say so, every duplicate looks like the bug.</p>

<pre><code class="language-typescript">export type HrrError = { code: string; message: string };

export type HrrResult = {
  ok: boolean;
  itemsWritten: number;
  errors: HrrError[];
  emptyReason?: &quot;duplicate&quot; | &quot;nothing_to_extract&quot; | &quot;empty_input&quot;;
};

type HrrPolicy = &quot;WARN&quot; | &quot;FAIL&quot;;

export function hrr_verdict(result: HrrResult, onUnexplainedEmpty: HrrPolicy) {
  if (!result.ok) return &quot;FAIL&quot;;
  if (result.itemsWritten &gt; 0) return &quot;OK&quot;;
  if (result.emptyReason &amp;&amp; result.errors.length === 0) return &quot;OK&quot;;
  return onUnexplainedEmpty;
}</code></pre>

<p><code>hrr_verdict</code> assumes the input wasn't empty. An empty input has to say <code>empty_input</code> out loud, same as any other excuse. An excuse doesn't count if <code>errors</code> has anything in it.</p>

<figure><img src="/blog-assets/catch-lambda-jobs-that-succeed-but-write-nothing/diagram-contract-routes.jpg" alt="Diagram of the contract: every message returns ok, itemsWritten, errors and an optional emptyReason. hrr_verdict sends it down exactly one route. OK means rows landed or a stated emptyReason, and SQS deletes the message while ZeroWrites is still counted. WARN deletes but emits UnexplainedZeroWrites to a CloudWatch alarm that pages through SNS. FAIL puts the messageId in batchItemFailures, so the message is retried up to 5 times and then lands in the DLQ with its body intact." width="1600" height="900" loading="lazy" decoding="async"><figcaption>One result in, one route out. Only FAIL keeps the input; WARN leaves it to the alarm.</figcaption></figure>

<p>WARN or FAIL is a per-pipeline decision. These are the defaults I'd start with.</p>

<table>
<thead>
<tr>
<th>Pipeline</th>
<th>Zero writes on non-empty input means</th>
<th>Verdict</th>
</tr>
</thead>
<tbody>
<tr>
<td>RAG embed and index</td>
<td>A document with text produced no vectors. Only "every chunk was a duplicate" excuses it.</td>
<td>FAIL</td>
</tr>
<tr>
<td>Memory extraction</td>
<td>Fine if the model called the tool and said <code>nothing_to_extract</code>. Anything else is unexplained.</td>
<td>FAIL</td>
</tr>
<tr>
<td>Ticket sync</td>
<td>An empty delta is common and a retry won't change it. A sudden spike is still worth seeing.</td>
<td>WARN</td>
</tr>
</tbody>
</table>

<p>One thing the whole contract depends on: <code>itemsWritten</code> has to come from what the store confirmed. If it's <code>memories.length</code>, you've counted your intentions.</p>

<pre><code class="language-typescript">export function hrr_makeProcessor(deps: {
  callModel: (prompt: string) =&gt; Promise&lt;any&gt;;
  write: (memories: unknown[]) =&gt; Promise&lt;{ written: number; duplicates: number }&gt;;
}) {
  return async (body: string): Promise&lt;HrrResult&gt; =&gt; {
    const { memories, emptyReason, errors } = await hrr_extract(body, deps.callModel);
    if (memories === null) return { ok: false, itemsWritten: 0, errors };
    if (memories.length === 0) return { ok: true, itemsWritten: 0, errors, emptyReason };

    const { written, duplicates } = await deps.write(memories);
    const allDuplicates = written === 0 &amp;&amp; duplicates === memories.length;
    return {
      ok: true,
      itemsWritten: written,
      errors,
      ...(allDuplicates ? { emptyReason: &quot;duplicate&quot; as const } : {}),
    };
  };
}</code></pre>

<h2>Send the same numbers to CloudWatch, without console.log</h2>

<p>A returned object only helps a caller that reads it. So the same counts go out as <a href="https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Embedded_Metric_Format_Specification.html" target="_blank" rel="noopener noreferrer">CloudWatch Embedded Metric Format</a>, one JSON line per invocation.</p>

<pre><code class="language-typescript">export function hrr_emitMetrics(pipeline: string, counts: Record&lt;string, number&gt;) {
  // console.log adds a timestamp and request ID in text log format, which breaks EMF.
  process.stdout.write(
    JSON.stringify({
      _aws: {
        Timestamp: Date.now(),
        CloudWatchMetrics: [
          {
            Namespace: &quot;Hrr/Pipelines&quot;,
            Dimensions: [[&quot;Pipeline&quot;]],
            Metrics: Object.keys(counts).map((Name) =&gt; ({ Name, Unit: &quot;Count&quot; })),
          },
        ],
      },
      Pipeline: pipeline,
      ...counts,
    }) + &quot;\n&quot;,
  );
}</code></pre>

<p>The EMF spec requires a log event that's a JSON object with nothing before or after it. In Lambda's default text format, the Node runtime adds a timestamp, request ID, and level to <code>console.log</code> output. In JSON log format, CloudWatch can stop recognizing EMF that was written with <code>console.log</code>. <a href="https://docs.aws.amazon.com/lambda/latest/dg/nodejs-logging.html" target="_blank" rel="noopener noreferrer">AWS's fix is <code>process.stdout.write</code></a>, so that's what this uses.</p>

<p>Emit zeros, because a rate needs its denominator in every period. Keep <code>messageId</code> out of the dimensions too: every unique dimension value creates a new custom metric.</p>

<h2>In partial batch responses, an empty list means delete everything</h2>

<p>The handler's only way to tell Lambda about a bad message is <code>batchItemFailures</code>, and <a href="https://docs.aws.amazon.com/lambda/latest/dg/services-sqs-errorhandling.html" target="_blank" rel="noopener noreferrer">the rules are strict</a>.</p>

<table>
<thead>
<tr>
<th>Handler does</th>
<th>Lambda treats the batch as</th>
</tr>
</thead>
<tbody>
<tr>
<td>Returns an empty or null <code>batchItemFailures</code>, or an empty or null response</td>
<td>Complete success</td>
</tr>
<tr>
<td>Returns specific valid <code>itemIdentifier</code> values</td>
<td>Partial failure. Only those messages come back.</td>
</tr>
<tr>
<td>Throws</td>
<td>Complete failure</td>
</tr>
<tr>
<td>Returns invalid JSON, or an <code>itemIdentifier</code> that's empty, null, misnamed, or not in the batch</td>
<td>Complete failure</td>
</tr>
</tbody>
</table>

<p>So a no-op writer plus <code>{ batchItemFailures: [] }</code> is the worst version of this bug. Lambda reports success and SQS deletes the input. There's nothing left to replay. FAIL has to become an entry in that list, so the message comes back and eventually lands in the DLQ with its body intact.</p>

<pre><code class="language-typescript">export function hrr_makeSqsHandler(deps: {
  pipeline: string;
  onUnexplainedEmpty: HrrPolicy;
  process: (body: string) =&gt; Promise&lt;HrrResult&gt;;
}) {
  return async (event: SQSEvent): Promise&lt;SQSBatchResponse&gt; =&gt; {
    const batchItemFailures: SQSBatchItemFailure[] = [];
    const counts = {
      Messages: 0,
      FailedMessages: 0,
      ItemsWritten: 0,
      ItemErrors: 0,
      ZeroWrites: 0,
      UnexplainedZeroWrites: 0,
    };

    for (const record of event.Records) {
      let result: HrrResult;
      try {
        result = await deps.process(record.body);
      } catch (err) {
        result = {
          ok: false,
          itemsWritten: 0,
          errors: [{ code: &quot;exception&quot;, message: String(err) }],
        };
      }

      const verdict = hrr_verdict(result, deps.onUnexplainedEmpty);
      counts.Messages += 1;
      counts.ItemsWritten += result.itemsWritten;
      counts.ItemErrors += result.errors.length;
      if (result.ok &amp;&amp; result.itemsWritten === 0) counts.ZeroWrites += 1;
      if (result.ok &amp;&amp; verdict !== &quot;OK&quot;) counts.UnexplainedZeroWrites += 1;

      if (verdict !== &quot;OK&quot;) {
        console.warn(JSON.stringify({ verdict, messageId: record.messageId, ...result }));
      }
      if (verdict === &quot;FAIL&quot;) {
        counts.FailedMessages += 1;
        batchItemFailures.push({ itemIdentifier: record.messageId });
      }
    }

    hrr_emitMetrics(deps.pipeline, counts);
    return { batchItemFailures };
  };
}</code></pre>

<p>The catch is the standard pattern, and it also means per-message exceptions never reach Lambda's <code>Errors</code> metric. That's why <code>FailedMessages</code> is its own count.</p>

<p>SQS isn't a caller that reads your contract, so the full result goes to the log and the counts go to EMF. The response stays as just <code>batchItemFailures</code>. That's the only key AWS documents for it.</p>

<pre><code class="language-hcl">resource &quot;aws_sqs_queue&quot; &quot;hrr_extract_dlq&quot; {
  name = &quot;hrr-memory-extract-dlq&quot;
}

resource &quot;aws_sqs_queue&quot; &quot;hrr_extract&quot; {
  name                       = &quot;hrr-memory-extract&quot;
  visibility_timeout_seconds = 360 # 6x the 60s function timeout

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.hrr_extract_dlq.arn
    maxReceiveCount     = 5
  })
}

resource &quot;aws_lambda_event_source_mapping&quot; &quot;hrr_extract&quot; {
  event_source_arn        = aws_sqs_queue.hrr_extract.arn
  function_name           = aws_lambda_function.hrr_extract.arn
  batch_size              = 10
  function_response_types = [&quot;ReportBatchItemFailures&quot;]
}</code></pre>

<p>Don't forget <code>function_response_types</code>. Without it, the list your handler returns isn't a partial batch response, and the unit test below can't tell. <code>maxReceiveCount</code> of 5 and a visibility timeout of six times the function timeout are <a href="https://docs.aws.amazon.com/lambda/latest/dg/services-sqs-configure.html" target="_blank" rel="noopener noreferrer">AWS's recommendations</a>.</p>

<p>FAIL has a price. If the writer is broken for everyone, every message runs the whole extraction up to five times before reaching the DLQ. AWS also notes that Lambda doesn't scale down polling on failed invocations when <code>ReportBatchItemFailures</code> is on. I'd still pay it for pipelines where losing the input is worse than the repeat calls. Where it isn't, use WARN and let the alarm do the work.</p>

<p>A FIFO queue needs a different loop: stop at the first failure and return everything unprocessed, so ordering holds.</p>

<h2>Three ways a model reply turns into nothing</h2>

<p>The OpenViking report had three gaps, and <a href="https://dev.to/pm25coder/the-extraction-returned-zero-memories-and-nothing-screamed-3c7c" target="_blank" rel="noopener noreferrer">the dev.to write-up</a> explains why each one looked defensible on its own. That stack was a self-hosted model server, so this is my adaptation to Bedrock, not something the report measured there.</p>

<p><strong>The wrong parse channel.</strong> In the original, tool-call markup leaked into the content field, and the parser only looked in the structured channel. Converse <a href="https://docs.aws.amazon.com/bedrock/latest/APIReference/API_runtime_ContentBlock.html" target="_blank" rel="noopener noreferrer">separates <code>text</code> and <code>toolUse</code> blocks</a>, so the same markup may never show up. The same shape can: tool JSON sitting in a <code>text</code> block, with no <code>toolUse</code> at all. <a href="https://docs.aws.amazon.com/bedrock/latest/APIReference/API_runtime_ToolChoice.html" target="_blank" rel="noopener noreferrer">Setting <code>toolChoice</code></a> to <code>any</code> or <code>tool</code> narrows this down where the model supports it. I'd keep the check anyway, since <code>stopReason</code> can also come back as <code>malformed_model_output</code> or <code>malformed_tool_use</code>.</p>

<p><strong>The retry budget spent on garbage.</strong> One shared format-retry counter means a junk reply can use the only retry before a real formatting slip shows up. So each failure kind gets its own budget.</p>

<p><strong>The flag that disabled the recovery path.</strong> A flag built for "the model called a tool that doesn't exist" got reused for any parse failure. A model that answered "let me search first" then ran its next iteration with tools off, which guaranteed the empty result. The fix below is blunt. <code>callModel</code> has no parameter that turns tools off, so nobody can reuse it. A bad reply changes the prompt and nothing else.</p>

<pre><code class="language-typescript">const HRR_TOOL = &quot;hrr_save_memories&quot;;
const HRR_BUDGET = { wrong_channel: 1, prose: 2, malformed: 1 };

type HrrReply =
  | { kind: &quot;tool&quot;; input: any }
  | { kind: keyof typeof HRR_BUDGET; text: string };

export function hrr_readReply(response: any): HrrReply {
  const blocks = response.output?.message?.content ?? [];
  const call = blocks.find((b: any) =&gt; b.toolUse?.name === HRR_TOOL)?.toolUse;
  if (call) return { kind: &quot;tool&quot;, input: call.input };

  const text = blocks.map((b: any) =&gt; b.text ?? &quot;&quot;).join(&quot;&quot;).trim();
  if (response.stopReason?.startsWith(&quot;malformed_&quot;)) return { kind: &quot;malformed&quot;, text };
  const looksLikeACall = text.startsWith(&quot;{&quot;) || text.includes(HRR_TOOL);
  return { kind: looksLikeACall ? &quot;wrong_channel&quot; : &quot;prose&quot;, text };
}

export async function hrr_extract(
  transcript: string,
  callModel: (prompt: string) =&gt; Promise&lt;any&gt;,
) {
  const left = { ...HRR_BUDGET };
  const errors: HrrError[] = [];
  let hint = &quot;&quot;;

  while (true) {
    const reply = hrr_readReply(await callModel(transcript + hint));
    if (reply.kind === &quot;tool&quot;) return { ...reply.input, errors };

    errors.push({ code: reply.kind, message: reply.text.slice(0, 200) });
    if (left[reply.kind]-- === 0) return { memories: null, errors };
    hint = `\n\nCall ${HRR_TOOL}. Put the result in the tool call, not in text.`;
  }
}</code></pre>

<p>Every failed attempt goes into <code>errors</code>, and those reach <code>ItemErrors</code>. That closes the third gap from the original report, where the list existed and never left the container. As the write-up puts it, "A failure that is logged is not a failure that is visible." The maintainers later closed the issue as a serving and model-side problem, according to that post's update, and parse-failure counters went into <a href="https://github.com/volcengine/OpenViking/pull/4628" target="_blank" rel="noopener noreferrer">a separate PR</a>, still open as of November 2026.</p>

<h2>A Map state can succeed over nothing</h2>

<p>Step Functions has the same blind spot one level up. A Map state's output is an array of iteration outputs, and an empty array is a perfectly valid result. So the check goes in a Choice right after each Map.</p>

<p>The definition below is the part that matters, in JSONata. A chunking Task before it returns <code>documentId</code>, <code>documentBytes</code> and <code>chunks</code>, and each iteration returns the contract.</p>

<pre><code class="language-json">&quot;HrrEmbedChunks&quot;: {
  &quot;Type&quot;: &quot;Map&quot;,
  &quot;Items&quot;: &quot;{% $states.input.chunks %}&quot;,
  &quot;MaxConcurrency&quot;: 5,
  &quot;ItemProcessor&quot;: {
    &quot;ProcessorConfig&quot;: { &quot;Mode&quot;: &quot;INLINE&quot; },
    &quot;StartAt&quot;: &quot;HrrEmbedOne&quot;,
    &quot;States&quot;: {
      &quot;HrrEmbedOne&quot;: {
        &quot;Type&quot;: &quot;Task&quot;,
        &quot;Resource&quot;: &quot;arn:aws:states:::lambda:invoke&quot;,
        &quot;Arguments&quot;: {
          &quot;FunctionName&quot;: &quot;${embed_fn_arn}&quot;,
          &quot;Payload&quot;: &quot;{% $states.input %}&quot;
        },
        &quot;Output&quot;: &quot;{% $states.result.Payload %}&quot;,
        &quot;End&quot;: true
      }
    }
  },
  &quot;Output&quot;: {
    &quot;documentId&quot;: &quot;{% $states.input.documentId %}&quot;,
    &quot;documentBytes&quot;: &quot;{% $states.input.documentBytes %}&quot;,
    &quot;iterations&quot;: &quot;{% $count($states.result) %}&quot;,
    &quot;itemsWritten&quot;: &quot;{% $sum($append([0], $states.result.itemsWritten)) %}&quot;,
    &quot;explainedEmpty&quot;: &quot;{% $count($states.result[emptyReason]) %}&quot;,
    &quot;errors&quot;: &quot;{% $append([], $states.result.errors) %}&quot;
  },
  &quot;Catch&quot;: [
    {
      &quot;ErrorEquals&quot;: [&quot;States.ALL&quot;],
      &quot;Output&quot;: {
        &quot;documentId&quot;: &quot;{% $states.input.documentId %}&quot;,
        &quot;error&quot;: &quot;{% $states.errorOutput %}&quot;
      },
      &quot;Next&quot;: &quot;HrrNotifyFailure&quot;
    }
  ],
  &quot;Next&quot;: &quot;HrrCheckWrites&quot;
},
&quot;HrrCheckWrites&quot;: {
  &quot;Type&quot;: &quot;Choice&quot;,
  &quot;Choices&quot;: [
    {
      &quot;Condition&quot;: &quot;{% $states.input.documentBytes &gt; 0 and $states.input.itemsWritten = 0 and ($states.input.iterations = 0 or $states.input.explainedEmpty &lt; $states.input.iterations) %}&quot;,
      &quot;Next&quot;: &quot;HrrNotifyFailure&quot;
    }
  ],
  &quot;Default&quot;: &quot;HrrDone&quot;
},
&quot;HrrNotifyFailure&quot;: {
  &quot;Type&quot;: &quot;Task&quot;,
  &quot;Resource&quot;: &quot;arn:aws:states:::sns:publish&quot;,
  &quot;Arguments&quot;: {
    &quot;TopicArn&quot;: &quot;${alerts_topic_arn}&quot;,
    &quot;Subject&quot;: &quot;hrr ingest wrote nothing or failed&quot;,
    &quot;Message&quot;: &quot;{% $string($states.input) %}&quot;
  },
  &quot;Next&quot;: &quot;HrrFailed&quot;
},
&quot;HrrFailed&quot;: {
  &quot;Type&quot;: &quot;Fail&quot;,
  &quot;Error&quot;: &quot;HrrEmptyWrite&quot;,
  &quot;Cause&quot;: &quot;Non-empty input, nothing written. See the SNS alert for the document.&quot;
},
&quot;HrrDone&quot;: { &quot;Type&quot;: &quot;Succeed&quot; }</code></pre>

<p>"Non-empty input" is measured in <code>documentBytes</code>, because a chunker that returns <code>[]</code> for a real document looks like an empty input if you only count chunks. The <code>$append</code> wrappers are there because JSONata returns undefined when a path matches nothing, and Step Functions treats that as <code>States.QueryEvaluationError</code>. A Choice state has no <code>Catch</code>, so the Map's <code>Catch</code> and the Choice both point at the same SNS Task. That Task ends in a Fail state, so the execution really is <code>FAILED</code>.</p>

<pre><code class="language-hcl">resource &quot;aws_sfn_state_machine&quot; &quot;hrr_ingest&quot; {
  name     = &quot;hrr-ingest&quot;
  role_arn = aws_iam_role.hrr_sfn.arn
  definition = templatefile(&quot;${path.module}/hrr_ingest.asl.json&quot;, {
    chunk_fn_arn     = aws_lambda_function.hrr_chunk.arn
    embed_fn_arn     = aws_lambda_function.hrr_embed.arn
    alerts_topic_arn = aws_sns_topic.hrr_pipeline_alerts.arn
  })
}</code></pre>

<p>The state machine role needs <code>sns:Publish</code> on that topic. The per-chunk Lambda should call <code>hrr_emitMetrics</code> too, so ingest shows up on the same dashboard.</p>

<p>This matters more than a missed write in the RAG post's design. Its sweep runs after the Map and deletes every chunk for the document whose <code>ingest_run_id</code> isn't the current run. A writer that no-ops would leave no rows on the current run, so a "successful" Map followed by the sweep would delete the whole document's chunks. The check belongs before the sweep.</p>

<p>That post also uses a Distributed Map with <code>ResultWriter</code>, and this exact <code>Output</code> won't work there. With an S3 export, <a href="https://docs.aws.amazon.com/step-functions/latest/dg/input-output-resultwriter.html" target="_blank" rel="noopener noreferrer">the state returns only <code>MapRunArn</code> and <code>ResultWriterDetails</code></a>. There's no array to sum. Add a small Task that reads <code>manifest.json</code>, parses each child's <code>Output</code> string from the <code>SUCCEEDED_n.json</code> files, and returns the same fields to the same Choice.</p>

<h2>Put success rate and zero-write rate side by side</h2>

<p>Either number alone misleads. Take a five-minute window where the failure is invisible:</p>

<table>
<thead>
<tr>
<th>Illustrative window</th>
<th>Value</th>
</tr>
</thead>
<tbody>
<tr>
<td>Messages</td>
<td>100</td>
</tr>
<tr>
<td>FailedMessages (policy set to WARN)</td>
<td>0</td>
</tr>
<tr>
<td>UnexplainedZeroWrites</td>
<td>100</td>
</tr>
<tr>
<td>Success rate</td>
<td>100%</td>
</tr>
<tr>
<td>Unexplained zero-write rate</td>
<td>100%</td>
</tr>
</tbody>
</table>

<pre><code class="language-hcl">locals {
  hrr_ns = &quot;Hrr/Pipelines&quot;
  hrr_p  = &quot;memory-extract&quot;
}

resource &quot;aws_cloudwatch_dashboard&quot; &quot;hrr_pipelines&quot; {
  dashboard_name = &quot;hrr-pipelines&quot;

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = &quot;metric&quot;
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          title  = &quot;Success rate&quot;
          region = var.aws_region
          view   = &quot;timeSeries&quot;
          stat   = &quot;Sum&quot;
          period = 300
          yAxis  = { left = { min = 0, max = 100 } }
          metrics = [
            [{ expression = &quot;100 * (messages - failed) / messages&quot;, label = &quot;Success %&quot;, id = &quot;success&quot; }],
            [local.hrr_ns, &quot;Messages&quot;, &quot;Pipeline&quot;, local.hrr_p, { id = &quot;messages&quot;, visible = false }],
            [local.hrr_ns, &quot;FailedMessages&quot;, &quot;Pipeline&quot;, local.hrr_p, { id = &quot;failed&quot;, visible = false }],
          ]
        }
      },
      {
        type   = &quot;metric&quot;
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          title  = &quot;Zero-write rate&quot;
          region = var.aws_region
          view   = &quot;timeSeries&quot;
          stat   = &quot;Sum&quot;
          period = 300
          yAxis  = { left = { min = 0, max = 100 } }
          metrics = [
            [{ expression = &quot;100 * unexplained / messages&quot;, label = &quot;Unexplained %&quot;, id = &quot;unexplained_pct&quot; }],
            [{ expression = &quot;100 * zero / messages&quot;, label = &quot;All zero-write %&quot;, id = &quot;zero_pct&quot; }],
            [local.hrr_ns, &quot;Messages&quot;, &quot;Pipeline&quot;, local.hrr_p, { id = &quot;messages&quot;, visible = false }],
            [local.hrr_ns, &quot;UnexplainedZeroWrites&quot;, &quot;Pipeline&quot;, local.hrr_p, { id = &quot;unexplained&quot;, visible = false }],
            [local.hrr_ns, &quot;ZeroWrites&quot;, &quot;Pipeline&quot;, local.hrr_p, { id = &quot;zero&quot;, visible = false }],
          ]
        }
      },
    ]
  })
}</code></pre>

<p>I'd graph all zero-writes next to the unexplained ones on purpose. If a prompt change makes the model answer <code>nothing_to_extract</code> for everything, every message has an excuse and the unexplained line stays flat. The total line climbs.</p>

<h2>Alarm on the spike, and mind the floor</h2>

<p>The alarm uses the same rate, with a minimum volume so one empty message at 3 a.m. doesn't page anybody.</p>

<pre><code class="language-hcl">resource &quot;aws_sns_topic&quot; &quot;hrr_pipeline_alerts&quot; {
  name = &quot;hrr-pipeline-alerts&quot;
}

resource &quot;aws_cloudwatch_metric_alarm&quot; &quot;hrr_zero_write_spike&quot; {
  alarm_name          = &quot;hrr-memory-extract-zero-write-spike&quot;
  alarm_description   = &quot;Messages processed OK with nothing written and no stated reason.&quot;
  comparison_operator = &quot;GreaterThanOrEqualToThreshold&quot;
  evaluation_periods  = 3
  datapoints_to_alarm = 2
  threshold           = 20
  treat_missing_data  = &quot;notBreaching&quot;
  alarm_actions       = [aws_sns_topic.hrr_pipeline_alerts.arn]
  ok_actions          = [aws_sns_topic.hrr_pipeline_alerts.arn]

  metric_query {
    id          = &quot;zero_write_pct&quot;
    expression  = &quot;IF(messages &gt;= 20, 100 * unexplained / messages, 0)&quot;
    label       = &quot;Unexplained zero-write %&quot;
    return_data = true
  }

  metric_query {
    id = &quot;messages&quot;
    metric {
      namespace   = &quot;Hrr/Pipelines&quot;
      metric_name = &quot;Messages&quot;
      dimensions  = { Pipeline = &quot;memory-extract&quot; }
      period      = 300
      stat        = &quot;Sum&quot;
    }
  }

  metric_query {
    id = &quot;unexplained&quot;
    metric {
      namespace   = &quot;Hrr/Pipelines&quot;
      metric_name = &quot;UnexplainedZeroWrites&quot;
      dimensions  = { Pipeline = &quot;memory-extract&quot; }
      period      = 300
      stat        = &quot;Sum&quot;
    }
  }
}</code></pre>

<p>That alarm over an hour of illustrative traffic. Move the threshold and the floor, change how many datapoints it needs, and try the three scenarios. The quiet pipeline and the prompt drift are the two I'd test first, because they're the ones that never page. Then break the EMF emitter and watch the alarm clear itself.</p>

<div data-blog-activity="zero-write-alarm"></div>

<p>The 20 messages and 20% are example numbers. Tune them to your traffic. A pipeline that gets five messages an hour never clears that floor, so alarm directly on a sum of <code>UnexplainedZeroWrites</code> instead.</p>

<p>EMF metrics depend on log delivery, and AWS suggests M out of N alarms when you can't control log flushing, which is the case in Lambda. Hence 2 of 3 periods. <code>notBreaching</code> has a cost too: if the emitter itself breaks, missing data reads as OK. That's a silent success about your silent success detector. Add alarms on <code>EMFParsingErrors</code> and <code>EMFValidationErrors</code> in the <code>AWS/Logs</code> namespace, using the <code>LogGroupName</code> dimension, to catch a bad format. The test below covers the code path.</p>

<h2>The regression test a no-op writer can't pass</h2>

<p>Feed a non-empty SQS batch through the real handler and the real processor, stub only the model and the store, and make the store do nothing.</p>

<pre><code class="language-typescript">import test from &quot;node:test&quot;;
import assert from &quot;node:assert/strict&quot;;
import { hrr_makeProcessor, hrr_makeSqsHandler } from &quot;./hrr_pipeline.ts&quot;;

const hrr_event = {
  Records: [
    { messageId: &quot;id1&quot;, body: &quot;user: I moved to Dhaka&quot; },
    { messageId: &quot;id2&quot;, body: &quot;user: I switched to Terraform&quot; },
  ],
} as any;

test(&quot;non-empty batch plus a no-op writer fails and moves the metric&quot;, async (t) =&gt; {
  const lines: string[] = [];
  t.mock.method(console, &quot;warn&quot;, () =&gt; {});
  const stdout = t.mock.method(process.stdout, &quot;write&quot;, (line: string) =&gt; {
    lines.push(line);
    return true;
  });

  const handler = hrr_makeSqsHandler({
    pipeline: &quot;memory-extract&quot;,
    onUnexplainedEmpty: &quot;FAIL&quot;,
    process: hrr_makeProcessor({
      callModel: async () =&gt; ({
        stopReason: &quot;tool_use&quot;,
        output: {
          message: {
            content: [
              {
                toolUse: {
                  toolUseId: &quot;t1&quot;,
                  name: &quot;hrr_save_memories&quot;,
                  input: { memories: [{ fact: &quot;lives in Dhaka&quot; }] },
                },
              },
            ],
          },
        },
      }),
      // The bug under test: the store accepts the call and saves nothing.
      write: async () =&gt; ({ written: 0, duplicates: 0 }),
    }),
  });

  const response = await handler(hrr_event);
  stdout.mock.restore();

  assert.deepEqual(response.batchItemFailures, [
    { itemIdentifier: &quot;id1&quot; },
    { itemIdentifier: &quot;id2&quot; },
  ]);

  const emf = JSON.parse(lines.find((line) =&gt; line.includes('&quot;_aws&quot;'))!);
  assert.equal(emf.Messages, 2);
  assert.equal(emf.ItemsWritten, 0);
  assert.equal(emf.UnexplainedZeroWrites, 2);
  assert.equal(emf.FailedMessages, 2);
});</code></pre>

<p>It needs no AWS account and no mocking library. All the TypeScript in this post lives in one file, <code>hrr_pipeline.ts</code>, with <code>import type { SQSEvent, SQSBatchResponse, SQSBatchItemFailure } from &quot;aws-lambda&quot;</code> at the top. Those types come from <code>@types/aws-lambda</code>. Run the test with <code>node --test</code> on a Node version that strips types, or through your own TypeScript runner.</p>

<p>The handler and this test run as written under <code>node --test</code>. The JSONata expressions were evaluated against sample inputs with jsonata 2.0.6, the version Step Functions implements, and the Terraform passes <code>terraform validate</code> on AWS provider 6.72. None of it has been deployed as a full stack, so test the alarm and the state machine in your own account before you trust them.</p>

<p>Hope you enjoyed this one. If your pipeline has an empty-success case this contract wouldn't catch, I'd like to hear about it.</p>

<p>Find me on X at <a href="https://x.com/harundotdev" target="_blank" rel="noopener noreferrer">https://x.com/harundotdev</a>, and grab every other link from my bio at <a href="https://harun.dev/bio" target="_blank" rel="noopener noreferrer">https://harun.dev/bio</a>.</p>
