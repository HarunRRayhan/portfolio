---
title: "MCP Went Stateless and Broke My Lambda MCP Server Anyway"
slug: "mcp-stateless-spec-broke-my-lambda-mcp-server"
brief: "The 2026-07-28 MCP spec deleted the initialize handshake and Mcp-Session-Id, which should have been free for a Lambda server that was already stateless. It wasn't: a CORS allow-list, a missing server/discover, a 404 that should have been a 405, and a notification stream an HTTP API can't hold open all broke behind API Gateway."
publishedAt: "2026-08-19T13:46:39.000Z"
readTimeInMinutes: 13
coverImageUrl: "/blog-assets/mcp-stateless-spec-broke-my-lambda-mcp-server/cover.jpg"
reactionCount: 0
responseCount: 0
replyCount: 0
tags:
  - name: MCP
    slug: mcp
  - name: AWS
    slug: aws
  - name: Lambda
    slug: lambda
  - name: Serverless
    slug: serverless
  - name: Terraform
    slug: terraform
  - name: AI
    slug: ai
---

<p>My MCP server went dark on a Tuesday. Claude Desktop showed the hammer icon with zero tools under it. No error dialog, no red banner, just an empty list where <code>get_user_stats</code>, <code>list_recent_events</code>, and <code>query_documents</code> used to be.</p>

<p>CloudWatch had the answer, and it was embarrassing. The client had started speaking a protocol my server couldn't answer, and the way it failed looked like nothing at all: no error in the app, no rejected request you could reason about, just an empty tool list that turned out to be a negotiation failure in disguise.</p>

<p>That was the 2026-07-28 MCP spec landing on a server I built for the 2025 spec. I wrote about that server in <a href="/blog/deploying-an-mcp-server-on-aws-lambda">Deploying an MCP Server on AWS Lambda</a>. This post is the repair job.</p>

<p>The annoying part is that I thought I was immune. The headline change in 2026-07-28 is that MCP dropped protocol-level sessions, and my server never had sessions. I'd set <code>sessionIdGenerator: undefined</code> on day one because Lambda can't guarantee the same instance handles consecutive requests. I read the changelog, saw "sessions removed," and figured I'd already paid that tax.</p>

<p>The session removal was free. Everything the spec did <em>around</em> it was not.</p>

<h2>What 2026-07-28 actually deleted</h2>

<p>Worth being precise here, because the summaries floating around all lead with "MCP is stateless now" and stop there.</p>

<p>The <code>initialize</code> request and the <code>notifications/initialized</code> notification are gone. So is the <code>Mcp-Session-Id</code> header and the whole session lifecycle attached to it. Instead, every single request carries its own context in <code>_meta</code>:</p>

<pre><code class="language-json">{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "get_user_stats",
    "arguments": { "userId": "u_8812", "period": "30d" },
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientInfo": {
        "name": "ExampleClient",
        "version": "1.0.0"
      },
      "io.modelcontextprotocol/clientCapabilities": {}
    }
  }
}
</code></pre>

<p>Protocol version, client identity, and capabilities ride along on every call. Nothing is negotiated once and remembered.</p>

<p>Then there's the part nobody put in the headline. Selected body fields are now mirrored into HTTP headers, and they're required:</p>

<pre><code class="language-http">POST /mcp HTTP/1.1
Content-Type: application/json
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tools/call
Mcp-Name: get_user_stats
</code></pre>

<p><code>Mcp-Method</code> mirrors <code>method</code>. <code>Mcp-Name</code> mirrors <code>params.name</code> or <code>params.uri</code>, and it's required on <code>tools/call</code>, <code>resources/read</code>, and <code>prompts/get</code>. The point is that a load balancer or WAF can route and rate-limit on the operation without parsing a JSON body. Good idea. It also means every box between the client and your function now has an opinion about three headers it's never seen.</p>

<p>There's more in the changelog that matters if you're on Lambda:</p>

<ol>
  <li><code>server/discover</code> is a new RPC that servers <strong>MUST</strong> implement, advertising supported protocol versions, capabilities, and identity.</li>
  <li>The HTTP GET endpoint is gone, along with <code>resources/subscribe</code>. Change notifications now come from a long-lived <code>subscriptions/listen</code> POST-response stream.</li>
  <li>SSE resumability is gone. No <code>Last-Event-ID</code>, no event IDs, no redelivery. A broken stream means the client re-issues the request with a new ID.</li>
  <li><code>ping</code>, <code>logging/setLevel</code>, and <code>notifications/roots/list_changed</code> are removed.</li>
  <li>Server-initiated requests like sampling and elicitation are replaced by Multi Round-Trip Requests. The server returns <code>resultType: "input_required"</code> and the client retries the original request with the answers attached.</li>
  <li>Roots, Sampling, and Logging are deprecated, with a twelve-month minimum removal window under the new feature lifecycle policy.</li>
