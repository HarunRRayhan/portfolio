---
title: "Chunk, Embed, Index: Running RAG Ingestion as a Step Functions State Machine"
slug: "rag-ingestion-pipeline-step-functions-lambda"
brief: "A re-run of a failed ingestion job left me with duplicate vectors and worse retrieval. Here's the Step Functions state machine I built instead: a Distributed Map over chunks, retries tuned to Bedrock throttling, content-hash idempotency, and a quarantine path for documents that just won't parse."
publishedAt: "2026-08-08T18:00:00.000Z"
draft: true
readTimeInMinutes: 13
coverImageUrl: "/blog-assets/rag-ingestion-pipeline-step-functions-lambda/cover.jpg"
reactionCount: 0
responseCount: 0
replyCount: 0
tags:
  - name: AWS
    slug: aws
  - name: Step Functions
    slug: step-functions
  - name: Lambda
    slug: lambda
  - name: RAG
    slug: rag
  - name: Bedrock
    slug: bedrock
  - name: Terraform
    slug: terraform
---

<p>A customer uploaded a 412-page product manual to my app. The ingestion Lambda chewed through it for 14 minutes and 51 seconds, then died at the Lambda timeout. I looked at the logs, saw the timeout, shrugged, and hit re-run.</p>

<p>That was the mistake. The first run had already written about 900 chunks into the vector table before it died. The second run wrote them again, with fresh primary keys, because my chunk boundaries had shifted by a few characters after a whitespace change in the extractor. Nothing errored. The table just quietly grew.</p>

<p>I found out three days later, when a user asked a question and the top 5 retrieved chunks were the same paragraph five times. Retrieval had gotten worse, not better, because near-identical vectors crowded out everything else. Fixing it meant a <code>DELETE</code> against a document I couldn't fully identify, then a full re-ingest of that customer's library.</p>

<p>None of that was an embedding problem or a pgvector problem. It was an orchestration problem. My ingestion was a single Lambda doing a for-loop over chunks, with no notion of which chunks had already landed. So I rebuilt it as a Step Functions state machine, and the loop became a Distributed Map.</p>

<h2>Ingestion is a different job than retrieval</h2>

<p>I've written about the query side already in <a href="/blog/building-a-production-rag-pipeline-on-aws-lambda-pgvector">Building a Production RAG Pipeline on AWS Lambda and pgvector</a>. That post is about what happens in the 300ms after a user hits enter. Retrieval is latency-bound, single-shot, and if it fails you just return an error and the user retries.</p>

<p>Ingestion has the opposite shape. It runs for minutes, not milliseconds. It calls an external embedding API hundreds or thousands of times per document. It writes state that persists forever. And when it fails halfway, the damage isn't a bad response, it's a corrupted index that poisons every future query.</p>

<p>That's a workflow, not a request handler. And Step Functions is the right tool for it, which is the same conclusion I reached in <a href="/blog/step-functions-llm-orchestration-replacing-lambda-chains">How I Use Step Functions to Orchestrate LLM Workflows Without Chaining Lambdas</a>, except that post was about a fixed sequence of steps. Ingestion isn't a fixed sequence. The number of steps depends on how big the document is, and that changes everything about how you build it.</p>

<h2>The stages, and why they're separate</h2>

<p>The state machine has five stages:</p>

<ol>
  <li><strong>Extract.</strong> Pull text out of whatever landed in S3. PDF, DOCX, HTML, plain text.</li>
  <li><strong>Plan.</strong> Split the text into chunks and write a manifest to S3. Return the manifest key, not the chunks.</li>
  <li><strong>Index.</strong> A Distributed Map over the manifest. Each iteration embeds a batch of chunks and upserts them.</li>
  <li><strong>Sweep.</strong> Delete rows from previous versions of this document that the current run didn't touch.</li>
  <li><strong>Quarantine.</strong> The catch-all destination for documents that failed in a way retries won't fix.</li>
</ol>

