---
title: "Why You Should Use S3 Presigned URLs to Upload Big Static Files"
slug: "why-s3-presigned-urls"
brief: "A 2 GB video, an API that starts multipart and signs each part, and a browser that uploads those parts straight to S3."
publishedAt: "2099-06-01T18:00:00.000Z"
draft: true
draftToken: "9383e96dda32884b6cbeb006fd6c4024"
readTimeInMinutes: 13
coverImageUrl: "/blog-assets/why-s3-presigned-urls/cover-v5.jpg"
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

<p>A 2 GB video. Someone needed it on S3 from a phone. The fast fix was a bucket policy with <code>Principal: "*"</code>. The upload worked. So did every other key in the bucket, for as long as that policy stayed.</p>

<p>A pre-signed URL is the narrower tool. For a file this size you do not sign one giant PUT. The API starts a multipart upload, signs each part, and the browser PUTs those parts straight to S3. The object stays private. The figure below is that cycle as a small game: watch the parts land, or lock Browser or API and see what each side does.</p>

<figure>
  <img src="/blog-assets/why-s3-presigned-urls/diagram-multipart-architecture.jpg" alt="Architecture: the browser asks your API for four signed part URLs, PUTs each 512 MB part straight to a private S3 bucket, then your API completes the multipart upload. The 2 GB never passes through the API" width="2000" height="1000" loading="eager" decoding="async" />
  <figcaption>Your API only signs and completes. The 2 GB of bytes go from the browser to S3 and never pass through the API.</figcaption>
</figure>

<p>The figure starts when it is on screen. First the API creates the multipart upload and signs the part URLs. Then the browser uploads Part 1 through Part 4 of the 2 GB video. Then the API completes the upload so S3 assembles the object. Choose Browser or API and it stays on that side. Click the selected one again to return to the full cycle. Speed and reset sit at the bottom.</p>

<div data-blog-activity="s3-presigned-url"></div>

<h2>Why the API should not carry the file</h2>

<p>The tempting shape is: browser posts the video to your API, the API writes it to S3 with the AWS SDK, and you call it done. That shape breaks once the file is measured in gigabytes.</p>

<p>API Gateway has a hard 10 MB payload limit. A Lambda behind it times out at 15 minutes and still has to hold the body while it streams to S3. You pay for the ingress into the API and the egress out to S3. A small EC2 or container box has the same problem: two hops, double bandwidth, and a socket that dies when the phone drops wifi mid-upload.</p>

<p>The other failure mode is credentials. If the browser talks to S3 with a long-lived access key, that key leaves your VPC. A pre-signed part URL is temporary permission for one part. The IAM secret never ships to the client.</p>

<h2>The requests that make a multipart cycle</h2>

<p>A 2 GB video is not one PUT. S3 multipart splits it into parts (minimum 5 MB except the last part). In the figure I use four parts of about 512 MB each so you can see them stack.</p>

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
<td>JSON: filename, content type, size</td>
<td>Nothing yet</td>
</tr>
<tr>
<td>2</td>
<td>Your API → S3 + signing library</td>
<td><code>CreateMultipartUpload</code>, then SigV4 over each <code>UploadPart</code></td>
<td>An open multipart upload id</td>
</tr>
<tr>
<td>3</td>
<td>Browser → S3</td>
<td>PUT part 1…N to each signed URL (~512 MB each)</td>
<td>Parts land with ETags</td>
</tr>
<tr>
<td>4</td>
<td>Browser → your API → S3</td>
<td>Part numbers + ETags</td>
<td><code>CompleteMultipartUpload</code> assembles the 2 GB object</td>
</tr>
</tbody>
</table>

<p>Steps 1, 2, and 4 are small on purpose. The API checks auth, picks a key like <code>uploads/hrr_export/2026-10-08/video.mp4</code>, opens the multipart upload, and returns signed part URLs. Step 3 is the only place the video bytes go. In the figure, the Lambda column is the signing and the complete. The Browser column plus the part bars on S3 are the uploads. The final 2 GB bar is the assembled object.</p>

<p>If you lock Browser before any multipart session has started, the figure shows a 403. That matches a real bucket with Block Public Access on and no signature in the query string.</p>

