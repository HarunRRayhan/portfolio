---
title: "Deploy Laravel Application to Amazon Lightsail"
slug: "deploy-laravel-application-to-amazon-lightsail"
brief: "Amazon Lightsail is a fixed monthly priced VPS service offered by AWS. Once you install the OS of your choice, you can run almost any application. In this application, I'm showing how to deploy one of my favorite backend frameworks called Laravel. Wh..."
publishedAt: "2022-05-19T14:59:32.221Z"
readTimeInMinutes: 5
reactionCount: 0
responseCount: 3
replyCount: 3
sourceUrl: "https://web.archive.org/web/*/https://blog.harun.dev/deploy-laravel-application-to-amazon-lightsail"
coverImageUrl: "https://cdn.hashnode.com/res/hashnode/image/upload/v1652972343828/JD6U4MZyQ.png"
tags:
  - name: "AWS"
    slug: "aws"
  - name: "Cloud"
    slug: "cloud"
  - name: "Laravel"
    slug: "laravel"
  - name: "Beginner Developers"
    slug: "beginners"
  - name: "Amazon Web Services"
    slug: "amazon-web-services"
---
<p>Amazon Lightsail is a fixed monthly priced VPS service offered by AWS. Once you install the OS of your choice, you can run almost any application. In this application, I'm showing how to deploy one of my favorite backend frameworks called Laravel. Which most of you might hear of. Let's deploy it.</p>
<h2 id="heading-i-dont-likeknow-laravel">I don't like/know Laravel</h2>
<p>It's totally fine if you don't like or know Laravel. Laravel is just the framework I choose to demo but it can be any app. It can be Node.js, Python, Django, Fast API, Ruby on Rails, or any other app. The idea is the same, but some of the steps in deployment will be different.</p>
<h2 id="heading-prerequisites">Prerequisites</h2>
<p>You need a Laravel app to deploy. Don't worry if you don't have one, I have to best <a target="_blank" href="https://github.com/HarunRay/laravel-to-lightsail">Laravel (v9) app</a> you can find in the internet (pun intended).</p>
<p>Let's deploy our Laravel app. 📦👉☁️</p>
<h2 id="heading-create-amazon-lightsail-instance">Create Amazon Lightsail Instance</h2>
<ol>
<li><p>Go to Lightsail homepage. Click on the <strong>Create instance</strong> button under <strong>Instances</strong> tab.
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1652881692076/hLgNOWXsk.png" alt="CleanShot 2022-05-18 at 19.44.36@2x.png" /></p>
</li>
<li><p>You will land on the Create instance page. We will use Ubuntu for this demo but you are open to choosing the OS of your choice.
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1652882301357/kHB-fJG9L.png" alt="CleanShot 2022-05-18 at 19.51.37@2x.png" />
(A) Change the AWS Region and Availablity Zone (AZ) of your choice if not the correct one selected. (B) Select <strong>Linux/Unix</strong> platform. (C) Select <strong>Ubuntu (20.04 LTS)</strong> as OS. The blueprint should be <strong>OS Only</strong>. (D) Choose a plan. (E) Give it a name, and (F) Hit the <strong>Create instance</strong> button from the bottom of the page.</p>
</li>
<li><p>Your instance is in the <strong>Pending</strong> state. Will be <strong>Running</strong> in a few minutes. </p>
</li>
</ol>
<h2 id="heading-assign-a-static-ip">Assign a static IP</h2>
<p>Read <a target="_blank" href="https://harun.dev/blog/deploy-wordpress-app-to-amazon-lightsail#heading-assign-a-static-ip-optional"><strong>how to assign a Static IP to an Amazon Lightsail Instance</strong></a>.</p>
<h2 id="heading-connect-to-the-instance-using-ssh">Connect to the instance using SSH</h2>
<blockquote>
<p>ℹ️ I described in detail <a target="_blank" href="https://harun.dev/blog/deploy-wordpress-app-to-amazon-lightsail#heading-connect-to-the-instance-using-ssh">How to connect to an Amazon Lightsail instance using SSH</a>. </p>
</blockquote>
<ol>
<li><p>Go to the instance page by clicking on the name. And go to the <strong>Connect</strong> tab. We need these 3 things: (A) Public IP, (B) SSH Username, and (C) Download the SSH Key.
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1652883714529/oW0f4b2AO.png" alt="CleanShot 2022-05-18 at 20.21.12@2x.png" /></p>
</li>
<li><p>Change permission of Key file: </p>
<pre><code class="lang-bash"><span class="hljs-comment"># Change "path/to/keyfile.pem" with your key file name</span>
chmod 400 path/to/keyfile.pem
</code></pre>
</li>
<li><p>Connect to the SSH</p>
<pre><code class="lang-bash"><span class="hljs-comment">#format </span>
ssh -i <span class="hljs-string">"path/to/keyfile.pem"</span> &lt;username&gt;@&lt;ip_address&gt;
<span class="hljs-comment"># Should look like this with your own value</span>
<span class="hljs-comment"># ssh -i "LightsailDefaultKey-us-east-1.pem" ubuntu@52.201.59.133</span>
</code></pre>
</li>
<li><p>If you are asked to add IP to known hosts, type <code>yes</code> and you should be logged in. </p>
</li>
</ol>
<h2 id="heading-installing-necessary-scripts">Installing Necessary Scripts</h2>
<p>Our server is created and it's empty. You can install any script you want, depending on what you need. In this demo, we are going to use Laravel. You can follow along even if you have a different app/stack.</p>
<ol>
<li><p>Update package information</p>
<pre><code class="lang-bash">sudo apt-get update
</code></pre>
</li>
<li><p>Some packages</p>
<pre><code class="lang-bash">sudo apt install curl git unzip -y
</code></pre>
</li>
<li><p>Install PHP
I love the latest PHP 8.1. It's not officially available in Ubuntu 20.04 yet. We will enable the PHP Repository to install PHP 8.1.</p>
<pre><code class="lang-bash">sudo apt install software-properties-common -y
sudo add-apt-repository ppa:ondrej/php -y
sudo apt install php8.1-fpm php8.1-cli php8.1-mysql php8.1-curl php-xml php-mbstring -y
</code></pre>
<p>Check php version by using <code>php --version</code> command. You should see something like this:
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1652886148738/mv58j3RPp.png" alt="CleanShot 2022-05-18 at 21.02.08@2x.png" /></p>
</li>
<li><p>Install Composer</p>
<pre><code class="lang-bash"><span class="hljs-comment"># Download the bin file</span>
curl -sS https://getcomposer.org/installer | php
<span class="hljs-comment"># Move it to correct path</span>
sudo mv composer.phar /usr/<span class="hljs-built_in">local</span>/bin/composer
<span class="hljs-comment"># Make it executeable</span>
sudo chmod +x /usr/<span class="hljs-built_in">local</span>/bin/composer
</code></pre>
</li>
<li><p>Install Nginx &amp; configure nginx</p>
<pre><code class="lang-bash">sudo apt install nginx -y
</code></pre>
</li>
<li><p>Clone your application repo</p>
<pre><code class="lang-bash"><span class="hljs-comment"># go to www directory</span>
<span class="hljs-built_in">cd</span> /var/www/html
<span class="hljs-comment"># clone the git repo</span>
sudo git <span class="hljs-built_in">clone</span> https://github.com/HarunRay/laravel-to-lightsail.git
<span class="hljs-comment"># go to application directory</span>
<span class="hljs-built_in">cd</span> laravel-to-lightsail
<span class="hljs-comment"># copy .env.example file</span>
cp .env.example .env
<span class="hljs-comment"># Install dependencies</span>
sudo composer install
</code></pre>
</li>
<li><p>Create a nginx config file</p>
<pre><code class="lang-bash">sudo vim /etc/nginx/sites-available/laravel
</code></pre>
<p>Paste this code. Change <code>52.201.59.133</code> to your IP address and save.</p>
<pre><code class="lang-nginx"><span class="hljs-section">server</span> {
 <span class="hljs-attribute">listen</span> <span class="hljs-number">80</span>;
 <span class="hljs-attribute">listen</span> [::]:<span class="hljs-number">80</span>;
 <span class="hljs-attribute">server_name</span> <span class="hljs-number">52.201.59.133</span>;
 <span class="hljs-attribute">root</span> /var/www/html/laravel-to-lightsail/public;

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
<p>Now, run this:</p>
<pre><code class="lang-bash"><span class="hljs-comment"># link nginx config </span>
sudo ln -s /etc/nginx/sites-available/laravel /etc/nginx/sites-enabled/
sudo systemctl start nginx
sudo systemctl <span class="hljs-built_in">enable</span> nginx
</code></pre>
</li>
<li><p>Set Laravel App Permission</p>
<pre><code class="lang-bash"><span class="hljs-comment"># Go to your laravel app directory</span>
<span class="hljs-built_in">cd</span> /var/www/html/laravel-to-lightsail/
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
<li><p>Generate app key</p>
<pre><code class="lang-bash">sudo php artisan key:generate
</code></pre>
</li>
<li><p>Update the <code>.env</code> file
Open file</p>
<pre><code class="lang-bash">sudo vim /var/www/html/laravel-to-lightsail/.env
</code></pre>
<p>Now, change these values;</p>
<pre><code class="lang-env">APP_ENV=production
# Change IP to yours
APP_URL=http://52.201.59.133
</code></pre>
</li>
</ol>
<p>Now go to your public IP address. Mine is <code>http://52.201.59.133</code>. You should see this welcome page.
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1652971832893/zcqFK0B3U.png" alt="CleanShot 2022-05-19 at 20.50.16@2x.png" /></p>
<p>Congratulations, your Laravel app launched on Amazon Lightsail instance. 🚀</p>
<h2 id="heading-conclusion">Conclusion</h2>
<p>In the next few articles, we are going to configure the database, load balancer &amp; Redis (Elasticache). Follow me and subscribe to <a target="_blank" href="https://harun.dev/blog">my newsletter</a>. </p>
