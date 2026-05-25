---
title: "Claude Code for AWS Infrastructure: My Agentic DevOps Workflow with Terraform"
slug: "claude-code-for-aws-infrastructure-agentic-devops-workflow-with-terraform"
brief: "Every AI Demo Ignores Infrastructure
Every AI coding tool tutorial follows the same script. They show you editing a React component, refactoring a Python function, or generating a REST endpoint. Cool."
publishedAt: "2026-03-28T11:44:17.946Z"
readTimeInMinutes: 15
reactionCount: 0
responseCount: 0
replyCount: 0
sourceUrl: "https://web.archive.org/web/*/https://blog.harun.dev/claude-code-for-aws-infrastructure-agentic-devops-workflow-with-terraform"
coverImageUrl: "https://raw.githubusercontent.com/HarunRRayhan/blog-assets/main/covers/claude-code-for-aws-infrastructure-agentic-devops-workflow-with-terraform/cover.jpg"
tags:
  - name: "AWS"
    slug: "aws"
  - name: "Devops"
    slug: "devops"
  - name: "Terraform"
    slug: "terraform"
  - name: "ClaudeCode"
    slug: "claudecode"
  - name: "Productivity"
    slug: "productivity"
---
<h2>Every AI Demo Ignores Infrastructure</h2>
<p>Every AI coding tool tutorial follows the same script. They show you editing a React component, refactoring a Python function, or generating a REST endpoint. Cool. But nobody is showing the stuff that actually breaks production. Terraform files. IAM policies. Security group rules. CloudFormation stacks that drift at 2am.</p>
<p>I get it. Infrastructure code isn't flashy. There's no pretty UI to screenshot. But it's where small mistakes cost real money, and where context matters more than anywhere else in a codebase.</p>
<p>A few months ago I started using Claude Code for my AWS infrastructure work. Not for generating boilerplate that I could copy from the Terraform docs anyway. As an actual collaborator that reads my existing stack, understands my naming conventions, knows which resources are already deployed, and helps me ship changes faster without making expensive mistakes.</p>
<p>This post walks through my actual workflow. How I set up the CLAUDE.md file for infra projects, how I write Terraform with Claude Code, how I pipe <code>terraform plan</code> output to it for review, and where it still falls short. No toy demos. Just the process I use on real projects every week.</p>
<p><img src="https://images.pexels.com/photos/34803969/pexels-photo-34803969.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="Developer working at a terminal with code on screen" />
<sub>Photo by <a href="https://www.pexels.com/@dkomov">Daniil Komov</a> on <a href="https://www.pexels.com/photo/focused-coding-session-with-laptop-and-coffee-34803969/">Pexels</a></sub></p>
<h2>The Project Setup: CLAUDE.md for Infrastructure</h2>
<p>The CLAUDE.md file is where everything starts. If you've used Claude Code before, you probably have one. But most people write something generic like "this is a Node.js project using TypeScript." That's not going to cut it for infrastructure work.</p>
<p>For Terraform projects, Claude needs to know things that aren't obvious from reading your <code>.tf</code> files alone. Which AWS account and region are you targeting? What are your naming conventions? Where does Terraform state live? Are there resources that should never be modified? What are your cost guardrails?</p>
<p>Here's what my CLAUDE.md looks like for a typical infra project:</p>
<pre><code class="language-markdown"># CLAUDE.md

## AWS Context
- Account: 123456789012 (production)
- Region: us-east-1
- All resource names use the `hrr_` prefix (e.g., hrr_api_role, hrr_lambda_fn)
- Terraform state: S3 backend in hrr-terraform-state bucket, DynamoDB lock table hrr_tf_locks

## Existing Services
- API Gateway HTTP API (hrr_main_api) routes to Lambda
- Three Lambda functions: hrr_web_fn, hrr_worker_fn, hrr_cron_fn
- Aurora Serverless v2 cluster (hrr_db_cluster) in private subnets
- SQS queue (hrr_jobs_queue) feeds hrr_worker_fn

