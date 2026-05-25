---
title: "Building a Multi-Tenant Billing System on AWS Lambda with Stripe"
slug: "multi-tenant-billing-aws-lambda-stripe"
brief: "In the last post I walked through the multi-tenant auth layer running in front of my Fastify API on AWS Lambda. JWT tokens, hashed API keys, tenant context decorated onto every request. That solved th"
publishedAt: "2026-04-25T15:06:56.259Z"
readTimeInMinutes: 21
reactionCount: 0
responseCount: 0
replyCount: 0
sourceUrl: "https://web.archive.org/web/*/https://blog.harun.dev/multi-tenant-billing-aws-lambda-stripe"
coverImageUrl: "https://raw.githubusercontent.com/HarunRRayhan/blog-assets/main/covers/multi-tenant-billing-aws-lambda-stripe/cover.jpg"
tags:
  - name: "AWS"
    slug: "aws"
  - name: "serverless"
    slug: "serverless"
  - name: "Node.js"
    slug: "nodejs"
  - name: "stripe"
    slug: "stripe"
  - name: "SaaS"
    slug: "saas"
---
<p>In the <a href="https://harun.dev/blog/building-a-multi-tenant-saas-auth-layer-on-aws-lambda-with-fastify">last post</a> I walked through the multi-tenant auth layer running in front of my Fastify API on AWS Lambda. JWT tokens, hashed API keys, tenant context decorated onto every request. That solved the "who is this and which tenant do they belong to" problem.</p>
<p>Then my second customer asked about pricing tiers. The third one wanted to upgrade themselves without emailing me. That's when I hit the wall every SaaS hits eventually. You need billing. Not someday, right now. And it has to know which plan a tenant is on before the request even reaches your handler, because some routes are pro-only and some are free-forever.</p>
<p>So I bolted Stripe onto the existing auth layer. One Stripe Customer per tenant. Plans modeled as Products and Prices in Stripe. Subscription state mirrored locally so the auth-then-billing pipeline can decide in microseconds whether this request is allowed. Webhooks for the source of truth. Checkout sessions for upgrades. The customer portal for everything else.</p>
<p>This post walks through the whole thing. The Fastify billing plugin that sits next to the auth plugin, the webhook handler with the raw-body gotcha that ate two hours of my life, the checkout flow, and the bits I got wrong before I got them right. The code is sanitized but it's the same code running in my production stack.</p>
<p><img src="https://images.pexels.com/photos/9122014/pexels-photo-9122014.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="Payment processing and billing" />
<sub>Photo by <a href="https://www.pexels.com/@towfiqu-barbhuiya-3440682">Towfiqu barbhuiya</a> on <a href="https://www.pexels.com/photo/contactless-payment-with-credit-card-9122014/">Pexels</a></sub></p>
<h2>Architecture overview</h2>
<p>I kept the model boring on purpose. One Stripe Customer per tenant, one active subscription per customer, plans stored as Stripe Products with one or more Prices. The local database mirrors the subscription state so every request can read the plan without calling Stripe.</p>
<pre><code>                  ┌──────────────────────┐
                  │   Tenant frontend    │
                  └──────────┬───────────┘
                             │
                             ▼
        ┌────────────────────────────────────────┐
        │  API Gateway / Lambda URL              │
        │  ┌──────────────────────────────────┐  │
        │  │ Fastify app                      │  │
        │  │  1. auth-plugin   (tenantId)     │  │
        │  │  2. billing-plugin (plan)        │  │
        │  │  3. routes  (request.plan check) │  │
        │  └──────────────────────────────────┘  │
        └────────────┬───────────────┬───────────┘
                     │               │
                     ▼               ▼
              ┌────────────┐   ┌────────────┐
              │ Postgres   │   │  Stripe    │
              │ hrr_tenants│◀──│  webhooks  │
              └────────────┘   └────────────┘
