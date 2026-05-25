---
title: "Building a Multi-Tenant SaaS Auth Layer on AWS Lambda with Fastify"
slug: "multi-tenant-saas-auth-lambda-fastify"
brief: "I have a production SaaS running on AWS Lambda with Fastify. Single tenant, single customer, everything working great. Then the second customer signed up.
That's when things got interesting. Suddenly "
publishedAt: "2026-04-11T14:13:47.821Z"
readTimeInMinutes: 14
reactionCount: 0
responseCount: 1
replyCount: 1
sourceUrl: "https://web.archive.org/web/*/https://blog.harun.dev/multi-tenant-saas-auth-lambda-fastify"
coverImageUrl: "https://raw.githubusercontent.com/HarunRRayhan/blog-assets/main/covers/multi-tenant-saas-auth-lambda-fastify/cover.jpg"
tags:
  - name: "AWS"
    slug: "aws"
  - name: "serverless"
    slug: "serverless"
  - name: "Node.js"
    slug: "nodejs"
  - name: "fastify"
    slug: "fastify"
  - name: "authentication"
    slug: "authentication"
---
<p>I have a production SaaS running on AWS Lambda with Fastify. Single tenant, single customer, everything working great. Then the second customer signed up.</p>
<p>That's when things got interesting. Suddenly every single request needed to answer one question before anything else happened: which tenant does this belong to? Auth and tenant isolation aren't separate concerns. They're the same concern. You can't verify a user's identity without also knowing which tenant they belong to, and you can't enforce tenant boundaries without solid auth.</p>
<p>So I built a multi-tenant auth layer that handles both problems in one pass. Every request flows through a Fastify plugin that identifies the tenant, verifies the caller's credentials, and decorates the request with tenant context. Downstream route handlers never think about auth or tenant resolution. They just read <code>request.tenantId</code> and get to work.</p>
<p>In this post I'll walk through the full implementation. We'll cover the tenant isolation strategy, the database schema, the auth plugin that wires JWT and API key verification together, per-tenant rate limiting, and how individual routes opt into different auth requirements. All the code examples are sanitized but the patterns are running in production right now.</p>
<p>Let's get into it.</p>
<p><img src="https://images.pexels.com/photos/17323801/pexels-photo-17323801.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="Secure server infrastructure" />
<sub>Photo by <a href="https://www.pexels.com/@cookiecutter">panumas nikhomkhai</a> on <a href="https://www.pexels.com/photo/network-rack-17323801/">Pexels</a></sub></p>
<h2>The Tenant Isolation Strategy</h2>
<p>The core idea is simple. Tenant identity flows through every single request as first-class context. No request gets past the auth layer without a resolved <code>tenantId</code> attached to it.</p>
<p>I support two authentication strategies, and both end up in the same place:</p>
<ol>
<li><p><strong>JWT tokens</strong> for logged-in users. The token carries the <code>tenant_id</code> right in the claims. When a user logs in, the JWT gets stamped with their tenant. Every subsequent request just verifies the token and reads the claim.</p>
</li>
<li><p><strong>API keys</strong> for machine-to-machine calls. The key is hashed and looked up in the database. The matching row has a <code>tenant_id</code> column. So the lookup itself resolves the tenant.</p>
</li>
</ol>
<p>Both paths converge on the same Fastify request decoration:</p>
<pre><code class="language-typescript">// Add tenant context to every request
declare module 'fastify' {
  interface FastifyRequest {
    tenantId: string;
    tenantPlan: 'free' | 'pro' | 'enterprise';
  }
}
</code></pre>
<p>After the auth plugin runs, every route handler in the entire app can just read <code>request.tenantId</code> and <code>request.tenantPlan</code>. The plan field is especially useful because it drives feature gating and rate limits downstream. A free tenant gets different quotas than an enterprise tenant, and that decision happens once in the auth layer instead of being scattered across individual routes.</p>
<p>This pattern also makes audit logging trivial. Every database query, every log line, every error report can include the tenant ID because it's always available on the request object. No guessing. No passing tenant context through five layers of function calls.</p>
<p>The thing is, this only works if you're disciplined about it. Every table that holds tenant data needs a <code>tenant_id</code> column. Every query needs a <code>WHERE tenant_id = $1</code> clause. Miss one and you've got a data leak between tenants. More on the schema in the next section.</p>
<p><img src="https://images.pexels.com/photos/5380792/pexels-photo-5380792.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="Network isolation and security layers" />
<sub>Photo by <a href="https://www.pexels.com/@tima-miroshnichenko">Tima Miroshnichenko</a> on <a href="https://www.pexels.com/photo/close-up-view-of-system-hacking-5380792/">Pexels</a></sub></p>
<h2>The Database Schema</h2>
<p>The schema is simple but solid. Three core tables handle all the tenant and auth state:</p>
<pre><code class="language-sql">CREATE TABLE hrr_tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  plan VARCHAR(20) NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free', 'pro', 'enterprise')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE hrr_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES hrr_tenants(id),
  key_hash VARCHAR(64) NOT NULL,
  name VARCHAR(255) NOT NULL,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_hrr_api_keys_hash ON hrr_api_keys(key_hash);

