---
title: "Moving Past Vibe Coding: The Pre-Merge Checklist I Now Run on Every AI-Generated PR"
slug: "pre-merge-checklist-ai-generated-prs"
brief: "AI agents write code fast. They also write bugs, security holes, and nonsense. Here is the 12-item checklist I run before merging anything an agent touched."
publishedAt: "2026-07-07T09:00:00.000Z"
readTimeInMinutes: 13
coverImageUrl: "/blog-assets/pre-merge-checklist-ai-generated-prs/cover.jpg"
reactionCount: 0
responseCount: 0
replyCount: 0
tags:
  - name: AWS
    slug: aws
  - name: AI
    slug: ai
  - name: DevOps
    slug: devops
  - name: Terraform
    slug: terraform
  - name: CI/CD
    slug: ci-cd
---

<p>I have been leaning hard into AI coding agents for the last few months. Claude Code, Copilot, the whole stack. They generate Terraform, Lambda handlers, CI workflows, and blog content. And honestly? They are shockingly productive.</p>

<p>But here is the thing nobody talks about when they tell you to vibe code. The same agent that writes a perfect IAM policy in 30 seconds will also quietly introduce a security hole that a human would never write. It will import a package that does not exist. It will suggest a Terraform resource that was deprecated three years ago. And it will do all of this with total confidence.</p>

<p>I learned this the hard way. An agent generated a PR that looked perfect. Tests passed. Linting clean. I merged it. The next morning, our staging environment was serving 403 errors on every Bedrock call because the agent had changed the IAM role trust policy in a way that looked right but broke everything.</p>

<p>That was the day I stopped treating agent-written code like human-written code. And the day I started building a proper pre-merge checklist specifically for AI-generated PRs.</p>

<p>This post is that checklist. Twelve items, concrete commands, and real examples from my portfolio repo. I run every single one before merging any agent-written change. You should too.</p>

<img src="https://images.pexels.com/photos/34212963/pexels-photo-34212963.jpeg?auto=compress&cs=tinysrgb&h=650&w=940" alt="Developer reviewing code on screen with a checklist" />
<sub>Photo by <a href="https://www.pexels.com/@jakubzerdzicki">Jakub Zerdzicki</a> on <a href="https://www.pexels.com/photo/hands-writing-notes-for-coding-project-at-desk-34212963/">Pexels</a></sub>

<h2>Why Agent Code Needs a Different Review Process</h2>

<p>Human developers make mistakes too. But the mistakes are different. A human who writes a broken IAM policy usually knows the policy is broken and will flag it in the PR description. An agent has no such self-awareness.</p>

<p>Agents have several failure modes that humans do not:</p>

<ol>
<li><strong>Hallucinated dependencies.</strong> The agent imports a package that sounds plausible but does not exist. I have seen <code>aws-sdk-bedrock-runtime-agent</code> suggested in a PR. That package is not real. An agent made it up.</li>
<li><strong>Overly permissive IAM.</strong> Agents optimize for "does this work?" not "is this secure?" They tend to add <code>Resource: "*"</code> and <code>Action: "*"</code> because it unblocks the code. And they do it silently, in the middle of a 400-line diff.</li>
<li><strong>Confidence in wrong approaches.</strong> An agent will implement a deprecated API pattern with the same confidence it uses for a best-practice pattern. It does not know the difference.</li>
<li><strong>Silent regressions.</strong> The agent changes a line that looks unrelated. The change passes tests. But it breaks something subtle in production. I had an agent change the timeout on a Lambda function from 300 seconds to 30 seconds because "30 is a round number." The function handles long Bedrock calls. It started failing silently.</li>
</ol>

<p>These failures have a pattern. They are invisible to standard CI checks. Lint, typecheck, and unit tests pass because the code is syntactically valid. The problem is semantic.</p>

<p>So here is the checklist I use. Twelve items, arranged by priority. I run them in order, and I do not merge until all twelve pass.</p>

<img src="https://images.pexels.com/photos/6153351/pexels-photo-6153351.jpeg?auto=compress&cs=tinysrgb&h=650&w=940" alt="Robot and human comparing code side by side" />
<sub>Photo by <a href="https://www.pexels.com/@cottonbro">cottonbro studio</a> on <a href="https://www.pexels.com/photo/close-up-shot-of-fist-bump-6153351/">Pexels</a></sub>

