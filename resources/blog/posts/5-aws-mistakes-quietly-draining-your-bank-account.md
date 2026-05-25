---
title: "5 AWS Mistakes That Are Quietly Draining Your Bank Account"
slug: "5-aws-mistakes-quietly-draining-your-bank-account"
brief: "A client messaged me in a panic last month. Their AWS bill had crossed $3,000 and they had no idea why. They assumed that's just what AWS costs at their scale. A serverless SaaS, decent traffic, nothi"
publishedAt: "2026-05-12T09:00:00.000Z"
readTimeInMinutes: 16
reactionCount: 0
responseCount: 0
replyCount: 0
sourceUrl: "https://web.archive.org/web/*/https://blog.harun.dev/5-aws-mistakes-quietly-draining-your-bank-account"
coverImageUrl: "https://raw.githubusercontent.com/HarunRRayhan/blog-assets/main/covers/5-aws-mistakes-quietly-draining-your-bank-account/cover.jpg"
tags:
  - name: "AWS"
    slug: "aws"
  - name: "Devops"
    slug: "devops"
  - name: "serverless"
    slug: "serverless"
  - name: "Cloud"
    slug: "cloud"
  - name: "webdev"
    slug: "webdev"
---
<p>A client messaged me in a panic last month. Their AWS bill had crossed $3,000 and they had no idea why. They assumed that's just what AWS costs at their scale. A serverless SaaS, decent traffic, nothing crazy. They figured cloud infrastructure is expensive and moved on every month.</p>
<p>I told them to give me read access to their account. I'd take a look.</p>
<p>I spent an entire Saturday in their Cost Explorer, clicking through line items, filtering by service, sorting by usage type. What I found was five separate mistakes they had either configured wrong or never thought about at all. None of them were obvious. None of them showed up as a big red flag in the billing dashboard. They just quietly added up, month after month.</p>
<p>If you're running anything on AWS, especially a serverless setup with Lambda, RDS, and API Gateway, there's a good chance your account has at least one of these problems right now. This client had all five.</p>
<p>Let me walk you through each one and show you exactly how we fixed it.</p>
<p><img src="https://images.pexels.com/photos/7926666/pexels-photo-7926666.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="Surprising bill and financial documents" />
<sub>Photo by <a href="https://www.pexels.com/@nicola-barts">Nicola Barts</a> on <a href="https://www.pexels.com/photo/hand-of-a-man-holding-a-bill-with-past-due-stamp-7926666/">Pexels</a></sub></p>
<h2>Mistake #1: NAT Gateway Data Processing Charges</h2>
<p>This one was the biggest offender. The client thought they understood NAT Gateway pricing. They didn't.</p>
<p>Everyone knows NAT Gateway costs about \(32/month per availability zone just to exist. That's the hourly charge (\)0.045/hour * 730 hours). Most people budget for that and move on. This client did too.</p>
<p>But here's the part nobody talks about. NAT Gateway also charges <strong>$0.045 per GB of data processed</strong>. And that's in both directions. Every byte going through the NAT Gateway gets metered, in and out.</p>
<p>Think about what flows through a NAT Gateway in a typical serverless setup. Your Lambda functions are in private subnets. They need to reach AWS services like S3, Secrets Manager, CloudWatch, and DynamoDB. All of that traffic goes out through the NAT Gateway and back. Every API call to an AWS service. Every log write to CloudWatch. Every secret fetch on cold start.</p>
<p>When I ran the numbers on their account, the Lambda functions were downloading files from S3 for processing, about 200GB per month. They were also calling external APIs and pushing metrics. Total data processed through the NAT Gateway: roughly 350GB per month. That adds up fast on top of the $32 hourly charge. And they had three AZs. The data charges compound quickly when you add CloudWatch log shipping, Secrets Manager calls, and S3 operations.</p>
<p>The actual damage: about <strong>\(580/month</strong> in NAT Gateway costs when they had only budgeted for \)96.</p>
<p><strong>The fix: VPC Endpoints.</strong></p>
<p>VPC endpoints let your Lambda functions reach AWS services directly through the AWS private network, completely bypassing the NAT Gateway. No data processing charges. No hourly NAT charges for that traffic. It just goes straight from your VPC to the service.</p>
<p>Here's the CloudFormation for an S3 Gateway endpoint:</p>
<pre><code class="language-yaml"># S3 VPC Gateway Endpoint - free to use, no data charges
HrrS3VpcEndpoint:
  Type: AWS::EC2::VPCEndpoint
  Properties:
    VpcId: !Ref VPC
    ServiceName: !Sub "com.amazonaws.${AWS::Region}.s3"
    VpcEndpointType: Gateway
    RouteTableIds:
      - !Ref AppRouteTable1
      - !Ref AppRouteTable2

# Secrets Manager Interface Endpoint
HrrSecretsManagerEndpoint:
  Type: AWS::EC2::VPCEndpoint
  Properties:
    VpcId: !Ref VPC
    ServiceName: !Sub "com.amazonaws.${AWS::Region}.secretsmanager"
    VpcEndpointType: Interface
    SubnetIds:
      - !Ref AppSubnet1
      - !Ref AppSubnet2
    PrivateDnsEnabled: true
    SecurityGroupIds:
      - !Ref VpcEndpointSecurityGroup

# CloudWatch Logs Interface Endpoint
HrrCloudWatchLogsEndpoint:
  Type: AWS::EC2::VPCEndpoint
  Properties:
    VpcId: !Ref VPC
    ServiceName: !Sub "com.amazonaws.${AWS::Region}.logs"
    VpcEndpointType: Interface
    SubnetIds:
      - !Ref AppSubnet1
      - !Ref AppSubnet2
    PrivateDnsEnabled: true
    SecurityGroupIds:
      - !Ref VpcEndpointSecurityGroup
</code></pre>
<p>Gateway endpoints (S3 and DynamoDB) are completely free. Interface endpoints cost about $7.20/month per AZ, but they still save you money if you're pushing any meaningful amount of data through the NAT Gateway.</p>
<p>After adding VPC endpoints for S3, Secrets Manager, and CloudWatch Logs, their NAT Gateway data processing dropped by about 70%. That alone saved roughly <strong>$480/month</strong>.</p>
<p><img src="https://images.pexels.com/photos/5480781/pexels-photo-5480781.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="Cloud network infrastructure and data routing" />
<sub>Photo by <a href="https://www.pexels.com/@brett-sayles">Brett Sayles</a> on <a href="https://www.pexels.com/photo/server-racks-on-data-center-5480781/">Pexels</a></sub></p>
<h2>Mistake #2: RDS Running 24/7 in Dev and Staging</h2>
<p>This one made me shake my head because it's so obvious in hindsight.</p>
<p>The client had four environments: dev, staging, QA, and production. Each had its own RDS instance. Production needs to run 24/7, obviously. But dev, staging, and QA? Nobody is using those at 2 AM on a Sunday. Nobody is running tests at 11 PM on a Tuesday. Yet those instances were happily running around the clock, burning money.</p>
<p>They were using db.r6g.large instances for non-production because "we want it to behave like prod." That's about \(0.26/hour per instance, roughly <strong>\)190/month</strong> each. Three non-production instances. That's $570/month for databases that were actually being used maybe 10 hours per day on weekdays. So about 50 hours per week out of 168 total hours. They were paying for 118 hours per week of completely idle database time across three instances.</p>
<p><strong>The fix: Schedule your non-production instances.</strong></p>
<p>I set up a simple Lambda function triggered by EventBridge to stop their instances at night and on weekends, then start them in the morning.</p>
<pre><code class="language-yaml"># EventBridge rule: stop dev/staging RDS at 8 PM ET weekdays
HrrRdsStopSchedule:
  Type: AWS::Events::Rule
  Properties:
    Name: hrr-rds-stop-nonprod
    Description: "Stop non-prod RDS instances at night"
    ScheduleExpression: "cron(0 0 ? * MON-FRI *)"  # midnight UTC = 8PM ET
    State: ENABLED
    Targets:
      - Arn: !GetAtt HrrRdsSchedulerFunction.Arn
        Id: StopRdsTarget
        Input: '{"action": "stop", "instances": ["hrr-dev-db", "hrr-staging-db"]}'

# EventBridge rule: start dev/staging RDS at 8 AM ET weekdays
HrrRdsStartSchedule:
  Type: AWS::Events::Rule
  Properties:
    Name: hrr-rds-start-nonprod
    Description: "Start non-prod RDS instances in morning"
    ScheduleExpression: "cron(0 13 ? * MON-FRI *)"  # 1PM UTC = 8AM ET
    State: ENABLED
    Targets:
      - Arn: !GetAtt HrrRdsSchedulerFunction.Arn
        Id: StartRdsTarget
        Input: '{"action": "start", "instances": ["hrr-dev-db", "hrr-staging-db"]}'
</code></pre>
<p>And the Lambda function itself is dead simple:</p>
<pre><code class="language-javascript">import { RDSClient, StopDBInstanceCommand, StartDBInstanceCommand } from "@aws-sdk/client-rds";

const rds = new RDSClient();

export const handler = async (event) =&gt; {
  const { action, instances } = event;

  for (const instanceId of instances) {
    const command = action === "stop"
      ? new StopDBInstanceCommand({ DBInstanceIdentifier: instanceId })
      : new StartDBInstanceCommand({ DBInstanceIdentifier: instanceId });

    try {
      await rds.send(command);
      console.log(`\({action}ped instance: \){instanceId}`);
    } catch (err) {
      // Instance might already be in the target state
      console.log(`Could not \({action} \){instanceId}: ${err.message}`);
    }
  }
};
</code></pre>
<p>With this schedule, their non-production instances run about 60 hours per week instead of 168. That's a 64% reduction. The savings: roughly <strong>$350/month</strong> across all three instances.</p>
<p>I also suggested they downsize the non-prod instances to db.t3.medium. You don't need production-class hardware to test features. But the scheduling alone was the big win here.</p>
<p>Another option is Aurora Serverless v2 for non-production environments. It scales down to 0.5 ACU when idle, which costs about $0.06/hour. Still more than zero, but it handles the "developer starts working at random hours" case better than a hard schedule. For this client, the schedule worked fine because their team is pretty consistent about working hours.</p>
<p><img src="https://images.pexels.com/photos/17323801/pexels-photo-17323801.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="Database server infrastructure" />
<sub>Photo by <a href="https://www.pexels.com/@cookiecutter">panumas nikhomkhai</a> on <a href="https://www.pexels.com/photo/network-rack-17323801/">Pexels</a></sub></p>
<h2>Mistake #3: CloudWatch Logs Set to "Never Expire"</h2>
<p>This one is sneaky because it costs almost nothing per day. But it compounds over months and you never notice until you actually look.</p>
<p>Every Lambda function creates a CloudWatch Log Group. Every invocation writes log entries. API Gateway access logs, ECS tasks, any service that outputs logs, they all end up in CloudWatch. And the default retention policy? <strong>Never expire.</strong> Your logs just pile up forever.</p>
<p>CloudWatch charges <strong>$0.03 per GB stored per month</strong>. Doesn't sound like much, right? Let me tell you what their account looked like.</p>
<p>When I checked the client's CloudWatch storage, they had <strong>over 800GB of logs</strong> sitting there. Logs from Lambda functions they had already deleted. Logs from old environments that were rebuilt months ago. Logs from API Gateway that nobody would ever look at again. Some of these log groups had entries going back over two years. They had never once set a retention policy on anything.</p>
<p>800GB at \(0.03/GB is <strong>\)24/month</strong> in storage alone. But here's the real problem. Those logs were still growing. Their production Lambda functions generate about 40-50GB of new logs per month. Without a retention policy, this number just keeps climbing forever. And the ingestion costs are separate, $0.50 per GB ingested. The storage charges are just the slow leak on top.</p>
<p>The bigger issue is that "Never expire" is the default for every new log group. Every time you create a new Lambda function, a new log group appears with no retention policy. You have to actively set one.</p>
<p><strong>The fix: Set retention policies on every log group.</strong></p>
<p>30 days is plenty for most things. 90 days if you need it for compliance or debugging long-running issues. Here's how to do it in CloudFormation:</p>
<pre><code class="language-yaml"># Always create the log group explicitly with a retention policy
HrrApiLogGroup:
  Type: AWS::Logs::LogGroup
  Properties:
    LogGroupName: !Sub "/aws/lambda/${HrrApiFunction}"
    RetentionInDays: 30

HrrSchedulerLogGroup:
  Type: AWS::Logs::LogGroup
  Properties:
    LogGroupName: !Sub "/aws/lambda/${HrrSchedulerFunction}"
    RetentionInDays: 30

HrrApiGatewayAccessLogs:
  Type: AWS::Logs::LogGroup
  Properties:
    LogGroupName: !Sub "/aws/apigateway/${HrrApiGateway}-access"
    RetentionInDays: 14  # access logs are high volume, low value
</code></pre>
<p>The key is creating the log group yourself in CloudFormation with <code>RetentionInDays</code> set, before the Lambda function runs for the first time. If you let Lambda auto-create the log group, it always defaults to "Never expire."</p>
<p>For existing log groups you've already accumulated, you can update them with a quick CLI command:</p>
<pre><code class="language-bash"># Set 30-day retention on an existing log group
aws logs put-retention-policy \
  --log-group-name "/aws/lambda/hrr-api-prod" \
  --retention-in-days 30

# Find all log groups with no retention policy
aws logs describe-log-groups \
  --query "logGroups[?!retentionInDays].logGroupName" \
  --output table
</code></pre>
<p>That second command is gold. Run it right now on your account. I bet you'll find log groups you forgot existed. The client had 47 log groups with no retention policy. Some from projects they abandoned over a year ago.</p>
<p>After setting 30-day retention across the board and deleting the ancient log groups, we cut their CloudWatch bill by about <strong>$180/month</strong>. And more importantly, it stops growing. Set the retention policy once and forget about it.</p>
<p><img src="https://images.pexels.com/photos/5412875/pexels-photo-5412875.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="Data logs and file storage" />
<sub>Photo by <a href="https://www.pexels.com/@luis-f-rodriguez-jimenez-3618842">Luis F  Rodríguez Jiménez</a> on <a href="https://www.pexels.com/photo/a-man-in-black-vest-wearing-a-face-mask-5412875/">Pexels</a></sub></p>
<h2>Mistake #4: Data Transfer Between Availability Zones</h2>
<p>This one is the most subtle on the list. Cross-AZ data transfer costs <strong>\(0.01 per GB in each direction</strong>. That's \)0.02 per GB round trip. Sounds like nothing.</p>
<p>Let me do some quick math. Say your Lambda function in AZ-a hits your RDS instance in AZ-b on every request. A typical API response is maybe 5-10KB after query results, serialization, and overhead. At 1 million requests per month with an average 10KB response, you're transferring about 10GB across AZs. That's $0.20/month. Barely worth thinking about.</p>
<p>But now scale that up. The client was running a data processing pipeline where each request pulled back large document sets from their database, sometimes 200-500KB of payload per call. They also had services in three AZs talking to each other constantly. Internal API calls, cache lookups hitting a Redis instance in a different AZ, background workers pulling from SQS and writing to RDS across zones.</p>
<p>When I added it all up in Cost Explorer, the cross-AZ data transfer was costing them about <strong>\(90/month</strong>. Not the biggest line item on this list. But \)90/month for data that could have stayed in the same AZ? That's just waste.</p>
<p>The problem is that most people never look at this. It doesn't show up as its own service in the billing dashboard. It's buried under EC2 "Data Transfer" charges, mixed in with internet egress and other network costs. You have to filter by usage type to see it.</p>
<p><strong>The fix: Subnet ordering and AZ awareness.</strong></p>
<p>When you configure Lambda subnets in CloudFormation, the order matters. Lambda preferentially uses the first subnet in the list. I reordered the client's configuration to put the subnet in the same AZ as their RDS primary instance first:</p>
<pre><code class="language-yaml">HrrApiFunction:
  Type: AWS::Lambda::Function
  Properties:
    FunctionName: hrr-api-prod
    VpcConfig:
      # Put the subnet in the same AZ as RDS primary FIRST
      SubnetIds:
        - !Ref AppSubnet1   # us-east-1a (same AZ as RDS primary)
        - !Ref AppSubnet2   # us-east-1b (fallback)
      SecurityGroupIds:
        - !Ref LambdaSecurityGroup
</code></pre>
<p>This doesn't guarantee every invocation stays in the same AZ. Lambda can still place containers in other AZs if it needs to. But it biases toward the first subnet, which means more of your traffic stays local to the database.</p>
<p>For workloads with large payloads, like the client's data processing pipeline, this optimization matters more. If you're doing simple CRUD with small JSON responses, the savings are minimal. But it's a free optimization. Just reorder your subnets and you're done.</p>
<p>We also moved their Redis cache into the same AZ as the primary database and the majority of their Lambda compute. Between subnet reordering and AZ consolidation, we cut cross-AZ transfer by about <strong>$70/month</strong>.</p>
<p>One more thing. If you're using RDS multi-AZ, remember that failover changes which AZ your primary is in. After a failover event, your Lambda functions might all be going cross-AZ until you update the subnet ordering. Something to keep in mind for your runbooks.</p>
<p><img src="https://images.pexels.com/photos/4716292/pexels-photo-4716292.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="Data center network connections and infrastructure" />
<sub>Photo by <a href="https://www.pexels.com/@brett-sayles">Brett Sayles</a> on <a href="https://www.pexels.com/photo/blue-wires-connected-to-server-4716292/">Pexels</a></sub></p>
<h2>Mistake #5: Over-Provisioned Lambda Memory</h2>
<p>Lambda pricing is simple on the surface. You pay for <strong>GB-seconds</strong>. That's the amount of memory allocated multiplied by the execution time. A function running at 512MB for 100ms costs the same as a function running at 256MB for 200ms. In theory.</p>
<p>But most developers just set 512MB or 1024MB on every function and never look at it again. The client's team had been doing this for over a year. Every function got 1024MB because it felt like a safe default. Some functions had 2048MB "just in case."</p>
<p>Here's what they didn't realize. Lambda memory also controls <strong>CPU allocation</strong>. More memory means more CPU. At 1,769MB you get one full vCPU. Below that, you get a proportional fraction. So a function at 128MB gets roughly 7% of a vCPU, and a function at 512MB gets about 29%.</p>
<p>This creates an interesting tradeoff. Sometimes bumping memory from 512MB to 1024MB actually makes your function run twice as fast because it gets more CPU. Double the memory, half the duration, same cost. But sometimes your function is doing something simple like validating a JWT and returning a 200. It finishes in 8ms at 128MB. Giving it 512MB doesn't make it faster because it's not CPU-bound. You're just paying 4x more for no benefit.</p>
<p>I audited all their Lambda functions and found <strong>eight functions that were over-provisioned by 4x or more</strong>. They were simple CRUD handlers doing a single database query and returning JSON. They finished in under 15ms regardless of whether they had 256MB or 1024MB of memory. The client was paying for 1024MB on each of them. A couple of the lightweight auth functions had 2048MB allocated for a function that used 80MB at peak.</p>
<p><strong>The fix: AWS Lambda Power Tuning.</strong></p>
<p>This is an open-source tool built by Alex Casalboni from AWS. It runs your function at different memory configurations and shows you the cost and performance at each level. It's the single best tool for Lambda cost optimization.</p>
<p>You deploy it as a Step Functions state machine and run it against each function:</p>
<pre><code class="language-bash"># Deploy Lambda Power Tuning (one-time setup)
aws serverlessrepo create-cloud-formation-change-set \
  --application-id arn:aws:serverlessrepo:us-east-1:451282441545:applications/aws-lambda-power-tuning \
  --stack-name hrr-lambda-power-tuning \
  --capabilities CAPABILITY_IAM

# Run it against a function
aws stepfunctions start-execution \
  --state-machine-arn arn:aws:states:us-east-1:123456789:stateMachine:powerTuningStateMachine \
  --input '{
    "lambdaARN": "arn:aws:lambda:us-east-1:123456789:function:hrr-api-prod",
    "powerValues": [128, 256, 512, 1024, 1536],
    "num": 50,
    "payload": "{}",
    "parallelInvocation": true,
    "strategy": "cost"
  }'
</code></pre>
<p>The tool runs your function 50 times at each memory level and produces a visualization showing cost vs. performance. For the client's CRUD functions, the sweet spot was 256MB. Same performance as 1024MB, one quarter the cost.</p>
<p>For their heavier functions (the ones doing data processing and report generation), 1024MB was actually cheaper than 2048MB because the extra memory provided zero benefit. The function wasn't memory-bound at all. The Power Tuning tool showed us exactly where the diminishing returns kicked in for each function.</p>
<p>After right-sizing all their functions, we saved about <strong>$320/month</strong> in Lambda costs. That was a big one. When you have dozens of functions all over-provisioned by 2-4x, the GB-seconds add up fast. The real value is knowing that every function is running at its optimal configuration instead of some arbitrary default.</p>
<p><img src="https://images.pexels.com/photos/5900178/pexels-photo-5900178.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="Cost optimization and efficiency improvements" />
<sub>Photo by <a href="https://www.pexels.com/@karola-g">www.kaboompics.com</a> on <a href="https://www.pexels.com/photo/person-paying-bills-5900178/">Pexels</a></sub></p>
<h2>The Total Damage (and the Fix)</h2>
<p>Let me add it all up. These five mistakes were costing the client roughly <strong>$1,400/month</strong> more than necessary:</p>
<table>
<thead>
<tr>
<th>Mistake</th>
<th>Monthly Waste</th>
<th>Savings After Fix</th>
</tr>
</thead>
<tbody><tr>
<td>NAT Gateway data processing</td>
<td>~$580</td>
<td>~$480</td>
</tr>
<tr>
<td>Idle dev/staging/QA RDS</td>
<td>~$570</td>
<td>~$350</td>
</tr>
<tr>
<td>CloudWatch log retention</td>
<td>~$200</td>
<td>~$180</td>
</tr>
<tr>
<td>Cross-AZ data transfer</td>
<td>~$90</td>
<td>~$70</td>
</tr>
<tr>
<td>Over-provisioned Lambda memory</td>
<td>~$320</td>
<td>~$320</td>
</tr>
<tr>
<td><strong>Total</strong></td>
<td><strong>~$1,760 in waste</strong></td>
<td><strong>~$1,400 saved/month</strong></td>
</tr>
</tbody></table>
<p>The client went from \(3,200/month down to under \)1,800 after fixing all five. Same infrastructure, same traffic. Just smarter configuration.</p>
<p>The scariest part is that none of these showed up as obvious problems. Cost Explorer doesn't flag "your NAT Gateway is processing too much data" or "you have log groups with no retention policy." You have to know what to look for. The client had been paying these inflated bills for months, assuming that's just what AWS costs. It wasn't. It was self-inflicted.</p>
<p>Go check your own bill right now. Block off two hours this week. Open Cost Explorer. Filter by usage type, not just service. Look at the data transfer charges, the storage charges, the per-request charges. The headline number for each service hides a lot of detail underneath.</p>
<p>And if you're just getting started on AWS, bake these fixes into your infrastructure from day one. Set log retention policies in your CloudFormation templates. Add VPC endpoints before you deploy your first Lambda function. Run Power Tuning once a quarter. Future you will be grateful.</p>
<p>Hope you enjoyed this breakdown. If you found a surprise on your AWS bill that I didn't cover, I'd love to hear about it in the comments.</p>
<hr />
<p><em>Follow me on <a href="https://x.com/HarunRRayhan">Twitter/X</a> for more AWS, DevOps, and serverless content. I share the stuff I find while auditing real infrastructure so you can avoid the same mistakes.</em></p>
<p><img src="https://images.pexels.com/photos/11933549/pexels-photo-11933549.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="Financial savings and budget planning" />
<sub>Photo by <a href="https://www.pexels.com/@ann-h-45017">Ann H</a> on <a href="https://www.pexels.com/photo/photo-of-a-pink-piggy-bank-11933549/">Pexels</a></sub></p>
