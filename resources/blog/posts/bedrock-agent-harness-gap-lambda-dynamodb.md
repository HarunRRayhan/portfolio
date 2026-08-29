---
title: "The Model Was Fine. My Bedrock Agent Harness Was the 70-Point Gap."
slug: "bedrock-agent-harness-gap-lambda-dynamodb"
brief: "I quoted an agent quality number to a client, then couldn't reproduce it two weeks later. Same modelId, different harness. Here's the production harness I run now on Lambda and DynamoDB: a versioned manifest logged on every run, working memory with explicit compaction instead of silent truncation, and an action budget enforced in code rather than asked for in the prompt."
publishedAt: "2026-08-29T18:00:00.000Z"
draft: true
draftToken: "4253babba2672e339e82472bbf0f5736"
readTimeInMinutes: 14
coverImageUrl: "/blog-assets/bedrock-agent-harness-gap-lambda-dynamodb/cover.jpg"
reactionCount: 0
responseCount: 0
replyCount: 0
tags:
  - name: AWS
    slug: aws
  - name: Bedrock
    slug: bedrock
  - name: Lambda
    slug: lambda
  - name: DynamoDB
    slug: dynamodb
  - name: AI
    slug: ai
  - name: Terraform
    slug: terraform
---

<p>In June I told a client their internal triage agent was getting 8 out of 10 on our task set. I had the runs in Langfuse. I wasn't making it up.</p>

<p>Three weeks later they asked me to demo it on a call and it got 5. Same <code>modelId</code>. Same prompt file, byte for byte, I checked with <code>git log -p</code>. Same ten tasks. I sat there on a shared screen watching an agent I'd vouched for fumble a Terraform plan review it had handled cleanly in June, and I had nothing useful to say about why.</p>

<p>What had changed was forty lines in the loop around the model. I'd tightened the context window handling to stop a run from blowing past the token limit, and the way I tightened it was to drop the oldest turns once the transcript got long. Cheap fix, shipped on a Friday, no note anywhere. On short tasks it changed nothing. On the tasks that took twelve or fifteen tool calls, the agent kept re-reading a file it had already read in a turn I'd deleted, burned its patience on rediscovery, and answered from a thinner picture than it had in June.</p>

<p>The model was fine. My harness was the variable, and I hadn't versioned it, logged it, or even thought of it as a thing that had versions.</p>

<h2>The harness is the code you didn't think was part of the model</h2>

<p>By harness I mean everything between your business logic and the <code>Converse</code> call. What gets rendered into the prompt, what survives from the previous turn, which tools are exposed on this particular run, what happens when the transcript outgrows the window, when the loop stops. None of that is in Bedrock. All of it is yours, and all of it moves the output.</p>

<p>This isn't a niche observation anymore, it's most of the current news cycle around agents. Worth walking through the public numbers, because they're doing a specific job in this post and it's easy to overclaim them.</p>

<p>ARC Prize's standard evaluation puts Claude Opus 5 at 30.16% on ARC-AGI-3. In August, AWS engineers open-sourced an agent built on the Strands Agents SDK running Claude Opus 5 (High) on Bedrock that cleared all 183 levels across the 25 public games with a 99.95% score, in one eight-hour run, at roughly $830 in tokens. NVIDIA reported a comparable result with its AVO agent, also on Opus 5, at 100% across the same public set. Separately, OpenAI reported GPT-5.6 Sol going from 13.3% to 38.3% on the same public set purely by turning on retained reasoning and compaction in the Responses API, with about 6x fewer output tokens.</p>

<p>Two honest caveats before anybody quotes those at me.</p>

<p>First, the metric is Relative Human Action Efficiency, not "percent of tasks solved." It scores how many actions you took against a first-time human baseline, squared, so it punishes wandering hard. A jump from 30 to 99.95 is substantially a story about not flailing, which is exactly the thing a harness controls. NVIDIA said this out loud in their own writeup: their run used a different reasoning setting and a substantially different agent system, so the delta shouldn't be read as a clean measurement of the harness contribution. I'd rather repeat their caveat than launder their number.</p>

