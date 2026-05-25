---
title: "Building a Production RAG Pipeline on AWS Lambda and pgvector"
slug: "building-a-production-rag-pipeline-on-aws-lambda-pgvector"
brief: "I was knee-deep in building my SaaS when users started asking questions I couldn't answer from the UI alone. My app had a solid backend, Lambda functions, Fastify, PostgreSQL on RDS. I wrote about tha"
publishedAt: "2026-04-04T09:00:00.000Z"
readTimeInMinutes: 22
reactionCount: 0
responseCount: 1
replyCount: 1
sourceUrl: "https://web.archive.org/web/*/https://blog.harun.dev/building-a-production-rag-pipeline-on-aws-lambda-pgvector"
coverImageUrl: "https://cdn.hashnode.com/uploads/covers/625d48cb9ad0ef10f07bd7b7/d73c67d5-917c-48a0-a67e-534a64ce08df.jpg"
tags:
  - name: "AWS"
    slug: "aws"
  - name: "serverless"
    slug: "serverless"
  - name: "AI"
    slug: "ai"
  - name: "PostgreSQL"
    slug: "postgresql"
  - name: "Node.js"
    slug: "nodejs"
---
<p>I was knee-deep in building my SaaS when users started asking questions I couldn't answer from the UI alone. My app had a solid backend, Lambda functions, Fastify, PostgreSQL on RDS. I wrote about that whole architecture in my previous post. But users wanted to search through documentation, find answers buried in help articles, and ask natural-language questions about the product. The UI just wasn't built for that.</p>
<p>So I started looking into RAG. Every tutorial I found showed the same setup: LangChain running locally, Pinecone for vectors, and a Python script tying it all together. Great for demos. Not great for a production SaaS already running on AWS.</p>
<p>Here's the thing. I didn't want to add another service to my stack. I was already paying for PostgreSQL on RDS. I was already managing Lambda functions. Adding Pinecone or Weaviate meant another bill, another SDK, another thing to monitor at 2 AM. Then I found pgvector, and everything clicked.</p>
<p>pgvector is a PostgreSQL extension. It adds vector storage and similarity search right inside the database I was already running. No new infrastructure. No new vendor. Just an extension. I paired it with Lambda for compute, Bedrock for the LLM, and RDS Proxy for connection pooling. The whole pipeline costs me about $54/month at 10K queries per day.</p>
<p>Let me walk you through every piece of how I built it.</p>
<p><img src="https://images.pexels.com/photos/8849295/pexels-photo-8849295.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="AI data pipeline and technology" />
<sub>Photo by <a href="https://www.pexels.com/@tara-winstead">Tara Winstead</a> on <a href="https://www.pexels.com/photo/an-artificial-intelligence-illustration-on-the-wall-8849295/">Pexels</a></sub></p>
<h2>What Is RAG and Why Does It Work</h2>
<p>RAG stands for Retrieval-Augmented Generation. The name sounds academic, but the idea is simple. And once I understood it, I realized it was exactly what my users were asking for without knowing the term.</p>
<p>You have your own data. Documents, help articles, product specs, whatever. You want an LLM to answer questions about that data. But the LLM was trained on the internet, not your private stuff. So you give it context at query time.</p>
<p>The flow looks like this:</p>
<ol>
<li><strong>User asks a question.</strong> "How do I reset my API key?"</li>
<li><strong>Retrieval step.</strong> You search your own documents for the most relevant chunks. This is semantic search, not keyword matching. You're comparing the meaning of the question against the meaning of each chunk.</li>
<li><strong>Generation step.</strong> You stuff those relevant chunks into a prompt and send it to the LLM. "Based on the following context, answer this question."</li>
<li><strong>LLM responds</strong> with an answer grounded in your actual data.</li>
</ol>
<p>That's it. No fine-tuning. No retraining. No waiting weeks for a model to learn your docs.</p>
<p>And that's exactly why RAG beats fine-tuning for most use cases. Fine-tuning is slow, expensive, and your model becomes stale the moment your data changes. With RAG, you just update the documents in your database. The next query picks up the new content automatically. Your data is always live.</p>
<p>The magic is in the retrieval step. If you retrieve the right chunks, the LLM gives great answers. If you retrieve garbage, the LLM confidently presents garbage. So the vector search layer matters a lot. That's where pgvector comes in. And for my SaaS, it meant I could keep everything inside the PostgreSQL instance I was already running.</p>
<p><img src="https://images.pexels.com/photos/6986455/pexels-photo-6986455.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="Data retrieval and search concept" />
<sub>Photo by <a href="https://www.pexels.com/@cottonbro">cottonbro studio</a> on <a href="https://www.pexels.com/photo/google-browser-on-laptop-6986455/">Pexels</a></sub></p>
<h2>Setting Up pgvector in PostgreSQL (RDS)</h2>
<p>When I first looked at Pinecone, I nearly added it. The docs are slick and the onboarding is smooth. Then I checked the pricing page and realized I was already paying for PostgreSQL. Why add another database when I could just enable an extension?</p>
<p>If you're already running PostgreSQL on RDS, adding vector search is surprisingly easy. You don't need Pinecone. You don't need Weaviate. You just enable an extension.</p>
<p>pgvector adds a <code>vector</code> column type to PostgreSQL. You store embeddings as vectors, then query them with distance operators. Cosine similarity, L2 distance, inner product. All the standard stuff.</p>
<h3>Enable the Extension</h3>
<p>First, make sure your RDS parameter group allows pgvector. Here's the CloudFormation snippet:</p>
<pre><code class="language-yaml">RDSParameterGroup:
  Type: AWS::RDS::DBParameterGroup
  Properties:
    Family: postgres16
    Description: "PostgreSQL 16 with pgvector"
    Parameters:
      shared_preload_libraries: "pg_stat_statements,pgvector"
