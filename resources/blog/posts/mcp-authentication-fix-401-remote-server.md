---
title: 'MCP Authentication Explained: Fix 401 Errors in a Remote MCP Server'
slug: mcp-authentication-fix-401-remote-server
draft: true
draftToken: 5305a5fa56fa82b2dc66f826dd4da846
brief: 'Debug remote MCP authentication step by step: OAuth discovery, callback failures, token audiences, scopes, and AWS API Gateway responses.'
publishedAt: "2099-01-01T00:00:00.000Z"
readTimeInMinutes: 9
coverImageUrl: "/blog-assets/mcp-authentication-fix-401-remote-server/cover-v3.jpg"
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

<p>An “Unauthorized” error from a remote MCP server doesn’t necessarily mean your credentials are wrong. The first 401 may be the server asking the client to start an OAuth login. If the client has already logged in and sent an access token, that same status points to a different problem.</p>
<p>Before rotating keys or signing in again, find the request that failed. Was it the first call to <code>/mcp</code>, the token exchange, or a tool calling another API? That distinction will save you a lot of guessing.</p>
<p>The examples here cover OAuth on remote HTTP servers, using the <a href="https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization">2026-07-28 MCP revision</a>. Local stdio servers handle credentials differently. Check your client and SDK versions before copying anything; older implementations may use an earlier flow. Replace the example URLs with your own. The snippets are diagnostic examples, not a tested integration for a particular desktop client.</p>
<h2>Find the last request that worked</h2>
<p>Open the client’s network trace or the server’s access logs and look for the last successful request. Keep the request IDs so you can follow the same attempt across services. Remove tokens, authorization codes, and cookies before sharing logs.</p>
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
<p>One easy mix-up: a tool can connect successfully, call an upstream API, and return that API’s authorization error. If the failure is inside a tool result, investigate the downstream credentials first.</p>
<h2>Start with the response headers</h2>
<p>A protected endpoint can answer an unauthenticated request with this challenge:</p>
<pre><code class="language-http">HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer resource_metadata=&quot;https://mcp.example.com/.well-known/oauth-protected-resource/mcp&quot;, scope=&quot;reports:read&quot;
</code></pre>
<p>Look for <code>WWW-Authenticate</code>. A body containing only <code>Unauthorized</code> gives you very little to work with; this header points the client toward the login configuration.</p>
<p>To see what your server actually returns, save the body of a failing read-only request as <code>mcp-request.json</code> and replay it without credentials:</p>
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
<p>Add the protocol-specific headers from the original request. This command supplies only the common content headers and leaves redirects visible.</p>
<p>Use the original request method. <code>curl -I</code> sends HEAD and may hit a different route. A 400 caused by a missing protocol header won’t tell you whether OAuth works.</p>
<p>Without <code>resource_metadata</code>, the client must fall back to well-known URLs. For <code>/mcp</code>, it tries <code>/.well-known/oauth-protected-resource/mcp</code>, then <code>/.well-known/oauth-protected-resource</code>. Check those before blaming a missing challenge parameter. <a href="https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/authorization-server-discovery">Discovery requirements</a></p>
<h2>Follow the metadata to the login server</h2>
<p>Discovery happens in two hops. Your MCP server identifies the authorization server. That server publishes the endpoints used for login and token exchange.</p>
<p>Fetch the resource metadata URL from the challenge:</p>
<pre><code class="language-bash">curl --silent --show-error --fail-with-body \
  'https://mcp.example.com/.well-known/oauth-protected-resource/mcp' \
  | python3 -m json.tool