<h2>Checklist Item 1: Terraform Plan Review (the Hard Way)</h2>

<p>The first thing I check on any agent-written PR that touches infrastructure is the Terraform plan output. Not the <code>.tf</code> file diff. The actual <code>terraform plan</code> output.</p>

<p>The diff lies. The plan tells the truth.</p>

<p>I run this command:</p>
<pre><code class="language-bash">cd infra/
terraform plan -no-color | grep -E '(\+|\\-|~|#)' | head -80</code></pre>

<p>What I look for:</p>

<p>Any <code>Resource: "*"</code> in IAM policies that was not there before. Agents love adding wildcards. I reject any PR that introduces a new wildcard IAM statement unless there is a documented exception.</p>

<p>Any resource deletion. Agents sometimes delete resources they think are "unused" without asking. I have caught an agent trying to delete a DynamoDB table that was referenced in three other repos.</p>

<p>Any count or for_each changes. Agents frequently change resource counts without understanding the blast radius.</p>

<p>Real example: An agent added a new IAM policy to allow Lambda to write to CloudWatch Logs. The policy looked reasonable. But the plan showed it also removed the existing <code>Deny</code> effect on deleting log groups. Merged together, the change would have allowed the Lambda function to delete log groups. The plan caught it. The PR did not.</p>

<img src="https://images.pexels.com/photos/34804011/pexels-photo-34804011.jpeg?auto=compress&cs=tinysrgb&h=650&w=940" alt="Terraform infrastructure code displayed on a laptop" />
<sub>Photo by <a href="https://www.pexels.com/@dkomov">Daniil Komov</a> on <a href="https://www.pexels.com/photo/reflection-in-a-laptop-screen-showing-code-34804011/">Pexels</a></sub>

<h2>Checklist Item 2: IAM Diff with iam-lint</h2>

<p>Terraform plan catches what changed. But it does not tell you whether the change is safe. For that, I use a simple script I wrote called <code>hrr_iam_lint</code>. It compares every IAM statement before and after the agent's change and flags patterns I never want to see.</p>

<p>The script checks for these patterns and marks them as FAIL:</p>

<ul>
<li><code>Action: "*"</code> combined with <code>Resource: "*"</code></li>
<li><code>Action: "iam:*"</code> on a resource that is not the account root</li>
<li><code>Effect: "Allow"</code> on <code>sts:AssumeRole</code> without a <code>Condition</code> block</li>
<li>A policy attached to a user instead of a role</li>
</ul>

<p>I run it like this:</p>
<pre><code class="language-bash">./scripts/hrr_iam_lint.sh infra/policies/</code></pre>

<p>If any check returns FAIL, the PR goes back to drafting. No exceptions.</p>

<p>The most common agent mistake I catch with this is attaching policies directly to IAM users instead of roles. Agents seem to prefer the simpler path even though roles are the AWS best practice.</p>

<img src="https://images.pexels.com/photos/11035543/pexels-photo-11035543.jpeg?auto=compress&cs=tinysrgb&h=650&w=940" alt="Security shield protecting infrastructure code" />
<sub>Photo by <a href="https://www.pexels.com/@realtoughcandy">RealToughCandy.com</a> on <a href="https://www.pexels.com/photo/hand-holding-shield-shaped-red-sticker-11035543/">Pexels</a></sub>

<h2>Checklist Item 3: Infrastructure Security Scan with Checkov</h2>

<p>I run Checkov on every agent-written PR. Not just on the changed files, but on the entire Terraform directory. Agents sometimes add insecure defaults to unrelated resources.</p>

<pre><code class="language-bash">checkov -d infra/ --quiet --compact \
  --skip-check CKV_AWS_272,CKV_AWS_273 \
  | grep -E '(FAIL|ERROR)' | head -30</code></pre>

<p>I skip CKV_AWS_272 and CKV_AWS_273 because those are false positives for my setup. Everything else gets reviewed.</p>

<p>What I look for:</p>

<p>Any high-severity finding that the agent introduced. Medium and low findings are acceptable if there is a documented reason. High findings block the merge.</p>

