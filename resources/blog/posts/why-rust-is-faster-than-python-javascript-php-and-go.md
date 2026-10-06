---
title: "Why Rust Finishes That Loop Before Python, PHP, JavaScript, and Go"
slug: "why-rust-is-faster-than-python-javascript-php-and-go"
brief: "A five-lane model of one small CPU loop. You can slow it down or speed it up. The order stays put, and the caption says where each language spends the time."
publishedAt: "2099-06-01T18:00:00.000Z"
draft: true
draftToken: "deae83e5dc92e2055cd6b8e8b40d2ada"
readTimeInMinutes: 7
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

<p>This figure is a model, not a timing run from my laptop. Each lane counts, allocates, and hashes. Play changes the step. The speed buttons change how fast the lanes move. They do not change who finishes first.</p>

<div data-blog-activity="language-race"></div>

<h2>Python and PHP walk the program while they run it</h2>

<p>CPython and the PHP interpreter read the opcodes as they go. A tight loop pays that cost on every iteration. That is the long part of those two lanes. It is also why a script that runs once, reads a file, and exits is a fine job for either of them. You are not in that loop a million times.</p>

<h2>JavaScript gets faster after the JIT has seen the loop</h2>

<p>V8 and the other engines watch a hot function and compile it. The first passes are slower. The later passes are closer to compiled code. Allocation and garbage collection still show up if the loop builds objects on every iteration. The lane finishes ahead of the interpreters and behind Go and Rust.</p>

<h2>Go compiles, then the collector still has work</h2>

<p>Go builds a binary. You do not pay an interpreter on each iteration. If the loop allocates, the garbage collector has to scan that memory. On a short CPU-bound function that is the gap between the Go lane and the Rust lane in this model.</p>

<h2>Rust does not stop to collect this loop</h2>

<p>Rust compiles ahead of time. Ownership is checked when you build, so this workload does not pause later for a collector. The cost moved to the compiler and to the time you spend satisfying the borrow checker. The binary does less at runtime.</p>

<p>That is the whole picture. It is not a claim that a Rust HTTP handler is faster than a Go one when both are waiting on Postgres. It is a claim about this kind of loop.</p>

<h2>When the faster language is the wrong one</h2>

<p>If the program waits on the network, the lane chart does not matter. The socket does. If the program is a migration you will run once, Python is finished before I have the Rust project compiling. If the team does not want a borrow checker in the review, Go or JavaScript will ship the service, and the loop inside it is rarely the thing on fire.</p>

<p>I reach for Rust when the same CPU loop sits on the hot path, the data is in memory, and I can afford the compile. I do not reach for it to win a screenshot.</p>

<p>Hope you enjoyed this one. If you've got a loop that is actually hot, find me on X at https://x.com/harundotdev.</p>
