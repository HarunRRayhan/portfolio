---
title: "Multi-Agent Claude Code Routines for AWS DevOps"
slug: "multi-agent-claude-code-aws-devops-routines"
brief: "One Claude Code Session Isn't Enough Anymore
I love a single Claude Code session. It's where most of my real work happens, plan in one pane, code in the other, terminal humming along. But here's the t"
publishedAt: "2026-05-09T06:27:49.271Z"
readTimeInMinutes: 17
reactionCount: 0
responseCount: 0
replyCount: 0
sourceUrl: "https://web.archive.org/web/*/https://blog.harun.dev/multi-agent-claude-code-aws-devops-routines"
coverImageUrl: "https://raw.githubusercontent.com/HarunRRayhan/blog-assets/main/covers/multi-agent-claude-code-aws-devops-routines/cover.jpg"
tags:
  - name: "AWS"
    slug: "aws"
  - name: "Devops"
    slug: "devops"
  - name: "Terraform"
    slug: "terraform"
  - name: "ClaudeCode"
    slug: "claudecode"
  - name: "automation"
    slug: "automation"
---
<h2>One Claude Code Session Isn't Enough Anymore</h2>
<p>I love a single Claude Code session. It's where most of my real work happens, plan in one pane, code in the other, terminal humming along. But here's the thing, when I'm shipping a real AWS change, the cognitive load gets ugly fast.</p>
<p>Think about what a "small" infra PR actually demands. You need to read the Terraform plan and decide if the diff matches intent. You need to check if anyone has clicked around in the AWS console since the last apply, because someone always has. You need to ballpark the cost so you're not silently adding a 60 dollar a month NAT gateway to a side project. You need to scan the IAM bits for wildcards and public exposure. And then you need to tell the team what's about to happen, in plain language, before you hit apply.</p>
<p>That's five different jobs, and they all want different context. The plan reviewer wants the JSON plan. The drift detector wants the live AWS state. The cost reviewer wants pricing knowledge. The security reviewer wants a paranoid mindset. The summarizer wants to be brief.</p>
<p>I tried doing all five in one session for months. It works, until it doesn't. The session bloats, the model starts forgetting earlier findings, and by the time you ask for a Telegram summary it's leaving things out.</p>
<p>So I split the routine. One lead Claude Code session orchestrates, and five specialist sub-prompts each own one job. Each specialist runs with its own focused context and returns a structured finding. The lead aggregates and posts the result.</p>
<p>If you read my earlier post on <a href="https://harun.dev/blog/claude-code-for-aws-infrastructure-agentic-devops-workflow-with-terraform">Claude Code for AWS Infrastructure: My Agentic DevOps Workflow with Terraform</a>, you already know how I set up CLAUDE.md, hooks, and the single-session plan review. This post extends that. Same project, same Terraform, but now the lead session delegates to specialists instead of trying to be all five reviewers at once.</p>
<p>Let's get into the layout.</p>
<p><img src="https://images.pexels.com/photos/5990265/pexels-photo-5990265.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="A whiteboard with sticky notes showing a coordinated workflow split into multiple roles" />
<sub>Photo by <a href="https://www.pexels.com/@cottonbro">cottonbro studio</a> on <a href="https://www.pexels.com/photo/close-up-photo-of-sticky-notes-on-whiteboard-5990265/">Pexels</a></sub></p>
<h2>The Repo Layout</h2>
<p>Here's how my infra repo looks once the routine is wired in. Nothing fancy, just a few extra files in <code>.claude/</code> and a couple of scripts.</p>
<pre><code>hrr-infra/
├── .claude/
│   ├── agents/
│   │   ├── terraform-plan-reviewer.md
│   │   ├── drift-detector.md
│   │   ├── cost-reviewer.md
│   │   ├── iam-security-reviewer.md
│   │   └── telegram-summarizer.md
│   └── settings.json
├── infra/
│   ├── main.tf
│   ├── networking.tf
│   ├── rds.tf
│   ├── lambda.tf
│   └── iam.tf
├── scripts/
│   ├── run-routine.sh
│   └── post-to-telegram.sh
├── .github/
│   └── workflows/
│       └── infra-review.yml
└── CLAUDE.md
</code></pre>
<p>The interesting bit is <code>.claude/agents/</code>. Each file in there is a specialist prompt. It's just markdown with a small frontmatter block at the top, a name, a one-line description, and then the actual instructions for that one job. Think of them as job descriptions for very narrow contractors.</p>
<p><code>CLAUDE.md</code> at the root is for the lead session. It explains the routine, points at the agent files, and tells the lead how to dispatch them. I keep it short so the lead doesn't burn context just reading its own instructions.</p>
<p><code>scripts/run-routine.sh</code> is the glue for when I want to run the whole thing without an interactive session, like in CI or as a cron job. It calls each specialist with <code>claude -p</code> in headless mode, collects the results, and pipes them to <code>post-to-telegram.sh</code>.</p>
<p><code>infra/</code> is normal Terraform. Nothing here changes because of the routine. The whole point is the orchestration layer sits beside the infrastructure code, not inside it.</p>
<p>One thing I learned the hard way, keep the agent prompts in version control. They drift over time, you'll want to know why a finding looked different six months ago. Treat them like code.</p>
<p><img src="https://images.pexels.com/photos/4792286/pexels-photo-4792286.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="A clean desk with neatly organized folders representing a structured project layout" />
<sub>Photo by <a href="https://www.pexels.com/@anete-lusina">Anete Lusina</a> on <a href="https://www.pexels.com/photo/briefcase-for-documents-placed-on-table-4792286/">Pexels</a></sub></p>
<h2>The Lead Session and How It Dispatches Specialists</h2>
<p>The lead session does almost no thinking on its own. Its job is to read the user's request, figure out which specialists to run, fan them out, and aggregate the findings. That's it. The actual analysis lives in the specialists.</p>
<p>Here's the relevant chunk of <code>CLAUDE.md</code> that the lead reads on startup:</p>
<pre><code class="language-markdown"># Lead Session Instructions

