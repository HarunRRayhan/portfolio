---
title: "Building Bedrock Agents in Production - Knowledge Bases, Action Groups, and Guardrails"
slug: "bedrock-agents-production-knowledge-bases"
brief: "How to build a production-ready Bedrock Agent with S3 knowledge bases, Lambda action groups, and guardrails, all configured with Terraform."
publishedAt: "2026-06-18T09:00:00.000Z"
readTimeInMinutes: 11
coverImageUrl: "/blog-assets/bedrock-agents-production-knowledge-bases/cover.jpg"
reactionCount: 0
responseCount: 0
replyCount: 0
tags:
  - name: AWS
    slug: aws
  - name: Bedrock
    slug: bedrock
  - name: AI
    slug: ai
  - name: Lambda
    slug: lambda
  - name: Terraform
    slug: terraform
---
<p>I have been building AI-powered features on AWS for the last two years. Most of them follow the same pattern. A Lambda function takes a prompt, calls a Bedrock model, and returns a response. It works. But there is a ceiling on what you can do with a single model call and a static prompt.</p>
<p>A Bedrock Agent is different from a Lambda function that calls Bedrock. When you call <code>bedrock:InvokeModel</code> from a Lambda function, you get exactly one response. No tool use. No document retrieval. No multi-step reasoning. The agent wraps orchestration around the model. It can call knowledge bases for context, invoke Lambda functions as tools, follow guardrails, and chain multiple steps together based on what the model decides to do next.</p>
<p>I have built three production Bedrock Agents so far. One for internal customer support, one for automated incident response, and one for document summarization across a large S3 corpus. Each one taught me something about where the complexity really lives. It is not in the agent itself. It is in the surrounding pieces. Knowledge base ingestion, action group schemas, IAM policies, and guardrails.</p>
<p>This post covers everything I had to figure out to put a Bedrock Agent into production with Terraform. S3 knowledge bases with proper chunking, Lambda action groups with OpenAPI schemas the agent can actually parse, guardrails that block bad inputs and outputs, IAM policies that are least-privilege without being too restrictive, and the cost and latency tradeoffs you need to plan for.</p>
<h2>What a Bedrock Agent Actually Is</h2>
<p>The term "agent" gets thrown around loosely. In Bedrock, an agent is a managed runtime that exposes an orchestrated AI workflow. You define what the agent knows and what it can do, and the agent figures out how to combine those capabilities to answer a user's request.</p>
<p>Here is what happens when a user sends a message to a Bedrock Agent:</p>
<ol>
<li><strong>Input</strong> hits the agent via the Bedrock Agent Runtime API (or the console).</li>
<li><strong>Pre-processing</strong> runs the input through guardrails. Content filters, topic policies, PII redaction. Anything blocked stops here.</li>
<li><strong>Orchestration</strong> sends the (filtered) input to the foundation model with the agent's system prompt and available tools.</li>
<li><strong>Tool calls</strong> happen when the model decides it needs more context or wants to perform an action. The agent routes to knowledge bases for retrieval or Lambda functions for action execution.</li>
<li><strong>Post-processing</strong> runs the model output through guardrails again before returning to the user.</li>
</ol>
<p>Each step is configurable. You control which knowledge bases the agent can query, which Lambda functions it can invoke, what guardrails apply at each stage, and how many retries the agent attempts before giving up.</p>
<p>This is the architecture you are building toward:</p>
<pre><code>User --&gt; Bedrock Agent Runtime API
              |
        [Guardrails]
              |
        [Foundation Model]
           /          \
  [Knowledge Base]  [Action Groups]
     (S3 + RDS)      (Lambda)
