---
title: "How I Review Terraform and Lambda PRs with AI Before They Merge"
canonical_url: "https://harun.dev/blog/production-ai-code-review-for-terraform-and-lambda-prs"
platform: "Medium"
---

I use AI a lot in AWS work, but not in the way people usually expect.

I do not let it make the final decision, and I do not let it approve production changes. I use it to review Terraform and Lambda pull requests before they merge, so I can catch the risky stuff faster.

That means I ask it to look for:

- IAM drift
- destructive Terraform changes
- Lambda runtime or cost problems
- networking exposure
- missing rollback detail

The point is not to automate approval. The point is to surface the right questions before I spend my own time on the manual pass.

## Why this is different from my other AI + AWS posts

I already write about AI-assisted AWS work, Terraform workflows, and agentic DevOps routines. Those posts are about building and structuring work.

This one is about the final review gate before production.

That makes it a different angle, not a duplicate.

## What I feed the reviewer

I give the model the real change surface:

- the PR diff
- Terraform plan output
- the files that changed
- any relevant deployment or environment notes

The more concrete the input, the better the review.

## The checks I care about most

### IAM and permissions

I want the reviewer to notice wildcards, broader service access, cross-environment access, and any policy that looks temporary but is now permanent.

### Lambda runtime and cost

I want it to flag memory jumps, timeout changes, concurrency changes, and anything that may hurt cold starts.

### Terraform replacement risk

I want it to call out resources marked for replacement and anything stateful that may be destroyed and recreated.

### Networking and exposure

I want it to be loud about public exposure, ingress/egress changes, security groups, and route changes with hidden blast radius.

### Missing operational detail

I want it to ask for rollback plan, test evidence, migration order, observability impact, and failure behavior.

## My manual pass still matters

AI helps me move faster, but it does not make the decision.

I still review blast radius, intent, rollback realism, and release order. If the model cannot explain why something is risky, I treat that as a prompt to investigate, not as a verdict.

## Final thought

AI review is valuable when it makes the risky part easier to see.

That is the version of AI-assisted AWS work I trust: the model helps me review the change, and I decide whether the merge is safe.

*Originally published on [harun.dev](https://harun.dev/blog/production-ai-code-review-for-terraform-and-lambda-prs).*