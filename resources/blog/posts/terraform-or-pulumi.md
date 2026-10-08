---
title: "Terraform or Pulumi, Pick From the Team You Have"
slug: "terraform-or-pulumi"
brief: "Both tools preview a change, apply it, and write state. Two terminals show the same deploy. Pick from the team that has to review it."
publishedAt: "2099-06-01T18:00:00.000Z"
draft: true
draftToken: "4172d8f219888e9f4fe3b324c86cc6f2"
readTimeInMinutes: 13
coverImageUrl: "/blog-assets/terraform-or-pulumi/cover.jpg"
reactionCount: 0
responseCount: 0
replyCount: 0
tags:
  - name: Terraform
    slug: terraform
  - name: AWS
    slug: aws
  - name: Devops
    slug: devops
---

<p>The argument started as a logo fight. Terraform on one side, Pulumi on the other, as if the cloud would behave once we picked the right binary.</p>

<p>Both tools do the same loop. You describe the resources. You preview. You apply. State records what actually exists. The two terminals below run that deploy side by side for the same S3 bucket. Speed and reset sit at the bottom.</p>

<div data-blog-activity="terraform-vs-pulumi"></div>

<h2>The loop is the product</h2>

<p>I stop people when the debate is only about HCL versus TypeScript. The product is the loop:</p>

<table>
<thead>
<tr>
<th>Step</th>
<th><span style="display:inline-flex;align-items:center;gap:0.4rem"><img src="/images/logos/tech/terraformio-icon.svg" alt="" width="18" height="18" style="margin:0;border:0;border-radius:0;box-shadow:none;display:inline-block;vertical-align:middle" /> Terraform</span></th>
<th><span style="display:inline-flex;align-items:center;gap:0.4rem"><img src="/images/logos/tech/pulumi-logo.svg" alt="" width="18" height="18" style="margin:0;border:0;border-radius:0;box-shadow:none;display:inline-block;vertical-align:middle" /> Pulumi</span></th>
<th>What you are checking</th>
</tr>
</thead>
<tbody>
<tr>
<td>Describe</td>
<td><code>main.tf</code> / modules</td>
<td><code>index.ts</code> (or Python, Go, …)</td>
<td>Desired state is readable by the people who must review it</td>
</tr>
<tr>
<td>Preview</td>
<td><code>terraform plan</code></td>
<td><code>pulumi preview</code></td>
<td>Creates, updates, and deletes before anything changes</td>
</tr>
<tr>
<td>Apply</td>
<td><code>terraform apply</code></td>
<td><code>pulumi up</code></td>
<td>Cloud APIs run with credentials you intended</td>
</tr>
<tr>
<td>State</td>
<td><code>terraform.tfstate</code> (remote)</td>
<td>stack state (remote)</td>
<td>Real IDs, and often secrets, stay locked down</td>
</tr>
</tbody>
</table>

<p>Miss the preview and you get surprise destroys. Miss the state lock and two applies race. Miss who can read state and you leak database passwords. The CLI brand does not fix those.</p>

<h2>Same bucket, two descriptions</h2>

<p>Here is an S3 bucket both ways. Prefixes stay <code>hrr_</code>.</p>

<pre><code class="language-hcl">resource "aws_s3_bucket" "hrr_uploads" {
  bucket = "hrr-uploads-example"

  tags = {
    Project = "hrr-demo"
  }
}
</code></pre>

<pre><code class="language-typescript">import * as aws from "@pulumi/aws";

const hrrUploads = new aws.s3.Bucket("hrrUploads", {
  bucket: "hrr-uploads-example",
  tags: {
    Project: "hrr-demo",
  },
});
</code></pre>

<p>Same object in AWS after apply. The review question is who can read the diff in the pull request. If half the reviewers do not write TypeScript, the Pulumi preview is noise. If the app team already owns the account and the repo, HCL is the foreign language.</p>

<h2>State does not care which CLI wrote it</h2>

<p>Both tools need a memory of what they created. That memory is more sensitive than a <code>.env</code> file, and switching CLIs does not delete the risk. It renames the file.</p>

<h3>The Terraform state caveat</h3>

<p><code>terraform.tfstate</code> is JSON that maps your configuration to real cloud objects. After an apply it commonly holds:</p>