</code></pre>
<p>The agent decides when to query the knowledge base, when to call a Lambda function, and how to combine results. You do not hardcode a workflow. You define the capabilities and let the model route between them.</p>
<h2>Setting Up an S3 Knowledge Base</h2>
<p>The knowledge base is where your agent looks for context. Bedrock Agents support two types of knowledge bases. S3-based (documents stored as files in S3) and RDS-based (vectors stored in a PostgreSQL or Aurora database). For most use cases I start with S3 because it is the simplest ingestion pipeline.</p>
<p>Here is what a knowledge base needs:</p>
<ul>
<li><strong>A source S3 bucket</strong> containing your documents.</li>
<li><strong>A vector index</strong> (Bedrock manages this for you in its OpenSearch Serverless collection, or you can use your own).</li>
<li><strong>A data source configuration</strong> that defines how documents get parsed and chunked.</li>
<li><strong>An ingestion job</strong> that reads documents from S3, chunks them, generates embeddings, and stores them in the vector index.</li>
</ul>
<p>The chunking strategy matters more than most tutorials admit. Bedrock supports two chunking strategies: fixed-size and hierarchical. Fixed-size is simpler. You split documents into chunks of N tokens with overlap. Hierarchical breaks documents into sections first, then chunks within sections. The second option preserves more contextual boundaries.</p>
<p>For knowledge base documents, use hierarchical chunking if your source files have structure (headings, sections, paragraphs). Use fixed-size if you have unstructured text. I have seen better retrieval quality with hierarchical for anything that resembles documentation.</p>
<pre><code class="language-hcl"># knowledge_base.tf

resource "aws_bedrockagent_knowledge_base" "hrr_docs" {
  name     = "hrr-docs-knowledge-base"
  role_arn = aws_iam_role.hrr_bedrock_agent.arn

  knowledge_base_configuration {
    type = "VECTOR"

    vector_knowledge_base_configuration {
      embedding_model_arn = "arn:aws:bedrock:us-east-1::foundation-model/amazon.titan-embed-text-v2:0"
    }
  }

  storage_configuration {
    type = "OPENSEARCH_SERVERLESS"

    opensearch_serverless_configuration {
      collection_arn    = aws_opensearchserverless_collection.hrr_kb.arn
      vector_index_name = "hrr-bedrock-kb-index"
      field_mapping {
        metadata_field = "AMAZON_BEDROCK_METADATA"
        text_field     = "AMAZON_BEDROCK_TEXT_CHUNK"
      }
    }
  }
}

resource "aws_bedrockagent_data_source" "hrr_docs_source" {
  name                 = "hrr-prod-docs"
  knowledge_base_id    = aws_bedrockagent_knowledge_base.hrr_docs.id
  data_source_type     = "S3"

  data_deletion_policy = "RETAIN"

  s3_configuration {
    bucket_arn = aws_s3_bucket.hrr_knowledge_docs.arn
    inclusion_prefixes = ["documents/"]
  }

  vector_ingestion_configuration {
    chunking_configuration {
      chunking_strategy = "HIERARCHICAL"
      hierarchical_chunking_configuration {
        level_configurations {
          max_tokens = 1500
        }
        level_configurations {
          max_tokens = 512
        }
        overlap_tokens = 100
      }
    }

    parsing_configuration {
      parsing_strategy = "BEDROCK_FOUNDATION_MODEL"
    }
  }
}
</code></pre>
<p>A few things I learned the hard way:</p>
<ul>
<li><strong>Set <code>data_deletion_policy = "RETAIN"</code></strong> unless you want to lose your vector index every time you destroy the Terraform resource. The default deletes vectors when you remove a data source, and rebuilding a large ingestion job takes time.</li>
<li><strong>Use <code>inclusion_prefixes</code></strong> to scope which S3 paths the knowledge base watches. Without this, Bedrock indexes every file in the bucket and you pay for storage on everything.</li>
<li><strong>Use the Bedrock foundation model parser</strong> (<code>BEDROCK_FOUNDATION_MODEL</code>) instead of the default parser for PDFs and complex documents. The default parser strips formatting, tables, and structure. The Bedrock model parser preserves enough context for the agent to make sense of the content.</li>
<li><strong>Start with 1500/512 tokens</strong> as your hierarchical chunk sizes. 1500 for the parent section level, 512 for the leaf chunks. 100 token overlap. This gives you enough context per chunk without ballooning your vector index storage. Adjust based on your actual document types.</li>
</ul>
<h3>Ingestion Scheduling</h3>
<p>Knowledge bases do not sync automatically. You need to trigger an ingestion job when your source docs change. The simplest approach is an S3 event notification that triggers a Lambda function, which calls <code>StartIngestionJob</code> on the knowledge base.</p>
<pre><code class="language-hcl">resource "aws_s3_bucket_notification" "hrr_kb_ingest" {
  bucket = aws_s3_bucket.hrr_knowledge_docs.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.hrr_trigger_ingest.arn
    events              = ["s3:ObjectCreated:*", "s3:ObjectRemoved:*"]
    filter_prefix       = "documents/"
  }
}

