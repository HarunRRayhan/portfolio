---
title: "Deploying a Laravel Application to Amazon EC2 Using Terraform"
slug: "deploying-a-laravel-application-to-amazon-ec2-using-terraform"
brief: "Not everything needs to be serverless. I know, I know. I literally write about Lambda and API Gateway all the time. But look, sometimes you just need a single EC2 instance running your Laravel app and"
publishedAt: "2026-04-11T09:00:00.000Z"
readTimeInMinutes: 14
reactionCount: 0
responseCount: 0
replyCount: 0
sourceUrl: "https://web.archive.org/web/*/https://blog.harun.dev/deploying-a-laravel-application-to-amazon-ec2-using-terraform"
coverImageUrl: "https://raw.githubusercontent.com/HarunRRayhan/blog-assets/main/covers/deploying-a-laravel-application-to-amazon-ec2-using-terraform/cover.jpg"
tags:
  - name: "Terraform"
    slug: "terraform"
  - name: "AWS"
    slug: "aws"
  - name: "Laravel"
    slug: "laravel"
  - name: "Devops"
    slug: "devops"
  - name: "webdev"
    slug: "webdev"
---
<p>Not everything needs to be serverless. I know, I know. I literally write about Lambda and API Gateway all the time. But look, sometimes you just need a single EC2 instance running your Laravel app and that's totally fine. I was setting this up for a client last month and kept going back and forth on whether to containerize it or just throw it on EC2. EC2 won. Took me 20 minutes.</p>
<p>I still reach for EC2 more than you'd think. Small internal tools, staging environments, side projects where I really don't want to think about cold starts or container orchestration for a PHP app. It just works.</p>
<p>So in this guide, we're going to set up a production-ready EC2 environment for Laravel using Terraform. VPC, subnet, internet gateway, security group, elastic IP, EC2 instance running Ubuntu 24.04 with PHP 8.3. The whole thing. And because it's all Terraform, you can blow it away and recreate it whenever you want.</p>
<p>Let's get into it.</p>
<p><img src="https://images.pexels.com/photos/5480781/pexels-photo-5480781.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="Server rack in a modern data center" />
<sub>Photo by <a href="https://www.pexels.com/@brett-sayles">Brett Sayles</a> on <a href="https://www.pexels.com/photo/server-racks-on-data-center-5480781/">Pexels</a></sub></p>
<h2>What We're Building</h2>
<p>Here's what Terraform is going to create:</p>
<ul>
<li><strong>VPC</strong> with a 10.0.0.0/16 CIDR block. Your own isolated network.</li>
<li><strong>Public subnet</strong> (10.0.1.0/24) where the EC2 instance lives</li>
<li><strong>Internet gateway</strong> so your stuff can actually reach the internet</li>
<li><strong>Route table</strong> with a default route pointing out through the internet gateway</li>
<li><strong>Security group</strong> allowing HTTP and HTTPS from anywhere, SSH locked to your IP only</li>
<li><strong>EC2 instance</strong> (t3.micro) on Ubuntu 24.04 LTS with PHP 8.3, Nginx, and Composer</li>
<li><strong>Elastic IP</strong> so your server keeps the same public IP even if you stop and restart it</li>
</ul>
<p>That's about 15 resources total. Each one is pretty simple on its own. And once you write this config once, spinning up identical environments takes like two minutes.</p>
<p><img src="https://images.pexels.com/photos/4458200/pexels-photo-4458200.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="Architecture diagram showing cloud network components" />
<sub>Photo by <a href="https://www.pexels.com/@ivan-s">Ivan S</a> on <a href="https://www.pexels.com/photo/a-photo-of-a-floor-plan-4458200/">Pexels</a></sub></p>
<h2>Prerequisites</h2>
<p>You'll need a few things before we start:</p>
<ul>
<li><strong>AWS account</strong> with an IAM user that has programmatic access. Access key and secret key. Don't use root for this, seriously.</li>
<li><strong>Terraform 1.6 or newer</strong> on your local machine. <a href="https://developer.hashicorp.com/terraform/install">terraform.io</a> if you need it.</li>
<li><strong>A Laravel app</strong> in a public Git repo. We'll clone it onto the instance during setup.</li>
<li><strong>An EC2 key pair</strong> from the AWS console (EC2 &gt; Key Pairs). Download the .pem file. You're going to need it for SSH and you can't download it again later.</li>
<li><strong>Basic terminal comfort.</strong> You don't need to know Terraform. But you should be able to run commands without panicking.</li>
</ul>
<p>And just to be clear on this, Terraform runs on your local machine. It talks to AWS over the API. We're not installing Terraform on the server.</p>
<h2>Project Structure</h2>
<p>Create a new directory for your Terraform files. I like to split things up like this:</p>
<pre><code class="language-bash">mkdir terraform-laravel &amp;&amp; cd terraform-laravel
</code></pre>
<pre><code>terraform-laravel/
├── main.tf           # provider + terraform block
├── variables.tf      # input variables
├── terraform.tfvars  # your actual values (gitignore this)
├── vpc.tf            # VPC, subnet, IGW, route table
├── security_group.tf # security group rules
├── ami.tf            # AMI data source lookup
├── instance.tf       # EC2 + user_data
└── outputs.tf        # elastic IP output
</code></pre>
<p>Honestly, you could put everything in one big <code>main.tf</code> and Terraform wouldn't care. It doesn't actually matter what the files are named. But I've been woken up at 2am enough times to know that scrolling through a 300-line file looking for one security group rule is not fun. So I split them.</p>
<p>Let's start filling these in.</p>
<h2>Provider and Variables</h2>
<p>First, <code>main.tf</code>. This tells Terraform which provider we're using:</p>
<pre><code class="language-hcl">terraform {
  required_version = "&gt;= 1.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~&gt; 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}
</code></pre>
<p>Now <code>variables.tf</code>. These are the inputs so you can reuse this config without changing the actual resource definitions:</p>
<pre><code class="language-hcl">variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "us-east-1"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "key_name" {
  description = "Name of your EC2 key pair for SSH access"
  type        = string
}

variable "my_ip" {
  description = "Your public IP address for SSH access (e.g. 203.0.113.50)"
  type        = string
}

variable "app_git_repo" {
  description = "Public Git URL of your Laravel application"
  type        = string
}
</code></pre>
<p>And <code>terraform.tfvars</code> is where your actual values go. This one should never end up in Git:</p>
<pre><code class="language-hcl">aws_region   = "us-east-1"
instance_type = "t3.micro"
key_name     = "my-laravel-key"
my_ip        = "203.0.113.50"
app_git_repo = "https://github.com/your-username/your-laravel-app.git"
</code></pre>
<p>I always add <code>terraform.tfvars</code> to <code>.gitignore</code> first thing, before I even write the config. It has your IP in it. And later you might stick database passwords or other stuff in there. Just get it in your .gitignore now and forget about it.</p>
<h2>Networking</h2>
<p>Networking. I know, not the most exciting part. But if you get this wrong your instance won't be able to reach the internet and you'll spend an hour wondering why apt can't download packages. Ask me how I know.</p>
<p>Here's the full <code>vpc.tf</code>:</p>
<pre><code class="language-hcl">resource "aws_vpc" "hrr_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "hrr-laravel-vpc"
  }
}

