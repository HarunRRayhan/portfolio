---
title: "How I Review Terraform and Lambda PRs with AI Before They Merge"
slug: "production-ai-code-review-for-terraform-and-lambda-prs"
brief: "How I use AI as a first-pass reviewer for Terraform and Lambda pull requests, while keeping human judgment on the risky parts"
publishedAt: "2026-06-03T11:40:10.168Z"
readTimeInMinutes: 9
reactionCount: 0
responseCount: 0
replyCount: 0
coverImageUrl: "/blog-assets/production-ai-code-review-for-terraform-and-lambda-prs/cover.svg"
sourceUrl: "https://web.archive.org/web/*/https://blog.harun.dev/production-ai-code-review-for-terraform-and-lambda-prs"
tags:
  - name: "AWS"
    slug: "aws"
  - name: "AI"
    slug: "ai"
  - name: "Devops"
    slug: "devops"
  - name: "Terraform"
    slug: "terraform"
  - name: "Lambda"
    slug: "lambda"
---
<p>If my earlier posts were about how I <em>write</em> infrastructure and how I <em>build</em> AI-assisted workflows, this one is about the gate right before merge.</p>
<p>That distinction matters. Writing code with AI is useful. Reviewing production changes with AI is where the real value shows up for me. The problem is not getting a first draft fast. The problem is making sure the change is still safe when it touches IAM, Terraform state, Lambda runtime settings, or anything that can quietly cost money or break production.</p>
<p>So I started using AI as a first-pass reviewer for Terraform and Lambda pull requests. Not as the decision maker. Not as the person who approves the merge. Just as the reviewer that helps me catch the obvious and semi-obvious issues before I spend my own time on the full manual pass.</p>
<p>That keeps the review fast, but it also keeps the final responsibility where it belongs, with me.</p>
<p>This post is the workflow I trust today.</p>
<p><strong>Short version:</strong> AI reviews the diff, I review the risk.</p>

<h2>Why This Is a Different Post From My Other AI and AWS Articles</h2>
<p>I already write about AI in AWS codebases, Terraform workflows, and agentic DevOps routines. This post is not another version of that same story.</p>
<p>The earlier posts focus on one of two things:</p>
<ul>
  <li>how I use AI to help build infrastructure</li>
  <li>how I structure the workflow around the codebase</li>
</ul>
<p>This one is narrower. It is about reviewing a production change before it merges.</p>
<p>That narrower scope makes it more useful in practice, because the questions are more specific:</p>
<ul>
  <li>Did this IAM policy get broader?</li>
  <li>Did someone accidentally make a Lambda slower, hotter, or more expensive?</li>
  <li>Did Terraform replace something that should not be replaced?</li>
  <li>Did we open a networking path we did not mean to open?</li>
  <li>Did the PR forget tests, docs, or rollback notes?</li>
</ul>
<p>That is the kind of review AI is actually good at helping with.</p>

<h2>What I Feed the Reviewer</h2>
<p>I do not ask the model to guess from thin air. I give it the actual change surface.</p>
<p>Typically that means some mix of:</p>
<ul>
  <li>the pull request diff</li>
  <li>the Terraform plan output</li>
  <li>the files touched by the change</li>
  <li>the environment or service context</li>
  <li>any recent deployment or incident notes that matter</li>
</ul>
<p>The quality of the review depends on the input. If I give it a sloppy prompt, I get a sloppy review. If I give it the real plan and the real diff, it can usually spot the things I want it to spot.</p>
<p>I want the reviewer to answer a simple question: <strong>what would make this change risky to merge?</strong></p>

<h2>The Checks I Care About Most</h2>
<p>For Terraform and Lambda work, I care about a small set of risk categories more than anything else.</p>

<h3>1. IAM and permissions</h3>
<p>This is the first thing I look at because permission creep is easy to miss in a diff. A policy can go from narrow to broad with one extra wildcard or one extra resource pattern.</p>
<p>I want AI to flag:</p>
<ul>
  <li>new wildcards in actions or resources</li>
  <li>roles that gained access to more services than before</li>
  <li>policies that look temporary but are actually permanent</li>
  <li>anything that could grant access across environments</li>
</ul>

<h3>2. Lambda runtime and cost impact</h3>
<p>Lambda changes can look tiny and still affect cost or reliability.</p>
<p>I want the reviewer to notice things like:</p>
<ul>
  <li>memory jumps that are probably unnecessary</li>
  <li>timeouts that are too short or too generous</li>
  <li>concurrency changes that might cause throttle or burst issues</li>
  <li>extra cold-start risk from dependencies or packaging changes</li>
</ul>

<h3>3. Terraform replacement risk</h3>
<p>This is where production changes can become unpleasant. A harmless-looking refactor can trigger a destroy-and-recreate path if someone changes the wrong attribute.</p>
<p>I want the model to call out:</p>
<ul>
  <li>resources marked for replacement</li>
  <li>stateful resources with a destructive path</li>
  <li>name changes that will force recreation</li>
  <li>security groups, targets, or buckets that could disappear briefly</li>
