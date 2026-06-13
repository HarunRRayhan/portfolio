---
title: "AWS WAF + CloudFront for a Solo Dev - Rate Limiting, Bot Control, and IP Blocking"
slug: "aws-waf-cloudfront-solo-dev"
brief: "How to set up AWS WAF in front of CloudFront for a solo-built application, with rate limiting, bot control, and IP block rules, all managed with Terraform."
publishedAt: "2026-06-16T09:00:00.000Z"
draft: true
draftToken: "waf-cloudfront-preview-2026"
readTimeInMinutes: 10
reactionCount: 0
responseCount: 0
replyCount: 0
tags:
  - name: AWS
    slug: aws
  - name: WAF
    slug: waf
  - name: CloudFront
    slug: cloudfront
  - name: Security
    slug: security
  - name: Terraform
    slug: terraform
---

<p>I run a handful of personal projects behind CloudFront. For a long time I thought WAF was overkill for a solo dev. A waste of money and complexity. Then I watched a single scraper hit my API 50,000 times in an afternoon and spike my Lambda costs by $40. That changed my mind.</p>
<p>AWS WAF in front of CloudFront costs about $6 per month for the web ACL plus whatever you add in rule groups. For that you get rate limiting, IP blocking, bot detection, and managed threat protection. Compared to the cost of one bad day with an unchecked scraper, it pays for itself in the first hour.</p>
<p>This post walks through what I actually run. Real Terraform configs, real thresholds, real gotchas. No academic architecture diagrams. Just what works for a single developer who wants protection without a security team.</p>

<h2 id="heading-why-waf-for-a-solo-dev">Why WAF for a Solo Dev</h2>
<p>The standard argument against WAF at small scale is that you can handle bad traffic at the application layer. Write a rate limiter middleware, parse user-agent headers, maintain an IP blocklist in Redis. I have done all of that. It works until it does not.</p>
<p>Application-level rate limiting runs inside your compute. Every request that gets rate limited still consumed CPU cycles, database connections, and memory. It still counts toward your Lambda invocation costs. WAF stops requests before they reach your application. The request never touches your origin. You pay nothing for compute or data transfer on the requests you blocked.</p>
<p>The other reason is maintenance. I do not want to deploy code changes every time I need to block a range of IPs or update a rate limit threshold. WAF rules update in minutes. No deployment pipeline. No code review. Just a Terraform apply or a console change.</p>

<h2 id="heading-the-terraform-module">The Terraform Module</h2>
<p>Here is the full module I use. It creates a WAFv2 web ACL attached to a CloudFront distribution, with rate limiting, managed rule groups, bot control, and an IP set for manual blocks.</p>
<p>I keep this in <code>modules/waf-cloudfront/main.tf</code> and reference it from my root configuration.</p>

<pre><code># modules/waf-cloudfront/main.tf

locals {
  name_prefix = var.name_prefix != "" ? var.name_prefix : "waf"
}

resource "aws_wafv2_ip_set" "blocked_ips" {
  count = length(var.blocked_ip_addresses) > 0 ? 1 : 0

  name        = "${local.name_prefix}-blocked-ips"
  description = "IP addresses to block"
  scope       = "CLOUDFRONT"
  ip_address_version = "IPV4"
  addresses   = var.blocked_ip_addresses
}