</ol>

<p>Six things on that list touched my three-tool server. Let me go through the ones that actually cost me time.</p>

<h2>Break 1: the request path didn't know the new headers</h2>

<p>This is the failure I reached for first, and it's the dumbest one in the post.</p>

<p>The first thing I reached for was the CORS config, because that's the layer where a browser-based client dies with no Lambda logs. The CloudFormation template in my original post had this:</p>

<pre><code class="language-yaml">CorsConfiguration:
  AllowOrigins:
    - "*"
  AllowMethods:
    - POST
    - OPTIONS
  AllowHeaders:
    - Authorization
    - Content-Type
</code></pre>

<p><code>Authorization</code> and <code>Content-Type</code>. That was the complete set of headers MCP needed in 2025. Now the client sends <code>MCP-Protocol-Version</code>, <code>Mcp-Method</code>, and <code>Mcp-Name</code> on top of those, and the path between client and function has to carry three more headers than it did before.</p>

<p>I've since moved this stack to Terraform. Here's the corrected API:</p>

<pre><code class="language-hcl">resource "aws_apigatewayv2_api" "hrr_mcp" {
  name          = "hrr-mcp-server"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = ["https://claude.ai"]
    allow_methods = ["POST", "OPTIONS"]
    allow_headers = [
      "authorization",
      "content-type",
      "mcp-protocol-version",
      "mcp-method",
      "mcp-name",
    ]
    max_age = 600
  }
}
</code></pre>

<p>Two notes on that block.</p>

<p>I dropped <code>allow_origins = ["*"]</code> while I was in there. A wildcard origin on an endpoint that reads my production database was always lazy, and the migration was a decent excuse to fix it.</p>