</code></pre>
<p>Then run the SQL to create the extension:</p>
<pre><code class="language-sql">CREATE EXTENSION IF NOT EXISTS vector;
</code></pre>
<p>That's it. PostgreSQL now understands vectors.</p>
<h3>Create the Embeddings Table</h3>
<p>Here's the schema I use. The <code>vector(1536)</code> column size matches OpenAI's <code>text-embedding-3-small</code> model. If you're using Bedrock Titan, switch to <code>vector(1024)</code>.</p>
<pre><code class="language-sql">CREATE TABLE hrr_document_chunks (
  id            BIGSERIAL PRIMARY KEY,
  document_id   TEXT NOT NULL,
  chunk_index   INTEGER NOT NULL,
  content       TEXT NOT NULL,
  metadata      JSONB DEFAULT '{}',
  embedding     vector(1536) NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (document_id, chunk_index)
);
</code></pre>
<p>The <code>metadata</code> column is a JSONB field where I store things like the source URL, document title, section heading, and any other context that helps with filtering later. You'll want this when your dataset grows and you need to scope searches to specific document types.</p>
<h3>Create an HNSW Index</h3>
<p>Without an index, pgvector does a sequential scan. That's fine for a few thousand rows. But once you hit tens of thousands of embeddings, you need an index.</p>
<p>I recommend HNSW over IVFFlat. HNSW is slightly slower to build but gives better recall and works much better for Lambda workloads. More on that in the lessons learned section.</p>
<pre><code class="language-sql">CREATE INDEX idx_chunks_embedding_hnsw
  ON hrr_document_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 200);