resource "aws_subnet" "hrr_public" {
  vpc_id                  = aws_vpc.hrr_vpc.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = true

  tags = {
    Name = "hrr-laravel-public-subnet"
  }
}

resource "aws_internet_gateway" "hrr_igw" {
  vpc_id = aws_vpc.hrr_vpc.id

  tags = {
    Name = "hrr-laravel-igw"
  }
}

resource "aws_route_table" "hrr_public_rt" {
  vpc_id = aws_vpc.hrr_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.hrr_igw.id
  }

  tags = {
    Name = "hrr-laravel-public-rt"
  }
}

resource "aws_route_table_association" "hrr_public_rta" {
  subnet_id      = aws_subnet.hrr_public.id
  route_table_id = aws_route_table.hrr_public_rt.id
}
</code></pre>
<p>So the VPC is your isolated network. The subnet is a chunk of that network where our instance will sit. The internet gateway is the door to the outside world. Without it, nothing in your VPC can talk to anything external.</p>
<p>The route table is what tells traffic where to go. Our route says "anything going to 0.0.0.0/0, send it through the internet gateway." And then the route table association hooks that route table up to our subnet.</p>
<p>I burned like two hours on this once because I forgot the route table association. Instance had a public IP, security group looked fine, but it couldn't download a single package. The route table was just sitting there, not attached to anything. So yeah, don't skip that part.</p>
<p><img src="https://images.pexels.com/photos/4716292/pexels-photo-4716292.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="Network infrastructure with connected cables" />
<sub>Photo by <a href="https://www.pexels.com/@brett-sayles">Brett Sayles</a> on <a href="https://www.pexels.com/photo/blue-wires-connected-to-server-4716292/">Pexels</a></sub></p>
<h2>Security Group</h2>
<p>Security group is basically your firewall. Here's <code>security_group.tf</code>:</p>
<pre><code class="language-hcl">resource "aws_security_group" "hrr_laravel_sg" {
  name        = "hrr-laravel-sg"
  description = "Allow SSH from my IP, HTTP and HTTPS from anywhere"
  vpc_id      = aws_vpc.hrr_vpc.id

  # SSH - restricted to your IP only
  ingress {
    description = "SSH from my IP"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["${var.my_ip}/32"]
  }

  # HTTP
  ingress {
    description = "HTTP from anywhere"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTPS
  ingress {
    description = "HTTPS from anywhere"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # All outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "hrr-laravel-sg"
  }
}
</code></pre>
<p>SSH is locked down to <code>var.my_ip/32</code>, so only your IP can get in on port 22. Most tutorials just open it to 0.0.0.0/0 and call it a day. Don't do that. Every bot on the internet will start hammering your server within minutes.</p>
<p>If your IP changes because you're at a coffee shop or whatever, just update <code>my_ip</code> in your tfvars and run <code>terraform apply</code>. Takes like 10 seconds. Set it back when you get home.</p>
<p>HTTP and HTTPS are open to everyone. It's a web server. People need to reach it.</p>
<h2>AMI Lookup</h2>
<p>You could hardcode an AMI ID in your config, but AMI IDs change per region and they get outdated. Better to look it up dynamically. Create <code>ami.tf</code>:</p>
<pre><code class="language-hcl">data "aws_ami" "ubuntu" {
  most_recent = true

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  owners = ["099720109477"] # Canonical (official Ubuntu publisher)
}
</code></pre>
<p>This queries the AWS API when you run <code>terraform plan</code> and finds the latest Ubuntu 24.04 LTS AMI from Canonical. <code>most_recent = true</code> means you always get the one with the latest security patches.</p>
<p>The nice thing about this is portability. If you hardcode an AMI from us-east-1 and try to deploy in eu-west-1, it just fails. With a data source, Terraform figures out the right AMI for whatever region you're in. I use this pattern in basically every project now.</p>
<h2>EC2 Instance and User Data</h2>
<p>This is the big file. <code>instance.tf</code> creates the actual EC2 instance and uses a <code>user_data</code> script to install everything Laravel needs on first boot:</p>
<pre><code class="language-hcl">resource "aws_instance" "hrr_laravel" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  key_name               = var.key_name
  vpc_security_group_ids = [aws_security_group.hrr_laravel_sg.id]
  subnet_id              = aws_subnet.hrr_public.id

  user_data = &lt;&lt;-EOF
    #!/bin/bash
    set -e

    # Update system packages
    apt-get update -y
    apt-get upgrade -y

    # Install prerequisites
    apt-get install -y software-properties-common curl unzip git

    # Add PHP 8.3 repository
    add-apt-repository -y ppa:ondrej/php
    apt-get update -y

    # Install PHP 8.3 and extensions
    apt-get install -y \
      php8.3-fpm \
      php8.3-cli \
      php8.3-mbstring \
      php8.3-xml \
      php8.3-bcmath \
      php8.3-curl \
      php8.3-pgsql \
      php8.3-zip \
      nginx

    # Install Composer
    curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

    # Clone the Laravel app
    git clone ${app_git_repo} /var/www/laravel

    # Install dependencies
    cd /var/www/laravel
    composer install --no-dev --optimize-autoloader

    # Set up environment
    cp .env.example .env
    php artisan key:generate

    # Set permissions
    chown -R www-data:www-data /var/www/laravel
    chmod -R 755 /var/www/laravel/storage

    # Configure Nginx
    cat &gt; /etc/nginx/sites-available/laravel &lt;&lt;'NGINX'
    server {
        listen 80;
        server_name _;
        root /var/www/laravel/public;

        index index.php index.html;

        location / {
            try_files \\(uri \\)uri/ /index.php?\$query_string;
        }

        location ~ \.php$ {
            fastcgi_pass unix:/run/php/php8.3-fpm.sock;
            fastcgi_param SCRIPT_FILENAME \\(realpath_root\\)fastcgi_script_name;
            include fastcgi_params;
        }

        location ~ /\.(?!well-known).* {
            deny all;
        }
    }
    NGINX

    # Enable the site
    ln -sf /etc/nginx/sites-available/laravel /etc/nginx/sites-enabled/laravel
    rm -f /etc/nginx/sites-enabled/default

    # Restart services
    systemctl restart php8.3-fpm
    systemctl restart nginx
  EOF

  tags = {
    Name = "hrr-laravel-server"
  }
}

