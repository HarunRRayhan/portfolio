---
title: "Real-Time AI Chat with Lambda + API Gateway WebSockets"
slug: "real-time-ai-chat-with-lambda-api-gateway-websockets"
brief: "Stream LLM responses over WebSockets with a fully serverless backend. No EC2, no containers. Just Lambda, Bedrock, and DynamoDB."
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
I built a ChatGPT-style streaming chat UI and the entire backend is three Lambda functions and a DynamoDB table. That's it. The whole real-time backend fits in about 150 lines of TypeScript, and there's nothing to keep running between conversations.

If you've tried building real-time AI chat with regular HTTP endpoints, you already know the pain. The user sends a message, your Lambda calls Bedrock, Bedrock thinks for 5 to 10 seconds, and the user stares at a loading spinner until the full response comes back. It works, but it feels awful. Every modern AI chat product streams tokens as they're generated. Users expect to see text appearing word by word, not a wall of text after an awkward silence.

REST and HTTP don't cut it here. You need a persistent, bidirectional connection. That's exactly what WebSockets give you. The client opens a connection once, and both sides can send messages at any time. When Bedrock generates a token, you push it to the client immediately. When the user wants to cancel or send a follow-up, they can do that without opening a new connection.

If you haven't worked with Bedrock before, I wrote a full post on [Serverless AI Inference Endpoints with AWS Bedrock and Lambda](https://harun.dev/blog/serverless-ai-inference-endpoints-with-aws-bedrock-and-lambda) that covers the fundamentals. This post builds on those concepts and adds the real-time layer on top. Let's get into it.

