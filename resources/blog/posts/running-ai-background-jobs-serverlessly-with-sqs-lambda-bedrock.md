---
title: "Running AI Background Jobs Serverlessly with SQS + Lambda + Bedrock"
slug: "running-ai-background-jobs-serverlessly-with-sqs-lambda-bedrock"
brief: "Queue document analysis, summarization, and classification with SQS. Process them with Lambda and Bedrock. No servers, no polling, no wasted spend."
publishedAt: "2026-03-19T13:41:25.998Z"
readTimeInMinutes: 16
reactionCount: 0
responseCount: 0
replyCount: 0
sourceUrl: "https://web.archive.org/web/*/https://blog.harun.dev/running-ai-background-jobs-serverlessly-with-sqs-lambda-bedrock"
coverImageUrl: "/blog-assets/running-ai-background-jobs-serverlessly-with-sqs-lambda-bedrock/cover.jpg"
tags:
  - name: "AWS"
    slug: "aws"
  - name: "Serverless"
    slug: "serverless"
  - name: "AI"
    slug: "ai"
  - name: "SQS"
    slug: "sqs"
  - name: "Nodejs"
    slug: "nodejs"
---
If you've been following along with my recent posts, you know I've been building out a full toolkit for running AI workloads on AWS. In the [first post](https://harun.dev/blog/serverless-ai-inference-endpoints-with-aws-bedrock-and-lambda), I covered synchronous inference with Bedrock and Lambda. Simple request, quick response, done in a few seconds. Then in the [second post](https://harun.dev/blog/real-time-ai-chat-with-lambda-api-gateway-websockets), I wired up WebSockets so users could watch responses stream in token by token. Both patterns work great for their use cases.

But here's the thing. Not every AI job finishes in a few seconds.

I ran into this firsthand about two months ago. I was building a document analysis feature where users upload PDFs and get back a structured summary with key entities extracted. The prototype worked fine with short documents. Then someone uploaded a 40-page contract. The Lambda behind API Gateway hit the 29-second response timeout, the request died, and the user got a generic 504 error. No summary, no feedback, nothing.

That's when I realized I needed a third pattern. Something where the user uploads a file, gets an immediate "we're on it" response, and comes back later for results. No open connection sitting there burning money. No timeout anxiety. Just drop the work onto a queue, process it in the background, and store the results when they're ready.

So in this post, we're building exactly that. S3 for uploads, SQS to queue the work, Lambda to process each job with Bedrock, and DynamoDB to track status. The user never waits. Let's wire it up.

![Cloud queue processing and automation](https://images.pexels.com/photos/3943950/pexels-photo-3943950.jpeg?auto=compress&cs=tinysrgb&h=650&w=940)
<sub>Photo by [Anna Shvets](https://www.pexels.com/@shvetsa) on [Pexels](https://www.pexels.com/photo/person-checking-in-at-the-airport-3943950/)</sub>

## Why Async Over Sync or Streaming

It helps to understand when each pattern actually makes sense, because they're not interchangeable.

Synchronous inference is the simplest model. Client sends a request, Lambda calls Bedrock, Bedrock responds, Lambda returns the answer. Total round trip needs to land under 29 seconds because that's the hard timeout on API Gateway responses. For quick tasks like classifying a support ticket or generating a short answer, sync works perfectly. You don't need anything fancier.

Streaming shines when you want real-time feedback. Think chatbots, writing assistants, anything where a user is staring at the screen waiting for text to appear. The WebSocket connection stays open while Bedrock sends back tokens one at a time. It feels fast even when the full response takes 15 seconds to generate. But that connection has to stay open the entire time, and for something like document analysis, there's no one watching the screen anyway.

Async is for the heavy stuff. Batch summarization. Multi-page document analysis. Classification pipelines where you're processing hundreds of items. Anything that might take 30 seconds, 60 seconds, or even a couple minutes. The user doesn't sit there waiting. They upload their file, get a job ID back instantly, and check on results whenever they want. From a cost perspective, this is also the most efficient approach. There's no idle WebSocket connection eating Lambda concurrency. SQS handles retry logic for you automatically, so if Bedrock throttles you or a transient error hits, the message just goes back on the queue. And because SQS decouples the upload from the processing, your upload API stays fast no matter how backed up the processing queue gets. During a traffic spike, uploads still return in milliseconds while the queue absorbs the burst and Lambda works through it at whatever concurrency you've configured.
## Architecture Overview

Here's the full flow from upload to results:

```
User
  │  presigned PUT URL
  ▼
S3 (hrr_documents)
  │  S3 Event Notification
  ▼
SQS Queue (hrr_doc_queue)
  │  Lambda trigger (BatchSize: 1)
  ▼
Lambda (hrr_doc_processor)
  │  InvokeModelCommand
  ▼
Bedrock (anthropic.claude-sonnet-4-6)
  │
  ├── DynamoDB (hrr_job_results) — job status + summary
  └── S3 (hrr_documents/results/) — full output
           │  DLQ (hrr_doc_dlq)
           └── Dead messages after 3 failures
```

The user never talks to the processing Lambda directly. They hit a small API endpoint that generates a presigned S3 URL, upload their document straight to S3, and walk away. When the file lands in the `uploads/` prefix, S3 fires an event notification into SQS.

SQS is the backbone here. It holds the message until Lambda is ready to pick it up, handles retries when things fail, and routes poison messages to the dead letter queue after three attempts. The queue gives you a clean buffer between "file arrived" and "file processed."

The processing Lambda pulls one message at a time. It downloads the document from S3, sends it to Bedrock for analysis, and writes results in two places. DynamoDB gets the job status and a short summary for quick lookups. S3 gets the full output file for download. I split it this way because DynamoDB is great for fast status checks but you don't want to stuff a 50KB summary into a DynamoDB item.

When the user wants their results, another small Lambda generates a presigned GET URL for the output file. Clean, simple, and no long-lived connections anywhere in the stack.

![System architecture diagram showing pipeline flow](https://images.pexels.com/photos/1181311/pexels-photo-1181311.jpeg?auto=compress&cs=tinysrgb&h=650&w=940)
<sub>Photo by [Christina Morillo](https://www.pexels.com/@divinetechygirl) on [Pexels](https://www.pexels.com/photo/white-dry-erase-board-with-red-diagram-1181311/)</sub>

## S3 Presigned URLs for Upload and Download

Presigned URLs solve two problems at once. First, API Gateway has a 10MB payload limit, and documents can easily exceed that. With a presigned URL, the client uploads directly to S3 with no size constraint from API Gateway. Second, the client never needs AWS credentials. The URL itself carries temporary authorization baked right into the query string.

We need two Lambda functions here. One generates a PUT URL for uploads, the other generates a GET URL for downloading results.

### Upload URL Generator

```typescript
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

const s3 = new S3Client({});
const BUCKET = process.env.BUCKET_NAME!;

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const body = JSON.parse(event.body || "{}");
  const filename = body.filename || "document.txt";
  const contentType = body.contentType || "application/octet-stream";

  const jobId = randomUUID();
  const key = `uploads/${jobId}/${filename}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jobId,
      uploadUrl,
      key,
      expiresIn: 300,
    }),
  };
};
```

The client gets back a `jobId` they can use to check on their job later, plus the presigned URL that's valid for 5 minutes. They do a simple `PUT` request to that URL with the file as the body. No multipart form nonsense, no auth headers.

### Download URL Generator

```typescript
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

const s3 = new S3Client({});
const BUCKET = process.env.BUCKET_NAME!;

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const jobId = event.pathParameters?.jobId;

  if (!jobId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing jobId" }),
    };
  }

  const key = `results/${jobId}/summary.txt`;

  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });

  const downloadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jobId,
      downloadUrl,
      expiresIn: 3600,
    }),
  };
};
```

The download URL gets a longer TTL of one hour since there's no security risk in letting someone re-download their own results. In a production setup you'd also check DynamoDB first to confirm the job actually completed before generating the URL, but I'm keeping it focused here.
## SQS Queue Configuration

The SQS queue sits between S3 and Lambda, and getting the configuration right matters more than you might think. Here's the SAM template:

```yaml
HrrDocQueue:
  Type: AWS::SQS::Queue
  Properties:
    QueueName: hrr_doc_queue
    VisibilityTimeout: 900
    MessageRetentionPeriod: 1209600
    RedrivePolicy:
      deadLetterTargetArn: !GetAtt HrrDocDLQ.Arn
      maxReceiveCount: 3

