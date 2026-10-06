---
title: "Terraform or Pulumi, Pick From the Team You Have"
slug: "terraform-or-pulumi"
brief: "Both tools preview a change, apply it, and write state. The figure runs that loop. The buttons are the only choice that has mattered on my teams."
publishedAt: "2099-06-01T18:00:00.000Z"
draft: true
draftToken: "4172d8f219888e9f4fe3b324c86cc6f2"
readTimeInMinutes: 8
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

<p>Both tools do the same loop. You describe the resources. You preview. You apply. State records what actually exists. The figure plays that loop in both columns. The buttons underneath are the question I ask first.</p>

<div data-blog-activity="terraform-vs-pulumi"></div>

<h2>State does not care which CLI wrote it</h2>

<p>A Terraform state file can hold database passwords, access keys, and a map of the account. A Pulumi stack file can hold the same class of values. Switching tools does not delete that file. It renames it.</p>

<p>I wrote up the Terraform side in <a href="/blog/terraform-state-more-sensitive-than-env">Why Your Terraform State Is More Sensitive Than Your .env File</a>. The rules transfer. Keep state out of git, lock it, and limit who can read it. For Terraform I use an S3 backend and a lock. For Pulumi I use a backend I can restrict the same way, not a laptop.</p>

<h2>Preview is the review</h2>

<p><code>terraform plan</code> and <code>pulumi preview</code> are the diff. I do not apply from a laptop against production without that diff in the pull request. The language of the description changes who can read the diff. It does not remove the need for one.</p>

<pre><code class="language-hcl">resource "aws_s3_bucket" "hrr_uploads" {
  bucket = "hrr-uploads-example"
}
</code></pre>

<pre><code class="language-typescript">const hrrUploads = new aws.s3.Bucket("hrrUploads", {
  bucket: "hrr-uploads-example",
});
</code></pre>

<p>Same bucket. One is HCL the whole team already reviews. The other sits in the app repo next to the code that calls it.</p>

<h2>The team you already have</h2>

<p>If the people who review infrastructure write HCL, stay on Terraform. A TypeScript program is a worse review when half the reviewers do not write TypeScript. Pulumi's win shows up when the same people already own the app and the account, and they want loops, types, and a shared repo.</p>

<p>I have used both. The outages I remember came from state that anyone could read, and from an apply that nobody previewed. They did not come from the extension on the file.</p>

<p>Hope you enjoyed this one. If your team is mid-argument about this, find me on X at https://x.com/harundotdev.</p>
