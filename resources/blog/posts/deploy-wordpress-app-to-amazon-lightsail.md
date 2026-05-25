---
title: "Deploy WordPress App to Amazon Lightsail"
slug: "deploy-wordpress-app-to-amazon-lightsail"
brief: "Introduction
AWS Lightsail can be the easiest entry to the AWS Cloud. It has fixed monthly pricing unlike most other services, so you don't have to worry about a huge monthly bill. 
Lightsail is really great for small to medium apps. It has out-of-th..."
publishedAt: "2022-04-27T15:00:52.149Z"
readTimeInMinutes: 5
reactionCount: 0
responseCount: 0
replyCount: 0
sourceUrl: "https://web.archive.org/web/*/https://blog.harun.dev/deploy-wordpress-app-to-amazon-lightsail"
coverImageUrl: "https://cdn.hashnode.com/res/hashnode/image/upload/v1651104172787/Y-kiHOYsl.png"
tags:
  - name: "AWS"
    slug: "aws"
  - name: "Amazon Web Services"
    slug: "amazon-web-services"
  - name: "WordPress"
    slug: "wordpress"
  - name: "development"
    slug: "development"
  - name: "Cloud"
    slug: "cloud"
---
<h1 id="heading-introduction">Introduction</h1>
<p>AWS Lightsail can be the easiest entry to the AWS Cloud. It has fixed monthly pricing unlike most other services, so you don't have to worry about a huge monthly bill. </p>
<p>Lightsail is really great for small to medium apps. It has out-of-the-box support for <strong>WordPress</strong>, Magento, Joomla, Prestashop, Drupal, Ghost, and Django apps. </p>
<p>It provides pre-configured stacks like LAMP, NGINX, MEAN, and Node.js. You can also launch pre-configured Plesk, WHM &amp; cPanel in just a few clicks. </p>
<p>But that's not all. You can launch any Linux-based and Windows OS instance. My personal favorites are <strong>Ubuntu</strong> and <strong>Amazon Linux 2</strong>.</p>
<h1 id="heading-prerequisites">Prerequisites</h1>
<p>Need a valid AWS account to deploy the WP app. If you don't have one, just create one from <a target="_blank" href="https://portal.aws.amazon.com/billing/signup">here</a>. Before starting to deploy your app read about <a target="_blank" href="https://aws.amazon.com/lightsail/pricing/">Amazon Lightsail Pricing and Free-Tier</a>. Don't worry, I will try to keep everything within the free tier. At this time of writing, you can run a Lightsail instance for free for 3 months.</p>
<h1 id="heading-install-wordpress-app">Install WordPress App</h1>
<p>Login to your AWS account if not already. Go to <a target="_blank" href="https://lightsail.aws.amazon.com">Lightsail homepage</a>. You should see a page like this:</p>
<p><img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1651060787414/7TgXRwaI1.png" alt="CleanShot 2022-04-27 at 17.59.20@2x.png" /></p>
<p>Are you seeing this? Let's go 🏃‍♂️</p>
<h2 id="heading-create-instance">Create Instance</h2>
<ol>
<li><p>Now click on the big <strong>Create Instance</strong> button. If you don't see one, follow this: 
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1651061181136/t7Kzr_AGl.png" alt="CleanShot 2022-04-27 at 18.04.31@2x.png" /></p>
</li>
<li><p>Let's choose <strong>Instance location</strong>, <strong>platform</strong>, and <strong>blueprint</strong>:
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1651064483874/SsoaPiAKt.png" alt="CleanShot 2022-04-27 at 18.20.07@2x.png" />
A. Click the link to change location and availability zone (AZ) if not what you want. I recommend selecting a location closer to your customers.
B. Choose the <strong>Linux/Unix</strong> platform.
C. Select the <strong>Apps + OS</strong> from the blueprint.
D. Now choose <strong>WordPress</strong> from the app list. <em>Not the multisite one</em>.</p>
</li>
<li><p>Now scroll down to <strong>Choose your instance plan</strong> section. I chose a free-tier plan and only one instance. Here is my setup:
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1651065101157/8eZaPa-e5.png" alt="CleanShot 2022-04-27 at 19.04.37@2x.png" /></p>
</li>
<li><p>Finally scroll to the bottom of the page and click the <strong>Create instance</strong> button. Wait for the status to become <strong><em>Running</em></strong>. Congratulations, your instance has launched 🚀</p>
</li>
</ol>
<h2 id="heading-assign-a-static-ip-optional">Assign a Static IP (optional)</h2>
<p>AWS Lightsail Instance comes with public (and private) IP. Which changes every time Stop and Start the instance.  My Public IP was this when I launched the instance: 
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1651065976006/xngXQF1qF.png" alt="CleanShot 2022-04-27 at 19.24.43@2x.png" /></p>
<p>After Stop and Start the instance, it got a new Public IP address: 
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1651066336570/qlxGqkjSB.png" alt="CleanShot 2022-04-27 at 19.31.30@2x.png" /></p>
<p>We have to fix that. So, let's create and assign a <strong>Static IP</strong>:</p>
<ol>
<li>Click on your application instance name to see the details of your instance. </li>
<li>Click on <strong>+ Create static IP</strong> from here:
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1651066765698/qL0v8VIuH.png" alt="CleanShot 2022-04-27 at 19.35.25@2x.png" /></li>
<li>Add a meaningful name and click Create:
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1651067026152/wMDiRyzMD.png" alt="CleanShot 2022-04-27 at 19.42.36@2x.png" /><blockquote>
<p>⚠️ Warning: You are allowed to assign 5 static IPs for free. You will be charged for static IP that is not attached to a running instance. </p>
</blockquote>
</li>
</ol>
<h2 id="heading-connect-to-the-instance-using-ssh">Connect to the instance using SSH</h2>
<p>You can connect to an instance in two ways: </p>
<h3 id="heading-using-browser">Using browser</h3>
<p>That's the easiest. Go to the <strong>Connect</strong> tab and click <strong>Connect using SSH</strong>:
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1651068506979/ofhpf4_1M.png" alt="CleanShot 2022-04-27 at 20.07.41@2x.png" /></p>
<h3 id="heading-using-ssh-client">Using SSH Client</h3>
<ol>
<li>Download the SSH key from here: 
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1651068654032/OKPX9IZfO.png" alt="CleanShot 2022-04-27 at 20.10.12@2x.png" /></li>
<li>If you are using PuTTY you can <a target="_blank" href="https://lightsail.aws.amazon.com/ls/docs/en_us/articles/lightsail-how-to-set-up-putty-to-connect-using-ssh">follow this tutorial</a>. </li>
<li>If you are using a terminal in macOS or Linux, run this command on where you downloaded the SSH key. </li>
</ol>
<pre><code class="lang-bash"><span class="hljs-comment"># Run for the first time to fix the permission</span>
chmod 400 &lt;path/to/your-lightsail-ssh-key&gt;.pem