<p>The agent that tried to deploy an S3 bucket without encryption is a classic. Checkov flagged it immediately. The agent had written the bucket resource and simply forgot the <code>server_side_encryption_configuration</code> block. A human would probably have caught it too. But the agent did it because it was following a minimal example from a tutorial.</p>

<p>Checkov catches these automatically. I do not even need to think about it.</p>

<img src="https://images.pexels.com/photos/5380792/pexels-photo-5380792.jpeg?auto=compress&cs=tinysrgb&h=650&w=940" alt="Security scan results showing pass and fail checks" />
<sub>Photo by <a href="https://www.pexels.com/@tima-miroshnichenko">Tima Miroshnichenko</a> on <a href="https://www.pexels.com/photo/close-up-view-of-system-hacking-5380792/">Pexels</a></sub>

<h2>Checklist Item 4: Dependency Audit</h2>

<p>Agents add dependencies liberally. They import packages, add npm modules, and reference GitHub Actions that you have never heard of. I audit every new dependency that an agent introduces.</p>

<p>For Node.js:</p>
<pre><code class="language-bash">npm audit --json | jq '.vulnerabilities | keys'</code></pre>

<p>For Python:</p>
<pre><code class="language-bash">pip-audit --desc | grep -E '(HIGH|CRITICAL)'</code></pre>

<p>For GitHub Actions:</p>
<pre><code class="language-bash">grep -r 'uses:' .github/workflows/ | grep -v '@v[0-9]' | grep -v '/'</code></pre>

<p>But the audit goes beyond security. I also check:</p>

<p>Did the agent add a package that already exists in the project? Agents frequently add a second HTTP client library because they did not check <code>package.json</code> first. I have seen <code>axios</code>, <code>got</code>, <code>node-fetch</code>, and <code>undici</code> all imported in the same PR by an agent that kept rewriting the same function.</p>

<p>Did the agent pin a version or use a range? I reject any PR that introduces an unpinned dependency. <code>^1.0.0</code> is not acceptable for production infrastructure code.</p>

<p>Did the agent import a package that does not exist yet? This is harder to catch. I run the build and check for npm warnings. But the real defense is knowing that agents hallucinate package names and always running the full dependency install before review.</p>

<img src="https://images.pexels.com/photos/10325707/pexels-photo-10325707.png?auto=compress&cs=tinysrgb&h=650&w=940" alt="Network visualization of package dependencies" />
<sub>Photo by <a href="https://www.pexels.com/@lucasdc">U.Lucas Dube-Cantin</a> on <a href="https://www.pexels.com/photo/abstract-orange-lights-10325707/">Pexels</a></sub>

<h2>Checklist Item 5: AI Detection on Doc Strings</h2>

<p>This one is specific to AI-generated PRs. Agents write code with verbose, overly formal doc strings. They sound like a textbook. And the problem is not aesthetic. Overly formal doc strings make the codebase harder to scan because every block of text looks the same.</p>

<p>I run a simple check on any new or modified doc strings in the PR:</p>

<pre><code class="language-bash">grep -r 'Parameters:|Returns:|Raises:' src/ | grep -v '__pycache__'</code></pre>

<p>If I see the Google-style doc string format (Parameters, Returns, Raises on their own lines) I know an agent wrote it. I flag it for a human rewrite.</p>

<p>This is not just style. The verbose doc strings trigger AI detection tools when the codebase is used as context for other agents. I want the codebase to stay clean and human-sounding.</p>

<p>The rule is simple: doc strings should explain <em>why</em> not <em>what</em>. The code explains what. If the agent wrote a doc string that reads like a Java tutorial, I replace it with a one-liner.</p>

<img src="https://images.pexels.com/photos/34804017/pexels-photo-34804017.jpeg?auto=compress&cs=tinysrgb&h=650&w=940" alt="Chatbot interface alongside a code editor" />
<sub>Photo by <a href="https://www.pexels.com/@dkomov">Daniil Komov</a> on <a href="https://www.pexels.com/photo/close-up-of-computer-screen-with-code-and-menu-options-34804017/">Pexels</a></sub>

<h2>Checklist Item 6: Eval Harness for LLM-Touching Code</h2>

<p>If the PR changes any code that makes LLM calls (Bedrock, OpenAI, Anthropic), I run the eval harness. This is not optional.</p>

