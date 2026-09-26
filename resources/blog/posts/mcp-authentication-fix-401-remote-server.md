---
title: 'MCP Authentication Explained: Fix 401 Errors in a Remote MCP Server'
slug: mcp-authentication-fix-401-remote-server
draft: true
draftToken: 5305a5fa56fa82b2dc66f826dd4da846
brief: 'Debug remote MCP authentication step by step: OAuth discovery, callback failures, token audiences, scopes, and AWS API Gateway responses.'
publishedAt: "2099-01-01T00:00:00.000Z"
readTimeInMinutes: 9
coverImageUrl: "/blog-assets/mcp-authentication-fix-401-remote-server/cover.jpg"
coverImageAlt: "MCP Authentication: Fix 401 Errors, with a rejected access card and key."
reactionCount: 0
responseCount: 0
replyCount: 0
tags:
  -
    name: MCP
    slug: mcp
  -
    name: OAuth
    slug: oauth
  -
    name: AWS
    slug: aws
  -
    name: Security
    slug: security
---

<p>You connect an AI client to your remote MCP server. The client says “Unauthorized.” You sign in again. Same error.</p>
<p>Before changing your credentials, find out which request failed.</p>
<p><strong>An initial HTTP 401 can be the expected start of an OAuth login. A 401 after the client sends an access token needs a different investigation.</strong> Treating both as “bad API key” sends you in circles.</p>
<p>This guide covers remote HTTP MCP servers using OAuth. Local servers connected over stdio use a different credential setup. The protocol references below target MCP <strong>2026-07-28</strong>, checked on September 26, 2026. Record your client's version and server SDK version before debugging; older clients may follow a different flow. <a href="https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization">MCP authorization specification</a></p>
<p>The examples use reserved example domains. They illustrate the requests to inspect, rather than claim compatibility testing with a particular desktop client.</p>
<h2>Find the last request that worked</h2>
<p>Start with the client's network trace or your server access logs. Keep response status codes and request IDs. Redact credentials, authorization codes, and cookies before sharing a trace.</p>
<table>
<thead>
<tr>
<th>Where it stops</th>
<th>What to check first</th>
</tr>
</thead>
<tbody>
<tr>
<td>First request returns 401; login never opens</td>
<td>Authentication challenge and metadata discovery</td>
</tr>
<tr>
<td>Metadata request returns HTML or 404</td>
<td>Public routes, reverse proxy, and URL paths</td>
</tr>
<tr>
<td>Login page rejects the client</td>
<td>Client registration and redirect URI</td>
</tr>
<tr>
<td>Login succeeds; token exchange fails</td>
<td>PKCE verifier, callback configuration, and client identity</td>
</tr>
<tr>
<td>Token is issued; MCP still returns 401</td>
<td>Token validation and whether the header reaches your application</td>
</tr>
<tr>
<td>Authentication passes; operation returns 403</td>
<td>Required scopes and application permissions</td>
</tr>
<tr>
<td>Terminal works; browser client fails</td>
<td>Preflight response and exposed response headers</td>
</tr>
</tbody>
</table>
<p>This table is a debugging order. It isn't a promise that every product reports failures consistently. An upstream API can also return an authorization error inside a tool result. That is a different request from the HTTP connection between your MCP client and server.</p>
<h2>1. Inspect the 401 response, including its headers</h2>
<p>For a protected resource, an unauthenticated request can receive a challenge like this:</p>
<pre><code class="language-http">HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer resource_metadata=&quot;https://mcp.example.com/.well-known/oauth-protected-resource/mcp&quot;, scope=&quot;reports:read&quot;
</code></pre>
<p>The useful part is the header. A JSON body that says <code>Unauthorized</code> doesn't tell a client where to discover your authorization server.</p>
<p>If you already have a failing request, replay its <strong>read-only</strong> operation without credentials. Save its JSON body as <code>mcp-request.json</code>. Use the same protocol headers your client sent:</p>
<pre><code class="language-bash"># Run in Bash. Use your server URL and the captured read-only request body.
MCP_URL='https://mcp.example.com/mcp'

curl --silent --show-error \
  --dump-header - \
  --output /dev/null \
  --header 'Content-Type: application/json' \
  --header 'Accept: application/json, text/event-stream' \
  --data-binary @mcp-request.json \
  &quot;$MCP_URL&quot;
