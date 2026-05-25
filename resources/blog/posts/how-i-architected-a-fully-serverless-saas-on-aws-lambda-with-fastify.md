---
title: "How I Architected a Fully Serverless SaaS on AWS Lambda with Fastify"
slug: "how-i-architected-a-fully-serverless-saas-on-aws-lambda-with-fastify"
brief: "I recently built a multi-tenant SaaS API from scratch. The product uses AI models under the hood and re-trains them regularly on new data. The requirements were pretty clear: low operational overhead,"
publishedAt: "2026-03-18T14:21:58.913Z"
readTimeInMinutes: 18
reactionCount: 0
responseCount: 0
replyCount: 0
sourceUrl: "https://web.archive.org/web/*/https://blog.harun.dev/how-i-architected-a-fully-serverless-saas-on-aws-lambda-with-fastify"
coverImageUrl: "https://cdn.hashnode.com/uploads/covers/625d48cb9ad0ef10f07bd7b7/3a1040bf-6e2a-4a68-9636-43617715c256.jpg"
tags:
  - name: "AWS"
    slug: "aws"
  - name: "serverless"
    slug: "serverless"
  - name: "Node.js"
    slug: "nodejs"
  - name: "fastify"
    slug: "fastify"
  - name: "Devops"
    slug: "devops"
---
<p>I recently built a multi-tenant SaaS API from scratch. The product uses AI models under the hood and re-trains them regularly on new data. The requirements were pretty clear: low operational overhead, pay-per-use pricing, and it had to scale from zero to thousands of requests. No servers to manage. AWS Lambda was the natural fit.</p>
<p>But here's the thing. Getting a production-grade Fastify app running properly on Lambda is not as simple as the tutorials make it look. There are a lot of moving pieces you need to get right. Especially when your API needs to serve AI model predictions, handle training data pipelines, and still stay cheap when traffic is low.</p>
<p>So in this post, I'm going to walk you through the full architecture. We're talking Fastify on Lambda, PostgreSQL through RDS Proxy, blue-green canary deployments with CodeDeploy, and a dual auth strategy with JWT and API keys. Everything is defined in CloudFormation, and deployments run through GitHub Actions with OIDC. No long-lived AWS credentials anywhere.</p>
<p>All code snippets here are sanitized since the actual project is under NDA. But the patterns are real and running in production right now. Let's get into it.</p>
<p><img src="https://images.pexels.com/photos/34803977/pexels-photo-34803977.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="Developer working on code" />
<sub>Photo by <a href="https://www.pexels.com/@dkomov">Daniil Komov</a> on <a href="https://www.pexels.com/photo/open-laptop-with-coding-on-screen-and-coffee-mug-34803977/">Pexels</a></sub></p>
<h2>Why Fastify on Lambda</h2>
<p>Most serverless tutorials show you one Lambda function per route. That's fine for small projects. But when you have a SaaS API with dozens of endpoints, shared middleware, authentication, and OpenAPI docs, you need a real framework.</p>
<p>I went with <strong>Fastify</strong> over Express. Here's why:</p>
<ol>
<li><p><strong>Performance.</strong> Fastify uses a radix-tree router and schema-based serialization. It's one of the fastest Node.js frameworks out there. On Lambda, every millisecond costs money, so framework overhead actually matters.</p>
</li>
<li><p><strong>Plugin system.</strong> Fastify has this encapsulated plugin architecture that maps really well to SaaS backends. Database connections, auth, API docs, route groups, they all register as independent plugins with explicit dependency ordering.</p>
</li>
<li><p><strong>Lambda support out of the box.</strong> The <code>@fastify/aws-lambda</code> adapter handles converting API Gateway events to HTTP requests and back. The whole app initializes once per Lambda container and gets reused on warm invocations.</p>
</li>
</ol>
<p>Here's what the Lambda handler looks like:</p>
<pre><code class="language-javascript">import awsLambdaFastify from "@fastify/aws-lambda";
import { buildApp } from "./app.js";

let proxy;

