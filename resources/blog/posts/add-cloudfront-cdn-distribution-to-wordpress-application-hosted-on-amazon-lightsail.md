---
title: "Add (Cloudfront) CDN Distribution to WordPress Application hosted on Amazon Lightsail"
slug: "add-cloudfront-cdn-distribution-to-wordpress-application-hosted-on-amazon-lightsail"
brief: "It's not very hard to add CDN Distribution to a WordPress app hosted on Amazon Lightsail. But if you are new, it can be cumbersome. This article is to demonstrate how to do it easily.
Why Should I use CDN distribution?
You might hear about Content D..."
publishedAt: "2022-05-10T11:37:20.793Z"
readTimeInMinutes: 3
reactionCount: 0
responseCount: 1
replyCount: 1
sourceUrl: "https://web.archive.org/web/*/https://blog.harun.dev/add-cloudfront-cdn-distribution-to-wordpress-application-hosted-on-amazon-lightsail"
coverImageUrl: "https://cdn.hashnode.com/res/hashnode/image/upload/v1652182542368/i0cqnGMMJ.png"
tags:
  - name: "AWS"
    slug: "aws"
  - name: "WordPress"
    slug: "wordpress"
  - name: "CDN"
    slug: "cdn"
  - name: "Amazon Web Services"
    slug: "amazon-web-services"
  - name: "Beginner Developers"
    slug: "beginners"
---
<p>It's not very hard to add CDN Distribution to a WordPress app hosted on Amazon Lightsail. But if you are new, it can be cumbersome. This article is to demonstrate how to do it easily. </p>
<h2 id="heading-why-should-i-use-cdn-distribution">Why Should I use CDN distribution?</h2>
<p>You might hear about Content Delivery Network (CDN). If not, here is an article explaining "<a target="_blank" href="https://www.cloudflare.com/en-gb/learning/cdn/what-is-a-cdn/">what is CDN?</a>". </p>
<p>If you are not interested to read a long article, here is TL;DR:
In CDN, Lots of small servers run closer to your customer. Content gets cached there and served from the closer server(s) of your customer. In that way, ease the pressure from the main servers. </p>
<h2 id="heading-what-is-cdn-distribution">What is CDN Distribution?</h2>
<p>It is the Amazon Lightsail CDN service. Under the hood, it uses Amazon Cloudfront. It has 300+ points of presence to deliver content closer to your customers. On top of that, it comes with AWS Shield, which protects infrastructure from DDoS attacks. </p>
<p>Are you excited to create your first CDN Distribution? Let's go 🏃‍♂️</p>
<h2 id="heading-prerequisites">Prerequisites</h2>
<h3 id="heading-wordpress-application">WordPress Application</h3>
<p>You need to have an existing WordPress application for this tutorial. Don't worry if you don't have one. I covered How to <strong><a target="_blank" href="https://harun.dev/blog/deploy-wordpress-app-to-amazon-lightsail">Deploy WordPress Application to Amazon Lightsail</a></strong> in the first part of this series. </p>
<h3 id="heading-attach-a-static-ip-to-wordpress-instance">Attach a Static IP to WordPress Instance</h3>
<ol>
<li><p>Go to the <strong>Networking</strong> tab  and then click on <strong>Create static IP</strong>
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1652105796032/ZIYg4ZWz8.png" alt="Create static IP on Amazon Lightsail" /></p>
</li>
<li><p>(A) Select the WP App instance. (B) Give it a meaningful name and (C) Hit <strong>Create</strong>.
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1652106216696/ZDKxefs2H.png" alt="Create static IP on Amazon Lightsail 2" /></p>
</li>
</ol>
<p>Now we are ready to create our first distributions.</p>
<h2 id="heading-create-cdn-distribution">Create CDN Distribution</h2>
<ol>
<li><p>Go to <a target="_blank" href="https://lightsail.aws.amazon.com/ls/webapp/home/networking">home page</a> of Lightsail. Go to <strong>Network</strong> tab again. This time hit the <strong>Create distribution</strong> button.
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1652106732159/UaCC5eSiv.png" alt="Create CDN Distribution on Amazon Lightsail" /></p>
</li>
<li><p>Select the WordPress Instance as Origin
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1652106891069/W12TgIi-k.png" alt="Amazon Lightsail CDN Distribution Origin" /></p>
</li>
<li><p>Hit <strong>Yes, apply</strong> to apply the predefined WordPress settings
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1652107873667/piEvwljg1.png" alt="Amazon Lightsail CDN Distribution WordPress" /></p>
</li>
<li><p>Now, (A) choose a plan. (B) Give it a name and (C) Hit <strong>Create Distribution</strong> button
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1652107795929/Sf65bVVmN.png" alt="CleanShot 2022-05-09 at 20.37.34@2x.png" /></p>
</li>
</ol>
<p>Woohoo 🎉 Your first distribution is created. Wait for a while to be available. After getting done, you will see this 👇
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1652108794268/3BeQBMUzu.png" alt="Amazon Lightsail CDN Cloudfront Distribution " />
(A) Your domain for the distribution. You can access the site using this URL.</p>
<h2 id="heading-domain">Domain</h2>
<h3 id="heading-update-the-domain-in-db">Update the Domain in DB</h3>
<p>Login to your WordPress application's database, you may follow <a target="_blank" href="https://harun.dev/blog/deploy-wordpress-app-to-amazon-lightsail#heading-import-database">this</a>. Update the <code>siteurl</code> and <code>home</code> to your <code>wp_options</code> table to your distribution domain. </p>
<h2 id="heading-bonus">Bonus</h2>
<ol>
<li><p>You can use a custom domain instead of CloudFront's sub-domain. You may follow <a target="_blank" href="https://lightsail.aws.amazon.com/ls/docs/en_us/articles/amazon-lightsail-enabling-distribution-custom-domains">this tutorial</a>.</p>
</li>
<li><p>You can add Object Storage to your WordPress app with a CDN distribution by following <a target="_blank" href="https://aws.amazon.com/getting-started/hands-on/object-storage-cdn/">this tutorial</a>.</p>
</li>
</ol>
<h2 id="heading-conclusion">Conclusion</h2>
<p>Hope you enjoyed this simple article and created your first CDN distribution. Ask your questions in the comment. Subscribe to get the next blog post. Thanks 🙏 </p>