<p>Extract and Plan are separate on purpose. Extraction fails for boring reasons like a password-protected PDF or a scanned image with no text layer. Those are permanent failures, and I want them to fail before I've spent a cent on embeddings. Planning fails for basically no reason at all, so it gets one retry and that's it.</p>

<figure style="margin:2.5rem 0;padding:1.5rem 1.25rem;border:1px solid #e2e8f0;border-radius:1rem;background:#f8fafc;">
  <svg viewBox="0 0 960 300" width="100%" height="auto" role="img" aria-label="Diagram of the five-stage state machine: Extract and Plan run once, Index fans out as a Distributed Map of batches, Sweep runs only after every batch succeeds, and any stage can catch into Quarantine.">
    <defs>
      <marker id="hrr-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M0 0L10 5L0 10Z" fill="#0f7f8c"/>
      </marker>
      <marker id="hrr-arrow-fail" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M0 0L10 5L0 10Z" fill="#dc2626"/>
      </marker>
    </defs>

    <line x1="130" y1="138" x2="184" y2="138" stroke="#0f7f8c" stroke-width="2" stroke-dasharray="6 6" class="flightpath-flow" marker-end="url(#hrr-arrow)"/>
    <line x1="300" y1="138" x2="354" y2="138" stroke="#0f7f8c" stroke-width="2" stroke-dasharray="6 6" class="flightpath-flow" marker-end="url(#hrr-arrow)"/>
    <line x1="590" y1="138" x2="644" y2="138" stroke="#0f7f8c" stroke-width="2" stroke-dasharray="6 6" class="flightpath-flow" marker-end="url(#hrr-arrow)"/>

    <line x1="75" y1="166" x2="380" y2="248" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="4 4" marker-end="url(#hrr-arrow-fail)"/>
    <line x1="245" y1="166" x2="420" y2="248" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="4 4" marker-end="url(#hrr-arrow-fail)"/>
    <line x1="475" y1="232" x2="475" y2="248" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="4 4" marker-end="url(#hrr-arrow-fail)"/>

    <rect x="20" y="110" width="110" height="56" rx="10" fill="#ffffff" stroke="#ec7211" stroke-width="1.5"/>
    <circle cx="32" cy="112" r="4" fill="#ec7211"/>
    <text x="75" y="134" text-anchor="middle" font-size="13" font-weight="600" fill="#0f172a">Extract</text>
    <text x="75" y="150" text-anchor="middle" font-size="10" fill="#64748b">Lambda</text>

    <rect x="190" y="110" width="110" height="56" rx="10" fill="#ffffff" stroke="#ec7211" stroke-width="1.5"/>
    <circle cx="202" cy="112" r="4" fill="#ec7211"/>
    <text x="245" y="134" text-anchor="middle" font-size="13" font-weight="600" fill="#0f172a">Plan</text>
    <text x="245" y="150" text-anchor="middle" font-size="10" fill="#64748b">writes manifest to S3</text>

    <rect x="360" y="40" width="230" height="192" rx="12" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="3 5"/>
    <text x="475" y="58" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Index — Distributed Map</text>

    <line x1="374" y1="72" x2="374" y2="196" stroke="#e5197f" stroke-width="1.5"/>
    <line x1="374" y1="87" x2="386" y2="87" stroke="#e5197f" stroke-width="1.5"/>
    <line x1="374" y1="141" x2="386" y2="141" stroke="#e5197f" stroke-width="1.5"/>
    <line x1="374" y1="196" x2="386" y2="196" stroke="#e5197f" stroke-width="1.5"/>

    <rect x="386" y="70" width="180" height="34" rx="8" fill="#ffffff" stroke="#e5197f" stroke-width="1.5"/>
    <text x="476" y="92" text-anchor="middle" font-size="11" fill="#0f172a">Batch A · ≤25 chunks</text>

    <rect x="386" y="124" width="180" height="34" rx="8" fill="#ffffff" stroke="#e5197f" stroke-width="1.5"/>
    <text x="476" y="146" text-anchor="middle" font-size="11" fill="#0f172a">Batch B · ≤25 chunks</text>

    <rect x="386" y="179" width="180" height="34" rx="8" fill="#ffffff" stroke="#e5197f" stroke-width="1.5"/>
    <text x="476" y="201" text-anchor="middle" font-size="11" fill="#0f172a">Batch C · MaxConcurrency 8</text>

    <rect x="650" y="110" width="110" height="56" rx="10" fill="#ffffff" stroke="#ec7211" stroke-width="1.5"/>
    <circle cx="662" cy="112" r="4" fill="#ec7211"/>
    <text x="705" y="134" text-anchor="middle" font-size="13" font-weight="600" fill="#0f172a">Sweep</text>
    <text x="705" y="150" text-anchor="middle" font-size="10" fill="#64748b">only if Map succeeded</text>

    <rect x="360" y="248" width="230" height="42" rx="10" fill="#fef2f2" stroke="#dc2626" stroke-width="1.5"/>
    <text x="475" y="270" text-anchor="middle" font-size="12" font-weight="600" fill="#991b1b">Quarantine</text>
    <text x="475" y="284" text-anchor="middle" font-size="10" fill="#b91c1c">SQS message + Fail state</text>
  </svg>
  <figcaption style="margin-top:0.75rem;font-size:0.8rem;line-height:1.5;color:#64748b;text-align:center;">Extract and Plan each run once. Index fans out across a Distributed Map sized to the Bedrock quota. Sweep only fires if every batch in the Map succeeded. Any Catch block, from any stage, routes straight to Quarantine.</figcaption>
