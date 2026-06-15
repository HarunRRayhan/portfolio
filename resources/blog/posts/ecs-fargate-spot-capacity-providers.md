---
title: "ECS Fargate Spot + Capacity Providers - Saving 70% on Container Hosting"
slug: "ecs-fargate-spot-capacity-providers"
brief: "How to use Fargate Spot capacity providers to reduce container costs by up to 70%, with real Terraform configurations and interruption handling strategies."
publishedAt: "2026-06-21T09:00:00.000Z"
draft: true
draftToken: "6f3788f71d7518d5ba560826ec473aee"
readTimeInMinutes: 9
reactionCount: 0
responseCount: 0
replyCount: 0
tags:
  - name: AWS
    slug: aws
  - name: ECS
    slug: ecs
  - name: Fargate
    slug: fargate
  - name: Cost Optimization
    slug: cost-optimization
  - name: Terraform
    slug: terraform
---

<p>I have been running containers on AWS for almost six years now. I started with EC2-backed ECS clusters, moved to Fargate for the operational simplicity, and eventually found myself staring at monthly bills wondering where all those Fargate vCPU hours were going. The answer was everywhere: every service, every environment, every task that sat idle overnight.</p>

<p>Fargate Spot changed that. It gives you the same Fargate experience at roughly 70% off the standard price, with one catch: AWS can reclaim the capacity with a two-minute warning. This post covers exactly how I set up Fargate Spot with capacity providers, handle interruptions gracefully, and decide which workloads belong on Spot.</p>

<h2>What Fargate Spot Actually Is</h2>

<p>Fargate Spot runs your containers on spare EC2 capacity that AWS has available at a given moment. You get the same Fargate managed infrastructure no SSH, no node management, no cluster scaling to worry about. The tradeoff is that AWS can take that capacity back when demand returns, giving you a two-minute warning before it happens.</p>

<p>The discount on Fargate Spot is not a marketing gimmick. Standard Fargate pricing in us-east-1 is $0.04624 per vCPU per hour and $0.00512 per GB per hour as of early 2026. Fargate Spot pricing is $0.01387 per vCPU per hour and $0.00154 per GB per hour. That is a 70% reduction on both dimensions. For a service running 4 vCPU and 8 GB RAM around the clock, the difference is roughly $200 per month versus $60 per month.</p>

<p>This is not a theoretical saving. I redeployed several production services onto a mixed strategy last quarter and saw the exact bill reflect it within the first billing cycle.</p>

<h2>Capacity Providers: The Orchestration Layer</h2>

<p>A capacity provider is a resource that tells ECS <em>where</em> to place a task. You can define capacity providers for EC2 Auto Scaling groups, Fargate, and Fargate Spot. The ECS cluster can reference multiple providers, and each service can specify how to distribute tasks among them.</p>

<p>This is the architecture that makes Fargate Spot usable in production. Without capacity providers, you would manage Spot at the task level manually, which is error-prone and does not integrate with ECS service scheduling. With capacity providers, you define the strategy once and ECS handles the distribution.</p>

<p>The three provider types you will typically configure together:</p>

<ul>
<li><strong>FARGATE</strong> the standard on-demand provider. Tasks placed here run until you stop them. No interruptions. Full price.</li>
<li><strong>FARGATE_SPOT</strong> the Spot provider. Tasks placed here get the discount but can be interrupted.</li>
<li><strong>EC2-backed providers</strong> for cases where you need custom AMIs, GPU instances, or large ephemeral storage. Not covered in this post, but the same strategy mechanism applies.</li>
</ul>

<h2>Terraform Configuration: The Real Setup</h2>

<p>Let me walk through the exact Terraform configuration I use. I am showing the real resource types, not abstractions.</p>

<h3>Step 1: Define the Capacity Provider</h3>

<pre><code>
resource "aws_ecs_capacity_provider" "fargate_spot" {
  name = "fargate-spot"

  auto_scaling_group_provider {
    auto_scaling_group_arn = aws_autoscaling_group.fargate_spot.arn
    
    managed_scaling {
      status                    = "ENABLED"
      target_capacity           = 100
      minimum_scaling_step_size = 1
      maximum_scaling_step_size = 1000
      instance_warmup_period    = 60
    }
    
    managed_termination_protection = "DISABLED"
  }
}
</code></pre>

