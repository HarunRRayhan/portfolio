---
title: "Add Lightsail Load Balancer to Application hosted in Amazon Lightsail instance(s)"
slug: "add-lightsail-load-balancer-to-application-hosted-in-amazon-lightsail-instances"
brief: "Lightsail offers Load Balancer. It's very easy to provision one and attach one or multiple instances to it. Let's create one and attach instances to it.
Prerequisites
You need one or more Amazon Lightsail instances to attach to the load balancer in ..."
publishedAt: "2022-05-28T11:02:53.352Z"
readTimeInMinutes: 3
reactionCount: 0
responseCount: 0
replyCount: 0
sourceUrl: "https://web.archive.org/web/*/https://blog.harun.dev/add-lightsail-load-balancer-to-application-hosted-in-amazon-lightsail-instances"
coverImageUrl: "/blog-assets/add-lightsail-load-balancer-to-application-hosted-in-amazon-lightsail-instances/cover.png"
tags:
  - name: "AWS"
    slug: "aws"
  - name: "ec2"
    slug: "ec2"
  - name: "Cloud"
    slug: "cloud"
  - name: "Beginner Developers"
    slug: "beginners"
  - name: "Amazon Web Services"
    slug: "amazon-web-services"
---
<p>Lightsail offers Load Balancer. It's very easy to provision one and attach one or multiple instances to it. Let's create one and attach instances to it. </p>
<h2 id="heading-prerequisites">Prerequisites</h2>
<p>You need one or more Amazon Lightsail instances to attach to the load balancer in the same region. You can create it by following <a target="_blank" href="https://harun.dev/blog/deploy-laravel-application-to-amazon-lightsail"><strong>Deploy Laravel Application to Amazon Lightsail</strong></a> or  <a target="_blank" href="https://harun.dev/blog/deploy-wordpress-app-to-amazon-lightsail"><strong>Deploy WordPress App to Amazon Lightsail</strong></a></p>
<blockquote>
<p>⚠️ Warning: Amazon Light Load Balancer going to cost you <strong>USD$18/month</strong>. It has no pre-tier available. Be sure before going to provision one. You can check the whole article before creating.</p>
</blockquote>
<h2 id="heading-provision-a-load-balanced">Provision a Load Balanced</h2>
<ol>
<li><p>Go to the homepage of the Amazon Lightsail console. Click on the <strong>Networking</strong> tab and click on the <strong>Create load balancer</strong> button.
<img src="/blog-assets/add-lightsail-load-balancer-to-application-hosted-in-amazon-lightsail-instances/YhPj7TMSKh.png" alt="CleanShot 2022-05-28 at 16.02.40@2x.png" /></p>
</li>
<li><p>You are in the Create a Load balancer screen like this 👇
<img src="/blog-assets/add-lightsail-load-balancer-to-application-hosted-in-amazon-lightsail-instances/ZhwhaDAYk.png" alt="CleanShot 2022-05-28 at 16.04.46@2x.png" /></p>
<ul>
<li>A. Change your region to where your instances are. My instances are in Virginia.</li>
<li>B. Give it a name, and</li>
<li>C. Hit the <strong>Create load balancer</strong> button from the bottom.</li>
</ul>
</li>
<li><p>Load balancer will be created in a moment and you should land on the Load balancer page.</p>
</li>
</ol>
<h2 id="heading-attach-instances-to-the-load-balance">Attach instances to the Load balance</h2>
<ol>
<li><p>Go to the homepage again and then click the <strong>Networking</strong> tab. You should see Loadbalancer(s) including the one just created. Click on the name of the Load balancer.
<img src="/blog-assets/add-lightsail-load-balancer-to-application-hosted-in-amazon-lightsail-instances/IrgiatFzx.png" alt="CleanShot 2022-05-28 at 16.13.01@2x.png" /></p>
</li>
<li><p>Our load balancer doesn't have any attached instance(s) yet, we are going to attach one or more. Select your instance in the Target instances section.
<img src="/blog-assets/add-lightsail-load-balancer-to-application-hosted-in-amazon-lightsail-instances/tow7uBR8v.png" alt="CleanShot 2022-05-28 at 16.15.02@2x.png" />
I just have one in this region. You should see all of the instances you have in the region where the load balancer is provisioned. </p>
</li>
<li><p>Confirm the attachment of your instance
<img src="/blog-assets/add-lightsail-load-balancer-to-application-hosted-in-amazon-lightsail-instances/-HlrPCaJl.png" alt="CleanShot 2022-05-28 at 16.19.15@2x.png" /></p>
</li>
<li><p>Do the same process until you attached all of your target instances. </p>
</li>
<li><p>Go to Load balancer URL (<strong>DNS name</strong>) and you should see your application.
<img src="/blog-assets/add-lightsail-load-balancer-to-application-hosted-in-amazon-lightsail-instances/h0TDAs9G8.png" alt="CleanShot 2022-05-28 at 16.26.00@2x.png" /></p>
</li>
</ol>
<blockquote>
<p>ℹ️ If you don't see the desired page, check your application or other tools (Apache, Nginx, etc.) setting. </p>
</blockquote>
<h2 id="heading-add-domain-or-sub-domain">Add Domain or Sub-Domain</h2>
<ol>
<li><p>You can create DNS Zone in Lightsail for your domain and configure it. <a target="_blank" href="https://lightsail.aws.amazon.com/ls/docs/en_us/articles/add-alias-record-for-lightsail-load-balancer">Follow this to add your domain/sub-domain</a>.</p>
</li>
<li><p>You can add the Load balancer URL (<strong>DNS name</strong>) as A record in your domain's DNS control panel.</p>
</li>
</ol>
<h2 id="heading-enable-https">Enable HTTPS</h2>
<ol>
<li>Go to the <strong>Inbound traffic</strong> tab of your Load balancer setting.
<img src="/blog-assets/add-lightsail-load-balancer-to-application-hosted-in-amazon-lightsail-instances/badvd2GAs.png" alt="CleanShot 2022-05-28 at 16.35.34@2x.png" /><ul>
<li>A. Create an SSL certificate for your domain by clicking the <strong>Create certificate +</strong> button.</li>
<li>B. You should see all of the created certificates in the <strong>SSL/TLS certificate</strong> list and select the one you just created. </li>
<li>C. Optionally, you can Redirect from HTTP to HTTPS. (After enabling the HTTPS).</li>
</ul>
</li>
</ol>
<h2 id="heading-conclusion">Conclusion</h2>
<p>Hope you enjoyed this short article. You can subscribe to my newsletter, and follow me on <a target="_blank" href="https://twitter.com/HarunRRayhan">Twitter</a> and <a target="_blank" href="https://dev.to/harunrrayhan">Dev.to</a>. </p>