export const handler = async (event, context) =&gt; {
  if (!proxy) {
    const app = await buildApp();
    proxy = awsLambdaFastify(app);
  }
  return proxy(event, context);
};
</code></pre>
<p>Notice the module-level <code>proxy</code> variable. Lambda reuses the execution environment between invocations. So the Fastify app initializes on the first cold start and after that, subsequent invocations skip the setup entirely. This one pattern cut my average response time from ~800ms (cold) to ~15ms (warm).</p>
<p><img src="https://images.pexels.com/photos/5480781/pexels-photo-5480781.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="High-performance server technology" />
<sub>Photo by <a href="https://www.pexels.com/@brett-sayles">Brett Sayles</a> on <a href="https://www.pexels.com/photo/server-racks-on-data-center-5480781/">Pexels</a></sub></p>
<h3>App Initialization and Plugin Ordering</h3>
<p>The Fastify app follows a strict initialization order. Plugins declare their dependencies, and Fastify resolves the graph:</p>
<pre><code class="language-javascript">import Fastify from "fastify";
import fastifyPlugin from "fastify-plugin";

export async function buildApp() {
  const app = Fastify({
    logger: {
      serializers: {
        req: (req) =&gt; ({
          method: req.method,
          url: req.url,
          hostname: req.hostname,
          remoteAddress: req.ip,
        }),
        res: (res) =&gt; ({
          statusCode: res.statusCode,
        }),
      },
    },
    trustProxy: true,
    requestIdHeader: "x-request-id",
  });

  // Plugin registration order matters
  await app.register(databasePlugin);    // 1. Database pool
  await app.register(authPlugin);         // 2. Auth (depends on DB)
  await app.register(swaggerPlugin);      // 3. API docs

  // Route registration
  const prefix = `/${process.env.NODE_ENV}`;
  await app.register(healthRoutes, { prefix });
  await app.register(authRoutes, { prefix });
  await app.register(userRoutes, { prefix });
  await app.register(apiKeyRoutes, { prefix });

  // Global error handler
  app.setErrorHandler((error, request, reply) =&gt; {
    request.log.error(error);
    reply.status(error.statusCode || 500).send({
      statusCode: error.statusCode || 500,
      error: error.name,
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  });

  return app;
}
</code></pre>
<p>A few things worth pointing out:</p>
<ul>
<li><strong><code>trustProxy: true</code></strong> is a must when you're behind API Gateway. Without it, Fastify can't resolve the client's real IP address.</li>
<li><strong><code>requestIdHeader</code></strong> gives you distributed tracing. Each request carries a unique ID through CloudWatch logs.</li>
<li>Plugins use <code>fastify-plugin</code> to break Fastify's default encapsulation. That way decorators like <code>fastify.pg</code> and <code>fastify.authenticate</code> are available across all route scopes.</li>
<li>Routes are prefixed with the environment name (<code>/dev</code>, <code>/prod</code>) to match the API Gateway stage path.</li>
</ul>
<p><img src="https://images.pexels.com/photos/34804009/pexels-photo-34804009.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="Code and programming setup" />
<sub>Photo by <a href="https://www.pexels.com/@dkomov">Daniil Komov</a> on <a href="https://www.pexels.com/photo/laptop-with-code-display-and-orange-plush-toy-34804009/">Pexels</a></sub></p>
<h2>Infrastructure as Code with CloudFormation</h2>
<p>Every single piece of infrastructure is defined in CloudFormation YAML templates. I split them into two stacks: <strong>foundation</strong> (networking + database) and <strong>services</strong> (Lambda + API Gateway + deployment pipeline).</p>
<h3>VPC and Network Architecture</h3>
<p>The VPC uses a classic three-tier design across three availability zones:</p>
<pre><code class="language-yaml"># Simplified network.yml
VPC:
  Type: AWS::EC2::VPC
  Properties:
    CidrBlock: "10.42.0.0/16"
    EnableDnsSupport: true
    EnableDnsHostnames: true

# Three tiers of subnets across 3 AZs:
# Public Subnets   - NAT Gateway lives here
# App Subnets      - Lambda functions (private)
# Database Subnets - RDS instances (private)
</code></pre>
<p><strong>Why does this matter for Lambda?</strong> When you attach Lambda functions to a VPC, they need subnets to run in. I put them in private "app" subnets with a route to a NAT Gateway. That way they can still reach AWS services like Secrets Manager and CloudWatch without exposing a public IP. The database subnets are even more locked down. No internet access at all. Only reachable from the app subnets through security group rules.</p>
<p>The security group config is deliberately tight:</p>
<pre><code class="language-yaml">DatabaseSecurityGroup:
  Type: AWS::EC2::SecurityGroup
  Properties:
    GroupDescription: "RDS access from app subnets only"
    SecurityGroupIngress:
      - IpProtocol: tcp
        FromPort: 5432
        ToPort: 5432
        CidrIp: !Ref AppSubnet1CIDR
      - IpProtocol: tcp
        FromPort: 5432
        ToPort: 5432
        CidrIp: !Ref AppSubnet2CIDR
      - IpProtocol: tcp
        FromPort: 5432
        ToPort: 5432
        CidrIp: !Ref AppSubnet3CIDR
</code></pre>
<p>Only traffic from the app subnets on port 5432 can reach the database. Everything else is denied by default.</p>
<p><img src="https://images.pexels.com/photos/2881229/pexels-photo-2881229.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="Cloud network infrastructure architecture" />
<sub>Photo by <a href="https://www.pexels.com/@brett-sayles">Brett Sayles</a> on <a href="https://www.pexels.com/photo/cables-connected-on-server-2881229/">Pexels</a></sub></p>
<h2>Authentication: JWT + API Key Dual Strategy</h2>
<p>My API supports two authentication methods. Both go through a single Fastify preHandler.</p>
<h3>JWT Bearer Tokens</h3>
<p>These are for interactive sessions. A user logs in, gets a token:</p>
<pre><code class="language-javascript">// JWT generation on login
import jwt from "jsonwebtoken";

function generateToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: "24h" }
  );
}
</code></pre>
<h3>API Keys</h3>
<p>These are for programmatic access. Think CI/CD pipelines or third-party integrations. Longer-lived credentials with a custom prefix:</p>
<pre><code class="language-javascript">import crypto from "crypto";