</code></pre>
<p>Stripe is the source of truth for subscription status. The local <code>hrr_tenants</code> row is a cache that gets reconciled on every webhook event. The auth plugin runs first and resolves <code>request.tenantId</code>. The billing plugin runs right after and decorates <code>request.plan</code> and <code>request.billingPeriodEnd</code>. By the time a route handler runs, both pieces of context are already sitting on the request.</p>
<p>The reason billing comes after auth is obvious once you say it out loud. You can't load a tenant's plan if you don't know which tenant. But I'll spell it out because Fastify plugin order is load-bearing here. Get it backwards and the billing plugin reads <code>undefined</code> for the tenant ID, then silently treats every request as anonymous. Ask me how I know.</p>
<p><img src="https://images.pexels.com/photos/4458200/pexels-photo-4458200.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="System architecture and data flow" />
<sub>Photo by <a href="https://www.pexels.com/@ivan-s">Ivan S</a> on <a href="https://www.pexels.com/photo/a-photo-of-a-floor-plan-4458200/">Pexels</a></sub></p>
<h2>Database schema</h2>
<p>The <code>hrr_tenants</code> table from the auth post grows a few new columns. Stripe gives you stable identifiers (<code>cus_*</code>, <code>sub_*</code>) that I store directly. I reuse the plan column as the cached subscription tier. <code>billing_period_end</code> lets the API show "renews on" without a Stripe round trip.</p>
<pre><code class="language-sql">ALTER TABLE hrr_tenants
  ADD COLUMN stripe_customer_id     VARCHAR(64),
  ADD COLUMN stripe_subscription_id VARCHAR(64),
  ADD COLUMN billing_period_end     TIMESTAMPTZ,
  ADD COLUMN billing_status         VARCHAR(32) NOT NULL DEFAULT 'inactive'
    CHECK (billing_status IN ('inactive', 'active', 'past_due', 'canceled', 'trialing'));

-- The plan column already exists from the auth post,
-- but widen the check constraint to match Stripe products.
ALTER TABLE hrr_tenants
  DROP CONSTRAINT hrr_tenants_plan_check;

ALTER TABLE hrr_tenants
  ADD CONSTRAINT hrr_tenants_plan_check
  CHECK (plan IN ('free', 'starter', 'pro'));

-- Webhook idempotency table. One row per Stripe event ID we've processed.
CREATE TABLE hrr_billing_events (
  event_id     VARCHAR(64) PRIMARY KEY,
  type         VARCHAR(64) NOT NULL,
  tenant_id    UUID REFERENCES hrr_tenants(id),
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_hrr_tenants_stripe_customer
  ON hrr_tenants(stripe_customer_id);
CREATE INDEX idx_hrr_tenants_stripe_subscription
  ON hrr_tenants(stripe_subscription_id);
</code></pre>
<p>The two indexes matter. Webhook handlers look up tenants by <code>stripe_subscription_id</code> (when a subscription updates) or by <code>stripe_customer_id</code> (when a customer event fires). Without indexes you're scanning the whole tenants table on every webhook. Sounds fine until you have ten thousand tenants and Stripe replays a backlog.</p>
<p>The <code>hrr_billing_events</code> table is my idempotency log. Stripe will absolutely deliver the same event twice. Sometimes more. The PRIMARY KEY on <code>event_id</code> turns "did I already process this" into a single insert that either succeeds (first time) or fails with a duplicate key error (replay). I'll show how that's wired up in the webhook section.</p>
<p>Free is the odd one out. Free tenants have no <code>stripe_subscription_id</code> and no <code>stripe_customer_id</code> until they upgrade for the first time. I still create the customer at signup though. More on why in the next section.</p>
<p><img src="https://images.pexels.com/photos/6694543/pexels-photo-6694543.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="Billing database schema" />
<sub>Photo by <a href="https://www.pexels.com/@tima-miroshnichenko">Tima Miroshnichenko</a> on <a href="https://www.pexels.com/photo/banknotes-and-calculator-on-table-6694543/">Pexels</a></sub></p>
<h2>Creating a Stripe customer on signup</h2>
<p>I went back and forth on this one. Lazy customer creation (only call Stripe when the tenant first tries to upgrade) feels cleaner. But it means the upgrade path has an extra failure mode and an extra latency hit at the worst possible time. Eager creation (call Stripe at signup) costs one API call per signup and removes a whole class of problems later.</p>
<p>I went eager. The signup handler creates the Stripe customer right after creating the tenant row, in the same request.</p>
<pre><code class="language-typescript">import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
  // Stripe SDK retries on its own. Lambda timeouts are short,
  // so cap the timeout per attempt.
  timeout: 8_000,
  maxNetworkRetries: 2,
});

interface SignupBody {
  tenantName: string;
  ownerEmail: string;
}

