---
title: "How I Use Step Functions to Orchestrate LLM Workflows Without Chaining Lambdas"
slug: "step-functions-llm-orchestration-replacing-lambda-chains"
brief: "Lambda chaining for multi-step AI workflows gets messy fast. Failed steps, retries, timeouts, and idle billing. Here is how I replaced manual Lambda chaining with AWS Step Functions for LLM orchestration."
publishedAt: "2026-06-27T09:00:00.000Z"
readTimeInMinutes: 11
draft: true
draftToken: "2b7e1ad8a5f37af3325bb2671f3c78bd"
tags:
  - name: AWS
    slug: aws
  - name: Step Functions
    slug: step-functions
  - name: Lambda
    slug: lambda
  - name: LLM
    slug: llm
  - name: Terraform
    slug: terraform
  - name: Bedrock
    slug: bedrock
---

<p>I built my first LLM-powered document pipeline the way most people do. A Lambda function extracts text from a PDF. It calls another Lambda to classify the content. That one calls a third Lambda to generate a summary. Then a fourth to store the results in DynamoDB. Each function invokes the next one directly via the Lambda SDK.</p>

<p>It worked. Until it did not.</p>

<p>A PDF timed out during extraction. The classification Lambda was already invoked and failed because it received partial data. The summary Lambda never ran. The document was silently lost. No alert, no retry, no way to know what happened without digging through CloudWatch Logs across four separate functions.</p>

<p>Lambda chaining for AI workflows is fragile. Each hop adds a failure point. Every function needs its own error handling, timeout logic, and retry policy. And you pay for idle Lambda time while a downstream function processes an LLM response that can take 30 seconds or more.</p>

<p>AWS Step Functions solves all of this. Here is how I replaced my Lambda chains with state machines and why I will not go back.</p>

<h2 id="heading-the-problem-with-lambda-chaining">The Problem with Lambda Chaining</h2>

<p>Before I show the Step Functions version, let me be specific about what was breaking.</p>

<h3>Fragile error paths</h3>
<p>When Lambda A calls Lambda B directly, and B fails, A needs to handle that failure. In practice, most people add a try-catch that logs the error and returns a failure response. That means A is responsible for B's reliability. If you have five functions in a chain, the first function carries the error handling for every downstream step. That is not scalable.</p>

<h3>Idle billing</h3>
<p>An LLM call from Lambda can take 15 to 45 seconds. While Bedrock or OpenAI processes your prompt, your Lambda function sits there waiting. You are billed for every millisecond of that wait time. In a chain of four functions where each one makes an LLM call, you are paying for idle compute on every function in the chain simultaneously.</p>

<h3>No built-in retries</h3>
<p>LLM calls fail. The Bedrock API returns a throttling error. The network drops a packet. A transient database connection timeout happens on write. Lambda does not retry failed invocations by default when you are chaining via the SDK. You have to implement retry logic in every function. Most people do not do this correctly on the first try.</p>

<h2 id="heading-how-step-functions-fixes-it">How Step Functions Fixes It</h2>

<p>Step Functions is a state machine service. You define each step in JSON or YAML, and the service orchestrates the execution. It handles retries, error handling, parallel execution, and wait states natively. You pay per state transition, not per millisecond of execution time.</p>

<p>For LLM workflows, the key features are:</p>

<ul>
  <li><strong>Retry policies</strong> at the step level, with exponential backoff</li>
  <li><strong>Wait states</strong> that cost nothing while you are waiting on an external service</li>
  <li><strong>Parallel branches</strong> for running multiple LLM calls at the same time</li>
  <li><strong>Task tokens</strong> for human-in-the-loop approval steps</li>
  <li><strong>CloudWatch integration</strong> for execution history and failure tracking</li>
</ul>

<h2 id="heading-real-example-document-analysis-pipeline">Real Example: Document Analysis Pipeline</h2>

<p>Here is the pipeline I use for processing uploaded documents. It does four things:</p>

<ol>
  <li>Extract text from the document (PDF, image, or text file)</li>
  <li>Classify the content by type and sensitivity</li>
  <li>Generate a summary using Bedrock</li>
  <li>Store the results in DynamoDB</li>
</ol>

<p>Here is the Step Functions definition in Amazon States Language (ASL):</p>

