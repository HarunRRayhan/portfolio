---
title: "Persistence Is Not Permission: Re-Auth RAG Citations on Chat Replay"
slug: "persistence-is-not-permission-rag-citation-reauth-chat-replay"
brief: "A contractor lost access to a folder in March and could still read the source cards from it in September, because our chat history endpoint served citations that had been authorized once, at write time, and never again. Here's the fix on API Gateway, Lambda, DynamoDB, and pgvector: store citation refs instead of blobs, re-run the live entitlement check on every history read, tombstone what the caller can no longer see, and fail closed on both unknown and denied sessions."
publishedAt: "2026-08-29T18:00:00.000Z"
draft: true
draftToken: "04916b2b6a29152cebe25427a0cff649"
readTimeInMinutes: 15
coverImageUrl: "/blog-assets/persistence-is-not-permission-rag-citation-reauth-chat-replay/cover.jpg"
reactionCount: 0
responseCount: 0
replyCount: 0
tags:
  - name: AWS
    slug: aws
  - name: Lambda
    slug: lambda
  - name: DynamoDB
    slug: dynamodb
  - name: RAG
    slug: rag
  - name: Security
    slug: security
  - name: Terraform
    slug: terraform
---

<p>A client's contractor finished her engagement in March. Offboarding went the way it's supposed to: her group membership was removed, her access to the legal folder in their document store was revoked, and a live search for anything in that folder returned nothing. I checked. That part worked.</p>

<p>In September she opened the app to grab something out of an old conversation, scrolled up to a thread from February, and the source cards were all still sitting there. Document titles, page numbers, the two-line snippet we render under each card. Four documents she had not been allowed to open since March, rendered on her screen, in a UI that looked exactly as authoritative as it had in February.</p>

<p>Nothing was broken. The history endpoint did precisely what I wrote it to do. It read the turn out of DynamoDB and returned the citation objects that were saved on it. Those objects were authorized once, at write time, in February, by a check that had been correct that day.</p>

<p>The bug was an assumption I'd never written down anywhere: that because she'd already seen it, showing it again was free.</p>

<h2>The source card is a read path, and I never treated it like one</h2>

<p>When you add citations to a RAG answer you're doing it for trust. The model says something, the card underneath says where it came from, the user clicks through and verifies. Good feature. I'd build it again.</p>

<p>What I missed is what the card actually is once you persist it. At write time it's a rendering detail. Six months later it's a second, unguarded route to document content, sitting behind an endpoint whose name suggests it only returns text.</p>

<p>And the snippet is the sharp end. Titles leak plenty, but our cards carried a 200 character excerpt of the matched chunk, because that's what makes a citation useful instead of decorative. So the history endpoint was serving actual document text from a folder the caller had been locked out of half a year earlier.</p>

<p>The phrase I keep coming back to, because it's the whole post in five words: <strong>persistence is not permission</strong>. Storing an authorization decision alongside the data it authorized turns a point-in-time check into a permanent grant. Entitlements drift. People change teams, contracts end, a document gets reclassified, a feature flag that gated a whole corpus gets turned off for a tenant that stopped paying for it. Every one of those events invalidates decisions you made before it, and none of them reach back into your DynamoDB items to clean up.</p>

<p>This is a different problem from the one people usually mean by "RAG security," which is mostly about retrieval time: filtering the vector search by tenant, keeping one customer's embeddings out of another customer's neighbors. I did that work when I built the pipeline, and it held. The tenant predicate on the pgvector query in <a href="/blog/building-a-production-rag-pipeline-on-aws-lambda-pgvector">the production RAG pipeline I run on Lambda and pgvector</a> was doing its job in September exactly as well as it had in February. Retrieval quality and retrieval scoping are their own topic. This is authorization on <em>replay</em>, and replay was a path I'd built without ever really counting it as one.</p>

<h2>What the write path stores now</h2>

<p>The rule is one line: a persisted turn holds references, never content.</p>

<p>Chat turns live in DynamoDB. Partition key is the session, sort key is a zero-padded turn number, which is the same table that backs <a href="/blog/real-time-ai-chat-with-lambda-api-gateway-websockets">the real-time chat I run on Lambda and API Gateway WebSockets</a>. The socket writes turns as tokens stream, and a plain REST endpoint reads them back later. Those are two different consumers of one table, and only one of them was ever really designed as a read path.</p>