function generateApiKey() {
  const raw = crypto.randomBytes(48).toString("base64url");
  return `hrr_${raw}`; // ~65 chars total
}

function hashApiKey(key) {
  return crypto.createHash("sha256").update(key).digest("hex");
}
</code></pre>
<p>The plaintext key is returned <strong>once</strong> on creation. Only the SHA-256 hash gets stored in the database. On subsequent requests, the key from the Authorization header is hashed and compared against stored hashes.</p>
<h3>The Auth Middleware</h3>
<p>Both methods come together in a single authentication plugin:</p>
<pre><code class="language-javascript">async function authPlugin(fastify) {
  fastify.decorate("authenticate", async (request, reply) =&gt; {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return reply.status(401).send({ message: "Authentication required" });
    }

    if (authHeader.startsWith("Bearer ")) {
      // JWT flow: verify token, load user, check status
      const token = authHeader.slice(7);
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await userRepo.findById(fastify.pg, payload.sub);

      if (!user || user.status !== "active") {
        return reply.status(401).send({ message: "Authentication failed" });
      }
      request.user = user;

    } else if (authHeader.startsWith("ApiKey ")) {
      // API key flow: hash key, lookup credential, check expiry
      const key = authHeader.slice(7);
      const hash = hashApiKey(key);
      const credential = await credentialRepo.findActiveByHash(
        fastify.pg, hash, "api_key"
      );

      if (!credential) {
        return reply.status(401).send({ message: "Authentication failed" });
      }
      request.user = credential.user;

      // Fire-and-forget: update last_used_at without blocking
      credentialRepo.updateLastUsed(fastify.pg, credential.id).catch(() =&gt; {});

    } else {
      return reply.status(401).send({ message: "Authentication failed" });
    }
  });
}
</code></pre>
<p>A few design decisions I want to highlight:</p>
<ul>
<li><strong>Generic 401 responses.</strong> Whether the token is expired, the user is suspended, or the key doesn't exist, the response is always "Authentication failed". This prevents user enumeration attacks.</li>
<li><strong>Fire-and-forget last_used_at.</strong> Updating the API key's last-used timestamp is useful for analytics but it shouldn't add latency to the request. The <code>.catch(() =&gt; {})</code> makes sure a failed update doesn't crash anything.</li>
<li><strong>Single credential table.</strong> Both passwords and API keys live in a <code>user_credentials</code> table with a <code>credential_type</code> column. Keeps things simple and supports multiple credentials per user.</li>
</ul>
<p><img src="https://images.pexels.com/photos/1990764/pexels-photo-1990764.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="Digital security and authentication" />
<sub>Photo by <a href="https://www.pexels.com/@brett-sayles">Brett Sayles</a> on <a href="https://www.pexels.com/photo/black-combination-alarm-system-1990764/">Pexels</a></sub></p>
<h2>Database Layer: PostgreSQL with RDS Proxy</h2>
<p>This is where serverless gets tricky. Every Lambda cold start creates a new database connection. Under load, hundreds of Lambda instances can spin up at the same time, each opening its own connection to PostgreSQL. You'll hit the <code>max_connections</code> limit fast.</p>
<p><strong>RDS Proxy</strong> fixes this. It sits between Lambda and RDS, keeps a warm pool of database connections, and multiplexes Lambda requests across them.</p>
<pre><code class="language-yaml"># CloudFormation: RDS Proxy configuration
RDSProxy:
  Type: AWS::RDS::DBProxy
  Properties:
    DBProxyName: !Sub "\({ProjectName}-\){Environment}-proxy"
    EngineFamily: POSTGRESQL
    RequireTLS: true
    IdleClientTimeout: 1800
    Auth:
      - AuthScheme: SECRETS
        SecretArn: !Ref DatabaseSecret
        IAMAuth: DISABLED
    VpcSubnetIds:
      - !Ref DatabaseSubnet1
      - !Ref DatabaseSubnet2
      - !Ref DatabaseSubnet3