<ul>
  <li>resource IDs, ARNs, and relationships across the stack</li>
  <li>database usernames and passwords passed as resource arguments</li>
  <li>IAM access key secrets Terraform created</li>
  <li>private keys from the TLS provider</li>
  <li>API tokens, webhook URLs, and Lambda environment variables</li>
</ul>

<p>Marking a variable <code>sensitive = true</code> hides it from normal CLI output. It does not remove the value from state. Terraform needs those attributes to plan the next diff. Treat every production state snapshot as if it contains credentials, even when last month's file looked clean. Providers change. Modules grow. A data source you used while debugging can leave a secret behind.</p>

<p>Two operators applying at once without a lock can corrupt that file. A state file in git, in a CI artifact, or in a bucket every developer can read is a credential dump with a map of your account attached. I wrote the fuller Terraform treatment in <a href="/blog/terraform-state-more-sensitive-than-env">Why Your Terraform State Is More Sensitive Than Your .env File</a>.</p>

<p>My minimum remote backend looks like this:</p>

<pre><code class="language-hcl">terraform {
  backend "s3" {
    bucket       = "hrr-terraform-state"
    key          = "demo/production/terraform.tfstate"
    region       = "us-east-1"
    encrypt      = true
    use_lockfile = true
  }
}
</code></pre>

<p>Dedicated bucket. Encryption on. Lock on. Read access only for the people and CI roles that must run plan and apply. Not the uploads bucket. Not a laptop copy "just for today."</p>

<h3>The Pulumi equivalent</h3>

<p>Pulumi's equivalent is <strong>stack state</strong>. Same job as Terraform state: remember which cloud objects belong to this stack so the next preview and up are honest.</p>

<p>Where it lives depends on the backend you chose: Pulumi Cloud, an S3/DIY backend, or another supported store. The product name changes. The contents do not get safer. Stack state still carries resource identities and can carry secrets from configuration and provider outputs. Pulumi can encrypt secret values in state and config, which is useful. Encryption at rest is not the same as "anyone on the team can download the stack export."</p>

<p>So I apply the same rules:</p>

<ul>
  <li>Do not keep stack state on a developer laptop as the source of truth.</li>
  <li>Use a remote backend you can lock and audit.</li>
  <li>Limit who can read the stack, export it, or decrypt secrets.</li>
  <li>Prefer a passphrase or KMS-backed secrets provider you control, not a shared Slack password.</li>
</ul>

<p>What is <em>not</em> the same: the file format, the CLI commands, and the migration path. You do not "rename" <code>terraform.tfstate</code> into a Pulumi stack and call it done. Importing or rebuilding state is a project of its own. The caveat that transfers is the security model, not the bytes on disk.</p>

<p>In the terminals above, both sides end on a locked remote state line for a reason. The green "1 added" / "1 created" is incomplete until that record is somewhere you would trust with a production password.</p>

<h2>Preview is the review</h2>

<p><code>terraform plan</code> and <code>pulumi preview</code> are the diff. I do not apply from a laptop against production without that diff in the pull request. CI should run the preview on every change that touches infra. Humans read the create/update/delete list. The language of the description changes who can read it. It does not remove the need for one.</p>

<p>When the plan says destroy on a database, stop. When the preview is empty and you expected a change, stop. The green "1 added" / "1 created" lines in the terminals only show up after that gate. Apply is only honest after it.</p>

<h2>Which one should you pick?</h2>

<p>Pick from the team you have, not the conference talk you liked.</p>

<ul>
  <li><strong>Stay on Terraform</strong> when infrastructure reviewers already write and review HCL, when you have a module library that works, and when operators live in the Terraform workflow.</li>
  <li><strong>Choose Pulumi</strong> when the same people already own the app and the account, when loops and types would cut real duplication, and when the preview will be read by TypeScript (or Python) developers.</li>
</ul>

<p>I have used both. The outages I remember came from state that anyone could read, and from an apply that nobody previewed. They did not come from the extension on the file.</p>

<p>Hope you enjoyed this one. If your team is mid-argument about this, find me on X at <a href="https://x.com/harundotdev" target="_blank" rel="noopener noreferrer">https://x.com/harundotdev</a>, and grab every other link from my bio at <a href="https://harun.dev/bio" target="_blank" rel="noopener noreferrer">https://harun.dev/bio</a>.</p>