</code></pre>
<p>Add any protocol-specific headers from the captured request; the command above only supplies the common content headers. It deliberately doesn't follow redirects or supply an access token.</p>
<p>Don't substitute <code>curl -I</code>: that sends HEAD, which can take a different route through your infrastructure. Also, don't interpret a 400 from an incomplete replay as an authentication diagnosis.</p>
<p>If <code>resource_metadata</code> is absent, discovery isn't automatically broken. MCP clients must also try the well-known metadata locations. For <code>/mcp</code>, the path-specific candidate is <code>/.well-known/oauth-protected-resource/mcp</code>, followed by the root candidate <code>/.well-known/oauth-protected-resource</code>. A usable challenge makes this easier to diagnose. <a href="https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/authorization-server-discovery">Discovery requirements</a></p>
<h2>2. Check both discovery documents</h2>
<p>There are two separate documents to inspect:</p>
<ol>
<li><strong>Protected resource metadata:</strong> identifies your MCP resource and its authorization servers.</li>
<li><strong>Authorization server metadata:</strong> tells the client where to authorize and exchange a code for tokens.</li>
</ol>
<p>Fetch the resource metadata URL advertised by your server:</p>
<pre><code class="language-bash">curl --silent --show-error --fail-with-body \
  'https://mcp.example.com/.well-known/oauth-protected-resource/mcp' \
  | python3 -m json.tool
