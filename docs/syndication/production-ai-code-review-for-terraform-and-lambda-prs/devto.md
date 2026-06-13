---
title: "How I Review Terraform and Lambda PRs with AI Before They Merge"
canonical_url: "https://harun.dev/blog/production-ai-code-review-for-terraform-and-lambda-prs"
platform: "Dev.to"
---

A lot of people use AI to *write* code faster.

I use it to do a first-pass review of Terraform and Lambda pull requests before they merge.

That is a different problem. Writing is about speed. Review is about avoiding expensive mistakes. In an AWS codebase, the mistakes that hurt most are usually not syntax errors. They are permission drift, destructive Terraform changes, bad runtime settings, surprise cost jumps, or a change that quietly widens exposure.

So my workflow is simple:

- let AI summarize the diff in plain English
- ask it to rank the risks
- make it call out suspicious resources or lines
- then do my own manual pass on the risky parts

The AI is not approving the merge. It is helping me focus.

## Why this is not the same as my other AI + AWS posts

I already write about AI-assisted AWS work, Terraform, and agentic DevOps. Those posts are about how I build and structure work.

This one is narrower: *the final review gate before production*.

That matters because the questions are more concrete:

- Did the IAM policy get broader?
- Did the Lambda memory or timeout change in a way that feels wrong?
- Is Terraform about to replace a stateful resource?
- Did we accidentally expose a network path?
- Did the PR forget rollback notes or testing evidence?

That is the kind of review AI is actually useful for.

## What I feed the reviewer

I do not ask the model to guess from vibes.

I give it the real change surface:

- PR diff
- Terraform plan output
- touched files
- environment context
- any release notes or incident context that matters

The result is much better when the model sees the actual plan and diff instead of a vague request like “review this change.”

## The checks I care about most

### IAM and permissions

This is always first on my list.

I want the reviewer to notice:

- new wildcards in actions or resources
- broader service access than before
- cross-environment access
- policies that look temporary but are now permanent

### Lambda runtime and cost impact

Small Lambda changes can still be expensive.

I want the reviewer to flag:

- memory jumps that look unjustified
- timeout changes that feel too aggressive or too loose
- concurrency changes that may trigger throttling or burst issues
- dependency changes that increase cold starts

### Terraform replacement risk

This is where safe-looking changes can surprise you.

I want the model to call out:

- resources marked for replacement
- stateful resources with destructive paths
- name changes that force recreation
- anything that may disappear briefly during deploy

### Networking and exposure

Anything around public access or routing deserves extra attention.

I want the reviewer to be loud about:

- newly public endpoints
- ingress or egress changes
- security group drift
- load balancer or API Gateway changes with hidden blast radius

### Missing operational detail

A PR can be technically correct and still be incomplete.

I want the reviewer to ask about:

- rollback plan
- tests
- migration order
- monitoring impact
- what happens if deploy fails halfway

## My manual pass still matters

AI helps me move faster, but I still make the decision.

My manual review focuses on:

- blast radius
- whether the change matches intent
- whether rollback is realistic
- whether the diff makes sense in the bigger release plan

If the model says “safe” but cannot explain why, I do not trust it.

## The prompt shape

I want something like this:

```text
You are reviewing a production AWS change.

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
5. a merge recommendation: safe, caution, or block
```

That keeps the review concise and useful.

## Final thought

AI review works best when it improves judgment, not when it replaces it.

That is the whole point of this workflow. I want the speed, but I want it inside a process that still respects the cost of being wrong in production.

If you are using AI in AWS work, I would start there: let it help you review the risky stuff first.

*Originally published on [harun.dev](https://harun.dev/blog/production-ai-code-review-for-terraform-and-lambda-prs).*