<h2>How each part signature is built</h2>

<p>The API holds the IAM credentials. The browser does not. Each part URL is Signature Version 4 over a specific <code>UploadPart</code> request: method, bucket, key, upload id, part number, region, time window, and the headers you chose to sign.</p>

<p>You will see the usual query params on every part URL:</p>

<ul>
  <li><code>X-Amz-Algorithm</code>: always <code>AWS4-HMAC-SHA256</code> for SigV4.</li>
  <li><code>X-Amz-Credential</code>: access key id, date, region, service (<code>s3</code>), and the literal <code>aws4_request</code>.</li>
  <li><code>X-Amz-Date</code>: when the signature was created, in UTC.</li>
  <li><code>X-Amz-Expires</code>: lifetime in seconds from that date. Parts of a 2 GB video need enough time for a slow mobile link. I still keep this in minutes or a couple of hours, not days.</li>
  <li><code>X-Amz-SignedHeaders</code>: which headers were part of the string to sign. Often just <code>host</code> for part uploads.</li>
  <li><code>X-Amz-Signature</code>: the hex HMAC. Change the part number, the upload id, or the key and S3 rejects that part.</li>
</ul>

<p>The upload id from <code>CreateMultipartUpload</code> ties the parts together. A signature for part 2 will not write part 3. A complete call with the wrong ETag list fails. That is the point: each URL is one part of one object, not a key to the bucket.</p>

<h2>The API that starts multipart and signs the parts</h2>

<p>This is the shape I use with the AWS SDK for JavaScript v3. The handler never sees the video body.</p>