</code></pre>
<p>The <code>m</code> and <code>ef_construction</code> parameters control the index quality. Higher values give better recall but slower inserts. These defaults work well for datasets up to about 500K embeddings. I landed on these numbers after a week of testing different configurations against my own dataset.</p>
<p><img src="https://images.pexels.com/photos/1933900/pexels-photo-1933900.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="PostgreSQL database setup and schema" />
<sub>Photo by <a href="https://www.pexels.com/@rahulp9800">Rahul Pandit</a> on <a href="https://www.pexels.com/photo/blue-and-red-light-from-computer-1933900/">Pexels</a></sub></p>
<h2>Generating and Storing Embeddings</h2>
<p>Now you need to get your data into that table. This is the ingestion pipeline: take your documents, break them into chunks, generate embeddings for each chunk, and store everything in pgvector.</p>
<p>For my SaaS, the documents were help articles, product guides, and FAQ pages that users kept asking about. I run ingestion as a separate Lambda function. It gets triggered whenever new documents are added, either through an S3 event or a direct API call.</p>
<h3>Chunking</h3>
<p>Chunking strategy matters more than most people think. I split documents into chunks of about 500 tokens with a 50-token overlap between consecutive chunks. The overlap prevents information from getting lost at chunk boundaries.</p>
<pre><code class="language-javascript">function chunkDocument(text, maxTokens = 500, overlap = 50) {
  const sentences = text.split(/(?&lt;=[.!?])\s+/);
  const chunks = [];
  let currentChunk = [];
  let currentLength = 0;

  for (const sentence of sentences) {
    const sentenceTokens = estimateTokens(sentence);

    if (currentLength + sentenceTokens &gt; maxTokens &amp;&amp; currentChunk.length &gt; 0) {
      chunks.push(currentChunk.join(" "));

      // Keep last few sentences for overlap
      const overlapSentences = [];
      let overlapLength = 0;
      for (let i = currentChunk.length - 1; i &gt;= 0; i--) {
        overlapLength += estimateTokens(currentChunk[i]);
        if (overlapLength &gt; overlap) break;
        overlapSentences.unshift(currentChunk[i]);
      }
      currentChunk = overlapSentences;
      currentLength = overlapLength;
    }

    currentChunk.push(sentence);
    currentLength += sentenceTokens;
  }

  if (currentChunk.length &gt; 0) {
    chunks.push(currentChunk.join(" "));
  }

  return chunks;
}

function estimateTokens(text) {
  return Math.ceil(text.split(/\s+/).length * 1.3);
}
</code></pre>
<h3>Generating Embeddings with Bedrock Titan</h3>
<p>Here's how to call Bedrock's Titan Embeddings model. This uses the AWS SDK v3:</p>
<pre><code class="language-javascript">import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const bedrockClient = new BedrockRuntimeClient({ region: "us-east-1" });

