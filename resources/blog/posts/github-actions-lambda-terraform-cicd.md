---
title: "How I Set Up CI/CD for AWS Lambda and Terraform with GitHub Actions"
slug: "github-actions-lambda-terraform-cicd"
brief: "For years I deployed Lambda functions by zipping the dist folder on my laptop and running aws lambda update-function-code from a terminal. It worked. It also failed at 11pm on a Friday when I forgot t"
publishedAt: "2026-04-18T17:16:49.891Z"
readTimeInMinutes: 19
reactionCount: 0
responseCount: 0
replyCount: 0
sourceUrl: "https://web.archive.org/web/*/https://blog.harun.dev/github-actions-lambda-terraform-cicd"
coverImageUrl: "/blog-assets/github-actions-lambda-terraform-cicd/cover.jpg"
tags:
  - name: "AWS"
    slug: "aws"
  - name: "Terraform"
    slug: "terraform"
  - name: "GitHub Actions"
    slug: "github-actions"
  - name: "Devops"
    slug: "devops"
  - name: "serverless"
    slug: "serverless"
---
<p>For years I deployed Lambda functions by zipping the dist folder on my laptop and running <code>aws lambda update-function-code</code> from a terminal. It worked. It also failed at 11pm on a Friday when I forgot to check which AWS profile was active and pushed staging code straight to production.</p>
<p>That was the night I stopped trusting myself with manual deploys.</p>
<p>So I rebuilt the pipeline from scratch. Terraform owns the infrastructure. GitHub Actions runs every plan and apply. AWS sees a short-lived OIDC token instead of some access key sitting in a repo secret forever. Pull requests get a Terraform plan posted as a comment. Merging to main deploys staging automatically. Production needs a human to click approve.</p>
<p>This post is the whole thing end to end: repo layout, the OIDC trust between GitHub and AWS, S3 remote state with DynamoDB locking, the deploy workflow, how Lambda code gets packaged, environment promotion with manual approval, and what I do when something bad still slips through.</p>
<p>It all runs in production right now. Names are sanitized, patterns are real.</p>
<p><img src="https://images.pexels.com/photos/18784617/pexels-photo-18784617.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="Automated deployment pipeline" />
<sub>Photo by <a href="https://www.pexels.com/@wolfgang-weiser-467045605">Wolfgang Weiser</a> on <a href="https://www.pexels.com/photo/view-of-pipelines-in-a-forest-18784617/">Pexels</a></sub></p>
<h2>The repo structure</h2>
<p>The repo has three concerns. Terraform for infrastructure, TypeScript handlers for Lambda, and the workflow files that glue the two together.</p>
<pre><code>hrr-api/
├── .github/
│   └── workflows/
│       ├── plan.yml          # PR trigger, runs terraform plan
│       ├── deploy.yml        # main trigger, applies + deploys code
│       └── rollback.yml      # manual workflow_dispatch
├── infra/
│   ├── backend.tf            # S3 + DynamoDB backend config
│   ├── providers.tf          # aws provider, region, default tags
│   ├── oidc.tf               # GitHub OIDC provider + IAM role
│   ├── lambda.tf             # function, alias, log group, IAM
│   ├── api_gateway.tf        # HTTP API + routes
│   ├── variables.tf
│   ├── outputs.tf
│   └── envs/
│       ├── staging.tfvars
│       └── prod.tfvars
├── src/
│   ├── handlers/
│   │   ├── events.ts
│   │   └── webhook.ts
│   └── lib/
│       └── db.ts
├── package.json
├── tsconfig.json
└── esbuild.config.mjs
</code></pre>
<p>Two decisions in there that are worth explaining.</p>
<p>Staging and production both live in the same Terraform root, parameterized through <code>.tfvars</code> files. Same code path, different variables. Promoting a change means running the same plan against a different state key, instead of maintaining two copies of the config that slowly drift apart. I have watched that drift happen on older projects and it is miserable to untangle.</p>
<p>The Lambda source sits outside <code>infra/</code> because the build artifact is environment-agnostic. One bundle, multiple deploy targets. Terraform points at the zip in S3 by key, and the deploy step uploads a new zip with a content-addressed name on every push.</p>
<p>Workflow files split by purpose. The plan workflow runs on pull requests and never touches anything. The deploy workflow runs on merge to main. The rollback workflow is a manual trigger you fire from the GitHub UI when something is on fire.</p>
<p><img src="https://images.pexels.com/photos/34803968/pexels-photo-34803968.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="Repository folder layout" />
<sub>Photo by <a href="https://www.pexels.com/@dkomov">Daniil Komov</a> on <a href="https://www.pexels.com/photo/programming-code-editors-on-computer-screen-34803968/">Pexels</a></sub></p>
<h2>GitHub OIDC with AWS (no long-lived keys)</h2>
<p>Most legacy pipelines I have inherited get this part wrong. They stash an <code>AWS_ACCESS_KEY_ID</code> and <code>AWS_SECRET_ACCESS_KEY</code> in GitHub secrets, the keys live forever, and one accidentally echoed log line is enough to compromise the whole account. I genuinely dislike having static AWS keys anywhere near a CI runner.</p>
<p>GitHub OIDC fixes it. Your workflow asks GitHub for a short-lived JWT, AWS verifies the JWT against a configured trust, and you get temporary credentials that expire in an hour. No static keys anywhere.</p>
<p>Setup is a one-time Terraform pass. First the OIDC provider.</p>
<pre><code class="language-hcl"># infra/oidc.tf

