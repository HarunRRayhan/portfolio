---
title: "Install Cloud Watch Agent in Amazon Lightsail instance for Monitoring, Logging & Debugging"
slug: "install-cloud-watch-agent-in-amazon-lightsail-instance-for-monitoring-logging-and-debugging"
brief: "Use the Cloud Watch agent to send logging and debugging to Cloud Watch. You can check logs without logging into instances. It's accessible even after the instance is terminated.
Life is far from perfect, and so does Amazon Lightsail instances. It can..."
publishedAt: "2022-06-04T04:27:45.216Z"
readTimeInMinutes: 4
reactionCount: 0
responseCount: 0
replyCount: 0
sourceUrl: "https://web.archive.org/web/*/https://blog.harun.dev/install-cloud-watch-agent-in-amazon-lightsail-instance-for-monitoring-logging-and-debugging"
coverImageUrl: "https://cdn.hashnode.com/res/hashnode/image/upload/v1654316728669/JAQl5HFqK.png"
tags:
  - name: "AWS"
    slug: "aws"
  - name: "Amazon Web Services"
    slug: "amazon-web-services"
  - name: "Cloud"
    slug: "cloud"
  - name: "ec2"
    slug: "ec2"
  - name: "#Lightsail"
    slug: "lightsail"
---
<p>Use the Cloud Watch agent to send logging and debugging to Cloud Watch. You can check logs without logging into instances. It's accessible even after the instance is terminated.</p>
<p>Life is far from perfect, and so does Amazon Lightsail instances. It can be frustrating if there is an error and you don't know how to debug it. The server itself and applications installed in it produces log files. And server stats can be helpful in monitoring, logging, and debugging.</p>
<h2 id="heading-prerequisites">Prerequisites</h2>
<p>It would help if you had an existing Amazon Lightsail instance. You can create a new instance by following "<a target="_blank" href="https://harun.dev/blog/deploy-wordpress-app-to-amazon-lightsail"><strong>Deploy WordPress App to Amazon Lightsail</strong></a>" or "<a target="_blank" href="https://harun.dev/blog/deploy-laravel-application-to-amazon-lightsail"><strong>Deploy Laravel Application to Amazon Lightsail</strong></a>". </p>
<p>Let's go 🏃‍♂️</p>
<h2 id="heading-create-an-iam-user">Create an IAM User</h2>
<ol>
<li>Go to <a target="_blank" href="https://console.aws.amazon.com/iam/">IAM Console</a>.</li>
<li>Click on the <strong>Users</strong> menu from the navigation panel and then click on the <strong>Add Users</strong> button.
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1654260503965/iecpnlBpe.png" alt="CleanShot 2022-06-03 at 18.45.52@2x.png" /></li>
<li>You will be in the <strong>Add user</strong> screen:
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1654260634422/FtOVvkhW4.png" alt="CleanShot 2022-06-03 at 18.49.18@2x.png" /><ul>
<li>A. Give it a name. For me, it's <strong>LightsailCloudWatchAgent</strong>.</li>
<li>B. Check the <strong>Access key - Programmatic access</strong> option</li>
<li>C. Click on the <strong>Next: Permissions</strong> button.</li>
</ul>
</li>
<li>You will be in the <strong>Set permissions</strong> page:
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1654261010738/ebCVaRI33.png" alt="CleanShot 2022-06-03 at 18.53.25@2x.png" /><ul>
<li>A. Select the <strong>Attach existing policies directly</strong> option.</li>
<li>B. Search for <strong>CloudWatchAgentServerPolicy</strong>.</li>
<li>C. Select <strong>CloudWatchAgentServerPolicy</strong>, and</li>
<li>D. Click the <strong>Next: Tags</strong> button.</li>
</ul>
</li>
<li>Tags are optional. You can choose your tags. Click on the <strong>Next: Review</strong> after you are done.</li>
<li>From review page you can check if everything alright and then click the <strong>Create user</strong> button.</li>
<li>Your account is created and you will be in this screen:
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1654262147682/a1Y5zvdjy.png" alt="CleanShot 2022-06-03 at 19.15.00@2x.png" /><ul>
<li>A. &amp; B. Copy <strong>Access Key ID</strong> and <strong>Secret access key</strong> in somewhere safe, or,</li>
<li>C. Download the csv file.
We will need this access later. </li>
</ul>
</li>
</ol>
<h2 id="heading-configure-aws-access">Configure AWS Access</h2>
<ol>
<li><p>Check if AWS CLI is installed by running <code>aws --version</code>. You should see the current version. If you get an error, CLI probably is not installed. </p>
</li>
<li><p>Ignore this if AWS CLI is already installed. Run this on ubuntu:</p>
<pre><code class="lang-bash">curl <span class="hljs-string">"https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip"</span> -o <span class="hljs-string">"awscliv2.zip"</span>
unzip awscliv2.zip
sudo ./aws/install
sudo ./aws/install --bin-dir /usr/bin --install-dir /usr/<span class="hljs-built_in">local</span>/aws-cli --update
</code></pre>
<p>Follow this <a target="_blank" href="https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html">instruction to install on other servers</a>. </p>
</li>
<li><p>Now, we are going to configure the AWS access generated in the last step. Run this </p>
<pre><code class="lang-bash">sudo aws configure --profile AmazonCloudWatchAgent
</code></pre>
<p>Enter Access Key and Secret Like this:
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1654264842166/88TunGI6p.png" alt="CleanShot 2022-06-03 at 19.59.18@2x.png" /></p>
</li>
</ol>
<h2 id="heading-install-the-cloudwatch-agent">Install the Cloudwatch Agent</h2>
<ol>
<li><p>You need to SSH into your instance. Here is <a target="_blank" href="https://harun.dev/blog/deploy-wordpress-app-to-amazon-lightsail#heading-connect-to-the-instance-using-ssh">how you can SSH into your Amazon Lightsail Instance</a>.</p>
</li>
<li><p>Now, let's install the agent. I'm using ubuntu, you can just run this command</p>
<pre><code class="lang-bash"><span class="hljs-comment"># Download the agent</span>
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
<span class="hljs-comment"># Install the agent</span>
sudo dpkg -i -E ./amazon-cloudwatch-agent.deb
</code></pre>
</li>
<li><p>Now run this command configure the agent.</p>
<pre><code class="lang-bash">sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-config-wizard
</code></pre>
<p>Input your choices as I did. Check the arrow mark. You can choose your own or follow mine.
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1654315524093/sOZrTU36D.png" alt="CleanShot 2022-06-04 at 10.03.13@2x.png" /></p>
</li>
<li><p>Give AWS Access to the Agent. Run this: </p>
<pre><code class="lang-bash">sudo vim /opt/aws/amazon-cloudwatch-agent/etc/common-config.toml
</code></pre>
</li>
</ol>
<p>Paste this in the bottom of the file:</p>
<pre><code><span class="hljs-section">[credentials]</span>
<span class="hljs-attr">shared_credential_profile</span> = <span class="hljs-string">"AmazonCloudWatchAgent"</span>
</code></pre><p>Now hit <strong>ESC</strong> and then <strong>:wq!</strong>. </p>
<ol>
<li><p>Start the agent:</p>
<pre><code class="lang-bash">sudo amazon-cloudwatch-agent-ctl -c file:/opt/aws/amazon-cloudwatch-agent/bin/config.json -a fetch-config -s
</code></pre>
</li>
<li><p>Check the status of the agent by using:</p>
<pre><code class="lang-bash">sudo amazon-cloudwatch-agent-ctl -a status
</code></pre>
<p>You should see something like this:
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1654266165471/XM2e620Sv.png" alt="CleanShot 2022-06-03 at 20.21.53@2x.png" /></p>
</li>
</ol>
<h2 id="heading-verify-metrics-on-cloudwatch">Verify metrics on CloudWatch</h2>
<ol>
<li>Go to the <a target="_blank" href="https://console.aws.amazon.com/cloudwatch">Cloudwatch Console</a></li>
<li>On the left navigation panel, choose <strong>Metrics</strong>.</li>
<li>Under “<strong>Custom Namespaces</strong>”, You should see a link for “CWAgent”.</li>
<li>Choose CWAgent.</li>
<li>Choose any <strong>ImageId, InstanceId, InstanceType</strong>.</li>
<li>Select the checkbox to display metrics on the graph. Here is mine:
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1654315784361/SZyZfXUjn.png" alt="CleanShot 2022-06-04 at 10.08.02@2x.png" /></li>
</ol>
<h2 id="heading-conclusion">Conclusion</h2>
<p>Hope you enjoyed this article. This is the last article of the Amazon Lightsail series.  You can ask me any Lightsail-related question in the comments or on social media.</p>
<p>You can subscribe to my newsletter to get blog updates every week. Follow me on <a target="_blank" href="https://twitter.com/HarunRRayhan">Twitter</a>, <a target="_blank" href="https://dev.to/harunrrayhan">Dev.to</a>, and <a target="_blank" href="https://hashnode.com/@HarunRRayhan">Hashnode</a>. </p>