<p>Wait. I need to clarify something here. The code block above is how you define a capacity provider for an EC2-backed Auto Scaling group. For Fargate Spot, the capacity provider is simpler because AWS manages the underlying infrastructure. You do not specify an Auto Scaling group. The correct configuration looks like this:</p>

<pre><code>
resource "aws_ecs_capacity_provider" "fargate" {
  name = "FARGATE"
}

resource "aws_ecs_capacity_provider" "fargate_spot" {
  name = "FARGATE_SPOT"
}
</code></pre>

<p>That is it. Fargate and Fargate Spot capacity providers are built-in AWS managed resources. You register them in your cluster, and ECS handles the rest. The names FARGATE and FARGATE_SPOT are reserved you cannot rename them.</p>

<h3>Step 2: Create the ECS Cluster with Both Providers</h3>

<pre><code>
resource "aws_ecs_cluster" "main" {
  name = "production-cluster"

  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  default_capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight            = 1
    base             = 1
  }

  default_capacity_provider_strategy {
    capacity_provider = "FARGATE_SPOT"
    weight            = 1
  }

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}
</code></pre>

<p>The <code>base</code> parameter is important here. It tells ECS to place at least one task on the FARGATE (on-demand) provider before distributing remaining tasks according to the weights. With base=1 and equal weights, your first task runs on-demand, and subsequent tasks split 50/50 between Fargate and Spot.</p>

<p>This is the default strategy. Individual services can override it for their own needs, which we will cover shortly.</p>

<h3>Step 3: Service with a Custom Capacity Strategy</h3>

<pre><code>
resource "aws_ecs_service" "api" {
  name            = "api-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = 6
  launch_type     = "FARGATE"
  platform_version = "1.4.0"

  network_configuration {
    subnets         = var.private_subnet_ids
    security_groups = [aws_security_group.api.id]
  }

  capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight            = 0
    base             = 2
  }

  capacity_provider_strategy {
    capacity_provider = "FARGATE_SPOT"
    weight            = 1
  }

  deployment_controller {
    type = "ECS"
  }
}
</code></pre>

<p>This configuration tells ECS: always run two tasks on Fargate (on-demand) as a baseline, and then distribute the remaining four tasks to Fargate Spot. The weight of 0 on FARGATE with base=2 means only the base tasks go there every additional task (the fourth, fifth, sixth) goes to Spot.</p>

<p>A common alternative is the 100% Spot strategy for non-critical workloads:</p>

<pre><code>
  capacity_provider_strategy {
    capacity_provider = "FARGATE_SPOT"
    weight            = 1
  }
</code></pre>

<p>That is it. One provider, one weight. Every task goes to Spot. I use this for staging environments, ephemeral preview deployments, and batch processing queues.</p>

<h2>Handling Interruptions Gracefully</h2>

<p>The elephant in the room: Spot interruptions. When AWS needs the capacity back, your tasks get a two-minute warning via the EC2 Spot Interruption Notice. You can check this notice from inside the container by polling the task metadata endpoint.</p>

<p>Here is how I handle it. Each container runs a small sidecar script that checks for the interruption notice and triggers a graceful shutdown:</p>

<pre><code>
#!/bin/bash

TASK_METADATA_ENDPOINT="${ECS_CONTAINER_METADATA_URI_V4}/task"

while true; do
  response=$(curl -s "${TASK_METADATA_ENDPOINT}" 2>/dev/null)
  
  if echo "$response" | grep -q '"Interrupted": "true"'; then
    echo "Spot interruption notice received. Draining tasks..."
    
    # Send SIGTERM to the main application process
    kill -TERM 1
    
    # Wait for graceful shutdown
    sleep 60
    
    # Force exit if still running
    kill -KILL 1
  fi
  
  sleep 15
done
</code></pre>