<p>Second, none of those are my numbers and none of them are your workload. What I take from them is narrower and more useful: the industry just spent a month demonstrating that you can move a headline agent metric by tens of points with the weights held constant. If that's true on a public benchmark with people watching, it's true on your SQS triage agent with nobody watching.</p>

<p>Which means every quality number I've ever quoted about a Bedrock agent was really a number about a model <em>and</em> a harness, and I'd only been writing down half of it.</p>

<p>So here's what I built after that demo call. Three pieces, all boring, all in the repo.</p>

<h2>Piece 1: a versioned harness manifest, logged on every single run</h2>

<p>The manifest is one object that holds every harness-level decision that can move output quality. It lives in the repo next to the code it configures, it gets a version, and it goes out with every run to CloudWatch and Langfuse.</p>

<pre><code class="language-json">{
  "harnessVersion": "2026.08.3",
  "modelId": "us.anthropic.claude-opus-5",
  "summarizerModelId": "us.anthropic.claude-haiku-4-5",
  "toolAllowlist": ["kb_search", "tf_plan_read", "sqs_peek", "cw_logs_query"],
  "maxActions": 40,
  "maxWallClockMs": 540000,
  "costCeilingUsd": 2.5,
  "memoryPolicy": {
    "mode": "compact",
    "compactAtTokens": 20000,
    "keepRecentTurns": 6,
    "archive": "s3"
  }
}
</code></pre>

<p>The field that does the most work is the one that isn't in the file. At build time I stamp in the git SHA of the harness directory, so the logged manifest identifies the exact code, not just the config:</p>

<pre><code class="language-typescript">import manifest from "./hrr-harness.manifest.json";

// Set at build time: git rev-parse --short HEAD:src/harness
const HRR_HARNESS_SHA = process.env.HRR_HARNESS_SHA ?? "dev";

export const HRR_MANIFEST = {
  ...manifest,
  harnessSha: HRR_HARNESS_SHA,
} as const;
</code></pre>

<p>Config alone isn't enough, and that's the whole lesson from June. My <code>memoryPolicy</code> would have read <code>"mode": "truncate"</code> both before and after the change I made. The thing that moved was <em>how</em> truncate behaved, which is code. The version number tells you the intent, the SHA tells you the implementation, and you need both to answer "why is it worse today."</p>

<p>Emitting it costs one line. I use CloudWatch Embedded Metric Format so the dimensions are queryable in Logs Insights and the counters land as real metrics without a separate <code>PutMetricData</code> call:</p>

<pre><code class="language-typescript">function hrr_emitRunLog(run: HrrRunResult) {
  console.log(
    JSON.stringify({
      _aws: {
        Timestamp: Date.now(),
        CloudWatchMetrics: [
          {
            Namespace: "hrr/agent",
            Dimensions: [["harnessSha", "modelId", "taskKind"]],
            Metrics: [
              { Name: "actions", Unit: "Count" },
              { Name: "costUsd", Unit: "None" },
              { Name: "wallClockMs", Unit: "Milliseconds" },
              { Name: "compactions", Unit: "Count" },
            ],
          },
        ],
      },
      harnessVersion: HRR_MANIFEST.harnessVersion,
      harnessSha: HRR_MANIFEST.harnessSha,
      modelId: HRR_MANIFEST.modelId,
      taskKind: run.taskKind,
      runId: run.runId,
      stopReason: run.stopReason,
      actions: run.actions,
      costUsd: run.costUsd,
      wallClockMs: run.wallClockMs,
      compactions: run.compactions,
    }),
  );
}
</code></pre>

<p>The same object goes on the Langfuse trace as metadata, which is where I actually do the comparing. I wrote about that wiring in <a href="/blog/llm-observability-langfuse-lambda-cloudwatch">adding LLM observability with Langfuse, Lambda, and CloudWatch</a>. The upgrade here is small and it's the entire point: the trace now carries the harness SHA, so "filter to runs from harness <code>9f4c1ab</code>" is a query instead of an archaeology project.</p>

<p><code>stopReason</code> deserves a mention because it's the field I check first now. It's a closed enum, never free text:</p>

<pre><code class="language-typescript">type HrrStopReason =
  | "completed"
  | "action_budget_exhausted"
  | "cost_ceiling_exceeded"
  | "wall_clock_exceeded"
  | "tool_denied"
  | "model_error";
