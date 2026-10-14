---
title: "WebSocket AI Chat with Lambda, API Gateway, and Bedrock"
slug: "real-time-ai-chat-with-lambda-api-gateway-websockets"
brief: "Stream Bedrock tokens to the browser over API Gateway WebSockets with three Lambda functions and DynamoDB, plus the 410 GoneException fix and real costs."
publishedAt: "2026-03-19T13:17:42.184Z"
readTimeInMinutes: 16
reactionCount: 0
responseCount: 0
replyCount: 0
sourceUrl: "https://web.archive.org/web/*/https://blog.harun.dev/real-time-ai-chat-with-lambda-api-gateway-websockets"
coverImageUrl: "/blog-assets/real-time-ai-chat-with-lambda-api-gateway-websockets/cover.jpg"
tags:
  - name: "AWS"
    slug: "aws"
  - name: "Serverless"
    slug: "serverless"
  - name: "AI"
    slug: "ai"
  - name: "Websockets"
    slug: "websockets"
  - name: "Nodejs"
    slug: "nodejs"
---
<p>I built a ChatGPT-style streaming chat UI and the entire backend is three Lambda functions and a DynamoDB table. That's it. The whole real-time backend fits in about 150 lines of TypeScript, and there's nothing to keep running between conversations.</p>
<p>If you've tried building real-time AI chat with regular HTTP endpoints, you already know the pain. The user sends a message, your Lambda calls Bedrock, Bedrock thinks for 5 to 10 seconds, and the user stares at a loading spinner until the full response comes back. It works, but it feels awful. Every modern AI chat product streams tokens as they're generated. Users expect to see text appearing word by word, not a wall of text after an awkward silence.</p>
<p>REST and HTTP don't cut it here. You need a persistent, bidirectional connection. That's exactly what WebSockets give you. The client opens a connection once, and both sides can send messages at any time. When Bedrock generates a token, you push it to the client immediately. When the user wants to cancel or send a follow-up, they can do that without opening a new connection.</p>
<p>If you haven't worked with Bedrock before, I wrote a full post on <a href="https://harun.dev/blog/serverless-ai-inference-endpoints-with-aws-bedrock-and-lambda">Serverless AI Inference Endpoints with AWS Bedrock and Lambda</a> that covers the fundamentals. This post builds on those concepts and adds the real-time layer on top. Let's get into it.</p>
<p><strong>Short answer:</strong> Create an API Gateway WebSocket API with <code>$connect</code>, <code>$disconnect</code>, and <code>sendMessage</code> routes, each backed by its own Lambda, and keep connection IDs and chat history in DynamoDB. The <code>sendMessage</code> Lambda streams from Bedrock with <code>InvokeModelWithResponseStreamCommand</code> and pushes each token to the browser with <code>PostToConnectionCommand</code>. Catch the 410 <code>GoneException</code> so you stop paying for tokens after the user leaves.</p>
<p><img src="https://images.pexels.com/photos/7343000/pexels-photo-7343000.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="Real-time chat application interface" />
<sub>Photo by <a href="https://www.pexels.com/@cottonbro">cottonbro studio</a> on <a href="https://www.pexels.com/photo/person-using-smartphone-7343000/">Pexels</a></sub></p>
<h2>Why WebSockets Over HTTP Streaming</h2>
<p>When I first started thinking about real-time streaming, I tried the obvious approach. Polling. Just have the client ask the server &quot;anything new?&quot; every second or so. For a dashboard that updates every few minutes, polling is fine. But for streaming AI chat where tokens arrive dozens of times per second? It's a disaster. Most requests come back empty, you're burning through Lambda invocations like crazy, and the latency between tokens makes the experience feel sluggish.</p>
<p>So I looked at <strong>Server-Sent Events (SSE)</strong> next. I actually used SSE with Lambda Function URLs in my Bedrock Lambda post, and it worked great for that use case. A single request goes in, and tokens stream back. Clean and simple. The problem shows up when you want a real conversation. SSE only flows one direction, server to client. If the user wants to cancel a generation mid-stream or send a follow-up message, you need a whole separate HTTP connection for that. It starts feeling like a workaround pretty fast.</p>
<p><strong>WebSockets through API Gateway</strong> turned out to be what I actually needed. Full duplex. Both sides can send messages whenever they want over a single connection. API Gateway gives you built-in route handling for <code>$connect</code>, <code>$disconnect</code>, and custom routes like <code>sendMessage</code>, so you're not running a WebSocket server yourself. It takes care of connection management, scaling, and TLS termination. You just write the Lambda handlers and let API Gateway deal with the rest.</p>
<p>It's cheap, too. $1 per million connection minutes and $0.80 per million messages. For chat sessions that last a couple minutes each, you're talking about fractions of a cent per user. The part I really like is that when nobody is chatting at 3 AM, you pay literally nothing. An EC2 instance running a Node.js WebSocket server doesn't care if zero people are connected. It still costs you $30/month to sit there idle.</p>
<p>The way API Gateway structures WebSocket APIs is also a natural fit. You define routes, not endpoints. There's a <code>$connect</code> route that fires when someone opens a connection, a <code>$disconnect</code> route for when they leave, and then custom routes like <code>sendMessage</code> for your actual business logic. Each route points to its own Lambda function. So the connect handler can be a tiny 50ms function that just writes a connection ID to DynamoDB, while the message handler gets its own memory and timeout settings for the heavier Bedrock work. You're not cramming everything into one monolithic server process.</p>
<h2>Architecture Overview</h2>
<p>When a client opens a WebSocket connection to your <code>wss://</code> endpoint, everything kicks off from there. API Gateway accepts the connection and fires the <code>$connect</code> Lambda, which stores the connection ID in DynamoDB. Now the connection is live.</p>
<p>When the user types a message and hits send, the client sends a JSON payload over the WebSocket. API Gateway routes it to the <code>$sendMessage</code> Lambda based on the <code>action</code> field in the body. This Lambda loads the conversation history from DynamoDB, calls Bedrock with the full message context, and streams the response. As each token comes back from Bedrock, the Lambda pushes it to the client using API Gateway's Management API and the <code>postToConnection</code> call. When the user closes the tab or the connection drops, the <code>$disconnect</code> Lambda fires and removes the connection from DynamoDB.</p>
<pre><code>Client
  │  wss://
  ▼