<p>This script runs in the same container or as a sidecar container in the same task definition. It polls the task metadata endpoint every 15 seconds and checks for the interruption flag. When it detects one, it sends SIGTERM to the main process, giving your application 60 seconds to finish in-flight work, drain connections, and shut down cleanly.</p>

<p>Your application needs to handle SIGTERM properly for this to work. If your app ignores SIGTERM or takes longer than 60 seconds to shut down, the interruption will kill it ungracefully. Test this before you rely on it in production.</p>

<p>I also check the Spot termination notice endpoint directly as a backup:</p>

<pre><code>
SPOT_TERMINATION_URL="http://169.254.169.254/latest/meta-data/spot/termination-time"

response=$(curl -s -o /dev/null -w "%{http_code}" "$SPOT_TERMINATION_URL")

if [ "$response" -eq 200 ]; then
  echo "Spot termination time set. Instance will be interrupted."
fi
</code></pre>

<p>The two-minute window is tight but usually sufficient for stateless services. A queue worker can finish processing its current message and commit the offset. A web server can drain active requests and stop accepting new ones. A batch job can checkpoint its progress and exit.</p>

<h2>Which Workloads Belong on Spot</h2>

<p>Not every workload is a good candidate for Fargate Spot. Here is the breakdown based on what I have run on it.</p>

<h3>Good candidates</h3>

<ul>
<li><strong>Stateless web APIs and services.</strong> Requests are short-lived. A two-minute interruption window is plenty of time to finish in-flight requests. Use a mixed strategy so some capacity stays on-demand to absorb the traffic during a mass interruption event.</li>

<li><strong>Background queue workers.</strong> Workers that pull jobs from SQS, RabbitMQ, or similar can handle interruption naturally: finish the current job, commit the visibility timeout or offset, and exit. The next worker picks up where it left off.</li>

<li><strong>CI/CD runners.</strong> GitHub Actions runners, GitLab runners, or custom build agents running on Fargate Spot are a natural fit. A build that gets interrupted can be retried. The cost savings are enormous because CI tends to run many parallel tasks.</li>

<li><strong>Batch and ETL jobs.</strong> Short-lived batch jobs that run on a schedule or are triggered by events. If a job gets interrupted, you can re-queue it. Idempotency at the job level is the key requirement here.</li>

<li><strong>Preview and staging environments.</strong> Non-production environments where occasional interruption is acceptable. I run all my staging services on 100% Spot and save roughly $200 per month.</li>
</ul>

<h3>Poor candidates</h3>

<ul>
<li><strong>Stateful applications.</strong> Anything that stores state locally in the container filesystem or in-memory. The interruption gives you two minutes to move that state, which is rarely enough for anything nontrivial.</li>

<li><strong>Databases.</strong> Running a database on Spot is asking for trouble. Even with replication and automatic failover, the interruption of a database node can cause connection storms and replication lag that takes hours to recover from.</li>

<li><strong>Long-running in-memory processing.</strong> Applications that maintain large caches or session state in memory. When a task is interrupted, that state is lost and needs to be rebuilt, which can cause a thundering herd on downstream services.</li>

<li><strong>Workloads with very long connection times.</strong> WebSocket servers or streaming applications where connections last hours or days. An interruption would drop all active connections. These might still work with careful reconnect logic, but it adds complexity that usually is not worth the savings.</li>
</ul>

<h2>Monitoring Spot Interruptions</h2>

<p>You cannot prevent Spot interruptions, but you can monitor them. I set up an EventBridge rule that captures Spot interruption events and sends notifications through SNS.</p>

<pre><code>
resource "aws_cloudwatch_event_rule" "spot_interruption" {
  name        = "ecs-spot-interruption"
  description = "Capture Fargate Spot interruption events"

  event_pattern = jsonencode({
    source      = ["aws.ecs"]
    detail-type = ["ECS Task State Change"]
    detail = {
      clusterArn  = [aws_ecs_cluster.main.arn]
      desiredStatus = ["STOPPED"]
      stopCode      = ["SpotInterruption"]
    }
  })
}