You are the lead reviewer for hrr-infra. For any infrastructure change
(a new PR, a local plan, or an "I'm about to apply this" message from me),
run the following routine:

1. Generate a fresh plan: `terraform init -input=false &amp;&amp; terraform plan -out=tfplan &amp;&amp; terraform show -json tfplan &gt; plan.json`
2. Dispatch these four reviewers in parallel as Claude Code subagents:
   - terraform-plan-reviewer
   - drift-detector
   - cost-reviewer
   - iam-security-reviewer
3. Wait for all four reviewers to return.
4. Pass their combined output to telegram-summarizer (the fifth specialist).
5. Print the final summary to me and ask before applying.

Specialist prompts live in `.claude/agents/`. Each prompt file becomes the
system prompt for that subagent. Include any artifacts the specialist needs
(plan.json, drift output, etc).
</code></pre>
<p>That's the whole lead instruction. Short on purpose. The lead is a router, not a reviewer.</p>
<p>For the actual dispatch, I use Claude Code subagents when I'm in an interactive session, since each subagent gets its own context window and they run in parallel. When I'm running headless in CI, I call <code>claude</code> with <code>--append-system-prompt "$(cat .claude/agents/name.md)"</code> to load the specialist role, and pass the actual task as the user prompt with <code>-p</code>. Same idea, different transport.</p>
<p>Here's what one specialist file looks like in full. This is <code>.claude/agents/terraform-plan-reviewer.md</code>:</p>
<pre><code class="language-markdown">---
name: terraform-plan-reviewer
description: Reviews a Terraform plan JSON for correctness, risky changes, and missing tags
---

You are a senior Terraform reviewer. You receive a JSON plan at `./plan.json`.