HrrDocDLQ:
  Type: AWS::SQS::Queue
  Properties:
    QueueName: hrr_doc_dlq
    MessageRetentionPeriod: 1209600
```

A few decisions worth explaining. I went with a standard queue instead of FIFO because document processing doesn't need strict ordering. If job B finishes before job A, that's totally fine. Standard queues also give you much higher throughput and they're cheaper. FIFO would only make sense if you needed exactly-once processing with guaranteed order, which we don't.

The `VisibilityTimeout` is set to 900 seconds (15 minutes), and there's a specific reason for that. AWS recommends setting it to at least 6 times your Lambda function timeout. Our processing Lambda has a 150-second timeout, so 6 times that is 900. If the visibility timeout is too short, SQS might re-deliver a message while Lambda is still working on it, and now you've got two Lambdas processing the same document. That's wasteful and potentially dangerous if your writes aren't idempotent.

The `maxReceiveCount: 3` means a message gets three chances. If all three attempts fail, maybe Bedrock was down or the document was corrupted, SQS moves it to the dead letter queue instead of retrying forever. The retention period of 14 days on both queues gives you plenty of time to investigate failures.

Now for the S3 event notification that feeds the queue:

```yaml
HrrDocumentsBucket:
  Type: AWS::S3::Bucket
  Properties:
    BucketName: hrr_documents
    NotificationConfiguration:
      QueueConfigurations:
        - Event: "s3:ObjectCreated:*"
          Filter:
            S3Key:
              Rules:
                - Name: prefix
                  Value: uploads/
          Queue: !GetAtt HrrDocQueue.Arn