<p>The CORS list matters for browser-based clients specifically. If the client runs in a page (Claude.ai's web app, or any embedded MCP client), the browser enforces CORS, and a missing allow-list entry shows up as a failed preflight: the browser sends <code>OPTIONS</code> with the requested headers, API Gateway compares them against the allow-list, and the preflight fails before Lambda ever runs. That's the whole job of <code>allow_headers</code> — it only shapes the preflight response. Native desktop clients skip the preflight entirely, and API Gateway's HTTP APIs forward every request header to Lambda regardless of this block. So for the desktop failure the culprit is elsewhere in the path: the note below about WAF, CloudFront, and ALB is the one that matters for native clients. Where headers do arrive intact, Break 4's header-vs-body validation is what decides the request lives or dies.</p>

<p>The second note is a trap if you use the new <code>x-mcp-header</code> feature. Servers can annotate a tool parameter in its <code>inputSchema</code> and the client mirrors that value into an <code>Mcp-Param-{Name}</code> header. Handy for routing on a tenant or region without cracking the body open. But API Gateway's <code>allow_headers</code> doesn't take wildcards, so there's no <code>mcp-param-*</code>. You enumerate every single one:</p>

<pre><code class="language-hcl">allow_headers = [
  "authorization",
  "content-type",
  "mcp-protocol-version",
  "mcp-method",
  "mcp-name",
  "mcp-param-tenant",
  "mcp-param-region",
]
</code></pre>

<p>Add a new annotated parameter, add a line here, or that tool silently stops working for browser clients while it keeps working fine in your local tests. I'd write a comment above the block pointing at whichever file holds your tool schemas. I did.</p>

<p>If you have a WAF, CloudFront, or an ALB in the path, walk the whole chain. Anything that strips unknown <code>Mcp-*</code> headers fails every request, and the failure looks like a protocol bug rather than an infrastructure one. For a native desktop client this is a silent outage: no browser, no preflight, the headers just don't arrive intact, and the app renders the result as an empty tool list.</p>

<h2>Break 2: server/discover is mandatory, and mine returned -32601</h2>

<p>Clients can call <code>server/discover</code> before anything else to find out which protocol versions you speak. Servers <strong>MUST</strong> implement it. Mine didn't exist, so the request fell through to the SDK's unknown-method path and came back as JSON-RPC <code>-32601</code>, <code>Method not found</code>.</p>

<p>This is the break that actually took my server down. A client running version negotiation in <code>auto</code> mode uses <code>server/discover</code> as its "is this server modern?" probe. Fail the probe and the client concludes you're a 2025-era server and falls back to sending <code>initialize</code>. Which my server also didn't handle anymore, once I'd upgraded the SDK. Two failed probes, zero tools, no useful error — that's the empty hammer menu I opened the post with.</p>

<p>The v2 TypeScript SDK handles <code>server/discover</code> for you as long as you're building the server through its handler factory. That was the real fix: stop hand-rolling the transport.</p>

<h2>Break 3: a 404 that should have been a 405</h2>

<p>My API Gateway had exactly one route, <code>POST /mcp</code>. Correct for 2025, correct for 2026, and still wrong.</p>

<p>The spec says a server that only speaks 2026-07-28 and receives a GET or DELETE on the MCP endpoint <strong>SHOULD</strong> respond <code>405 Method Not Allowed</code>. Mine responded with API Gateway's stock 404:</p>

<pre><code class="language-json">{ "message": "Not Found" }
</code></pre>

<p>That body is the problem. The backward-compatibility flow in the spec has clients POST first, then inspect the response before falling back. If the body is a recognized modern JSON-RPC error, the client knows the server is modern and retries properly. If the body is empty or unrecognized, the client assumes it's talking to a legacy HTTP+SSE server and goes looking for a GET stream with an <code>endpoint</code> event.</p>

<p><code>{"message": "Not Found"}</code> is not a JSON-RPC error. So an older client hitting my endpoint would misclassify it and start a fallback dance that could never succeed.</p>

<p>The fix is a route that reaches Lambda so Lambda can answer properly:</p>

<pre><code class="language-hcl">resource "aws_apigatewayv2_route" "hrr_mcp_post" {
  api_id    = aws_apigatewayv2_api.hrr_mcp.id
  route_key = "POST /mcp"
  target    = "integrations/${aws_apigatewayv2_integration.hrr_mcp.id}"
}

# GET and DELETE exist only so the function can return a spec-correct 405
# instead of API Gateway's stock {"message": "Not Found"}.
resource "aws_apigatewayv2_route" "hrr_mcp_legacy_methods" {
  for_each = toset(["GET /mcp", "DELETE /mcp"])

  api_id    = aws_apigatewayv2_api.hrr_mcp.id
  route_key = each.value
  target    = "integrations/${aws_apigatewayv2_integration.hrr_mcp.id}"
}
</code></pre>

<p>And a short circuit at the top of the handler, before auth, because there's no point validating a bearer token on a request you're rejecting on method alone. Note the error code here: I'm reusing <code>-32601</code> on purpose. A legacy client sends GET, gets back a JSON-RPC-shaped <code>-32601</code>, recognizes it as a JSON-RPC error, and knows the server is modern — it just used a method this server doesn't serve. (A bare 405 with no body, by contrast, would read as "no server here" and kick off the fallback.) The nuance is that in Break 2 the same code meant "I'm not a modern server, fall back to initialize"; here it means "I am a modern server, use a different method." Same numeric, opposite directions — the client tells them apart by which RPC it was calling.</p>

<pre><code class="language-javascript">const HRR_ALLOWED_METHOD = "POST";

function hrr_methodNotAllowed(event) {
  const method = event.requestContext?.http?.method;
  if (method === HRR_ALLOWED_METHOD) return null;

  return {
    statusCode: 405,
    headers: { "Content-Type": "application/json", Allow: "POST" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: null,
      error: { code: -32601, message: `${method} is not supported on this endpoint` },
    }),
  };
}
</code></pre>

<p>Small thing. Costs nothing. Saves a client from an unwinnable fallback loop.</p>

<h2>Break 4: header and body have to agree, and you have to check</h2>

<p>The mirrored headers aren't just hints. Servers that process the body <strong>MUST</strong> verify the header values match the body values, and reject mismatches with HTTP <code>400</code> and JSON-RPC error <code>-32020</code>, <code>HeaderMismatch</code>.</p>

<p>The reasoning is worth understanding because it changes how you think about the endpoint. If a load balancer routes on <code>Mcp-Name: get_user_stats</code> while your function executes <code>params.name = "delete_everything"</code> from the body, two components in the same request path are working from different truths. That's a confused deputy waiting to happen. The spec closes it by making the server the thing that refuses to let them disagree.</p>

<p>Same rule covers the required headers being missing entirely. Missing <code>MCP-Protocol-Version</code>, <code>Mcp-Method</code>, or <code>Mcp-Name</code> is a <code>-32020</code>, not a generic 400.</p>

