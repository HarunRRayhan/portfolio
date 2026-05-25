---
title: "Deploy Laravel Application to Amazon EC2 Instance"
slug: "deploy-laravel-application-to-amazon-ec2-instance"
brief: "Everyone loves to deploy their applications to the Amazon EC2 instance. It's easy to deploy and maintain. This tutorial will launch a Laravel application to an EC2 instance.
What is EC2?
Amazon Elastic Compute Cloud (EC2) is one of the first offering..."
publishedAt: "2023-08-26T12:53:52.477Z"
readTimeInMinutes: 5
reactionCount: 0
responseCount: 0
replyCount: 0
sourceUrl: "https://web.archive.org/web/*/https://blog.harun.dev/deploy-laravel-application-to-amazon-ec2-instance"
coverImageUrl: "https://cdn.hashnode.com/res/hashnode/image/upload/v1693055246482/c63255a8-849f-4a98-80a7-5babd4ed4a36.jpeg"
tags:
  - name: "ec2"
    slug: "ec2"
  - name: "Laravel"
    slug: "laravel"
  - name: "Amazon Web Services"
    slug: "amazon-web-services"
  - name: "Devops"
    slug: "devops"
  - name: "Cloud"
    slug: "cloud"
---
<p>Everyone loves to deploy their applications to the Amazon EC2 instance. It's easy to deploy and maintain. This tutorial will launch a Laravel application to an EC2 instance.</p>
<h3 id="heading-what-is-ec2">What is EC2?</h3>
<p>Amazon Elastic Compute Cloud (EC2) is one of the first offerings of Amazon Web Services (AWS). It's a computing service, and you can virtually launch applications of any size securely and reliably.</p>
<h3 id="heading-prerequisites">Prerequisites</h3>
<ol>
<li>You need a Laravel application. If you don't have one, you can use this <a target="_blank" href="https://github.com/HarunRay/example-laravel-app-for-ec2">example app</a> to deploy.</li>
</ol>
<p><em>P.S.: You don't need a Laravel app; you can use any application of your choice. Ideas are the same; just a few deployment steps are different.</em></p>
<p>So, what are you waiting for? Let's go ahead and deploy your app to an EC2 instance. ☁️</p>
<h2 id="heading-create-key-pairs">Create Key Pairs</h2>
<ol>
<li><p>Login to AWS Management Console, and select the correct region from the top-right corner:</p>
<p> <img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1691818093530/f185a3cd-3c01-45c1-bcdf-f730d19f4ee1.png" alt class="image--center mx-auto" /></p>
</li>
<li><p>Now, go to EC2 Console, and click on the <strong>Key Pairs</strong> button under Network &amp; Security:</p>
<p> <img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1691819776893/0afbea3f-8b48-4d7f-9c8e-9f0711b7f250.png" alt class="image--center mx-auto" /></p>
</li>
<li><p>Click on <strong>Create key pairs</strong> from the top-right corner:</p>
<p> <img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1691820003504/fa05c0e6-aa34-4d0a-8334-f80d01f8485f.png" alt class="image--center mx-auto" /></p>
</li>
<li><p>Give it a name and click <strong>Create key pairs</strong>. It will download the keypair file and keep it in a safe place for later.</p>
<p> <img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1691820623904/8d10f422-fb01-4350-bc68-18001cec5675.png" alt class="image--center mx-auto" /></p>
</li>
</ol>
<h2 id="heading-launch-an-ec2-instance">Launch an EC2 Instance</h2>
<ol>
<li><p>Now, go to the instances page by clicking <strong>Instances</strong> under Instances:</p>
<p> <img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1691821070426/62208887-e537-4de4-92a8-749177ccad0f.png" alt class="image--center mx-auto" /></p>
</li>
<li><p>Click the <strong>Lunch instance</strong> button from the top-right corner:</p>
<p> <img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1691821858878/c66b8705-addd-4f4d-8262-b122293bd813.png" alt class="image--center mx-auto" /></p>
</li>
<li><p>Now you are on the Lunch instance page:</p>
<p> <img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1691822561677/f3f5d1c6-86cc-43b2-b200-1787d5779190.png" alt class="image--center mx-auto" /></p>
<p> A. Give your instance a name<br /> B. Select Ubuntu<br /> C. Select "Ubuntu Server 22.04 LTS" AMI</p>
</li>
<li><p>In the next section:</p>
<p> <img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1691822921532/aaa75dbd-6169-4f63-a88d-7503c3fb1095.png" alt class="image--center mx-auto" /></p>
<p> D. Select the instance type; I selected a free-tier eligible "t2.micro".<br /> E. Select the key pairs you selected previously.</p>
</li>
<li><p>Select all of these three checkboxes:</p>
<p> <img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1693050910149/cf9d94dd-b3d3-4351-9be2-0ed7eb0ea287.png" alt class="image--center mx-auto" /></p>
</li>
<li><p>Keep everything else as it is and click on the <strong>Lunch instance</strong> button from the right sidebar's summary widget:</p>
<p> <img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1691823287609/61648364-cbc7-4928-b757-0b95c2d1d6a2.png" alt class="image--center mx-auto" /></p>
</li>
<li><p>And then click the <strong>View all instances</strong> button:</p>
<p> <img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1693051025871/c408bc78-4f45-45c5-9604-a6d556219b75.png" alt class="image--center mx-auto" /></p>
</li>
<li><p>Wait until <strong>Status checks</strong> turn <strong>2/2 checks passed</strong> and copy <code>public_ip</code> in a safe place:</p>
<p> <img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1693051347852/80863972-9bf7-48d0-b371-57b096cc10e0.png" alt class="image--center mx-auto" /></p>
</li>
</ol>
<h2 id="heading-connect-to-the-instance-via-ssh">Connect to the instance via SSH</h2>
<ol>
<li><p>Change permission of your key file</p>
<pre><code class="lang-bash"> chmod 400 my_keypairs.pem
</code></pre>
</li>
<li><p>Run this command by replacing <code>&lt;ip_address&gt;</code> to your instance's public IP address, you have copied before:</p>
<pre><code class="lang-bash"> ssh -i <span class="hljs-string">"my_keypairs.pem"</span> ubuntu@&lt;ip_address&gt;
</code></pre>
</li>
<li><p>Enter <code>yes</code>, if you are asked to save your IP to known hosts list. You should be logged in to the instance.</p>
</li>
</ol>
<h2 id="heading-launch-your-laravel-app">Launch your Laravel app</h2>
<ol>
<li><p>Install some required packages</p>
<pre><code class="lang-bash"> sudo apt-get update
 sudo apt install curl git unzip -y