RDSProxyTargetGroup:
  Type: AWS::RDS::DBProxyTargetGroup
  Properties:
    DBProxyName: !Ref RDSProxy
    TargetGroupName: default
    ConnectionPoolConfigurationInfo:
      MaxConnectionsPercent: 100
      MaxIdleConnectionsPercent: 50
      ConnectionBorrowTimeout: 120
</code></pre>
<p>On the app side, the database plugin creates a <code>pg</code> connection pool that points to the RDS Proxy endpoint:</p>
<pre><code class="language-javascript">import pg from "pg";
import { getDbCredentials } from "../config/database.js";

async function databasePlugin(fastify) {
  const credentials = await getDbCredentials();

  const pool = new pg.Pool({
    host: process.env.DB_HOST,     // RDS Proxy endpoint
    port: parseInt(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: credentials.username,
    password: credentials.password,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    ssl: { rejectUnauthorized: true },
  });

  // Verify connectivity on startup
  const client = await pool.connect();
  client.release();

  fastify.decorate("pg", pool);
  fastify.addHook("onClose", () =&gt; pool.end());
}
</code></pre>
<h3>Credentials from Secrets Manager</h3>
<p>Database credentials are auto-generated by CloudFormation and stored in AWS Secrets Manager. The Lambda function fetches them once on cold start and caches them:</p>
<pre><code class="language-javascript">import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

const smClient = new SecretsManagerClient();
let cachedCredentials = null;

export async function getDbCredentials() {
  if (cachedCredentials) return cachedCredentials;

  const response = await smClient.send(
    new GetSecretValueCommand({ SecretId: process.env.DB_SECRET_ARN })
  );

  cachedCredentials = JSON.parse(response.SecretString);
  return cachedCredentials;
}
</code></pre>
<p>This is a pattern I use everywhere: fetch once, cache for the lifetime of the Lambda container. The container might live for minutes or hours, but credentials only get fetched once. It's essential for keeping cold start latency low.</p>
<p><img src="https://images.pexels.com/photos/17323801/pexels-photo-17323801.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="Database infrastructure and data management" />
<sub>Photo by <a href="https://www.pexels.com/@cookiecutter">panumas nikhomkhai</a> on <a href="https://www.pexels.com/photo/network-rack-17323801/">Pexels</a></sub></p>
<h2>CI/CD: GitHub Actions with OIDC and Blue-Green Deployments</h2>
<p>The deployment pipeline is honestly the part I'm most proud of. Zero long-lived credentials. Automatic canary deployments. And rollback on failure.</p>
<h3>GitHub OIDC Authentication</h3>
<p>Storing AWS access keys in GitHub Secrets is a security anti-pattern. Instead, I set up <strong>OIDC federation</strong>. GitHub's Actions runner generates a signed JWT, and AWS exchanges it for temporary credentials:</p>
<pre><code class="language-yaml"># CloudFormation: GitHub OIDC provider
GitHubOIDCProvider:
  Type: AWS::IAM::OIDCProvider
  Properties:
    Url: "https://token.actions.githubusercontent.com"
    ClientIdList:
      - "sts.amazonaws.com"

DeployRole:
  Type: AWS::IAM::Role
  Properties:
    AssumeRolePolicyDocument:
      Statement:
        - Effect: Allow
          Principal:
            Federated: !Ref GitHubOIDCProvider
          Action: "sts:AssumeRoleWithWebIdentity"
          Condition:
            StringEquals:
              "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
            StringLike:
              "token.actions.githubusercontent.com:sub":
                "repo:my-org/my-repo:*"
</code></pre>
<p>That <code>Condition</code> block is super important. It restricts which GitHub repos and branches can assume the deploy role. Without it, any GitHub Actions workflow could assume your AWS role. That would be bad.</p>
<h3>The Deployment Workflow</h3>
<pre><code class="language-yaml"># .github/workflows/deploy.yml (simplified)
name: Deploy
on:
  push:
    branches: [main]

permissions:
  id-token: write
  contents: read

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: dev
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_DEPLOY_ROLE_ARN }}
          aws-region: us-east-2

      - run: npm ci --omit=dev --silent

      # Package and upload
      - name: Deploy Lambda
        run: |
          zip -r function.zip . -x "*.test.*"
          aws lambda update-function-code \
            --function-name ${{ env.FUNCTION_NAME }} \
            --zip-file fileb://function.zip
          aws lambda wait function-updated \
            --function-name ${{ env.FUNCTION_NAME }}

      # Publish immutable version
      - name: Publish Version
        run: |
          VERSION=$(aws lambda publish-version \
            --function-name ${{ env.FUNCTION_NAME }} \
            --description "SHA: ${{ github.sha }}" \
            --query 'Version' --output text)
          echo "NEW_VERSION=\(VERSION" &gt;&gt; \)GITHUB_ENV

      # Blue-green: update alias to new version
      - name: Update Alias
        run: |
          aws lambda update-alias \
            --function-name ${{ env.FUNCTION_NAME }} \
            --name live \
            --function-version ${{ env.NEW_VERSION }}