</ul>

<h3>4. Networking and exposure</h3>
<p>Anything that changes public access, private access, VPC wiring, or routing deserves extra attention.</p>
<p>I want the reviewer to be loud about:</p>
<ul>
  <li>public exposure that was not there before</li>
  <li>new ingress or egress paths</li>
  <li>load balancer or API Gateway routing changes</li>
  <li>subnet or security group edits with hidden blast radius</li>
</ul>

<h3>5. Missing operational detail</h3>
<p>Even if the code is correct, the review is not complete if the PR forgot the operational side.</p>
<p>So I want AI to ask about:</p>
<ul>
  <li>rollback plan</li>
  <li>testing evidence</li>
  <li>migration order</li>
  <li>monitoring and alert impact</li>
  <li>what happens if this fails halfway through</li>
</ul>

<h2>What I Still Review Manually</h2>
<p>AI helps me move faster, but some things should stay human-led.</p>
<p>My manual pass focuses on:</p>
<ul>
  <li>the actual blast radius</li>
  <li>whether the change matches product intent</li>
  <li>whether rollback is realistic</li>
  <li>what stateful resources are involved</li>
  <li>whether the diff makes sense in the larger release plan</li>
</ul>
<p>I also sanity-check anything that looks too confident. If the model says a change is safe, that is not enough. I want the evidence behind the claim.</p>
<p>The best outcome is not “AI approved it.” The best outcome is “AI surfaced the right questions before I reviewed it.”</p>

<h2>My Review Flow</h2>
<p>The flow is pretty simple.</p>
<ol>
  <li>Collect the PR diff and Terraform plan.</li>
  <li>Ask the AI reviewer to summarize the change in plain English.</li>
  <li>Ask for the top risks, sorted by severity.</li>
  <li>Ask for anything that looks inconsistent or missing.</li>
  <li>Do my own manual pass on the flagged areas.</li>
  <li>Approve, request changes, or split the PR if the risk is too broad.</li>
</ol>
<p>That sounds basic, but it works because it keeps the review structured.</p>
<p>Here is the kind of prompt I use conceptually:</p>
<pre><code class="language-text">You are reviewing a production AWS change.

Focus on:
- IAM and permissions
- Terraform replacement risk
- Lambda runtime and cost impact
- networking and exposure
- missing rollback or operational detail

Return:
1. plain-English summary of the change
2. top risks ranked by severity
3. specific lines or resources that look suspicious
4. questions I should answer before merge
5. a merge recommendation: safe, caution, or block</code></pre>
<p>I do not need poetry from the reviewer. I need a compact risk report I can act on.</p>

<h2>A Good Review Finds the Questions, Not Just the Bugs</h2>
<p>Sometimes the most useful thing the AI does is not catch a mistake outright. It points out that something deserves a question.</p>
<p>Examples:</p>
<ul>
  <li>Why did this Lambda need double the memory?</li>
  <li>Why is this IAM role suddenly allowed to touch more than one environment?</li>
  <li>Why does this Terraform change replace the resource instead of updating it in place?</li>
  <li>Why is this public endpoint now reachable from a wider range of traffic?</li>
</ul>
<p>That kind of review is valuable because it slows me down in the right place. It makes the risky bit visible before I merge.</p>

<h2>Why This Complements My Other AI Workflow Posts</h2>
<p>If I compare this to my other posts, the shape is different.</p>
<p>Earlier posts are about:</p>
<ul>
  <li>using AI to build faster</li>
  <li>breaking work into specialists</li>
  <li>keeping agents safe in production codebases</li>
</ul>
<p>This one is about the final gate before the change goes live.</p>
<p>That is why I think it is a good companion piece instead of a duplicate. It belongs in the same family, but it answers a different question.</p>
<p>One post is about the tools that help me work. This post is about the review layer that keeps me honest.</p>

<h2>What I Want the Reviewer To Avoid</h2>
<p>There are a few failure modes I do not want from an AI reviewer.</p>
<ul>
  <li>Do not rubber-stamp the diff.</li>
  <li>Do not hide uncertainty behind confident language.</li>
  <li>Do not recommend merge without explaining why.</li>
  <li>Do not ignore infrastructure changes just because the application code looks small.</li>
  <li>Do not treat production Terraform like toy code.</li>
</ul>
<p>If the model cannot explain the risk, it is not helping much.</p>

<h2>Final Thought</h2>
<p>AI review works best when it makes the important things easier to see, not when it replaces judgment.</p>
<p>That is the real pattern I keep coming back to in AWS work. I want speed, but I want it inside a review process that still respects the cost of being wrong.</p>
<p>So yes, I use AI to review Terraform and Lambda PRs. But the point is not to automate approval. The point is to catch the risky stuff earlier, ask better questions, and make the human review sharper.</p>
<p>That is the version I trust in production.</p>