</figure>

<h2>Plan writes a manifest, not a payload</h2>

<p>The first thing that bit me when I moved to Step Functions: state payloads cap at 256KB. A 412-page manual chunked at 500 tokens is roughly 1,100 chunks. That's a few megabytes of text. You cannot pass it between states.</p>

<p>So the Plan Lambda writes the chunk list to S3 and returns a pointer. The manifest is a JSON array, one object per chunk, which is exactly what the Distributed Map's <code>ItemReader</code> knows how to read.</p>

<pre><code class="language-javascript">import { createHash } from "node:crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const hrr_s3 = new S3Client({});

export async function hrr_planChunks(event) {
  const { documentId, ingestRunId, text, metadata } = event;

  const chunks = hrr_chunkText(text, { maxTokens: 500, overlap: 50 });

  const manifest = chunks.map((content, index) =&gt; ({
    documentId,
    ingestRunId,
    chunkIndex: index,
    content,
    contentSha256: createHash("sha256").update(content).digest("hex"),
    metadata,
  }));

  const key = `manifests/${documentId}/${ingestRunId}.json`;

  await hrr_s3.send(
    new PutObjectCommand({
      Bucket: process.env.HRR_PIPELINE_BUCKET,
      Key: key,
      Body: JSON.stringify(manifest),
      ContentType: "application/json",
    })
  );

  return {
    documentId,
    ingestRunId,
    chunkCount: manifest.length,
    manifest: { bucket: process.env.HRR_PIPELINE_BUCKET, key },
  };
}
</code></pre>

<p>The <code>contentSha256</code> field is the whole idempotency story, and I'll get to it. Compute it here, once, while the text is in front of you. Don't recompute it in the indexing step, because then a subtle difference in normalization gives you a different hash and the skip logic silently stops working.</p>

<p>Two things about the chunker itself. It has to be deterministic: same input text, same chunk boundaries, every time. And it has to be versioned. I keep a <code>HRR_CHUNKER_VERSION</code> constant and stamp it into the metadata, so when I change the splitting rules I can find every document that needs a full re-index instead of guessing.</p>

<h2>Fan out with a Distributed Map, not a loop</h2>

<p>Here's the state that replaced my for-loop. It's a Map in <code>DISTRIBUTED</code> mode, reading items straight out of the S3 manifest.</p>