CREATE TABLE hrr_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES hrr_tenants(id),
  email VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'member'
    CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_hrr_users_email ON hrr_users(email);
</code></pre>
<p>A few things worth calling out.</p>
<p>The <code>key_hash</code> column stores a SHA-256 hash of the API key, never the plaintext. Why? If someone gets read access to your database (SQL injection, leaked backup, compromised replica), they still can't use the API keys. The hash is one-way. This is the same reason you hash passwords, and it's just as important for API keys.</p>
<p>The unique index on <code>key_hash</code> is critical for performance. Every API key request triggers a lookup by hash. Without the index, that's a full table scan on every authenticated request. With it, it's an O(1) index seek.</p>
<p>Notice that both <code>hrr_api_keys</code> and <code>hrr_users</code> have a <code>tenant_id</code> foreign key. This is the pattern I mentioned earlier. Every table that holds tenant data gets a <code>tenant_id</code> column. It feels redundant sometimes, especially when you could derive it through a join. But the explicit column makes queries simpler, makes accidental cross-tenant data access harder, and makes row-level security policies straightforward if you ever need them.</p>
<p><img src="https://images.pexels.com/photos/3803517/pexels-photo-3803517.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="Database schema and table design" />
<sub>Photo by <a href="https://www.pexels.com/@brett-sayles">Brett Sayles</a> on <a href="https://www.pexels.com/photo/web-banner-with-online-information-on-computer-3803517/">Pexels</a></sub></p>
<h2>The Auth Plugin</h2>
<p>This is the heart of the whole system. A single Fastify plugin that resolves tenant context and verifies credentials for every protected request.</p>
<pre><code class="language-typescript">import fp from 'fastify-plugin';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

async function authPlugin(fastify: FastifyInstance) {
  // Decorate the request with tenant context
  fastify.decorateRequest('tenantId', '');
  fastify.decorateRequest('tenantPlan', 'free');

  fastify.decorate(
    'authenticate',
    async (request: FastifyRequest, reply: FastifyReply) =&gt; {
      const authHeader = request.headers.authorization;

      if (!authHeader) {
        return reply
          .status(401)
          .send({ message: 'Authentication required' });
      }

      if (authHeader.startsWith('Bearer ')) {
        await verifyJwt(fastify, request, reply, authHeader.slice(7));
      } else if (authHeader.startsWith('ApiKey ')) {
        await verifyApiKey(fastify, request, reply, authHeader.slice(7));
      } else {
        return reply
          .status(401)
          .send({ message: 'Authentication failed' });
      }
    }
  );
}

// Wrap with fastify-plugin to break encapsulation
export default fp(authPlugin, {
  name: 'auth-plugin',
  dependencies: ['database-plugin'],
});
</code></pre>
<p>The <code>fp()</code> wrapper from <code>fastify-plugin</code> is important. By default, Fastify encapsulates plugins so their decorators are only visible within the plugin's own scope. Wrapping with <code>fp()</code> breaks that encapsulation and makes <code>fastify.authenticate</code> available to every route in the app. Without it, your route handlers can't access the auth decorator.</p>
<p>The <code>dependencies</code> array tells Fastify that this plugin requires the database plugin to be registered first. If you accidentally register them in the wrong order, Fastify throws a clear error at startup instead of failing silently at runtime.</p>
<p>Notice the request decoration pattern. I call <code>decorateRequest</code> with default values during plugin registration. Fastify needs to know about these properties at startup so it can optimize the request object's internal shape. Then the <code>authenticate</code> preHandler fills in the real values on each request. This two-phase approach (declare shape at startup, populate at request time) is how Fastify keeps its request handling fast.</p>
<p><img src="https://images.pexels.com/photos/34803988/pexels-photo-34803988.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="Software plugin architecture" />
<sub>Photo by <a href="https://www.pexels.com/@dkomov">Daniil Komov</a> on <a href="https://www.pexels.com/photo/close-up-of-programming-code-on-computer-screen-34803988/">Pexels</a></sub></p>
<h2>JWT Strategy</h2>
<p>The JWT carries everything the auth layer needs to resolve a tenant without hitting the database on every request.</p>
<p>Here's the token payload structure:</p>
<pre><code class="language-typescript">interface HrrTokenPayload {
  sub: string;       // userId
  tenant_id: string; // tenantId
  plan: 'free' | 'pro' | 'enterprise';
  iat: number;
  exp: number;
}
</code></pre>
<p>The signing secret lives in AWS Secrets Manager. I fetch it once during Lambda cold start and cache it for the lifetime of the container:</p>
<pre><code class="language-typescript">import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';