resource "aws_eip" "hrr_laravel_eip" {
  instance = aws_instance.hrr_laravel.id
  domain   = "vpc"

  depends_on = [aws_internet_gateway.hrr_igw]

  tags = {
    Name = "hrr-laravel-eip"
  }
}
</code></pre>
<p>The <code>user_data</code> script runs once when the instance boots up for the first time. It installs PHP 8.3 with all the extensions Laravel needs, sets up Nginx, installs Composer, clones your repo, and configures everything. When it finishes, your app is live.</p>
<p>The elastic IP at the bottom gives you a static public address. Without it, the IP changes every time you stop and start the instance. That gets annoying fast. The <code>depends_on</code> just makes sure the internet gateway is there before we try to allocate the EIP.</p>
<p>Quick note on production use. This setup uses SQLite by default, or whatever your .env.example specifies. For a real production app you'd want RDS for the database. And you'd probably want to pull secrets from Secrets Manager instead of having a .env file just sitting on disk. Actually, I've been meaning to write a follow-up post about that exact setup. But for getting started and testing your deployment, this is solid.</p>
<p><img src="https://images.pexels.com/photos/1181316/pexels-photo-1181316.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="Cloud server deployment and computing infrastructure" />
<sub>Photo by <a href="https://www.pexels.com/@divinetechygirl">Christina Morillo</a> on <a href="https://www.pexels.com/photo/engineer-holding-laptop-1181316/">Pexels</a></sub></p>
<h2>Outputs</h2>
<p>One more file. <code>outputs.tf</code> prints the stuff you actually need after Terraform finishes:</p>
<pre><code class="language-hcl">output "public_ip" {
  description = "Elastic IP address of the Laravel server"
  value       = aws_eip.hrr_laravel_eip.public_ip
}