</code></pre>
</li>
<li><p>Let's install PHP 8.1 and its required package to launch the app</p>
<pre><code class="lang-bash"> sudo apt install software-properties-common -y
 sudo add-apt-repository ppa:ondrej/php -y
 sudo apt install -y php8.1-fpm \
     php8.1-cli \ 
     php8.1-mysql \ 
     php8.1-curl \ 
     php8.1-xml \ 
     php8.1-mbstring
</code></pre>
<p> Check the version by using <code>php --version</code> command:</p>
<p> <img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1693053370527/20fb5290-0d36-4455-8170-f0de641bb44a.webp" alt class="image--center mx-auto" /></p>
</li>
<li><p>Install composer</p>
<pre><code class="lang-bash"> <span class="hljs-comment"># Download the bin file</span>
 curl -sS https://getcomposer.org/installer | php
 <span class="hljs-comment"># Move it to correct path</span>
 sudo mv composer.phar /usr/<span class="hljs-built_in">local</span>/bin/composer
 <span class="hljs-comment"># Make it executeable</span>
 sudo chmod +x /usr/<span class="hljs-built_in">local</span>/bin/composer
</code></pre>
</li>
<li><p>Install Nginx</p>
<pre><code class="lang-bash"> sudo apt install nginx -y
</code></pre>
</li>
<li><p>Clone your git repository link to an app directory. Replace the value of <code>GIT_REPO</code> and <code>APP_DIR</code> value. Then, run the command.</p>
<pre><code class="lang-bash"> <span class="hljs-comment"># Replace values of these variables with yours</span>
 GIT_REPO=https://github.com/HarunRay/laravel-to-lightsail.git
 APP_DIR=laravel-app
 <span class="hljs-comment"># go to www directory</span>
 <span class="hljs-built_in">cd</span> /var/www/html
 <span class="hljs-comment"># clone the git repo</span>
 sudo git <span class="hljs-built_in">clone</span> <span class="hljs-string">"<span class="hljs-variable">$GIT_REPO</span>"</span> <span class="hljs-string">"<span class="hljs-variable">$APP_DIR</span>"</span>
 <span class="hljs-comment"># go to application directory</span>
 <span class="hljs-built_in">cd</span> <span class="hljs-string">"<span class="hljs-variable">$APP_DIR</span>"</span>
 <span class="hljs-comment"># copy .env.example file</span>
 cp .env.example .env
 <span class="hljs-comment"># Install dependencies</span>
 sudo composer install