<p>The v2 SDK's handler validates all three on every modern request, so if you're using it you get this behavior without writing it. Which is exactly why I stopped writing it. There's also <code>-32022</code> for <code>UnsupportedProtocolVersion</code>, which returns the list of versions you do support so the client can retry instead of guessing.</p>

<p>One detail that'll bite you if you hand-roll the comparison: <code>Mcp-Name</code> values that aren't plain ASCII get Base64-encoded with a sentinel wrapper, <code>=?UTF-8?B?{value}?=</code> (an RFC 2047 encoded-word — charset, then <code>B</code> for base64, then the payload). Decode before comparing, or every tool with a non-ASCII name in its arguments fails validation.</p>

<h2>Break 5: subscriptions/listen can't live behind an HTTP API</h2>

<p>This one isn't a bug I hit. It's a wall I walked up to and decided not to climb.</p>

<p>Change notifications used to come over a standalone GET SSE stream. That's gone. Now a client opens a <code>subscriptions/listen</code> POST and the response is an SSE stream that stays open, delivering the notification types the client opted into: <code>toolsListChanged</code>, <code>resourcesListChanged</code>, and friends. The spec even suggests emitting a periodic SSE comment line as a keep-alive so intermediaries don't hang up on it during quiet periods.</p>

<p>"Stays open" and "API Gateway HTTP API" don't go together. HTTP APIs cap the integration timeout at 30 seconds, and that's a hard ceiling. API Gateway added response streaming for Lambda proxy integrations in November 2025, but only on REST APIs, not HTTP APIs. My original post picked HTTP API specifically because it's cheaper and lower latency. That decision now costs me a protocol feature.</p>

<p>The options, in increasing order of effort:</p>

<ol>
  <li><strong>Don't advertise it.</strong> Skip the subscription capabilities entirely. A well-behaved client won't call <code>subscriptions/listen</code> if you never claimed to support it.</li>
  <li><strong>Lambda Function URL.</strong> Native response streaming, no API Gateway in front of it, and the invoke mode is a one-line change. You give up API Gateway's throttling, custom domains, and usage plans, so you're back to doing auth yourself in the handler. Which I was already doing.</li>
  <li><strong>Move to a REST API</strong> with <code>responseTransferMode</code> set to <code>STREAM</code>. You get streaming and keep API Gateway, at REST API pricing and REST API idle-timeout rules.</li>
</ol>

<p>I took option one. My three tools are request-response reads against my own database. The tool list changes when I deploy, which is not an event any client needs pushed to it in real time. Advertising a capability I can't hold open on this stack would just be a promise I'd break under load.</p>

<p>Worth saying plainly: if your MCP server genuinely needs push notifications, API Gateway HTTP API is the wrong front door now. That's a real architectural constraint the new spec introduces for serverless, and no amount of SDK upgrading routes around it.</p>

<h2>The SDK move, and deleting code I was proud of</h2>

<p>The TypeScript SDK split. <code>@modelcontextprotocol/sdk</code> reached 1.30.0 and the new generation shipped as separate packages at 2.0.0: <code>@modelcontextprotocol/core</code>, <code>/client</code>, <code>/server</code>, and <code>/server-legacy</code>, plus adapters for Express, Fastify, Hono, and Node.</p>

<p>My old handler created a fresh <code>StreamableHTTPServerTransport</code> per invocation, connected the server to it, processed the request, then closed both. I'd written a whole paragraph in the last post about learning the hard way that you can't cache the transport across invocations.</p>

<p>That advice is now obsolete in the best way. The v2 server package hands you a factory that builds a fresh server per request by default, because that's what the stateless spec implies:</p>

<pre><code class="language-javascript">import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";

const hrr_handler = createMcpHandler(() =&gt; {
  const server = new McpServer(
    { name: "hrr-saas-tools", version: "2.0.0" },
    { capabilities: { tools: {} } }
  );

  server.tool(
    "get_user_stats",
    "Get activity statistics for a specific user including login count, API calls, and last active date",
    {
      userId: z.string().describe("The user ID to look up"),
      period: z.enum(["7d", "30d", "90d"]).describe("Time period for the stats"),
    },
    async ({ userId, period }) =&gt; {
      const stats = await fetchUserStats(userId, period);
      return { content: [{ type: "text", text: JSON.stringify(stats, null, 2) }] };
    }
  );

  return server;
});

export const handler = async (event) =&gt; {
  const notAllowed = hrr_methodNotAllowed(event);
  if (notAllowed) return notAllowed;

  const auth = validateApiKey(event);
  if (!auth.valid) {
    return {
      statusCode: 401,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: auth.error }),
    };
  }

  return hrr_handler.fetch(event);
};
</code></pre>