app.post&lt;{ Body: SignupBody }&gt;('/api/signup', async (request, reply) =&gt; {
  const { tenantName, ownerEmail } = request.body;

  // 1. Create the tenant row first so we have a tenant ID.
  const tenant = await fastify.pg.one&lt;{ id: string }&gt;(
    `INSERT INTO hrr_tenants (name, plan, billing_status)
     VALUES ($1, 'free', 'inactive')
     RETURNING id`,
    [tenantName],
  );

  // 2. Create the Stripe customer. The idempotency key is keyed on
  //    the tenant ID so retries from the client (or Lambda)
  //    don't create duplicate customers in Stripe.
  const customer = await stripe.customers.create(
    {
      email: ownerEmail,
      name: tenantName,
      metadata: { tenant_id: tenant.id },
    },
    { idempotencyKey: `hrr_signup_${tenant.id}` },
  );

  // 3. Persist the customer ID back on the tenant.
  await fastify.pg.query(
    `UPDATE hrr_tenants
     SET stripe_customer_id = $1
     WHERE id = $2`,
    [customer.id, tenant.id],
  );

  return reply.status(201).send({ tenantId: tenant.id });
});
</code></pre>
<p>Two things worth pointing out. The <code>idempotencyKey</code> on <code>stripe.customers.create</code> is the unsexy hero here. If the Lambda times out after Stripe creates the customer but before I save the ID, the client retries, and I'd end up with a second customer in Stripe and no way to clean it up. With the idempotency key, Stripe returns the same customer object on retry. Free duplicate protection.</p>
<p>The <code>metadata.tenant_id</code> is also load-bearing. Every Stripe object I create from this point on (customers, subscriptions, checkout sessions, invoices) gets stamped with <code>tenant_id</code> in metadata. When a webhook arrives, that metadata gives me a backup path to resolve the tenant if the customer ID lookup ever misses for whatever reason.</p>
<p>The order matters. Tenant row first, then Stripe customer, then update the row. If step 2 fails, I have a tenant with no Stripe customer, which is a recoverable state (the next signup retry or a backfill job can fix it). If I'd created the Stripe customer first and then the tenant row failed, I'd have an orphaned Stripe customer with no local tenant to bind it to. That's harder to clean up.</p>
<p><img src="https://images.pexels.com/photos/162622/facebook-login-office-laptop-business-162622.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="Tenant signup and account creation" />
<sub>Photo by <a href="https://www.pexels.com/@pixabay">Pixabay</a> on <a href="https://www.pexels.com/photo/photo-of-a-laptop-162622/">Pexels</a></sub></p>
<h2>The billing Fastify plugin</h2>
<p>This piece does the real work on every request. It runs after the auth plugin, reads <code>request.tenantId</code>, and decorates <code>request.plan</code> plus <code>request.billingPeriodEnd</code> so route handlers can do plan checks without writing any boilerplate.</p>
<pre><code class="language-typescript">import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyRequest } from 'fastify';

type Plan = 'free' | 'starter' | 'pro';

declare module 'fastify' {
  interface FastifyRequest {
    plan: Plan;
    billingPeriodEnd: Date | null;
    billingStatus: 'inactive' | 'active' | 'past_due' | 'canceled' | 'trialing';
  }
}

interface CachedBilling {
  plan: Plan;
  billingPeriodEnd: Date | null;
  billingStatus: FastifyRequest['billingStatus'];
  cachedAt: number;
}

// Per-container cache. Lambda reuses warm containers, so this gives us
// near-zero overhead for repeat requests from the same tenant.
const billingCache = new Map&lt;string, CachedBilling&gt;();
const CACHE_TTL_MS = 30_000;

