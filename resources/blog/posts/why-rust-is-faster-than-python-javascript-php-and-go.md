---
title: "Why Rust Finishes That Loop Before Python, PHP, JavaScript, and Go"
slug: "why-rust-is-faster-than-python-javascript-php-and-go"
brief: "Five colored balls cross left to right at stock-runtime speed vs CPython. Python is 1×. The slider only speeds up the picture."
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

<p>This figure is a model, not a timing run from my laptop. Each ball moves left to right at a relative speed taken from stock runtimes on a CPU-bound n-body workload in the Computer Language Benchmarks Game: CPython, PHP CLI, Node, Go, and a release Rust binary. No web framework. No extra library stack. Python is 1×. The race starts when the block is on screen. The slider only speeds up the picture.</p>

<div data-blog-activity="language-race"></div>

<h2>What the model is measuring</h2>

<p>One numeric loop in memory. No disk. No HTTP. No database. Ball speed is throughput compared with CPython.</p>

<table>
<thead>
<tr>
<th>Language</th>
<th>Relative speed vs Python</th>
</tr>
</thead>
<tbody>
<tr>
<td>Python</td>
<td>1×</td>
</tr>
<tr>
<td>PHP</td>
<td>~1.8×</td>
</tr>
<tr>
<td>JavaScript (Node)</td>
<td>~40×</td>
</tr>
<tr>
<td>Go</td>
<td>~53×</td>
</tr>
<tr>
<td>Rust</td>
<td>~68×</td>
</tr>
</tbody>
</table>

<p>Those are rounded from plain-ish n-body wall times (Python ~372s, PHP ~204s, Node ~9s, Go ~7s, Rust ~5.5s). If your real work waits on Postgres, this chart is the wrong tool. The socket wins.</p>

<h2>Why the slow balls stay slow on this workload</h2>

<p>CPython and the PHP CLI run the loop through their default interpreters. A tight arithmetic loop pays that cost on every pass. That is why they sit near 1× and ~1.8× here. Both are still the right tool for a script you run once and throw away.</p>

<h2>Why Node sits in the middle</h2>

<p>Stock Node is still a managed runtime. On this kind of numeric loop it lands far ahead of the interpreters and behind the compiled binaries. The figure uses that default Node process, not a hand-tuned native addon.</p>

<h2>Why Go and Rust pull ahead</h2>

<p>Go and Rust ship a compiled binary for the loop. On this CPU-bound work they cross first. Rust edges Go in the n-body numbers this model uses. That gap is real for this workload and still small next to the jump from Python to either of them.</p>

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
