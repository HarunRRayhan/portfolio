---
title: "Your Agent Is Only as Good as Your Codebase"
slug: "your-agent-is-only-as-good-as-your-codebase"
brief: "Coding agents copy what they find. In a tangled repo they copy the tangle. Here's why structure changes what an agent writes, and what RayStack's new dev-refactor skill does about it."
publishedAt: "2026-11-06T06:25:00.000Z"
readTimeInMinutes: 7
coverImageUrl: "/blog-assets/your-agent-is-only-as-good-as-your-codebase/cover.jpg"
reactionCount: 0
responseCount: 0
replyCount: 0
tags:
  - name: AI
    slug: ai
  - name: Refactoring
    slug: refactoring
  - name: Claude Code
    slug: claude-code
  - name: Testing
    slug: testing
---

<p>Picture an agent fixing a bug in one place. The same logic lives in two other files. It doesn't know, so it doesn't touch them, and the bug stays alive in two out of three code paths.</p>

<p>That's not the agent being dumb. It read the file I pointed at, found the logic, fixed it, and ran the tests. The tests passed because nothing tested the other two copies. The codebase lied to it, and it believed the codebase.</p>

<p>That's the whole argument of this post. Agents copy what they find. Give them a clean repo and they write clean code. Give them a tangled one and they write more tangle, faster than you ever could.</p>

<h2>Why structure changes what an agent writes</h2>

<p>A human who has lived in a repo for a year carries a map in their head. They know the tax logic is copied in <code>checkout/</code> and <code>invoices/</code>. They know you have to call <code>init()</code> before <code>load()</code>. An agent starts every session without that map. It only has what it can read.</p>

<p>So every hidden link in your code turns into a trap:</p>

<ul>
  <li><strong>Duplicated logic</strong> means the agent fixes one copy and ships.</li>
  <li><strong>A call order callers just have to know</strong> means it calls them in the wrong order, and nothing tells it.</li>
  <li><strong>An <code>if</code> for one special value</strong> looks like a pattern, so the agent adds a second one next to it for the next special value.</li>
  <li><strong>A module with no tests</strong> means the agent can change its behaviour and stay green.</li>
</ul>

<p>It costs more, too. Not in money, in context. When one change has to land in five files, the agent has to find all five, read them, and keep them in its head at once. When the change lands in one place, it reads one file. Less to read means less to get wrong, and more room left in the context window for the actual task.</p>

<p>Fixing the codebase is the cheapest way to make an agent better. Better prompts won't fix a repo that hides its own rules.</p>

<h2>What dev-refactor does</h2>

<p><a href="https://harun.dev/raystack" target="_blank" rel="noopener noreferrer">RayStack</a> 1.3.0 ships a new skill called <code>dev-refactor</code>. You run it with <code>/raystack project refactor</code>, or the new short alias <code>/rs refactor</code>. It refactors a whole repo, or one area of it, without changing what the code does. The order never changes.</p>

<p><strong>1. It asks two things.</strong> Scope first: the whole repo or one folder (it offers the folders it found). Then two optional extras: strip comments that only restate the code, and remove tests that can't catch a bug.</p>

<p><strong>2. It names the architecture you already have.</strong> MVC, layered, hexagonal, feature folders, framework default. It writes down the pattern and the evidence, then refactors inside it. If the pattern itself is the problem, it says so and points you to <code>dev-migrate</code>. Switching architecture is a different job, and it won't sneak one in.</p>

<p><strong>3. Safety net before any change.</strong> It finds the test runner, runs the whole suite, and records the result as a baseline. A red baseline stops the run and asks you what to do. Then, for every module it plans to touch that has no tests, it writes characterisation tests that pin today's behaviour, odd cases and errors included. Those go in their own commit, before a single line of refactor.</p>

<p><strong>4. It lists every problem, and changes nothing yet.</strong> The list goes to <code>docs/refactor/YYYY-MM-DD-log.md</code>, one line per problem with <code>file:line</code>. It looks for hidden links, needless links (callers poking at internals, shallow wrappers), surplus code, and special cases. DRY counts only when the copies change for the same reason. Two lookalikes that change for different reasons stay apart. SOLID counts as far as it pays: no interface with one implementation, no extension point nobody uses.</p>