API Gateway WebSocket API
  ├── $connect     → Lambda (store connectionId in DynamoDB)
  ├── $disconnect  → Lambda (delete connectionId from DynamoDB)
  └── $sendMessage → Lambda → Bedrock (stream) → postToConnection()
                                                        │
                                               DynamoDB (sessions)
</code></pre>
<p>The <code>$connect</code> and <code>$disconnect</code> handlers are barely worth their own files. One DynamoDB write, one DynamoDB delete, done. All the real complexity lives in <code>$sendMessage</code>, which is responsible for loading conversation history, calling Bedrock, streaming the response, and pushing tokens back to the client through the WebSocket.</p>
<p>DynamoDB serves double duty here. It stores active connection IDs so the system knows which connections are alive, and it stores conversation history so each message has the full context of the chat. The connection record has a TTL of 24 hours, which automatically cleans up stale entries if a client disconnects without properly closing the WebSocket (like when someone's laptop goes to sleep or their browser crashes).</p>
<p>Every component here runs on its own scaling path. API Gateway can handle millions of concurrent WebSocket connections while Lambda spins up handlers based on demand, and DynamoDB adjusts its read/write capacity automatically with on-demand billing. You never provision anything.</p>
<p><img src="https://images.pexels.com/photos/2881229/pexels-photo-2881229.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="Cloud architecture diagram showing WebSocket flow" />
<sub>Photo by <a href="https://www.pexels.com/@brett-sayles">Brett Sayles</a> on <a href="https://www.pexels.com/photo/cables-connected-on-server-2881229/">Pexels</a></sub></p>
<h2>Connection Management with DynamoDB</h2>
<p>Let's start building. First, the infrastructure. Here's the SAM template for the WebSocket API and the DynamoDB table:</p>
<pre><code class="language-yaml">AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Resources:
  HrrWebSocketApi:
    Type: AWS::ApiGatewayV2::Api
    Properties:
      Name: hrr-chat-ws
      ProtocolType: WEBSOCKET
      RouteSelectionExpression: &quot;$request.body.action&quot;

  HrrConnectionsTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: hrr-chat-connections
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: connectionId
          AttributeType: S
      KeySchema:
        - AttributeName: connectionId
          KeyType: HASH
      TimeToLiveSpecification:
        AttributeName: ttl
        Enabled: true
</code></pre>
<p>The <code>RouteSelectionExpression</code> tells API Gateway to look at the <code>action</code> field in incoming JSON messages to decide which route to invoke. So when the client sends <code>{ &quot;action&quot;: &quot;sendMessage&quot;, &quot;message&quot;: &quot;Hello&quot; }</code>, API Gateway matches that to the <code>sendMessage</code> route and fires the corresponding Lambda.</p>
<p>The DynamoDB table is as simple as it gets. One partition key on <code>connectionId</code>, pay-per-request billing, and TTL enabled. TTL is important here. WebSocket connections can go stale in all sorts of ways. The user's browser crashes, their WiFi drops, they close the laptop lid. In those cases, the <code>$disconnect</code> route might never fire. Without TTL, you'd accumulate dead connection records forever. Setting a 24-hour TTL means DynamoDB automatically deletes any connection record that hasn't been refreshed in a day.</p>
<p>Now here's the <code>$connect</code> handler:</p>
<pre><code class="language-typescript">import { DynamoDBClient } from &quot;@aws-sdk/client-dynamodb&quot;;
import { DynamoDBDocumentClient, PutCommand } from &quot;@aws-sdk/lib-dynamodb&quot;;

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler = async (event: any) =&gt; {
  const connectionId = event.requestContext.connectionId;
  const ttl = Math.floor(Date.now() / 1000) + 86400; // 24h TTL

  await dynamo.send(new PutCommand({
    TableName: process.env.CONNECTIONS_TABLE,
    Item: {
      connectionId,
      ttl,
      connectedAt: new Date().toISOString(),
    },
  }));

  return { statusCode: 200 };
};
</code></pre>
<p>When a client opens a WebSocket connection, API Gateway generates a unique <code>connectionId</code> and passes it in the event. We store that ID in DynamoDB along with a TTL set to 24 hours from now and a timestamp. The TTL value is a Unix epoch in seconds because that's what DynamoDB expects.</p>
<p>Returning <code>{ statusCode: 200 }</code> tells API Gateway to accept the connection. If you return a non-2xx status, the WebSocket handshake fails and the client gets rejected. This is where you'd add authentication if you needed it. Check a token, validate an API key, whatever your auth flow requires. If the check fails, return a 401 and the connection never opens.</p>
<p>And the <code>$disconnect</code> handler:</p>
<pre><code class="language-typescript">import { DynamoDBClient } from &quot;@aws-sdk/client-dynamodb&quot;;
import { DynamoDBDocumentClient, DeleteCommand } from &quot;@aws-sdk/lib-dynamodb&quot;;

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler = async (event: any) =&gt; {
  const connectionId = event.requestContext.connectionId;

  await dynamo.send(new DeleteCommand({
    TableName: process.env.CONNECTIONS_TABLE,
    Key: { connectionId },
  }));

  return { statusCode: 200 };
};
</code></pre>
<p>This one just deletes the connection record when the client disconnects cleanly. If the client doesn't disconnect cleanly, the TTL handles cleanup automatically. Between TTL and the <code>$disconnect</code> handler, you never have to worry about orphaned connection records piling up.</p>
<h2>The sendMessage Handler and Bedrock Streaming</h2>
<p>This handler is where everything actually happens. When a user sends a message, it parses the incoming payload, calls Bedrock with streaming turned on, pushes each token back through the WebSocket as it arrives, and saves the conversation to DynamoDB so the next message has full context.</p>
<p>Here's the full handler:</p>
<pre><code class="language-typescript">import { DynamoDBClient } from &quot;@aws-sdk/client-dynamodb&quot;;
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from &quot;@aws-sdk/lib-dynamodb&quot;;
import { BedrockRuntimeClient, InvokeModelWithResponseStreamCommand } from &quot;@aws-sdk/client-bedrock-runtime&quot;;
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from &quot;@aws-sdk/client-apigatewaymanagementapi&quot;;

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const bedrock = new BedrockRuntimeClient({ region: &quot;us-east-1&quot; });

export const handler = async (event: any) =&gt; {
  const { connectionId, domainName, stage } = event.requestContext;
  const body = JSON.parse(event.body);
  const userMessage = body.message as string;

  const endpoint = `https://${domainName}/${stage}`;
  const apigw = new ApiGatewayManagementApiClient({ endpoint });

  // Load chat history from DynamoDB
  const { Item } = await dynamo.send(new GetCommand({
    TableName: process.env.CONNECTIONS_TABLE,
    Key: { connectionId },
  }));

  const history = Item?.messages ?? [];
  const messages = [
    ...history,
    { role: &quot;user&quot;, content: userMessage },
  ];

  // Stream from Bedrock
  const bedrockResp = await bedrock.send(new InvokeModelWithResponseStreamCommand({
    modelId: &quot;anthropic.claude-sonnet-4-6&quot;,
    contentType: &quot;application/json&quot;,
    accept: &quot;application/json&quot;,
    body: JSON.stringify({
      anthropic_version: &quot;bedrock-2023-05-31&quot;,
      max_tokens: 2048,
      messages,
    }),
  }));

  let fullResponse = &quot;&quot;;

  for await (const chunk of bedrockResp.body!) {
    if (chunk.chunk?.bytes) {
      const decoded = JSON.parse(Buffer.from(chunk.chunk.bytes).toString(&quot;utf-8&quot;));
      if (decoded.type === &quot;content_block_delta&quot; &amp;&amp; decoded.delta?.text) {
        const token = decoded.delta.text;
        fullResponse += token;

        try {
          await apigw.send(new PostToConnectionCommand({
            ConnectionId: connectionId,
            Data: Buffer.from(JSON.stringify({ type: &quot;token&quot;, text: token })),
          }));
        } catch (err: any) {
          if (err.statusCode === 410) {
            // Client disconnected mid-stream, stop early
            console.log(&quot;Client disconnected, stopping stream&quot;);
            break;
          }
          throw err;
        }
      }
    }
  }

  // Send done signal
  await apigw.send(new PostToConnectionCommand({
    ConnectionId: connectionId,
    Data: Buffer.from(JSON.stringify({ type: &quot;done&quot; })),
  }));

  // Persist conversation to DynamoDB
  await dynamo.send(new UpdateCommand({
    TableName: process.env.CONNECTIONS_TABLE,
    Key: { connectionId },
    UpdateExpression: &quot;SET messages = :msgs&quot;,
    ExpressionAttributeValues: {
      &quot;:msgs&quot;: [
        ...messages,
        { role: &quot;assistant&quot;, content: fullResponse },
      ],
    },
  }));

  return { statusCode: 200 };
};
</code></pre>
<p>The key thing that makes this feel like a real-time server is the <code>ApiGatewayManagementApiClient</code>. You build the endpoint URL from <code>domainName</code> and <code>stage</code> in the request context, and then <code>PostToConnectionCommand</code> lets you push data to a specific connection by its ID. You're not responding to an HTTP request here. You're actively sending messages to a client over a connection that's already open. The Bedrock streaming part works the same way. <code>InvokeModelWithResponseStreamCommand</code> gives you an async iterable, and each chunk with <code>type: &quot;content_block_delta&quot;</code> carries a piece of the response in <code>delta.text</code>. We accumulate those into <code>fullResponse</code> and push each one to the client as it arrives.</p>
<p>Now, the 410 <code>GoneException</code> is the one that will catch you off guard in production. Someone closes their browser tab while Bedrock is still generating, or their phone loses signal in an elevator, and suddenly your <code>PostToConnectionCommand</code> throws a 410. If you don't catch that, your Lambda keeps calling Bedrock and trying to push tokens into a dead connection. You're paying for model inference that nobody will ever see. Catching the 410 and breaking out of the loop saves you real money. Anything that's not a 410 gets re-thrown because that's an actual problem you want to know about.</p>
<p>Once the stream wraps up, we save the full conversation back to DynamoDB so the next message has context. I noticed pretty quickly during testing that without this step, every message felt like talking to someone with amnesia. The model had zero memory of what you'd just asked two seconds ago. One thing I ran into later: DynamoDB items cap at 400KB. For most chat sessions that's more than enough, but a really long back-and-forth conversation can eventually bump into that limit. If you're building something where users might have hour-long sessions, you'd want to paginate the history or trim older messages.</p>
<h2>Client-Side WebSocket Integration</h2>
<p>The backend is done. Now let's wire up the client. Here's a simple JavaScript class that connects to the WebSocket, sends messages, handles streaming tokens, and reconnects automatically if the connection drops.</p>
<pre><code class="language-javascript">class HrrChatClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.onToken = null;
    this.onDone = null;
    this.reconnectDelay = 1000;
  }

  connect() {
    this.ws = new WebSocket(this.wsUrl);

    this.ws.onopen = () =&gt; {
      console.log(&quot;Connected&quot;);
      this.reconnectDelay = 1000;
    };

    this.ws.onmessage = (event) =&gt; {
      const data = JSON.parse(event.data);
      if (data.type === &quot;token&quot;) {
        this.onToken?.(data.text);
      } else if (data.type === &quot;done&quot;) {
        this.onDone?.();
      }
    };

    this.ws.onclose = () =&gt; {
      console.log(&quot;Disconnected, reconnecting in&quot;, this.reconnectDelay, &quot;ms&quot;);
      setTimeout(() =&gt; {
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
        this.connect();
      }, this.reconnectDelay);
    };
  }

  send(message) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ action: &quot;sendMessage&quot;, message }));
    }
  }
}

