---
title: "How I Migrated a Lambda AI App to Bedrock’s OpenAI-Compatible APIs Without Rewriting Everything"
slug: "migrated-lambda-ai-app-to-bedrock-openai-compatible-apis-without-rewriting-everything"
brief: "A practical migration story about moving a Lambda AI app from a custom OpenAI-style integration to Amazon Bedrock without rewriting the whole codebase"
publishedAt: "2026-06-06T05:43:54.819Z"
readTimeInMinutes: 11
reactionCount: 0
responseCount: 0
replyCount: 0
tags:
  - name: "AWS"
    slug: "aws"
  - name: "AI"
    slug: "ai"
  - name: "Lambda"
    slug: "lambda"
  - name: "Bedrock"
    slug: "bedrock"
  - name: "Serverless"
    slug: "serverless"---
<p><strong>Draft note:</strong> This article is drafted for review only. It will stay out of the public blog index until I publish it.</p>
<p>I wanted to move one of my Lambda AI apps off the old setup and onto Amazon Bedrock without turning it into a rewrite project.</p>
<p>That mattered because the app already worked. It accepted a request, built a prompt, called a model, handled retries, logged traces, and returned a response. The architecture was fine. The problem was the underlying model provider path had started to feel like something I would rather replace before it turned into a dependency headache.</p>
<p>Bedrock’s OpenAI-compatible APIs looked like the cleanest exit. The pitch was simple: keep the shape of the client calls familiar, switch the backend, and avoid rewriting the whole application around a new inference layer.</p>
<p>That is the kind of migration I like. Not dramatic. Just boring in the best possible way.</p>
<h2>What the app looked like before the migration</h2>
<p>The app was a pretty standard Lambda-backed API. A request came in through API Gateway, Lambda normalized the payload, then the handler called a model provider and returned the result.</p>
<p>The code already had a few production-minded pieces around it:</p>
<ul>
<li>request IDs and trace IDs</li>
<li>structured JSON logs</li>
<li>retry logic for transient failures</li>
<li>basic token accounting</li>
<li>response formatting that separated raw model output from user-facing output</li>
</ul>
<p>That structure mattered because it meant the migration target was not the whole app. It was mostly the model client and the surrounding config.</p>
<p>Here is the important part: I was not trying to change the product behavior. I was trying to change the model integration while keeping the request flow, error handling, and observability intact.</p>
<h2>Why Bedrock made sense here</h2>
<p>I was not looking for novelty. I was looking for less friction.</p>
<p>Bedrock gave me a few things I wanted right away:</p>
<ul>
<li>one AWS-native place to manage model access</li>
<li>permission control through IAM instead of a separate provider key story</li>
<li>the ability to keep the app inside my existing AWS boundary</li>
<li>a path that felt close enough to the OpenAI-style request shape to reduce code churn</li>
</ul>
<p>That last point was the big one. If a migration forces me to rewrite every prompt wrapper, every request mapper, and every retry branch, the cost is usually not worth it unless there is a very strong reason.</p>
<p>In this case, the compatibility layer meant I could keep the application structure and mostly swap the backend implementation.</p>
<h2>What stayed the same</h2>
<p>These parts stayed the same, which is why the migration was manageable:</p>
<ul>
<li><strong>The handler shape.</strong> The Lambda entrypoint still accepted the same kind of request and returned the same response format.</li>
<li><strong>The prompt structure.</strong> My system and user message construction did not need a redesign.</li>
<li><strong>The retry strategy.</strong> I still handled transient errors in the same place.</li>
<li><strong>The observability model.</strong> Request IDs, trace IDs, and JSON logs all stayed in place.</li>
<li><strong>The deployment path.</strong> The app still deployed as a Lambda artifact through the same pipeline.</li>
</ul>
<p>That is the real reason the migration stayed small. I treated the model client as an adapter, not as the center of the application.</p>
<h2>What I actually had to change</h2>
<p>The changes were smaller than I expected.</p>
<p>At a high level, I changed four things:</p>
<ol>
<li>the model client configuration</li>
<li>the authentication path</li>
<li>the request endpoint or model identifier mapping</li>
<li>the tests that assumed the old provider behavior</li>
</ol>
<p>The client code became a thinner wrapper around the Bedrock-compatible request shape. I did not want provider-specific logic leaking into the rest of the app, so I kept all of that behind one interface.</p>
<p>A simplified version looked like this:</p>
<pre><code class="language-typescript">type LlmRequest = {
  prompt: string;
  model?: string;
  temperature?: number;
};

type LlmResult = {
  text: string;
  model: string;
  promptTokens?: number;
  completionTokens?: number;
};