![Real-time chat application interface](https://images.pexels.com/photos/7343000/pexels-photo-7343000.jpeg?auto=compress&cs=tinysrgb&h=650&w=940)
<sub>Photo by [cottonbro studio](https://www.pexels.com/@cottonbro) on [Pexels](https://www.pexels.com/photo/person-using-smartphone-7343000/)</sub>

## Why WebSockets Over HTTP Streaming

When I first started thinking about real-time streaming, I tried the obvious approach. Polling. Just have the client ask the server "anything new?" every second or so. For a dashboard that updates every few minutes, polling is fine. But for streaming AI chat where tokens arrive dozens of times per second? It's a disaster. Most requests come back empty, you're burning through Lambda invocations like crazy, and the latency between tokens makes the experience feel sluggish.

So I looked at **Server-Sent Events (SSE)** next. I actually used SSE with Lambda Function URLs in my Bedrock Lambda post, and it worked great for that use case. A single request goes in, and tokens stream back. Clean and simple. The problem shows up when you want a real conversation. SSE only flows one direction, server to client. If the user wants to cancel a generation mid-stream or send a follow-up message, you need a whole separate HTTP connection for that. It starts feeling like a workaround pretty fast.

**WebSockets through API Gateway** turned out to be what I actually needed. Full duplex. Both sides can send messages whenever they want over a single connection. API Gateway gives you built-in route handling for `$connect`, `$disconnect`, and custom routes like `sendMessage`, so you're not running a WebSocket server yourself. It takes care of connection management, scaling, and TLS termination. You just write the Lambda handlers and let API Gateway deal with the rest.

It's cheap, too. $1 per million connection minutes and $0.80 per million messages. For chat sessions that last a couple minutes each, you're talking about fractions of a cent per user. The part I really like is that when nobody is chatting at 3 AM, you pay literally nothing. An EC2 instance running a Node.js WebSocket server doesn't care if zero people are connected. It still costs you $30/month to sit there idle.

The way API Gateway structures WebSocket APIs is also a natural fit. You define routes, not endpoints. There's a `$connect` route that fires when someone opens a connection, a `$disconnect` route for when they leave, and then custom routes like `sendMessage` for your actual business logic. Each route points to its own Lambda function. So the connect handler can be a tiny 50ms function that just writes a connection ID to DynamoDB, while the message handler gets its own memory and timeout settings for the heavier Bedrock work. You're not cramming everything into one monolithic server process.
## Architecture Overview

When a client opens a WebSocket connection to your `wss://` endpoint, everything kicks off from there. API Gateway accepts the connection and fires the `$connect` Lambda, which stores the connection ID in DynamoDB. Now the connection is live.

When the user types a message and hits send, the client sends a JSON payload over the WebSocket. API Gateway routes it to the `$sendMessage` Lambda based on the `action` field in the body. This Lambda loads the conversation history from DynamoDB, calls Bedrock with the full message context, and streams the response. As each token comes back from Bedrock, the Lambda pushes it to the client using API Gateway's Management API and the `postToConnection` call. When the user closes the tab or the connection drops, the `$disconnect` Lambda fires and removes the connection from DynamoDB.

```
Client
  │  wss://
  ▼
API Gateway WebSocket API
  ├── $connect     → Lambda (store connectionId in DynamoDB)
  ├── $disconnect  → Lambda (delete connectionId from DynamoDB)
  └── $sendMessage → Lambda → Bedrock (stream) → postToConnection()
                                                        │
                                               DynamoDB (sessions)
```

The `$connect` and `$disconnect` handlers are barely worth their own files. One DynamoDB write, one DynamoDB delete, done. All the real complexity lives in `$sendMessage`, which is responsible for loading conversation history, calling Bedrock, streaming the response, and pushing tokens back to the client through the WebSocket.

DynamoDB serves double duty here. It stores active connection IDs so the system knows which connections are alive, and it stores conversation history so each message has the full context of the chat. The connection record has a TTL of 24 hours, which automatically cleans up stale entries if a client disconnects without properly closing the WebSocket (like when someone's laptop goes to sleep or their browser crashes).

Every component here runs on its own scaling path. API Gateway can handle millions of concurrent WebSocket connections while Lambda spins up handlers based on demand, and DynamoDB adjusts its read/write capacity automatically with on-demand billing. You never provision anything.

![Cloud architecture diagram showing WebSocket flow](https://images.pexels.com/photos/2881229/pexels-photo-2881229.jpeg?auto=compress&cs=tinysrgb&h=650&w=940)
<sub>Photo by [Brett Sayles](https://www.pexels.com/@brett-sayles) on [Pexels](https://www.pexels.com/photo/cables-connected-on-server-2881229/)</sub>

## Connection Management with DynamoDB

Let's start building. First, the infrastructure. Here's the SAM template for the WebSocket API and the DynamoDB table:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Resources:
  HrrWebSocketApi:
    Type: AWS::ApiGatewayV2::Api
    Properties:
      Name: hrr-chat-ws
      ProtocolType: WEBSOCKET
      RouteSelectionExpression: "$request.body.action"

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
```

The `RouteSelectionExpression` tells API Gateway to look at the `action` field in incoming JSON messages to decide which route to invoke. So when the client sends `{ "action": "sendMessage", "message": "Hello" }`, API Gateway matches that to the `sendMessage` route and fires the corresponding Lambda.

The DynamoDB table is as simple as it gets. One partition key on `connectionId`, pay-per-request billing, and TTL enabled. TTL is important here. WebSocket connections can go stale in all sorts of ways. The user's browser crashes, their WiFi drops, they close the laptop lid. In those cases, the `$disconnect` route might never fire. Without TTL, you'd accumulate dead connection records forever. Setting a 24-hour TTL means DynamoDB automatically deletes any connection record that hasn't been refreshed in a day.

Now here's the `$connect` handler:

```typescript
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler = async (event: any) => {
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
```

When a client opens a WebSocket connection, API Gateway generates a unique `connectionId` and passes it in the event. We store that ID in DynamoDB along with a TTL set to 24 hours from now and a timestamp. The TTL value is a Unix epoch in seconds because that's what DynamoDB expects.

Returning `{ statusCode: 200 }` tells API Gateway to accept the connection. If you return a non-2xx status, the WebSocket handshake fails and the client gets rejected. This is where you'd add authentication if you needed it. Check a token, validate an API key, whatever your auth flow requires. If the check fails, return a 401 and the connection never opens.

And the `$disconnect` handler:

```typescript
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand } from "@aws-sdk/lib-dynamodb";

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler = async (event: any) => {
  const connectionId = event.requestContext.connectionId;

  await dynamo.send(new DeleteCommand({
    TableName: process.env.CONNECTIONS_TABLE,
    Key: { connectionId },
  }));

  return { statusCode: 200 };
};
```

This one just deletes the connection record when the client disconnects cleanly. If the client doesn't disconnect cleanly, the TTL handles cleanup automatically. Between TTL and the `$disconnect` handler, you never have to worry about orphaned connection records piling up.
## The sendMessage Handler and Bedrock Streaming

This handler is where everything actually happens. When a user sends a message, it parses the incoming payload, calls Bedrock with streaming turned on, pushes each token back through the WebSocket as it arrives, and saves the conversation to DynamoDB so the next message has full context.

Here's the full handler:

```typescript
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { BedrockRuntimeClient, InvokeModelWithResponseStreamCommand } from "@aws-sdk/client-bedrock-runtime";
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from "@aws-sdk/client-apigatewaymanagementapi";

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const bedrock = new BedrockRuntimeClient({ region: "us-east-1" });

export const handler = async (event: any) => {
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
    { role: "user", content: userMessage },
  ];

  // Stream from Bedrock
  const bedrockResp = await bedrock.send(new InvokeModelWithResponseStreamCommand({
    modelId: "anthropic.claude-sonnet-4-6",
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify({
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 2048,
      messages,
    }),
  }));

  let fullResponse = "";

  for await (const chunk of bedrockResp.body!) {
    if (chunk.chunk?.bytes) {
      const decoded = JSON.parse(Buffer.from(chunk.chunk.bytes).toString("utf-8"));
      if (decoded.type === "content_block_delta" && decoded.delta?.text) {
        const token = decoded.delta.text;
        fullResponse += token;

        try {
          await apigw.send(new PostToConnectionCommand({
            ConnectionId: connectionId,
            Data: Buffer.from(JSON.stringify({ type: "token", text: token })),
          }));
        } catch (err: any) {
          if (err.statusCode === 410) {
            // Client disconnected mid-stream, stop early
            console.log("Client disconnected, stopping stream");
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
    Data: Buffer.from(JSON.stringify({ type: "done" })),
  }));

  // Persist conversation to DynamoDB
  await dynamo.send(new UpdateCommand({
    TableName: process.env.CONNECTIONS_TABLE,
    Key: { connectionId },
    UpdateExpression: "SET messages = :msgs",
    ExpressionAttributeValues: {
      ":msgs": [
        ...messages,
        { role: "assistant", content: fullResponse },
      ],
    },
  }));

  return { statusCode: 200 };
};
```

The key thing that makes this feel like a real-time server is the `ApiGatewayManagementApiClient`. You build the endpoint URL from `domainName` and `stage` in the request context, and then `PostToConnectionCommand` lets you push data to a specific connection by its ID. You're not responding to an HTTP request here. You're actively sending messages to a client over a connection that's already open. The Bedrock streaming part works the same way. `InvokeModelWithResponseStreamCommand` gives you an async iterable, and each chunk with `type: "content_block_delta"` carries a piece of the response in `delta.text`. We accumulate those into `fullResponse` and push each one to the client as it arrives.

Now, the 410 `GoneException` is the one that will catch you off guard in production. Someone closes their browser tab while Bedrock is still generating, or their phone loses signal in an elevator, and suddenly your `PostToConnectionCommand` throws a 410. If you don't catch that, your Lambda keeps calling Bedrock and trying to push tokens into a dead connection. You're paying for model inference that nobody will ever see. Catching the 410 and breaking out of the loop saves you real money. Anything that's not a 410 gets re-thrown because that's an actual problem you want to know about.

Once the stream wraps up, we save the full conversation back to DynamoDB so the next message has context. I noticed pretty quickly during testing that without this step, every message felt like talking to someone with amnesia. The model had zero memory of what you'd just asked two seconds ago. One thing I ran into later: DynamoDB items cap at 400KB. For most chat sessions that's more than enough, but a really long back-and-forth conversation can eventually bump into that limit. If you're building something where users might have hour-long sessions, you'd want to paginate the history or trim older messages.
## Client-Side WebSocket Integration

The backend is done. Now let's wire up the client. Here's a simple JavaScript class that connects to the WebSocket, sends messages, handles streaming tokens, and reconnects automatically if the connection drops.

```javascript
class HrrChatClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.onToken = null;
    this.onDone = null;
    this.reconnectDelay = 1000;
  }

  connect() {
    this.ws = new WebSocket(this.wsUrl);

    this.ws.onopen = () => {
      console.log("Connected");
      this.reconnectDelay = 1000;
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "token") {
        this.onToken?.(data.text);
      } else if (data.type === "done") {
        this.onDone?.();
      }
    };

    this.ws.onclose = () => {
      console.log("Disconnected, reconnecting in", this.reconnectDelay, "ms");
      setTimeout(() => {
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
        this.connect();
      }, this.reconnectDelay);
    };
  }

  send(message) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ action: "sendMessage", message }));
    }
  }
}