<pre><code class="language-json">{
  "IndexChunks": {
    "Type": "Map",
    "ItemReader": {
      "Resource": "arn:aws:states:::s3:getObject",
      "ReaderConfig": { "InputType": "JSON" },
      "Parameters": {
        "Bucket.$": "$.manifest.bucket",
        "Key.$": "$.manifest.key"
      }
    },
    "ItemBatcher": {
      "MaxItemsPerBatch": 25,
      "BatchInput": {
        "documentId.$": "$.documentId",
        "ingestRunId.$": "$.ingestRunId"
      }
    },
    "MaxConcurrency": 8,
    "ToleratedFailurePercentage": 0,
    "ItemProcessor": {
      "ProcessorConfig": {
        "Mode": "DISTRIBUTED",
        "ExecutionType": "STANDARD"
      },
      "StartAt": "EmbedAndUpsertBatch",
      "States": {
        "EmbedAndUpsertBatch": {
          "Type": "Task",
          "Resource": "${hrr_embed_index_lambda_arn}",
          "TimeoutSeconds": 300,
          "Retry": [
            {
              "ErrorEquals": [
                "Bedrock.ThrottlingException",
                "Bedrock.ServiceQuotaExceededException",
                "Bedrock.ModelNotReadyException"
              ],
              "IntervalSeconds": 4,
              "MaxAttempts": 6,
              "BackoffRate": 2,
              "MaxDelaySeconds": 120,
              "JitterStrategy": "FULL"
            },
            {
              "ErrorEquals": [
                "Lambda.ServiceException",
                "Lambda.SdkClientException",
                "Lambda.TooManyRequestsException",
                "Postgres.ConnectionError"
              ],
              "IntervalSeconds": 2,
              "MaxAttempts": 4,
              "BackoffRate": 2,
              "JitterStrategy": "FULL"
            }
          ],
          "End": true
        }
      }
    },
    "ResultWriter": {
      "Resource": "arn:aws:states:::s3:putObject",
      "Parameters": {
        "Bucket": "${hrr_pipeline_bucket}",
        "Prefix": "map-results"
      }
    },
    "Next": "SweepStaleChunks"
  }
}
</code></pre>

<p>Four settings in there are doing most of the work.</p>

<p><code>MaxItemsPerBatch: 25</code> means each child execution gets 25 chunks, not one. Bedrock Titan embeddings take a single input per call, so the Lambda still loops internally, but the orchestration overhead drops by 25x. I'll show the cost difference below because it's larger than you'd guess.</p>

<p><code>MaxConcurrency: 8</code> is the throttle. This is the number I tune against my Bedrock quota, not against how fast I want the job to finish. With 25 chunks per batch and 8 concurrent batches, I'm asking for at most 200 embeddings in flight. Check your account's requests-per-minute quota for the embedding model in your region and work backwards from it. Setting this to 0 (unlimited) is how you discover what a throttling storm looks like.</p>

<p><code>ToleratedFailurePercentage: 0</code> means one failed batch fails the whole Map. That's deliberate. A partially indexed document is worse than an unindexed one, because retrieval will confidently return the half you did index. I'd rather quarantine the whole document and re-run it clean.</p>

<p><code>JitterStrategy: "FULL"</code> matters more here than anywhere else in the pipeline. Without it, 8 concurrent batches all get throttled at the same moment, all back off by exactly 4 seconds, and all retry at exactly the same moment. Full jitter randomizes the delay across the window and spreads the retry storm out.</p>

<h2>Retries that match the actual failure</h2>

<p>The two <code>Retry</code> blocks exist because embedding throttles and Lambda hiccups need different treatment.</p>

<p>Throttling gets 6 attempts with a ceiling of 120 seconds. Bedrock quota pressure can last a while, especially if something else in your account is hammering the same model. A short backoff just burns your attempts during the exact window you should be waiting out.</p>

<p>Transient infrastructure errors get 4 attempts starting at 2 seconds. If a Lambda cold start or an RDS Proxy connection blip hasn't cleared in 30 seconds, it isn't transient.</p>