resource "aws_wafv2_web_acl" "main" {
  name        = "${local.name_prefix}-web-acl"
  description = "Web ACL for CloudFront protection"
  scope       = "CLOUDFRONT"

  default_action {
    allow {}
  }

  # ---------- Rate limiting ----------

  rule {
    name     = "rate-limit"
    priority = 0

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = var.rate_limit
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${local.name_prefix}RateLimit"
      sampled_requests_enabled   = true
    }
  }

  # ---------- AWS Managed Rule Groups (Baseline) ----------

  rule {
    name     = "aws-managed-baseline"
    priority = 10

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"

        rule_action_override {
          name = "NoUserAgent_HEADER"
          action_to_use {
            block {}
          }
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${local.name_prefix}Baseline"
      sampled_requests_enabled   = true
    }
  }

  # ---------- SQL Injection ----------

  rule {
    name     = "aws-managed-sqli"
    priority = 20

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${local.name_prefix}Sqli"
      sampled_requests_enabled   = true
    }
  }

  # ---------- XSS ----------

  rule {
    name     = "aws-managed-xss"
    priority = 30

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${local.name_prefix}Xss"
      sampled_requests_enabled   = true
    }
  }

  # ---------- Bot Control ----------

  rule {
    name     = "bot-control"
    priority = 40

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesBotControlRuleSet"
        vendor_name = "AWS"
        version     = "WAFBotControlLatest"

        managed_rule_group_configs {
          aws_managed_rules_bot_control_rule_set {
            inspection_level = "COMMON"
          }
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${local.name_prefix}BotControl"
      sampled_requests_enabled   = true
    }
  }

  # ---------- IP Block List ----------

  dynamic "rule" {
    for_each = length(var.blocked_ip_addresses) > 0 ? [1] : []
    content {
      name     = "block-ip-set"
      priority = 50

      action {
        block {}
      }

      statement {
        ip_set_reference_statement {
          arn = aws_wafv2_ip_set.blocked_ips[0].arn
        }
      }

      visibility_config {
        cloudwatch_metrics_enabled = true
        metric_name                = "${local.name_prefix}BlockedIps"
        sampled_requests_enabled   = true
      }
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${local.name_prefix}WebAcl"
    sampled_requests_enabled   = true
  }
}

resource "aws_wafv2_web_acl_association" "cloudfront" {
  resource_arn = var.cloudfront_arn
  web_acl_arn  = aws_wafv2_web_acl.main.arn
}

# ---------- CloudWatch Alarms ----------

resource "aws_cloudwatch_metric_alarm" "blocked_requests_high" {
  alarm_name          = "${local.name_prefix}-blocked-requests-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "BlockedRequests"
  namespace           = "AWS/WAFV2"
  period              = 300
  statistic           = "Sum"
  threshold           = var.alarm_blocked_threshold
  alarm_description   = "Alert when blocked requests exceed threshold in 10 minutes"
  treat_missing_data  = "notBreaching"

  dimensions = {
    Rule   = "ALL"
    Region = "global"
    WebACL = aws_wafv2_web_acl.main.name
  }

  alarm_actions = [var.sns_topic_arn]
}
</code></pre>

<pre><code># modules/waf-cloudfront/variables.tf

variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
  default     = "waf"
}

variable "cloudfront_arn" {
  description = "ARN of the CloudFront distribution to associate"
  type        = string
}

variable "rate_limit" {
  description = "Maximum requests per 5-minute window per IP"
  type        = number
  default     = 2000
}

variable "blocked_ip_addresses" {
  description = "List of IP addresses or CIDR blocks to block"
  type        = list(string)
  default     = []
}

variable "sns_topic_arn" {
  description = "ARN of SNS topic for alarm notifications"
  type        = string
  default     = ""
}

variable "alarm_blocked_threshold" {
  description = "Threshold for blocked requests alarm (sum over 5 minutes)"
  type        = number
  default     = 1000
}
</code></pre>

<h2 id="heading-rate-limiting-how-to-set-thresholds">Rate Limiting: How to Set Thresholds</h2>
<p>Rate limiting is the single most useful rule for a solo dev. It protects your origin from brute force attacks, scraping, and accidental runaway clients.</p>
<p>The rate limit in the module above is set per IP over a 5-minute rolling window. A threshold of 2,000 requests per 5 minutes works out to about 6.6 requests per second per IP. That is generous enough for normal API usage but aggressive enough to stop most abuse.</p>
<p>I set my threshold by looking at CloudFront access logs for the previous week. I took the 95th percentile of requests per IP per 5 minutes and doubled it. That gave me a number that would never trip on legitimate traffic but catches spikes early.</p>
<p>For a content site (not an API), you can set it higher. For a login endpoint, set it lower. You can have multiple rate limit rules with different thresholds targeting different URI paths.</p>

