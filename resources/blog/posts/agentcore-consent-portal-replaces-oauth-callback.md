---
title: "AgentCore Consent Portal: Stop Hosting Your Own OAuth Callback"
seoTitle: "AgentCore Consent Portal Replaces Your OAuth Callback"
slug: "agentcore-consent-portal-replaces-oauth-callback"
brief: "AgentCore Identity now hosts the page where users approve what an agent can touch. Here is the CLI shape, the two callback URLs people mix up, and what it still won't do."
publishedAt: "2099-06-01T18:00:00.000Z"
draft: true
draftToken: "5e264f1519b31450484d6137537942e0"
readTimeInMinutes: 8
coverImageUrl: "/blog-assets/agentcore-consent-portal-replaces-oauth-callback/cover.jpg"
reactionCount: 0
responseCount: 0
replyCount: 0
tags:
  - name: AWS
    slug: aws
  - name: MCP
    slug: mcp
  - name: AI
    slug: ai
  - name: Security
    slug: security
---

<p>An agent that acts on a user's behalf needs that user to say yes first. "Connect your GitHub", "let it read your calendar". Somebody has to host the page where that happens, receive the OAuth redirect, bind the result to the right session and keep the token away from the browser.</p>

<p>Until September 2026 on AgentCore, that somebody was you. A small web app, a callback route, session storage, and a careful look at every redirect URI. None of it was your product. All of it was a place to get OAuth wrong.</p>

<p>AWS added a hosted version to AgentCore Identity. It's called a Consent Portal, and the <a href="https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/release-notes.html">release notes</a> list it under September 2026. This post covers how it's wired, the two callback URLs that are easy to swap, and the limits I'd check before deleting anything.</p>

<p>I haven't migrated a production agent to it yet. Everything below comes from the AWS docs, not from a war story, so check your own IdP before you trust the details.</p>

<h2>What the portal actually is</h2>

<p>The <a href="https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/identity-consent-portal.html">docs</a> describe it as a hosted, AWS-managed portal that signs your end users in to an OIDC identity provider and collects their consent before the agent touches a downstream resource. The OAuth flow stays server-side. The browser never holds a token.</p>

<p>Each portal attaches to exactly one AgentCore Gateway. It uses an OAuth2 credential provider to point at the same IdP the gateway's inbound JWT authorizer already trusts. When you create it, AWS checks that both reference the same OIDC issuer.</p>

<p>That makes two identities in play, and the docs are careful about the difference:</p>

<table>
<thead>
<tr>
<th>Role</th>
<th>What it is</th>
<th>Example</th>
</tr>
</thead>
<tbody>
<tr>
<td>Primary IdP</td>
<td>Who the end user signs in as. Must issue JWT access tokens.</td>
<td>Cognito, Okta</td>
</tr>
<tr>
<td>Outbound provider</td>
<td>The downstream resource the agent acts on. One provider can back several targets.</td>
<td>GitHub, Slack, Salesforce</td>
</tr>
</tbody>
</table>

<p>OAuth2-only vendors that issue no ID token and publish no OIDC discovery document can't be the primary IdP. The docs name GitHub, Slack, Salesforce, Atlassian and LinkedIn. They're still fine as outbound providers.</p>

<h2>Create the portal</h2>

<p>You need three things first: an OAuth2 credential provider for the primary IdP, a gateway with JWT inbound auth, and an execution role the portal assumes. That role reads the gateway and credential provider configuration and retrieves the OAuth client secret.</p>

<p>For the IdP application, use an OIDC web app with the authorization-code grant and a client secret. Leave the redirect URI empty or use a placeholder. The portal's callback URL doesn't exist yet.</p>

<pre><code class="language-bash">aws bedrock-agentcore-control create-consent-portal \
    --name "hrr-agent-consent" \
    --execution-role-arn "arn:aws:iam::&lt;account-id&gt;:role/hrr-consent-portal" \
    --idp-config '{
        "credentialProviderArn": "arn:aws:bedrock-agentcore:&lt;region&gt;:&lt;account-id&gt;:token-vault/default/oauth2credentialprovider/&lt;id&gt;",
        "scopes": ["openid", "email", "profile"],
        "audience": "&lt;audience&gt;"
    }' \
    --sources '[{
        "identifier": "&lt;gateway-id&gt;",
        "type": "agentcore-gateway"
    }]'
</code></pre>

<p>The name is 1 to 50 characters and <code>sources</code> takes exactly one <code>agentcore-gateway</code> entry. The portal always requests <code>openid</code> on top of your scopes, so every scope you list, plus <code>openid</code>, has to be defined and permitted on the IdP. Miss one and authorization fails with <code>invalid_scope</code>.</p>

<p>The portal starts in <code>CREATING</code>. <code>portalUrl</code> is null until it reaches <code>ACTIVE</code>, so poll for it:</p>