</code></pre>

<p>A run that ends on <code>completed</code> and a run that ends on <code>action_budget_exhausted</code> can both return a plausible-looking answer. Without this field they look identical in your logs, and one of them is a truncated guess.</p>

<h2>Piece 2: working memory in DynamoDB, with compaction you can audit</h2>

<p>The June bug was silent dropping. So the rule now is that nothing leaves the working set without being written somewhere durable first, and without leaving a record that it happened.</p>

<p>Working memory is one DynamoDB table. Partition key is the run ID, sort key is a zero-padded sequence number, and each item is one turn: a model message, a tool call, a tool result, or a summary.</p>

<pre><code class="language-typescript">type HrrTurn = {
  pk: string;              // RUN#&lt;runId&gt;
  sk: string;              // TURN#000012
  kind: "message" | "tool_call" | "tool_result" | "summary";
  body: string;
  approxTokens: number;
  archivedTo?: string;     // s3 key, set when folded away
  expiresAt: number;       // TTL, 14 days
};
</code></pre>

<p>Lambda can't hold this in memory across invocations and shouldn't try. A long agent run on Step Functions is many invocations, a retried invocation replays from wherever the state machine left off, and a warm container is not a guarantee of anything. The table is the truth.</p>

<p>The <code>approxTokens</code> field is a stored estimate, roughly four characters per token, computed once on write. I could recount on every read, but I'm reading the whole run's turns on every loop iteration and the counting adds up. Storing it means the compaction check is a sum over numbers I already have.</p>

<p>Compaction runs when that sum crosses <code>compactAtTokens</code>. Three steps, in this order, and the order is the safety property:</p>

<pre><code class="language-typescript">async function hrr_compact(runId: string, turns: HrrTurn[]): Promise&lt;HrrTurn[]&gt; {
  const keep = turns.slice(-HRR_MANIFEST.memoryPolicy.keepRecentTurns);
  const fold = turns.slice(0, -HRR_MANIFEST.memoryPolicy.keepRecentTurns);
  if (fold.length === 0) return turns;

  // 1. Archive first. If anything below fails, the raw turns still exist in S3
  //    and the DynamoDB items are untouched. Worst case is an orphaned object.
  const archiveKey = `runs/${runId}/fold-${fold[0].sk}-${fold.at(-1)!.sk}.jsonl`;
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.HRR_ARCHIVE_BUCKET,
      Key: archiveKey,
      Body: fold.map((t) =&gt; JSON.stringify(t)).join("\n"),
    }),
  );

  // 2. Summarize with the cheap model. This invoke counts against the run's
  //    cost ceiling like any other, which is why summarizerModelId is in the
  //    manifest.
  const summary = await hrr_summarizeFold(fold);

  // 3. Replace the folded turns with one summary item that points at the archive.
  const summaryTurn: HrrTurn = {
    pk: `RUN#${runId}`,
    sk: `TURN#${fold.at(-1)!.sk.slice(5)}S`,
    kind: "summary",
    body: summary.text,
    approxTokens: summary.approxTokens,
    archivedTo: archiveKey,
    expiresAt: hrr_ttl(),
  };

  await hrr_putTurn(summaryTurn);
  await hrr_markArchived(runId, fold, archiveKey);

  return [summaryTurn, ...keep];
}
</code></pre>

<p>Archive before summarize, summarize before replace. Get that order wrong and a summarizer throttle in the middle of compaction eats the turns it was supposed to preserve.</p>

<p>Two things I got wrong on the first pass and would tell anyone building this.</p>

<p>The summarizer prompt has to ask for facts and open threads, not prose. My first version produced a nice paragraph about what the agent had been doing, which is useless to the agent. What it needs is the concrete residue: files already read and what was in them, tools already called with which arguments, hypotheses already ruled out. The tell that you've got it wrong is the agent re-running a tool call it made before the fold. That's the same failure as truncation, just with extra steps and a summarizer bill.</p>

<p>And the summarizer invoke is a real invoke. It costs tokens, it takes a second or two, and it can throttle. It goes through the same budget accounting as everything else, which is the next piece.</p>