</code></pre>
<h3>Blue-Green with CodeDeploy Canary</h3>
<p>Now here's where it gets really cool. The CodeDeploy configuration:</p>
<pre><code class="language-yaml">DeploymentConfig: LambdaCanary10Percent5Minutes
</code></pre>
<p>What this does:</p>
<ol>
<li><strong>10% of traffic</strong> goes to the new version for 5 minutes</li>
<li>A CloudWatch alarm watches the <code>Errors</code> metric on the Lambda alias</li>
<li>If <strong>3 or more errors</strong> happen in 60 seconds, CodeDeploy automatically <strong>rolls back</strong> to the previous version</li>
<li>If the alarm stays green, traffic shifts to <strong>100%</strong> on the new version</li>
</ol>
<pre><code class="language-yaml"># CloudWatch alarm for automatic rollback
DeploymentAlarm:
  Type: AWS::CloudWatch::Alarm
  Properties:
    MetricName: Errors
    Namespace: AWS/Lambda
    Dimensions:
      - Name: FunctionName
        Value: !Ref ApiFunction
      - Name: Resource
        Value: !Sub "${ApiFunction}:live"
    Statistic: Sum
    Period: 60
    EvaluationPeriods: 1
    Threshold: 3
    ComparisonOperator: GreaterThanOrEqualToThreshold