async function billingPlugin(fastify: FastifyInstance) {
  fastify.decorateRequest('plan', 'free');
  fastify.decorateRequest('billingPeriodEnd', null);
  fastify.decorateRequest('billingStatus', 'inactive');

  fastify.addHook('preHandler', async (request: FastifyRequest) =&gt; {
    // Skip routes that didn't run the auth plugin (e.g. /health, webhooks).
    if (!request.tenantId) return;

    const cached = billingCache.get(request.tenantId);
    if (cached &amp;&amp; Date.now() - cached.cachedAt &lt; CACHE_TTL_MS) {
      request.plan = cached.plan;
      request.billingPeriodEnd = cached.billingPeriodEnd;
      request.billingStatus = cached.billingStatus;
      return;
    }

    const row = await fastify.pg.oneOrNone&lt;{
      plan: Plan;
      billing_period_end: Date | null;
      billing_status: FastifyRequest['billingStatus'];
    }&gt;(
      `SELECT plan, billing_period_end, billing_status
       FROM hrr_tenants
       WHERE id = $1`,
      [request.tenantId],
    );

    const plan = row?.plan ?? 'free';
    const billingPeriodEnd = row?.billing_period_end ?? null;
    const billingStatus = row?.billing_status ?? 'inactive';

    request.plan = plan;
    request.billingPeriodEnd = billingPeriodEnd;
    request.billingStatus = billingStatus;

    billingCache.set(request.tenantId, {
      plan,
      billingPeriodEnd,
      billingStatus,
      cachedAt: Date.now(),
    });
  });
}

export default fp(billingPlugin, {
  name: 'billing-plugin',
  dependencies: ['auth-plugin', 'database-plugin'],
});
</code></pre>
<p>The <code>dependencies</code> array is what enforces plugin ordering. Fastify will refuse to start if <code>auth-plugin</code> isn't registered first. That's exactly the kind of bug I'd rather catch at boot than at 3am via a "why is every request unauthenticated" alert.</p>
<p>The cache is a per-Lambda-container Map with a 30 second TTL. Not Redis. Not DynamoDB. Just a Map. Lambda reuses warm containers for several minutes, so a busy tenant hits the cache for almost every request after the first one. When the webhook fires and a tenant's plan changes, the worst case is 30 seconds of stale data before the next read pulls fresh state. For billing that's totally fine. If you need stricter consistency you can bust the cache from the webhook handler, but I haven't needed to.</p>
<p>I deliberately do NOT call Stripe from this plugin. Every request would hit Stripe's API otherwise, which blows your rate limit and adds 100ms of latency to every authenticated request. The webhook handler updates the local row, and the plugin reads from the local row. Stripe is the source of truth, the database is the read path.</p>
<p><img src="https://images.pexels.com/photos/35978924/pexels-photo-35978924.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="Fastify plugin chain" />
<sub>Photo by <a href="https://www.pexels.com/@onuryumlu">Onur Yumlu</a> on <a href="https://www.pexels.com/photo/intricate-view-of-ancient-architectural-columns-35978924/">Pexels</a></sub></p>
<h2>Enforcing plan limits in route handlers</h2>
<p>With <code>request.plan</code> on every authenticated request, plan gating becomes a one-liner. I wrap it in a tiny helper so the intent is obvious in route code.</p>
<pre><code class="language-typescript">import type { FastifyRequest, FastifyReply } from 'fastify';

type Plan = 'free' | 'starter' | 'pro';

const PLAN_RANK: Record&lt;Plan, number&gt; = {
  free: 0,
  starter: 1,
  pro: 2,
};

export function requirePlan(minimum: Plan) {
  return async (request: FastifyRequest, reply: FastifyReply) =&gt; {
    if (PLAN_RANK[request.plan] &lt; PLAN_RANK[minimum]) {
      return reply.status(402).send({
        error: 'payment_required',
        message: `This endpoint requires the ${minimum} plan or higher.`,
        currentPlan: request.plan,
        upgradeUrl: '/api/billing/checkout',
      });
    }
  };
}
</code></pre>
<p>Then in a pro-only route.</p>
<pre><code class="language-typescript">app.post('/api/exports/csv', {
  preHandler: [app.authenticate, requirePlan('pro')],
  handler: async (request, reply) =&gt; {
    const csv = await generateExport(request.tenantId);
    return reply
      .header('content-type', 'text/csv')
      .send(csv);
  },
});
</code></pre>
<p>I return <code>402 Payment Required</code> deliberately. It's an underused HTTP status that means exactly this: the request is well-formed and authenticated, but your account doesn't have access. Frontend code can branch on 402 specifically and route the user straight to the upgrade page. Way better UX than a generic 403.</p>
<p>The <code>upgradeUrl</code> in the body is a tiny detail that paid for itself. Frontend devs working on this API don't have to remember which endpoint creates a checkout session. The error response tells them. One less thing to look up.</p>
<p><img src="https://images.pexels.com/photos/28740059/pexels-photo-28740059.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="Plan-based access control" />
<sub>Photo by <a href="https://www.pexels.com/@quentin-guiot-1392035088">Quentin Guiot</a> on <a href="https://www.pexels.com/photo/restricted-access-sign-at-open-gate-28740059/">Pexels</a></sub></p>
<h2>Stripe webhooks on Lambda</h2>
<p>Webhooks are the source of truth for subscription state. When a tenant upgrades, downgrades, fails a payment, or cancels, Stripe sends an event to my webhook endpoint. The handler updates <code>hrr_tenants</code> and that's it. Everything downstream reads from the local row.</p>
<p>The first thing that bit me, and I mean really bit me, is that Stripe's signature verification needs the raw request body. Not the parsed JSON. The exact bytes Stripe sent. Fastify's default content-type parser eats the body and hands you a parsed object, which means <code>stripe.webhooks.constructEvent()</code> throws "No signatures found matching the expected signature for payload" no matter what you do.</p>
<p>The fix is registering a custom content-type parser that captures the raw buffer for the webhook route only.</p>
<pre><code class="language-typescript">import Stripe from 'stripe';
import type { FastifyInstance, FastifyRequest } from 'fastify';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