<pre><code class="language-typescript">type HrrTurn = {
  pk: string;                 // SESSION#&lt;sessionId&gt;
  sk: string;                 // TURN#000004
  tenantId: string;
  role: "user" | "assistant";
  text: string;               // assistant prose, with inline [1] [2] markers
  citationRefs?: HrrCitationRef[];
  createdAt: number;
  expiresAt: number;          // TTL
};

type HrrCitationRef = {
  marker: number;             // the [2] in the text
  docId: string;              // "doc_9f4c1ab2"
  chunkId: string;            // "doc_9f4c1ab2#p14c3"
  page?: number;
};
</code></pre>

<p>Notice what's gone. No <code>title</code>. No <code>snippet</code>. No <code>url</code>. No <code>score</code>. Those all used to be on the item, because writing them once and reading them back is obviously cheaper than resolving them on every history page, and cheapness was the only axis I was optimizing on.</p>

<p>Now the title and the snippet get resolved at read time, from pgvector and S3, and only after the caller has been re-checked against that specific document. The reference is inert on its own. A <code>docId</code> in a DynamoDB item tells an attacker who somehow reads the table that a document exists, which is a real but much smaller leak than handing them a paragraph of its contents.</p>

<p>I'll be honest that this costs something. Rendering a 20 turn history now means resolving document metadata instead of echoing stored strings. I'll get to the numbers, but the short version is that it's a batch query and a cache, not a per-card round trip, and it landed well inside what the UI could absorb.</p>

<h2>The read path: the same check, not a similar one</h2>

<p>The part that matters most here isn't the re-check. It's that the history endpoint calls the <em>exact same function</em> live search calls. Not a reimplementation. Not a simplified version that skips the feature flag lookup because history is "just reading."</p>

<p>I've written the second-copy version of an authorization check before and it always rots the same way. Someone adds a condition to the live path in a hurry, the replay path doesn't get it, and the two drift apart quietly for months. So the entitlement filter is one module, it takes a principal and a set of document IDs, and it returns the subset that principal can read right now.</p>

<pre><code class="language-typescript">// The ONLY entitlement entry point. Live search and history replay both
// call this. If you find yourself writing a second one, don't.
export async function hrr_filterEntitledDocs(
  principal: HrrPrincipal,
  docIds: string[],
): Promise&lt;Set&lt;string&gt;&gt; {
  if (docIds.length === 0) return new Set();

  const flags = await hrr_getTenantFlags(principal.tenantId);
  if (!flags.ragCitationsEnabled) return new Set();

  const rows = await hrr_pg.query(
    `SELECT d.doc_id
       FROM hrr_documents d
       JOIN hrr_doc_grants g ON g.doc_id = d.doc_id
      WHERE d.tenant_id = $1
        AND d.doc_id = ANY($2::text[])
        AND d.deleted_at IS NULL
        AND g.principal_ref = ANY($3::text[])
        AND (g.expires_at IS NULL OR g.expires_at &gt; NOW())`,
    [principal.tenantId, docIds, hrr_principalRefs(principal)],
  );

  return new Set(rows.rows.map((r) =&gt; r.doc_id));
}
</code></pre>

<p><code>hrr_principalRefs</code> expands the caller into everything a grant can be written against: their user ID, their group IDs, their role, and the tenant wildcard. That's the ABAC part, and keeping it inside this module is deliberate. The caller passes a principal and gets back a set. It doesn't get to know how the decision was made, so it can't accidentally reproduce half of it.</p>

<p>The feature flag check being in here, above the query, is worth pointing at. A tenant that dropped the plan tier that includes citations should stop seeing citations, including in old threads. That's a product rule, not a security rule, but it fails the same way if replay skips it: they keep the feature they stopped paying for, in exactly the conversations they care most about.</p>

<p>The history handler then does the boring thing:</p>