## Rules
- Never modify or destroy the Aurora cluster without explicit confirmation
- No NAT gateways without asking first (they cost $32/month each)
- IAM policies must follow least privilege. No wildcard actions on production resources
- Always use data sources to reference existing resources rather than hardcoding ARNs
</code></pre>
<p>But the CLAUDE.md alone isn't enough. The real power comes from hooks. Claude Code lets you configure pre-tool-use and post-tool-use hooks that run automatically during the session. For infra work, I set up two.</p>
<p>The first is a pre-tool-use hook that runs <code>terraform validate</code> every time Claude tries to write a <code>.tf</code> file. If the validation fails, the output gets piped back into the conversation so Claude can fix its own mistakes. The second is a post-tool-use hook that reminds Claude to double-check IAM policies for least privilege after generating any IAM-related resources.</p>
<p>Here's the hooks configuration from my <code>.claude/settings.json</code>:</p>
<pre><code class="language-json">{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "if echo '$TOOL_INPUT' | grep -q '\\.tf'; then cd /path/to/infra &amp;&amp; terraform validate 2&gt;&amp;1; fi"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "if echo '$TOOL_INPUT' | grep -qi 'iam\\|policy\\|role'; then echo 'REMINDER: Check this IAM resource for least-privilege. No wildcard actions unless absolutely necessary.'; fi"
          }
        ]
      }
    ]
  }
}
</code></pre>
<p>The difference this setup makes is huge. Without the CLAUDE.md, Claude suggests resource names that conflict with what's already deployed. It picks random regions. It hardcodes ARNs instead of using data sources. With the context file and hooks in place, Claude follows your patterns from the first prompt. It uses the <code>hrr_</code> prefix automatically. It references your existing resources by their Terraform identifiers. And if it generates something invalid, the hook catches it before you ever run a plan.</p>
<p>Spend an hour getting this right. It pays for itself within the first session.</p>
<p><img src="https://images.pexels.com/photos/4792286/pexels-photo-4792286.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="Organized project folder structure" />
<sub>Photo by <a href="https://www.pexels.com/@anete-lusina">Anete Lusina</a> on <a href="https://www.pexels.com/photo/briefcase-for-documents-placed-on-table-4792286/">Pexels</a></sub></p>
<h2>Writing Terraform with Claude Code</h2>
<p>Now for the part that actually saves me time. Let's walk through a real example: adding a new Lambda function with an SQS trigger to an existing Terraform stack.</p>
<p>The workflow starts by pulling the relevant files into the Claude Code session. I open my existing <code>lambda.tf</code> and <code>sqs.tf</code> so Claude can see the patterns already in use. Variable naming, provider versions, how I structure resource blocks. Then I describe what I want in plain English.</p>
<p>Something like: "Add a new Lambda function called hrr_notification_fn that processes messages from a new SQS queue called hrr_notification_queue. It needs its own IAM role with permissions to read from the queue and write to CloudWatch Logs. Use the same runtime and handler pattern as hrr_worker_fn."</p>
<p>Claude drafts the full set of resources. Here's a realistic version of what it generates:</p>
<pre><code class="language-hcl">resource "aws_sqs_queue" "hrr_notification_queue" {
  name                       = "hrr_notification_queue"
  visibility_timeout_seconds = 900
  message_retention_seconds  = 86400
  receive_wait_time_seconds  = 20

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.hrr_notification_dlq.arn
    maxReceiveCount     = 3
  })

  tags = var.default_tags
}

resource "aws_sqs_queue" "hrr_notification_dlq" {
  name                      = "hrr_notification_dlq"
  message_retention_seconds = 1209600
  tags                      = var.default_tags
}

resource "aws_iam_role" "hrr_notification_role" {
  name = "hrr_notification_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy" "hrr_notification_policy" {
  name = "hrr_notification_policy"
  role = aws_iam_role.hrr_notification_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = aws_sqs_queue.hrr_notification_queue.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:log-group:/aws/lambda/hrr_notification_fn:*"
      }
    ]
  })
}