async function generateEmbedding(text) {
  const response = await bedrockClient.send(
    new InvokeModelCommand({
      modelId: "amazon.titan-embed-text-v2:0",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        inputText: text,
        dimensions: 1024,
        normalize: true,
      }),
    })
  );

  const result = JSON.parse(new TextDecoder().decode(response.body));
  return result.embedding;
}
</code></pre>
<p>If you prefer OpenAI embeddings instead, the call is straightforward:</p>
<pre><code class="language-javascript">async function generateEmbeddingOpenAI(text) {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text,
    }),
  });

  const data = await response.json();
  return data.data[0].embedding;
}
</code></pre>
<h3>Upserting Chunks</h3>
<p>Now bring it all together. Chunk the document, embed each chunk, and upsert into pgvector:</p>
<pre><code class="language-javascript">async function ingestDocument(pool, documentId, text, metadata = {}) {
  const chunks = chunkDocument(text);

  for (let i = 0; i &lt; chunks.length; i++) {
    const embedding = await generateEmbedding(chunks[i]);

    await pool.query(
      `INSERT INTO hrr_document_chunks (document_id, chunk_index, content, metadata, embedding)
       VALUES (\(1, \)2, \(3, \)4, $5::vector)
       ON CONFLICT (document_id, chunk_index)
       DO UPDATE SET content = \(3, metadata = \)4, embedding = $5::vector, updated_at = NOW()`,
      [documentId, i, chunks[i], JSON.stringify(metadata), JSON.stringify(embedding)]
    );
  }

  // Clean up old chunks if document got shorter
  await pool.query(
    `DELETE FROM hrr_document_chunks WHERE document_id = \(1 AND chunk_index &gt;= \)2`,
    [documentId, chunks.length]
  );

  return chunks.length;
}
</code></pre>
<p>The <code>ON CONFLICT</code> clause handles re-ingestion cleanly. If a document gets updated, you just run ingest again and it overwrites the old chunks. The cleanup query at the end removes stale chunks if the document got shorter after an edit.</p>
<p>One thing to watch out for: Bedrock Titan has a rate limit. I hit this on day one when I tried to ingest my entire knowledge base at once. If you're ingesting thousands of documents, add a small delay between embedding calls or use batch processing. I throttle to about 10 requests per second and that's been reliable.</p>
<p><img src="https://images.pexels.com/photos/17940257/pexels-photo-17940257.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="Data processing and ingestion pipeline" />
<sub>Photo by <a href="https://www.pexels.com/@dungmedia">Media Dung</a> on <a href="https://www.pexels.com/photo/computer-and-scanner-in-laboratory-17940257/">Pexels</a></sub></p>
<h2>Retrieval: Semantic Search on Lambda</h2>
<p>This is the part that made it all feel real. A user sends a question, and you need to find the most relevant chunks from your database. Fast.</p>
<p>The first time I ran a semantic search against my own docs and got back exactly the right paragraph, I knew this was going to work. The retrieval Lambda takes a query string, embeds it using the same model you used for ingestion, then runs a cosine similarity search against pgvector. The whole thing takes about 100-200ms on a warm Lambda invocation.</p>
<pre><code class="language-javascript">async function retrieveChunks(pool, query, topK = 5) {
  // Embed the user's query with the same model used for ingestion
  const queryEmbedding = await generateEmbedding(query);

  // Cosine similarity search using pgvector's &lt;=&gt; operator
  const result = await pool.query(
    `SELECT
       id,
       document_id,
       content,
       metadata,
       1 - (embedding &lt;=&gt; $1::vector) AS similarity
     FROM hrr_document_chunks
     WHERE 1 - (embedding &lt;=&gt; $1::vector) &gt; 0.3
     ORDER BY embedding &lt;=&gt; $1::vector
     LIMIT $2`,
    [JSON.stringify(queryEmbedding), topK]
  );

  return result.rows;
}
</code></pre>
<p>A few things to notice here.</p>
<p>The <code>&lt;=&gt;</code> operator is pgvector's cosine distance. Lower distance means higher similarity. I compute <code>1 - distance</code> to get a similarity score between 0 and 1. The <code>WHERE</code> clause filters out anything below 0.3 similarity, which cuts out the noise. You don't want the LLM seeing irrelevant chunks.</p>
<p>The <code>topK</code> parameter controls how many chunks you return. I default to 5. Going higher gives the LLM more context but costs more tokens. Going lower risks missing relevant information. Five is a good starting point for most use cases.</p>
<h3>Connection Pooling with RDS Proxy</h3>
<p>If you read my previous post, you know this pattern. Lambda functions can spin up hundreds of concurrent instances. Each one opens a database connection. Without connection pooling, you'll exhaust PostgreSQL's connection limit in seconds.</p>
<p>RDS Proxy handles this. Your Lambda points to the proxy endpoint, and the proxy multiplexes connections to the actual database. The code is identical to a normal <code>pg.Pool</code> setup:</p>
<pre><code class="language-javascript">import pg from "pg";