<p>The tool definitions came over unchanged. The Zod schemas, the descriptions I spent hours tuning, the business logic behind them, all of it survived. What I deleted was transport plumbing: the manual construct, the <code>server.connect(transport)</code>, the <code>finally</code> block closing both. That's the code the spec change made unnecessary, and it's the code I'd got wrong twice.</p>

<p>My bearer-token check stayed exactly where it was, in front of everything. Nothing in 2026-07-28 changes how you authenticate a request. It does deprecate OAuth Dynamic Client Registration in favor of Client ID Metadata Documents, but that's a concern for servers doing real OAuth, not for one API key in an environment variable.</p>

<p>If you need cross-call state, and I don't, the replacement for sessions is <code>requestState</code>: an opaque string the server mints and the client echoes back byte for byte on a retry. The SDK ships an HMAC-SHA256 codec for sealing it. It's a signed cookie in JSON-RPC clothing, and for Lambda that's a much better fit than a session ID that implies an instance remembers you.</p>

<h2>What the migration actually improved</h2>

<p>I've been grumbling for a whole post, so here's the other side.</p>

<p>Under the old spec, a fresh client connection cost three round trips before a single tool ran: <code>initialize</code>, <code>notifications/initialized</code>, <code>tools/list</code>. On Lambda, each of those could land on a cold instance. Now the first thing a client sends can be the tool call itself, with everything the server needs in <code>_meta</code>.</p>

<p>Sessions were also the reason a horizontally scaled MCP server needed sticky routing or a shared session store. That's gone. Any request can land on any instance, which is what Lambda was always going to do anyway. The protocol finally agrees with the runtime.</p>

<p>I'm still running one provisioned concurrency instance at roughly $5/month, for the same reason as before: tool calls feel synchronous to whoever's typing, and a cold start on top of model thinking time is noticeable. But the case for it is weaker now that there's no handshake to pay for on top.</p>

<h2>The checklist</h2>

<p>If you've got an MCP server on Lambda built against the 2025 spec, here's the order I'd do it in. Most of the pain is in the first few steps, and none of them involve your tool code.</p>

<ol>
  <li><strong>Confirm <code>server/discover</code> answers.</strong> Curl it. If it returns <code>-32601</code>, clients will misidentify you as a legacy server and fall back to an <code>initialize</code> your upgraded SDK won't serve — the empty-tool-list outage. This is the one that took my server down.</li>
  <li><strong>Fix CORS.</strong> Add <code>mcp-protocol-version</code>, <code>mcp-method</code>, and <code>mcp-name</code> to <code>allow_headers</code>, plus every <code>mcp-param-*</code> you use. Browser-based clients fail hard here with no Lambda logs.</li>
  <li><strong>Walk the whole request path.</strong> CloudFront, WAF, ALB, custom authorizers. Anything that strips unknown <code>Mcp-*</code> headers fails every request. For a desktop client this is a silent outage — the headers vanish before Lambda, and the app just shows an empty tool list.</li>
  <li><strong>Add GET and DELETE routes</strong> pointing at the same integration, and return a JSON-RPC-shaped 405 from the handler.</li>
  <li><strong>Move to the v2 SDK packages</strong> and rebuild the handler around the factory. Your tool definitions port over as they are.</li>
  <li><strong>Decide about <code>subscriptions/listen</code>.</strong> Either don't advertise the capability, or move off HTTP API to a Function URL or a streaming REST API.</li>
  <li><strong>Audit for deprecated features.</strong> Roots, Sampling, and Logging still work but are on a twelve-month clock. Log to stderr or OpenTelemetry instead.</li>
  <li><strong>Test with an actual client</strong>, not just curl. The header mirroring, the encoding rules, and the version negotiation all live on the client side, and curl won't do any of it for you.</li>
</ol>

<p>The whole repair took me an afternoon, and most of that was staring at API Gateway access logs before I understood that the outage was a version-negotiation failure, not a crash or an error I could search for. The lesson I'll actually keep is that "we removed sessions" sounded like a change that couldn't touch a server without sessions, and the thing that actually took me down was a handshake my client assumed still existed.</p>

<p>Hope this saves you the afternoon. If you're migrating an MCP server on AWS and you hit something I didn't, or you found a cleaner way to keep a notification stream alive on serverless, come tell me on X at <a href="https://x.com/harundotdev">https://x.com/harundotdev</a>.</p>