resource "aws_lambda_function" "hrr_notification_fn" {
  function_name = "hrr_notification_fn"
  role          = aws_iam_role.hrr_notification_role.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  timeout       = 300
  memory_size   = 256

  s3_bucket = var.deploy_bucket
  s3_key    = var.notification_fn_s3_key

  environment {
    variables = {
      NODE_ENV   = var.environment
      LOG_LEVEL  = "info"
    }
  }

  tags = var.default_tags
}

resource "aws_lambda_event_source_mapping" "hrr_notification_sqs_trigger" {
  event_source_arn = aws_sqs_queue.hrr_notification_queue.arn
  function_name    = aws_lambda_function.hrr_notification_fn.arn
  batch_size       = 10

  function_response_types = ["ReportBatchItemFailures"]
}
</code></pre>
<p>What Claude gets right here is impressive. It followed the <code>hrr_</code> naming convention throughout. It referenced the existing <code>var.default_tags</code> and <code>var.deploy_bucket</code> that it saw in my other files. It included a dead letter queue, which I didn't even ask for but which my other SQS queues all have. It even added <code>ReportBatchItemFailures</code> to the event source mapping, matching the pattern from my existing worker setup.</p>
<p>But here's the thing. You still have to watch the IAM policies carefully. In an earlier session, Claude generated a policy for a similar Lambda function that looked like this:</p>
<pre><code class="language-json">{
  "Effect": "Allow",
  "Action": "sqs:*",
  "Resource": "*"
}
</code></pre>
<p>That's a full wildcard on every SQS action across every queue in the account. Absolutely not what you want in production. When I flagged it, Claude immediately revised it to the scoped version with only <code>ReceiveMessage</code>, <code>DeleteMessage</code>, and <code>GetQueueAttributes</code> on the specific queue ARN. It knows the right answer. It just doesn't always default to it without prompting.</p>
<p>This is exactly why the post-tool-use hook matters. That automatic reminder to check for least privilege has caught overly broad policies multiple times. It's a small thing, but it prevents the kind of mistake that a security audit would flag months later.</p>
<p><img src="https://images.pexels.com/photos/5480781/pexels-photo-5480781.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="Cloud infrastructure architecture diagram" />
<sub>Photo by <a href="https://www.pexels.com/@brett-sayles">Brett Sayles</a> on <a href="https://www.pexels.com/photo/server-racks-on-data-center-5480781/">Pexels</a></sub></p>
<h2>Reviewing Terraform Plans</h2>
<p>Writing the code is only half the job. The real power move is using Claude Code to review your Terraform plans before you apply them.</p>
<p>The workflow is straightforward. Run your plan, output it to a file, then pipe the JSON representation into Claude:</p>
<pre><code class="language-bash">terraform plan -out=tfplan
terraform show -json tfplan | claude "Review this plan. Flag anything that will cause downtime, anything with overly broad IAM permissions, and any resources that will be destroyed."
</code></pre>
<p>You can also just paste the plan output directly into a Claude Code session if you prefer. Either way, Claude reads through every resource change and flags potential problems.</p>
<p>Here's where it gets genuinely useful. On a recent project, I was updating a security group for an internal API. The plan looked fine at first glance. A few ingress rules modified, nothing destroyed. But when I piped it to Claude, it immediately flagged this:</p>
<p>"Warning: The updated ingress rule on <code>hrr_api_sg</code> opens port 22 (SSH) to <code>0.0.0.0/0</code>. This allows SSH access from any IP address on the internet. If this is intentional for debugging, consider restricting to your IP or a bastion host security group instead."</p>
<p>I had accidentally included a debug rule from my local testing that would have gone straight to production. That's the kind of thing your eyes skip over when you're reviewing a plan with 40 resource changes.</p>
<p>Another time, Claude caught a more subtle issue. I was adding the SQS trigger for a new Lambda function, and the plan showed the Lambda timeout at 30 seconds with the SQS visibility timeout at 30 seconds. Claude flagged it:</p>
<p>"The Lambda function <code>hrr_notification_fn</code> has a timeout of 30s, and the SQS queue <code>hrr_notification_queue</code> has a visibility timeout of 30s. If the Lambda function takes close to 30 seconds to process a message, the visibility timeout may expire before the function completes. This causes the message to become visible again and get processed a second time, leading to duplicate processing. Recommend setting the visibility timeout to at least 6x the Lambda timeout (180s) per AWS best practices."</p>
<p>That's a classic mistake. I've seen it in production systems that ran for months before anyone figured out why certain jobs were running twice. Claude caught it in the plan review before a single resource was created.</p>
<p>This is the thing that has saved me the most time. Not the code generation. The plan review. A 200-line plan takes me 15 minutes to review manually, checking every ARN, every permission, every dependency. Claude does it in seconds and catches things I would miss.</p>
<p><img src="https://images.pexels.com/photos/8850721/pexels-photo-8850721.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="Code review and approval process" />
<sub>Photo by <a href="https://www.pexels.com/@tara-winstead">Tara Winstead</a> on <a href="https://www.pexels.com/photo/red-check-mark-in-a-box-8850721/">Pexels</a></sub></p>
<h2>Where It Falls Down</h2>
<p>I want to be honest here. Claude Code is not a replacement for knowing your infrastructure. It's a force multiplier, but it has clear failure modes that you need to understand before relying on it.</p>
<p>The first one is state drift. Claude doesn't know what's actually running in your AWS account. It only knows what's in your Terraform files. If someone made manual changes in the AWS console (and let's be real, everyone does this occasionally), Claude has no idea. It will happily generate code that references resources in a state that doesn't match reality. The fix is simple: always run <code>terraform plan</code> before you start a session. If there's drift, reconcile it first. Don't ask Claude to work with a codebase that doesn't match what's deployed.</p>
<p>The second problem is hallucinated resource attributes. I've seen Claude suggest arguments for <code>aws_lambda_function</code> that don't exist in the Terraform AWS provider. One time it added a <code>concurrent_executions</code> argument directly on the Lambda resource, which isn't a thing. The actual resource for that is <code>aws_lambda_function_event_invoke_config</code> or you use <code>reserved_concurrent_executions</code>. It looked plausible enough that I almost missed it. The <code>terraform validate</code> hook catches most of these, but not always. Some invalid attributes only fail during <code>terraform plan</code> or <code>apply</code>, not during validation. So always run the full plan. And when Claude suggests an attribute you haven't seen before, check the Terraform AWS provider docs. It takes 30 seconds and can save you a failed deployment.</p>
<p>The third issue is complex module structures. If you have deeply nested Terraform modules with variables passed through three layers of abstraction, Claude loses track. It forgets which variables are defined where, it confuses module inputs with resource arguments, and it sometimes generates code that references variables from the wrong scope. For these situations, I've found it works much better to break out the specific module you're working on and give Claude focused context. Instead of loading your entire infra repo into the session, open just the module directory and its variables file. Smaller context, better results.</p>
<p>None of these are dealbreakers. They're quirks you learn to work around after a few sessions. The validate hook catches the obvious mistakes. The plan review catches the subtle ones. And knowing when to give Claude a narrower context window makes the module problem manageable.</p>
<p><img src="https://images.pexels.com/photos/36634292/pexels-photo-36634292.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="Warning sign indicating caution" />
<sub>Photo by <a href="https://www.pexels.com/@jean-paul-wettstein-677916508">Jean-Paul Wettstein</a> on <a href="https://www.pexels.com/photo/black-and-white-crocodile-warning-sign-36634292/">Pexels</a></sub></p>
<h2>The Workflow That Actually Works</h2>
<p>After a few months of iterating, here's the process I've settled on. It's repeatable and it works for any Terraform change, from a single variable update to a full new service deployment.</p>
<p>Step one: open the relevant <code>.tf</code> files in the Claude Code session. Use <code>/add</code> or reference them directly. Don't dump your entire repo in. Give Claude the files that contain the resources you're about to change, plus any shared modules or variable files it needs for context.</p>
<p>Step two: describe the change you want in plain English. Be specific. "Add a Lambda function" is too vague. "Add a Lambda function called hrr_notification_fn that processes messages from hrr_notification_queue, with its own least-privilege IAM role and a dead letter queue" gives Claude everything it needs to generate code that matches your standards.</p>
<p>Step three: review the generated code before applying anything. Read through the resource names, check the IAM policy statements, verify the variable references. This takes two minutes and catches the most obvious issues.</p>
<p>Step four: run <code>terraform validate</code>. If you set up the hook from earlier, this happens automatically every time Claude writes a <code>.tf</code> file. If validation fails, Claude sees the error output and fixes it in the same session.</p>
<p>Step five: run <code>terraform plan</code> and pipe the output back to Claude for a second review. Ask it to flag downtime risks, overly broad permissions, and any resources being destroyed. This is the step that catches the non-obvious mistakes.</p>
<p>Step six: apply. At this point you've had the code validated, the plan reviewed, and the IAM policies checked. You're deploying with a lot more confidence than if you'd written everything by hand and eyeballed the plan.</p>
<p>The CLAUDE.md and hooks do most of the heavy lifting. Once they're set up, Claude has enough context to be genuinely useful instead of generating plausible-looking code that doesn't match your project. The naming conventions, the existing resource references, the cost guardrails. All of that context means Claude's first attempt is usually close to what you'd write yourself.</p>
<p>The productivity gain is real. Tasks that used to take me 30 to 45 minutes, like writing a new Lambda function with its IAM role, SQS trigger, dead letter queue, and CloudWatch log group from scratch while making sure all the ARN references are correct, now take about 10 minutes. Not because Claude is doing it for me. I still review every line. But because it's cutting out the tedious lookup-and-copy work. I'm not digging through the Terraform docs to find the right attribute name for an event source mapping. I'm not copying ARN patterns from another resource and carefully replacing the identifiers. Claude handles the boilerplate and I focus on the architecture decisions.</p>
<p>That's the right way to think about it. Claude Code is not an autopilot for your infrastructure. It's a collaborator that handles the mechanical parts so you can spend your time on the parts that actually require judgment.</p>
<p><img src="https://images.pexels.com/photos/8850713/pexels-photo-8850713.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="Efficient development workflow" />
<sub>Photo by <a href="https://www.pexels.com/@tara-winstead">Tara Winstead</a> on <a href="https://www.pexels.com/photo/tick-mark-on-square-boxes-8850713/">Pexels</a></sub></p>
<h2>Wrapping Up</h2>
<p>Claude Code for infrastructure work is different from Claude Code for application code. The margin for error is smaller. A bad React component wastes time. A bad IAM policy opens a security hole. A bad Terraform change destroys a database.</p>
<p>That means you need more context upfront. The CLAUDE.md file isn't optional for infra work. You need the naming conventions, the existing resource map, the cost guardrails, and the "never touch" list. You also need to be more skeptical of what Claude generates. The validate hook and the plan review step aren't nice-to-haves. They're essential parts of the workflow.</p>
<p>But once you accept those constraints and set up the tooling, the experience is genuinely good. Claude follows your patterns, generates valid Terraform, catches mistakes in plan reviews that you'd miss on your own, and cuts the tedious parts of infra work down to almost nothing.</p>
<p>The CLAUDE.md investment pays off quickly. Spend an hour writing a thorough one and Claude stops making rookie mistakes in your codebase. Add the hooks and you have automated guardrails that catch problems before they become deployment failures.</p>
<p>If you're already working with Terraform and AWS, try this workflow on your next change. Start small. Add a security group rule or a new IAM policy. See how it goes. And if you find a better approach or run into something interesting, I'd love to hear about it.</p>
<p>Hope you enjoyed this post. If you have questions or want to share your own experience using AI tools for infrastructure work, reach out on Twitter at <a href="https://x.com/HarunRRayhan">https://x.com/HarunRRayhan</a>. I'm always happy to chat about this stuff.</p>