<pre><code class="language-typescript">export async function hrr_getHistory(
  principal: HrrPrincipal,
  sessionId: string,
): Promise&lt;HrrHistoryResponse&gt; {
  const turns = await hrr_queryTurns(principal.tenantId, sessionId);

  // One dedup pass across the whole page. A 20 turn history with 4 citations
  // per assistant turn is ~40 refs but usually 12 to 18 distinct docIds.
  const docIds = [
    ...new Set(turns.flatMap((t) =&gt; t.citationRefs?.map((c) =&gt; c.docId) ?? [])),
  ];

  const allowed = await hrr_filterEntitledDocs(principal, docIds);
  const meta = await hrr_resolveDocMeta([...allowed]);

  const stripped: string[] = [];

  const rendered = turns.map((turn) =&gt; ({
    role: turn.role,
    text: turn.text,
    citations: (turn.citationRefs ?? []).map((ref) =&gt; {
      if (!allowed.has(ref.docId)) {
        stripped.push(ref.docId);
        return { marker: ref.marker, state: "unavailable" as const };
      }
      const m = meta.get(ref.docId)!;
      return {
        marker: ref.marker,
        state: "ok" as const,
        title: m.title,
        page: ref.page,
        snippet: m.snippets.get(ref.chunkId),
        url: hrr_signedDocUrl(principal, ref),
      };
    }),
  }));

  if (stripped.length &gt; 0) {
    await hrr_emitCitationStripped(principal, sessionId, stripped);
  }

  return { sessionId, turns: rendered };
}
</code></pre>

<p>Two things I'd flag in there.</p>

<p>The dedup is not a micro-optimization, it's the difference between this being viable and not. Per-citation checks on a long thread turn one page load into forty round trips to Postgres. Collapsing to distinct document IDs and doing one <code>ANY($2)</code> query is a single call regardless of thread length.</p>

<p>And <code>hrr_resolveDocMeta</code> only ever receives the allowed set. Not the full set with a filter applied afterward. If a future refactor drops the filter line, the resolver has nothing to leak, because unentitled IDs were never handed to it. Cheap defense, one argument, worth it.</p>

<h2>Degrade to a tombstone, not to a hole</h2>

<p>My first cut just dropped the denied cards from the array. It looked clean and it was wrong, for a reason that took a QA pass to notice.</p>

<p>The assistant text has inline markers in it. "The retention window is 90 days [2], though enterprise contracts override that [3]." Those markers are baked into prose the model already generated, and I am not about to rewrite stored model output at read time to renumber them. Drop card 2 and the paragraph now points at a citation that isn't in the list. The user sees a dangling reference and reasonably concludes the app is broken.</p>

<p>So denied citations come back as a tombstone that keeps its marker and carries nothing else:</p>

<pre><code class="language-json">{
  "marker": 2,
  "state": "unavailable"
}
</code></pre>

<p>The UI renders that as a greyed card reading "Source not available to you." No title, no snippet, no document ID, no hint about why. The assistant's text stays exactly as written, because the answer was legitimately generated from those sources at the time and rewriting history is a worse problem than the one I'm solving.</p>

<p>Somebody will point out that "a source existed here and you can't see it" is itself information. True. I decided that's an acceptable trade against a UI that looks broken every time entitlements change, and it's the same amount of information a user gets from any 403 in any app. If your threat model says otherwise, drop the marker and accept the dangling reference. Just make that a decision instead of a default.</p>

<h2>Fail closed, and make both failures look the same</h2>

<p>Session-level authorization has its own version of this. A history request for a session ID that doesn't exist and a request for one that belongs to another tenant must be indistinguishable, or the endpoint becomes a session ID oracle.</p>

<p>Both return 404. Not 403 for the denied one. 403 confirms the session exists, which is the fact you're trying not to confirm.</p>

<p>Status code alone isn't enough, because the two paths do different amounts of work. A miss is one DynamoDB query that returns nothing. A denied session queries DynamoDB, gets items, compares the tenant, and bails. The second is measurably slower, and "measurably" on a warm Lambda meant about 30 milliseconds in my testing, which is plenty to distinguish over repeated requests.</p>

<p>So both paths go through one exit that holds a floor:</p>

<pre><code class="language-typescript">const HRR_NOT_FOUND_FLOOR_MS = 120;

async function hrr_notFound(startedAt: number): Promise&lt;HrrResponse&gt; {
  const elapsed = Date.now() - startedAt;
  const remaining = HRR_NOT_FOUND_FLOOR_MS - elapsed;
  if (remaining &gt; 0) await new Promise((r) =&gt; setTimeout(r, remaining));
  return { statusCode: 404, body: JSON.stringify({ error: "not_found" }) };
}