```

The prefix filter is important. We only want notifications for files landing in `uploads/`, not for result files we write back to the same bucket. Without that filter you'd create an infinite loop where writing results triggers another processing job. I learned that one the fun way during development.

And the Lambda event source mapping:

```yaml
Events:
  SQSTrigger:
    Type: SQS
    Properties:
      Queue: !GetAtt HrrDocQueue.Arn
      BatchSize: 1
      FunctionResponseTypes:
        - ReportBatchItemFailures
```

`BatchSize: 1` is deliberate. Each Bedrock call takes real time and real money. Processing one document per invocation keeps things simple, makes error handling straightforward, and avoids a scenario where one slow document holds up a batch of five.
## Lambda SQS Consumer with Bedrock

This is the core of the whole pipeline. The processor Lambda receives an SQS event, pulls the document from S3, sends it to Bedrock for summarization, and stores results in both DynamoDB and S3.

One thing that tripped me up early on is the message format. When S3 sends an event notification through SQS, the actual S3 event is nested inside the SQS message body as a JSON string. So you're parsing JSON out of `record.body`, and inside that you find the familiar S3 event structure with its own `Records` array. I spent a good 20 minutes staring at `undefined` errors before I realized I was trying to read bucket and key from the wrong level.

Here's the full handler:

```typescript
import { SQSEvent, SQSBatchResponse } from "aws-lambda";
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const s3 = new S3Client({});
const bedrock = new BedrockRuntimeClient({});
const ddbDoc = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const BUCKET = process.env.BUCKET_NAME!;
const TABLE = process.env.TABLE_NAME!;

interface S3EventRecord {
  s3: {
    bucket: { name: string };
    object: { key: string };
  };
}