<p>Set a TTL on the table. Agent working memory has no business living forever, the archive in S3 is the durable copy, and DynamoDB TTL deletes are free. Mine is fourteen days.</p>

<h2>Piece 3: budgets the model can't talk its way out of</h2>

<p>I used to have this line in a system prompt: "Use at most 20 tool calls. If you cannot finish, say so."</p>

<p>That's not a budget. That's a request. The model is the thing you're trying to bound, so it can't be the thing enforcing the bound. Sometimes it complied. Sometimes it used 34 tool calls and told me at the end that it had stayed under 20, which is the kind of answer you get when the counter and the counted are the same component.</p>

<p>The budget now lives in a middleware wrapper around the loop, and the model has no idea it exists:</p>

<pre><code class="language-typescript">async function hrr_runAgent(task: HrrTask): Promise&lt;HrrRunResult&gt; {
  const startedAt = Date.now();
  let actions = 0;
  let costUsd = 0;
  let compactions = 0;

  const budgetStop = (): HrrStopReason | null =&gt; {
    if (actions &gt;= HRR_MANIFEST.maxActions) return "action_budget_exhausted";
    if (costUsd &gt;= HRR_MANIFEST.costCeilingUsd) return "cost_ceiling_exceeded";
    if (Date.now() - startedAt &gt;= HRR_MANIFEST.maxWallClockMs) return "wall_clock_exceeded";
    return null;
  };

  let turns = await hrr_loadTurns(task.runId);

  while (true) {
    const stop = budgetStop();
    if (stop) return hrr_finish(task, { stopReason: stop, actions, costUsd, compactions });

    if (hrr_sumTokens(turns) &gt; HRR_MANIFEST.memoryPolicy.compactAtTokens) {
      turns = await hrr_compact(task.runId, turns);
      compactions += 1;
      costUsd += hrr_lastSummarizerCostUsd();
    }

    const response = await bedrock.send(
      new ConverseCommand({
        modelId: HRR_MANIFEST.modelId,
        messages: hrr_toMessages(turns),
        toolConfig: { tools: hrr_allowedToolSpecs() },
      }),
    );

    costUsd += hrr_costUsd(response.usage);

    if (response.stopReason !== "tool_use") {
      return hrr_finish(task, {
        stopReason: "completed",
        answer: hrr_text(response),
        actions,
        costUsd,
        compactions,
      });
    }

    for (const call of hrr_toolCalls(response)) {
      actions += 1;
      turns = await hrr_appendTurn(task.runId, await hrr_dispatch(call));
    }
  }
}
</code></pre>

<p>Note that the check runs at the top of the loop, before the invoke, not after. Checking after means you always pay for one more invoke than your ceiling allows, and on Opus that's not a rounding error.</p>

<p>The tool allowlist is enforced at dispatch, against the manifest, not against whatever the tool registry happens to export:</p>

<pre><code class="language-typescript">async function hrr_dispatch(call: HrrToolCall): Promise&lt;HrrTurn&gt; {
  if (!HRR_MANIFEST.toolAllowlist.includes(call.name)) {
    // Deny as a tool_result, not a thrown error. The model sees the denial,
    // can adapt, and the action still counted against the budget.
    return hrr_toolResultTurn(call, {
      error: `tool ${call.name} is not in the allowlist for harness ${HRR_MANIFEST.harnessSha}`,
    });
  }
  return hrr_toolResultTurn(call, await HRR_TOOLS[call.name](call.input));
}
</code></pre>

<p>Two reasons the allowlist is in the manifest rather than implied by the code. It makes "which tools could this run possibly have called" answerable from the log line alone, months later. And it means a tool someone adds to the registry for a different agent doesn't quietly become reachable here. That's a blast-radius argument as much as a quality one, and it pairs with scoping the execution role itself, which I went through in <a href="/blog/lock-down-bedrock-iam-lambda-data-leak">locking down Bedrock access so Lambda can't leak data through the LLM</a>.</p>

<p>For runs that outlive a Lambda invocation, the same budget becomes a Choice state in Step Functions. The counters ride in the state document, the Choice checks them between iterations, and the enforcement point is the state machine rather than the function:</p>

