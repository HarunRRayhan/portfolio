---
title: "Why Rust Finishes That Loop Before Python, PHP, JavaScript, and Go"
slug: "why-rust-is-faster-than-python-javascript-php-and-go"
brief: "Five balls bounce left and right at language speed. 1x is very slow. The slider only speeds up the animation."
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

<p>This figure is a model, not a timing run from my laptop. Each ball bounces left and right at a relative speed. At 1× it is very slow on purpose so you can see the gap. The slider only speeds up the animation. It does not change the ratios. No web framework. No extra library stack. The race starts when the block is on screen.</p>

<div data-blog-activity="language-race"></div>

<h2>What the model is measuring</h2>

<p>One CPU-bound loop in memory. No disk. No HTTP. No database. Python is the 1× baseline. The others are how much faster that same class of work feels on stock runtimes, not a claim about every app you will ship.</p>

<table>
<thead>
<tr>
<th>Language</th>
<th>Relative speed</th>
</tr>
</thead>
<tbody>
<tr>
<td>Python</td>
<td>1×</td>
</tr>
<tr>
<td>PHP</td>
<td>2×</td>
</tr>
<tr>
<td>JavaScript</td>
<td>4×</td>
</tr>
<tr>
<td>Go</td>
<td>25×</td>
</tr>
<tr>
<td>Rust</td>
<td>100×</td>
</tr>
</tbody>
</table>

<p>JavaScript sits near PHP and Python here on purpose. Hot microbenchmarks after a JIT warms up can put Node next to Go. That is not how most day-to-day code feels, and it is not this figure. Go is clearly ahead of the managed runtimes. Rust is clearly ahead of Go. If your real work waits on Postgres, this chart is the wrong tool. The socket wins.</p>

<h2>Why Python, PHP, and JavaScript stay in a cluster</h2>

<p>CPython and the PHP CLI run through their default interpreters. Stock JavaScript is still a managed runtime. On ordinary CPU work they are in the same neighborhood compared with a compiled binary. That is why the balls stay close at 1×, 2×, and 4×.</p>

<h2>Why Go and Rust pull away</h2>

<p>Go and Rust ship a compiled binary for the loop. On this kind of CPU-bound work they leave the managed runtimes behind. Rust sits much further ahead of Go in this model than a screenshot that puts them almost tied.</p>

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