resource "aws_iam_openid_connect_provider" "hrr_github" {
  url            = "https://token.actions.githubusercontent.com"
  client_id_list = ["sts.amazonaws.com"]

  thumbprint_list = [
    "6938fd4d98bab03faadb97b34396831e3780aea1",
    "1c58a3a8518e8759bf075b76b750d4f2df264fcd",
  ]
}
</code></pre>
<p>The two thumbprints are the current GitHub Actions OIDC certificates. AWS also accepts the provider without thumbprints now because it validates the JWKS automatically, but I keep them pinned so the resource is explicit.</p>
<p>Then the IAM role that GitHub Actions assumes.</p>
<pre><code class="language-hcl"># infra/oidc.tf (continued)

variable "hrr_github_repo" {
  description = "owner/repo allowed to assume the deploy role"
  type        = string
}

data "aws_iam_policy_document" "hrr_github_trust" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.hrr_github.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values = [
        "repo:${var.hrr_github_repo}:ref:refs/heads/main",
        "repo:${var.hrr_github_repo}:pull_request",
        "repo:${var.hrr_github_repo}:environment:staging",
        "repo:${var.hrr_github_repo}:environment:prod",
      ]
    }
  }
}

resource "aws_iam_role" "hrr_github_deploy" {
  name               = "hrr-github-deploy"
  assume_role_policy = data.aws_iam_policy_document.hrr_github_trust.json
}

resource "aws_iam_role_policy_attachment" "hrr_github_deploy_power" {
  role       = aws_iam_role.hrr_github_deploy.name
  policy_arn = aws_iam_policy.hrr_deploy_permissions.arn
}
</code></pre>
<p>The <code>sub</code> condition is the security boundary. It says: only GitHub Actions runs from this exact repository, on the main branch, on pull requests, or inside the staging/prod environments are allowed to assume the role. A workflow in a different repo cannot get credentials, even if it somehow knows the role ARN.</p>
<p>If you want to scope by tag or other filters, the OIDC sub claim supports more granular patterns. The GitHub docs page on OIDC has the full list. For most setups, the four patterns above are plenty.</p>
<p>The permission policy attached to the role is a separate document tuned to what your pipeline actually touches. In my case that is Lambda, IAM passrole for the Lambda execution role, S3 for the artifact bucket, CloudWatch Logs, API Gateway, and DynamoDB for the state lock. Resist the urge to slap <code>AdministratorAccess</code> on it. Spend the hour writing a least-privilege policy. Future you will thank present you.</p>
<p><img src="https://images.pexels.com/photos/8832727/pexels-photo-8832727.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="OIDC trust and federated identity" />
<sub>Photo by <a href="https://www.pexels.com/@cottonbro-cg-studio">cottonbro CG studio</a> on <a href="https://www.pexels.com/photo/a-3d-illustration-of-a-handshake-8832727/">Pexels</a></sub></p>
<h2>Terraform remote state with locking</h2>
<p>Local Terraform state on a dev laptop is fine for a weekend project. For a team or a CI pipeline, you need remote state with a lock, otherwise two parallel <code>terraform apply</code> runs will race each other and corrupt the state file. I have seen this happen exactly once and it took an afternoon to untangle.</p>
<p>S3 holds the state. DynamoDB handles the lock.</p>
<pre><code class="language-hcl"># infra/backend.tf

