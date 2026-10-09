---
title: "Why Rust Finishes That Loop Before Python, PHP, JavaScript, and Go"
slug: "why-rust-is-faster-than-python-javascript-php-and-go"
brief: "Five balls bounce left and right at language speed. 1x is a crawl. Slide to 400x to make Rust blur."
publishedAt: "2099-06-01T18:00:00.000Z"
draft: true
draftToken: "deae83e5dc92e2055cd6b8e8b40d2ada"
readTimeInMinutes: 9
coverImageUrl: "/blog-assets/why-rust-is-faster-than-python-javascript-php-and-go/cover.jpg"
reactionCount: 0
responseCount: 0
replyCount: 0
tags:
  - name: Rust
    slug: rust
  - name: Software Engineering
    slug: software-engineering
---

<p>The clip is always the same shape. Five terminals, one loop, Rust prints the time first, and the caption says "100x". The clip never says what the loop did, or whether the program was waiting on a socket the whole time.</p>

<p>This figure is a model, not a timing run from my laptop. Each ball runs left to right, then back left again, forever, at a relative speed taken from a public CPU benchmark. At 1× it is a crawl on purpose. Slide toward 400× when you want Rust to look unfairly fast. The slider does not change the language ratios. No web framework. No extra library stack. The race starts when the block is on screen.</p>

<div data-blog-activity="language-race"></div>

<h2>What the model is measuring</h2>

<p>One CPU-bound numeric loop in memory. No disk. No HTTP. No database. Python is the 1× baseline. The ratios are rounded speedups from the <a href="https://benchmarksgame-team.pages.debian.net/benchmarksgame/performance/nbody.html" target="_blank" rel="noopener noreferrer">Computer Language Benchmarks Game n-body</a> task: best elapsed time for each language divided into Python’s best elapsed time on the same machine.</p>

<table>
<thead>
<tr>
<th>Language</th>
<th>n-body (secs)</th>
<th>Relative speed</th>
</tr>
</thead>
<tbody>
<tr>
<td>Python 3</td>
<td>372.41</td>
<td>1×</td>
</tr>
<tr>
<td>PHP #3</td>
<td>204.10</td>
<td>1.8×</td>
</tr>
<tr>
<td>Node.js #6</td>
<td>8.55</td>
<td>44×</td>
</tr>
<tr>
<td>Go #3</td>
<td>6.39</td>
<td>58×</td>
</tr>
<tr>
<td>Rust #3</td>
<td>3.46</td>
<td>108×</td>
</tr>
</tbody>
</table>

<p>That is why Go is not “25× Python” here. On this task it is about 58×. Node’s JIT lands near Go (44×), not next to PHP. PHP only edges Python (~1.8×). Rust #3 (without the SIMD-flagged entries) is about 108× Python, roughly 1.9× Go. If your real work waits on Postgres, this chart is the wrong tool. The socket wins.</p>

<h2>Why PHP stays near Python</h2>

<p>Both are still doing the float loop through a managed runtime. PHP 8 is faster than CPython on this task, but not by a compiled-binary margin. That is why those two balls stay close.</p>

<h2>Why Node sits near Go</h2>

<p>V8’s JIT turns a hot numeric loop into something that races a Go binary. That surprises people who only compare cold scripts. It is what the n-body numbers show. A short script that never warms up will not look like this.</p>

<h2>Why Rust still wins the loop</h2>

<p>Rust ships a compiled binary with no GC pauses on this path. On n-body it finishes ahead of Go and Node. A SIMD-heavy Rust entry on the same page is even faster; this figure uses the plain Rust #3 timing so the claim stays conservative.</p>

<p>None of that says a Rust HTTP handler beats a Go one when both wait on the same database.</p>

<h2>When the chart lies</h2>

<p>Three cases where the figure should not decide the stack:</p>

<ul>
  <li><strong>I/O bound work.</strong> Network, disk, and locks dominate. A faster loop language does not move the p99.</li>
  <li><strong>One-shot scripts.</strong> A migration you run once finishes in Python before I have a Rust project compiling.</li>
  <li><strong>Team fit.</strong> If nobody wants a borrow checker in review, Go or JavaScript will ship the service, and the micro-loop inside it is rarely the thing on fire.</li>
</ul>

<p>I reach for Rust when the same CPU loop sits on the hot path, the data is in memory, and I can afford the compile. I do not reach for it to win a screenshot.</p>

<p>Hope you enjoyed this one. If you've got a loop that is actually hot, find me on X at <a href="https://x.com/harundotdev" target="_blank" rel="noopener noreferrer">https://x.com/harundotdev</a>, and grab every other link from my bio at <a href="https://harun.dev/bio" target="_blank" rel="noopener noreferrer">https://harun.dev/bio</a>.</p>
