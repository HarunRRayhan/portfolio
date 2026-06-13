---
title: "How I Add LLM Observability to a Real AWS App with Langfuse, Lambda, and CloudWatch"
slug: "llm-observability-langfuse-lambda-cloudwatch"
brief: "How I connect Langfuse, Lambda, and CloudWatch so I can trace prompt behavior, cost, retries, and failures in a production AWS app"
publishedAt: "2026-06-03T12:16:03.302Z"
readTimeInMinutes: 10
reactionCount: 0
coverImageUrl: "/blog-assets/llm-observability-langfuse-lambda-cloudwatch/cover.svg"
responseCount: 0
replyCount: 0
tags:
  - name: "AWS"
    slug: "aws"
  - name: "AI"
    slug: "ai"
  - name: "Devops"
    slug: "devops"
  - name: "Serverless"
    slug: "serverless"
  - name: "Observability"
    slug: "observability"---
<p><strong>Draft note:</strong> This article is currently drafted for review only and will stay out of the public blog index until I publish it.</p>
<p>I have learned the hard way that an LLM feature is not production-ready just because the prompt works in a notebook.</p>
<p>The real question is whether I can tell what happened when it fails at 2 a.m. Did the model answer badly? Did the prompt change? Did the Lambda retry? Did the request time out because the upstream API was slow? Or did I just spend ten minutes staring at a CloudWatch log stream that only says <code>Error: failed request</code>?</p>
<p>That is why I started treating observability as part of the feature, not as a nice-to-have later. In my AWS apps, I want two things at the same time: a product-level trace of the LLM interaction and an infrastructure-level trace of the Lambda execution. Langfuse gives me the first. CloudWatch gives me the second. Together, they tell me what actually happened instead of what I hope happened.</p>
<h2>The app I am thinking about</h2>
<p>I am not talking about a toy demo. I mean a real Lambda-backed app that accepts a request, builds a prompt, calls a model, maybe retries once, and stores or returns the result. That could be a support assistant, a document summarizer, a code review helper, or an internal workflow tool.</p>
<p>Once money, latency, and user trust are involved, you need to answer a few simple questions for every request:</p>
<p>What prompt version ran? Which model and provider handled it? How many tokens did it use? How long did it take? Did it retry? Did it fail before the model call or after? And if the answer was bad, can I replay the trace with the same inputs?</p>
<h2>The minimum signal set I care about</h2>
<p>I do not need fifty dashboards. I need a small set of signals I can trust.</p>
<p>For the LLM side, I track:</p>
<p>request ID, trace ID, prompt name, prompt version, model name, provider, input token count, output token count, latency, status, and retry count.</p>
<p>For the Lambda side, I track:</p>
<p>function name, invocation ID, cold start or warm start, duration, memory used, timeout risk, error type, and whether the request hit a retry path.</p>
<p>If I can correlate those two sets, I can usually answer the question that matters: was this an application problem, an LLM problem, or an infrastructure problem?</p>
<h2>How I wire Langfuse into the Lambda flow</h2>
<p>My rule is simple: the Lambda handler starts the trace, the model call creates the span, and the handler closes everything out whether the request succeeds or fails.</p>
<p>I keep the Langfuse object creation near the top of the handler so every downstream call can inherit the same trace context. The important part is not the SDK itself. It is the shape of the metadata. I want the trace to include enough context that I can search for a request without grepping logs like it is 2017.</p>
<pre><code>{
  "request_id": "req_01J...",
  "trace_id": "langfuse_trace_abc123",
  "prompt_name": "support-reply",
  "prompt_version": "2026-06-03",
  "model": "anthropic/claude-sonnet-4",
  "provider": "anthropic",
  "tenant_id": "acme",
  "feature": "customer-support-assistant"
}</code></pre>
<p>I also like to attach the user-facing outcome to the trace. Not the raw secret data, just the useful business result: success, fallback, refused, timed out, or human escalation.</p>
<h2>How CloudWatch and Langfuse work together</h2>
<p>Langfuse tells me what the model did. CloudWatch tells me what Lambda did around it.</p>
<p>That means CloudWatch logs should always include the Langfuse trace ID or the internal request ID that maps back to it. If I cannot jump from a bad CloudWatch log line into the exact Langfuse trace, the observability setup is already half broken.</p>
<p>In practice, I log a compact JSON line for each stage:</p>
<pre><code>{
  "level": "info",
  "request_id": "req_01J...",
  "trace_id": "langfuse_trace_abc123",
  "stage": "llm_call_started",
  "prompt_version": "2026-06-03"
}</code></pre>
<p>Then I use CloudWatch for the operational truth: did the function time out, did memory climb, did I hit throttling, did the retry loop fire, did a downstream API fail before the prompt was even sent?</p>
<p>If I need one place to start during an incident, I usually start in CloudWatch because it tells me whether the Lambda itself is healthy. Then I jump into Langfuse to see the prompt and model behavior. That sequence saves time.</p>
<h2>What I alert on first</h2>
<p>I do not alert on every weird output. That is how you drown in noise.</p>
<p>The alerts I actually care about are boring and practical:</p>
<p>error rate, timeout rate, retry spikes, token cost spikes, latency spikes, and sudden changes in the distribution of model outputs or fallback usage.</p>
<p>If a prompt suddenly starts using twice as many tokens, I want to know. If the output length drops because the model is truncating or failing early, I want to know. If one tenant starts producing far more retries than everyone else, I want to know that too.</p>
<p>For the noisy stuff, like a single weird answer, I rely on traces and sample review instead of paging myself awake.</p>
<h2>The part I still keep manual</h2>
<p>Observability is not the same as approval.</p>
<p>Even with Langfuse traces and CloudWatch logs, I still manually inspect a few things: prompt changes, model changes, fallback path changes, and anything that touches user-visible policy or safety. If the output is legally sensitive, customer-facing, or expensive, I do not let the dashboard make the decision for me.</p>
<p>I want observability to shorten the time to understanding. I do not want it to replace judgment.</p>
<h2>The workflow that has worked best for me</h2>
<p>The simplest version is the one I keep coming back to:</p>
<p>1. Give every request a request ID and trace ID.<br />
2. Start a Langfuse trace at the Lambda boundary.<br />
3. Record prompt version, model, provider, and token counts.<br />
4. Log compact JSON to CloudWatch for each stage.<br />
5. Alert on latency, retries, timeouts, and cost spikes.<br />
6. Review the trace when something looks off.<br />
7. Keep human review for anything risky or customer-facing.</p>
<p>That is not glamorous, but it is usable. And usable beats clever every time in production.</p>
<h2>What I get out of it</h2>
<p>The biggest win is confidence. I can ship an LLM feature without feeling like I just launched a black box and hoped for the best.</p>
<p>When a bad result shows up, I can usually tell quickly whether I need to fix the prompt, tune the retry logic, raise the timeout, lower the token budget, or just accept that the model is being weird and handle it with a fallback.</p>
<p>That is the real value of LLM observability in AWS: not dashboards for their own sake, but a clear path from symptom to cause to fix.</p>
<p>If I were starting a new production LLM feature today, observability would not be the last thing I add. It would be one of the first.</p>