# LinkedIn teaser

I published a new post on my site:

*How I Review Terraform and Lambda PRs with AI Before They Merge*

The angle is simple: I use AI as a first-pass reviewer for production AWS changes, but the human still makes the merge decision.

The reviewer looks for:
- IAM drift
- destructive Terraform changes
- Lambda runtime and cost issues
- networking exposure
- missing rollback detail

This is not about letting AI approve production. It is about surfacing the risky part faster so the manual review is sharper.

Read it here:
https://harun.dev/blog/production-ai-code-review-for-terraform-and-lambda-prs