<p>What's deliberately not in either list: validation errors, unsupported file types, and text that exceeds the model's input limit. Retrying a 400 is just a slower way to fail. Those throw a typed error and get caught:</p>

<pre><code class="language-json">{
  "ExtractText": {
    "Type": "Task",
    "Resource": "${hrr_extract_lambda_arn}",
    "TimeoutSeconds": 300,
    "Retry": [
      {
        "ErrorEquals": ["Lambda.ServiceException", "Lambda.SdkClientException"],
        "IntervalSeconds": 2,
        "MaxAttempts": 3,
        "BackoffRate": 2
      }
    ],
    "Catch": [
      {
        "ErrorEquals": ["HrrUnsupportedDocument", "HrrEmptyDocument"],
        "Next": "QuarantineDocument",
        "ResultPath": "$.failure"
      },
      {
        "ErrorEquals": ["States.ALL"],
        "Next": "QuarantineDocument",
        "ResultPath": "$.failure"
      }
    ],
    "Next": "PlanChunks"
  }
}
</code></pre>

<p>Two <code>Catch</code> entries pointing at the same state looks redundant. It isn't. The first one matches on my own error names, so the quarantine record gets a clean reason like <code>HrrUnsupportedDocument</code> instead of <code>States.TaskFailed</code>. When you're looking at 200 quarantined documents on a Monday, that distinction is the difference between a two-minute triage and an hour of log spelunking.</p>

<p>To make that work, throw named errors from the Lambda:</p>

<pre><code class="language-javascript">class HrrUnsupportedDocument extends Error {
  constructor(message) {
    super(message);
    this.name = "HrrUnsupportedDocument";
  }
}

export async function hrr_extractText(event) {
  const text = await hrr_readDocument(event.bucket, event.key);

  if (text === null) {
    throw new HrrUnsupportedDocument(
      `No text layer in s3://${event.bucket}/${event.key}`
    );
  }
  if (text.trim().length &lt; 20) {
    const err = new Error("Document produced fewer than 20 characters");
    err.name = "HrrEmptyDocument";
    throw err;
  }

  return { ...event, text, charCount: text.length };
}
</code></pre>

<p>The <code>name</code> property is what Step Functions matches on in <code>ErrorEquals</code>, not the class name. If you're bundling with esbuild and minifying, class names get mangled and your catch rules stop matching. Set <code>name</code> explicitly and it survives.</p>

<h2>Idempotent indexing, so a re-run is free</h2>

<p>This is the part that fixes the duplicate-vector mess I opened with. Three pieces: a stable key, a content hash, and a run ID.</p>

<pre><code class="language-sql">CREATE TABLE hrr_doc_chunks (
  document_id      TEXT NOT NULL,
  chunk_index      INTEGER NOT NULL,
  content_sha256   TEXT NOT NULL,
  content          TEXT NOT NULL,
  embedding        vector(1024) NOT NULL,
  metadata         JSONB NOT NULL DEFAULT '{}',
  ingest_run_id    TEXT NOT NULL,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (document_id, chunk_index)
);

CREATE INDEX hrr_doc_chunks_run_idx
  ON hrr_doc_chunks (document_id, ingest_run_id);
</code></pre>

<p>The primary key is <code>(document_id, chunk_index)</code>, so a chunk can only exist once. That alone would have saved me, since my duplicate rows all came from a <code>BIGSERIAL</code> key that happily accepted the same content twice.</p>

<p>The batch handler reads the existing hashes first, skips anything unchanged, and only pays Bedrock for chunks that actually moved:</p>

