---
title: "Why Rust Finishes That Loop Before Python, PHP, JavaScript, and Go"
slug: "why-rust-is-faster-than-python-javascript-php-and-go"
brief: "Interpreter, compiled+GC, compiled without GC on the path. Same loop. Slide the race to 100x."
publishedAt: "2099-06-01T18:00:00.000Z"
draft: true
draftToken: "deae83e5dc92e2055cd6b8e8b40d2ada"
readTimeInMinutes: 12
coverImageUrl: "/blog-assets/why-rust-is-faster-than-python-javascript-php-and-go/cover-v2.jpg"
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

<p>This post is a model for one kind of work: a CPU-bound checksum in memory. No HTTP. No disk. No Postgres. The interesting part is not the screenshot. It is which kind of language is running the loop.</p>

<figure>
  <img src="/blog-assets/why-rust-is-faster-than-python-javascript-php-and-go/diagram-runtime-tiers.jpg" alt="Vertical high-to-low board: non-compiled high-level Python PHP JavaScript keep an interpreter on the hot path; compiled high-level Go ships a binary with GC; compiled low-level Rust ships machine code with no GC on the path" width="1400" height="1280" loading="eager" decoding="async" />
  <figcaption>High to low. Non-compiled languages still pay a dispatch tax every loop. Go compiles ahead of time but keeps a GC under the binary. Rust compiles to machine code with no GC on this path.</figcaption>
</figure>

<div data-blog-activity="language-race"></div>

<p>At 1× the balls stay readable. Slide toward 100× when you want Rust to look unfair. The slider only changes playback. It does not change the language ratios.</p>

<h2>Three kinds of language</h2>

<p><strong>Interpreted high-level:</strong> Python, PHP, JavaScript. You ship source. CPython, Zend, or V8 still walks bytecode (or JITs after warmup) while the loop runs. That dispatch cost is why these three sit at about 1×, 3×, and 13×.</p>

<p><strong>Compiled high-level:</strong> Go. The compiler builds a native binary ahead of time, so the hot path is machine code. A garbage collector and runtime still ride along. That is why Go jumps to about 53× without matching Rust.</p>

<p><strong>Compiled low-level:</strong> Rust. <code>rustc</code> and LLVM also emit machine code ahead of time. On this checksum there is no GC on the path: ownership did that work at compile time. That is the ~115× lane.</p>

<h2>The program under test</h2>

<p>Here is the job in Python. The other languages do the same math: walk <code>0 .. n-1</code>, accumulate <code>i * i</code>, keep a 32-bit mask so the optimizer cannot delete the loop.</p>

<pre><code class="language-python">def hrr_checksum(n: int) -&gt; int:
    total = 0
    for i in range(n):
        total = (total + i * i) &amp; 0xFFFFFFFF
    return total

print(hrr_checksum(50_000_000))
</code></pre>

<p>Same shape in Rust:</p>

<pre><code class="language-rust">fn hrr_checksum(n: u64) -&gt; u32 {
    let mut total: u32 = 0;
    for i in 0..n {
        total = total.wrapping_add(((i * i) as u32));
    }
    total
}

fn main() {
    println!("{}", hrr_checksum(50_000_000));
}
</code></pre>

<p>I am not timing a framework, an ORM, or a JSON handler. If your real p99 is waiting on the network, this post is the wrong tool.</p>

<h2>What the model is measuring</h2>

<p>Python is the 1× baseline. The ratios below are relative throughput for that loop class on stock runtimes, rounded so the race stays readable.</p>

<table>
<thead>
<tr>
<th>Language</th>
<th>Relative speed</th>
<th>What usually eats the time</th>
</tr>
</thead>
<tbody>
<tr>
<td>Python</td>
<td>1×</td>
<td>Interpreter dispatch per iteration</td>
</tr>
<tr>
<td>PHP</td>
<td>3×</td>
<td>Still managed, often a bit tighter than CPython here</td>
</tr>
<tr>
<td>JavaScript</td>
<td>13×</td>
<td>JIT warms up and accelerates the hot path</td>
</tr>
<tr>
<td>Go</td>
<td>53×</td>
<td>Compiled binary, GC still in the picture</td>
</tr>
<tr>
<td>Rust</td>
<td>115×</td>
<td>Compiled binary, no GC on this path</td>
</tr>
</tbody>
</table>

<p>PHP stays near the managed cluster (~3×). JavaScript’s JIT pulls it ahead of PHP (~13×) without catching a compiled binary. Go is clearly ahead (~53×). Rust is clearly ahead of Go (~115×, about 2× Go).</p>

<h2>Why the interpreted lane trails</h2>

<p>CPython and the PHP CLI walk bytecode (or similar) for every trip around the loop. Stock JavaScript is still a managed runtime, even when V8 helps after warmup. On ordinary CPU work they trail a compiled binary. That is why those three balls stay behind Go and Rust in the figure.</p>

<h2>Why Go and Rust pull away, and why they split</h2>

<p>Go and Rust both ship machine code for this loop, so they leave the interpreted lane behind. Go still carries a GC runtime. Rust does not on this path. That gap is the difference between ~53× and ~115× here: not "Go is slow," and not a web framework benchmark.</p>

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