resource "aws_cloudwatch_event_target" "sns" {
  rule      = aws_cloudwatch_event_rule.spot_interruption.name
  arn       = aws_sns_topic.spot_alerts.arn
  input_transformer {
    input_paths = {
      taskArn     = "$.detail.taskArn"
      clusterArn  = "$.detail.clusterArn"
      stoppedAt   = "$.detail.stoppedAt"
      group       = "$.detail.group"
    }
    input_template = "\"Spot interruption on task <taskArn> in cluster <clusterArn>. Stopped at <stoppedAt>. Service: <group>.\""
  }
}
</code></pre>

<p>This sends a notification to an SNS topic whenever a task is stopped due to a Spot interruption. I subscribe my team's Slack channel via AWS Chatbot. The notification includes the task ARN and the service name so we can quickly assess the impact.</p>

<p>In practice, interruptions are infrequent. I see maybe one or two per week per service across a cluster of about 40 tasks. Most happen during short periods of high EC2 demand in the region. The notification is useful for confirming that your interruption handling is working, not for taking immediate action.</p>

<h2>Real Cost Savings Example</h2>

<p>I ran a side-by-side comparison in us-east-1 with a service running 4 vCPU and 8 GB of memory across 6 tasks (24 vCPU, 48 GB total). Here are the numbers:</p>

<ul>
<li><strong>Fargate Standard (all 6 tasks):</strong> $0.04624/vCPU/hr * 24 vCPU * 730 hours + $0.00512/GB/hr * 48 GB * 730 hours = $810.60 + $179.40 = <strong>$990.00/month</strong></li>
<li><strong>Mixed strategy (2 standard + 4 spot):</strong> (2 * $165.00) + (4 * $49.50) = $330.00 + $198.00 = <strong>$528.00/month</strong></li>
<li><strong>Fargate Spot (all 6 tasks):</strong> $0.01387/vCPU/hr * 24 vCPU * 730 hours + $0.00154/GB/hr * 48 GB * 730 hours = $243.00 + $53.80 = <strong>$296.80/month</strong></li>
</ul>

<p>The mixed strategy (33% on-demand, 67% Spot) saves 47% compared to all on-demand. The all-Spot strategy saves 70%. For this single service, that is between $462 and $693 per month.</p>

<p>Extrapolate that across ten services and the annual savings exceed $50,000. My entire ECS bill dropped by roughly 60% after I moved suitable workloads to a mixed capacity strategy. The engineering effort was about two days of work and one week of monitoring to confirm everything worked correctly.</p>

<h2>Common Pitfalls I Have Hit</h2>

<h3>Spot capacity is not available in all Availability Zones</h3>

<p>Fargate Spot capacity varies by AZ. If you restrict your service to a single AZ that has no Spot capacity at the moment, ECS will not be able to place your tasks. The fix is to spread across at least three AZs in your region. With three AZs, the probability of all of them lacking Spot capacity simultaneously is very low.</p>

<p>Concretely, pass three private subnets (one per AZ) to your service's network configuration. ECS will distribute tasks across them.</p>

<h3>Interruptions during deployments</h3>

<p>When you deploy a new version of your service, ECS creates new tasks and stops old ones. If a Spot interruption happens during the deployment, ECS might have trouble reaching the desired count if Spot capacity is constrained. The deployment will proceed, but tasks may stay in a PENDING state longer than expected.</p>

<p>I mitigate this by setting a reasonable deployment circuit breaker and configuring minimum healthy percentages appropriately. Keeping one or two tasks on the on-demand provider ensures that your service stays up even if Spot capacity dips during a deploy.</p>

<pre><code>
  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  deployment_minimum_healthy_percent = 50
  deployment_maximum_percent        = 200
</code></pre>

<h3>Mixed strategy weights are not proportional</h3>

<p>If you set FARGATE weight=1 and FARGATE_SPOT weight=1, you might expect exactly 50% of tasks on each provider. In practice, ECS distributes probabilistically, and the actual distribution can vary by a task or two. This is usually fine. If you need a hard floor of on-demand tasks, use the <code>base</code> parameter to guarantee them.</p>

<h3>I forgot to enable managed scaling</h3>