// Usage
const client = new HrrChatClient("wss://your-api-id.execute-api.us-east-1.amazonaws.com/prod");
client.onToken = (text) => {
  document.getElementById("response").textContent += text;
};
client.onDone = () => {
  console.log("Stream complete");
};
client.connect();
```

The `action: "sendMessage"` field in the JSON payload is doing more work than it looks like. That's the field API Gateway checks against the `RouteSelectionExpression` we configured earlier (`$request.body.action`). I actually forgot to include it in my first version and spent an embarrassing 20 minutes wondering why API Gateway kept returning route errors. Without it, your message just falls into the void or hits a `$default` route you probably haven't set up.

On the receiving side, the `type` field tells you whether you're getting a streaming token or a "done" signal, and your UI needs to handle both differently. In a real chat interface you'd be appending each token to a specific message bubble rather than dumping everything into one div. The done signal is where you'd re-enable the send button, hide the typing indicator, whatever makes sense for your UX. The reconnection logic uses exponential backoff starting at 1 second and doubling up to 30 seconds, which resets when a connection actually succeeds. I kept this simple on purpose. You could get fancier with jitter or connection-state tracking, but this covers the common case where someone's WiFi blips for a few seconds and the client quietly reconnects without the user even noticing.
## Deployment and Cost Breakdown

Let's deploy the whole thing with SAM and then look at what it actually costs to run.

```bash
# Build and deploy
sam build
sam deploy --guided \
  --stack-name hrr-chat-websocket \
  --capabilities CAPABILITY_IAM \
  --region us-east-1