<p>My eval harness is simple. It takes a set of known inputs, runs them through the new code, and checks that the outputs match expected values. The inputs are real customer requests that have been sanitized.</p>

<pre><code class="language-bash">npx tsx src/evals/run.ts --changed-only \
  --diff-baseline main \
  --output /tmp/eval-report.json</code></pre>

<p>What I look for:</p>

<p>Any regression in output quality. An agent might change a prompt to make it faster. That is good. But it might also change the prompt in a way that loses accuracy for edge cases. The eval harness catches this.</p>

<p>Any increase in token usage. Agents sometimes add extra context to prompts without understanding the cost impact. A 20 percent token increase means a 20 percent cost increase. That needs a documented reason.</p>

<p>The most common eval failure I see is an agent "optimizing" a prompt by removing instructions it considers redundant. The eval then shows a 15 percent drop in accuracy for the most common input type. The agent saved 50 tokens per call and lost accuracy. Not a good trade.</p>

<img src="https://images.pexels.com/photos/17483874/pexels-photo-17483874.png?auto=compress&cs=tinysrgb&h=650&w=940" alt="AI neural network evaluation dashboard showing metrics" />
<sub>Photo by <a href="https://www.pexels.com/@googledeepmind">Google DeepMind</a> on <a href="https://www.pexels.com/photo/an-artist-s-illustration-of-artificial-intelligence-ai-this-image-was-inspired-by-neural-networks-used-in-deep-learning-it-was-created-by-novoto-studio-as-part-of-the-visualising-ai-pr-17483874/">Pexels</a></sub>

<h2>Checklist Item 7: Manual Smoke Test Against Staging</h2>

<p>CI tests run. CI tests pass. But CI tests only cover what you thought to test. The agent might have broken something that no test covers.</p>

<p>I run one manual smoke test on staging before any agent-written PR gets merged:</p>

<ol>
<li>Deploy the agent's branch to staging</li>
<li>Hit the main user-facing endpoint</li>
<li>Check that the response is valid</li>
<li>Check CloudWatch logs for unexpected errors</li>
<li>Check the Lambda cold start and duration metrics</li>
</ol>

<p>The whole thing takes five minutes. But it catches things that automated tests miss.</p>

<p>I once had an agent change the <code>content-type</code> header in an API Gateway response from <code>application/json</code> to <code>text/plain</code>. All automated tests passed because they checked the status code and the body structure, not the content type. The manual smoke test caught it immediately because the frontend displayed raw JSON instead of parsed data.</p>

<p>The smoke test is fast. It is not comprehensive. But it is the last line of defense before the code hits production.</p>

<img src="https://images.pexels.com/photos/12969403/pexels-photo-12969403.jpeg?auto=compress&cs=tinysrgb&h=650&w=940" alt="Server deployment dashboard with health metrics" />
<sub>Photo by <a href="https://www.pexels.com/@freestockpro">Atlantic Ambience</a> on <a href="https://www.pexels.com/photo/close-up-shot-of-a-laptop-computer-12969403/">Pexels</a></sub>

<h2>Checklist Item 8: Diff Size Check</h2>

<p>This is the simplest check on the list. If an agent-written PR changes more than 20 files, I do not merge it until it is broken into smaller PRs.</p>

<p>Agents have no sense of scope. They will refactor three unrelated systems in the same PR because the prompt said "make this better." And they do this without asking whether each change is in scope.</p>

<p>I run:</p>
<pre><code class="language-bash">git diff main HEAD --stat | tail -1</code></pre>

<p>If the line count is over 500 or the file count is over 20, the PR goes back for splitting. No exceptions.</p>

<p>The reason is not just reviewability. It is safety. A 500-line agent-written diff has a much higher defect density than a 50-line one. I have seen this empirically. The first 100 lines are usually solid. The next 200 are a mixed bag. Everything after line 300 is where the hallucinations start.</p>

<p>Keep agent PRs small. Review them carefully. Deploy them fast.</p>

<img src="https://images.pexels.com/photos/34803968/pexels-photo-34803968.jpeg?auto=compress&cs=tinysrgb&h=650&w=940" alt="Git merge conflict resolution interface" />
<sub>Photo by <a href="https://www.pexels.com/@dkomov">Daniil Komov</a> on <a href="https://www.pexels.com/photo/programming-code-editors-on-computer-screen-34803968/">Pexels</a></sub>