declare module 'fastify' {
  interface FastifyRequest {
    rawBody?: Buffer;
  }
}

export async function registerWebhookRoute(app: FastifyInstance) {
  // Custom parser that keeps the raw buffer alongside the parsed JSON.
  app.addContentTypeParser(
    'application/json',
    { parseAs: 'buffer' },
    (request, body, done) =&gt; {
      (request as FastifyRequest).rawBody = body as Buffer;
      try {
        const json = body.length ? JSON.parse(body.toString('utf8')) : {};
        done(null, json);
      } catch (err) {
        done(err as Error, undefined);
      }
    },
  );

  app.post('/webhooks/stripe', async (request, reply) =&gt; {
    const signature = request.headers['stripe-signature'];
    if (typeof signature !== 'string' || !request.rawBody) {
      return reply.status(400).send({ error: 'missing_signature' });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        request.rawBody,
        signature,
        WEBHOOK_SECRET,
      );
    } catch (err) {
      request.log.warn({ err }, 'webhook signature verification failed');
      return reply.status(400).send({ error: 'invalid_signature' });
    }

    // Idempotency. Insert before processing. If the event was already
    // handled, the unique violation tells us to skip.
    try {
      await app.pg.query(
        `INSERT INTO hrr_billing_events (event_id, type, tenant_id)
         VALUES (\(1, \)2, $3)`,
        [event.id, event.type, extractTenantId(event)],
      );
    } catch (err: any) {
      if (err.code === '23505') {
        // duplicate event, already processed
        return reply.status(200).send({ received: true, deduped: true });
      }
      throw err;
    }

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(app, event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(app, event.data.object as Stripe.Subscription);
        break;
      default:
        request.log.info({ type: event.type }, 'unhandled webhook event');
    }

    return reply.status(200).send({ received: true });
  });
}

function extractTenantId(event: Stripe.Event): string | null {
  const obj = event.data.object as { metadata?: Record&lt;string, string&gt; };
  return obj.metadata?.tenant_id ?? null;
}
</code></pre>
<p>The two handlers do the actual database work.</p>
<pre><code class="language-typescript">const PRICE_TO_PLAN: Record&lt;string, 'starter' | 'pro'&gt; = {
  [process.env.STRIPE_PRICE_STARTER!]: 'starter',
  [process.env.STRIPE_PRICE_PRO!]: 'pro',
};

async function handleSubscriptionChange(
  app: FastifyInstance,
  sub: Stripe.Subscription,
) {
  const priceId = sub.items.data[0]?.price.id;
  const plan = priceId ? PRICE_TO_PLAN[priceId] ?? 'free' : 'free';
  const periodEnd = new Date(sub.current_period_end * 1000);

  await app.pg.query(
    `UPDATE hrr_tenants
     SET plan                   = $1,
         stripe_subscription_id = $2,
         billing_period_end     = $3,
         billing_status         = $4
     WHERE stripe_customer_id   = $5`,
    [plan, sub.id, periodEnd, sub.status, sub.customer],
  );
}