<pre><code class="language-javascript">export async function hrr_embedAndUpsertBatch(event) {
  const { BatchInput, Items } = event;
  const { documentId, ingestRunId } = BatchInput;

  const indexes = Items.map((item) =&gt; item.chunkIndex);

  const existing = await hrr_pool.query(
    `SELECT chunk_index, content_sha256
       FROM hrr_doc_chunks
      WHERE document_id = $1 AND chunk_index = ANY($2::int[])`,
    [documentId, indexes]
  );

  const seen = new Map(
    existing.rows.map((r) =&gt; [r.chunk_index, r.content_sha256])
  );

  let embedded = 0;
  let skipped = 0;

  for (const item of Items) {
    if (seen.get(item.chunkIndex) === item.contentSha256) {
      // Same text, same vector. Touch the run ID so the sweep spares it.
      await hrr_pool.query(
        `UPDATE hrr_doc_chunks
            SET ingest_run_id = $3, updated_at = NOW()
          WHERE document_id = $1 AND chunk_index = $2`,
        [documentId, item.chunkIndex, ingestRunId]
      );
      skipped += 1;
      continue;
    }

    const embedding = await hrr_embed(item.content);

    await hrr_pool.query(
      `INSERT INTO hrr_doc_chunks
         (document_id, chunk_index, content_sha256, content,
          embedding, metadata, ingest_run_id)
       VALUES ($1, $2, $3, $4, $5::vector, $6, $7)
       ON CONFLICT (document_id, chunk_index) DO UPDATE
         SET content_sha256 = EXCLUDED.content_sha256,
             content        = EXCLUDED.content,
             embedding      = EXCLUDED.embedding,
             metadata       = EXCLUDED.metadata,
             ingest_run_id  = EXCLUDED.ingest_run_id,
             updated_at     = NOW()`,
      [
        documentId,
        item.chunkIndex,
        item.contentSha256,
        item.content,
        JSON.stringify(embedding),
        item.metadata,
        ingestRunId,
      ]
    );
    embedded += 1;
  }

  return { documentId, embedded, skipped };
}
</code></pre>

<p>The skip path is why re-running a failed job is cheap now. When that 412-page manual times out at chunk 900, the retry embeds 200 chunks instead of 1,100. It also means a customer editing one paragraph in a long doc pays for one embedding, not eleven hundred.</p>

<p>Then the sweep. Every row the current run touched carries the current <code>ingest_run_id</code>. Anything left behind belongs to an older, longer version of the document:</p>

<pre><code class="language-sql">DELETE FROM hrr_doc_chunks
 WHERE document_id = $1
   AND ingest_run_id &lt;&gt; $2;
</code></pre>

<p>One statement, and the stale tail is gone. This is the piece I didn't have before. My old code deleted by <code>chunk_index &gt;= chunkCount</code>, which works only if the run completed. If it died at chunk 900, the delete never ran, and the leftovers stayed forever.</p>

<p>The sweep goes in its own state after the Map, because it must not run unless every batch succeeded. That's the other reason <code>ToleratedFailurePercentage</code> is 0. A partial Map success followed by a sweep would delete chunks that were never re-indexed.</p>

<h2>Where broken documents go</h2>

<p>Every <code>Catch</code> in the machine points at the same terminal state:</p>

<pre><code class="language-json">{
  "QuarantineDocument": {
    "Type": "Task",
    "Resource": "arn:aws:states:::sqs:sendMessage",
    "Parameters": {
      "QueueUrl": "${hrr_quarantine_queue_url}",
      "MessageBody": {
        "documentId.$": "$.documentId",
        "ingestRunId.$": "$.ingestRunId",
        "sourceKey.$": "$.key",
        "error.$": "$.failure.Error",
        "cause.$": "$.failure.Cause",
        "executionArn.$": "$$.Execution.Id",
        "failedAt.$": "$$.State.EnteredTime"
      }
    },
    "Next": "FailExecution"
  },
  "FailExecution": {
    "Type": "Fail",
    "Error": "HrrIngestionFailed",
    "Cause": "Document quarantined. See the quarantine queue for details."
  }
}
</code></pre>

<p><code>$$.Execution.Id</code> is the context object, and it's the field that makes the queue useful. With the execution ARN on the message, I can open the exact failed run in the console from a queue item and see the input at every state.</p>