</code></pre>
<p>A small example:</p>
<pre><code class="language-json">{
  &quot;resource&quot;: &quot;https://mcp.example.com/mcp&quot;,
  &quot;authorization_servers&quot;: [&quot;https://auth.example.com&quot;],
  &quot;scopes_supported&quot;: [&quot;reports:read&quot;]
}
</code></pre>
<p>This endpoint needs to be reachable before login. Putting the same bearer-token requirement on it creates a loop: the client needs metadata to get the token that your metadata endpoint demands. The resource identifier must match the resource the client is trying to access. <a href="https://www.rfc-editor.org/rfc/rfc9728">Protected resource metadata, RFC 9728</a></p>
<p>For the root issuer in this example, inspect:</p>
<pre><code class="language-bash">curl --silent --show-error --fail-with-body \
  'https://auth.example.com/.well-known/oauth-authorization-server' \
  | python3 -m json.tool
</code></pre>
<p>An OIDC discovery document may be used instead. Check its <code>issuer</code>, <code>authorization_endpoint</code>, and <code>token_endpoint</code>. The issuer must match the expected issuer exactly. If your issuer includes a tenant path, follow the specification's discovery URL order rather than blindly appending a suffix. <a href="https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/authorization-server-discovery">Authorization server discovery</a></p>
<p>When a request returns your application's login page, inspect routing before editing OAuth settings. Common places to look are a catch-all frontend route and authentication middleware applied to every URL.</p>
<h2>3. If the login page rejects the client, check registration</h2>
<p>Your identity provider knowing who the user is doesn't mean it recognizes the MCP client.</p>
<p>Compare the client ID and callback URL in the authorization request with the client registration. A callback on <code>localhost</code> and one on <code>127.0.0.1</code> aren't interchangeable registrations. Check the path too.</p>
<p>For MCP 2026-07-28, the registration options are pre-registration, Client ID Metadata Documents (CIMD), and legacy Dynamic Client Registration (DCR). DCR is deprecated, but remains an optional compatibility mechanism. Don't assume every server must expose a <code>registration_endpoint</code>.</p>
<p>If the client sends an HTTPS URL as its client ID, check whether your authorization server supports CIMD. If it doesn't, use a registration method both sides support. When DCR is used with an OIDC provider, a native client may also need <code>application_type: &quot;native&quot;</code> for its callback configuration.</p>
<p>After changing authorization servers, remove only the affected connection's stale registration through the client's supported controls. Credentials issued by the old issuer don't belong to the new one. <a href="https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/client-registration">MCP client registration</a></p>
<h2>4. If login succeeds but token exchange fails, inspect PKCE</h2>
<p>The browser returning to the client is one milestone. It doesn't prove that the client obtained an access token.</p>
<p>With PKCE, the client creates a verifier and sends a derived challenge during authorization. It later sends the original verifier when exchanging the authorization code. If the client loses that verifier between those requests, the exchange fails. Creating a new verifier at the token step won't repair it. <a href="https://www.rfc-editor.org/rfc/rfc7636">PKCE, RFC 7636</a></p>
<p>At this stage, check the provider's error response and request IDs. Compare the callback URI used in the flow with the registered URI. Check whether another local process owns the callback port. For a client running inside a container or remote development environment, verify that the browser can actually reach the callback listener.</p>
<p>Don't repeatedly replay a captured authorization code. Start a fresh login after fixing the underlying configuration.</p>
<h2>5. If the token arrives but 401 continues, check its destination</h2>
<p>The MCP client must send the target <code>resource</code> in both authorization and token requests. Your server must reject access tokens that weren't issued for it. A successful login to an unrelated API doesn't produce a token your MCP server should accept. <a href="https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization">MCP resource and token requirements</a></p>
<p>For JWT access tokens, inspect these checks in your validator:</p>
<table>
<thead>
<tr>
<th>Check</th>
<th>Question</th>
</tr>
</thead>
<tbody>
<tr>
<td>Signature</td>
<td>Is the signature valid under the trusted issuer's keys and allowed algorithm?</td>
</tr>
<tr>
<td>Issuer</td>
<td>Did the configured authorization server issue this token?</td>
</tr>
<tr>
<td>Audience</td>
<td>Is this MCP resource an intended recipient?</td>
</tr>
<tr>
<td>Expiry</td>
<td>Is the access token still valid?</td>
</tr>
<tr>
<td>Token type</td>
<td>Is this an access token, rather than an ID token from the login flow?</td>
</tr>
</tbody>
</table>
<p>Reading a JWT payload doesn't validate it. Use a maintained validator configured for your provider's access-token profile. Opaque tokens need the provider's supported validation mechanism instead of JWT decoding. <a href="https://www.rfc-editor.org/rfc/rfc9068">JWT access-token validation, RFC 9068</a></p>
<p>Then check the boring infrastructure question: did the <code>Authorization</code> header reach the validator at all? Log its presence as a boolean. Don't log its value.</p>
<p>If your MCP tool calls another API, keep that downstream authorization separate. Forwarding whatever bearer token arrived at <code>/mcp</code> to another service can cross the wrong trust boundary. <a href="https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices#token-passthrough">MCP token-passthrough guidance</a></p>
<h2>6. Treat missing permissions separately from invalid tokens</h2>
<p>A valid token can still lack permission for an operation. A scope challenge can look like this:</p>
<pre><code class="language-http">HTTP/1.1 403 Forbidden
WWW-Authenticate: Bearer error=&quot;insufficient_scope&quot;, scope=&quot;reports:read&quot;
</code></pre>
<p>For bearer authentication, expired or invalid tokens map to 401; insufficient scope maps to 403. Repeating the same request with the same permissions won't fix the latter. Inspect the requested scope and the granted scope before retrying. <a href="https://www.rfc-editor.org/rfc/rfc6750">Bearer-token errors, RFC 6750</a></p>
<p>Scopes also don't replace your application's authorization checks. In a reporting tool, <code>reports:read</code> might permit calling the operation, while the database query must still restrict results to the authenticated user's tenant.</p>
<p>Add a test with two tenants and a valid token. Attempt to read a report owned by the other tenant. Passing OAuth should never make that report visible.</p>
<h2>7. On AWS, verify who generated the error</h2>
<p>For an API Gateway and Lambda deployment, draw the actual request path:</p>
<pre><code class="language-text">MCP client -&gt; API Gateway -&gt; authorizer, if configured -&gt; Lambda
</code></pre>
<p>Include CloudFront or a WAF if they're part of your deployment. Correlate gateway access logs with application logs. If Lambda never received the request, editing its authentication response won't change the error the client sees.</p>
<p>Make sure public discovery routes reach their metadata handlers. A generic rejection from an upstream authorizer may omit the MCP discovery challenge; in that case the well-known fallback routes still need to work.</p>
<p>For a browser-based client, inspect CORS separately. API Gateway HTTP APIs can answer preflight requests, and configured API-level CORS takes precedence over integration CORS headers. A protected <code>$default</code> route may require an explicit unauthenticated <code>OPTIONS /{proxy+}</code> route. <a href="https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-cors.html">AWS HTTP API CORS documentation</a></p>
<p>Allow the actual request headers your client sends. Also expose the challenge header so browser JavaScript can read it:</p>
<pre><code class="language-http">Access-Control-Expose-Headers: WWW-Authenticate
</code></pre>
<p>Allowing <code>Authorization</code> as a <strong>request</strong> header doesn't expose <code>WWW-Authenticate</code> as a <strong>response</strong> header. These are different controls. Set the appropriate allowed origin on error responses too. Native clients and curl don't enforce browser CORS, so success in a terminal doesn't settle this check. <a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Access-Control-Expose-Headers">Response-header exposure</a></p>
<p>I covered transport and routing issues separately in <a href="/blog/mcp-stateless-spec-broke-my-lambda-mcp-server">MCP Went Stateless and Broke My Lambda MCP Server Anyway</a>. Keep a transport failure separate from an OAuth failure while debugging.</p>
<h2>Prove the fix with the client that failed</h2>
<p>Record the client build, server SDK version, and protocol revision alongside these results:</p>
<table>
<thead>
<tr>
<th>Test</th>
<th>Evidence to keep</th>
</tr>
</thead>
<tbody>
<tr>
<td>Fresh connection without a token</td>
<td>Client discovers the authorization server and starts login</td>
</tr>
<tr>
<td>Successful login</td>
<td>Token exchange completes and a read-only MCP operation succeeds</td>
</tr>
<tr>
<td>Expired or wrong-audience token</td>
<td>Protected request is rejected with 401</td>
</tr>
<tr>
<td>Valid token lacking a required scope</td>
<td>Operation is denied with the expected scope challenge</td>
</tr>
<tr>
<td>Cross-tenant request</td>
<td>Application denies access even with valid authentication</td>
</tr>
<tr>
<td>Browser connection, if supported</td>
<td>Preflight passes and the client can read the challenge header</td>
</tr>
</tbody>
</table>
<p>A green login page isn't the finish line. The useful proof is the original client completing the intended operation, while the requests it should reject still fail.</p>