const smClient = new SecretsManagerClient();
let cachedJwtSecret: string | null = null;

async function getJwtSecret(): Promise&lt;string&gt; {
  if (cachedJwtSecret) return cachedJwtSecret;

  const response = await smClient.send(
    new GetSecretValueCommand({
      SecretId: process.env.JWT_SECRET_ARN,
    })
  );

  cachedJwtSecret = response.SecretString!;
  return cachedJwtSecret;
}
</code></pre>
<p>Why Secrets Manager instead of Parameter Store? Secrets Manager supports automatic rotation. You can set up a Lambda rotation function that generates a new signing key on a schedule. Parameter Store doesn't have that built in.</p>
<p>Token generation happens at login:</p>
<pre><code class="language-typescript">async function generateToken(user: {
  id: string;
  tenantId: string;
  tenantPlan: string;
}): Promise&lt;string&gt; {
  const secret = await getJwtSecret();
  return jwt.sign(
    { sub: user.id, tenant_id: user.tenantId, plan: user.tenantPlan },
    secret,
    { expiresIn: '24h' }
  );
}
</code></pre>
<p>And verification in the auth plugin:</p>
<pre><code class="language-typescript">async function verifyJwt(
  fastify: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
  token: string
) {
  try {
    const secret = await getJwtSecret();
    const payload = jwt.verify(token, secret) as HrrTokenPayload;
    request.tenantId = payload.tenant_id;
    request.tenantPlan = payload.plan;
  } catch {
    return reply.status(401).send({ message: 'Authentication failed' });
  }
}
</code></pre>
<p>The tenant ID and plan come straight from the token claims. No database query needed. This is the fastest auth path and it's what every browser-based user hits.</p>
<p><img src="https://images.pexels.com/photos/11279906/pexels-photo-11279906.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="JWT token security and verification" />
<sub>Photo by <a href="https://www.pexels.com/@roger-brown-3435524">Roger Brown</a> on <a href="https://www.pexels.com/photo/gold-iphone-6-on-black-wooden-table-11279906/">Pexels</a></sub></p>
<h2>API Key Strategy</h2>
<p>API keys are for machine-to-machine calls. CI/CD pipelines, third-party integrations, webhook consumers. Anything that doesn't have a human logging in.</p>
<p>The key format uses a recognizable prefix so developers can immediately tell what kind of credential they're looking at:</p>
<pre><code class="language-typescript">import crypto from 'crypto';

