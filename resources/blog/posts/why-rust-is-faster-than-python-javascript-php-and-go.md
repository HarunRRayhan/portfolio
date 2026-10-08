---
title: "Why Rust Finishes That Loop Before Python, PHP, JavaScript, and Go"
slug: "why-rust-is-faster-than-python-javascript-php-and-go"
brief: "A five-lane model of one small CPU loop. Logos, costs, and a fixed finish order. Speed changes the picture, not who wins."
publishedAt: "2099-06-01T18:00:00.000Z"
draft: true
draftToken: "deae83e5dc92e2055cd6b8e8b40d2ada"
readTimeInMinutes: 10
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

<p>This figure is a model, not a timing run from my laptop. Each lane counts, allocates, and hashes. The race starts when the block is on screen. Speed only changes how fast the picture moves. It does not change who finishes first.</p>

<div data-blog-activity="language-race"></div>

<h2>What the model is measuring</h2>

<p>The workload is intentionally tiny and CPU-bound: a tight loop that does arithmetic, builds short-lived values, and hashes. No disk. No HTTP. No database. That is the only place this ranking is honest.</p>

<table>
<thead>
<tr>
<th>Lane</th>
<th>Where the time goes in this model</th>
<th>Finish</th>
</tr>
</thead>
<tbody>
<tr>
<td>Python</td>
<td>Interpreter reads opcodes as it runs</td>
<td>#5</td>
</tr>
<tr>
<td>PHP</td>
<td>Interpreter, same class of loop tax</td>
<td>#4</td>
</tr>
<tr>
<td>JavaScript</td>
<td>JIT speeds the hot loop after warmup; allocation still costs</td>
<td>#3</td>
</tr>
<tr>
<td>Go</td>
<td>Compiled binary, then GC scans what the loop allocated</td>
<td>#2</td>
</tr>
<tr>
<td>Rust</td>
<td>Compiled binary; this loop does not pause for a collector</td>
<td>#1</td>
</tr>
</tbody>
</table>

<p>If your real program waits on Postgres, this chart is the wrong tool. The socket wins. The language debate is theatre until the hot path is actually CPU in memory.</p>

<h2>Python and PHP walk the program while they run it</h2>

<p>CPython and the PHP interpreter read the opcodes as they go. A tight loop pays that cost on every iteration. That is the long part of those two lanes. It is also why a script that runs once, reads a file, and exits is a fine job for either of them. You are not in that loop a million times.</p>

<h2>JavaScript gets faster after the JIT has seen the loop</h2>

<p>V8 and the other engines watch a hot function and compile it. The first passes are slower. The later passes are closer to compiled code. Allocation and garbage collection still show up if the loop builds objects on every iteration. The lane finishes ahead of the interpreters and behind Go and Rust.</p>

<h2>Go compiles, then the collector still has work</h2>

<p>Go builds a binary. You do not pay an interpreter on each iteration. If the loop allocates, the garbage collector has to scan that memory. On a short CPU-bound function that is the gap between the Go lane and the Rust lane in this model.</p>

<h2>Rust does not stop to collect this loop</h2>

<p>Rust compiles ahead of time. Ownership is checked when you build, so this workload does not pause later for a collector. The cost moved to the compiler and to the time you spend satisfying the borrow checker. The binary does less at runtime.</p>

<p>That is the whole picture for this kind of loop. It is not a claim that a Rust HTTP handler is faster than a Go one when both are waiting on Postgres.</p>

<h2>When the chart lies</h2>

<p>Three cases where the figure should not decide the stack:</p>

<ul>
  <li><strong>I/O bound work.</strong> Network, disk, and locks dominate. A faster loop language does not move the p99.</li>
  <li><strong>One-shot scripts.</strong> A migration you run once finishes in Python before I have a Rust project compiling.</li>
  <li><strong>Team fit.</strong> If nobody wants a borrow checker in review, Go or JavaScript will ship the service, and the micro-loop inside it is rarely the thing on fire.</li>
</ul>

<p>I reach for Rust when the same CPU loop sits on the hot path, the data is in memory, and I can afford the compile. I do not reach for it to win a screenshot.</p>

<p>Hope you enjoyed this one. If you've got a loop that is actually hot, find me on X at <a href="https://x.com/harundotdev" target="_blank" rel="noopener noreferrer">https://x.com/harundotdev</a>, and grab every other link from my bio at <a href="https://harun.dev/bio" target="_blank" rel="noopener noreferrer">https://harun.dev/bio</a>.</p>