<pre><code class="language-bash">aws bedrock-agentcore-control get-consent-portal \
    --consent-portal-identifier "&lt;consent-portal-id&gt;"
</code></pre>

<p>If the status is <code>FAILED</code>, read <code>statusReason</code>.</p>

<h2>Two callbacks, two jobs</h2>

<p>This is the part I'd read twice. The portal has two different return paths and they belong in two different places.</p>

<table>
<thead>
<tr>
<th>URL</th>
<th>Where you register it</th>
<th>What it does</th>
</tr>
</thead>
<tbody>
<tr>
<td><code>&lt;portalUrl&gt;/callback</code></td>
<td>The primary IdP application</td>
<td>Signs the user in to the portal</td>
</tr>
<tr>
<td><code>&lt;portalUrl&gt;/connect/callback</code></td>
<td><code>defaultReturnUrl</code> on each gateway target</td>
<td>Binds the user's consent to the session</td>
</tr>
</tbody>
</table>

<p>Enter the first one exactly, with no trailing slash. The docs say a trailing slash makes the IdP reject the callback as unregistered. Cognito calls the field <b>Allowed callback URLs</b> and Okta calls it <b>Sign-in redirect URIs</b>.</p>

<p>There's a third URL that has nothing to do with the portal. <code>CreateOauth2CredentialProvider</code> returns a <code>callbackUrl</code> unique to each outbound provider. Register that one in the outbound provider's own app, such as your GitHub OAuth app. AgentCore Identity uses it to exchange the authorization code. Three URLs, three registrations. Mixing them up produces a redirect that lands somewhere that isn't the portal.</p>

<h2>Targets decide what users see</h2>

<p>An empty gateway gives an empty Connections page. A target shows up only if it needs per-user consent, and that's set in <code>credentialProviderConfigurations</code>:</p>

<ul>
  <li><code>providerArn</code> is the outbound OAuth2 credential provider.</li>
  <li><code>grantType</code> must be <code>AUTHORIZATION_CODE</code> (three-legged OAuth). <code>CLIENT_CREDENTIALS</code> targets need no consent and don't appear.</li>
  <li><code>defaultReturnUrl</code> must be exactly <code>&lt;portalUrl&gt;/connect/callback</code>.</li>
</ul>

<p>Add targets after the portal is <code>ACTIVE</code>, because that URL depends on <code>portalUrl</code>. The same rule applies to targets you already have. A target created before the portal has a different <code>defaultReturnUrl</code> or none, and its consent won't bind to the portal session until you update it.</p>

<p>Two smaller things from the docs. The connections list is cached for up to 5 minutes, so a new target won't appear instantly. And the portal shows your target and credential provider names to end users exactly as you typed them. <code>hrr-gh-prod-readonly-v2</code> is a bad thing to put in front of a customer.</p>

<h2>What happens without a stored credential</h2>

<p>If something calls a target directly and there's no valid stored credential, AgentCore Identity returns an authorization URL instead of a token. That happens when a user invokes a target from a coding agent without consenting first, and when a token expires. The user has to go back to the portal to grant consent and let Identity store a new token.</p>

<p>Plan for that in your agent's error handling. A tool call that comes back with an authorization URL isn't a failure to retry. It's a prompt to show the user.</p>

<h2>What I'd check before deleting my own callback service</h2>

<ul>
  <li>Does your primary IdP issue JWT access tokens? Opaque tokens aren't supported.</li>
  <li>Is the gateway's inbound auth JWT, and does it share an issuer with the credential provider?</li>
  <li>Are all the outbound providers you need registered, each with its own <code>callbackUrl</code>?</li>
  <li>Does every consent-requiring target use <code>AUTHORIZATION_CODE</code> and the portal's <code>/connect/callback</code>?</li>
  <li>Are the target names something a user should read?</li>
</ul>

<p>If your agent isn't behind an AgentCore Gateway, none of this applies. The portal has one source type, and it's the gateway.</p>

<p>This is about the user saying yes to a downstream resource. It doesn't fix a 401 from the gateway itself. That's the client proving who it is, and I covered it in <a href="/blog/mcp-authentication-fix-401-remote-server">MCP Authentication Explained: Fix 401 Errors in a Remote MCP Server</a>. A private MCP server behind the gateway is a different handshake again. I wrote that one up in <a href="/blog/agentcore-gateway-private-ca-without-the-alb">I Stopped Putting an ALB in Front of My Private MCP Just for TLS</a>.</p>

<p>The callback service was never the interesting part of the agent. If the portal does what the docs say, you can stop owning it, as long as you register the right URL in the right place.</p>

<p>Hope you enjoyed this one. Find me on X at <a href="https://x.com/harundotdev" target="_blank" rel="noopener noreferrer">https://x.com/harundotdev</a>, and grab every other link from my bio at <a href="https://harun.dev/bio" target="_blank" rel="noopener noreferrer">https://harun.dev/bio</a>.</p>