<pre><code class="language-typescript">import {
  S3Client,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

const hrr_s3 = new S3Client({ region: "us-east-1" });
const HRR_BUCKET = process.env.HRR_UPLOAD_BUCKET!;
const HRR_PART_COUNT = 4;

export async function hrr_createMultipartUpload(input: {
  filename: string;
  contentType: string;
}) {
  const uploadId = randomUUID();
  const key = `uploads/${uploadId}/${input.filename}`;

  const created = await hrr_s3.send(
    new CreateMultipartUploadCommand({
      Bucket: HRR_BUCKET,
      Key: key,
      ContentType: input.contentType,
    }),
  );

  const multipartUploadId = created.UploadId!;
  const partUrls: string[] = [];

  for (let partNumber = 1; partNumber &lt;= HRR_PART_COUNT; partNumber += 1) {
    const command = new UploadPartCommand({
      Bucket: HRR_BUCKET,
      Key: key,
      UploadId: multipartUploadId,
      PartNumber: partNumber,
    });

    partUrls.push(await getSignedUrl(hrr_s3, command, { expiresIn: 3600 }));
  }

  return {
    key,
    uploadId: multipartUploadId,
    partUrls,
    partCount: HRR_PART_COUNT,
    expiresIn: 3600,
  };
}

export async function hrr_completeMultipartUpload(input: {
  key: string;
  uploadId: string;
  parts: { ETag: string; PartNumber: number }[];
}) {
  await hrr_s3.send(
    new CompleteMultipartUploadCommand({
      Bucket: HRR_BUCKET,
      Key: input.key,
      UploadId: input.uploadId,
      MultipartUpload: { Parts: input.parts },
    }),
  );
}</code></pre>

<p><code>getSignedUrl</code> builds the canonical request for each part, derives the signing key from the IAM secret, and appends the <code>X-Amz-*</code> query params. The role on this Lambda needs <code>s3:CreateMultipartUpload</code>, <code>s3:UploadPart</code> (for signing), and <code>s3:CompleteMultipartUpload</code> on that prefix. It does not need to read the video bytes.</p>

<h2>The browser that uploads the parts</h2>

<p>The browser slices the 2 GB file, PUTs each slice to its signed URL, and keeps the ETag S3 returns. No AWS SDK in the client. The query string is the auth.</p>

<pre><code class="language-typescript">async function hrr_uploadVideoParts(
  file: File,
  partUrls: string[],
) {
  const partSize = Math.ceil(file.size / partUrls.length);
  const parts: { ETag: string; PartNumber: number }[] = [];

  for (let index = 0; index &lt; partUrls.length; index += 1) {
    const start = index * partSize;
    const blob = file.slice(start, start + partSize);
    const response = await fetch(partUrls[index], {
      method: "PUT",
      body: blob,
    });

    if (!response.ok) {
      throw new Error(`Part ${index + 1} failed: ${response.status}`);
    }

    const etag = response.headers.get("ETag");
    if (!etag) {
      throw new Error(`Part ${index + 1} missing ETag`);
    }

    parts.push({ ETag: etag, PartNumber: index + 1 });
  }

  return parts;
}</code></pre>

<p>After every part succeeds, the browser posts the ETag list back to your API so it can call <code>CompleteMultipartUpload</code>. Until that call, S3 still holds loose parts, not a finished object. If the phone dies mid-upload, you can resume from the next missing part instead of restarting the whole 2 GB.</p>

<p>CORS still matters. The bucket needs a rule that allows <code>PUT</code> from your origin, and it must expose <code>ETag</code> so the browser can read it. The pre-signed URL does not replace CORS. It replaces long-lived credentials.</p>

<h2>Is this secure?</h2>

<p>Yes, when you keep the bucket private and you treat each part URL as a short-lived ticket for one slice of one object. It is more secure than shipping IAM keys to Chrome, and more secure than opening the bucket with <code>Principal: "*"</code>.</p>

<p>It is not magic. A leaked part URL still lets whoever has it upload that one part until expiry. Security here is narrow permission plus a short clock, not "the URL is secret forever."</p>

<h2>How?</h2>

<p>The IAM access key and secret stay on the API. Chrome only receives signed URLs. Those URLs encode SigV4 over a fixed request: this bucket, this key, this multipart upload id, this part number, this expiry. Change any of those and the signature stops matching, so S3 returns 403.</p>

<p>That is what the figure is showing. Lock Browser before the API has signed anything and S3 denies the upload. After the API signs, Chrome can PUT parts, but it still cannot list the bucket, read other keys, or complete the multipart upload without another call that only the API is allowed to make.</p>

<p>A few habits keep that promise honest:</p>

<ul>
  <li>Leave Block Public Access on. Do not open the bucket to make the upload "just work."</li>
  <li>Sign only the part numbers you need. Prefer one set of part URLs per upload attempt.</li>
  <li>Keep <code>X-Amz-Expires</code> short enough for a slow mobile upload, not for a week of Slack forwards.</li>
  <li>On cancel or failure, call <code>AbortMultipartUpload</code> so incomplete parts do not sit around.</li>
  <li>Treat a pasted part URL like a temporary password for one slice. Log when you mint them.</li>
</ul>

<p>A part URL will not list objects. It will not write a different key or a different part number. It will not switch from PUT to GET or DELETE. Completing or aborting the multipart upload stays on the API.</p>

<h2>Keep the bucket private</h2>

<p>I do not open the bucket to get a 2 GB video uploaded. A public bucket would accept those PUTs tomorrow, and every other key too. Block Public Access on the account is there because this fix keeps coming back.</p>

<p>I still make an object public when it is meant to be public: a cover image, a package on a CDN, something I would put on a website without a login. A customer's video export is not that. Upload with pre-signed multipart parts. Read it later with a short-lived pre-signed GET, or serve it through CloudFront with an origin access control. Those are separate decisions from the upload.</p>

<p>The 2 GB video in the figure goes from Chrome to S3 in parts. The API holds the key, starts the multipart upload, signs each part, completes the object, and stays out of the byte path. That is the whole reason to use pre-signed URLs for big static files: narrow permission, resumable parts, no proxy in the middle.</p>

<p>Hope you enjoyed this one. If a multipart part has bitten you on a missing <code>ETag</code> header in CORS, find me on X at <a href="https://x.com/harundotdev" target="_blank" rel="noopener noreferrer">https://x.com/harundotdev</a>, and grab every other link from my bio at <a href="https://harun.dev/bio" target="_blank" rel="noopener noreferrer">https://harun.dev/bio</a>.</p>