output "ssh_command" {
  description = "SSH command to connect to the server"
  value       = "ssh -i ~/.ssh/\({var.key_name}.pem ubuntu@\){aws_eip.hrr_laravel_eip.public_ip}"
}

output "app_url" {
  description = "URL to access the Laravel application"
  value       = "http://${aws_eip.hrr_laravel_eip.public_ip}"
}
</code></pre>
<p>When <code>terraform apply</code> completes, you'll see the IP address, a ready-to-paste SSH command, and the URL to hit your app. No clicking around in the AWS console.</p>
<h2>Deploying</h2>
<p>Let's actually run this thing. First, initialize Terraform. This downloads the AWS provider plugin:</p>
<pre><code class="language-bash">terraform init
</code></pre>
<p>Next, preview what Terraform is going to do:</p>
<pre><code class="language-bash">terraform plan
</code></pre>
<p>You should see something like "Plan: 8 to add, 0 to change, 0 to destroy." Look through the output real quick. VPC, subnet, internet gateway, route table, association, security group, instance, elastic IP. All there? Good.</p>
<p>If the plan looks right, apply it:</p>
<pre><code class="language-bash">terraform apply
</code></pre>
<p>Type <code>yes</code> when it asks. Terraform starts creating resources. The whole thing takes about 60 to 90 seconds in my experience. Maybe a bit longer depending on the region.</p>
<pre><code>Apply complete! Resources: 8 added, 0 changed, 0 destroyed.