// Usage
const client = new HrrChatClient(&quot;wss://your-api-id.execute-api.us-east-1.amazonaws.com/prod&quot;);
client.onToken = (text) =&gt; {
  document.getElementById(&quot;response&quot;).textContent += text;
};
client.onDone = () =&gt; {
  console.log(&quot;Stream complete&quot;);
};
client.connect();
</code></pre>
<p>The <code>action: &quot;sendMessage&quot;</code> field in the JSON payload is doing more work than it looks like. That's the field API Gateway checks against the <code>RouteSelectionExpression</code> we configured earlier (<code>$request.body.action</code>). I actually forgot to include it in my first version and spent an embarrassing 20 minutes wondering why API Gateway kept returning route errors. Without it, your message just falls into the void or hits a <code>$default</code> route you probably haven't set up.</p>
<p>On the receiving side, the <code>type</code> field tells you whether you're getting a streaming token or a &quot;done&quot; signal, and your UI needs to handle both differently. In a real chat interface you'd be appending each token to a specific message bubble rather than dumping everything into one div. The done signal is where you'd re-enable the send button, hide the typing indicator, whatever makes sense for your UX. The reconnection logic uses exponential backoff starting at 1 second and doubling up to 30 seconds, which resets when a connection actually succeeds. I kept this simple on purpose. You could get fancier with jitter or connection-state tracking, but this covers the common case where someone's WiFi blips for a few seconds and the client quietly reconnects without the user even noticing.</p>
<h2>Deployment and Cost Breakdown</h2>
<p>Let's deploy the whole thing with SAM and then look at what it actually costs to run.</p>
<pre><code class="language-bash"># Build and deploy
sam build
sam deploy --guided \
  --stack-name hrr-chat-websocket \
  --capabilities CAPABILITY_IAM \
  --region us-east-1
</code></pre>
<p>SAM will create the WebSocket API, the three Lambda functions, the DynamoDB table, and all the IAM roles. After deployment, it outputs the WebSocket URL. That's your <code>wss://</code> endpoint.</p>
<p>Your Lambda execution role needs these IAM permissions:</p>
<pre><code class="language-yaml">HrrChatFunctionPolicy:
  Type: AWS::IAM::Policy
  Properties:
    PolicyName: hrr-chat-permissions
    PolicyDocument:
      Version: &quot;2012-10-17&quot;
      Statement:
        - Effect: Allow
          Action:
            - bedrock:InvokeModelWithResponseStream
          Resource: &quot;arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-sonnet-4-6&quot;
        - Effect: Allow
          Action:
            - dynamodb:GetItem
            - dynamodb:PutItem
            - dynamodb:UpdateItem
            - dynamodb:DeleteItem
          Resource: !GetAtt HrrConnectionsTable.Arn
        - Effect: Allow
          Action:
            - execute-api:ManageConnections
          Resource: !Sub &quot;arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${HrrWebSocketApi}/*&quot;
</code></pre>
<p>The <code>execute-api:ManageConnections</code> permission is the one people always forget. Without it, the <code>PostToConnectionCommand</code> call fails with an access denied error. This permission lets your Lambda push messages back through the WebSocket connection.</p>
<p>Let's say you're running 100,000 chat sessions per month with about 10 messages per session, so 1 million messages total. API Gateway charges $1 per million connection minutes, and if your average session lasts 2 minutes, that's 200K connection minutes for about $0.20. The messages cost more because you're pushing a lot of individual tokens back to the client. Even if you batch 5 tokens per push, 1M user messages plus roughly 100M token pushes lands around $80 at $0.80 per million messages. Lambda is surprisingly cheap here. The connect and disconnect handlers are so lightweight (50ms, 128MB) that 200K invocations barely registers, under a dime. The sendMessage handler runs longer at about 3 seconds per invocation with 512MB, but 1M invocations still comes out to roughly $12/month. DynamoDB on-demand adds maybe $3 for the reads and writes.</p>
<p>Bedrock is where your real money goes. Claude Sonnet 4.6 at $3 per million input tokens and $15 per million output tokens means your model costs dwarf everything else combined. The serverless infrastructure is practically a rounding error next to Bedrock pricing. That's actually why this architecture makes so much sense. If you ran your own WebSocket server on EC2, you'd need at least two t3.medium instances for redundancy at $60/month, an ALB at $16/month base cost, and you'd cap out around 10,000 concurrent connections before needing to scale horizontally. All that operational overhead, and it wouldn't reduce your Bedrock bill by a single cent. API Gateway handles millions of concurrent connections without you thinking about it.</p>
<p><img src="https://images.pexels.com/photos/5480781/pexels-photo-5480781.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="Cloud server room and computing cost" />
<sub>Photo by <a href="https://www.pexels.com/@brett-sayles">Brett Sayles</a> on <a href="https://www.pexels.com/photo/server-racks-on-data-center-5480781/">Pexels</a></sub></p>
<h2>Wrapping Up</h2>
<p>This whole backend is surprisingly little code for what it does. The boring parts, tracking who's connected and cleaning up after them, take maybe 20 lines total. The sendMessage handler is where the actual product lives, pulling in conversation history from DynamoDB, streaming Bedrock's response, and pushing tokens to the client in real time. TTL on the connection records means you don't even have to worry about cleanup when someone's laptop dies mid-conversation.</p>
<p>If you're new to Bedrock and want to understand the inference side before adding WebSockets on top, I wrote about that in my post on <a href="https://harun.dev/blog/serverless-ai-inference-endpoints-with-aws-bedrock-and-lambda">Serverless AI Inference Endpoints with AWS Bedrock and Lambda</a>. It covers basic invocation, streaming responses, multi-model routing, and cost breakdown. Those patterns feed directly into the <code>$sendMessage</code> handler we built here.</p>
<p>You can start small with this. Deploy it, wire up a basic HTML page, and have a working conversation with Claude through your own WebSocket backend. Once that's running, layer on whatever you need. Authentication, persistent conversation history, typing indicators. The core architecture doesn't change.</p>
<p>If a reply needs several model calls before anything streams back, I'd move those steps into <a href="/blog/step-functions-llm-orchestration-replacing-lambda-chains">Step Functions instead of chaining Lambdas</a> and keep <code>sendMessage</code> focused on streaming.</p>
<h2>FAQ</h2>
<h3>Why use WebSockets instead of SSE for AI chat on Lambda?</h3>
<p>SSE only flows from server to client. Cancelling a generation or sending a follow-up needs a separate HTTP request. An API Gateway WebSocket is full duplex, so both sides send messages over one connection, and API Gateway handles connection management, scaling, and TLS.</p>
<h3>How does a Lambda send messages back over an API Gateway WebSocket?</h3>
<p>Build an <code>ApiGatewayManagementApiClient</code> with the endpoint <code>https://${domainName}/${stage}</code> from the request context, then call <code>PostToConnectionCommand</code> with the connection ID. The Lambda role needs <code>execute-api:ManageConnections</code>. Without it, the call fails with access denied.</p>
<h3>Why does API Gateway return a route error for my WebSocket message?</h3>
<p>The message is probably missing the <code>action</code> field. With <code>RouteSelectionExpression</code> set to <code>$request.body.action</code>, API Gateway reads that field to pick the route. Send <code>{ "action": "sendMessage", "message": "..." }</code>.</p>
<h3>How much does serverless WebSocket AI chat cost on AWS?</h3>
<p>For 100,000 sessions and 1M messages a month, I estimated about $0.20 for connection minutes, around $80 for messages (most of that is token pushes), roughly $12 for the <code>sendMessage</code> Lambda, and about $3 for DynamoDB. Bedrock tokens cost far more than all of that combined.</p>
<p>Hope you enjoyed this one. If you're building real-time AI features or have questions about WebSocket architectures on AWS, I'd love to hear about it.</p>
<hr />
<p><em>Follow me on <a href="https://x.com/harundotdev">Twitter/X</a> for more posts about AWS, serverless, and building AI-powered products.</em></p>