resource "aws_lambda_function" "hrr_trigger_ingest" {
  filename      = "lambda/trigger_ingest.zip"
  function_name = "hrr-trigger-kb-ingest"
  role          = aws_iam_role.hrr_lambda.arn
  handler       = "index.handler"
  runtime       = "nodejs22.x"

  environment {
    variables = {
      KNOWLEDGE_BASE_ID = aws_bedrockagent_knowledge_base.hrr_docs.id
      DATA_SOURCE_ID    = aws_bedrockagent_data_source.hrr_docs_source.id
    }
  }
}
</code></pre>
<p>The Lambda function itself is about ten lines of code.</p>
<pre><code class="language-javascript">// index.js
import { BedrockAgent } from "@aws-sdk/client-bedrock-agent";

const client = new BedrockAgent();
const KB_ID = process.env.KNOWLEDGE_BASE_ID;
const DS_ID = process.env.DATA_SOURCE_ID;

export const handler = async (event) =&gt; {
  await client.startIngestionJob({
    knowledgeBaseId: KB_ID,
    dataSourceId: DS_ID,
  });
  return { statusCode: 202 };
};
</code></pre>
<p>Ingestion jobs take time. A few hundred documents finish in a couple of minutes. Thousands of documents can take an hour or more. The agent cannot query newly ingested content until the job completes, so time your syncs accordingly. I run a nightly sync for the main corpus and a real-time trigger for any document that gets updated during the day.</p>
<h2>Defining Action Groups with Lambda Functions</h2>
<p>Action groups are how your agent performs actions. Each action group wraps one or more Lambda functions and tells the agent what those functions can do via an OpenAPI schema.</p>
<p>The agent does not call your Lambda directly. It inspects the OpenAPI schema, decides which operation matches the user's request, constructs the input parameters from the conversation context, and then invokes the function. The Lambda response gets fed back into the model as a tool result, and the model decides what to do next.</p>
<p>Here is the Terraform for an action group:</p>
<pre><code class="language-hcl"># action_group.tf

