---
title: "Serverless AI Inference Endpoints with AWS Bedrock and Lambda"
slug: "serverless-ai-inference-endpoints-with-aws-bedrock-and-lambda"
brief: "I've been building AI APIs for the last year and most of them don't need a GPU server. Seriously. The majority of my inference workloads are just \"take this prompt, send it to a model, return the resu"
publishedAt: "2026-05-16T09:00:00.000Z"
readTimeInMinutes: 17
reactionCount: 0
responseCount: 0
replyCount: 0
sourceUrl: "https://web.archive.org/web/*/https://blog.harun.dev/serverless-ai-inference-endpoints-with-aws-bedrock-and-lambda"
coverImageUrl: "https://raw.githubusercontent.com/HarunRRayhan/blog-assets/main/covers/serverless-ai-inference-endpoints-with-aws-bedrock-and-lambda/cover.jpg"
tags:
  - name: "AWS"
    slug: "aws"
  - name: "serverless"
    slug: "serverless"
  - name: "AI"
    slug: "ai"
  - name: "lambda"
    slug: "lambda"
  - name: "webdev"
    slug: "webdev"
---
<p>I've been building AI APIs for the last year and most of them don't need a GPU server. Seriously. The majority of my inference workloads are just "take this prompt, send it to a model, return the result." That doesn't require a p3.2xlarge running 24/7 with CUDA drivers you need to babysit.</p>
<p>AWS Bedrock changed how I think about this. You get access to Claude, Titan, Llama, and a bunch of other models through a single API. Pay per token, zero infrastructure to manage. You don't download model weights or build container images. Just call the API and get a response.</p>
<p>In this post, I'm going to walk through building serverless AI inference endpoints using Bedrock and Lambda. We'll start with a basic inference endpoint, then add streaming for real-time responses. After that, we'll build a multi-model router that picks the right model based on the job. I'll also break down the real costs so you know exactly what you're paying.</p>
<p>If you've been wanting to add AI features to your product but the GPU infrastructure felt like too much, this one's for you. Let's get into it.</p>
<p><img src="https://images.pexels.com/photos/1424337/pexels-photo-1424337.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="AWS serverless cloud computing" />
<sub>Photo by <a href="https://www.pexels.com/@simon73">Simon Berger</a> on <a href="https://www.pexels.com/photo/blue-and-gray-sky-1424337/">Pexels</a></sub></p>
<h2>Why Bedrock Instead of Self-Hosting</h2>
<p>So here's what self-hosting actually looks like. You rent a GPU instance, download model weights (sometimes 50GB+), install CUDA, set up the inference server, and then keep all of that running and patched. A single p3.2xlarge with one NVIDIA V100 GPU costs about $3.06/hour. That's $2,200+ per month before you add EBS storage for the model weights, bandwidth for serving responses, and your own time managing the thing.</p>
<p>With Bedrock, you skip all of that. You make an API call. The model runs on AWS's infrastructure. You pay per token, and nothing when nobody's using it.</p>
<p>I can't overstate how nice it is to not deal with CUDA dependency nightmares. Or Docker images with specific GPU driver versions that break when you update the base image. Or waking up at 3 AM because your inference server OOM'd.</p>
<p>Now, self-hosting does make sense in specific situations:</p>
<ul>
<li><strong>Fine-tuned private models.</strong> If you trained a custom model that can't run on Bedrock, you're going to need your own infrastructure.</li>
<li><strong>Strict data residency.</strong> Some compliance requirements mean data can't leave certain boundaries. Bedrock might not be available in the region you need.</li>
<li><strong>Really high volume.</strong> If you're processing millions of requests per day, per-token costs on Bedrock add up. At that scale, a dedicated GPU fleet with reserved instances could work out cheaper.</li>
</ul>
<p>But for 90% of the AI APIs I've built, Bedrock wins. Model diversity, zero ops burden, and pricing that scales with actual usage. I keep coming back to it because the tradeoff just isn't close.</p>
<h2>What We're Building</h2>
<p>The architecture is straightforward. Three AWS services, wired together in the simplest way possible.</p>
<p>Here's the flow:</p>
<ol>
<li><strong>Client</strong> sends an HTTP request with a prompt (and optionally a model preference).</li>
<li><strong>API Gateway HTTP API</strong> receives the request and routes it to Lambda.</li>
<li><strong>Lambda function</strong> (Node.js 22) parses the request, constructs the Bedrock payload, and calls the model.</li>
<li><strong>Bedrock</strong> runs inference on the selected model and returns the response.</li>
<li><strong>Lambda</strong> formats the result and sends it back through API Gateway to the client.</li>
</ol>
<p>A few notes on the choices here:</p>
<ul>
<li><strong>API Gateway HTTP API</strong> for routing, not REST API. HTTP APIs are cheaper ($1/million requests vs $3.50) and have lower latency. For a simple inference endpoint, you don't need WAF or request validation at the gateway level.</li>
<li><strong>Lambda running Node.js 22</strong> handles the business logic. It parses requests, calls Bedrock, and formats responses. 256MB of memory is enough for non-streaming calls, and a 30-second timeout gives Bedrock plenty of room.</li>
<li><strong>Amazon Bedrock</strong> for model inference. We'll use Claude Sonnet 4.6 for complex tasks, Amazon Nova Lite for mid-tier work, and Nova Micro when we want the cheapest option.</li>
<li><strong>IAM role</strong> connecting Lambda to Bedrock. The function needs <code>bedrock:InvokeModel</code> and <code>bedrock:InvokeModelWithResponseStream</code> permissions.</li>
</ul>
<p>That's the whole thing. No VPC, no NAT Gateway, no load balancer. Lambda talks to Bedrock through AWS's internal network, so you don't even need internet access. Deploys in under a minute.</p>
<p>Let's build it piece by piece.</p>
<h2>IAM and Lambda Setup</h2>
<p>Before we write any application code, the Lambda function needs permission to call Bedrock. Here's the IAM policy:</p>
<pre><code class="language-json">{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": "arn:aws:bedrock:us-east-1::foundation-model/*"
    }
  ]
}
</code></pre>
<p>That <code>Resource</code> wildcard lets the function call any foundation model in Bedrock. If you want to lock it down to specific models, replace the wildcard with the model ARN. For example, <code>arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-sonnet-4-6</code> would restrict access to just Claude Sonnet 4.6.</p>
<p>You also need the standard Lambda execution role permissions for CloudWatch Logs. AWS provides the <code>AWSLambdaBasicExecutionRole</code> managed policy for that.</p>
<p>For the Lambda function itself, here's what I use:</p>
<ul>
<li><strong>Runtime:</strong> Node.js 22.x (generally available on Lambda since late 2024)</li>
<li><strong>Memory:</strong> 256MB (Bedrock does the heavy compute, not your function)</li>
<li><strong>Timeout:</strong> 30 seconds (Bedrock calls typically take 2-8 seconds, but you want headroom for complex prompts)</li>
<li><strong>Architecture:</strong> arm64 (Graviton2 is cheaper and faster for Node.js workloads)</li>
</ul>
<p>Now install the Bedrock runtime SDK:</p>
<pre><code class="language-bash">npm install @aws-sdk/client-bedrock-runtime
</code></pre>
<p>This is the client library for calling Bedrock models. It supports both synchronous invocation and streaming. The full AWS SDK v3 is modular, so you only install the packages you actually need. No bloated <code>aws-sdk</code> v2 import that adds 60MB to your deployment package.</p>
<p>One thing to note: make sure you've enabled the models you want to use in the Bedrock console. By default, most models require you to request access first. Go to the Bedrock console, click "Model access" in the sidebar, and enable the models you plan to use. Claude models typically get approved within a few minutes. Some models from other providers might take longer.</p>
<h2>Basic Inference Endpoint</h2>
<p>Here's the full Lambda handler for a basic inference endpoint. It receives a prompt from the client, calls Claude Sonnet 4.6 on Bedrock, and returns the response.</p>
<pre><code class="language-javascript">import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";

const client = new BedrockRuntimeClient({ region: "us-east-1" });
const MODEL_ID = "anthropic.claude-sonnet-4-6";

export const handler = async (event) =&gt; {
  try {
    const body = JSON.parse(event.body || "{}");
    const { prompt } = body;

    if (!prompt) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Missing prompt in request body" }),
      };
    }

    // Build the Bedrock request using Anthropic's Messages API format
    const hrr_request = {
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    };

    const command = new InvokeModelCommand({
      modelId: MODEL_ID,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify(hrr_request),
    });

    const response = await client.send(command);
    const hrr_result = JSON.parse(new TextDecoder().decode(response.body));

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: hrr_result.content[0].text,
        model: MODEL_ID,
        usage: {
          input_tokens: hrr_result.usage.input_tokens,
          output_tokens: hrr_result.usage.output_tokens,
        },
      }),
    };
  } catch (error) {
    console.error("Inference error:", JSON.stringify({
      message: error.message,
      name: error.name,
      timestamp: new Date().toISOString(),
    }));

    const statusCode = error.name === "ThrottlingException" ? 429 : 500;

    return {
      statusCode,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: statusCode === 429
          ? "Rate limit exceeded. Try again shortly."
          : "Internal inference error",
      }),
    };
  }
};
</code></pre>
<p>The client sends a POST request with this body:</p>
<pre><code class="language-json">{
  "prompt": "Explain the difference between SQL and NoSQL databases in two sentences."
}
</code></pre>
<p>And gets back:</p>
<pre><code class="language-json">{
  "text": "SQL databases use structured tables with predefined schemas and are ideal for complex queries and transactions, while NoSQL databases use flexible document, key-value, or graph formats that scale horizontally for unstructured data. Choose SQL when you need ACID compliance and relational integrity, and NoSQL when you need schema flexibility and massive read/write throughput.",
  "model": "anthropic.claude-sonnet-4-6",
  "usage": {
    "input_tokens": 18,
    "output_tokens": 73
  }
}
</code></pre>
<p>A few things worth pointing out. The <code>BedrockRuntimeClient</code> lives outside the handler so it gets reused across warm Lambda invocations. Creating a new client on every request wastes time and memory.</p>
<p>The <code>anthropic_version</code> field in the request body is required for Claude models on Bedrock. Without it, you'll get a cryptic 400 error. I wasted 20 minutes on that one.</p>
<p>I also return the token usage in the response. This is super useful for tracking costs and debugging. If a request is expensive, you can see exactly how many tokens it consumed.</p>
<p>The error handling catches <code>ThrottlingException</code> specifically and returns a 429 status. Bedrock has per-model rate limits, and if you hit them, you want the client to know it should retry with backoff instead of treating it as a server error.</p>
<p><img src="https://images.pexels.com/photos/4164418/pexels-photo-4164418.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="Developer writing Lambda function code" />
<sub>Photo by <a href="https://www.pexels.com/@antonio-batinic-2573434">Antonio Batinić</a> on <a href="https://www.pexels.com/photo/black-screen-with-code-4164418/">Pexels</a></sub></p>
<h2>Streaming Responses</h2>
<p>For longer responses, waiting 5-10 seconds for the full completion to come back is a bad user experience. Streaming lets you send tokens to the client as they're generated, so the user sees text appearing in real time.</p>
<p>But here's the thing. API Gateway doesn't support streaming responses. It's a synchronous request/response model with a hard 29-second timeout. The response has to be fully buffered before it gets sent back to the client.</p>
<p>Lambda Function URLs solve this. When you set <code>InvokeMode: RESPONSE_STREAM</code>, the function can write chunks to a response stream that gets sent to the client progressively. No API Gateway in the middle.</p>
<p>Here's the streaming handler:</p>
<pre><code class="language-javascript">import {
  BedrockRuntimeClient,
  InvokeModelWithResponseStreamCommand,
} from "@aws-sdk/client-bedrock-runtime";

const client = new BedrockRuntimeClient({ region: "us-east-1" });
const MODEL_ID = "anthropic.claude-sonnet-4-6";

export const handler = awslambda.streamifyResponse(
  async (event, responseStream, _context) =&gt; {
    const body = JSON.parse(event.body || "{}");
    const { prompt } = body;

    // Set the content type for the stream
    const metadata = {
      statusCode: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    };
    responseStream = awslambda.HttpResponseStream.from(responseStream, metadata);

    const hrr_request = {
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    };

    const command = new InvokeModelWithResponseStreamCommand({
      modelId: MODEL_ID,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify(hrr_request),
    });

    try {
      const response = await client.send(command);

      for await (const event of response.body) {
        if (event.chunk) {
          const chunk = JSON.parse(
            new TextDecoder().decode(event.chunk.bytes)
          );

          if (chunk.type === "content_block_delta") {
            const text = chunk.delta?.text || "";
            responseStream.write(
              `data: ${JSON.stringify({ text })}\n\n`
            );
          }

          if (chunk.type === "message_stop") {
            responseStream.write("data: [DONE]\n\n");
          }
        }
      }
    } catch (error) {
      responseStream.write(
        `data: ${JSON.stringify({ error: "Stream error" })}\n\n`
      );
    }

    responseStream.end();
  }
);
</code></pre>
<p>The key here is <code>InvokeModelWithResponseStreamCommand</code>. Instead of waiting for the entire response, Bedrock sends back a stream of events. Each event contains a chunk of the model's output. We iterate over these chunks with a <code>for await</code> loop and write each text delta to the Lambda response stream.</p>
<p>On the client side, consuming this stream is simple with the Fetch API:</p>
<pre><code class="language-javascript">const response = await fetch("https://your-function-url.lambda-url.us-east-1.on.aws/", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ prompt: "Write a haiku about serverless" }),
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const text = decoder.decode(value);
  const lines = text.split("\n\n").filter(Boolean);

  for (const line of lines) {
    if (line === "data: [DONE]") break;
    const data = JSON.parse(line.replace("data: ", ""));
    process.stdout.write(data.text); // or append to your UI
  }
}
</code></pre>
<p>This gives you the same streaming experience you see in ChatGPT or Claude's web interface. Tokens appear one by one as the model generates them. For a chatbot or any interactive AI feature, this is basically required. Users don't want to stare at a spinner for 8 seconds.</p>
<p>One tradeoff: Lambda Function URLs don't give you the same routing capabilities as API Gateway. If you need both streaming and non-streaming endpoints, you can use a Function URL for the streaming handler and API Gateway for everything else. That's exactly what I do.</p>
<h2>Multi-Model Routing</h2>
<p>Not every request needs the most expensive model. A simple text classification doesn't need Claude Sonnet. A complex multi-step reasoning task shouldn't go to Nova Lite. The trick is routing each request to the right model based on the task.</p>
<p>Here's how I handle this. The client sends a <code>model</code> parameter in the request body, and the handler maps it to the appropriate Bedrock model ID and request format.</p>
<pre><code class="language-javascript">const MODEL_MAP = {
  "claude-sonnet": {
    modelId: "anthropic.claude-sonnet-4-6",
    buildRequest: (prompt, maxTokens) =&gt; ({
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    }),
    parseResponse: (body) =&gt; body.content[0].text,
  },
  "nova-lite": {
    // Amazon Nova Lite: Amazon's fast, cheap model (replaced Titan Text)
    modelId: "amazon.nova-lite-v1:0",
    buildRequest: (prompt, maxTokens) =&gt; ({
      messages: [
        {
          role: "user",
          content: [{ text: prompt }],
        },
      ],
      inferenceConfig: {
        maxTokens,
        temperature: 0.7,
      },
    }),
    parseResponse: (body) =&gt; body.output.message.content[0].text,
  },
  "nova-micro": {
    // Text-only, cheapest Nova model (~$0.035/$0.14 per million tokens)
    modelId: "amazon.nova-micro-v1:0",
    buildRequest: (prompt, maxTokens) =&gt; ({
      messages: [
        {
          role: "user",
          content: [{ text: prompt }],
        },
      ],
      inferenceConfig: {
        maxTokens,
        temperature: 0.7,
      },
    }),
    parseResponse: (body) =&gt; body.output.message.content[0].text,
  },
};

export const handler = async (event) =&gt; {
  const body = JSON.parse(event.body || "{}");
  const { prompt, model = "claude-sonnet", max_tokens = 1024 } = body;

  const hrr_modelConfig = MODEL_MAP[model];

  if (!hrr_modelConfig) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: `Unknown model: ${model}. Available: ${Object.keys(MODEL_MAP).join(", ")}`,
      }),
    };
  }

  const hrr_request = hrr_modelConfig.buildRequest(prompt, max_tokens);

  const command = new InvokeModelCommand({
    modelId: hrr_modelConfig.modelId,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify(hrr_request),
  });

  const response = await client.send(command);
  const hrr_result = JSON.parse(new TextDecoder().decode(response.body));
  const text = hrr_modelConfig.parseResponse(hrr_result);

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, model: hrr_modelConfig.modelId }),
  };
};
</code></pre>
<p>Claude and Nova share similar request shapes, which is nicer than the old days of dealing with Titan's completely different format. Claude needs <code>anthropic_version</code> in the body. Nova uses a <code>messages</code> array where content is wrapped in <code>[{ text: prompt }]</code> and config goes in <code>inferenceConfig</code>. The <code>MODEL_MAP</code> abstracts the differences so the handler code stays clean.</p>
<p>Nova Micro and Nova Lite use the exact same request format, just different model IDs. That makes it easy to swap between them if your cost or quality needs change.</p>
<p>When should you use each model?</p>
<ul>
<li><strong>Claude Sonnet 4.6</strong> for complex reasoning, code generation, analysis, and anything that needs high accuracy. 1M token context window, approaches Opus-level intelligence. It's the most capable on Bedrock right now.</li>
<li><strong>Amazon Nova Lite</strong> for mid-tier tasks: summarization, document analysis, and anything multimodal (it handles images and video too). $0.06/$0.24 per million tokens.</li>
<li><strong>Amazon Nova Micro</strong> for high-volume, text-only tasks where cost matters most. No image support, but at ~$0.035/$0.14 per million tokens it's the cheapest model on Bedrock.</li>
</ul>
<p>A quick note on throughput. By default, Bedrock uses on-demand pricing. You just call the API and pay per token. If you have a predictable, high-volume workload, look into Provisioned Throughput. You reserve model capacity and get a guaranteed number of tokens per minute. For most use cases though, on-demand is the right starting point. You can always switch later.</p>
<h2>Cold Starts and Cost Breakdown</h2>
<p>Let's talk about the real numbers, because pricing for AI inference can get confusing fast.</p>
<h3>Cold Start Behavior</h3>
<p>The Lambda cold start itself is pretty standard for Node.js: 200-400ms without a VPC. Since we're calling Bedrock over HTTPS (not through a VPC endpoint), there's no VPC attachment delay. But the first Bedrock call from a new Lambda instance can add 300-800ms on top of that. This seems to be Bedrock warming up the connection on its end. Subsequent calls from the same Lambda instance are much faster.</p>
<p>So your worst case is about 1.2 seconds for a cold Lambda and first Bedrock call. Warm invocations with a warm Bedrock connection run in 2-8 seconds depending on the model and response length. That's the model thinking, not infrastructure overhead.</p>
<p>If cold starts matter for your use case, Lambda provisioned concurrency keeps instances warm. One provisioned instance at 256MB costs about $3/month. For an AI inference endpoint where users are waiting for a response, that's a worthwhile investment.</p>
<h3>Bedrock Token Pricing</h3>
<p>Here's what the models cost as of early 2026:</p>
<ul>
<li><strong>Claude Sonnet 4.6:</strong> $3.00 per million input tokens, $15.00 per million output tokens (2x input / 1.5x output for prompts over 200K tokens)</li>
<li><strong>Amazon Nova Lite:</strong> $0.06 per million input tokens, $0.24 per million output tokens</li>
<li><strong>Amazon Nova Micro:</strong> $0.035 per million input tokens, $0.14 per million output tokens</li>
</ul>
<h3>Real Cost Math: 1M Requests Per Month</h3>
<p>Let's say you're handling 1 million requests per month. Each request averages 500 input tokens and 200 output tokens. Here's what that looks like with Claude Sonnet:</p>
<ul>
<li>Input cost: 1,000,000 requests × 500 tokens / 1,000,000 × $3.00 = <strong>$1,500</strong></li>
<li>Output cost: 1,000,000 requests × 200 tokens / 1,000,000 × $15.00 = <strong>$3,000</strong></li>
<li><strong>Bedrock total: $4,500/month</strong></li>
</ul>
<p>Add the infrastructure costs:</p>
<ul>
<li>Lambda (256MB, avg 3s execution): ~$6.25/month</li>
<li>API Gateway HTTP API: ~$1.00/month (at $1/million requests)</li>
<li><strong>Infrastructure total: ~$7.25/month</strong></li>
</ul>
<p><strong>Grand total: ~$4,507/month for 1M requests with Claude Sonnet.</strong></p>
<p>Compare that to self-hosting on a p3.2xlarge at $2,200/month. The GPU instance is cheaper at this volume, but it can only handle about 1M requests if your inference server is well-optimized. And you pay that $2,200 whether you get 1M requests or zero.</p>
<p>At lower traffic, the math changes dramatically. At 100K requests/month, Bedrock costs drop to ~$450. At 10K requests/month, you're looking at ~$45. A GPU instance still costs $2,200.</p>
<p>That's the real advantage. At zero traffic, you pay zero. Try saying that about a GPU server.</p>
<p>For the multi-model routing setup, you save a lot more. Route simple tasks to Nova Micro and only use Claude for the complex stuff. If 70% of your requests go to Nova Micro and 30% need Claude Sonnet, your monthly Bedrock bill at 1M requests drops from $4,500 to around $400. That's a 90% cost reduction just from routing.</p>
<h2>Wrapping Up</h2>
<p>Bedrock takes the entire GPU infrastructure problem off your plate. You call an API, get AI inference, and pay for what you use. Lambda handles compute scaling automatically. Together they let you build production AI endpoints without touching a single piece of infrastructure. It's honestly the easiest way I've found to ship AI features.</p>
<p>The patterns we covered handle most AI API use cases I've run into. The basic endpoint works for any synchronous inference call. Streaming gives your users that real-time typing experience. The multi-model router lets you make smart tradeoffs between cost and quality depending on what the task actually needs.</p>
<p>If I were starting a new AI feature tomorrow, this is exactly the stack I'd reach for. Get the product working first. Validate that users actually want it. Then worry about optimization later. Bedrock's on-demand pricing means you can experiment without any commitment, and if nobody uses the feature, it costs you nothing.</p>
<p>Hope you enjoyed this one. If you're building AI features on AWS or have questions about Bedrock pricing and model selection, I'd love to hear about it.</p>
<hr />
<p><em>Follow me on <a href="https://x.com/HarunRRayhan">Twitter/X</a> for more posts about AWS, serverless, and building AI-powered products. I share the stuff that actually works in production.</em></p>
<p><img src="https://images.pexels.com/photos/574069/pexels-photo-574069.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="Developer working at laptop" />
<sub>Photo by <a href="https://www.pexels.com/@goumbik">Lukas Blazek</a> on <a href="https://www.pexels.com/photo/laptop-computer-showing-c-application-574069/">Pexels</a></sub></p>