export async function generateText(input: LlmRequest): Promise&lt;LlmResult&gt; {
  const client = getBedrockClient();

  const response = await client.send({
    prompt: input.prompt,
    model: input.model ?? 'claude-sonnet-4',
    temperature: input.temperature ?? 0.2,
  });

  return {
    text: response.text,
    model: response.model,
    promptTokens: response.usage?.inputTokens,
    completionTokens: response.usage?.outputTokens,
  };
}</code></pre>
<p>The important thing is not the exact SDK syntax. It is the shape of the boundary. The rest of the app only cared that it could ask for text and get text back.</p>
<p>That kept the migration honest.</p>
<h2>What broke first</h2>
<p>Every migration has a few annoying surprises.</p>
<p>The first one was auth. Even when the API shape looks familiar, the authentication story is different. Instead of a provider API key flowing through the app, I had to make sure the Lambda execution role had the right Bedrock permissions and that the environment was using the right AWS identity.</p>
<p>The second surprise was request assumptions. Some of my tests had quietly encoded the behavior of the old provider. They were checking response formatting, token fields, or a specific error message that no longer matched Bedrock’s response shape exactly.</p>
<p>The third surprise was prompt framing. The prompt itself did not need a rewrite, but I did need to verify that the model behaved the same way with the new backend. Small differences in output style, truncation, or refusal behavior can show up even when the request format looks equivalent.</p>
<p>So I did what I usually do when a migration looks simple but not trivial: I added a few focused checks instead of trying to solve everything with one giant integration test.</p>
<h2>The gotchas I would warn someone about</h2>
<p>If you are planning a similar migration, these are the gotchas I would watch first:</p>
<ul>
<li><strong>Auth is not interchangeable.</strong> OpenAI-style request shapes do not mean the permission model is the same.</li>
<li><strong>Model names still matter.</strong> Compatibility layers reduce rewrite work, but they do not eliminate provider-specific model mapping.</li>
<li><strong>Retries should be intentional.</strong> Some failures are safe to retry. Some are configuration issues that should fail fast.</li>
<li><strong>Token usage can shift.</strong> If you rely on hard token ceilings, re-check them after the provider swap.</li>
<li><strong>Tests that overfit the old provider will lie to you.</strong> Update expectations, not just endpoints.</li>
</ul>
<p>That last one was the most annoying. The more exact a test is about provider-specific wording, the more likely it is to become a migration tax later.</p>
<h2>What I changed in the tests</h2>
<p>I did not try to preserve the old tests exactly.</p>
<p>Instead, I rewrote the tests to validate what the app actually needed to guarantee:</p>
<ul>
<li>the Lambda handler accepts a valid request</li>
<li>the client adapter sends the right prompt content</li>
<li>the response is normalized into my internal shape</li>
<li>failures are logged and surfaced properly</li>
<li>retry behavior only triggers on the right classes of errors</li>
</ul>
<p>That made the tests less brittle and more useful for the new provider.</p>
<p>I also added one or two path-specific tests for the new Bedrock branch so I could prove the migration did not just compile. It had to run through the real call path at least once in a safe environment.</p>
<h2>What improved after the migration</h2>
<p>The best part of a migration like this is not the shiny new provider. It is the reduction in mental overhead.</p>
<p>After the switch, the app felt simpler to operate because the model access now lived more naturally inside the AWS stack. I had fewer places to think about credentials, fewer pieces of provider-specific glue, and a cleaner story for who can call what.</p>
<p>That did not magically solve every problem. It did not make prompts better by itself. It did not remove the need for observability. It did not eliminate model differences.</p>
<p>But it did make the app easier to own.</p>
<p>That matters. A lot of engineering work is not about finding the perfect architecture. It is about removing avoidable complexity from the parts you have to keep living with.</p>
<h2>The rule I follow for migrations like this</h2>
<p>My rule is simple: if the provider change can be contained behind one adapter, I will usually do it. If it forces the rest of the application to become provider-aware, I slow down and ask whether the move is still worth it.</p>
<p>That is the difference between a migration and a rewrite.</p>
<p>In this case, Bedrock’s compatibility layer gave me enough surface-area overlap to keep the app intact. I changed the client, tightened the tests, checked the auth model, and kept the rest of the system steady.</p>
<p>That is exactly how I like migrations to go: small enough to verify, boring enough to trust, and useful enough to keep.</p>
<p>If you are considering a similar move, my advice is to start by isolating the model client behind a clean interface. If you do that early, the rest of the migration gets a lot easier.</p>
<p>And if you can avoid rewriting everything while still improving the stack, that is usually the best outcome.</p>