export async function hrr_handler(event: HrrEvent): Promise&lt;HrrResponse&gt; {
  const startedAt = Date.now();
  const principal = await hrr_authenticate(event);
  const sessionId = event.pathParameters?.sessionId;

  if (!sessionId || !hrr_isValidSessionId(sessionId)) {
    return hrr_notFound(startedAt);
  }

  const session = await hrr_getSession(sessionId);
  if (!session || session.tenantId !== principal.tenantId) {
    return hrr_notFound(startedAt);
  }

  return hrr_ok(await hrr_getHistory(principal, sessionId));
}
</code></pre>

<p>Be clear about what a floor buys you. It flattens the coarse difference an attacker can see across a network from a few thousand requests. It is not constant time, it does nothing about cold starts, and someone with a local clock and enough samples can still find signal. I picked 120ms because it sat above the p99 of both paths in my account without being noticeable to a human. Set yours from your own numbers, not mine.</p>

<p>The malformed-ID case going through the same exit is intentional too. Returning 400 for a bad-looking session ID tells a prober your ID format, which is a small thing you get to just not give away.</p>

<p>The session lookup itself, and the tenant resolution behind <code>hrr_authenticate</code>, are the same Fastify-side machinery I described in <a href="/blog/multi-tenant-saas-auth-lambda-fastify">building a multi-tenant SaaS auth layer on Lambda with Fastify</a>. Nothing new there. What's new is that the history route no longer treats tenant match as the end of the authorization story.</p>

<h2>Tell someone when a replay strips a card</h2>

<p>Every strip is a signal. Sometimes it means offboarding worked. Sometimes it means a grant expired that nobody meant to expire, and a person who should have access is quietly getting a worse product. You can't tell which from the code, so it goes on the bus and lets someone else decide.</p>

<pre><code class="language-typescript">async function hrr_emitCitationStripped(
  principal: HrrPrincipal,
  sessionId: string,
  docIds: string[],
) {
  await eventBridge.send(
    new PutEventsCommand({
      Entries: [
        {
          EventBusName: process.env.HRR_EVENT_BUS,
          Source: "hrr.chat",
          DetailType: "CitationStrippedOnReplay",
          Detail: JSON.stringify({
            tenantId: principal.tenantId,
            principalId: principal.userId,
            sessionId,
            docIds: [...new Set(docIds)],
            strippedCount: docIds.length,
            reason: "entitlement_denied",
            at: new Date().toISOString(),
          }),
        },
      ],
    }),
  );
}
</code></pre>

<p>The event carries document IDs and not titles. That one took me a second pass to catch: putting the title in the audit event moves the exact string you just refused to show into a log stream with a completely different access policy. Anyone investigating can resolve IDs to titles with their own credentials, which is the point.</p>

<p>It's fire and forget, after the response body is built, and a failed <code>PutEvents</code> gets logged rather than thrown. A broken audit pipe should never turn a correctly-stripped page into a 500.</p>

<p>When I turned this on and backfilled a replay across existing sessions in the staging copy of that client's data, the first day produced 311 strip events across 94 sessions. Three quarters of those were the contractor case working as intended: engagements ended, access revoked, old threads correctly going quiet. The rest were two service accounts whose grants had expired in a migration nobody noticed, because nothing in the live path had needed those documents since. That second bucket is the argument for the event. The security fix found an availability bug.</p>

<h2>The other valid answer: an immutable record</h2>

<p>Re-auth on replay is not the only defensible design, and I've had this argument with a compliance lead who was right on his own terms. In some products the conversation <em>is</em> the record. A support transcript, a clinical note, a regulated advice log. If you can strip content from it after the fact, it stops being evidence of what was said.</p>