terraform {
  required_version = "&gt;= 1.6.0"

  backend "s3" {
    bucket         = "hrr-tf-state"
    key            = "api/terraform.tfstate"
    region         = "eu-west-1"
    dynamodb_table = "hrr-tf-locks"
    encrypt        = true
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~&gt; 5.40"
    }
  }
}
</code></pre>
<p>The S3 bucket and DynamoDB table have to exist before <code>terraform init</code> runs. I bootstrap them once with a tiny separate Terraform module that lives in a <code>bootstrap/</code> directory and is never touched again.</p>
<pre><code class="language-hcl"># bootstrap/main.tf

resource "aws_s3_bucket" "hrr_tf_state" {
  bucket = "hrr-tf-state"
}

resource "aws_s3_bucket_versioning" "hrr_tf_state" {
  bucket = aws_s3_bucket.hrr_tf_state.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "hrr_tf_state" {
  bucket = aws_s3_bucket.hrr_tf_state.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "hrr_tf_state" {
  bucket                  = aws_s3_bucket.hrr_tf_state.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_dynamodb_table" "hrr_tf_locks" {
  name         = "hrr-tf-locks"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }
}
</code></pre>
<p>Versioning on the state bucket matters more than people realize. If something corrupts the state file, you can roll back to the previous object version and recover. Without versioning, a bad state push is gone for good.</p>
<p>DynamoDB on-demand is the right billing mode here. State locks are infrequent, so on-demand costs basically nothing. Provisioned capacity would burn money sitting idle.</p>
<p>Workspaces or separate state keys are both valid for staging vs prod. I use separate state keys (<code>api/staging/terraform.tfstate</code> and <code>api/prod/terraform.tfstate</code>) passed via <code>-backend-config</code> at init time. Workspaces and the data sources you build on top of them get awkward fast, and I would rather be explicit.</p>
<p><img src="https://images.pexels.com/photos/5480781/pexels-photo-5480781.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="Cloud state storage and locking" />
<sub>Photo by <a href="https://www.pexels.com/@brett-sayles">Brett Sayles</a> on <a href="https://www.pexels.com/photo/server-racks-on-data-center-5480781/">Pexels</a></sub></p>
<h2>The deploy workflow</h2>
<p>This runs on every push to main. It applies infrastructure changes and ships new Lambda code.</p>
<pre><code class="language-yaml"># .github/workflows/deploy.yml

name: deploy

on:
  push:
    branches: [main]

permissions:
  id-token: write   # required for OIDC
  contents: read

concurrency:
  group: deploy-${{ github.ref }}
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    outputs:
      artifact_key: ${{ steps.pack.outputs.key }}
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci

      - name: Bundle handlers
        run: npm run build

      - name: Package zip
        id: pack
        run: |
          cd dist
          zip -qr ../lambda.zip .
          cd ..
          KEY="lambda/${GITHUB_SHA}.zip"
          echo "key=\(KEY" &gt;&gt; "\)GITHUB_OUTPUT"

      - uses: actions/upload-artifact@v4
        with:
          name: lambda-bundle
          path: lambda.zip
          retention-days: 7

  deploy_staging:
    needs: build
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v4

      - uses: actions/download-artifact@v4
        with:
          name: lambda-bundle

      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::111111111111:role/hrr-github-deploy
          aws-region: eu-west-1

      - name: Upload artifact to S3
        run: |
          aws s3 cp lambda.zip \
            "s3://hrr-artifacts/${{ needs.build.outputs.artifact_key }}"

      - uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: 1.7.5

      - name: Terraform init (staging)
        working-directory: infra
        run: |
          terraform init \
            -backend-config="key=api/staging/terraform.tfstate"

      - name: Terraform apply (staging)
        working-directory: infra
        run: |
          terraform apply -auto-approve \
            -var-file=envs/staging.tfvars \
            -var="lambda_artifact_key=${{ needs.build.outputs.artifact_key }}"

      - name: Smoke test
        run: |
          curl -fsS https://staging-api.hrr.dev/health

  deploy_prod:
    needs: deploy_staging
    runs-on: ubuntu-latest
    environment: prod
    steps:
      - uses: actions/checkout@v4

      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::222222222222:role/hrr-github-deploy
          aws-region: eu-west-1

      - uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: 1.7.5

      - name: Terraform init (prod)
        working-directory: infra
        run: |
          terraform init \
            -backend-config="key=api/prod/terraform.tfstate"

      - name: Terraform apply (prod)
        working-directory: infra
        run: |
          terraform apply -auto-approve \
            -var-file=envs/prod.tfvars \
            -var="lambda_artifact_key=${{ needs.build.outputs.artifact_key }}"

      - name: Smoke test
        run: |
          curl -fsS https://api.hrr.dev/health
</code></pre>
<p>Some bits in that YAML worth calling out.</p>
<p>The <code>permissions</code> block at the top is mandatory for OIDC. Without <code>id-token: write</code>, GitHub will not mint a token and the AWS credentials step fails on the first run with a fairly cryptic error. Setting <code>contents: read</code> keeps the token scoped to the minimum the workflow needs.</p>
<p>The <code>concurrency</code> group stops two deploys from racing on the same branch. Push twice in 30 seconds and the second push waits for the first to finish. Set <code>cancel-in-progress: false</code> so a partial apply finishes before the next one starts. Cancelling halfway through a Terraform apply is a great way to end up with broken state, and yes, I learned that the hard way.</p>
<p>The artifact key uses the commit SHA. Every deploy gets a unique S3 object, so rolling back is just pointing the Lambda at an older key. More on that in a minute.</p>
<p>There is also a separate <code>plan.yml</code> workflow for pull requests. It runs <code>terraform plan</code> and posts the output as a PR comment so reviewers can see exactly what infrastructure will change before merging. I use <code>tfcmt</code> for the comment formatting because the raw plan output is too noisy for a PR review.</p>
<p><img src="https://images.pexels.com/photos/11035479/pexels-photo-11035479.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="GitHub Actions deployment workflow" />
<sub>Photo by <a href="https://www.pexels.com/@realtoughcandy">RealToughCandy.com</a> on <a href="https://www.pexels.com/photo/jenkins-logo-sticker-11035479/">Pexels</a></sub></p>
<h2>Lambda code packaging</h2>
<p>Node.js Lambda packaging has a few sharp edges. You want a small zip, no dev dependencies, and your bundler should resolve everything ahead of time so cold starts do not pay for module resolution.</p>
<p>I use esbuild. One bundle per handler, externalize <code>@aws-sdk/*</code> because the runtime already provides it, target Node 20.</p>
<pre><code class="language-javascript">// esbuild.config.mjs

import { build } from 'esbuild';
import { readdirSync } from 'fs';

const handlers = readdirSync('src/handlers').filter((f) =&gt;
  f.endsWith('.ts')
);

await build({
  entryPoints: handlers.map((h) =&gt; `src/handlers/${h}`),
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  outdir: 'dist',
  outExtension: { '.js': '.mjs' },
  external: ['@aws-sdk/*'],
  minify: true,
  sourcemap: 'linked',
  banner: {
    js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
  },
});

console.log(`Bundled ${handlers.length} handlers`);
</code></pre>
<p>The <code>createRequire</code> banner is the workaround for any CommonJS dependency that sneaks into an ESM bundle. Without it, things like <code>pg</code> blow up at runtime because they expect <code>require</code> to exist. The error message when this happens is not obvious, so keep the banner in even if you think you do not need it yet.</p>
<p>Externalizing <code>@aws-sdk/*</code> cuts the bundle size dramatically. The AWS SDK v3 is huge, and the Node 20 Lambda runtime ships it for you. Bundling your own copy just makes cold starts slower for no reason.</p>
<p>The Terraform side references the artifact key as a variable.</p>
<pre><code class="language-hcl"># infra/lambda.tf

variable "lambda_artifact_key" {
  description = "S3 key for the lambda zip, e.g. lambda/&lt;sha&gt;.zip"
  type        = string
}

resource "aws_lambda_function" "hrr_api" {
  function_name = "hrr-api"
  role          = aws_iam_role.hrr_lambda_exec.arn
  s3_bucket     = "hrr-artifacts"
  s3_key        = var.lambda_artifact_key
  handler       = "events.handler"
  runtime       = "nodejs20.x"
  timeout       = 10
  memory_size   = 512

  publish = true   # publishes a new version on every code change

  environment {
    variables = {
      NODE_OPTIONS = "--enable-source-maps"
      LOG_LEVEL    = var.log_level
    }
  }

  tracing_config {
    mode = "Active"
  }
}
</code></pre>
<p>The <code>publish = true</code> flag is what makes rollback easy. Every deploy creates a new Lambda version. You never overwrite <code>$LATEST</code> in place.</p>
<p>For functions over 50MB zipped (or 250MB unzipped), you have to use S3 anyway. For smaller ones, you can pass the zip directly to Terraform with <code>filename</code>, but I always go through S3. It decouples the build from the apply, makes the Terraform diff cleaner (the key changes, not a base64 blob), and gives you a deploy artifact you can audit later.</p>
<p><img src="https://images.pexels.com/photos/6969971/pexels-photo-6969971.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="Code packaging and artifact delivery" />
<sub>Photo by <a href="https://www.pexels.com/@mikhail-nilov">Mikhail Nilov</a> on <a href="https://www.pexels.com/photo/a-person-in-black-shirt-holding-a-box-6969971/">Pexels</a></sub></p>
<h2>Environment promotion with manual approval</h2>
<p>Staging deploys automatically. Production deploys when a human clicks approve. GitHub Environments make this almost free to set up.</p>
<p>In the GitHub UI, go to <strong>Settings -&gt; Environments</strong> and create two environments.</p>
<ol>
<li><strong>staging</strong> with no protection rules. Anything that reaches the staging job runs right away.</li>
<li><strong>prod</strong> with required reviewers. Add yourself and any teammate who can approve a production deploy. Restrict deployments to the <code>main</code> branch while you are in there.</li>
</ol>
<p>The workflow above already references both environments via <code>environment: staging</code> and <code>environment: prod</code> on the respective jobs. When the prod job tries to start, GitHub pauses it and notifies the configured reviewers. They can read the build logs, check the staging smoke test, and click approve or reject.</p>
<p>Three extra knobs that earn their keep.</p>
<p>A wait timer. Set a 5 or 10 minute wait on the prod environment if you want a soak period in staging before the approval prompt even appears. This catches the "we just deployed staging and now error rates are spiking" case before anyone is tempted to rubber-stamp prod.</p>
<p>Branch protection. Restrict the prod environment to the <code>main</code> branch under "Deployment branches". Otherwise someone could push a feature branch with an environment trigger and get a prod approval prompt for code that never went through review. That one has bitten me.</p>
<p>Per-environment secrets. Each environment has its own secret store. Staging holds the staging AWS account role ARN, prod holds the prod role ARN. A workflow running in the staging environment cannot read prod secrets, even if the YAML asks for them.</p>
<p>The combined effect is a pipeline where every push to main runs the build and deploys to staging in 4 to 5 minutes, the staging smoke test gates the prod approval (if staging is broken, prod never gets prompted), and production deploys only happen when a named reviewer clicks the button.</p>
<p>That last point is what keeps me sane. There is always a human in the loop for production, but they are reviewing a deploy that has already passed every automated gate, not driving the deploy themselves.</p>
<p><img src="https://images.pexels.com/photos/35431759/pexels-photo-35431759.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="Manual approval gate for production" />
<sub>Photo by <a href="https://www.pexels.com/@sanlad">Tolga deniz Aran</a> on <a href="https://www.pexels.com/photo/colorful-collection-of-vintage-postage-stamps-35431759/">Pexels</a></sub></p>
<h2>Rollback strategy</h2>
<p>Any pipeline can deploy bad code. So can the most careful review process. The real question is how fast you can undo it.</p>
<p>The Lambda alias pattern gives you instant rollback. Instead of pointing API Gateway at the function directly, you point it at an alias, and the alias points at a specific version. Rolling back is just updating the alias to point at the previous version. No rebuild, no fresh zip, no S3 round trip required.</p>
<pre><code class="language-hcl"># infra/lambda.tf (continued)

resource "aws_lambda_alias" "hrr_api_live" {
  name             = "live"
  function_name    = aws_lambda_function.hrr_api.function_name
  function_version = aws_lambda_function.hrr_api.version
}

resource "aws_apigatewayv2_integration" "hrr_api" {
  api_id                 = aws_apigatewayv2_api.hrr_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_alias.hrr_api_live.invoke_arn
  payload_format_version = "2.0"
}
</code></pre>
<p>The API Gateway integration always invokes <code>hrr-api:live</code>. The alias decides which version actually runs. On every deploy, Terraform updates the alias to the newly published version.</p>
<p>For instant rollback, I keep a separate manual workflow.</p>
<pre><code class="language-yaml"># .github/workflows/rollback.yml

name: rollback

on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Target environment'
        required: true
        type: choice
        options: [staging, prod]
      version:
        description: 'Lambda version to roll back to (e.g. 47)'
        required: true
        type: string

permissions:
  id-token: write
  contents: read

jobs:
  rollback:
    runs-on: ubuntu-latest
    environment: ${{ inputs.environment }}
    steps:
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ vars.HRR_DEPLOY_ROLE_ARN }}
          aws-region: eu-west-1

      - name: Point alias at older version
        run: |
          aws lambda update-alias \
            --function-name hrr-api \
            --name live \
            --function-version "${{ inputs.version }}"

      - name: Verify
        run: |
          aws lambda get-alias \
            --function-name hrr-api \
            --name live \
            --query 'FunctionVersion' \
            --output text
</code></pre>
<p>You fire this from the GitHub UI under <strong>Actions -&gt; rollback -&gt; Run workflow</strong>. Pick the environment, type the version number you want to revert to (you can find it in the Lambda console or from the previous deploy logs), and click run. The rollback takes about 15 seconds end to end, which is the part I love. When prod is broken, every second of panic feels like an hour.</p>
<p>The trade-off: this rollback drifts from Terraform state. Terraform thinks <code>live</code> points at version 50, but it actually points at version 47. The next <code>terraform apply</code> will quietly move it back to 50 unless you also revert the code change in git. The right recovery flow is rollback the alias for the immediate fix, then revert the offending commit so the next deploy puts the world back in a consistent state.</p>
<p>For larger setups, CodeDeploy with traffic shifting (linear, canary) gives you progressive rollout and automatic rollback on CloudWatch alarms. It is more moving parts and only worth wiring up once your traffic is high enough that a 5-minute bad deploy actually hurts customers. For most APIs I have shipped, the alias swap is enough.</p>
<p><img src="https://images.pexels.com/photos/9227666/pexels-photo-9227666.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="Rollback and version recovery" />
<sub>Photo by <a href="https://www.pexels.com/@ds-stories">DS stories</a> on <a href="https://www.pexels.com/photo/a-cassette-a-pen-and-the-word-rewind-from-scrabble-letter-tiles-9227666/">Pexels</a></sub></p>
<h2>Cost and speed</h2>
<p>Actual numbers from this exact pipeline, averaged over the last few months of running it.</p>
<p>Build job: around 45 to 60 seconds. <code>npm ci</code> is 25 seconds with the cache warm, esbuild is 4 to 5 seconds for a dozen handlers, zip and upload are negligible.</p>
<p>Staging deploy: around 90 to 110 seconds total. <code>terraform init</code> is 8 to 10 seconds, <code>terraform apply</code> is 30 to 45 seconds (most of which is Lambda update propagation and API Gateway redeploy), the smoke test is 2 seconds.</p>
<p>Prod deploy: same shape as staging, plus however long it takes a reviewer to click approve. Once approved, another 90 seconds.</p>
<p>End to end, a green push to main is in staging within 3 minutes. After approval, prod is live within 5 minutes of the original commit.</p>
<p>On cost: GitHub Actions minutes for a public repo are free. For a private repo, you get 2,000 free minutes per month on the Free plan and this pipeline burns about 5 minutes per deploy. So 400 deploys per month before you pay anything extra. AWS charges are basically zero. A few cents per month for the S3 state bucket, a few cents for DynamoDB on-demand requests, and the artifact bucket holds about 200KB per deploy SHA so storage costs are noise.</p>
<p>The expensive part of this whole setup is not the pipeline. It is the IAM permissions on the deploy role. Spend the time to scope them down. A leaked OIDC trust with <code>AdministratorAccess</code> is just as dangerous as a leaked access key. The only difference is the attack window is shorter.</p>
<p><img src="https://images.pexels.com/photos/23533488/pexels-photo-23533488.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="Pipeline speed and cost metrics" />
<sub>Photo by <a href="https://www.pexels.com/@gezerasph">Gezer Amorim</a> on <a href="https://www.pexels.com/photo/dashboard-in-car-23533488/">Pexels</a></sub></p>
<h2>What I learned</h2>
<p>Things I did not get right on the first try, in no particular order.</p>
<p>Pin everything. Pin the Terraform version, the AWS provider version, the Node version, the action versions. <code>@v4</code> is fine for first-party actions, but a community action pinned to <code>@main</code> is a supply chain attack waiting to happen. Use commit SHAs for anything sensitive.</p>
<p>Test the OIDC trust before you delete the access keys. I once flipped a pipeline to OIDC, deleted the IAM user, and found out three workflows on a different branch were still using the old keys. Run both in parallel for a week, watch the CloudTrail logs, then turn off the static keys.</p>
<p>Plan output as a PR comment is non-negotiable for teams. If reviewers cannot see what infrastructure a PR is about to change, they will rubber-stamp it. Put the plan in front of them, in the review where they are already paying attention.</p>
<p>Smoke tests catch more than you think. The 2-second <code>curl /health</code> after every deploy has caught a broken environment variable, a missing IAM permission, and a Lambda that was throwing on cold start because of a bundling bug. Two lines of YAML, hours of saved debugging. Easiest ROI in the whole pipeline.</p>
<p>Keep one deploy path. It is tempting to add a "quick deploy" script that skips Terraform for code-only changes. Do not do it. Every shortcut eventually becomes the path that breaks production at 11pm on a Friday. One deploy path, used for every change, even one-line typo fixes.</p>
<p><img src="https://images.pexels.com/photos/5212341/pexels-photo-5212341.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="Lessons learned and reflection" />
<sub>Photo by <a href="https://www.pexels.com/@max-fischer">Max Fischer</a> on <a href="https://www.pexels.com/photo/a-person-writing-on-the-notebook-5212341/">Pexels</a></sub></p>
<h2>Wrapping up</h2>
<p>Setting up CI/CD for Lambda and Terraform feels overwhelming when you stare at a blank repo, but each piece is small. The OIDC trust is one Terraform file. The remote state is another. The deploy workflow is one YAML file. Stitched together you get a pipeline that ships code safely without keeping any long-lived AWS credentials anywhere near your repo.</p>
<p>The setup pays for itself the first time you push a hotfix at midnight and it lands in production in 5 minutes without you ever opening a terminal. That moment alone was worth the weekend I spent wiring it up.</p>
<p>Hope you enjoyed this walkthrough. If you are setting up something similar or have questions about any of the patterns above, drop a comment below.</p>
<hr />
<p><em>Follow me on <a href="https://x.com/HarunRRayhan">Twitter/X</a> for more posts about AWS, serverless architecture, and building SaaS products.</em></p>
<p><img src="https://images.pexels.com/photos/3912478/pexels-photo-3912478.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="Developer community and collaboration" />
<sub>Photo by <a href="https://www.pexels.com/@thisisengineering">ThisIsEngineering</a> on <a href="https://www.pexels.com/photo/engineers-designing-app-3912478/">Pexels</a></sub></p>