<h2>Checklist Item 9: Structured Logging and Telemetry</h2>

<p>Agents write code, but they rarely add logging. If the PR adds a new Lambda function or API endpoint, I check whether it includes structured logging.</p>

<p>I look for:</p>

<pre><code class="language-javascript">console.log(JSON.stringify({ event: "lambda_start", requestId, timestamp }))</code></pre>

<p>Not:</p>
<pre><code class="language-javascript">console.log("Function started")</code></pre>

<p>The structured log entry is 30 characters longer. It saves hours of debugging because you can query it in CloudWatch Logs Insights.</p>

<p>I also check that the agent added a metric for the new code path. A simple <code>mono_metric</code> call for latency, error count, and invocation count is enough. Without it, you are flying blind on the new code.</p>

<p>The agent that added a new API endpoint without any logging at all is my favorite example. The endpoint worked. But when it started failing under load, there was no way to tell why. CloudWatch showed errors but no context. I added the logging myself, found the bug, fixed it, and then added this check to the list.</p>

<img src="https://images.pexels.com/photos/5380618/pexels-photo-5380618.jpeg?auto=compress&cs=tinysrgb&h=650&w=940" alt="Server logs and monitoring metrics on a dashboard" />
<sub>Photo by <a href="https://www.pexels.com/@tima-miroshnichenko">Tima Miroshnichenko</a> on <a href="https://www.pexels.com/photo/close-up-view-of-system-hacking-5380618/">Pexels</a></sub>

<h2>Checklist Item 10: Hardcoded Secrets Scan</h2>

<p>Agents love hardcoding API keys. Not because they think it is a good practice. Because the example in their training data hardcodes the key.</p>

<p>I run Gitleaks on every agent-written PR:</p>
<pre><code class="language-bash">gitleaks detect --source . --verbose --redact | grep -E '(\+|\\-)'</code></pre>

<p>If Gitleaks finds anything, the PR is blocked. But I also look for a subtler pattern: the agent adding a <code>.env.example</code> file with real-looking placeholder values.</p>

<p>I had an agent add a <code>.env.example</code> with <code>AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE</code>. That is a well-known test key, and Gitleaks did not flag it because it is intentionally public. But the agent also added <code>BEDROCK_API_KEY=sk-test-abcdef123456</code>. Not a real key. But close enough to a real key format that a developer might accidentally use it in staging.</p>

<p>The rule: any file that contains what looks like a credential gets reviewed by a human. No exceptions.</p>

<img src="https://images.pexels.com/photos/36740854/pexels-photo-36740854.jpeg?auto=compress&cs=tinysrgb&h=650&w=940" alt="Cybersecurity concept with lock and key" />
<sub>Photo by <a href="https://www.pexels.com/@nathanthomas">Nathan Thomas</a> on <a href="https://www.pexels.com/photo/close-up-of-hand-holding-a-secure-padlock-36740854/">Pexels</a></sub>

<h2>Checklist Item 11: Human Code Review (This Is Not Optional)</h2>

<p>None of the automated checks replace a human reading the diff. The twelve items above are filters. They catch the common failures. But a human reviewer catches the uncommon ones.</p>

<p>I read the entire diff of every agent-written PR. Not a skim. A line-by-line read. And I look for things that the automated checks cannot catch:</p>

<p>Does this change make the codebase harder to understand? An agent might introduce a clever abstraction that saves three lines but makes the flow incomprehensible.</p>

<p>Does this change introduce coupling that did not exist before? An agent might wire two services together in a way that looks efficient but creates a dependency cycle.</p>

<p>Is the error handling consistent with the rest of the codebase? Agents handle errors differently in every function. I check that new code uses the same error patterns as the existing code.</p>

<p>The human review takes the longest. It is also the most valuable check on this list. Do not skip it just because the automated checks passed.</p>

<img src="https://images.pexels.com/photos/3861951/pexels-photo-3861951.jpeg?auto=compress&cs=tinysrgb&h=650&w=940" alt="Two developers reviewing code on large monitors" />
<sub>Photo by <a href="https://www.pexels.com/@thisisengineering">ThisIsEngineering</a> on <a href="https://www.pexels.com/photo/female-software-engineer-coding-on-computer-3861951/">Pexels</a></sub>