</code></pre>
</li>
<li><p>Create Nginx config file:</p>
<pre><code class="lang-bash"> sudo vim /etc/nginx/sites-available/laravel
</code></pre>
<p> Paste this code. Change <code>52.201.59.133</code> to your IP address and save.</p>
<pre><code class="lang-nginx"> <span class="hljs-section">server</span> {
  <span class="hljs-attribute">listen</span> <span class="hljs-number">80</span>;
  <span class="hljs-attribute">listen</span> [::]:<span class="hljs-number">80</span>;
  <span class="hljs-attribute">server_name</span> <span class="hljs-number">52.201.59.133</span>;
  <span class="hljs-attribute">root</span> /var/www/html/laravel-ap/public;

  <span class="hljs-attribute">add_header</span> X-Frame-Options <span class="hljs-string">"SAMEORIGIN"</span>;
  <span class="hljs-attribute">add_header</span> X-Content-Type-Options <span class="hljs-string">"nosniff"</span>;

  <span class="hljs-attribute">index</span> index.php;

  <span class="hljs-attribute">charset</span> utf-<span class="hljs-number">8</span>;

  <span class="hljs-attribute">location</span> / {
      <span class="hljs-attribute">try_files</span> <span class="hljs-variable">$uri</span> <span class="hljs-variable">$uri</span>/ /index.php?<span class="hljs-variable">$query_string</span>;
  }

  <span class="hljs-attribute">location</span> = /favicon.ico { <span class="hljs-attribute">access_log</span> <span class="hljs-literal">off</span>; <span class="hljs-attribute">log_not_found</span> <span class="hljs-literal">off</span>; }
  <span class="hljs-attribute">location</span> = /robots.txt  { <span class="hljs-attribute">access_log</span> <span class="hljs-literal">off</span>; <span class="hljs-attribute">log_not_found</span> <span class="hljs-literal">off</span>; }

  <span class="hljs-attribute">error_page</span> <span class="hljs-number">404</span> /index.php;

  <span class="hljs-attribute">location</span> <span class="hljs-regexp">~ \.php$</span> {
      <span class="hljs-attribute">fastcgi_pass</span> unix:/var/run/php/php8.1-fpm.sock;
      <span class="hljs-attribute">fastcgi_param</span> SCRIPT_FILENAME <span class="hljs-variable">$realpath_root</span><span class="hljs-variable">$fastcgi_script_name</span>;
      <span class="hljs-attribute">include</span> fastcgi_params;
  }

  <span class="hljs-attribute">location</span> <span class="hljs-regexp">~ /\.(?!well-known).*</span> {
      <span class="hljs-attribute">deny</span> all;
  }
 }
</code></pre>
<p> Exit the Vim editor by pressing <code>esc</code> and then <code>:wq</code> . Then run this command:</p>
<pre><code class="lang-bash"> <span class="hljs-comment"># link nginx config </span>
 sudo ln -s /etc/nginx/sites-available/laravel /etc/nginx/sites-enabled/
 sudo systemctl start nginx
 sudo systemctl <span class="hljs-built_in">enable</span> nginx
</code></pre>
</li>
<li><p>Set permission for your Laravel app:</p>
<pre><code class="lang-bash"> <span class="hljs-comment"># Go to your laravel app directory</span>
 <span class="hljs-built_in">cd</span> /var/www/html/laravel-app/
 <span class="hljs-comment"># Add files &amp; folder www-data user &amp; group</span>
 sudo chown -R www-data:www-data .
 <span class="hljs-comment"># Add your ubuntu to group</span>
 sudo usermod -a -G www-data ubuntu
 <span class="hljs-comment"># Set file(s) permission</span>
 sudo find . -<span class="hljs-built_in">type</span> f -<span class="hljs-built_in">exec</span> chmod 644 {} \;
 <span class="hljs-comment"># Set folder(s) permission</span>
 sudo find . -<span class="hljs-built_in">type</span> d -<span class="hljs-built_in">exec</span> chmod 755 {} \;
 <span class="hljs-comment"># Set cache directory permission</span>
 sudo chgrp -R www-data storage bootstrap/cache
 sudo chmod -R ug+rwx storage bootstrap/cache
</code></pre>
</li>
<li><p>Now, generate app key:</p>
<pre><code class="lang-bash"> sudo php artisan key:generate
</code></pre>
</li>
<li><p>Open <code>.env</code> file to update:</p>
<pre><code class="lang-bash"> sudo vim /var/www/html/laravel-app/.env
</code></pre>
<p> Now, change these values:</p>
<pre><code class="lang-nix"> <span class="hljs-attr">APP_ENV=production</span>
 <span class="hljs-comment"># Change IP to yours</span>
 <span class="hljs-attr">APP_URL=http://52.201.59.133</span>
</code></pre>
<p> Exit the Vim editor by pressing <code>esc</code> and the <code>:wq</code> .</p>
</li>
<li><p>Restart Nginx service</p>
<pre><code class="lang-bash">sudo service nginx restart
</code></pre>
<p>Now, type your <code>public_ip</code> to browser and hit enter. You should see the welcome page. 🚀</p>
</li>
</ol>
<p>...</p>
<h2 id="heading-conclusion">Conclusion</h2>
<p>This article covers the very basic things about launching an instance. If you have any query or you are stuck, feel free to ask in the comment.</p>
<p>If you want to appreciate my work, love ❤️ this post, share it with your friends, subscribe to the newsletter, and follow me here on Hashnode.</p>
<p>I'm searching for the next topic to cover in this blog; if you have an idea, tweet me. Don't forget to follow me on <a target="_blank" href="https://twitter.com/HarunRRayhan"><strong>Twitter</strong></a>, I regularly tweet about AWS, Laravel, Cloud, PHP, and various other Software Engineering topics.</p>