export const handler = async (
  event: SQSEvent
): Promise<SQSBatchResponse> => {
  const batchItemFailures: { itemIdentifier: string }[] = [];

  for (const record of event.Records) {
    try {
      // Parse the S3 event nested inside the SQS message body
      const s3Event = JSON.parse(record.body);
      const s3Record: S3EventRecord = s3Event.Records[0];
      const bucket = s3Record.s3.bucket.name;
      const key = decodeURIComponent(
        s3Record.s3.object.key.replace(/\+/g, " ")
      );

      // Extract jobId from the key: uploads/{jobId}/{filename}
      const parts = key.split("/");
      const jobId = parts[1];

      // Mark job as processing
      await ddbDoc.send(
        new UpdateCommand({
          TableName: TABLE,
          Key: { jobId },
          UpdateExpression:
            "SET #status = :status, startedAt = :now",
          ExpressionAttributeNames: { "#status": "status" },
          ExpressionAttributeValues: {
            ":status": "processing",
            ":now": new Date().toISOString(),
          },
        })
      );

      // Download the document from S3
      const getResponse = await s3.send(
        new GetObjectCommand({ Bucket: bucket, Key: key })
      );
      const documentText = await getResponse.Body!.transformToString();

      // Call Bedrock for summarization
      const prompt = `Analyze and summarize the following document. Provide a structured summary with key points, entities mentioned, and any action items.\n\n${documentText}`;

      const bedrockResponse = await bedrock.send(
        new InvokeModelCommand({
          modelId: "anthropic.claude-sonnet-4-6",
          contentType: "application/json",
          accept: "application/json",
          body: JSON.stringify({
            anthropic_version: "bedrock-2023-05-31",
            max_tokens: 4096,
            messages: [
              {
                role: "user",
                content: prompt,
              },
            ],
          }),
        })
      );

      const result = JSON.parse(
        new TextDecoder().decode(bedrockResponse.body)
      );
      const summary = result.content[0].text;
      const inputTokens = result.usage?.input_tokens || 0;
      const outputTokens = result.usage?.output_tokens || 0;

      // Save full output to S3
      const resultKey = `results/${jobId}/summary.txt`;
      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: resultKey,
          Body: summary,
          ContentType: "text/plain",
        })
      );

      // Update DynamoDB with completion status
      await ddbDoc.send(
        new UpdateCommand({
          TableName: TABLE,
          Key: { jobId },
          UpdateExpression: `
            SET #status = :status,
                summary = :summary,
                s3ResultKey = :resultKey,
                completedAt = :now,
                inputTokens = :inputTokens,
                outputTokens = :outputTokens
          `,
          ExpressionAttributeNames: { "#status": "status" },
          ExpressionAttributeValues: {
            ":status": "completed",
            ":summary": summary.substring(0, 500),
            ":resultKey": resultKey,
            ":now": new Date().toISOString(),
            ":inputTokens": inputTokens,
            ":outputTokens": outputTokens,
          },
        })
      );
    } catch (error) {
      console.error(
        `Failed to process message ${record.messageId}:`,
        error
      );
      batchItemFailures.push({
        itemIdentifier: record.messageId,
      });
    }
  }

  return { batchItemFailures };
};
```

The DynamoDB item for each job tracks the full lifecycle. It starts with a `processing` status when the Lambda picks it up. On success, it flips to `completed` with the summary (first 500 characters for quick display in a UI), the S3 key for the full result, a timestamp, and token usage from Bedrock. That token count is useful for monitoring costs per document over time.

Notice the handler doesn't throw on error. Instead, it catches the exception and pushes the `messageId` into the `batchItemFailures` array. This is the `ReportBatchItemFailures` pattern. SQS looks at that response and only retries the specific messages that failed, leaving successful ones alone. If we just threw an error, SQS would retry the entire batch, even messages that already processed successfully.

![Developer coding a serverless application](https://images.pexels.com/photos/4164418/pexels-photo-4164418.jpeg?auto=compress&cs=tinysrgb&h=650&w=940)
<sub>Photo by [Antonio Batinić](https://www.pexels.com/@antonio-batinic-2573434) on [Pexels](https://www.pexels.com/photo/black-screen-with-code-4164418/)</sub>

## Error Handling: DLQ, Retries, and Partial Failures

Things will fail. Bedrock might throttle you during a spike. A document might contain binary garbage that blows up the parser. S3 might hiccup on a read. The goal isn't to prevent all failures. It's to handle them gracefully so nothing gets lost.

The error strategy works in three layers. First, the try/catch block inside the handler. When something goes wrong, the failed message ID goes into the `batchItemFailures` response. SQS sees this and makes the message visible again after the visibility timeout expires. The Lambda will pick it up for another attempt.

```typescript
return {
  batchItemFailures: [{ itemIdentifier: record.messageId }],
};
```

Second, SQS itself manages the retry count. Every time a message gets delivered and the consumer reports it as failed, the receive count increments. Our `maxReceiveCount` is set to 3, so each document gets three shots at processing. Transient issues like a Bedrock throttle or a temporary network blip usually resolve by the second or third try.

For Bedrock throttling specifically, you'll want to recognize the `ThrottlingException` in your error handling. If you're processing a burst of documents and hit Bedrock's tokens-per-minute limit, those messages will fail, go back to the queue, and naturally retry after the visibility timeout. The queue acts as a built-in backpressure mechanism, which is honestly one of my favorite things about this architecture. You don't need to write any rate limiting code yourself. SQS and the visibility timeout handle it for you.

Third, the dead letter queue catches anything that fails all three attempts. Maybe the document is corrupt, maybe there's a bug in the parsing logic for a specific file format. Whatever the cause, the message lands in `hrr_doc_dlq` where it sits for 14 days waiting for you to investigate.

Set up a CloudWatch alarm on the DLQ so you actually notice when messages end up there:

```yaml
DLQAlarm:
  Type: AWS::CloudWatch::Alarm
  Properties:
    MetricName: ApproximateNumberOfMessagesVisible
    Namespace: AWS/SQS
    Dimensions:
      - Name: QueueName
        Value: !GetAtt HrrDocDLQ.QueueName
    Statistic: Sum
    Period: 300
    EvaluationPeriods: 1
    Threshold: 1
    ComparisonOperator: GreaterThanOrEqualToThreshold
    AlarmActions:
      - !Ref AlertsTopic