const pool = new pg.Pool({
  host: process.env.DB_HOST,     // RDS Proxy endpoint
  port: 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: { rejectUnauthorized: true },
});
</code></pre>
<p>Set <code>max: 5</code> on the Lambda side. The proxy handles the actual pooling across all Lambda instances. Keeping the per-function pool small prevents any single Lambda from hogging connections.</p>
<p><img src="https://images.pexels.com/photos/6120185/pexels-photo-6120185.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="Semantic search and vector similarity" />
<sub>Photo by <a href="https://www.pexels.com/@n-voitkevich">Nataliya Vaitkevich</a> on <a href="https://www.pexels.com/photo/smartphone-on-black-table-6120185/">Pexels</a></sub></p>
<h2>Generation: Calling the LLM with Context</h2>
<p>You've retrieved the relevant chunks. Now you need to turn them into an answer. This is where the LLM comes in.</p>
<p>I went back and forth on this part. The idea is simple: build a prompt that includes the retrieved chunks as context, along with the user's question. Then call the LLM and return whatever it generates. But getting the prompt right took more iterations than I expected.</p>
<h3>The Prompt Template</h3>
<p>Here's the prompt template I use. It's deliberately strict about staying grounded in the context:</p>
<pre><code class="language-javascript">function buildPrompt(question, chunks) {
  const context = chunks
    .map((chunk, i) =&gt; `[Source \({i + 1}] \){chunk.content}`)
    .join("\n\n");

  return {
    system: `You are a helpful assistant that answers questions based on the provided context.
Rules:
- Only use information from the provided context to answer.
- If the context does not contain enough information, say so honestly.
- Keep answers concise and direct.
- Reference which source(s) you used when possible.`,
    user: `Context:
${context}

Question: ${question}

Answer based only on the context above.`,
  };
}
</code></pre>
<p>That system prompt is important. I learned this after my first demo went sideways. Without explicit instructions to stay grounded, the LLM will happily make things up using its training data. One of my test users asked about a feature we didn't have, and the LLM invented a whole tutorial for it. The "say so honestly" part is key. I'd rather get an "I don't have enough information" response than a confident hallucination.</p>
<h3>Calling Bedrock Claude</h3>
<p>Here's the Bedrock call using Claude Haiku. I use Haiku instead of Sonnet for RAG because it's 10x cheaper and the quality difference is minimal when you're giving it good context:</p>
<pre><code class="language-javascript">import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const bedrockClient = new BedrockRuntimeClient({ region: "us-east-1" });

async function generateAnswer(question, chunks) {
  const prompt = buildPrompt(question, chunks);

  const response = await bedrockClient.send(
    new InvokeModelCommand({
      modelId: "anthropic.claude-3-haiku-20240307-v1:0",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 1024,
        system: prompt.system,
        messages: [{ role: "user", content: prompt.user }],
      }),
    })
  );

  const result = JSON.parse(new TextDecoder().decode(response.body));
  return result.content[0].text;
}
</code></pre>
<h3>Handling Token Limits</h3>
<p>Here's a practical concern. Each chunk might be 500 tokens. If you retrieve 5 chunks, that's 2,500 tokens of context. Add the system prompt, the question, and the response, and you're looking at maybe 4,000 tokens total. That fits easily within Haiku's context window.</p>
<p>But what if your chunks are longer, or you need more of them? I cap the total context at 3,000 tokens and truncate the lowest-similarity chunks first:</p>
<pre><code class="language-javascript">function truncateContext(chunks, maxTokens = 3000) {
  let totalTokens = 0;
  const selected = [];

  for (const chunk of chunks) {
    const tokens = estimateTokens(chunk.content);
    if (totalTokens + tokens &gt; maxTokens) break;
    selected.push(chunk);
    totalTokens += tokens;
  }

  return selected;
}
</code></pre>
<p>Since the chunks are already sorted by similarity (highest first), this naturally keeps the most relevant ones and drops the least relevant. Simple and effective.</p>
<p><img src="https://images.pexels.com/photos/30530406/pexels-photo-30530406.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="AI language model and chat interface" />
<sub>Photo by <a href="https://www.pexels.com/@bertellifotografia">Matheus Bertelli</a> on <a href="https://www.pexels.com/photo/ai-chat-interface-display-on-laptop-30530406/">Pexels</a></sub></p>
<h2>Wiring It Together: The API Endpoint</h2>
<p>Now let's connect everything. This is where my existing SaaS architecture paid off. The API endpoint receives a question, runs retrieval, generates an answer, and returns it. I use Fastify on Lambda (same setup as my previous post), and adding a new route was straightforward. The pattern works with any framework.</p>
<pre><code class="language-javascript">async function ragHandler(request, reply) {
  const { question } = request.body;

  if (!question || question.trim().length === 0) {
    return reply.status(400).send({ error: "Question is required" });
  }

  // Step 1: Retrieve relevant chunks
  const chunks = await retrieveChunks(request.server.pg, question, 5);

  if (chunks.length === 0) {
    return reply.send({
      answer: "I couldn't find any relevant information to answer your question.",
      sources: [],
    });
  }

  // Step 2: Truncate context to fit token limits
  const trimmedChunks = truncateContext(chunks);

  // Step 3: Generate answer
  const answer = await generateAnswer(question, trimmedChunks);

  // Step 4: Return answer with source metadata
  return reply.send({
    answer,
    sources: trimmedChunks.map((c) =&gt; ({
      documentId: c.document_id,
      similarity: parseFloat(c.similarity.toFixed(3)),
      preview: c.content.substring(0, 150) + "...",
    })),
  });
}