<p><strong>5. Redesign.</strong> It works out the fixes as if today's requirements had been known from day one, and writes each fix above the problems it solves. One good fix usually kills three or four lines of the list.</p>

<p><strong>6. Small commits.</strong> One fix group per commit, suite green after each. A red run gets fixed or reverted before the next step. It never weakens a test, raises a timeout, or adds a suppression to get green.</p>

<p><strong>7. A fresh reviewer.</strong> A new read-only subagent gets the log, the diff and the problem lenses, and hunts for what's left. Real findings get fixed, then another fresh reviewer goes again. It stops when the reviewer finds nothing worth fixing.</p>

<p><strong>8. Ship.</strong> PR, self-review, green CI, merge. The log records the PR and the before and after counts.</p>

<p>The change-together idea in step 4 (copies only count as duplication when they change for the same reason) comes from caldoai's <a href="https://github.com/caldoai/skills/blob/main/skills/untangle-codebase/SKILL.md" target="_blank" rel="noopener noreferrer">untangle-codebase</a> skill, which is MIT licensed. It's the rule that stops DRY from turning into a pile of shared helpers nobody can change safely.</p>

<h2>A small trial, with real numbers</h2>

<p>I built a tiny Node repo with a mess planted in it on purpose. Three modules, one test, the usual sins. Then I ran <code>/rs refactor</code> on it.</p>

<table>
  <thead>
    <tr><th>Measure</th><th>Before</th><th>After</th></tr>
  </thead>
  <tbody>
    <tr><td>Special cases (an <code>if</code> on one value)</td><td>10</td><td>1</td></tr>
    <tr><td>Duplicated blocks</td><td>3</td><td>0</td></tr>
    <tr><td>Modules without tests</td><td>2 of 3</td><td>0 of 4</td></tr>
    <tr><td>Tests</td><td>1</td><td>28</td></tr>
  </tbody>
</table>

<p>Old and new code gave identical output on 132,022 generated inputs.</p>

<p>The interesting part was the first reviewer. It caught a behaviour change that all 28 new tests missed. The old code compared a rule's country with a plain equality check. The refactor normalised it into a list lookup, roughly like this:</p>

<pre><code class="language-javascript">// before
if (rule.country === order.country) { /* ... */ }

// after (first pass)
if ([rule.country].flat().includes(order.country)) { /* ... */ }</code></pre>

<p>Looks the same. It isn't. A rule with <code>country: [&#039;US&#039;]</code> was rejected by the old code and matched by the new one. No test fed it an array, so the suite stayed green. The reviewer read the diff with fresh eyes and flagged it. The fix went in, a second fresh reviewer found nothing, and the run ended.</p>

<p>That's why step 7 exists. Tests you write while refactoring share the blind spots of the person (or agent) doing the refactor. A reviewer that didn't write any of it doesn't.</p>

<p>It also kept one special case on purpose: a single <code>if</code> for the <code>HALF</code> coupon. That's a real business rule, not a missed abstraction. Building a coupon strategy system around one coupon would be the exact surplus step 4 is meant to catch.</p>

<p>Now the honest part. This was a small fixture I wrote myself, with problems I planted. It shows the steps work in order and that the reviewer catches real things. It doesn't prove anything about your 400,000-line monolith. Run it on one folder first and read the log before you trust it with the whole repo.</p>

<h2>Try it</h2>

<p>Install RayStack for every coding agent on your machine with one line:</p>

<pre><code class="language-bash">curl -fsSL https://raw.githubusercontent.com/HarunRRayhan/RayStack/main/get.sh | bash</code></pre>

<p>Then open your agent in the repo and run:</p>

<pre><code class="language-bash">/raystack project refactor</code></pre>

<p>Or <code>/rs refactor</code> if you're as lazy as I am. Other install options (one agent, one project, plugins) are in the <a href="https://github.com/HarunRRayhan/RayStack" target="_blank" rel="noopener noreferrer">README</a>.</p>

<p>Hope you enjoyed this one. If you run it on a real codebase, I'd like to see what the log found.</p>

<p>Find me on X at <a href="https://x.com/harundotdev" target="_blank" rel="noopener noreferrer">https://x.com/harundotdev</a>, and grab every other link from my bio at <a href="https://harun.dev/bio" target="_blank" rel="noopener noreferrer">https://harun.dev/bio</a>.</p>