function generateApiKey(): {
  plaintext: string;
  hash: string;
} {
  const raw = crypto.randomBytes(32).toString('hex');
  const plaintext = `hrr_live_${raw}`;
  const hash = crypto
    .createHash('sha256')
    .update(plaintext)
    .digest('hex');

  return { plaintext, hash };
}
</code></pre>
<p>The <code>hrr_live_</code> prefix followed by 32 hex bytes gives you 64 characters of randomness. That's 256 bits of entropy, which is more than enough to make brute-force attacks impractical.</p>
<p>When a user creates an API key through the dashboard, the plaintext is returned exactly once in the response. Only the SHA-256 hash gets stored in <code>hrr_api_keys</code>. If the user loses the key, they generate a new one. No recovery. No "show me my key again." This is the same model GitHub and Stripe use.</p>
<p>The lookup on each request is a single indexed query:</p>
<pre><code class="language-typescript">async function verifyApiKey(
  fastify: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
  key: string
) {
  const hash = crypto
    .createHash('sha256')
    .update(key)
    .digest('hex');

  const result = await fastify.pg.query(
    `SELECT ak.tenant_id, t.plan
     FROM hrr_api_keys ak
     JOIN hrr_tenants t ON t.id = ak.tenant_id
     WHERE ak.key_hash = $1`,
    [hash]
  );

  if (result.rows.length === 0) {
    return reply.status(401).send({ message: 'Authentication failed' });
  }

  const row = result.rows[0];
  request.tenantId = row.tenant_id;
  request.tenantPlan = row.plan;

  // Fire-and-forget: update last_used_at
  fastify.pg
    .query(
      'UPDATE hrr_api_keys SET last_used_at = NOW() WHERE key_hash = $1',
      [hash]
    )
    .catch(() =&gt; {});
}
</code></pre>
<p>A few things to notice. The query uses a parameterized placeholder (<code>$1</code>), not string interpolation. This prevents SQL injection and it also helps RDS Proxy with connection pooling because the query plan can be cached and reused. The <code>last_used_at</code> update is fire-and-forget. It's useful for the dashboard ("this key was last used 3 hours ago") but it shouldn't add latency to the actual request. If the update fails for some reason, we swallow the error and move on.</p>
<p>The join with <code>hrr_tenants</code> in the lookup query is intentional. It loads the tenant plan in the same round trip. One query, one network hop, and the request has full tenant context.</p>
<p><img src="https://images.pexels.com/photos/37003192/pexels-photo-37003192.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="API key generation and cryptography" />
<sub>Photo by <a href="https://www.pexels.com/@zulfugarkarimov">Zulfugar Karimov</a> on <a href="https://www.pexels.com/photo/black-and-white-close-up-of-hanging-key-37003192/">Pexels</a></sub></p>
<h2>Per-Tenant Rate Limiting</h2>
<p>Once you have tenant context on every request, rate limiting by tenant is straightforward. I use <code>@fastify/rate-limit</code> with a custom key function:</p>
<pre><code class="language-typescript">import rateLimit from '@fastify/rate-limit';