</code></pre>
<p>I love this setup. I can push to <code>main</code> with confidence knowing that bad deployments get caught within minutes. And rollback is automatic.</p>
<p><img src="https://images.pexels.com/photos/18784617/pexels-photo-18784617.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="CI/CD deployment pipeline" />
<sub>Photo by <a href="https://www.pexels.com/@wolfgang-weiser-467045605">Wolfgang Weiser</a> on <a href="https://www.pexels.com/photo/view-of-pipelines-in-a-forest-18784617/">Pexels</a></sub></p>
<h2>API Documentation with OpenAPI and Swagger</h2>
<p>If you've ever maintained a separate OpenAPI spec file by hand, you know it's always out of date. Fastify solves this nicely.</p>
<p>You define JSON schemas on your route handlers, and <code>@fastify/swagger</code> generates a complete OpenAPI 3.0 spec from them automatically. The schema IS the documentation. No drift.</p>
<pre><code class="language-javascript">import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";

async function swaggerPlugin(fastify) {
  await fastify.register(fastifySwagger, {
    openapi: {
      info: {
        title: "SaaS API",
        version: "1.0.0",
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
          apiKeyAuth: {
            type: "apiKey",
            in: "header",
            name: "Authorization",
          },
        },
      },
    },
  });

  await fastify.register(fastifySwaggerUi, {
    routePrefix: `/${process.env.NODE_ENV}/docs`,
    uiConfig: {
      docExpansion: "list",
      deepLinking: true,
    },
  });
}
</code></pre>
<p>Then each route defines its schema inline:</p>
<pre><code class="language-javascript">app.post("/auth/login", {
  schema: {
    tags: ["Auth"],
    body: {
      type: "object",
      required: ["email", "password"],
      properties: {
        email: { type: "string", format: "email" },
        password: { type: "string", minLength: 8 },
      },
    },
    response: {
      200: {
        type: "object",
        properties: {
          token: { type: "string" },
          user: {
            type: "object",
            properties: {
              id: { type: "integer" },
              email: { type: "string" },
              name: { type: "string" },
            },
          },
        },
      },
    },
  },
  handler: loginHandler,
});
</code></pre>
<p>Fastify uses these schemas for <strong>three things at once</strong>: input validation (rejects malformed requests before your handler runs), response serialization (strips unexpected fields), and OpenAPI spec generation. One schema, three benefits.</p>
<p>The Swagger UI is served at <code>/{environment}/docs</code> and works in every deployed environment. Super useful for QA and integration testing.</p>
<p><img src="https://images.pexels.com/photos/10816120/pexels-photo-10816120.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="API documentation and code" />
<sub>Photo by <a href="https://www.pexels.com/@technobulka">Stanislav Kondratiev</a> on <a href="https://www.pexels.com/photo/screen-with-code-10816120/">Pexels</a></sub></p>
<h2>Lessons Learned</h2>
<p>After running this architecture in production for a while, here are the things I'd tell myself if I was starting over.</p>
<h3>1. Cold Starts Are Manageable</h3>
<p>With a VPC-attached Lambda running Node.js 20, my cold starts averaged <strong>800-1200ms</strong>. Here's where that time goes:</p>
<ul>
<li>ENI attachment for VPC networking (~300ms)</li>
<li>Secrets Manager fetch (~200ms)</li>
<li>Fastify initialization + plugin registration (~150ms)</li>
</ul>
<p>Warm invocations consistently ran under <strong>20ms</strong> though. For a B2B SaaS API where the first request of the day might be slow, this was totally fine. If you need faster cold starts, look into provisioned concurrency.</p>
<h3>2. I Chose CloudFormation Over CDK</h3>
<p>And I'd do it again. Here's why:</p>
<ul>
<li><strong>Transparency.</strong> Every resource, every property is right there in the template. No abstractions hiding default security groups or IAM policies from you.</li>
<li><strong>Debugging.</strong> When a deployment fails, you just read the template. With CDK, you're reading synthesized CloudFormation that was generated by TypeScript that generated CloudFormation. It's abstractions all the way down.</li>
<li><strong>Onboarding.</strong> A new developer can read a <code>.yml</code> file and understand what's deployed. CDK requires knowing both the construct library and the underlying CloudFormation.</li>
</ul>
<p>The tradeoff is verbosity. My <code>database.yml</code> template is 400+ lines. But I'd rather have verbose and explicit than concise and magical.</p>
<h3>3. RDS Proxy Is Non-Negotiable</h3>
<p>I cannot stress this enough. Without RDS Proxy, my first load test hit the database's <code>max_connections</code> limit within seconds. Each Lambda container opens its own connection. Under burst traffic, hundreds of containers spin up at once.</p>
<p>RDS Proxy multiplexes these connections. And the <code>ConnectionBorrowTimeout: 120</code> setting gives new Lambda instances time to wait for an available connection instead of failing immediately.</p>
<h3>4. Invest in Monitoring Early</h3>
<p>The most valuable things I added were:</p>
<ul>
<li><strong>Structured JSON logging.</strong> Fastify's built-in logger with custom serializers makes logs actually searchable in CloudWatch.</li>
<li><strong>Request ID correlation.</strong> Every log line includes the request ID. Makes it trivial to trace a single request through the whole call stack.</li>
<li><strong>Health check tiers.</strong> <code>/live</code> (is the process running?), <code>/ready</code> (can it serve traffic?), and <code>/health/db</code> (is the database reachable?). Each serves a different monitoring need.</li>
</ul>
<h3>5. The Cost Breakdown</h3>
<p>For a low-to-moderate traffic SaaS API (~50K requests/day):</p>
<ul>
<li><strong>Lambda</strong>: ~$3/month (512MB, avg 50ms execution)</li>
<li><strong>API Gateway</strong>: ~$5/month (HTTP API pricing)</li>
<li><strong>RDS</strong> (db.t3.micro): ~$15/month</li>
<li><strong>RDS Proxy</strong>: ~$20/month</li>
<li><strong>NAT Gateway</strong>: ~$35/month (the silent budget killer)</li>
<li><strong>Secrets Manager</strong>: ~$0.40/month</li>
</ul>
<p><strong>Total: ~$78/month.</strong> And it scales to 10x the traffic without any architectural changes.</p>
<p>NAT Gateway is by far the most expensive component relative to the actual traffic. For side projects, consider using VPC endpoints for Secrets Manager and CloudWatch to skip the NAT Gateway entirely.</p>
<p><img src="https://images.pexels.com/photos/7964028/pexels-photo-7964028.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="Lessons learned and planning" />
<sub>Photo by <a href="https://www.pexels.com/@roxanne-minnish-2936023">Roxanne Minnish</a> on <a href="https://www.pexels.com/photo/a-man-writing-on-whiteboard-7964028/">Pexels</a></sub></p>
<h2>Why This Architecture Is Perfect for AI Products</h2>
<p>The project I built with this architecture actually uses AI models. The system re-trains models regularly on new incoming data and serves predictions through the API. So this isn't just a theoretical "you could use it for AI" thing. I'm running it for AI workloads in production right now.</p>
<p>Here's why this setup works so well for AI products specifically.</p>
<p>Most AI startups and indie hackers have the same problem. You build something cool with an LLM or a custom model, ship an MVP, and then traffic is completely unpredictable. Some days you get 50 requests. Other days a tweet goes viral and you get 50,000. Traditional servers mean you're either overpaying for capacity you don't use or scrambling to scale when things blow up.</p>
<p>With this serverless setup, you pay for what you use. At $78/month for 50K requests/day, you can run your AI SaaS backend for less than what most people spend on coffee. And when your product hits the front page of Hacker News, Lambda just scales. No panic. No midnight capacity planning. It handles the spike and scales back down when traffic drops.</p>
<p>For my project, the API handles both real-time predictions and stores training data that feeds back into the model re-training pipeline. The PostgreSQL database through RDS Proxy stores the training data, and separate batch jobs pick it up for model updates. The API itself stays lightweight and fast because it's only doing inference and data collection, not the heavy training work.</p>
<p>This matters for AI products because:</p>
<ul>
<li><strong>Bursty traffic patterns.</strong> AI apps see huge spikes when users share outputs on social media. Lambda handles this without breaking a sweat.</li>
<li><strong>Low upfront cost.</strong> You don't need expensive servers before you've validated your idea. Start at near-zero and grow with your users.</li>
<li><strong>Training data collection.</strong> Your API collects user interactions that improve your models over time. PostgreSQL + RDS Proxy handles this reliably.</li>
<li><strong>API-first architecture.</strong> Most AI products need a solid API for their web app, mobile app, and integrations. Fastify + Lambda gives you that with OpenAPI docs built in.</li>
<li><strong>Focus on what matters.</strong> You should be spending time on your AI models and user experience, not babysitting servers.</li>
</ul>
<p>I've seen people vibe code entire AI SaaS products in a weekend using tools like Cursor and Claude. The backend is often the bottleneck because setting up something production-ready feels overwhelming. This architecture solves that. Clone the patterns from this post, wire up your AI endpoints, and you have a backend that handles 10 users or 100,000 users without changing any infrastructure code.</p>
<p>The pay-per-use model also makes it easy to experiment. Want to add a new AI feature? Deploy it. If nobody uses it, it costs you nothing. Try doing that with a $200/month dedicated server.</p>
<p><img src="https://images.pexels.com/photos/8849295/pexels-photo-8849295.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="AI technology and startup innovation" />
<sub>Photo by <a href="https://www.pexels.com/@tara-winstead">Tara Winstead</a> on <a href="https://www.pexels.com/photo/an-artificial-intelligence-illustration-on-the-wall-8849295/">Pexels</a></sub></p>
<h2>Conclusion</h2>
<p>Building a serverless SaaS on AWS Lambda with Fastify absolutely works for production. The trick is treating Lambda as a real compute platform, not just a "function-as-a-service" toy.</p>
<p>If I were starting over, I'd change two things:</p>
<ol>
<li><strong>Use VPC endpoints</strong> instead of a NAT Gateway to cut the monthly cost by ~40%</li>
<li><strong>Add provisioned concurrency</strong> for the critical auth endpoints to kill cold start latency</li>
</ol>
<p>Everything else? The plugin architecture, the dual auth strategy, the blue-green deployments. I'd do it all the same way.</p>
<p>The serverless tax is real. Cold starts, connection pooling complexity, CloudFormation verbosity. But the operational simplicity makes it worth it. No patching servers. No capacity planning. No 3 AM pages because an EC2 instance ran out of disk space. Just push to main and the pipeline handles the rest.</p>
<p>Hope you enjoyed this deep dive. If you have questions about any part of this architecture, feel free to ask in the comments.</p>
<hr />
<p><em>Don't forget to follow me on <a href="https://x.com/HarunRRayhan">Twitter/X</a>, I regularly tweet about AWS, DevOps, and various other Software Engineering topics.</em></p>
<p><img src="https://images.pexels.com/photos/1181316/pexels-photo-1181316.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="Cloud computing and serverless technology" />
<sub>Photo by <a href="https://www.pexels.com/@divinetechygirl">Christina Morillo</a> on <a href="https://www.pexels.com/photo/engineer-holding-laptop-1181316/">Pexels</a></sub></p>