<p>Note the <code>Fail</code> state after the quarantine. It's tempting to end the execution successfully once you've recorded the failure, but then <code>ExecutionsFailed</code> stays at zero and your alarms never fire. Record the failure, then fail.</p>

<p>Once the underlying problem is fixed, Step Functions can redrive a failed execution from the state that broke, reusing the original input. The Extract and Plan work doesn't repeat, and thanks to the content hashes, neither does most of the embedding.</p>

<pre><code class="language-bash">aws stepfunctions redrive-execution \
  --execution-arn arn:aws:states:us-east-1:111122223333:execution:hrr-rag-ingestion:abc123
</code></pre>

<p>That command only works on executions that are actually in a failed state, which is one more reason for the <code>Fail</code> at the end.</p>

<h2>What the fan-out actually costs</h2>

<p>Standard workflow state transitions run $0.025 per 1,000, so $0.000025 each. That sounds like nothing until you fan out per chunk.</p>

<p>For that 1,100-chunk manual:</p>

<ul>
  <li><strong>One child execution per chunk:</strong> 1,100 children, roughly 3 transitions each, about 3,300 transitions. Call it $0.083 per document.</li>
  <li><strong>Batches of 25:</strong> 44 children, same 3 transitions each, about 132 transitions. Roughly $0.003 per document.</li>
</ul>

<figure style="margin:2.5rem 0;padding:1.5rem 1.25rem;border:1px solid #e2e8f0;border-radius:1rem;background:#f8fafc;">
  <svg viewBox="0 0 640 150" width="100%" height="auto" role="img" aria-label="Bar chart: one child execution per chunk costs about 8.3 cents per document, batches of 25 chunks cost about 0.3 cents per document.">
    <line x1="170" y1="20" x2="170" y2="126" stroke="#cbd5e1" stroke-width="1.5"/>

    <text x="0" y="38" font-size="12" fill="#334155">1 child / chunk</text>
    <rect x="170" y="26" width="440" height="28" rx="4" fill="#ec7211"/>
    <text x="622" y="46" font-size="12" font-weight="600" fill="#0f172a">$0.083 / doc</text>

    <text x="0" y="98" font-size="12" fill="#334155">Batches of 25</text>
    <rect x="170" y="86" width="20" height="28" rx="4" fill="#0f7f8c"/>
    <text x="202" y="106" font-size="12" font-weight="600" fill="#0f172a">$0.003 / doc</text>
  </svg>
  <figcaption style="margin-top:0.75rem;font-size:0.8rem;line-height:1.5;color:#64748b;text-align:center;">Standard Step Functions transitions for the same 1,100-chunk document, one child execution per chunk versus batches of 25.</figcaption>
</figure>

<p>Twenty-eight times cheaper for a one-line config change. At a few hundred documents a month that's lunch money, but the ratio holds at any volume, and orchestration cost is the one line item people forget to model when they design a fan-out.</p>

<p>If your per-batch work is short and you don't need per-child execution history, switching <code>ExecutionType</code> to <code>EXPRESS</code> bills by duration and memory instead of transitions, which is cheaper again. I stay on <code>STANDARD</code> because when a batch fails I want the full history for those 25 chunks, and I'd rather pay $0.003 than guess.</p>

<h2>The Terraform bits that are easy to miss</h2>

<p>The state machine resource itself is ordinary. The IAM policy is where Distributed Map surprises people, because the state machine has to start executions of itself and read and write S3 on your behalf:</p>