<pre><code class="language-json">{
  "BudgetGate": {
    "Type": "Choice",
    "Choices": [
      {
        "Variable": "$.budget.actions",
        "NumericGreaterThanEqualsPath": "$.manifest.maxActions",
        "Next": "StopActionBudget"
      },
      {
        "Variable": "$.budget.costUsd",
        "NumericGreaterThanEqualsPath": "$.manifest.costCeilingUsd",
        "Next": "StopCostCeiling"
      }
    ],
    "Default": "AgentStep"
  }
}
</code></pre>

<p>To be clear about scope, this is not the workflow-graph post. I wrote that one already, on <a href="/blog/step-functions-llm-orchestration-replacing-lambda-chains">using Step Functions to orchestrate LLM workflows without chaining Lambdas</a>, and it's about the shape of the pipeline. This is a gate inside one agent's loop. Different concern, and you can run the whole harness in a single Lambda if your tasks finish inside fifteen minutes. Mine mostly do.</p>

<h2>What it actually bought me</h2>

<p>Numbers below are from my own runs, on my own ten-task internal set, in August. Read them as illustrative, not as a benchmark. Ten tasks is a small sample, they're my tasks, and I graded them myself against a rubric I also wrote. The point is the shape of the difference, not the digits.</p>

<p>The task set is three RAG questions that have to cite a source document, three Terraform plan reviews where the plan contains a deliberate problem, three SQS dead-letter triages, and one deliberately unanswerable question where the correct behavior is to say so. "Naked loop" is the same model, same prompts, same tools, in a plain <code>Converse</code> loop with rolling truncation and no budget. Same afternoon, same account.</p>

<table>
  <thead>
    <tr>
      <th>Measure</th>
      <th>Naked Converse loop</th>
      <th>Harnessed</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Tasks passing my rubric</td>
      <td>5 / 10</td>
      <td>8 / 10</td>
    </tr>
    <tr>
      <td>Median tool calls per task</td>
      <td>17</td>
      <td>11</td>
    </tr>
    <tr>
      <td>Repeated tool calls (same args, same run)</td>
      <td>23 across the set</td>
      <td>4 across the set</td>
    </tr>
    <tr>
      <td>Median total tokens per task</td>
      <td>~74k</td>
      <td>~41k</td>
    </tr>
    <tr>
      <td>Median wall time per task</td>
      <td>1m 52s</td>
      <td>1m 19s</td>
    </tr>
    <tr>
      <td>Worst single run cost</td>
      <td>$4.10</td>
      <td>$2.50, capped</td>
    </tr>
    <tr>
      <td>Runs that never terminated on their own</td>
      <td>2</td>
      <td>0</td>
    </tr>
    <tr>
      <td>Unanswerable task handled correctly</td>
      <td>No, invented a citation</td>
      <td>Yes, stopped and said so</td>
    </tr>
    <tr>
      <td>Re-runnable at a known configuration</td>
      <td>No</td>
      <td>Yes, by harness SHA</td>
    </tr>
  </tbody>
</table>

<p>The row I'd point at isn't the 5 to 8. It's the repeated tool calls, 23 down to 4. That's the compaction change showing up as behavior, and it's most of where the token and time savings come from too. An agent that keeps re-reading the same plan file because the turn where it read it got deleted looks, from the outside, exactly like a model that isn't very good.</p>

<p>The $4.10 is the run that made the cost ceiling non-negotiable for me. One dead-letter triage where the agent got into a loop between two tools, each result making the other look worth retrying. Under the naked loop it ran until I killed it. Under the harness it stops at $2.50 with <code>stopReason: "cost_ceiling_exceeded"</code>, which is a bad outcome I can see in a dashboard instead of a bad outcome I find on a bill.</p>

<p>And the last row is the one that started all this. "Re-runnable at a known configuration" is either yes or no, and in June mine was no.</p>

<h2>The Terraform</h2>

<p>Nothing exotic. The working memory table, the archive bucket, and a role scoped to exactly the two models in the manifest.</p>