resource "aws_bedrockagent_agent_action_group" "hrr_support" {
  agent_id        = aws_bedrockagent_agent.hrr_support.id
  agent_version   = "DRAFT"
  action_group_name = "hrr-support-actions"
  description     = "Actions for customer support agent"

  action_group_executor {
    lambda = aws_lambda_function.hrr_support_actions.arn
  }

  api_schema {
    s3 {
      s3_bucket = aws_s3_bucket.hrr_action_schemas.id
      s3_key    = "schemas/support-actions.json"
    }
  }
}
</code></pre>
<p>The OpenAPI schema defines each operation the agent can call. Here is an example for a support agent that can look up orders and process refunds:</p>
<pre><code class="language-json">{
  "openapi": "3.0.0",
  "info": {
    "title": "Support Actions",
    "version": "1.0.0"
  },
  "paths": {
    "/lookup-order": {
      "post": {
        "summary": "Look up an order by ID",
        "operationId": "lookupOrder",
        "parameters": [
          {
            "name": "orderId",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The order identifier"
          }
        ],
        "responses": {
          "200": {
            "description": "Order details",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "orderId": { "type": "string" },
                    "status": { "type": "string" },
                    "items": { "type": "array", "items": { "type": "string" } },
                    "total": { "type": "number" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/process-refund": {
      "post": {
        "summary": "Process a refund for an order",
        "operationId": "processRefund",
        "parameters": [
          {
            "name": "orderId",
            "in": "query",
            "required": true,
            "schema": { "type": "string" }
          },
          {
            "name": "reason",
            "in": "query",
            "required": true,
            "schema": { "type": "string" }
          }
        ],
        "responses": {
          "200": {
            "description": "Refund result",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "refundId": { "type": "string" },
                    "status": { "type": "string" }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
</code></pre>
<p>Three things I have learned about writing action group schemas for Bedrock:</p>
<ul>
<li><strong>Keep operation names simple and descriptive.</strong> The agent uses the <code>operationId</code> to decide which function to call. <code>lookupOrder</code> and <code>processRefund</code> are clear. Avoid abbreviations or technical jargon the model might misinterpret.</li>
<li><strong>Provide good descriptions for each parameter.</strong> The model uses these descriptions to extract the right values from the conversation. If a parameter description says "The customer's email address" and the user says "my email is foo@bar.com," the model knows what to extract. Vague descriptions lead to wrong parameter extraction.</li>
<li><strong>Return structured JSON from your Lambda.</strong> The response is passed back to the model as-is (after guardrail filtering). Return objects with clear field names and types. Flat strings make it harder for the model to extract specific values in subsequent reasoning steps.</li>
</ul>
<p>Here is what the Lambda function looks like on the other end:</p>
<pre><code class="language-javascript">// support-actions/index.js
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler = async (event) =&gt; {
  // The agent sends the invoked operationId and parameters
  const { operationId, parameters } = JSON.parse(event.body);

  if (operationId === "lookupOrder") {
    const order = await db.send(new GetCommand({
      TableName: process.env.ORDERS_TABLE,
      Key: { orderId: parameters.orderId },
    }));
    return {
      statusCode: 200,
      body: JSON.stringify(order.Item || { error: "Order not found" }),
    };
  }

  if (operationId === "processRefund") {
    await db.send(new UpdateCommand({
      TableName: process.env.ORDERS_TABLE,
      Key: { orderId: parameters.orderId },
      UpdateExpression: "SET refundStatus = :status, refundReason = :reason",
      ExpressionAttributeValues: {
        ":status": "PENDING",
        ":reason": parameters.reason,
      },
    }));
    return {
      statusCode: 200,
      body: JSON.stringify({ refundId: `REF-${parameters.orderId}`, status: "PENDING" }),
    };
  }

  return {
    statusCode: 400,
    body: JSON.stringify({ error: `Unknown operation: ${operationId}` }),
  };
};
</code></pre>
<h2>Guardrails That Actually Block Things</h2>
<p>Bedrock Guardrails are your safety layer. They sit between the user and the model, and between the model and the user. Every input and output passes through before the agent sees it or returns it.</p>
<p>I configure guardrails with three policies for every production agent:</p>
<h3>Content Filters</h3>
<p>These block specific categories of harmful content. Configure severity thresholds for each category: hate, insults, sexual, violence, misconduct, and prompt attacks.</p>
<h3>Topic Policies</h3>
<p>Define what the agent is allowed to discuss. Topic policies block entire categories of conversation at a higher level than content filters. For a customer support agent, you might allow "Returns" and "Shipping" but block "Account deletion" and "Billing disputes" (routing those to human agents instead).</p>
<h3>PII Redaction</h3>
<p>Strip personally identifiable information from inputs and outputs before they reach the model or the user. Bedrock supports regex-based patterns for common PII types. Credit card numbers, email addresses, phone numbers, SSNs. You can choose to mask or block.</p>
<pre><code class="language-hcl"># guardrails.tf

resource "aws_bedrockagent_guardrail" "hrr_support" {
  name        = "hrr-support-guardrails"
  description = "Guardrails for the customer support agent"
  blocked_input_messaging  = "I cannot process that request."
  blocked_outputs_messaging = "I cannot provide that information."

  content_policy_config {
    filters_config {
      type      = "HATE"
      input_strength  = "HIGH"
      output_strength = "HIGH"
    }
    filters_config {
      type      = "INSULTS"
      input_strength  = "MEDIUM"
      output_strength = "MEDIUM"
    }
    filters_config {
      type      = "SEXUAL"
      input_strength  = "HIGH"
      output_strength = "HIGH"
    }
    filters_config {
      type      = "VIOLENCE"
      input_strength  = "HIGH"
      output_strength = "HIGH"
    }
    filters_config {
      type      = "MISCONDUCT"
      input_strength  = "HIGH"
      output_strength = "HIGH"
    }
    filters_config {
      type      = "PROMPT_ATTACK"
      input_strength  = "HIGH"
      output_strength = "NONE"
    }
  }

  topic_policy_config {
    topics_config {
      name       = "Account Deletion"
      definition = "Requests to delete or permanently disable user accounts"
      examples = [
        "I want to delete my account",
        "Close my account permanently",
        "Remove my user profile"
      ]
      type = "DENY"
    }
    topics_config {
      name       = "Billing Disputes"
      definition = "Charges, refunds, or billing issues"
      examples = [
        "I was charged twice",
        "This bill is wrong",
        "I need a refund for an unauthorized charge"
      ]
      type = "DENY"
    }
  }

  sensitive_information_policy_config {
    pii_entities_config {
      type    = "EMAIL"
      action  = "BLOCK"
    }
    pii_entities_config {
      type    = "PHONE"
      action  = "BLOCK"
    }
    pii_entities_config {
      type    = "CREDIT_DEBIT_CARD_NUMBER"
      action  = "BLOCK"
    }
    pii_entities_config {
      type    = "US_SOCIAL_SECURITY_NUMBER"
      action  = "BLOCK"
    }
  }
}
</code></pre>
<p>I set <code>PROMPT_ATTACK</code> input strength to HIGH and output strength to NONE. Prompt injection is an input problem. The guardrail should catch attempts to override the agent's system prompt on the way in, but there is no reason to filter model outputs for prompt attacks.</p>
<p>For PII, I use BLOCK instead of MASK or ANONYMIZE. Masking replaces the PII with a placeholder, which means the agent still processes content that references credit card numbers. Blocking stops the request entirely. For a support agent, there is no legitimate reason to send raw credit card numbers through the model.</p>
<h2>IAM Permissions for the Agent Execution Role</h2>
<p>The agent execution role is the most commonly misconfigured piece of a Bedrock Agent deployment. The role needs a specific trust policy that allows Bedrock to assume it, plus permissions for whatever the agent needs to access.</p>
<pre><code class="language-hcl"># iam.tf

resource "aws_iam_role" "hrr_bedrock_agent" {
  name = "hrr-bedrock-agent-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "bedrock.amazonaws.com"
        }
        Action = "sts:AssumeRole"
        Condition = {
          StringEquals = {
            "aws:SourceAccount" = data.aws_caller_account.current.account_id
          }
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "hrr_bedrock_agent_kb" {
  role = aws_iam_role.hrr_bedrock_agent.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "bedrock:Retrieve",
          "bedrock:RetrieveAndGenerate"
        ]
        Resource = aws_bedrockagent_knowledge_base.hrr_docs.arn
      },
      {
        Effect = "Allow"
        Action = [
          "aoss:APIAccessAll"
        ]
        Resource = aws_opensearchserverless_collection.hrr_kb.arn
      },
      {
        Effect = "Allow"
        Action = [
          "bedrock:InvokeModel",
          "bedrock:InvokeModelWithResponseStream"
        ]
        Resource = "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-sonnet-4-6"
      }
    ]
  })
}

resource "aws_iam_role_policy" "hrr_bedrock_agent_lambda" {
  role = aws_iam_role.hrr_bedrock_agent.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = "lambda:InvokeFunction"
        Resource = [
          aws_lambda_function.hrr_support_actions.arn,
          "${aws_lambda_function.hrr_support_actions.arn}:*"
        ]
      }
    ]
  })
}
</code></pre>
<p>Key things to get right:</p>
<ul>
<li><strong>The trust principal is <code>bedrock.amazonaws.com</code>.</strong> Not <code>agents.amazonaws.com</code>. This was the most common gotcha I hit early on. AWS Bedrock Agents use the Bedrock service principal.</li>
<li><strong>Scope the <code>bedrock:InvokeModel</code> resource to specific model ARNs.</strong> A wildcard gives the agent access to every model in Bedrock, including ones you may not want it using for cost or compliance reasons. Pin it to the models you actually use.</li>
<li><strong>Add <code>aoss:APIAccessAll</code> for OpenSearch Serverless.</strong> The knowledge base needs this permission to query the vector index. Without it, the agent returns "Knowledge base not found" errors that take forever to debug.</li>
<li><strong>The Lambda invoke permission needs the <code>:*</code> qualifier.</strong> Bedrock Agents invoke Lambda functions using a version-specific ARN internally. If you only grant access to the unqualified ARN, the invocation fails when the agent tries to call a specific version.</li>
</ul>
<h2>CloudWatch Logging for Agent Traces</h2>
<p>Agent traces are the single most useful debugging tool you have. Every step the agent takes gets logged. The raw model input, the model output, which knowledge base queries were executed, which action group functions were invoked, what parameters were passed, and what returned.</p>
<pre><code class="language-hcl">resource "aws_bedrockagent_agent" "hrr_support" {
  agent_name              = "hrr-support-agent"
  agent_resource_role_arn = aws_iam_role.hrr_bedrock_agent.arn
  foundation_model        = "anthropic.claude-sonnet-4-6"
  instruction             = &lt;&lt;-EOT
You are a customer support agent. Use the knowledge base to answer
questions about products, policies, and procedures. Use action group
functions to look up orders and process returns. If the user asks
about account deletion or billing disputes, explain that you cannot
handle those and offer to transfer them to a human agent.
EOT

  # Enable traces
  customer_encryption_key_arn = aws_kms_key.hrr_bedrock.arn

  # Optional: enable trace logging to CloudWatch
  # (enabled via the Bedrock Agent API or console)
}

resource "aws_cloudwatch_log_group" "hrr_agent_traces" {
  name              = "/aws/bedrock/agents/hrr-support"
  retention_in_days = 30
}

data "aws_iam_policy_document" "hrr_bedrock_logging" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["bedrock.amazonaws.com"]
    }
    actions = ["logs:PutLogEvents"]
    resources = ["${aws_cloudwatch_log_group.hrr_agent_traces.arn}:*"]
  }
}
</code></pre>
<p>You need to enable trace logging through the Bedrock Agent API or the console. Terraform does not yet support all the agent-level configuration options for CloudWatch logging, so I use a manual step or a local-exec provisioner to set it up after the agent is created.</p>
<pre><code class="language-bash">aws bedrock-agent update-agent \
  --agent-id $(terraform output -raw agent_id) \
  --agent-name hrr-support-agent \
  --agent-collaboration CUSTOM \
  --customer-encryption-key-arn $(terraform output -raw kms_arn)