<pre><code>{
  "Comment": "Document Analysis Pipeline",
  "StartAt": "ExtractText",
  "States": {
    "ExtractText": {
      "Type": "Task",
      "Resource": "${extract_lambda_arn}",
      "TimeoutSeconds": 120,
      "Retry": [
        {
          "ErrorEquals": ["Lambda.ServiceException", "Lambda.AWSLambdaException", "Lambda.SdkClientException"],
          "IntervalSeconds": 2,
          "MaxAttempts": 3,
          "BackoffRate": 2
        }
      ],
      "Catch": [
        {
          "ErrorEquals": ["States.ALL"],
          "Next": "HandleFailure",
          "ResultPath": "$.error"
        }
      ],
      "Next": "ClassifyContent"
    },
    "ClassifyContent": {
      "Type": "Task",
      "Resource": "${classify_lambda_arn}",
      "TimeoutSeconds": 60,
      "Retry": [
        {
          "ErrorEquals": ["States.ALL"],
          "IntervalSeconds": 3,
          "MaxAttempts": 2,
          "BackoffRate": 1.5
        }
      ],
      "Next": "SummarizeDocument"
    },
    "SummarizeDocument": {
      "Type": "Task",
      "Resource": "${summarize_lambda_arn}",
      "TimeoutSeconds": 120,
      "Retry": [
        {
          "ErrorEquals": ["States.ALL"],
          "IntervalSeconds": 5,
          "MaxAttempts": 3,
          "BackoffRate": 2
        }
      ],
      "Next": "StoreResults"
    },
    "StoreResults": {
      "Type": "Task",
      "Resource": "${store_lambda_arn}",
      "TimeoutSeconds": 30,
      "Retry": [
        {
          "ErrorEquals": ["Lambda.ServiceException", "DynamoDB.DynamoDBException"],
          "IntervalSeconds": 2,
          "MaxAttempts": 3,
          "BackoffRate": 2
        }
      ],
      "End": true
    },
    "HandleFailure": {
      "Type": "Task",
      "Resource": "${notify_lambda_arn}",
      "InputPath": "$.error",
      "End": true
    }
  }
}
</code></pre>

<p>Notice the retry policies on every step. Each one is tuned to the step it protects. The extract step gets a 120-second timeout because documents can be large. The summarize step gets the same because Bedrock can take a while with long prompts. The store step is short but retries DynamoDB exceptions.</p>

<p>The failure handler is separate. If any step fails after all retries are exhausted, the error is caught and routed to a notification function that sends me an alert. I do not lose documents silently anymore.</p>

<h2 id="heading-cost-comparison-lambda-vs-step-functions">Cost Comparison: Lambda vs Step Functions</h2>

<p>This is where Step Functions surprised me. I expected it to be cheaper, but the difference was bigger than I thought.</p>

<p>With Lambda chaining, a four-step pipeline where each step waits 20 seconds for an LLM response costs:</p>

<ul>
  <li>4 Lambda invocations x 20 seconds each = 80 seconds of compute</li>
  <li>At 128MB Lambda, that is about $0.0000013 per invocation</li>
  <li>For 10,000 documents per month: about $0.52 in Lambda costs</li>
</ul>

<p>That does not sound bad. But at 512MB (common for Python LLM handlers with SDK dependencies), the cost jumps to about $2.08 per 10,000 documents. At 1GB, it is $4.16. And that is just for the idle wait time. The actual compute cost on top of that can double it.</p>

<p>With Step Functions:</p>

<ul>
  <li>4 state transitions at $0.000025 per transition = $0.0001 per execution</li>
  <li>For 10,000 documents: about $1.00 in Step Functions costs</li>
  <li>Lambda only runs for actual compute time, not wait time</li>
</ul>

<p>The Lambda costs drop by roughly half because functions are not sitting idle waiting for LLM responses. The extract Lambda runs for 2 seconds of actual CPU. It finishes. It returns. Step Functions holds the state. When the classify Lambda starts, it runs its own CPU time and finishes. No overlap, no idle billing.</p>

<p>For my workload of about 50,000 documents per month, I save about $15 per month. Not life-changing, but the reliability improvement alone is worth the switch. The cost savings are a bonus.</p>

<h2 id="heading-parallel-llm-calls-with-step-functions">Parallel LLM Calls with Step Functions</h2>

<p>Where Step Functions really shines is parallel execution. If you need to call three different LLM models on the same input and aggregate the results, Step Functions can run all three in parallel.</p>

<pre><code>{
  "StartAt": "AnalyzeWithModels",
  "States": {
    "AnalyzeWithModels": {
      "Type": "Parallel",
      "Branches": [
        {
          "StartAt": "ClaudeAnalysis",
          "States": {
            "ClaudeAnalysis": {
              "Type": "Task",
              "Resource": "${claude_analysis_arn}",
              "End": true
            }
          }
        },
        {
          "StartAt": "OpenAIAnalysis",
          "States": {
            "OpenAIAnalysis": {
              "Type": "Task",
              "Resource": "${openai_analysis_arn}",
              "End": true
            }
          }
        },
        {
          "StartAt": "BedrockAnalysis",
          "States": {
            "BedrockAnalysis": {
              "Type": "Task",
              "Resource": "${bedrock_analysis_arn}",
              "End": true
            }
          }
        }
      ],
      "Next": "AggregateResults"
    },
    "AggregateResults": {
      "Type": "Task",
      "Resource": "${aggregate_lambda_arn}",
      "End": true
    }
  }
}
</code></pre>

<p>With Lambda chaining, you would either call these sequentially (triple the wall time) or build a fan-out pattern with SNS or SQS plus a state tracking mechanism in DynamoDB. That is a lot of code for something Step Functions gives you for free.</p>