<pre><code class="language-hcl">resource "aws_dynamodb_table" "hrr_agent_memory" {
  name         = "hrr-agent-working-memory"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "pk"
  range_key    = "sk"

  attribute {
    name = "pk"
    type = "S"
  }

  attribute {
    name = "sk"
    type = "S"
  }

  ttl {
    attribute_name = "expiresAt"
    enabled        = true
  }

  point_in_time_recovery {
    enabled = true
  }
}

resource "aws_s3_bucket" "hrr_agent_archive" {
  bucket = "hrr-agent-archive"
}

resource "aws_s3_bucket_lifecycle_configuration" "hrr_agent_archive" {
  bucket = aws_s3_bucket.hrr_agent_archive.id

  rule {
    id     = "expire-folded-turns"
    status = "Enabled"

    filter {
      prefix = "runs/"
    }

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    expiration {
      days = 180
    }
  }
}
</code></pre>

<p>The IAM policy is where the manifest earns its keep a second time. The allowlist bounds what the agent can call at runtime, and the role bounds what it can call at all:</p>

<pre><code class="language-hcl">data "aws_iam_policy_document" "hrr_agent" {
  statement {
    sid    = "InvokeManifestModelsOnly"
    effect = "Allow"
    actions = [
      "bedrock:InvokeModel",
      "bedrock:Converse",
    ]
    resources = [
      "arn:aws:bedrock:${var.region}:${var.account_id}:inference-profile/us.anthropic.claude-opus-5",
      "arn:aws:bedrock:${var.region}:${var.account_id}:inference-profile/us.anthropic.claude-haiku-4-5",
    ]
  }

  statement {
    sid    = "WorkingMemory"
    effect = "Allow"
    actions = [
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
      "dynamodb:Query",
    ]
    resources = [aws_dynamodb_table.hrr_agent_memory.arn]
  }

  statement {
    sid       = "ArchiveWriteOnly"
    effect    = "Allow"
    actions   = ["s3:PutObject"]
    resources = ["${aws_s3_bucket.hrr_agent_archive.arn}/runs/*"]
  }
}
</code></pre>

<p>Write-only on the archive is deliberate. The agent folds turns away, it never reads them back. Replay and debugging happen from my laptop with a different role. If a prompt injection ever convinces the agent to go rummaging through old runs for another tenant's context, it gets an <code>AccessDenied</code> instead of a transcript.</p>

<p>If you list a model in the manifest and forget it here, you find out on the first run with an <code>AccessDeniedException</code>, which is the right way round. The failure I want to avoid is the opposite one, where the role is broad and the manifest is the only thing standing between a run and a model nobody budgeted for.</p>

<h2>The rule I actually enforce now</h2>

<p><strong>Never quote a Bedrock quality number without the harness SHA attached.</strong></p>

<p>Not in a client email, not in a standup, not in a README, not in my own notes. "The agent gets 8 out of 10" is not a fact. "The agent gets 8 out of 10 on the August task set at harness <code>9f4c1ab</code>, model <code>us.anthropic.claude-opus-5</code>" is a fact, and it's one I can check three weeks later on a call.</p>

<p>It sounds pedantic until the first time it saves you. Mine went like this: a run looked worse than expected, I filtered Langfuse by harness SHA, and the bad runs were all on a SHA I didn't recognize. It was a preview deploy that hadn't picked up a manifest change. Ten minutes, not an afternoon of re-reading prompts convinced the model had silently changed under me.</p>

<p>The uncomfortable corollary is that most published agent quality numbers, including several of mine from earlier this year, are underspecified. When a vendor says a model scores X on some agentic benchmark, that's a model and a harness, and you're only ever told about one of them. The ARC-AGI-3 spread this month is the clearest public demonstration of that gap I've seen: same weights, wildly different results, and the difference is code that somebody wrote around the model. It just happens that when it's your code, you can version it.</p>

<p>Start with the manifest if you only do one thing. It's a JSON file and a log line, you can add it this afternoon, and it turns your next bad week from a mystery into a diff.</p>

<p>Hope you enjoyed this one. If you're running a tool-using agent on Bedrock and you've found a compaction strategy that beats summarize-and-archive, or you've got a budget-enforcement trick that doesn't cost an extra state transition, come tell me on X at <a href="https://x.com/harundotdev">@harundotdev</a>.</p>