</code></pre>
<p>When something goes wrong, traces tell you exactly where. I have debugged issues where the model was generating malformed tool call parameters, where the guardrail was too aggressive and blocking legitimate inputs, and where the knowledge base returned irrelevant chunks because the chunking strategy was wrong. Every one of those was visible in the trace logs within seconds.</p>
<h2>Complete Terraform Example</h2>
<p>Here is a full Terraform config that ties everything together. This omits the S3 bucket and OpenSearch Serverless collection definitions to keep it focused, but the full setup needs those too.</p>
<pre><code class="language-hcl"># main.tf (condensed)

provider "aws" {
  region = "us-east-1"
}

data "aws_caller_account" "current" {}

# --- Agent ---

resource "aws_bedrockagent_agent" "hrr_support" {
  agent_name              = "hrr-support-agent"
  agent_resource_role_arn = aws_iam_role.hrr_bedrock_agent.arn
  foundation_model        = "anthropic.claude-sonnet-4-6"
  instruction             = "You are a customer support agent..."
  idle_ttl                = 300
  prepare_agent   = true
}

# --- Knowledge Base ---

resource "aws_bedrockagent_knowledge_base" "hrr_docs" {
  name     = "hrr-docs-kb"
  role_arn = aws_iam_role.hrr_bedrock_agent.arn

  knowledge_base_configuration {
    type = "VECTOR"
    vector_knowledge_base_configuration {
      embedding_model_arn = "arn:aws:bedrock:us-east-1::foundation-model/amazon.titan-embed-text-v2:0"
    }
  }

  storage_configuration {
    type = "OPENSEARCH_SERVERLESS"
    opensearch_serverless_configuration {
      collection_arn    = aws_opensearchserverless_collection.hrr_kb.arn
      vector_index_name = "hrr-bedrock-kb-index"
      field_mapping {
        metadata_field = "AMAZON_BEDROCK_METADATA"
        text_field     = "AMAZON_BEDROCK_TEXT_CHUNK"
      }
    }
  }
}