<pre><code class="language-hcl">resource "aws_iam_role_policy" "hrr_ingestion_distributed_map" {
  name = "hrr-ingestion-distributed-map"
  role = aws_iam_role.hrr_ingestion.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["states:StartExecution"]
        Resource = [aws_sfn_state_machine.hrr_ingestion.arn]
      },
      {
        Effect = "Allow"
        Action = ["states:DescribeExecution", "states:StopExecution"]
        Resource = [
          "${replace(aws_sfn_state_machine.hrr_ingestion.arn, "stateMachine", "execution")}:*"
        ]
      },
      {
        Effect   = "Allow"
        Action   = ["s3:GetObject", "s3:ListBucket"]
        Resource = [
          aws_s3_bucket.hrr_pipeline.arn,
          "${aws_s3_bucket.hrr_pipeline.arn}/*"
        ]
      },
      {
        Effect   = "Allow"
        Action   = ["s3:PutObject"]
        Resource = ["${aws_s3_bucket.hrr_pipeline.arn}/map-results/*"]
      }
    ]
  })
}
</code></pre>

<p>That self-referencing <code>states:StartExecution</code> is the one people miss. Without it the Map fails immediately with an access denied that names your own state machine, which reads like a bug in AWS until you realize a Distributed Map literally runs its iterations as child executions.</p>

<p>The trigger is an S3 event notification straight to EventBridge, then an EventBridge rule that starts the machine. No glue Lambda in between:</p>

<pre><code class="language-hcl">resource "aws_cloudwatch_event_rule" "hrr_document_uploaded" {
  name = "hrr-document-uploaded"

  event_pattern = jsonencode({
    source        = ["aws.s3"]
    "detail-type" = ["Object Created"]
    detail = {
      bucket = { name = [aws_s3_bucket.hrr_uploads.id] }
      object = { key = [{ prefix = "incoming/" }] }
    }
  })
}

resource "aws_cloudwatch_event_target" "hrr_start_ingestion" {
  rule     = aws_cloudwatch_event_rule.hrr_document_uploaded.name
  arn      = aws_sfn_state_machine.hrr_ingestion.arn
  role_arn = aws_iam_role.hrr_events_invoke_sfn.arn

  input_transformer {
    input_paths = {
      bucket = "$.detail.bucket.name"
      key    = "$.detail.object.key"
      etag   = "$.detail.object.etag"
    }

    input_template = &lt;&lt;EOT
{
  "bucket": &lt;bucket&gt;,
  "key": &lt;key&gt;,
  "documentId": &lt;key&gt;,
  "ingestRunId": &lt;etag&gt;
}
EOT
  }
}
</code></pre>

<p>Using the object ETag as the <code>ingestRunId</code> is a small trick that pays off. The ETag changes when the file content changes, so two uploads of the identical file produce the identical run ID. Combined with the content hashes, a duplicate upload embeds nothing and sweeps nothing. It's a no-op that costs a few state transitions.</p>

<h2>Three things I got wrong first</h2>

<p><strong>I passed chunks through state.</strong> Worked fine on the test fixtures, which were all under 40KB. The first real PDF hit <code>States.DataLimitExceeded</code> and the error message points at the state, not at the payload size, so it took me longer than I want to admit. Manifest in S3 from the start.</p>

<p><strong>I set <code>MaxConcurrency</code> to 40.</strong> The job finished fast for about a minute, then every batch started throttling at once, retries stacked, and the whole Map ground slower than the sequential version had been. Eight concurrent batches, sized to my quota, finishes sooner in wall time than forty fighting each other.</p>

<p><strong>I forgot Distributed Map writes execution history to S3.</strong> The <code>map-results</code> prefix accumulates one manifest and result set per run. After a few thousand documents that's a lot of small objects nobody will ever read. A 30-day lifecycle rule on that prefix costs one Terraform block and prevents a slow, boring bill.</p>

<p>The ingestion pipeline has been running on this shape for a while now. Documents that fail land in a queue with the reason attached instead of vanishing. Re-runs are cheap because unchanged chunks skip the embedding call. And the duplicate vector problem is structurally impossible, because <code>(document_id, chunk_index)</code> is a primary key and a run ID sweeps whatever's left over.</p>

<p>Hope you enjoyed this one. If you're building RAG ingestion on AWS and you've found a better way to handle the fan-out, or you just want to argue about batch sizes, come find me on X at <a href="https://x.com/HarunRRayhan">https://x.com/HarunRRayhan</a>.</p>