<span class="hljs-comment"># Connect to your Lightsail instance</span>
<span class="hljs-comment"># Username and Public IP can be found in "Connect" tab</span>
ssh -i <span class="hljs-string">"&lt;path/to/your-lightsail-key&gt;.pem"</span> &lt;username&gt;@&lt;public_ip&gt;
</code></pre>
<h2 id="heading-get-admin-username-and-password">Get Admin Username and Password</h2>
<ol>
<li>You can get the username from the <strong>Connect</strong> tab. The username is <strong>user</strong> for this stack.</li>
<li>To get the password, log in to SSH and run this command<pre><code class="lang-bash">cat bitnami_application_password
</code></pre>
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1651069453965/Ehgt_JWU7.png" alt="CleanShot 2022-04-27 at 20.23.35@2x.png" /></li>
<li>Now open a browser tab and go to <code>http://&lt;public_ip&gt;/wp-admin</code>. Enter username and password above. You should see the WP Admin dashboard like me.</li>
</ol>
<h1 id="heading-add-a-domain">Add a Domain</h1>
<ol>
<li>Go to the <strong>Home</strong> page. Click on the <strong>Networking</strong> tab and then hit <strong>Create DNS zone</strong> button
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1651100514891/POkz7myRi.png" alt="CleanShot 2022-04-28 at 04.57.42@2x.png" /></li>
<li>Add your domain name. Scroll to the bottom and click the <strong>Create DNS zone</strong> button
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1651100878512/fz1N3wW4u.png" alt="CleanShot 2022-04-28 at 05.03.10@2x.png" /></li>
<li>Add these name server records in your domain control panel (ex. Namecheap, GoDaddy). You might have different records than mine
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1651101055794/Y_EVt8m18.png" alt="CleanShot 2022-04-28 at 05.09.00@2x.png" /></li>
<li>Now to the good part. Click <strong>+ Add Record</strong> button. Add your instance and click on tick icon to save. 
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1651101295885/pp15TFvIg.png" alt="CleanShot 2022-04-28 at 05.13.07@2x.png" /><blockquote>
<p>⚠️ It may take few minutes to days to propagate DNS records. </p>
</blockquote>
</li>
<li>Now update the domain name in <code>siteurl</code> and <code>home</code> rows of <code>wp_options</code> table.</li>
</ol>
<h1 id="heading-import-existing-app">Import Existing App</h1>
<h2 id="heading-import-database">Import Database</h2>
<p>You may have an existing database. You can import your database to the Lightsail instance. You can use a Database client app like TablePlus, MySQL Workbench, or even just the terminal. </p>
<p>Your database credentials exist in <code>wp-config.php</code> file. Connect to your instance via SSH and run this command: </p>
<pre><code class="lang-bash">cat stack/wordpress/wp-config.php
</code></pre>
<p>Use DB credentials to connect to DB, and replace <code>localhost</code> with the instance's public IP. Connect to your DB via SSH (recommended) or add the <code>3306</code> port here: 
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1651070563015/vdJ8wmLh2.png" alt="CleanShot 2022-04-27 at 20.40.01@2x.png" /></p>
<blockquote>
<p>ℹ️ Don't forget to change the domain name in <code>siteurl</code> and <code>home</code> rows of <code>wp_options</code> table.</p>
</blockquote>
<h2 id="heading-import-existing-files">Import existing files</h2>
<p>Application folder located in <code>stack/wordpress</code>. You can upload files in two ways: </p>
<ol>
<li>SFTP Client: You can use SFTP clients like FileZilla or Transmit to upload files. Use the same SSH credential to upload files. </li>
<li>Git: Connect to your instance via SSH. Install git by using this command:<pre><code class="lang-bash">sudo apt-get install git
</code></pre>
Now pull your files from git using the git clone/pull command. </li>
</ol>
<h1 id="heading-conclusion">Conclusion</h1>
<p>This is just the first step toward deploying your WordPress app to Amazon Lightsail instance. There are lot more you can do. You are welcome to ask your questions, give me feedback, or any improvement request. </p>