</code></pre>
<p>For an MCP endpoint at <code>/mcp</code>, the document might contain:</p>
<pre><code class="language-json">{
  &quot;resource&quot;: &quot;https://mcp.example.com/mcp&quot;,
  &quot;authorization_servers&quot;: [&quot;https://auth.example.com&quot;],
  &quot;scopes_supported&quot;: [&quot;reports:read&quot;]
}
</code></pre>
<p>Keep this endpoint reachable before login. Otherwise the client needs a token to discover how to get a token. The <code>resource</code> value must identify the resource it’s connecting to. <a href="https://www.rfc-editor.org/rfc/rfc9728">Protected resource metadata, RFC 9728</a></p>
<p>With <code>https://auth.example.com</code> as the issuer, the next request goes here:</p>
<pre><code class="language-bash">curl --silent --show-error --fail-with-body \
  'https://auth.example.com/.well-known/oauth-authorization-server' \
  | python3 -m json.tool
</code></pre>
<p>The provider may use OIDC discovery instead. Either way, inspect <code>issuer</code>, <code>authorization_endpoint</code>, and <code>token_endpoint</code>. The issuer must match exactly. Providers with tenant paths need the discovery URL construction described in the spec; appending a suffix to the issuer won’t always produce the right URL. <a href="https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/authorization-server-discovery">Authorization server discovery</a></p>
<p>If either metadata URL returns your application’s login page, fix routing first. Look for a catch-all frontend route or authentication middleware covering the metadata endpoint.</p>
<h2>A rejected client ID is a registration problem</h2>
<p>Your account can be valid while the MCP client’s registration is wrong. Compare the request’s client ID and callback URL with the provider’s registration. Pay attention to the callback path and hostname: <code>localhost</code> and <code>127.0.0.1</code> aren’t interchangeable.</p>
<p>MCP 2026-07-28 supports pre-registration and Client ID Metadata Documents (CIMD), plus Dynamic Client Registration (DCR) for compatibility. DCR is deprecated and optional, so a missing <code>registration_endpoint</code> isn’t necessarily an error.</p>
<p>An HTTPS URL used as the client ID is a clue to check CIMD support. If the provider doesn’t support it, use a registration method both sides understand. For DCR with an OIDC provider, desktop clients may also need <code>application_type: &quot;native&quot;</code>.</p>
<p>If you’ve changed issuers, reset the affected connection’s registration through the client’s settings. Don’t reuse the old issuer’s client credentials. <a href="https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/client-registration">MCP client registration</a></p>
<h2>Login can work while the code exchange fails</h2>
<p>After the browser returns to the client, look for a successful token response. A completed callback alone doesn’t mean the exchange worked.</p>
<p>PKCE ties the authorization request to the code exchange. The client sends a challenge first, then the original verifier when it requests a token. Losing that verifier breaks the exchange. Generating another one at the token step won’t help. <a href="https://www.rfc-editor.org/rfc/rfc7636">PKCE, RFC 7636</a></p>
<p>Read the provider’s error response before retrying. Check the callback URI and whether another process owns the callback port. If the client runs in a container or on a remote machine, make sure the browser can reach its callback listener.</p>
<p>After fixing the configuration, start a fresh login instead of replaying the captured code.</p>
<h2>A token for the wrong API should fail</h2>
<p>The client must include the target <code>resource</code> in both the authorization request and the token request. Check that value when a newly issued token still gets a 401. The MCP server must reject a token issued for another resource. <a href="https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization">MCP resource and token requirements</a></p>
<p>For JWT access tokens, work through the validator’s checks:</p>
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
<p>A decoded JWT payload is only data until you validate it. Use a maintained validator configured for the provider’s access-token profile. For opaque tokens, use the provider’s supported validation mechanism. <a href="https://www.rfc-editor.org/rfc/rfc9068">JWT access-token validation, RFC 9068</a></p>
<p>Also confirm that <code>Authorization</code> reaches the application. Logging <code>authorization_header_present: true</code> is enough for that check. Keep the token itself out of the logs.</p>
<p>If a tool calls another API, handle that API’s credentials separately. Don’t forward the incoming MCP bearer token to it. <a href="https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices#token-passthrough">MCP token-passthrough guidance</a></p>
<h2>A 403 needs a permission check</h2>
<p>When the token is valid but lacks a required scope, the response can look like this:</p>
<pre><code class="language-http">HTTP/1.1 403 Forbidden
WWW-Authenticate: Bearer error=&quot;insufficient_scope&quot;, scope=&quot;reports:read&quot;
</code></pre>
<p>Bearer authentication uses 401 for invalid or expired tokens and 403 for insufficient scope. Compare what the operation requires with what the token grants. Signing in again with the same permissions won’t resolve a scope mismatch. <a href="https://www.rfc-editor.org/rfc/rfc6750">Bearer-token errors, RFC 6750</a></p>
<p>Your application still needs its own access checks. <code>reports:read</code> can permit the operation without granting access to every customer’s reports. Restrict the database query to the authenticated user’s tenant.</p>
<p>Test this with two tenants: a valid token for one must not read the other’s report.</p>
<h2>On AWS, find out whether the request reached Lambda</h2>
<p>For an API Gateway and Lambda deployment, start with the request path:</p>
<pre><code class="language-text">MCP client -&gt; API Gateway -&gt; authorizer, if configured -&gt; Lambda
</code></pre>
<p>Add CloudFront or a WAF if your setup uses them. Match the gateway access logs to the Lambda logs. When there’s no corresponding Lambda invocation, investigate the gateway or the layer in front of it.</p>
<p>Keep the public discovery routes reachable. If an upstream authorizer returns a generic rejection without the MCP challenge, the client still needs working well-known metadata routes.</p>
<p>Browser clients add another place to look: CORS. On HTTP APIs, API Gateway can handle preflight requests itself and override the integration’s CORS headers. If your <code>$default</code> route requires authorization, you may need an explicit unauthenticated <code>OPTIONS /{proxy+}</code> route. <a href="https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-cors.html">AWS HTTP API CORS documentation</a></p>
<p>Allow the request headers the client sends, and expose the response’s challenge header:</p>
<pre><code class="language-http">Access-Control-Expose-Headers: WWW-Authenticate
</code></pre>
<p><code>Authorization</code> belongs to the request; <code>WWW-Authenticate</code> belongs to the response. Allowing one doesn’t expose the other. Error responses need the appropriate allowed origin too. A successful curl request won’t catch this problem because curl doesn’t enforce browser CORS. <a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Access-Control-Expose-Headers">Response-header exposure</a></p>
<p>For protocol-version and routing failures, see <a href="/blog/mcp-stateless-spec-broke-my-lambda-mcp-server">the Lambda MCP migration post</a>. Those can interrupt the connection before OAuth gets a chance to work.</p>
<h2>Retest the original connection</h2>
<p>Use the client that originally failed, with its version recorded alongside your server SDK and protocol revision:</p>
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
<p>Once those checks pass, reconnect from a fresh session and run the original read-only operation. Keep its request ID with the server logs so the next failure has a useful comparison.</p>
