---
title: "Add Database to Application hosted in Amazon Lightsail"
slug: "add-database-to-application-hosted-in-amazon-lightsail"
brief: "Amazon Lightsail offers dedicated Databases. You can make use of it instead of an on-instance database. It's easy, managed, secure, and most importantly it's not tied to the instance. So, your database will be safe even if instance crashes.
In \"Deplo..."
publishedAt: "2022-05-23T13:57:31.743Z"
readTimeInMinutes: 3
reactionCount: 0
responseCount: 0
replyCount: 0
sourceUrl: "https://web.archive.org/web/*/https://blog.harun.dev/add-database-to-application-hosted-in-amazon-lightsail"
coverImageUrl: "https://cdn.hashnode.com/res/hashnode/image/upload/v1653314129447/_3LPCm_b4.png"
tags:
  - name: "AWS"
    slug: "aws"
  - name: "Databases"
    slug: "databases"
  - name: "Cloud"
    slug: "cloud"
  - name: "Laravel"
    slug: "laravel"
  - name: "WordPress"
    slug: "wordpress"
---
<p>Amazon Lightsail offers dedicated Databases. You can make use of it instead of an on-instance database. It's easy, managed, secure, and most importantly it's not tied to the instance. So, your database will be safe even if instance crashes.</p>
<p>In "<strong><a target="_blank" href="https://harun.dev/blog/deploy-wordpress-app-to-amazon-lightsail">Deploy WordPress App to Amazon Lightsail</a></strong>, the database is installed in the instance. In this article, we are to cover the dedicated databases.</p>
<blockquote>
<p>⚠️ Warning: Dedicated Lightsail Databases are going to cost $$$. It has a 3-month free tier at this time of writing. Check your plan before creating a database.</p>
</blockquote>
<p>So, what are you waiting for? Let's dive right in 🏃‍♂️</p>
<h2 id="heading-create-a-database-instance">Create a Database Instance</h2>
<ol>
<li><p>Go to your Amazon Lightsail home page. And then click on the <strong>Databases</strong> tab.</p>
</li>
<li><p>Now click on the <strong>Create database</strong> button
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1653131872710/gEcI9vj3t.png" alt="CleanShot 2022-05-21 at 17.17.16@2x.png" /></p>
</li>
<li><p>Now you are on the database creation page:
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1653132301734/u04toFGII.png" alt="CleanShot 2022-05-21 at 17.23.57@2x.png" /></p>
<ul>
<li>(A) Select AWS Region and Availablity Zone (AZ). for me Virginia and Zone A are perfect.</li>
<li>(B) Choose the Database engine and version. I selected MySQL 8.</li>
<li>(C) Click on <strong>Specify login credentials</strong>, and</li>
<li>(D) Click on <strong>Specify the master database name</strong>.</li>
</ul>
</li>
<li><p>Scroll down a little and configure this:
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1653134742780/DRvaNLKt4.png" alt="CleanShot 2022-05-21 at 18.03.04@2x.png" /></p>
<ul>
<li>(A) Choose Database username</li>
<li>(B) Password. I'm okay with the generated password, but you can choose yours.</li>
<li>(C) The first/master database. You can create more later.</li>
<li>(D &amp; E) Choose your plan type and the actual plan. You can choose the free-tier option like me.</li>
<li>(F) Give it a name, and</li>
<li>(G) Hit the <strong>Create database</strong> button
Your database should be created within a few minutes. Please wait for it until it's <strong>Running</strong>.</li>
</ul>
</li>
</ol>
<h2 id="heading-database-credentials">Database Credentials</h2>
<p>You already know your database username and master database. For everything else, go to your database and click on the <strong>Connect</strong> tab. You should see your credentials like this:
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1653135919053/o9bP5UDl4.png" alt="CleanShot 2022-05-21 at 18.24.30@2x.png" /></p>
<ul>
<li>(A) DB Username</li>
<li>(B) DB Password</li>
<li>(C) DB Endpoint</li>
<li>(D) DB Port</li>
</ul>
<h2 id="heading-connect-to-the-database">Connect to the database</h2>
<h3 id="heading-instance-cli">Instance CLI</h3>
<p>You can <a target="_blank" href="https://harun.dev/blog/deploy-laravel-application-to-amazon-lightsail#heading-connect-to-the-instance-using-ssh">SSH into your instance</a>. </p>
<p>Install MySQL using the following command:</p>
<pre><code class="lang-bash">sudo apt install mysql-server -y
sudo systemctl start mysql.service
</code></pre>
<p>And then connect to MySQL:</p>
<pre><code class="lang-bash">mysql --host &lt;db_endpoint&gt; --user &lt;db_username&gt; --password
</code></pre>
<p>You will be asked for your DB password. If successful, you will see this screen:
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1653136540334/gIFUYhIHz.png" alt="CleanShot 2022-05-21 at 18.35.21@2x.png" /></p>
<h3 id="heading-sql-client-app-over-ssh-ssh-tunneling">SQL Client App over SSH (SSH Tunneling)</h3>
<p>Most modern SQL Client applications (ex <a target="_blank" href="https://docs.tableplus.com/gui-tools/manage-connections#ssh-tunneling">TablePlus</a>, MySQL Workbench) have the option to connect Database via SSH. You can connect using that option. </p>
<h2 id="heading-add-database-to-your-application">Add Database to your application</h2>
<h3 id="heading-laravel-and-nodejs">Laravel and NodeJS</h3>
<p>You can update your application's <code>.env</code> file with Database credentials.</p>
<h3 id="heading-wordpress">WordPress</h3>
<p>Update your <code>wp-config.php</code> file with the database credentials.</p>
<h3 id="heading-any-other-app">Any other app</h3>
<p>Update your database credential in your application's configuration and/or environment file. Check your application's documentation for that. Or it's custom, you know where to put it.</p>
<h2 id="heading-conclusion">Conclusion</h2>
<p>Thanks for reading the article. Adding dedicated databases to Amazon Lightsail instance is not that hard. You can follow me to get instant updates on my posts. You can also subscribe to <a target="_blank" href="https://harun.dev/blog">my newsletter</a>. </p>