await app.register(rateLimit, {
  global: true,
  max: (request: FastifyRequest) =&gt; {
    switch (request.tenantPlan) {
      case 'enterprise':
        return 5000;
      case 'pro':
        return 1000;
      case 'free':
      default:
        return 100;
    }
  },
  timeWindow: '1 minute',
  keyGenerator: (request: FastifyRequest) =&gt; {
    return request.tenantId || request.ip;
  },
  errorResponseBuilder: (_request, context) =&gt; ({
    statusCode: 429,
    error: 'Too Many Requests',
    message: `Rate limit exceeded. Retry in ${context.after}`,
  }),
});
</code></pre>
<p>The <code>keyGenerator</code> uses the tenant ID as the rate limit bucket key. All requests from the same tenant share a single counter, regardless of which user or API key made the call. This prevents a single tenant from burning through shared resources, even if they spread their traffic across multiple API keys.</p>
<p>The fallback to <code>request.ip</code> handles unauthenticated endpoints like the login route. You still want rate limiting on those to prevent brute-force attacks.</p>
<p>The <code>max</code> function reads <code>request.tenantPlan</code> to set different limits per pricing tier. Free tenants get 100 requests per minute. Pro gets 1,000. Enterprise gets 5,000. These numbers are tuned for my workload, but the pattern works for any tier-based pricing model.</p>
<p>One thing I like about this approach is that upgrading a tenant's rate limit is just a database update. Change their plan from <code>free</code> to <code>pro</code> in <code>hrr_tenants</code>, and the next request they make automatically gets the higher limit. No redeployment needed.</p>
<p><img src="https://images.pexels.com/photos/34496190/pexels-photo-34496190.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="Rate limiting and traffic control" />
<sub>Photo by <a href="https://www.pexels.com/@photopach-mx-2156635376">photopach mx</a> on <a href="https://www.pexels.com/photo/close-up-of-motorcycle-handlebar-controls-34496190/">Pexels</a></sub></p>
<h2>Protecting Routes</h2>
<p>Individual routes opt into auth by adding <code>preHandler</code> hooks. This gives you fine-grained control over which endpoints require authentication and what kind.</p>
<p>A route that requires JWT only (browser sessions):</p>
<pre><code class="language-typescript">app.get('/api/dashboard', {
  preHandler: [app.authenticate],
  schema: {
    tags: ['Dashboard'],
    security: [{ bearerAuth: [] }],
  },
  handler: async (request, reply) =&gt; {
    const data = await getDashboard(request.tenantId);
    return reply.send(data);
  },
});
</code></pre>
<p>A route that accepts both JWT and API key:</p>
<pre><code class="language-typescript">app.post('/api/events', {
  preHandler: [app.authenticate],
  schema: {
    tags: ['Events'],
    security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
    body: {
      type: 'object',
      required: ['type', 'payload'],
      properties: {
        type: { type: 'string' },
        payload: { type: 'object' },
      },
    },
  },
  handler: async (request, reply) =&gt; {
    await ingestEvent(request.tenantId, request.body);
    return reply.status(201).send({ status: 'accepted' });
  },
});
</code></pre>
<p>A public route with no auth:</p>
<pre><code class="language-typescript">app.get('/api/health', {
  schema: {
    tags: ['System'],
  },
  handler: async (_request, reply) =&gt; {
    return reply.send({ status: 'ok', timestamp: new Date().toISOString() });
  },
});
</code></pre>
<p>The <code>security</code> field in the schema doesn't enforce anything by itself. That's the <code>preHandler</code>'s job. But it documents the auth requirements in the generated OpenAPI spec, which means your Swagger UI shows developers exactly which credentials each endpoint expects. The schema and the actual enforcement stay in the same route definition, so they can't drift apart.</p>
<p>For routes that need both auth and additional authorization (like "only tenant owners can delete API keys"), I stack multiple preHandlers:</p>
<pre><code class="language-typescript">app.delete('/api/keys/:keyId', {
  preHandler: [app.authenticate, requireRole('owner')],
  handler: deleteApiKeyHandler,
});
</code></pre>
<p>The hooks run in order. First authenticate, then check the role. If either fails, the request stops and the handler never runs.</p>
<p><img src="https://images.pexels.com/photos/7009860/pexels-photo-7009860.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="Route protection and access control" />
<sub>Photo by <a href="https://www.pexels.com/@tima-miroshnichenko">Tima Miroshnichenko</a> on <a href="https://www.pexels.com/photo/a-person-holding-a-map-7009860/">Pexels</a></sub></p>
<h2>What I Learned</h2>
<p>After running this in production with real tenants, here are the lessons that stuck with me.</p>
<p><strong>Hash API keys immediately on generation, and never store plaintext.</strong> This sounds obvious, but I've seen production codebases that store raw API keys in a <code>credentials</code> column. If your database leaks, those keys are usable instantly. SHA-256 hashing costs almost nothing at request time and makes a breach significantly less damaging.</p>
<p><strong>Put <code>tenant_id</code> in every table that holds tenant data, even when it feels redundant.</strong> I initially tried deriving tenant context through joins. It works until you write one query that forgets the join, and suddenly you're returning data across tenants. The explicit column makes every query self-contained and auditable.</p>
<p><strong>RDS Proxy is non-negotiable with Lambda.</strong> Each Lambda container opens its own database connection. Under burst traffic, hundreds of containers spin up simultaneously. Without RDS Proxy multiplexing those connections, you'll hit <code>max_connections</code> in seconds. Use parameterized queries too. They let RDS Proxy reuse prepared statements across connections, which prevents connection exhaustion under load.</p>
<p><strong>Test with two tenants in staging before you think it works.</strong> Single-tenant testing hides a whole class of bugs. Create two test tenants, generate API keys for both, and verify that tenant A's key can never access tenant B's data. This caught three bugs for me that unit tests missed entirely.</p>
<p><img src="https://images.pexels.com/photos/5212341/pexels-photo-5212341.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="Lessons learned and reflection" />
<sub>Photo by <a href="https://www.pexels.com/@max-fischer">Max Fischer</a> on <a href="https://www.pexels.com/photo/a-person-writing-on-the-notebook-5212341/">Pexels</a></sub></p>
<h2>Wrapping Up</h2>
<p>Multi-tenant auth is one of those things that's straightforward in concept but full of sharp edges in practice. The Fastify plugin system makes it manageable. You write the auth logic once, register it as a plugin, and every route in your app gets tenant-aware security for free.</p>
<p>Hope you enjoyed this walkthrough. If you're building something similar or have questions about any of these patterns, feel free to drop a comment below.</p>
<hr />
<p><em>Follow me on <a href="https://x.com/HarunRRayhan">Twitter/X</a> for more posts about AWS, serverless architecture, and building SaaS products.</em></p>
<p><img src="https://images.pexels.com/photos/3912478/pexels-photo-3912478.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="Developer community and collaboration" />
<sub>Photo by <a href="https://www.pexels.com/@thisisengineering">ThisIsEngineering</a> on <a href="https://www.pexels.com/photo/engineers-designing-app-3912478/">Pexels</a></sub></p>