```

The DLQ should be your safety net, not something that fires constantly. If you're seeing more than a handful of messages land there per week, something upstream needs fixing. Check your Bedrock service quotas, validate document formats before they hit the queue, or add better error context to your logs so you can actually diagnose what's going wrong.
## Cost Breakdown and Wrapping Up

Let's talk numbers. Say you're processing 10,000 documents per month through this pipeline.

Lambda runs each invocation for an average of 150 seconds at 512MB. That works out to roughly 750,000 GB-seconds of compute, which comes to about $12.50 per month after the free tier. Bedrock is the bigger line item. Assuming each document sends around 5,000 input tokens and gets back 2,000 output tokens with Claude Sonnet 4.6, you're looking at about $20 for input tokens and $30 for output tokens across those 10K documents. So roughly $50 per month on Bedrock. SQS is essentially free at this volume since the first million requests per month are included in the free tier, and 10K messages doesn't even register. DynamoDB with 10K writes and 10K reads stays well under $1 per month on on-demand pricing. S3 storage and requests are negligible too. All in, you're looking at roughly $63 per month to process 10,000 documents with AI.

Now compare that to running an always-on ECS Fargate task with 0.5 vCPU and 1GB of memory. That costs about $35 per month just for the compute, running 24/7 whether you have documents to process or not. And you'd still need to build your own retry logic, queue management, and dead letter handling. The serverless version costs less during low traffic, scales automatically during spikes, and comes with built-in error handling from SQS.

So this wraps up what I think of as a trilogy. Three posts covering every major way to integrate AI into a serverless backend. [Serverless AI Inference Endpoints with Bedrock and Lambda](https://harun.dev/blog/serverless-ai-inference-endpoints-with-aws-bedrock-and-lambda) covered sync inference for quick API responses where the user waits a second or two and gets an answer. [Real-Time AI Chat with Lambda + API Gateway WebSockets](https://harun.dev/blog/real-time-ai-chat-with-lambda-api-gateway-websockets) handled the streaming pattern for chat interfaces where tokens appear in real time. And this post covered async background jobs for heavy processing that doesn't block the user at all. Between those three patterns, you can handle pretty much any AI workload on AWS without managing a single server.

Hope you enjoyed this one. If you're building AI pipelines on AWS or have questions about any of this, I'd love to hear about it.

---

*Follow me on [Twitter/X](https://x.com/HarunRRayhan) for more posts about AWS, serverless, and building AI-powered products.*