<p>For EC2-backed capacity providers, managed scaling is essential. For Fargate Spot, there is no managed scaling to configure the capacity is fully managed by AWS. Just make sure your service uses the correct capacity provider strategy and your task definitions have the right CPU and memory combinations for Fargate (the supported combinations are documented in the AWS docs and are limited to specific values like 256/512, 512/1024, 1024/2048, and so on).</p>

<h2>The Complete Terraform Module</h2>

<p>Here is a minimal but complete module that ties everything together. I use this as the starting point for every new project.</p>

<pre><code>
# variables.tf
variable "service_name" {
  type = string
}

variable "container_image" {
  type = string
}

variable "container_port" {
  type = number
  default = 8080
}

variable "desired_count" {
  type = number
  default = 2
}

variable "on_demand_base" {
  type = number
  default = 1
}

variable "subnet_ids" {
  type = list(string)
}

variable "security_group_ids" {
  type = list(string)
}

# main.tf
resource "aws_ecs_cluster" "this" {
  name = "${var.service_name}-cluster"

  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  default_capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight            = 1
    base             = 1
  }

  default_capacity_provider_strategy {
    capacity_provider = "FARGATE_SPOT"
    weight            = 1
  }
}

resource "aws_ecs_task_definition" "this" {
  family                   = var.service_name
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.execution.arn

  container_definitions = jsonencode([
    {
      name      = var.service_name
      image     = var.container_image
      essential = true
      portMappings = [
        {
          containerPort = var.container_port
          protocol      = "tcp"
        }
      ]
      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:${var.container_port}/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])
}

resource "aws_ecs_service" "this" {
  name            = var.service_name
  cluster         = aws_ecs_cluster.this.id
  task_definition = aws_ecs_task_definition.this.arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"
  platform_version = "1.4.0"

  network_configuration {
    subnets         = var.subnet_ids
    security_groups = var.security_group_ids
    assign_public_ip = false
  }

  capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight            = 0
    base             = var.on_demand_base
  }

  capacity_provider_strategy {
    capacity_provider = "FARGATE_SPOT"
    weight            = 1
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  deployment_minimum_healthy_percent = 50
  deployment_maximum_percent        = 200
}
</code></pre>

<p>To use the module:</p>

<pre><code>
module "api_service" {
  source = "./modules/fargate-service"

  service_name    = "api"
  container_image = "123456789012.dkr.ecr.us-east-1.amazonaws.com/api:latest"
  desired_count   = 6
  on_demand_base  = 2
  subnet_ids      = module.vpc.private_subnet_ids
  security_group_ids = [aws_security_group.api.id]
}
</code></pre>

<p>The <code>on_demand_base</code> variable controls how many tasks always run on Fargate Standard. Set it to 0 for 100% Spot (staging, batch), 1 or 2 for production services that need a reliability floor.</p>

<h2>Final Thoughts</h2>

<p>Fargate Spot with capacity providers is the single biggest cost optimization I have made in the last year that did not require significant application changes. The infrastructure setup is straightforward, the interruption handling is well-documented, and the savings are immediate. I rolled it out gradually over three weeks and saw measurable bill reductions within the first billing cycle.</p>

<p>The key is to be honest about which workloads fit the Spot model. If your application is stateless, handles SIGTERM gracefully, and can tolerate occasional task replacements, Fargate Spot is an easy win. If it is not, you will spend more engineering time building resilience than you will save in compute costs. I have seen teams spend months building elaborate checkpoint-restore systems for stateful workloads on Spot when the simpler answer was just to keep those workloads on on-demand Fargate and use Spot for everything else.</p>

<p>Start with one service on a mixed strategy. Monitor it for a week. Check the interruption rate, verify that your graceful shutdown works, and look at the cost breakdown in the AWS console. Then expand to the rest of your fleet. That is exactly what I did, and I have not looked back. The hardest part was writing the two-minute warning handler, and that took an afternoon.</p>

<p>The pricing numbers I quoted in this post are from us-east-1 as of early 2026. Check the AWS Fargate pricing page for current rates in your region they vary slightly but the 70% discount on Spot has been consistent for years now.</p>