// Register the route
app.post("/rag/ask", {
  schema: {
    body: {
      type: "object",
      required: ["question"],
      properties: {
        question: { type: "string", minLength: 1, maxLength: 1000 },
      },
    },
  },
  preHandler: [app.authenticate],
  handler: ragHandler,
});
</code></pre>
<p>The handler is intentionally thin. Retrieval and generation are separate modules. This makes testing easy. You can unit test the chunking, the retrieval query, and the prompt template independently. The handler just orchestrates the flow.</p>
<p>I also return the source metadata alongside the answer. This is useful for two reasons. First, your frontend can show users where the answer came from, which builds trust. Second, it helps you debug retrieval quality. If the answer is wrong, check the sources. Nine times out of ten, the problem is that retrieval returned the wrong chunks, not that the LLM misunderstood them.</p>
<p>The <code>preHandler</code> uses the same authentication middleware from my existing API. This was one of the perks of building RAG into my existing stack instead of bolting on a separate service. Same auth, same rate limiting, same logging. RAG endpoints should always be authenticated. You don't want someone querying your private documents without authorization.</p>
<p><img src="https://images.pexels.com/photos/5480781/pexels-photo-5480781.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="API endpoint and server architecture" />
<sub>Photo by <a href="https://www.pexels.com/@brett-sayles">Brett Sayles</a> on <a href="https://www.pexels.com/photo/server-racks-on-data-center-5480781/">Pexels</a></sub></p>
<h2>Cost Breakdown</h2>
<p>Let's talk real numbers. This was a big deal for me because I didn't want RAG to double my AWS bill. I'm going to break down costs for a small AI SaaS handling about 10,000 RAG queries per day.</p>
<h3>The Infrastructure</h3>
<table>
<thead>
<tr>
<th>Component</th>
<th>Monthly Cost</th>
<th>Notes</th>
</tr>
</thead>
<tbody><tr>
<td>RDS db.t3.micro (PostgreSQL + pgvector)</td>
<td>~$15</td>
<td>2 vCPU, 1GB RAM, 20GB storage</td>
</tr>
<tr>
<td>RDS Proxy</td>
<td>~$20</td>
<td>Connection pooling for Lambda</td>
</tr>
<tr>
<td>Lambda (retrieval + generation)</td>
<td>~$5</td>
<td>512MB, avg 300ms per invocation</td>
</tr>
<tr>
<td>API Gateway (HTTP API)</td>
<td>~$3</td>
<td>$1 per million requests</td>
</tr>
<tr>
<td>Bedrock Titan Embeddings</td>
<td>~$3</td>
<td>~$0.10 per 1M tokens, ~30M tokens/month</td>
</tr>
<tr>
<td>Bedrock Claude Haiku (generation)</td>
<td>~$8</td>
<td>~\(0.25/1M input, ~\)1.25/1M output tokens</td>
</tr>
<tr>
<td><strong>Total</strong></td>
<td><strong>~$54/month</strong></td>
<td></td>
</tr>
</tbody></table>
<p>That's $54/month for a production RAG pipeline handling 10K queries per day. Not bad.</p>
<h3>Compared to Hosted Vector Databases</h3>
<p>Now let's compare to what you'd pay with a dedicated vector database:</p>
<ul>
<li><strong>Pinecone Starter</strong>: ~$70/month for 1M vectors. And you still need the LLM costs on top of that.</li>
<li><strong>Weaviate Cloud</strong>: ~$25/month for their starter tier. Plus compute for the actual search.</li>
<li><strong>Qdrant Cloud</strong>: ~$30/month for a small instance.</li>
</ul>
<p>With pgvector, the vector storage cost is zero because it's part of your existing PostgreSQL instance. You're already paying for RDS. The extension is free. This is exactly why I went this route. I just added vector search to a database I was already running and paying for.</p>
<p>The math is clear: if you already have PostgreSQL on RDS, pgvector is the cheapest vector database alternative out there. You avoid a whole separate service, a separate bill, and separate operational overhead.</p>
<h3>Where the Money Actually Goes</h3>
<p>The biggest cost in a RAG pipeline is not storage or compute. It's the LLM generation calls. At 10K queries per day with Claude Haiku, you're spending about \(8/month on generation alone. Switch to Claude Sonnet and that jumps to ~\)80/month. Switch to GPT-4o and you're looking at ~$150/month.</p>
<p>So choose your generation model carefully. For most RAG use cases, Haiku or GPT-4o-mini gives you 90% of the quality at 10% of the cost. Save the big models for cases where answer quality justifies the spend.</p>
<p><img src="https://images.pexels.com/photos/5561913/pexels-photo-5561913.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="Cost analysis and comparison chart" />
<sub>Photo by <a href="https://www.pexels.com/@leeloothefirst">Leeloo The First</a> on <a href="https://www.pexels.com/photo/magnifying-glass-on-white-paper-with-statistical-data-5561913/">Pexels</a></sub></p>
<h2>Lessons Learned</h2>
<p>After running this RAG pipeline in production for a few months, here are the things I learned the hard way. Every one of these cost me hours of debugging or unnecessary spending.</p>
<h3>1. Chunking Strategy Matters More Than the Embedding Model</h3>
<p>I wasted about two weeks on this one. I was obsessing over Titan vs. OpenAI embeddings, running benchmarks, comparing similarity scores. The difference in retrieval quality between them was maybe 5%. Then I changed my chunking from fixed 1000-token chunks to 500-token chunks with overlap, and retrieval quality jumped by 30%. Two weeks of model comparison, undone by a single config change.</p>
<p>The reason is obvious in hindsight. Smaller chunks are more precise. When a user asks a specific question, a 500-token chunk about that exact topic scores much higher than a 1000-token chunk where the relevant part is buried in the middle. The overlap makes sure you don't lose context at chunk boundaries.</p>
<p>If your RAG answers feel "off," look at your chunks before you look at your embedding model. I wish someone had told me that from day one.</p>
<h3>2. HNSW Index vs. IVFFlat for Lambda</h3>
<p>This one bit me in production. pgvector supports two index types: IVFFlat and HNSW. I started with IVFFlat because the internet says it's faster to build. That was a mistake I didn't catch until users complained about slow first responses.</p>
<p>IVFFlat requires a "warm-up" query to load the index into memory. On Lambda, that warm-up happens on every cold start. It added about 400ms to the first query after a cold start. My users noticed. I got support tickets about it.</p>
<p>HNSW doesn't need warm-up. The first query is about the same speed as subsequent ones. The moment I switched, the cold start complaints stopped. For Lambda workloads where cold starts are a reality, HNSW is the better choice. The trade-off is that HNSW uses more memory and takes longer to build, but you're building the index once and querying it thousands of times. The build cost is irrelevant.</p>
<h3>3. Cache Embeddings for Repeated Queries</h3>
<p>I noticed this pattern about a month in. Users ask the same questions over and over. "How do I reset my password?" "What are the pricing tiers?" "How do I cancel?" I was paying Bedrock to embed identical strings dozens of times a day.</p>
<p>Embedding the same question every time wastes money and adds latency. I added a simple cache using a hash of the query text:</p>
<pre><code class="language-javascript">const embeddingCache = new Map();