```

SAM will create the WebSocket API, the three Lambda functions, the DynamoDB table, and all the IAM roles. After deployment, it outputs the WebSocket URL. That's your `wss://` endpoint.

Your Lambda execution role needs these IAM permissions:

```yaml
HrrChatFunctionPolicy:
  Type: AWS::IAM::Policy
  Properties:
    PolicyName: hrr-chat-permissions
    PolicyDocument:
      Version: "2012-10-17"
      Statement:
        - Effect: Allow
          Action:
            - bedrock:InvokeModelWithResponseStream
          Resource: "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-sonnet-4-6"
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
          Resource: !Sub "arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${HrrWebSocketApi}/*"
```

The `execute-api:ManageConnections` permission is the one people always forget. Without it, the `PostToConnectionCommand` call fails with an access denied error. This permission lets your Lambda push messages back through the WebSocket connection.

Let's say you're running 100,000 chat sessions per month with about 10 messages per session, so 1 million messages total. API Gateway charges $1 per million connection minutes, and if your average session lasts 2 minutes, that's 200K connection minutes for about $0.20. The messages cost more because you're pushing a lot of individual tokens back to the client. Even if you batch 5 tokens per push, 1M user messages plus roughly 100M token pushes lands around $80 at $0.80 per million messages. Lambda is surprisingly cheap here. The connect and disconnect handlers are so lightweight (50ms, 128MB) that 200K invocations barely registers, under a dime. The sendMessage handler runs longer at about 3 seconds per invocation with 512MB, but 1M invocations still comes out to roughly $12/month. DynamoDB on-demand adds maybe $3 for the reads and writes.

Bedrock is where your real money goes. Claude Sonnet 4.6 at $3 per million input tokens and $15 per million output tokens means your model costs dwarf everything else combined. The serverless infrastructure is practically a rounding error next to Bedrock pricing. That's actually why this architecture makes so much sense. If you ran your own WebSocket server on EC2, you'd need at least two t3.medium instances for redundancy at $60/month, an ALB at $16/month base cost, and you'd cap out around 10,000 concurrent connections before needing to scale horizontally. All that operational overhead, and it wouldn't reduce your Bedrock bill by a single cent. API Gateway handles millions of concurrent connections without you thinking about it.

![Cloud server room and computing cost](https://images.pexels.com/photos/5480781/pexels-photo-5480781.jpeg?auto=compress&cs=tinysrgb&h=650&w=940)
<sub>Photo by [Brett Sayles](https://www.pexels.com/@brett-sayles) on [Pexels](https://www.pexels.com/photo/server-racks-on-data-center-5480781/)</sub>

## Wrapping Up

This whole backend is surprisingly little code for what it does. The boring parts, tracking who's connected and cleaning up after them, take maybe 20 lines total. The sendMessage handler is where the actual product lives, pulling in conversation history from DynamoDB, streaming Bedrock's response, and pushing tokens to the client in real time. TTL on the connection records means you don't even have to worry about cleanup when someone's laptop dies mid-conversation.

If you're new to Bedrock and want to understand the inference side before adding WebSockets on top, I wrote about that in my post on [Serverless AI Inference Endpoints with AWS Bedrock and Lambda](https://harun.dev/blog/serverless-ai-inference-endpoints-with-aws-bedrock-and-lambda). It covers basic invocation, streaming responses, multi-model routing, and cost breakdown. Those patterns feed directly into the `$sendMessage` handler we built here.

You can start small with this. Deploy it, wire up a basic HTML page, and have a working conversation with Claude through your own WebSocket backend. Once that's running, layer on whatever you need. Authentication, persistent conversation history, typing indicators. The core architecture doesn't change.

Hope you enjoyed this one. If you're building real-time AI features or have questions about WebSocket architectures on AWS, I'd love to hear about it.

---

*Follow me on [Twitter/X](https://x.com/HarunRRayhan) for more posts about AWS, serverless, and building AI-powered products.*
