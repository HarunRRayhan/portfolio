---
title: "Connect Redis/Elasticache to application in Amazon Lightsail instance"
slug: "connect-redis-elasticache-to-application-in-amazon-lightsail-instance"
brief: "You can create Redis/Elasticache even though Amazon Lightsail doesn't offer it. You can create an Elasticache for Redis cluster in AWS and connect using VPC Peering. 
Prerequisites

An Amazon Lightsail instance. To create a new instance follow Deploy..."
publishedAt: "2022-05-28T14:22:09.579Z"
readTimeInMinutes: 4
reactionCount: 0
responseCount: 0
replyCount: 0
sourceUrl: "https://web.archive.org/web/*/https://blog.harun.dev/connect-redis-elasticache-to-application-in-amazon-lightsail-instance"
coverImageUrl: "https://cdn.hashnode.com/res/hashnode/image/upload/v1653748387506/emK5Wx6yj.png"
tags:
  - name: "AWS"
    slug: "aws"
  - name: "Redis"
    slug: "redis"
  - name: "ec2"
    slug: "ec2"
  - name: "Cloud"
    slug: "cloud"
  - name: "Amazon Web Services"
    slug: "amazon-web-services"
---
<p>You can create Redis/Elasticache even though Amazon Lightsail doesn't offer it. You can create an Elasticache for Redis cluster in AWS and connect using VPC Peering. </p>
<h2 id="heading-prerequisites">Prerequisites</h2>
<ol>
<li>An Amazon Lightsail instance. To create a new instance follow <a target="_blank" href="https://harun.dev/blog/deploy-laravel-application-to-amazon-lightsail"><strong>Deploy Laravel Application to Amazon Lightsail</strong></a> or <a target="_blank" href="https://harun.dev/blog/deploy-wordpress-app-to-amazon-lightsail"><strong>Deploy WordPress App to Amazon Lightsail</strong></a></li>
<li>Be a little familiar with AWS Console.</li>
</ol>
<h2 id="heading-create-elasticache-for-redis">Create Elasticache for Redis</h2>
<ol>
<li><p>Go to <a target="_blank" href="https://us-east-1.console.aws.amazon.com/elasticache/home?/dashboard&amp;region=us-east-1#/dashboard?getStarted=expand"><strong>Elasticache for Redis console</strong></a>. Change the region that you want to launch it. I selected <strong>us-east-1</strong> as my Lightsail Instance(s) are there. </p>
</li>
<li><p>Click the <strong>Create Redis cluster</strong> button from the center of the page (or wherever you see it)
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1653740823924/ayTfyM9Sc.png" alt="CleanShot 2022-05-28 at 18.24.04@2x.png" /></p>
</li>
<li><p>You will land in this screen 👇
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1653741612053/kUlxh7BaC.png" alt="CleanShot 2022-05-28 at 18.38.27@2x.png" /></p>
<ul>
<li>A. Choose <strong>Configure and create a new cluster</strong></li>
<li>B. Choose cluster mode <strong>Disabled</strong></li>
<li>C. Give it a name</li>
<li>D. Uncheck <strong>Multi-AZ</strong> Enable</li>
<li>E. Uncheck <strong>Auto-failover</strong> Enable</li>
<li>F. Select a free-tier node type. Currently it's "cache.t3.micro" and "cache.t2.micro".</li>
<li>G. Do not need any replica for this demo. Make it <strong>"0"</strong>.</li>
<li>H. Give subnet groups a name</li>
<li>I. Select your VPC</li>
<li>J. And then clieck the <strong>Next</strong> button from the bottom.</li>
</ul>
</li>
<li><p>You will be on the second page. Just uncheck <strong>Enable automatic backup</strong> and click the <strong>Next</strong> button from the bottom of the page. 
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1653742318231/ahAMqpjdB.png" alt="CleanShot 2022-05-28 at 18.50.07@2x.png" /></p>
</li>
<li><p>Review everything on the 3rd and final page. And then click the <strong>Create</strong> button from the bottom of the page. </p>
</li>
<li><p>It will take a few minutes to get created. Wait for status changes to <strong>Available</strong>.
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1653743046013/ETHuHBu8T.png" alt="CleanShot 2022-05-28 at 19.03.41@2x.png" /></p>
</li>
<li><p>now, click on the Cluster name. And you will be on the details page. 
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1653743211659/IfsLDKS_6.png" alt="CleanShot 2022-05-28 at 19.05.38@2x.png" />
Copy the <strong>Primary endpoint</strong> in your clipboard or somewhere safe. </p>
</li>
</ol>
<h3 id="heading-configure-security-group-for-redis-cluster">Configure Security Group for Redis cluster</h3>
<ol>
<li><p>Go to the <a target="_blank" href="https://us-east-1.console.aws.amazon.com/vpc/home?region=us-east-1#securityGroups:"><strong>Security groups</strong></a> of VPS Console. Make sure you are in the same region as the Redis cluster. And then click the <strong>Create security group</strong> from the top-right corner. 
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1653744863578/l7kjpTUOR.png" alt="CleanShot 2022-05-28 at 19.33.08@2x.png" /></p>
</li>
<li><p>You are in create Security Group page
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1653745388466/tlEobrLnW.png" alt="CleanShot 2022-05-28 at 19.41.30@2x.png" /></p>
<ul>
<li>A. Give it a name</li>
<li>B. Click on the <strong>Add rule</strong> button of the Inbound rules section.</li>
<li>C. Select 6379 as Custom TCP Port</li>
<li>D. Add your Amazon Lightsail VPC IP range. To generate it, check your instance's Private IP address. Mine is 172.26.3.157. Replace the last two sections with 0 and add /16. So, mine became 172.26.0.0/16. </li>
<li>E. Optionally, you can add a description</li>
<li>F. Then hit the <strong>Create security group</strong> button from the bottom of the page.</li>
</ul>
</li>
<li><p>Now go to the <strong>Network and security</strong> tab of your Redis cluster and click the <strong>Modify</strong> button from the <strong>Security groups</strong> section.
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1653746258674/GFFV32uHF.png" alt="CleanShot 2022-05-28 at 19.55.02@2x.png" /></p>
</li>
<li><p>Click on the <strong>Manage</strong> button from the next screen
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1653746332691/9RL95yIIC.png" alt="CleanShot 2022-05-28 at 19.58.02@2x.png" /></p>
</li>
<li><p>Select the correct security group from the pop and then click on the <strong>Choose</strong> button. 
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1653746443378/yYbIwHuCh.png" alt="CleanShot 2022-05-28 at 19.59.19@2x.png" /></p>
</li>
<li><p>Click <strong>Modify</strong> button from the bottom of the page.
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1653746505482/U9cm147ER.png" alt="CleanShot 2022-05-28 at 20.00.47@2x.png" />
It will take a few minutes to complete the modification. Wait until the status changes to <strong>Available</strong>.</p>
</li>
</ol>
<h2 id="heading-vpc-peering">VPC Peering</h2>
<p>The important part of this tutorial. We need to peer VPC between Lightsail and Redis cluster's VPC to connect it. </p>
<ol>
<li><p>Go to the homepage of the Amazon Lightsail console. Click the <strong>Account</strong> from the Account menu dropdown. 
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1653743506780/Kkbk-kt5P.png" alt="CleanShot 2022-05-28 at 19.10.54@2x.png" /></p>
</li>
<li><p>Click on the <strong>Advanced</strong> tab from the Account settings page. You will see a list of your VPCs. Connect the one that resides in your Redis cluster. For me, it's <strong>Virginia (us-east-1)
</strong>. 
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1653743731968/0hJH7OqKe.png" alt="CleanShot 2022-05-28 at 19.12.35@2x.png" /></p>
</li>
</ol>
<h2 id="heading-connect-to-the-redis-cluster-from-the-lightsail-instance">Connect to the Redis cluster from the Lightsail instance</h2>
<h3 id="heading-using-cli">Using CLI</h3>
<ol>
<li><p>Connect to the instance using SSH. <a target="_blank" href="https://harun.dev/blog/deploy-wordpress-app-to-amazon-lightsail#heading-connect-to-the-instance-using-ssh">Follow this</a> to connect to SSH.</p>
</li>
<li><p>Install Redis CLI </p>
<ul>
<li>A. On Amazon Linux 2 <pre><code class="lang-bash">sudo amazon-linux-extras install epel -y
sudo yum install gcc jemalloc-devel openssl-devel tcl tcl-devel -y
sudo wget http://download.redis.io/redis-stable.tar.gz
sudo tar xvzf redis-stable.tar.gz
<span class="hljs-built_in">cd</span> redis-stable
sudo make BUILD_TLS=yes
</code></pre>
</li>
<li>B. on Ubuntu<pre><code class="lang-bash">sudo apt install redis-server
</code></pre>
</li>
</ul>
</li>
<li><p>Now connect to the Redis cluster. The moment of truth.</p>
<pre><code class="lang-bash">redis-cli -h &lt;redis_endpoint&gt; -c -p 6379
</code></pre>
<p>Replace <code>&lt;redis_endpoint&gt;</code> with your Primary endpoint of Redis you copied in the clipboard. Remove port (":6379") from the endpoint URL. You will see this screen if successful 👇 
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1653747050113/8YFSWvlOm.png" alt="CleanShot 2022-05-28 at 20.10.24@2x.png" />
You can use the <code>ping</code>, <code>set</code>, and <code>get</code> commands to test it out. </p>
</li>
</ol>
<h3 id="heading-connect-to-application">Connect to Application</h3>
<p>You will get packages for most of the Applications, languages, and Frameworks. Check docs. For Laravel, you just have to configure it in the <code>.env</code> file.  </p>
<h2 id="heading-conclusion">Conclusion</h2>
<p>Hope you enjoyed this short article. You can subscribe to my newsletter, and follow me on <a target="_blank" href="https://twitter.com/HarunRRayhan">Twitter</a>, <a target="_blank" href="https://dev.to/harunrrayhan">Dev.to</a>, and <a target="_blank" href="https://hashnode.com/@HarunRRayhan">Hashnode</a>. </p>
