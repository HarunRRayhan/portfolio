---
title: "Why You Should Use S3 Presigned URLs to Upload Big Static Files"
slug: "why-s3-presigned-urls"
brief: "A 240 MB static file, an API request that signs one PUT, and a browser upload that never passes through the API."
publishedAt: "2099-06-01T18:00:00.000Z"
draft: true
draftToken: "9383e96dda32884b6cbeb006fd6c4024"
readTimeInMinutes: 11
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

<p>A pre-signed URL is the narrower tool. The API request signs one PUT. The browser uploads the big file straight to S3. The object stays private. The figure below is that cycle as a small game: watch it run, or lock Browser or API and see what each side actually does.</p>

<p>The figure starts when it is on screen. First the API request signs the PUT. Then the browser uploads the 240 MB file. Choose Browser or API and it stays on that side. Click the selected one again to return to the full cycle. Speed and reset sit at the bottom.</p>

<div data-blog-activity="s3-presigned-url"></div>

<h2>Why the API should not carry the file</h2>

<p>The tempting shape is: browser posts the file to your API, the API writes it to S3 with the AWS SDK, and you call it done. That shape breaks once the file is a few hundred megabytes.</p>

<p>API Gateway has a hard 10 MB payload limit. A Lambda behind it times out at 15 minutes and still has to hold the body in memory while it streams to S3. You pay for the ingress into the API and the egress out to S3. A small EC2 or container box has the same problem: two hops, double bandwidth, and a socket that dies when the phone drops wifi mid-upload.</p>

<p>The other failure mode is credentials. If the browser talks to S3 with a long-lived access key, that key leaves your VPC. A pre-signed URL is temporary permission for one request. The IAM secret never ships to the client.</p>

<h2>The two requests that make the cycle</h2>

<p>There are two HTTP requests. Only one of them moves the 240 MB.</p>

<table>
<thead>
<tr>
<th>Step</th>
<th>Who</th>
<th>What moves</th>
<th>What S3 sees</th>
</tr>
</thead>
<tbody>
<tr>
<td>1</td>
<td>Browser → your API</td>
<td>JSON: key, content type, maybe a job id</td>
<td>Nothing yet</td>
</tr>
<tr>
<td>2</td>
<td>Your API → signing library</td>
<td>SigV4 over a PUT for that key</td>
<td>Nothing yet</td>
</tr>
<tr>
<td>3</td>
<td>Browser → S3</td>
<td>The 240 MB body on a PUT to the signed URL</td>
<td>One object write, then 200</td>
</tr>
</tbody>
</table>

<p>Step 1 is small on purpose. The API checks auth, picks a key like <code>uploads/hrr_export/2026-10-07.zip</code>, and returns a URL. Step 3 is the only place the bytes go. In the figure, the API column is step 1 and 2. The Browser column plus the green 240 MB bar on S3 is step 3.</p>

<p>If you lock Browser before any sign has landed, the figure shows a 403. That matches a real bucket with Block Public Access on and no signature in the query string.</p>

<h2>How the signature is built</h2>

<p>The API holds the IAM credentials. The browser does not. The signature is Signature Version 4 over a specific request: method, bucket, key, region, time window, and the headers you chose to sign.</p>

<p>You will see that in the query string after the API returns the URL:</p>

<ul>
  <li><code>X-Amz-Algorithm</code>: always <code>AWS4-HMAC-SHA256</code> for SigV4.</li>
  <li><code>X-Amz-Credential</code>: access key id, date, region, service (<code>s3</code>), and the literal <code>aws4_request</code>.</li>
  <li><code>X-Amz-Date</code>: when the signature was created, in UTC.</li>
  <li><code>X-Amz-Expires</code>: lifetime in seconds from that date. I use minutes for uploads, not days.</li>
  <li><code>X-Amz-SignedHeaders</code>: which headers were part of the string to sign. Often <code>host</code> and <code>content-type</code>.</li>
  <li><code>X-Amz-Signature</code>: the hex HMAC. Change the key, the method, or a signed header and this value no longer matches, so S3 rejects the PUT.</li>
</ul>