resource "aws_bedrockagent_data_source" "hrr_docs_source" {
  name              = "hrr-prod-docs"
  knowledge_base_id = aws_bedrockagent_knowledge_base.hrr_docs.id
  data_source_type  = "S3"
  data_deletion_policy = "RETAIN"

  s3_configuration {
    bucket_arn = aws_s3_bucket.hrr_knowledge_docs.arn
    inclusion_prefixes = ["documents/"]
  }

  vector_ingestion_configuration {
    chunking_configuration {
      chunking_strategy = "HIERARCHICAL"
      hierarchical_chunking_configuration {
        level_configurations { max_tokens = 1500 }
        level_configurations { max_tokens = 512 }
        overlap_tokens = 100
      }
    }
    parsing_configuration {
      parsing_strategy = "BEDROCK_FOUNDATION_MODEL"
    }
  }
}

# --- Action Group ---

resource "aws_bedrockagent_agent_action_group" "hrr_support" {
  agent_id          = aws_bedrockagent_agent.hrr_support.id
  agent_version     = "DRAFT"
  action_group_name = "hrr-support-actions"
  description       = "Support-related actions"

  action_group_executor {
    lambda = aws_lambda_function.hrr_support_actions.arn
  }

  api_schema {
    s3 {
      s3_bucket = aws_s3_bucket.hrr_action_schemas.id
      s3_key    = "schemas/support-actions.json"
    }
  }
}