<pre><code># Example: stricter rate limit on login endpoint
rule {
  name     = "rate-limit-login"
  priority = 1

  action {
    block {}
  }

  statement {
    rate_based_statement {
      limit              = 100
      aggregate_key_type = "IP"

      scope_down_statement {
        byte_match_statement {
          field_to_match {
            uri_path {}
          }
          positional_constraint = "STARTS_WITH"
          search_string        = "/login"
        }
      }
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "RateLimitLogin"
    sampled_requests_enabled   = true
  }
}
</code></pre>

<p>The <code>scope_down_statement</code> limits the rate counter to only requests matching a pattern. In this case, only requests to paths starting with <code>/login</code> count toward the 100 request per 5 minute limit per IP. This is how you protect authentication endpoints without penalizing the rest of your site.</p>

<h2 id="heading-aws-managed-rule-groups">AWS Managed Rule Groups</h2>
<p>The managed rule groups are pre-built rule sets maintained by the AWS security team. They update automatically as new threats emerge. You do not need to follow CVE announcements or update regex patterns.</p>
<p>I use three of them:</p>
<p><strong>AWSManagedRulesCommonRuleSet</strong> covers the OWASP top 10 basics. Known bad headers, path traversal, RFI, SSRF. I overrode the <code>NoUserAgent_HEADER</code> rule to block instead of count. Most legitimate clients send a user-agent header. If a request lacks one, I do not want it reaching my application.</p>
<p><strong>AWSManagedRulesSQLiRuleSet</strong> catches SQL injection attempts in query parameters, body, and URI paths. If you have a database-backed application, this is non-negotiable.</p>
<p><strong>AWSManagedRulesKnownBadInputsRuleSet</strong> covers XSS and other input-based attacks. It checks for common XSS payload patterns in request parameters and bodies.</p>
<p>All three run in count mode by default in my config, which means they log matches but do not block. I let them run for a week, review the logs, whitelist any false positives, then switch to block mode. For the config above I left them as <code>override_action { none {} }</code> which means they use the managed group's default action (usually count). If you want to force block, change it to:</p>

<pre><code>override_action {
  count {}
}
</code></pre>

<p>Wait. That is count, not block. To override to block, you do not set an override_action at all and set the rule action. Actually, the correct pattern for forcing managed rules to block is more nuanced. The managed rule group has its own rule actions. Set <code>override_action { none {} }</code> and then use <code>rule_action_override</code> on individual rules within the group if you want to change specific ones. For most solo projects, the default actions work fine. The managed groups will block the most severe detections by default and count the rest.</p>

<h2 id="heading-bot-control">Bot Control</h2>
<p>Bot Control is a managed rule group that classifies bots into categories: verified (Googlebot, Bingbot), unverified (scrapers, crawlers), and malicious (bad bots, credential stuffers).</p>
<p>It costs about $10 per month on top of the base WAF ACL cost. Worth it if you run a public API or a content site that attracts scrapers.</p>
<p>What it catches:</p>
<ul>
<li><strong>Scrapers</strong> that fake browser user-agent strings but behave differently at the HTTP level (no JavaScript execution, predictable request timing, no Accept-Language headers).</li>
<li><strong>Headless browsers</strong> used for automated form submissions.</li>
<li><strong>HTTP libraries</strong> (requests, curl, httpx) that are sometimes used for legitimate purposes but also for abuse.</li>
</ul>
<p>The inspection level in my config is <code>COMMON</code> which is the cheaper and less aggressive option. <code>TARGETED</code> is more thorough but costs more and has a higher chance of false positives. Start with COMMON.</p>
<p>Bot Control in count mode gives you a label on each request. You can see in CloudWatch which requests were classified as bots without blocking anything. I ran it in count mode for two weeks before enabling blocking.</p>

<h2 id="heading-ip-set-rules">IP Set Rules for Blocking Known Bad Actors</h2>
<p>Some IPs and ASNs abuse your application repeatedly. A single IP hammering your API from a datacenter. A range of IPs from a hosting provider you do not do business with. These belong in an IP set.</p>
<p>The module above creates a <code>aws_wafv2_ip_set</code> resource and a rule that blocks all traffic from those IPs. I update the list manually when I see abuse in the logs.</p>
<p>You can also subscribe to threat intelligence feeds that publish lists of known bad IPs. AbuseIPDB, Spamhaus, and AlienVault OTX all have free or low-cost feeds. With a scheduled Lambda function you can pull these feeds, parse them, and update your IP set automatically. That is a separate project, but the WAF side of it is straightforward once you have the IP set resource configured.</p>

<h2 id="heading-cloudwatch-metrics-and-alarms">CloudWatch Metrics and Alarms</h2>
<p>WAF publishes metrics to CloudWatch automatically. The important ones:</p>
<ul>
<li><strong>AllowedRequests</strong> - requests that passed all rules</li>
<li><strong>BlockedRequests</strong> - requests that were blocked</li>
<li><strong>CountedRequests</strong> - requests that matched a rule but were not blocked (count mode)</li>
<li><strong>PassedRequests</strong> - requests that did not match any rule</li>
</ul>
<p>I set an alarm on <code>BlockedRequests</code> to notify me when blocked traffic spikes. If I see a sudden increase, I investigate. Sometimes it is a legitimate change in traffic patterns. Sometimes it is an attack that my rate limit is catching.</p>
<p>The alarm in the module triggers when the sum of blocked requests exceeds a threshold over two consecutive 5-minute periods. I set mine to 1,000 blocked requests per 5 minutes. You will want to tune this based on your normal traffic volume.</p>

<h2 id="heading-testing">Testing: curl and Artillery</h2>
<p>Before you put a WAF in production, test that it works the way you expect. Here is how I test mine.</p>
<p><strong>Rate limiting test with curl:</strong></p>

<pre><code># Run this in a loop to trigger rate limiting
for i in $(seq 1 100); do
  curl -s -o /dev/null -w "%{http_code}\n" https://your-domain.com/
done
</code></pre>

<p>After hitting the rate limit threshold, you should see <code>503</code> responses with a <code>waf</code> block reason. The 503 is WAF's way of saying "I blocked this, but the origin never saw it."</p>
<p><strong>Load test with Artillery:</strong></p>

<pre><code>npm install -g artillery

cat > load-test.yaml &lt;&lt;EOF
config:
  target: "https://your-domain.com"
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 60
      arrivalRate: 50
      name: "Sustained load"
  defaults:
    headers:
      User-Agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"

scenarios:
  - flow:
      - get:
          url: "/"
EOF

artillery run load-test.yaml
</code></pre>

<p>Watch the CloudWatch metrics during the test. You should see BlockedRequests increase when the rate limit rule activates. If you see 200s throughout, your threshold is too high. If you see 503s during the warm-up phase, your threshold is too low.</p>
<p><strong>SQL injection test:</strong></p>

<pre><code>curl "https://your-domain.com/?id=1%27%20OR%20%271%27%3D%271"
</code></pre>

<p>This should return a 403 or 503 depending on which managed rule catches it. The SQLi rule group will block this request.</p>
<p><strong>Bot test with a raw HTTP client:</strong></p>

<pre><code>curl -A "" https://your-domain.com/
</code></pre>

<p>With the <code>NoUserAgent_HEADER</code> override I set above, this request gets blocked. You should see a 403 response.</p>

<h2 id="heading-gotchas">Gotchas</h2>

<h3 id="heading-waf-regional-vs-cloudfront-global">WAF Regional vs. CloudFront Global</h3>
<p>This is the most important thing to understand. WAF can be deployed in two scopes: <code>REGIONAL</code> and <code>CLOUDFRONT</code>.</p>
<p>When you attach WAF to CloudFront, the scope must be <code>CLOUDFRONT</code>. This deploys the WAF to AWS's edge locations globally. The IP set for a CloudFront-scoped WAF must use IPv4 or IPv6 addresses, not ranges that overlap with AWS internal ranges.</p>
<p>If you attach WAF to an Application Load Balancer, API Gateway, or AppSync, the scope is <code>REGIONAL</code>. The rules are evaluated in that region only.</p>
<p>You cannot reuse a regional WAF ACL with CloudFront, and you cannot reuse a CloudFront-scoped WAF ACL with anything else. They are separate resource types in the API even though they look identical in the console.</p>
<p>In Terraform, the <code>scope</code> attribute on <code>aws_wafv2_web_acl</code> controls this. CloudFront requires <code>scope = "CLOUDFRONT"</code>. ALB requires <code>scope = "REGIONAL"</code>.</p>

<h3 id="heading-60-second-propagation-delay">60-Second Propagation Delay</h3>
<p>When you create or update a WAF ACL, the changes propagate to edge locations within about 60 seconds. During that propagation window, old rules may still be in effect at some edge locations while new rules are active at others.</p>
<p>This is not usually a problem. The propagation is eventually consistent. If you are blocking an IP that is actively attacking you, the 60-second delay means they might get a few more requests through before the block applies everywhere. That is fine.</p>
<p>What you should not do is make a change, test it immediately from a single location, and assume the result represents global behavior. Give it a minute.</p>

<h3 id="heading-cloudfront-waf-vs-alb-waf-pricing-differences">CloudFront WAF vs. ALB WAF Pricing Differences</h3>
<p>CloudFront-scoped WAF does not charge for data transfer on blocked requests because the request never reaches an AWS region. Regional WAF on an ALB still processes the request through the load balancer before WAF evaluates it, so you pay for the ALB processing even for blocked requests.</p>
<p>For a solo dev serving traffic globally, CloudFront + WAF is both cheaper and more effective than ALB + WAF. You get edge caching, DDoS protection (AWS Shield Standard is included with CloudFront), and WAF blocking at the edge. Three services for the price of one plus WAF.</p>

<h3 id="heading-rate-limit-is-per-edge-location">Rate Limit Is Per Edge Location</h3>
<p>The rate limit counter is per individual CloudFront edge location, not global. If your traffic is distributed across 50 edge locations, a single IP could send up to 50 times your rate limit before getting blocked.</p>
<p>This is a known limitation. AWS documents it explicitly. If you need strict global rate limits, you need to implement them at the application layer or use CloudFront origin-facing rate limiting with Lambda@Edge. For most solo projects, the per-edge-location rate limit is good enough to stop abuse without requiring global precision.</p>

<h2 id="heading-what-this-costs">What This Costs</h2>
<p>Here is the real cost breakdown for a single web ACL with the rules above, serving fewer than 10 million requests per month:</p>
<ul>
<li>Web ACL: $5.00 per month (prorated, ~$0.007 per hour)</li>
<li>Rule group usage: free for AWS managed rules (you pay per rule over your first 10, but managed group rules in the first 10 count differently - the pricing page is confusing, so check the current rates)</li>
<li>Bot Control: $10.00 per month if enabled</li>
<li>IP Set: free (included in ACL price)</li>
<li>CloudWatch metrics and alarms: a few cents</li>
</ul>
<p>Total: around $6 per month without Bot Control, $16 with it. If you are running a Lambda-based API that costs $20-50 per month in compute, adding WAF might increase your AWS bill by 10-30%. For me, the peace of mind and the prevention of one bad incident per year makes it worth it.</p>

<h2 id="heading-usage">Usage</h2>
<p>Here is how I call the module from my root configuration:</p>

<pre><code># locals.tf
locals {
  cloudfront_arn = "arn:aws:cloudfront::123456789012:distribution/ABCDEF1234"
  domain         = "myapp.com"
}

# waf.tf
module "waf" {
  source = "./modules/waf-cloudfront"

  name_prefix          = "myapp"
  cloudfront_arn       = local.cloudfront_arn
  rate_limit           = 2000
  blocked_ip_addresses = [
    "192.0.2.0/24",
    "198.51.100.10/32",
  ]
  sns_topic_arn        = aws_sns_topic.alerts.arn
}
</code></pre>

<p>That is the entire setup. One <code>terraform apply</code> and your CloudFront distribution has rate limiting, SQL injection protection, XSS protection, bot detection, and an IP block list.</p>

<h2 id="heading-wrapping-up">Wrapping Up</h2>
<p>WAF is not just for enterprise teams with dedicated security engineers. For a solo developer running a production application on CloudFront, the setup cost is one afternoon of Terraform work and the ongoing cost is less than a coffee subscription.</p>
<p>The module in this post is what I run in production. It has stopped scrapers, blocked credential stuffing attempts, and absorbed traffic spikes that would have cost me real money in Lambda execution time. You can copy it directly, adjust the rate limit to your traffic patterns, and deploy it in one Terraform apply.</p>
<p>One thing I left out: the WAF logs. You should enable logging to S3 or CloudWatch Logs to see what is being blocked and tune your rules. That is a topic on its own, but the short version is you pass a <code>logging_configuration</code> block to the web ACL resource and point it at an S3 bucket or a CloudWatch log group. Do not skip this. Without logs, you are flying blind.</p>
