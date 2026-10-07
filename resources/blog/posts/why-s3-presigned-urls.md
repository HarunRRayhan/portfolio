---
title: "Why You Should Use S3 Presigned URLs to Upload Big Static Files"
slug: "why-s3-presigned-urls"
brief: "A 240 MB static file, an API request that signs one PUT, and a browser upload that never passes through the API."
publishedAt: "2099-06-01T18:00:00.000Z"
draft: true
draftToken: "9383e96dda32884b6cbeb006fd6c4024"
readTimeInMinutes: 7
coverImageUrl: "/blog-assets/why-s3-presigned-urls/cover.jpg"
reactionCount: 0
responseCount: 0
replyCount: 0
tags:
  - name: AWS
    slug: aws
  - name: S3
    slug: s3
  - name: Security
    slug: security
---

<p>A 240 MB zip, a video, a pile of images. That is a static file. Someone needed it on S3 from a phone. The fast fix was a bucket policy with <code>Principal: "*"</code>. The upload worked. So did every other key in the bucket, for as long as that policy stayed.</p>

<p>A pre-signed URL is the narrower tool. The API request signs one PUT. The browser uploads the big file straight to S3. The object stays private.</p>

<p>The figure runs that cycle when it is on screen. First the API request signs the PUT. Then the browser uploads the 240 MB file. Choose Browser or API and it stays on that side. Speed and reset sit at the bottom.</p>

<div data-blog-activity="s3-presigned-url"></div>

<h2>What the signature covers</h2>

<p>The API holds the IAM credentials. The browser does not. The signature is SigV4 over a specific request: the method, the bucket, the key, the time, and the signed headers.</p>

<p>You will see that in the query string. <code>X-Amz-Algorithm</code>, <code>X-Amz-Credential</code>, <code>X-Amz-Date</code>, <code>X-Amz-Expires</code>, <code>X-Amz-SignedHeaders</code>, and <code>X-Amz-Signature</code>. Change the key, the method, or a signed header and S3 rejects it.</p>

<p>For a PUT, sign <code>Content-Type</code> if you care what lands in the object. If you leave it out, a client can upload a different type under the same key. I set the expiry in minutes, not days. An upload link I handed out does not need to work next week.</p>

<h2>What it does not cover</h2>

<p>The URL is not a key to the bucket. It will not list objects. It will not PUT a different key. It will not switch from PUT to GET or DELETE.</p>

<p>It is also not a secret you can paste into a ticket and forget. Anyone who has the URL can perform that one operation until <code>X-Amz-Expires</code> passes. Treat a leaked link like a temporary password for one object.</p>

<h2>The public object</h2>

<p>I do not open the bucket to get a big static file uploaded. A public bucket would accept that PUT tomorrow, and every other key too. Block Public Access on the account is there because this fix keeps coming back.</p>

<p>I still make an object public when it is meant to be public: a cover image, a package on a CDN, something I would put on a website without a login. A customer's export is not that.</p>

<p>The 240 MB file in the figure goes from the browser to S3. The API request signs the PUT and then gets out of the way. That matters once the file is a few hundred megabytes. Proxying it through a Lambda or a small EC2 box is how you pay for bandwidth twice and time out on the way.</p>

<p>Hope you enjoyed this one. If a pre-signed PUT has bitten you on <code>Content-Type</code>, find me on X at https://x.com/harundotdev.</p>