<p>The parallel branch runs all three model calls simultaneously. The aggregate function receives the combined results as an array. The total wall time is the slowest model, not the sum of all three.</p>

<h2 id="heading-terraform-deployment">Terraform Deployment</h2>

<p>Here is how I deploy the state machine with Terraform:</p>

<pre><code>resource "aws_sfn_state_machine" "document_analysis" {
  name     = "document-analysis-pipeline"
  role_arn = aws_iam_role.step_functions.arn

  definition = templatefile("${path.module}/state-machines/document-analysis.asl.json", {
    extract_lambda_arn    = aws_lambda_function.extract_text.arn
    classify_lambda_arn   = aws_lambda_function.classify_content.arn
    summarize_lambda_arn  = aws_lambda_function.summarize_document.arn
    store_lambda_arn      = aws_lambda_function.store_results.arn
    notify_lambda_arn     = aws_lambda_function.notify_failure.arn
  })

  logging_configuration {
    log_destination        = "${aws_cloudwatch_log_group.step_functions.arn}:*"
    include_execution_data = false
    level                  = "ALL"
  }

  tracing_configuration {
    enabled = true
  }

  tags = {
    Name    = "document-analysis-pipeline"
    Service = "step-functions"
  }
}
</code></pre>

<p>The IAM role needs permission to invoke Lambda and write to CloudWatch Logs:</p>

<pre><code>data "aws_iam_policy_document" "step_functions_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["states.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "step_functions" {
  name               = "step-functions-document-analysis"
  assume_role_policy = data.aws_iam_policy_document.step_functions_assume.json
}

resource "aws_iam_role_policy" "step_functions_invoke" {
  name = "step-functions-invoke-lambda"
  role = aws_iam_role.step_functions.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction",
          "logs:CreateLogDelivery",
          "logs:PutLogEvents",
          "logs:CreateLogStream"
        ]
        Resource = [
          aws_lambda_function.extract_text.arn,
          aws_lambda_function.classify_content.arn,
          aws_lambda_function.summarize_document.arn,
          aws_lambda_function.store_results.arn,
          aws_lambda_function.notify_failure.arn,
          "${aws_cloudwatch_log_group.step_functions.arn}:*"
        ]
      }
    ]
  })
}
</code></pre>

<h2 id="heading-triggering-from-sqs-or-eventbridge">Triggering from SQS or EventBridge</h2>

<p>Step Functions can be triggered directly from SQS or EventBridge. That means you do not need a Lambda just to start the state machine. You send a message to SQS, and SQS starts the execution.</p>

<pre><code>resource "aws_sqs_queue" "document_queue" {
  name = "document-analysis-input"
}

resource "aws_sfn_state_machine" "document_analysis" {
  name     = "document-analysis-pipeline"
  role_arn = aws_iam_role.step_functions.arn
  definition = templatefile(...)
}

resource "aws_lambda_event_source_mapping" "sqs_to_step_functions" {
  event_source_arn = aws_sqs_queue.document_queue.arn
  function_name    = aws_sfn_state_machine.document_analysis.arn
}
</code></pre>

<p>For EventBridge, you define a rule that starts the state machine on a schedule or specific event pattern. I use this for recurring document processing jobs that run every hour.</p>

<h2 id="heading-monitoring-and-alerts">Monitoring and Alerts</h2>

<p>Step Functions publishes execution events to CloudWatch automatically. I set up a metric filter for failed executions and route it to SNS:</p>

<pre><code>resource "aws_cloudwatch_metric_alarm" "step_function_failures" {
  alarm_name          = "document-analysis-failures"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ExecutionsFailed"
  namespace           = "AWS/States"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "Alert when document analysis state machine fails"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    StateMachineArn = aws_sfn_state_machine.document_analysis.arn
  }
}
</code></pre>

<p>The execution history in the Step Functions console shows exactly where each failure happened, what the input was at that point, and the error message. I do not need to dig through four different Lambda log groups anymore. One console page shows the entire execution trace.</p>

<h2 id="heading-when-not-to-use-step-functions">When Not to Use Step Functions</h2>

<p>I do not use Step Functions for everything. There are cases where Lambda chaining still makes sense:</p>

<ul>
  <li><strong>Simple two-step pipelines</strong> where the second step is optional and the failure path is trivial</li>
  <li><strong>Real-time request-response</strong> where latency under 100ms matters and the extra Step Functions overhead adds noticeable delay</li>
  <li><strong>Very low volume</strong> (under 100 executions per month) where the setup complexity is not worth it</li>
</ul>

<p>But for any multi-step AI workflow with LLM calls, error-prone external APIs, or long-running operations, Step Functions has saved me time, money, and debugging headaches. The Lambda chains I used to write are gone from my codebase. The state machines are easier to read, easier to deploy, and much easier to debug at 2 AM when something breaks.</p>

<p>If you are still chaining Lambdas for your LLM pipelines, try converting the next one to a state machine. Start with a simple two-step pipeline. Add retry policies. Add a failure handler. Once you see the execution history in the console, you will not go back.</p>