<table>
  <thead>
    <tr>
      <th>Question</th>
      <th>Re-auth on replay</th>
      <th>Immutable record</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Who is the reader</td>
      <td>The end user, any time</td>
      <td>An auditor or investigator</td>
    </tr>
    <tr>
      <td>After access is revoked</td>
      <td>Cards tombstone</td>
      <td>Cards stay, forever</td>
    </tr>
    <tr>
      <td>Stored on the turn</td>
      <td>Refs only</td>
      <td>Full frozen snapshot</td>
    </tr>
    <tr>
      <td>Blast radius of a stale grant</td>
      <td>Zero, rechecked every read</td>
      <td>Permanent</td>
    </tr>
    <tr>
      <td>Cost per history page</td>
      <td>One batched entitlement query</td>
      <td>Nothing</td>
    </tr>
    <tr>
      <td>Survives deletion of the source doc</td>
      <td>Degrades to a tombstone</td>
      <td>Yes, that's the point</td>
    </tr>
    <tr>
      <td>Right for</td>
      <td>The product UI</td>
      <td>A compliance export</td>
    </tr>
  </tbody>
</table>

<p>What I'd push back on is picking one for the whole system. They're different readers with different rights, so they should be different endpoints with different roles behind them.</p>

<p>What I run now: the product history endpoint re-auths and tombstones, and there's a separate export path that reads the frozen snapshot, is only reachable by a compliance role, requires a case reference on the request, and writes its own audit event on every call. Same underlying conversation, two views, and the immutable one is a deliberate, logged, narrow door rather than the default behavior of the chat UI.</p>

<p>If you only ship one, ship the re-auth one. It's the one an ordinary user hits a hundred times a day.</p>

<h2>The Terraform</h2>

<p>Nothing surprising. Turns table, audit bus, and a role for the history function that is deliberately narrower than the one live search gets.</p>

<pre><code class="language-hcl">resource "aws_dynamodb_table" "hrr_chat_turns" {
  name         = "hrr-chat-turns"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "pk"
  range_key    = "sk"

  attribute {
    name = "pk"
    type = "S"
  }

  attribute {
    name = "sk"
    type = "S"
  }

  ttl {
    attribute_name = "expiresAt"
    enabled        = true
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.hrr_chat.arn
  }

  point_in_time_recovery {
    enabled = true
  }
}

resource "aws_cloudwatch_event_rule" "hrr_citation_stripped" {
  name           = "hrr-citation-stripped"
  event_bus_name = aws_cloudwatch_event_bus.hrr_audit.name

  event_pattern = jsonencode({
    source        = ["hrr.chat"]
    "detail-type" = ["CitationStrippedOnReplay"]
  })
}

data "aws_iam_policy_document" "hrr_chat_history" {
  statement {
    sid       = "ReadTurns"
    effect    = "Allow"
    actions   = ["dynamodb:Query", "dynamodb:GetItem"]
    resources = [aws_dynamodb_table.hrr_chat_turns.arn]
  }

  statement {
    sid       = "AuditOnly"
    effect    = "Allow"
    actions   = ["events:PutEvents"]
    resources = [aws_cloudwatch_event_bus.hrr_audit.arn]
  }

  # No s3:GetObject on the document bucket. Snippets come back through the
  # resolver service, which runs the entitlement check itself. If this
  # function could read the bucket directly, a bug here would be a leak.
}
</code></pre>

<p>That last comment is the piece I'd keep if I had to throw the rest away. The history function cannot read document blobs. It asks a resolver service for metadata on a specific set of IDs, and the resolver does its own check rather than trusting the caller. Two independent checks on the same request is redundant on purpose. It's the same instinct as scoping a Bedrock execution role down to the models in the manifest, which I went through in <a href="/blog/lock-down-bedrock-iam-lambda-data-leak">locking down Bedrock access so Lambda can't leak data through the LLM</a>: the application-level rule and the IAM-level rule should fail independently.</p>

<h2>The regression test that has to exist</h2>

<p>This whole class of bug is invisible to every test you'd naturally write, because it needs time to pass, or at least a revocation to happen between two requests. A test that grants, chats, and asserts the citation renders passes on both the broken and the fixed implementation.</p>

<p>So the test is grant, chat, revoke, replay:</p>

