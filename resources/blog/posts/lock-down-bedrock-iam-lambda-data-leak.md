---
title: "How I Lock Down Bedrock Access So My Lambda Functions Can't Leak Data Through the LLM"
slug: "lock-down-bedrock-iam-lambda-data-leak"
brief: "How to scope Bedrock IAM policies per Lambda function, build permission boundaries that block privilege escalation, catch misconfigurations with CloudTrail, and automate guardrails in CI so AI agents can't widen your blast radius."
publishedAt: "2026-07-11T18:00:00.000Z"
draft: false
readTimeInMinutes: 9
coverImageUrl: "/blog-assets/lock-down-bedrock-iam-lambda-data-leak/cover.jpg"
reactionCount: 0
responseCount: 0
replyCount: 0
tags:
  - name: AWS
    slug: aws
  - name: Bedrock
    slug: bedrock
  - name: IAM
    slug: iam
  - name: Security
    slug: security
  - name: Lambda
    slug: lambda
  - name: DevOps
    slug: devops
---

<p>Every Bedrock setup I've inherited starts the same way. One Lambda execution role, one IAM policy, and <code>bedrock:InvokeModel</code> scoped to <code>Resource: "*"</code>. It works on day one. Every function in the account can call every model in every region, and nobody thinks twice about it because the demo runs fine.</p>
<p>I got burned by this about two months ago. A staging Lambda that was supposed to just tokenize incoming support tickets somehow ended up calling our production Claude endpoint with a prompt built from live customer records. Nobody wired that up on purpose. The function shared an execution role with three other Lambdas, one of which did legitimately need Bedrock access, and the wildcard resource let every function in that role ride along for free. I found out from a CloudTrail log, not from a test failing.</p>
<p>That's the thing about Bedrock and IAM. Bedrock itself doesn't leak data. Your IAM policy does, by being too generous about who gets to ask it questions.</p>
<p>This post walks through how I actually fixed it. Scoped IAM policies per function, a permission boundary that blocks privilege escalation, and the CloudTrail query that caught the wrong function mid-call. Then a gitleaks rule for hardcoded model ARNs and a CI check that fails the build before any of this ships again.</p>
<h2>Why "It Has bedrock:InvokeModel" Isn't Good Enough</h2>
<p>Most Bedrock IAM policies I see look like this:</p>
<pre><code class="language-json">{
  &quot;Version&quot;: &quot;2012-10-17&quot;,
  &quot;Statement&quot;: [
    {
      &quot;Effect&quot;: &quot;Allow&quot;,
      &quot;Action&quot;: [&quot;bedrock:InvokeModel&quot;, &quot;bedrock:InvokeModelWithResponseStream&quot;],
      &quot;Resource&quot;: &quot;*&quot;
    }
  ]
}</code></pre>
<p>It's not wrong, exactly. It's just way too much trust for one function. <code>Resource: "*"</code> means the Lambda can call Claude, Nova, Titan, Llama, whatever model exists in whatever region the account has enabled. Anthropic's models aren't cheap per token, and if a compromised dependency or a bad prompt injection gets code execution inside that function, it now has a paid API to every foundation model AWS offers. That's not a hypothetical. It's the exact blast radius every pentest report on LLM apps flags first.</p>
<p>The fix isn't complicated. It's just tedious, which is probably why most people skip it. Every Lambda that talks to Bedrock gets its own role, and that role gets a policy scoped to exactly one model ARN, one region, and one action. Nothing shared, nothing inherited.</p>
<h2>One Function, One Model, One Region</h2>
<p>Here's the actual policy I run for a summarization Lambda that only ever needs Claude Sonnet:</p>
<pre><code class="language-hcl">resource &quot;aws_iam_policy&quot; &quot;hrr_bedrock_invoke_claude_only&quot; {
  name        = &quot;hrr-bedrock-invoke-claude-scoped&quot;</code></pre>
<p>policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "InvokeClaudeSonnetOnly"
        Effect   = "Allow"
        Action   = "bedrock:InvokeModel"
        Resource = "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-sonnet-4-6-v1:0"
        Condition = {
          StringEquals = {
            "aws:RequestedRegion" = "us-east-1"
          }
        }
      }
    ]
  })
}</p>
<p>resource "aws_iam_role" "hrr_summarizer_lambda" {
  name               = "hrr-summarizer-lambda-role"
  assume_role_policy = data.aws_iam_policy_document.hrr_lambda_assume.json
}</p>
<p>resource "aws_iam_role_policy_attachment" "hrr_summarizer_bedrock" {
  role       = aws_iam_role.hrr_summarizer_lambda.name
  policy_arn = aws_iam_policy.hrr_bedrock_invoke_claude_only.arn
}
```</p>
<p>No <code>InvokeModelWithResponseStream</code> unless the function actually streams. No second model "just in case we swap providers later." If a function needs Nova Micro for a cheaper, lower-stakes task, it gets its own role with its own scoped policy pointing at the Nova ARN. Yes, that means more Terraform. It also means a compromised summarizer Lambda can ask Claude Sonnet exactly one thing and nothing else, in exactly one region, and every other model in the account is simply unreachable from that credential.</p>
<p>The region condition matters more than people assume. Bedrock model access is enabled per region, and I've seen teams accidentally leave a model enabled in a region nobody uses for anything except cost surprises and a wider attack surface. Pinning <code>aws:RequestedRegion</code> closes that off even if the model gets enabled somewhere else later.</p>
<h2>The Permission Boundary That Stops Privilege Escalation</h2>
<p>Scoped policies handle the Bedrock side. They don't stop someone, or something, from attaching a second, more permissive policy to that same role later. That's what a permission boundary is for. It's a ceiling that caps what any policy attached to the role can ever grant, no matter how the role gets modified down the line.</p>
<pre><code class="language-hcl">resource &quot;aws_iam_policy&quot; &quot;hrr_lambda_bedrock_boundary&quot; {</code></pre>
<p>policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid         = "DenyNonApprovedModels"
        Effect      = "Deny"
        Action      = ["bedrock:InvokeModel", "bedrock:InvokeModelWithResponseStream"]
        NotResource = "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-sonnet-4-6-v1:0"
      },
      {
        Sid    = "DenyIamSelfEscalation"
        Effect = "Deny"
        Action = [
          "iam:CreatePolicy",
          "iam:CreatePolicyVersion",
          "iam:AttachRolePolicy",
          "iam:PutRolePolicy",
          "iam:DeleteRolePermissionsBoundary"
        ]
        Resource = "*"
      }
    ]
  })
}</p>
<p>resource "aws_iam_role" "hrr_summarizer_lambda" {
  name                 = "hrr-summarizer-lambda-role"
  permissions_boundary = aws_iam_policy.hrr_lambda_bedrock_boundary.arn
  assume_role_policy   = data.aws_iam_policy_document.hrr_lambda_assume.json
}
```</p>
<p>That last statement is the one people forget. Without <code>iam:DeleteRolePermissionsBoundary</code> denied, an attacker (or an overly helpful AI coding agent, which is honestly the more likely case in my day to day) with <code>iam:*</code> access could just remove the boundary and grant itself whatever it wants. Deny that action explicitly, on every role that carries a boundary, or the boundary is decorative.</p>
<p>I'll admit the boundary felt like overkill the first time I wrote it. Then I watched an agent try to widen a Bedrock policy to <code>Resource: "*"</code> in a PR because a test was failing and the wildcard was the fastest way to make it pass. The boundary caught it at apply time instead of at 2am in production. That's when it stopped feeling like overkill.</p>
<h2>The CloudTrail Query That Caught the Wrong Function</h2>
<p>Scoped policies only work going forward. To catch what's already happening, I run this against CloudTrail via CloudWatch Logs Insights, filtered to the log group CloudTrail writes to:</p>
<pre><code>fields @timestamp, userIdentity.arn, requestParameters.modelId, sourceIPAddress
| filter eventSource = &quot;bedrock.amazonaws.com&quot;
| filter eventName = &quot;InvokeModel&quot;
| filter userIdentity.arn not like /hrr-summarizer-lambda-role/
| filter requestParameters.modelId = &quot;anthropic.claude-sonnet-4-6-v1:0&quot;
| sort @timestamp desc
| limit 50</code></pre>
<p>This is the query that actually caught the staging Lambda I mentioned earlier. The role in the results wasn't <code>hrr-summarizer-lambda-role</code>, it was a shared <code>hrr-tickets-shared-role</code> that three unrelated functions were all using. That role had <code>bedrock:InvokeModel</code> on <code>Resource: "*"</code> left over from an early prototype, and a staging function nobody had scoped down was quietly calling production Claude with staging data that included real customer emails.</p>
<p>I turned that query into a scheduled EventBridge rule that runs it every fifteen minutes and posts to a Slack channel if it returns anything. Nothing fancy, just a Lambda that runs the Logs Insights query via the SDK and checks if the result set is non-empty. It's caught two more misconfigurations since, both from roles that were shared across functions for no better reason than "it was already there."</p>
<h2>The gitleaks Rule for Hardcoded Model ARNs</h2>
<p>The IAM side is solved. The other leak I kept finding was in test code, of all places. Someone writing an integration test would hardcode a foundation model ARN directly into a fixture instead of pulling it from a Terraform output or an env var, and six months later that ARN is stale, pointing at a model version that got deprecated, or worse, it's pointing at a more expensive model than the test actually needs because someone copy-pasted it from a different function's config.</p>
<p>I added a custom rule to our <code>.gitleaks.toml</code> to flag it:</p>
<pre><code class="language-toml">[[rules]]
id = &quot;hardcoded-bedrock-model-arn&quot;
description = &quot;Bedrock foundation model ARN hardcoded instead of sourced from Terraform output or env var&quot;
regex = '''arn:aws:bedrock:[a-z0-9-]+::foundation-model/[a-zA-Z0-9\.\-:]+'''</code></pre>
<p>[[rules.allowlist]]
paths = ['''infra/.*\.tf''']
```</p>
<p>The allowlist matters here. Terraform files are allowed to reference model ARNs directly, that's the source of truth. Everything else, test fixtures, seed scripts, notebooks someone left in the repo, gets flagged. It's a small rule, but it's caught more issues than I expected, mostly agent-generated test code that hardcodes whatever ARN it saw in a nearby file rather than importing the actual constant.</p>
<h2>The CI Check That Blocks the Merge</h2>
<p>None of the above matters if a wildcard Bedrock policy can still slip through in a PR. So the last piece is a GitHub Actions job that runs on every PR touching <code>infra/</code>, parses the Terraform plan as JSON, and fails the build if any Bedrock IAM statement grants a wildcard resource.</p>
<pre><code class="language-yaml">name: bedrock-iam-guard
on:
  pull_request:
    paths:</code></pre>
<p>jobs:
  validate-bedrock-policies:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4</p>
<ul>
  <li>uses: hashicorp/setup-terraform@v3</li>
</ul>
<ul>
  <li>name: Terraform plan as JSON</li>
</ul>
<ul>
  <li>name: Fail on wildcard Bedrock resources</li>
</ul>
<p>And the guard script itself, which walks every <code>aws_iam_policy</code> resource change in the plan and checks for wildcard resources on Bedrock actions:</p>
<pre><code class="language-python">import json</code></pre>
<p>plan = json.load(open(sys.argv[1]))
violations = []</p>
<p>for change in plan.get("resource_changes", []):
    if change["type"] != "aws_iam_policy":
        continue</p>
<p>after = change["change"].get("after") or {}
    raw_policy = after.get("policy")
    if not raw_policy:
        continue</p>
<p>policy = json.loads(raw_policy)
    for stmt in policy.get("Statement", []):
        actions = stmt.get("Action", [])
        actions = [actions] if isinstance(actions, str) else actions</p>
<p>resources = stmt.get("Resource", [])
        resources = [resources] if isinstance(resources, str) else resources</p>
<p>is_bedrock = any(a.startswith("bedrock:") for a in actions)
        has_wildcard = "*" in resources</p>
<p>if is_bedrock and has_wildcard:
            violations.append(
                f"{change['address']}: wildcard Resource on a bedrock:* action"
            )</p>
<p>if violations:
    print("Bedrock IAM guard failed:")
    for v in violations:
        print(f"  - {v}")
    sys.exit(1)</p>
<p>print("Bedrock IAM guard passed, no wildcard resources found.")
```</p>
<p>This is the check that would have stopped the agent-generated wildcard I mentioned earlier before it ever reached a Terraform apply. It has no idea whether a scoped policy points at the right model, and it doesn't need to. All it does is turn "Resource: *" on a Bedrock action into a hard failure instead of something a reviewer has to spot by eye in a 300-line diff, which, if I'm honest, is exactly the kind of thing I miss when I'm reviewing my fifth PR of the day.</p>
<h2>What This Actually Buys You</h2>
<p>None of this stops a determined attacker with full account access. That's not the threat model. The threat model is the much more common one: a shared role that grew too permissive over a few sprints, a test fixture with a stale ARN, an agent that widened a policy to unblock itself, a staging function that should never have touched production data. Scoped policies, a permission boundary, a CloudTrail alert, and a CI gate close off almost all of that, and they cost nothing extra to run since Bedrock's per-token pricing doesn't change based on how tightly you've scoped the IAM around it.</p>
<p>The tedious part is doing this per function instead of per account. I won't pretend that's fun. But the alternative is finding out about a misconfigured role from a CloudTrail log after the fact, which is a much worse way to spend a Tuesday.</p>
<p>Hope this saves you the debugging session it cost me. If you're locking down Bedrock access on your own stack, I'd like to hear what you found, come tell me on Twitter at <a href="https://x.com/HarunRRayhan">@HarunRRayhan</a>.</p>