Your job:
1. Summarize the plan in 3 bullets max (what's being created, changed, destroyed).
2. Flag any of the following as RISKY:
   - Resource replacements (destroy + create) on stateful resources (RDS, EBS, S3 with content)
   - Changes to security groups that widen ingress
   - Changes to IAM policies attached to running workloads
   - Missing required tags (Owner, Environment, CostCenter)
3. For each risky item, suggest a safer alternative or a mitigation step.

Output format:
- "Summary:" then 3 bullets
- "Risky changes:" then a list, or "None" if nothing is risky
- "Suggested fixes:" then a list, or "None"

Do not output anything else. Do not ask questions. If the plan is empty,
say "No changes" and stop.
</code></pre>
<p>That structured output matters. The lead is going to glue four reviewer outputs together and hand them to the summarizer. If each reviewer returns free-form prose, the summarizer drowns. With strict sections, the summarizer just stitches headings.</p>
<p>Each of the other specialists follows the same shape. A name, a one-line description, a clear job, a fixed output format, and a "do not output anything else" rule. The strictness pays off every time.</p>
<p><img src="https://images.pexels.com/photos/32545976/pexels-photo-32545976.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="A conductor coordinating an orchestra of specialists each playing their part" />
<sub>Photo by <a href="https://www.pexels.com/@jonas-baumann-204162293">Jonas Baumann</a> on <a href="https://www.pexels.com/photo/dynamic-orchestra-conductor-leading-performance-32545976/">Pexels</a></sub></p>
<h2>Specialist 1 and 2: Terraform Plan Reviewer and Drift Detector</h2>
<p>These two run first because everything else depends on knowing what's in the plan and what's already drifted in AWS.</p>
<p>The plan reviewer is the simpler one. The lead generates a JSON plan and hands the path to the specialist:</p>
<pre><code class="language-bash">cd infra
terraform plan -out=tfplan
terraform show -json tfplan &gt; ../plan.json
</code></pre>
<p>The specialist reads <code>plan.json</code>, walks the <code>resource_changes</code> array, and applies its rules. A real finding from last week looked like this:</p>
<pre><code>Summary:
- Creating 1 aws_db_instance (hrr_api_db)
- Modifying 2 aws_security_group rules (hrr_api_sg)
- Replacing 1 aws_lambda_function (hrr_worker_fn) due to runtime change

Risky changes:
- aws_lambda_function.hrr_worker_fn is being REPLACED. If this function is
  processing the SQS queue, in-flight messages may go to DLQ during the swap.
- aws_security_group.hrr_api_sg adds ingress on 0.0.0.0/0 port 5432. This
  exposes Postgres to the internet.

Suggested fixes:
- For the Lambda replacement, drain the queue first or use an alias with
  weighted routing.
- For the SG rule, restrict ingress to the VPC CIDR or your office IP only.
</code></pre>
<p>That second finding caught a real mistake. Someone had pasted a snippet from a tutorial and left the CIDR wide open. The plan reviewer flagged it before I even looked at the diff.</p>
<p>The drift detector is more interesting because it has to talk to AWS, not just the plan. I run a refresh-only plan first, which makes Terraform compare state to reality without proposing changes:</p>
<pre><code class="language-bash">terraform plan -refresh-only -out=refresh.tfplan
terraform show -json refresh.tfplan &gt; drift.json
</code></pre>
<p>Then the specialist reads <code>drift.json</code> and, for any resource that shows changes in refresh-only mode, calls out to the AWS CLI to confirm and grab the actual current value. A snippet of what that looks like for security groups:</p>
<pre><code class="language-bash">aws ec2 describe-security-groups \
  --filters "Name=tag:Name,Values=hrr_api_sg" \
  --query 'SecurityGroups[0].IpPermissions' \
  --output json &gt; current_sg.json
</code></pre>
<p>A real drift finding:</p>
<pre><code>Drift detected on aws_security_group.hrr_api_sg:
  - Terraform state: 1 ingress rule (port 443 from VPC CIDR)
  - Actual AWS:     2 ingress rules (port 443 from VPC CIDR, port 22 from 0.0.0.0/0)

Drift detected on aws_db_parameter_group.hrr_api_pg:
  - Terraform state: log_min_duration_statement = 1000
  - Actual AWS:     log_min_duration_statement = 100

Likely cause: manual change in console. Recommend either importing the change
into Terraform or reverting it before the next apply, since apply will
overwrite the live values.
</code></pre>
<p>That second one was me, three weeks earlier, debugging a slow query and forgetting to put the change back into Terraform. The drift detector caught it the next time I ran the routine. Without it, my next <code>terraform apply</code> would have silently reverted my own debugging fix.</p>
<p>These two specialists alone justify the routine for me. I used to skim plans and assume drift didn't exist. Now I get a clean list of both, every time, before I touch apply.</p>
<p><img src="https://images.pexels.com/photos/7319070/pexels-photo-7319070.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="A magnifying glass over technical diagrams representing detailed inspection of infrastructure changes" />
<sub>Photo by <a href="https://www.pexels.com/@cottonbro">cottonbro studio</a> on <a href="https://www.pexels.com/photo/photo-of-person-taking-down-notes-7319070/">Pexels</a></sub></p>
<h2>Specialist 3 and 4: Cost Reviewer and IAM Security Reviewer</h2>
<p>These two are the ones that have saved me actual money and actual sleep.</p>
<p>The cost reviewer reads the same <code>plan.json</code> as the plan reviewer, but with a different lens. It looks for resource types I've flagged as expensive in its prompt: NAT gateways, oversized RDS, large EC2 instances, anything with provisioned throughput, GlobalAccelerator, Transit Gateway attachments, and so on. The prompt also tells it which cheaper alternatives to suggest.</p>
<p>Here's the meat of <code>.claude/agents/cost-reviewer.md</code>:</p>
<pre><code class="language-markdown">---
name: cost-reviewer
description: Estimates monthly cost impact of a Terraform plan and suggests cheaper alternatives
---

You are a cost-conscious AWS reviewer. You receive plan.json.

For each resource being created or modified, estimate the monthly cost
impact in USD. Use these rough numbers (us-east-1):

- NAT Gateway: $32/month per AZ + data processing
- RDS db.t3.medium: ~\(50/month (single AZ), ~\)100/month (multi-AZ)
- RDS db.r5.large: ~$130/month (single AZ)
- ALB: $16/month + LCU charges
- NLB: $16/month + LCU charges
- Lambda (1M req, 512MB, 200ms avg): ~$1/month
- EBS gp3 100GB: ~$8/month
- VPC Endpoint (interface): ~$7/month per AZ

Output format:
- "Estimated delta:" total monthly delta in USD
- "Top contributors:" list each resource with its monthly cost
- "Suggested optimizations:" list, or "None"

Be specific. If you suggest a VPC endpoint instead of a NAT gateway, name
the endpoint and the service.
</code></pre>
<p>A real output from a recent change:</p>
<pre><code>Estimated delta: +$71/month

Top contributors:
- aws_nat_gateway.hrr_api_nat (us-east-1a): +$32/month
- aws_nat_gateway.hrr_api_nat (us-east-1b): +$32/month
- aws_db_instance.hrr_api_db (db.t3.small, single AZ): +$25/month
- aws_lambda_function.hrr_worker_fn: ~$1/month

Suggested optimizations:
- This change adds a NAT gateway in two AZs purely so Lambda can reach S3.
  Add a Gateway VPC endpoint for S3 instead (free) and you can drop both
  NAT gateways. Saves ~$64/month plus data processing.
- If hrr_api_db is for staging only, db.t4g.micro at ~$12/month is enough.
</code></pre>
<p>That single finding paid for the time I spent building the routine. I had genuinely forgotten that S3 has a free gateway endpoint, and I was about to provision two NAT gateways to give a Lambda function read access to one bucket.</p>
<p>The IAM and security reviewer is the paranoid one. Its job is to find the things that won't break the plan but will keep you up at night. The prompt is a checklist of common mistakes:</p>
<pre><code class="language-markdown">---
name: iam-security-reviewer
description: Reviews a Terraform plan for IAM, network, and data exposure risks
---

You are a security reviewer. You receive plan.json. Look for:

1. IAM policies with "Action": "*" or "Resource": "*"
2. S3 buckets with public ACLs or missing public access blocks
3. Security groups with 0.0.0.0/0 on any port other than 80/443
4. RDS instances with publicly_accessible = true
5. EC2 instances with http_tokens not explicitly set to "required" (account-level defaults and AMI ImdsSupport settings can affect whether IMDSv1 is accessible)
6. Secrets in environment variables instead of Secrets Manager or SSM
7. CloudFront distributions without WAF
8. Lambda functions with overly broad execution roles

For each finding, give the resource address, the issue, and the fix.

Output format:
- "Findings:" list, or "None"
- For each finding: severity (LOW/MED/HIGH), resource, issue, fix
</code></pre>
<p>A real finding:</p>
<pre><code>Findings:

[HIGH] aws_iam_role_policy.hrr_worker_fn_policy
  Issue: policy grants "s3:*" on "arn:aws:s3:::*". The Lambda only needs
  GetObject and PutObject on a single bucket.
  Fix: scope to s3:GetObject and s3:PutObject on
  arn:aws:s3:::hrr-uploads/* and arn:aws:s3:::hrr-uploads.

[MED] aws_instance.hrr_bastion
  Issue: http_tokens is not explicitly set to "required". Depending on
  account-level IMDSv2 defaults or the AMI ImdsSupport setting, IMDSv1
  may still be reachable.
  Fix: add metadata_options { http_tokens = "required" } to enforce
  IMDSv2 regardless of account or AMI defaults.

[LOW] aws_lambda_function.hrr_worker_fn
  Issue: DATABASE_URL is in environment variables in plaintext.
  Fix: store in Secrets Manager and read at cold start.
</code></pre>
<p>The HIGH one is embarrassingly common. Wildcards creep into IAM policies because they're easy and they work. Having a reviewer that flags every wildcard, every time, has slowly retrained me to write narrower policies up front.</p>
<p><img src="https://images.pexels.com/photos/6120251/pexels-photo-6120251.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="A calculator and security lock representing cost analysis and security review" />
<sub>Photo by <a href="https://www.pexels.com/@n-voitkevich">Nataliya Vaitkevich</a> on <a href="https://www.pexels.com/photo/coins-and-financial-graphs-on-red-background-6120251/">Pexels</a></sub></p>
<h2>Specialist 5: Telegram Summarizer and Putting It All Together</h2>
<p>The summarizer's job is short, take the four reviewers' outputs and turn them into a digest a human will actually read on their phone. No more than ten lines. Lead with the highest severity finding. End with a recommended action.</p>
<p>Here's <code>scripts/run-routine.sh</code>, which is the headless version I use in CI and from cron. It runs all four reviewers in parallel, collects results, then calls the summarizer:</p>
<pre><code class="language-bash">#!/usr/bin/env bash
set -euo pipefail

cd "\((dirname "\)0")/../infra"

terraform init -input=false &gt; /dev/null
terraform plan -out=tfplan -input=false &gt; /dev/null
terraform show -json tfplan &gt; ../plan.json
terraform plan -refresh-only -out=refresh.tfplan -input=false &gt; /dev/null
terraform show -json refresh.tfplan &gt; ../drift.json

cd ..
mkdir -p .routine
rm -f .routine/*.txt

run_agent () {
  local name="$1"
  claude \
    --append-system-prompt "\((cat ".claude/agents/\){name}.md")" \
    --permission-mode default \
    --allowedTools "Read,Glob,Grep,Bash(aws ec2 describe-*),Bash(aws rds describe-*),Bash(aws iam get-*),Bash(aws iam list-*),Bash(aws s3api get-*),Bash(aws cloudfront get-*),Bash(aws cloudfront list-*)" \
    -p "Run your review now. All artifacts are in the current directory." \
    &gt; ".routine/${name}.txt"
}

run_agent terraform-plan-reviewer &amp;
run_agent drift-detector &amp;
run_agent cost-reviewer &amp;
run_agent iam-security-reviewer &amp;
wait

cat .routine/terraform-plan-reviewer.txt \
    .routine/drift-detector.txt \
    .routine/cost-reviewer.txt \
    .routine/iam-security-reviewer.txt &gt; .routine/combined.txt

claude \
  --append-system-prompt "$(cat .claude/agents/telegram-summarizer.md)" \
  --permission-mode default \
  --allowedTools "Read" \
  -p "Summarize the findings in .routine/combined.txt into a Telegram-ready digest." \
  &gt; .routine/summary.txt

bash scripts/post-to-telegram.sh &lt; .routine/summary.txt
</code></pre>
<p>Notice the allowlist. The routine can read files and run read-only AWS describe, get, and list commands, but it cannot run <code>terraform apply</code>, <code>terraform destroy</code>, or mutating AWS CLI calls. The <code>post-to-telegram.sh</code> script is just curl against the Bot API. Two env vars, the bot token and the chat ID, and a POST.</p>
<p>A real Telegram message from a recent run looks like this:</p>
<pre><code>hrr-infra routine, PR #142

Summary: 1 RDS create, 2 SG modifies, 1 Lambda replace.
Cost delta: +$71/month (mostly 2x NAT gateway).
Drift: 1 SG and 1 DB param group changed in console.

[HIGH] s3:* wildcard on hrr_worker_fn role
[MED]  Lambda replacement may DLQ in-flight SQS messages
[LOW]  IMDSv1 may still be reachable on hrr_bastion

Recommended: do NOT apply. Fix wildcard, drain queue, then re-run routine.
</code></pre>
<p>That message lands in my Telegram while I'm in a meeting and I know in fifteen seconds whether to interrupt my afternoon or keep listening.</p>
<p>The same routine runs in CI on every PR. Here's the GitHub Actions workflow at <code>.github/workflows/infra-review.yml</code>:</p>
<pre><code class="language-yaml">name: infra-review
on:
  pull_request:
    paths:
      - "infra/**"
      - ".claude/agents/**"

jobs:
  routine:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_REVIEW_ROLE }}
          aws-region: us-east-1
      - uses: hashicorp/setup-terraform@v3
      - name: Terraform init
        run: cd infra &amp;&amp; terraform init -input=false
      - name: Install Claude Code
        run: npm i -g @anthropic-ai/claude-code
      - name: Run routine
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          TELEGRAM_BOT_TOKEN: ${{ secrets.TELEGRAM_BOT_TOKEN }}
          TELEGRAM_CHAT_ID: ${{ secrets.TELEGRAM_CHAT_ID }}
        run: bash scripts/run-routine.sh
      - name: Comment on PR
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const body = fs.readFileSync('.routine/summary.txt', 'utf8');
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: "## Infra review routine\n\n" + body,
            });
</code></pre>
<p>The AWS role here is read-only. The routine never applies anything. It just describes, plans, and reports. Apply still happens on a separate workflow with a manual approval, after the routine has signed off.</p>
<p>That's the loop. Local interactive run, CI on every PR, and a Telegram summary to my phone. Same five specialists, same prompts, three different surfaces.</p>
<p><img src="https://images.pexels.com/photos/7821762/pexels-photo-7821762.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="A phone showing a chat notification representing a Telegram summary message" />
<sub>Photo by <a href="https://www.pexels.com/@rdne">RDNE Stock project</a> on <a href="https://www.pexels.com/photo/an-alert-message-on-a-cellphone-7821762/">Pexels</a></sub></p>
<h2>Wrapping Up</h2>
<p>Honest tradeoffs first.</p>
<p>The routine uses more tokens than a single session. Four reviewers run with their own context, then the fifth specialist summarizes their findings. For a small plan it's maybe five times the cost of a one-shot review. For a large plan it's roughly the same, because the single session would have re-read the plan several times anyway, just less efficiently.</p>
<p>It's also slower. The four reviewers run in parallel so wall time is bounded by the slowest one, but you're still waiting thirty to ninety seconds for findings instead of getting an instant answer. For a quick local edit, that's annoying. For a real PR, it's fine.</p>
<p>So when do I use the full routine versus just the lead session? Rule of thumb, if I'm changing anything in <code>infra/</code> that touches IAM, networking, or stateful resources, I run the full routine. If I'm bumping a Lambda memory setting or adding a tag, I just use the single session and trust my eyes. The routine is for the changes where being wrong costs money or causes an incident.</p>
<p>The pattern itself is the takeaway. One lead, several narrow specialists, strict output formats, and a summarizer at the end. It's not specific to infrastructure. I have a similar routine for code review on application repos, with a security specialist, a test coverage specialist, a performance specialist, and a docs specialist. Same shape, different prompts.</p>
<p>If you read my earlier post on <a href="https://harun.dev/blog/claude-code-for-aws-infrastructure-agentic-devops-workflow-with-terraform">Claude Code for AWS Infrastructure</a>, this is the natural next step. That post got you to a single competent reviewer. This one gets you to a small team of competent reviewers, all named, all specialized, all running on demand.</p>
<p>Hope you enjoyed this post. If you build your own routine or have ideas for specialists I should add, come tell me on <a href="https://x.com/HarunRRayhan">Twitter</a>. I'd love to see how other people are structuring their multi-agent setups.</p>