<pre><code class="language-typescript">test("revoked doc is tombstoned on replay, assistant text survives", async () =&gt; {
  const tenant = await hrr_seedTenant();
  const user = await hrr_seedUser(tenant, { groups: ["legal"] });
  const doc = await hrr_seedDoc(tenant, { title: "Retention Policy v4" });
  await hrr_grant(doc, { principalRef: "group:legal" });

  const { sessionId } = await hrr_chat(user, "What's the retention window?");

  const before = await hrr_getHistory(user, sessionId);
  const cited = before.turns.at(-1)!.citations;
  expect(cited[0].state).toBe("ok");
  expect(cited[0].title).toBe("Retention Policy v4");
  expect(cited[0].snippet).toBeTruthy();

  await hrr_revokeGrant(doc, "group:legal");

  const after = await hrr_getHistory(user, sessionId);
  const replayed = after.turns.at(-1)!.citations;

  expect(replayed[0].state).toBe("unavailable");
  expect(replayed[0].marker).toBe(cited[0].marker);
  expect(replayed[0]).not.toHaveProperty("title");
  expect(replayed[0]).not.toHaveProperty("snippet");
  expect(replayed[0]).not.toHaveProperty("docId");

  // The answer itself is not rewritten.
  expect(after.turns.at(-1)!.text).toBe(before.turns.at(-1)!.text);

  await expect(hrr_lastAuditEvent()).resolves.toMatchObject({
    DetailType: "CitationStrippedOnReplay",
    Detail: expect.stringContaining(sessionId),
  });
});

test("denied session and unknown session are indistinguishable", async () =&gt; {
  const [a, b] = await Promise.all([hrr_seedTenant(), hrr_seedTenant()]);
  const intruder = await hrr_seedUser(b, {});
  const { sessionId } = await hrr_chat(await hrr_seedUser(a, {}), "hello");

  const denied = await hrr_rawGet(intruder, `/sessions/${sessionId}/history`);
  const missing = await hrr_rawGet(intruder, `/sessions/${hrr_fakeId()}/history`);

  expect(denied.statusCode).toBe(404);
  expect(missing.statusCode).toBe(404);
  expect(denied.body).toBe(missing.body);
  expect(denied.headers).toEqual(missing.headers);
});
</code></pre>

<p>The three <code>not.toHaveProperty</code> assertions are doing more work than they look like they're doing. The natural way to build a tombstone is to take the full card and delete the sensitive fields, and the natural way to break that is to add a field later and forget it's on the delete list. Asserting on absence catches the field you'll add next year.</p>

<p>And the second test asserting on headers, not just status, is there because I broke it once with a response header that only got set on the path that found a session.</p>

<h2>What this cost, honestly</h2>

<p>Numbers from my own load testing on this app, not a benchmark. One region, provisioned concurrency off, a Postgres instance sized for a few hundred tenants.</p>

<p>A 20 turn history page went from about 55ms p50 to about 90ms, and from 140ms p99 to 210ms. The added work is one entitlement query and one metadata resolve, both batched. I cache the entitlement result for 60 seconds keyed on principal and document set, which pulls repeat page loads back to roughly where they started.</p>

<p>That cache TTL is the one real trade in the design. A revocation can take up to a minute to show up in an already-open session. I decided 60 seconds of staleness on a UI read is acceptable and six months isn't, which is not a hard call. If your compliance story says revocation has to be instant, drop the cache and pay the 35ms.</p>

<p>Storage went down, which surprised me until I thought about it. Dropping titles and 200 character snippets off every citation shrank the average turn item by about 40%, and DynamoDB charges by the byte on write.</p>

<h2>The rule I check for now</h2>

<p><strong>Every persisted authorization decision is a grant with no expiry until you re-check it.</strong></p>

<p>The audit takes an afternoon and it's the same question everywhere: what did I write down that used to require permission to see? Chat citations were the obvious one. On the same pass I found exported PDFs with source appendices baked in, email notifications quoting the chunk that triggered them, and a "recently viewed documents" sidebar that was reading titles out of a per-user list nobody had ever re-checked. That last one had been in the product for two years.</p>

<p>None of those were written by careless people. They were all written by someone who checked authorization correctly on the way in and then treated the result as a fact about the world instead of a fact about a moment.</p>

<p>If you're building the citation feature right now, the cheapest version of this is one decision made early: store the ID, resolve the rest at read. It's five minutes of work today and it's the difference between a schema change and a disclosure conversation later.</p>

<p>Hope you enjoyed this one. If you've solved the tombstone-versus-renumber problem in a way that doesn't involve rewriting stored model output, or you've got a cleaner approach to keeping one entitlement function honest across a live path and a replay path, come tell me on X at <a href="https://x.com/harundotdev">@harundotdev</a>.</p>