async function handleSubscriptionDeleted(
  app: FastifyInstance,
  sub: Stripe.Subscription,
) {
  await app.pg.query(
    `UPDATE hrr_tenants
     SET plan                   = 'free',
         stripe_subscription_id = NULL,
         billing_period_end     = NULL,
         billing_status         = 'canceled'
     WHERE stripe_customer_id   = $1`,
    [sub.customer],
  );
}
</code></pre>
<p>The webhook route does NOT use the auth plugin. Stripe doesn't send your JWT, it sends a signature header. The signature is the auth. That's why the webhook lives on its own path that the auth plugin's preHandler doesn't apply to. If you accidentally guard the webhook route with <code>app.authenticate</code>, every Stripe event returns 401 and your subscription state goes stale fast.</p>
<p>API Gateway and Lambda Function URLs both work for this. I use a Lambda Function URL because it's simpler and cheaper for a single-purpose endpoint, but make sure your Function URL is configured to NOT buffer or transform the body. <code>AWS_PROXY</code> integration on API Gateway also works. Just verify that binary body passthrough is on.</p>
<p><img src="https://images.pexels.com/photos/7821762/pexels-photo-7821762.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="Stripe webhook handling" />
<sub>Photo by <a href="https://www.pexels.com/@rdne">RDNE Stock project</a> on <a href="https://www.pexels.com/photo/an-alert-message-on-a-cellphone-7821762/">Pexels</a></sub></p>
<h2>Checkout session flow</h2>
<p>When a tenant clicks "Upgrade to Pro" in the dashboard, the frontend calls my API, my API creates a Stripe Checkout Session, and the frontend redirects to the URL Stripe returns. The session knows which tenant it belongs to because the customer ID is already stored on <code>hrr_tenants</code>.</p>
<pre><code class="language-typescript">interface CheckoutBody {
  priceId: string; // e.g. 'price_1Abc...' for the pro tier
}