async function getEmbedding(text) {
  const cacheKey = createHash("sha256").update(text.toLowerCase().trim()).digest("hex");

  if (embeddingCache.has(cacheKey)) {
    return embeddingCache.get(cacheKey);
  }

  const embedding = await generateEmbedding(text);
  embeddingCache.set(cacheKey, embedding);

  // Keep cache from growing forever
  if (embeddingCache.size &gt; 1000) {
    const firstKey = embeddingCache.keys().next().value;
    embeddingCache.delete(firstKey);
  }

  return embedding;
}
</code></pre>
<p>This is an in-memory cache, so it lives as long as the Lambda container. For a warmer setup, you could use DynamoDB or ElastiCache, but the in-memory approach works surprisingly well. In my case, about 40% of queries are cache hits within the same Lambda container.</p>
<h3>4. Monitor Retrieval Quality Separately from Generation Quality</h3>
<p>I spent an entire weekend debugging a "wrong answer" that a user reported. I was blaming the LLM, tweaking the prompt, trying different temperature settings. Then I finally looked at the retrieved chunks and realized the retrieval step had pulled in completely irrelevant paragraphs. The LLM was doing its best with garbage context. That weekend taught me to always check retrieval first.</p>
<p>Now I log both steps separately:</p>
<ul>
<li><strong>Retrieval quality</strong>: log the query, the returned chunks, and their similarity scores. Review the lowest-scoring returned chunks regularly. If they're irrelevant, your similarity threshold is too low.</li>
<li><strong>Generation quality</strong>: log the prompt (with context) and the LLM's response. When users report bad answers, check whether the context contained the right information.</li>
</ul>
<p>Most of the time, bad answers come from bad retrieval. The LLM is usually fine if you give it the right context. So investing in better chunking, better metadata filtering, and tuning your similarity threshold pays off way more than switching to a fancier LLM.</p>
<p><img src="https://images.pexels.com/photos/8923526/pexels-photo-8923526.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="Lessons learned and knowledge growth" />
<sub>Photo by <a href="https://www.pexels.com/@mikhail-nilov">Mikhail Nilov</a> on <a href="https://www.pexels.com/photo/back-view-of-a-girl-writing-on-the-whiteboard-8923526/">Pexels</a></sub></p>
<h2>Conclusion</h2>
<p>My SaaS now has a <code>/rag/ask</code> endpoint that my users actually love. They type a question, get an answer grounded in our own documentation, and see exactly which sources the answer came from. The whole thing runs on the same Lambda and PostgreSQL stack I was already using. No new services. No new vendors. Just pgvector and a few hundred lines of code.</p>
<p>Looking back, the decision to keep everything inside my existing stack was the right call. I avoided a separate vector database bill, a separate SDK to maintain, and a separate service to monitor. pgvector gave me semantic search, HNSW indexing, and cosine similarity queries inside the database I already knew how to operate. The total cost sits around $54/month at 10K queries per day.</p>
<p>If I were starting over, I'd change one thing. I would spend more time on chunking from the very beginning instead of comparing embedding models. Good chunks make everything downstream better. Bad chunks make everything worse, no matter how fancy your LLM is. I learned that lesson the expensive way.</p>
<p>For anyone building an AI SaaS on AWS, this setup hits a sweet spot. Low cost, minimal operational overhead, and your data stays in PostgreSQL where you can query it with regular SQL alongside your vector searches. If you already have the Lambda and RDS stack running, you're closer to production RAG than you think.</p>
<p>Now go build something cool with it.</p>
<p>Hope you enjoyed this walkthrough. If you have questions about any part of the pipeline, or if you've built something similar and want to compare notes, reach out.</p>
<hr />
<p><em>Follow me on <a href="https://x.com/HarunRRayhan">Twitter/X</a> for more posts about AWS, serverless, and building AI products. I share what actually works in production, not just what looks good in tutorials.</em></p>
<p><img src="https://images.pexels.com/photos/34920288/pexels-photo-34920288.png?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="Cloud computing and serverless technology" />
<sub>Photo by <a href="https://www.pexels.com/@nicolas-foster-65973708">Nicolas  Foster</a> on <a href="https://www.pexels.com/photo/vintage-amd-motherboard-with-pci-and-agp-slots-34920288/">Pexels</a></sub></p>