Outputs:

public_ip   = "54.210.123.45"
ssh_command = "ssh -i ~/.ssh/my-laravel-key.pem ubuntu@54.210.123.45"
app_url     = "http://54.210.123.45"
</code></pre>
<p>Now here's the thing. The EC2 instance is running, but the <code>user_data</code> script is still doing its thing in the background. It needs to install PHP, Nginx, Composer, clone your app. Give it 2 to 3 minutes. If you hit the URL too early you'll get a connection refused or the default Nginx page. Just wait.</p>
<p><img src="https://images.pexels.com/photos/15061966/pexels-photo-15061966.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="Technology deployment and launch process" />
<sub>Photo by <a href="https://www.pexels.com/@jeswin">Jeswin  Thomas</a> on <a href="https://www.pexels.com/photo/spacex-rocket-facility-starbase-15061966/">Pexels</a></sub></p>
<h2>Accessing Your App</h2>
<p>After a couple minutes, open <code>http://&lt;your-elastic-ip&gt;</code> in your browser. You should see the Laravel welcome page. This cost me about $0.01 per hour on a t3.micro in us-east-1, by the way. So don't stress about leaving it running for a bit while you test.</p>
<p>If you need to SSH in and poke around:</p>
<pre><code class="language-bash">ssh -i ~/.ssh/my-laravel-key.pem ubuntu@54.210.123.45
</code></pre>
<p>Swap in your actual key path and IP. Terraform printed the full command in the outputs so you can literally just copy paste it.</p>
<p>Your Laravel app lives at <code>/var/www/laravel</code>. Nginx logs are in <code>/var/log/nginx/</code>. If you're getting a 502 Bad Gateway, check if PHP-FPM is running:</p>
<pre><code class="language-bash">sudo systemctl status php8.3-fpm
</code></pre>
<p>If it's not active, restart it and nginx:</p>
<pre><code class="language-bash">sudo systemctl restart php8.3-fpm
sudo systemctl restart nginx
</code></pre>
<p>You can also check what happened during the initial setup by looking at the cloud-init log:</p>
<pre><code class="language-bash">sudo cat /var/log/cloud-init-output.log
</code></pre>
<p>Everything the bootstrap script printed ends up in that file. If a package failed to install or Composer threw an error, it'll be in there.</p>
<h2>Cleanup</h2>
<p>When you're done, tear it all down:</p>
<pre><code class="language-bash">terraform destroy
</code></pre>
<p>Type <code>yes</code> and Terraform deletes everything. Elastic IP, instance, security group, route table, gateway, subnet, VPC. All of it. Takes about 60 seconds.</p>
<p>This is honestly one of my favorite things about using Terraform for this stuff. No surprise bills next month because you forgot about a running instance. And the elastic IP gets released too. AWS charges you for elastic IPs that aren't attached to anything, so cleaning up properly actually saves you money.</p>
<p>Want to bring it all back? Just run <code>terraform apply</code> again. Same config, same result.</p>
<h2>Wrapping Up</h2>
<p>Look, EC2 is still a perfectly good way to run a Laravel app on AWS. Not everything needs containers or Lambda. Sometimes simple is the right answer. And with Terraform you can version control the whole setup and recreate it whenever.</p>
<p>What we built today is a solid starting point. You could add RDS for a proper database, throw a load balancer in front for SSL termination, or use ACM for a free TLS certificate. All of that is just more Terraform on top of what you already have. Actually, I've been meaning to try Terragrunt for managing multiple environments but haven't gotten around to it yet.</p>
<p>Hope you enjoyed this one. If you have questions or want to show me what you built on top of this setup, find me on Twitter at <a href="https://x.com/HarunRRayhan">https://x.com/HarunRRayhan</a>. Always happy to chat about this stuff.</p>