<p>For a PUT, sign <code>Content-Type</code> if you care what lands in the object. If you leave it out of the signed headers, a client can upload <code>application/octet-stream</code> under a key you thought was a zip. I set the type on the command when I sign, and I make the browser send the same header on the PUT.</p>

<p>An upload link I handed out does not need to work next week. Five to fifteen minutes is enough for a 240 MB file on a normal connection. Longer windows are more time for a leaked URL to be reused.</p>

<h2>The API that signs the PUT</h2>

<p>This is the shape I use with the AWS SDK for JavaScript v3. The handler never sees the file body.</p>

<pre><code class="language-typescript">import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

const hrr_s3 = new S3Client({ region: "us-east-1" });
const HRR_BUCKET = process.env.HRR_UPLOAD_BUCKET!;

export async function hrr_createUploadUrl(input: {
  filename: string;
  contentType: string;
}) {
  const uploadId = randomUUID();
  const key = `uploads/${uploadId}/${input.filename}`;

  const command = new PutObjectCommand({
    Bucket: HRR_BUCKET,
    Key: key,
    ContentType: input.contentType,
  });

  const uploadUrl = await getSignedUrl(hrr_s3, command, { expiresIn: 900 });

  return {
    uploadId,
    key,
    uploadUrl,
    expiresIn: 900,
  };
}</code></pre>

<p><code>getSignedUrl</code> builds the canonical request, derives the signing key from the IAM secret, and appends the <code>X-Amz-*</code> query params. The role on this Lambda only needs <code>s3:PutObject</code> on that prefix. It does not need <code>s3:GetObject</code> or <code>s3:ListBucket</code> for the upload path.</p>

<h2>The browser that uploads the file</h2>

<p>The browser takes the URL and PUTs the bytes. No AWS SDK in the client. No Authorization header of your own. The query string is the auth.</p>

<pre><code class="language-typescript">async function hrr_uploadStaticFile(
  uploadUrl: string,
  file: File,
) {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type || "application/octet-stream",
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error(`S3 upload failed: ${response.status}`);
  }
}</code></pre>

<p>That <code>Content-Type</code> has to match what you signed. A mismatch is a common 403 that looks like a CORS problem until you compare the signed headers with the request that left the browser.</p>

<p>CORS still matters. The bucket needs a rule that allows <code>PUT</code> from your origin, and it must expose enough headers for the browser to read the status. The pre-signed URL does not replace CORS. It replaces long-lived credentials.</p>

<h2>What the URL does not cover</h2>

<p>The URL is not a key to the bucket. It will not list objects. It will not PUT a different key. It will not switch from PUT to GET or DELETE. Each of those needs its own signature, or IAM on a server you control.</p>

<p>It is also not a secret you can paste into a ticket and forget. Anyone who has the URL can perform that one operation until <code>X-Amz-Expires</code> passes. Treat a leaked link like a temporary password for one object. Log when you mint them. Prefer one URL per upload attempt, not one URL shared across a team chat.</p>

<p>For files much larger than a few hundred megabytes, or uploads that have to resume after a dropped connection, move to multipart upload with pre-signed part URLs. The idea is the same: the API signs, the browser talks to S3, credentials stay server-side. The figure stays on a single PUT because that is the path most static exports actually take.</p>

<h2>Keep the bucket private</h2>

<p>I do not open the bucket to get a big static file uploaded. A public bucket would accept that PUT tomorrow, and every other key too. Block Public Access on the account is there because this fix keeps coming back.</p>

<p>I still make an object public when it is meant to be public: a cover image, a package on a CDN, something I would put on a website without a login. A customer's export is not that. Upload with a pre-signed PUT. Read it later with a short-lived pre-signed GET, or serve it through CloudFront with an origin access control. Those are separate decisions from the upload.</p>

<p>The 240 MB file in the figure goes from the browser to S3. The API request signs the PUT and then gets out of the way. That is the whole reason to use a pre-signed URL for big static files: one narrow permission, one object, no proxy in the middle.</p>

<p>Hope you enjoyed this one. If a pre-signed PUT has bitten you on <code>Content-Type</code>, find me on X at https://x.com/harundotdev.</p>