# --- Guardrails ---

resource "aws_bedrockagent_agent_knowledge_base_association" "hrr_docs_assoc" {
  agent_id       = aws_bedrockagent_agent.hrr_support.id
  agent_version  = "DRAFT"
  description    = "Associate knowledge base with agent"
  knowledge_base_id = aws_bedrockagent_knowledge_base.hrr_docs.id
}

resource "aws_bedrockagent_agent_guardrail_association" "hrr_guardrail_assoc" {
  agent_id      = aws_bedrockagent_agent.hrr_support.id
  agent_version = "DRAFT"
  guardrail_id  = aws_bedrockagent_guardrail.hrr_support.id
}
</code></pre>
<h2>Testing with the Bedrock Console</h2>
<p>The Bedrock console has a built-in test panel for agents. You can send messages, inspect the full trace, see which steps the agent took, and test individual action group functions without wiring up a client application.</p>
<p>When testing, pay attention to three things in the trace output:</p>
<ul>
<li><strong>Orchestration loop iterations.</strong> Count how many times the model calls tools before responding. If it is calling five or six tools for a simple question, something is wrong. Either the model is confused about the tool capabilities or the action group schema is too vague.</li>
<li><strong>Knowledge base relevance scores.</strong> Each retrieved chunk comes with a score. If the scores are low (below 0.6 for Titan embeddings), the chunking strategy or embedding model may not be a good fit for your document types.</li>
<li><strong>Guardrail triggers.</strong> If legitimate inputs keep getting blocked, check the content filter thresholds and topic policy definitions. I had a case where the agent classified "I need help with billing" as a prompt attack because the user's phrasing triggered the prompt injection filter. Had to dial that back.</li>
</ul>
<h2>Cost Considerations</h2>
<p>Bedrock Agents introduce costs beyond the base model inference. Here is the breakdown I track per agent:</p>
<ul>
<li><strong>Model inference.</strong> Per-token pricing for the foundation model. Claude Sonnet 4.6 is $3.00/M input tokens and $15.00/M output tokens. Agent orchestration increases token consumption because of the system prompt, tool definitions, and conversation history that get included in every turn.</li>
<li><strong>Knowledge base storage.</strong> OpenSearch Serverless collection costs based on OCU (OpenSearch Capacity Units). A minimal collection with one OCU costs around $300/month. This is the biggest surprise cost for most people. If your knowledge base is large, the OpenSearch costs dominate the monthly bill.</li>
<li><strong>Knowledge base retrieval.</strong> Bedrock charges per character for knowledge base retrieval. At scale this adds up, but for most workloads it is a fraction of the inference cost.</li>
<li><strong>Lambda invocations.</strong> Standard Lambda pricing applies. For action groups that get called frequently, these costs are negligible relative to the Bedrock inference costs.</li>
<li><strong>Guardrail processing.</strong> Per-text-unit pricing for content filtering and PII redaction. Usually less than $0.50 per million characters processed.</li>
</ul>
<p>My production support agent handling about 5,000 conversations per month costs roughly $450. About $200 of that is the OpenSearch Serverless collection, $200 is model inference, and the remaining $50 is everything else. The OpenSearch cost is essentially a floor. Even with zero traffic, you pay the OCU allocation.</p>
<p>If you want to reduce knowledge base costs, consider using the Aurora PostgreSQL vector engine instead of OpenSearch Serverless. You share an existing RDS instance and avoid the separate OpenSearch bill. The tradeoff is provisioning and managing the Aurora cluster yourself.</p>
<h2>Production Considerations</h2>
<h3>Provisioned Throughput vs On-Demand</h3>
<p>On-demand inference is fine for development and low-volume workloads. For production agents handling sustained traffic, provisioned throughput gives you predictable latency and avoids throttling.</p>
<p>Throttling shows up as <code>ThrottlingException</code> in your agent traces. The agent retries automatically, but each retry adds seconds of latency. For customer-facing agents, users notice the delay.</p>
<p>Provisioned throughput costs more but eliminates the variance. Budget 1.5x to 2x the on-demand model cost for provisioned capacity, depending on the commitment term.</p>
<h3>Latency</h3>
<p>A complete agent turn involves multiple model calls. The model calls itself (for reasoning), then potentially knowledge base retrieval (adds 500ms-2s depending on index size), then one or more Lambda invocations (500ms-2s each), and finally the model generates the response. End-to-end latency for a multi-step agent interaction is usually 10-30 seconds.</p>
<p>Do not try to make a Bedrock Agent respond in under a second. It is not architected for real-time use cases. If you need low-latency responses, use direct model inference and handle tool routing in your own code.</p>
<p>The biggest latency improvements I have found:</p>
<ul>
<li><strong>Reduce idle TTL</strong> on the agent (<code>idle_ttl</code> in Terraform). Default is 300 seconds. Lowering it to 60 seconds reduces cold start frequency for bursty traffic.</li>
<li><strong>Use the same Lambda runtime</strong> for all action groups. If some are Python and some are Node.js, the agent has to initialize different runtimes.</li>
<li><strong>Pre-warm the OpenSearch collection</strong> by running periodic health-check queries if your traffic pattern has sudden spikes.</li>
</ul>
<h3>Agent Versions and Aliases</h3>
<p>Bedrock Agents use a versioning system similar to Lambda. You create a DRAFT version during development, then create numbered versions for production. Aliases point to specific versions, and you can shift traffic between versions for canary deployments.</p>
<pre><code class="language-hcl">resource "aws_bedrockagent_agent_alias" "hrr_support_prod" {
  agent_id    = aws_bedrockagent_agent.hrr_support.id
  alias_name  = "prod"
  routing_configuration {
    agent_version = "1"
  }
}
</code></pre>
<p>I use DRAFT for all development and testing, then promote to version 1 and alias it as "prod" for production traffic. When I need to make changes, I update the DRAFT, test in the console, create a new version, and point the prod alias at it.</p>
<h2>Practical Summary</h2>
<p>Bedrock Agents are not the right tool for every AI use case. If you need a single-turn Q&A endpoint, just call <code>bedrock:InvokeModel</code> from a Lambda function and skip the agent overhead. Use an agent when you need multi-step reasoning, conditional tool usage, or retrieval-augmented generation that the model itself decides to trigger.</p>
<p>Here are the decisions I would make starting from scratch today:</p>
<ul>
<li><strong>Start with one knowledge base and one action group.</strong> You can add more later. The complexity grows with each additional tool the agent can choose from, and the model makes worse decisions when overwhelmed with options.</li>
<li><strong>Use hierarchical chunking for anything with structure.</strong> Fixed-size is a fallback, not a default.</li>
<li><strong>Pin the foundation model ARN in IAM.</strong> Never use a wildcard for Bedrock model access in production.</li>
<li><strong>Set guardrails before the first user request.</strong> Content filtering and topic policies are easier to configure upfront than to retrofit after something gets through.</li>
<li><strong>Budget for the OpenSearch Serverless collection.</strong> It is the biggest fixed cost and the easiest to overlook. Consider Aurora PostgreSQL for vector storage if the cost is a concern.</li>
<li><strong>Use the Bedrock console test panel for trace debugging.</strong> It shows you exactly what the model sees and does at every step. That visibility is worth more than any documentation.</li>
</ul>
<p>The agent pattern is powerful for the right use case, but the infrastructure around it matters more than the agent configuration itself. Get the knowledge base chunking right, write clear action group schemas, lock down the IAM policies, and set guardrails that block the right things. The agent handles the rest.</p>