app.post&lt;{ Body: CheckoutBody }&gt;('/api/billing/checkout', {
  preHandler: [app.authenticate],
  handler: async (request, reply) =&gt; {
    const tenant = await fastify.pg.one&lt;{
      id: string;
      stripe_customer_id: string | null;
    }&gt;(
      `SELECT id, stripe_customer_id
       FROM hrr_tenants
       WHERE id = $1`,
      [request.tenantId],
    );

    if (!tenant.stripe_customer_id) {
      return reply.status(400).send({ error: 'no_stripe_customer' });
    }

    const session = await stripe.checkout.sessions.create(
      {
        mode: 'subscription',
        customer: tenant.stripe_customer_id,
        line_items: [
          { price: request.body.priceId, quantity: 1 },
        ],
        success_url: `${process.env.APP_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.APP_URL}/billing`,
        metadata: { tenant_id: tenant.id },
        subscription_data: {
          metadata: { tenant_id: tenant.id },
        },
      },
      { idempotencyKey: `hrr_checkout_\({tenant.id}_\){Date.now()}` },
    );

    return reply.send({ url: session.url });
  },
});
</code></pre>
<p>A few details worth pointing out. Passing <code>customer: tenant.stripe_customer_id</code> means Stripe doesn't ask the tenant for their email again, doesn't create a new customer, and ties the resulting subscription to the customer I already have. Exactly what I want.</p>
<p>I set <code>metadata.tenant_id</code> at both levels: the checkout session itself and the <code>subscription_data</code>. The session metadata is useful for <code>checkout.session.completed</code> events. The subscription metadata is what shows up on every <code>customer.subscription.updated</code> event, which is what I actually rely on in the webhook handler.</p>
<p>The success URL has <code>{CHECKOUT_SESSION_ID}</code> in it, which Stripe replaces with the real session ID at redirect time. My success page calls a small API endpoint that retrieves the session and shows a "you're now on the Pro plan" confirmation. The actual plan change happens via the webhook, not via the success page. The user could close the tab before hitting success, and the upgrade still needs to complete.</p>
<p><img src="https://images.pexels.com/photos/6214365/pexels-photo-6214365.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="Stripe Checkout session" />
<sub>Photo by <a href="https://www.pexels.com/@n-voitkevich">Nataliya Vaitkevich</a> on <a href="https://www.pexels.com/photo/bank-card-on-gray-laptop-6214365/">Pexels</a></sub></p>
<h2>The billing portal</h2>
<p>Stripe gives you a hosted customer portal for free. Tenants can update their card, see their invoices, cancel their subscription, and switch plans without me writing a single line of UI for any of it. Wiring it up is one API call.</p>
<pre><code class="language-typescript">app.post('/api/billing/portal', {
  preHandler: [app.authenticate],
  handler: async (request, reply) =&gt; {
    const tenant = await fastify.pg.one&lt;{
      stripe_customer_id: string | null;
    }&gt;(
      `SELECT stripe_customer_id
       FROM hrr_tenants
       WHERE id = $1`,
      [request.tenantId],
    );

    if (!tenant.stripe_customer_id) {
      return reply.status(400).send({ error: 'no_stripe_customer' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: tenant.stripe_customer_id,
      return_url: `${process.env.APP_URL}/billing`,
    });

    return reply.send({ url: session.url });
  },
});
</code></pre>
<p>The frontend hits this endpoint, gets a URL back, and redirects. That's it. Configure the portal once in the Stripe dashboard (which products customers can switch to, whether to allow cancellation immediately or at period end, etc.) and it just works.</p>
<p>Every action a tenant takes in the portal fires a webhook. Plan switch fires <code>customer.subscription.updated</code>. Cancel fires <code>customer.subscription.deleted</code> or <code>customer.subscription.updated</code> with <code>cancel_at_period_end: true</code> depending on your portal settings. As long as the webhook handler is solid, the portal is basically a free feature you didn't have to build.</p>
<p><img src="https://images.pexels.com/photos/12935078/pexels-photo-12935078.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="Stripe customer portal" />
<sub>Photo by <a href="https://www.pexels.com/@imin-technology-276315592">iMin Technology</a> on <a href="https://www.pexels.com/photo/touchscreen-to-make-orders-at-restaurant-12935078/">Pexels</a></sub></p>
<h2>Testing webhooks locally</h2>
<p>You can't test webhooks against a localhost endpoint without help. Stripe can't reach your laptop. The Stripe CLI bridges that gap and is by far the fastest local feedback loop I've found.</p>
<pre><code class="language-bash"># Install once
brew install stripe/stripe-cli/stripe

# Log in (opens a browser, pairs your CLI to your Stripe account)
stripe login

# Forward live webhook events to your local Fastify server
stripe listen --forward-to localhost:3000/webhooks/stripe
</code></pre>
<p>When the listener starts, it prints a webhook signing secret. Set that as <code>STRIPE_WEBHOOK_SECRET</code> for your local process. The CLI replays every event your Stripe account sees in real time, against your laptop, with valid signatures. Trigger a checkout session, complete it with a test card, and watch <code>customer.subscription.created</code> land in your handler within seconds.</p>
<p>For deterministic flows there's also <code>stripe trigger</code>.</p>
<pre><code class="language-bash">stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
</code></pre>
<p>These send synthetic events that exercise your handler without you having to click through a checkout flow. Great for testing failure paths.</p>
<p>Test clocks are the other underrated tool. They let you simulate the passage of time on a subscription so you can watch what happens at renewal, when an invoice fails, when a trial ends. The clock is attached to a customer and you can advance it forward by days or months with one API call. If you have any logic that fires on <code>invoice.payment_failed</code> or trial expiration, test clocks are how you exercise it without waiting weeks of real time.</p>
<pre><code class="language-bash"># Create a test clock starting now
stripe test_helpers test_clocks create --frozen-time=$(date +%s)

# Advance one month
stripe test_helpers test_clocks advance \
  --id=clock_xxx \
  --frozen-time=$(date -v +1m +%s)
</code></pre>
<p><img src="https://images.pexels.com/photos/4955393/pexels-photo-4955393.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="Stripe CLI for local development" />
<sub>Photo by <a href="https://www.pexels.com/@godiatima">Godfrey  Atima</a> on <a href="https://www.pexels.com/photo/a-black-flat-screen-monitor-4955393/">Pexels</a></sub></p>
<h2>What I got wrong</h2>
<p>A few things tripped me up before I figured them out. Worth listing so you don't lose the same hours.</p>
<p><strong>The raw body issue with Fastify's JSON parser.</strong> This one kept me up for two hours. The Stripe SDK kept throwing "No signatures found matching the expected signature for payload" and I was 100% sure I had the right webhook secret. The signing secret was right. The header was right. The problem was that Fastify had already parsed the body into an object, and when the SDK serialized that object to verify the signature, the byte-for-byte comparison failed because object key order isn't guaranteed and JSON whitespace was different. Use <code>addContentTypeParser</code> with <code>parseAs: 'buffer'</code> and stash the raw bytes on the request. Then pass those raw bytes to <code>stripe.webhooks.constructEvent</code>. Don't pass <code>request.body</code>. Don't pass <code>JSON.stringify(request.body)</code>. Pass the buffer.</p>
<p><strong>Idempotency on webhook handlers.</strong> Stripe will deliver the same event twice. Sometimes more. Network blips, your handler timing out, Stripe replaying after a deploy, doesn't matter, it happens. Without idempotency you'll process the same upgrade twice, which usually doesn't break anything because the database update is idempotent on its own. But it definitely breaks anything where you charge a credit on plan change, send a "welcome to Pro" email, or write to an analytics pipeline. The <code>hrr_billing_events</code> table with a PRIMARY KEY on <code>event_id</code> is the simplest solution I could come up with. Insert before processing. If the insert fails with a duplicate key, return 200 and skip. Costs nothing, prevents a whole class of weird bugs.</p>
<p><strong>Eager vs lazy customer creation.</strong> I tried lazy creation first because it felt cleaner. Don't call Stripe until the tenant actually needs to upgrade. The annoying part is that "needs to upgrade" is the absolute worst time for a Stripe API call to fail. The user has clicked "Upgrade", they've entered their card, and now my backend has to do two Stripe calls (create customer, create checkout session) before they see Stripe's checkout page. Either of those failing is a terrible upgrade experience. Eager creation moves the only Stripe call to signup, which is way less time-sensitive, and means the upgrade flow is one Stripe call instead of two. Worth the unused customers in Stripe.</p>
<p><strong>Caching plan info per Lambda container.</strong> I started with no cache and hit the database on every authenticated request just to read the plan. Fine until I realized a busy tenant might do 50 requests per second and every single one was doing a redundant primary-key lookup. The 30-second per-container Map cache cut my database load by something like 80% for read traffic. The trade-off is up to 30 seconds of stale plan data after an upgrade, which is invisible to anyone who isn't deliberately watching for it.</p>
<p><strong>Plan changes from the customer portal don't always fire what you expect.</strong> When a tenant downgrades through the portal, you might get <code>customer.subscription.updated</code> with <code>cancel_at_period_end: true</code> instead of <code>customer.subscription.deleted</code>. The subscription doesn't actually end until the period rolls over, at which point you get the <code>deleted</code> event. Handle both. I had a bug for two days where downgrades didn't take effect because I was only listening for <code>deleted</code>. Not my finest debugging hour.</p>
<p><img src="https://images.pexels.com/photos/34803999/pexels-photo-34803999.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="Lessons learned from production" />
<sub>Photo by <a href="https://www.pexels.com/@dkomov">Daniil Komov</a> on <a href="https://www.pexels.com/photo/close-up-of-computer-screen-with-code-display-34803999/">Pexels</a></sub></p>
<h2>Wrapping up</h2>
<p>Stripe billing on Lambda isn't hard, but there are about five things that need to be right or nothing works. Raw bodies for webhook signatures. Idempotency on event handling. Customer creation early so the upgrade path is fast. A local cache for plan reads so you don't hammer your database. Plugin order so billing context is on the request before any handler runs.</p>
<p>Get those right and the rest is glue. The Fastify plugin pattern from the auth post extends naturally to billing. <code>request.tenantId</code> from auth, <code>request.plan</code> from billing, route handlers stay clean.</p>
<p>Hope you enjoyed this walkthrough. If you're building something similar or have questions about any of these patterns, drop a comment below or reach out on Twitter.</p>
<hr />
<p><em>Follow me on <a href="https://x.com/HarunRRayhan">Twitter/X</a> for more posts about AWS, serverless architecture, and building SaaS products.</em></p>
<p><img src="https://images.pexels.com/photos/3912478/pexels-photo-3912478.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="Developer community" />
<sub>Photo by <a href="https://www.pexels.com/@thisisengineering">ThisIsEngineering</a> on <a href="https://www.pexels.com/photo/engineers-designing-app-3912478/">Pexels</a></sub></p>