<h2>Checklist Item 12: Deploy to Staging First, Watch for 30 Minutes</h2>

<p>The last check happens after the merge. I deploy to staging. And then I watch.</p>

<p>For 30 minutes I check:</p>

<ul>
<li>Error rate in CloudWatch (should be zero or near zero)</li>
<li>P99 latency (should not increase by more than 10 percent)</li>
<li>Lambda invocation count (should match expected traffic)</li>
<li>Any new log entries at ERROR level</li>
<li>Any unexpected cost changes in the staging billing dashboard</li>
</ul>

<p>If any of these metrics look wrong, I roll back. Not investigate first. Roll back first, investigate second. The staging environment has real data and the rollback takes two minutes.</p>

<p>This saved me once already. An agent-optimized Lambda function reduced cold start time by 40 percent. Great. But it also introduced a memory leak that showed up after 15 minutes of sustained traffic. The 30-minute watch caught it before production users were affected. I rolled back, fixed the leak, and deployed again.</p>

<p>The 30-minute watch is the cheapest insurance you will ever buy.</p>

<img src="https://images.pexels.com/photos/7948032/pexels-photo-7948032.jpeg?auto=compress&cs=tinysrgb&h=650&w=940" alt="CloudWatch monitoring dashboard showing cloud metrics" />
<sub>Photo by <a href="https://www.pexels.com/@rdne">RDNE Stock project</a> on <a href="https://www.pexels.com/photo/black-and-white-computer-keyboard-7948032/">Pexels</a></sub>

<h2>The Checklist in Practice</h2>

<p>Here is how I run the entire thing:</p>

<pre><code class="language-bash"># 1. Terraform plan
cd infra && terraform plan -no-color | grep -E '(\+|\\-|~|#)' | head -80

# 2. IAM lint
./scripts/hrr_iam_lint.sh infra/policies/

# 3. Security scan
checkov -d infra/ --quiet --compact | grep -E '(FAIL|ERROR)' | head -30

# 4. Dependency audit
npm audit --json | jq '.vulnerabilities | keys'
grep -r 'uses:' .github/workflows/ | grep -v '@v[0-9]'

# 5. Doc string check
grep -r 'Parameters:|Returns:|Raises:' src/

# 6. Eval harness
npx tsx src/evals/run.ts --changed-only --diff-baseline main

# 7. Manual smoke test
# Deploy to staging, hit endpoint, check logs

# 8. Diff size
git diff main HEAD --stat | tail -1

# 9. Structured logging
grep -r 'console.log(' src/ --include='*.{ts,js,py}' | grep -v 'JSON.stringify'

# 10. Secrets scan
gitleaks detect --source . --verbose --redact | grep -E '(\+|\\-)'

# 11. Human code review
git diff main HEAD | less

# 12. Deploy to staging, watch 30 min</code></pre>

<p>The whole thing takes me about 45 minutes for a medium PR. That sounds like a lot. But it has saved me from at least a dozen production incidents in the last three months.</p>

<p>You do not need to do all twelve every time. Start with items 1, 2, 3, and 10. Those catch the most common and most dangerous failures. Add the rest as you find gaps in your process.</p>

<p>The key insight is simple. AI coding agents are incredible tools. But they are not human engineers. They need a different review process. One that accounts for their specific failure modes: wildcard IAM, hallucinated dependencies, overly permissive defaults, and silent regressions.</p>

<p>Build the checklist. Run it every time. Your production environment will thank you.</p>

<p>Hope you enjoyed this. If you have a checklist item I missed, I would love to hear about it. Find me on X at https://x.com/HarunRRayhan and let me know.</p>

<img src="https://images.pexels.com/photos/5474295/pexels-photo-5474295.jpeg?auto=compress&cs=tinysrgb&h=650&w=940" alt="Developer typing a checklist on a laptop" />
<sub>Photo by <a href="https://www.pexels.com/@cottonbro">cottonbro studio</a> on <a href="https://www.pexels.com/photo/hands-on-a-laptop-keyboard-5474295/">Pexels</a></sub>
