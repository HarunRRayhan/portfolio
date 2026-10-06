---
title: "Five Load Balancer Algorithms, and Which One You Actually Get"
slug: "five-load-balancer-algorithms"
brief: "Round robin, weights, least connections, IP hash, and power of two choices. The picture sends the requests. The text says which balancer actually exposes which algorithm."
publishedAt: "2099-06-01T18:00:00.000Z"
draft: true
draftToken: "0244a19b63b72390aea9abe4216731d1"
readTimeInMinutes: 8
coverImageUrl: "/blog-assets/five-load-balancer-algorithms/cover.jpg"
reactionCount: 0
responseCount: 0
replyCount: 0
tags:
  - name: Devops
    slug: devops
  - name: AWS
    slug: aws
---

<p>A health check was green on all three boxes. CPU on the first one was pinned. The office NAT had hashed onto that one server, and every laptop in the building followed it there.</p>

<p>The algorithm was doing what it was told. I had just never watched the requests land.</p>

<p>Press play on the figure. It walks five ways to place a request. The buttons jump to one algorithm, and "Send one more" adds a single request on top of the eight already drawn. Speed changes how fast the walk moves.</p>

<div data-blog-activity="load-balancer"></div>

<h2>Round robin</h2>

<p>Request 1 goes to A, 2 to B, 3 to C, 4 back to A. nginx calls this the default. HAProxy calls it <code>balance roundrobin</code>.</p>

<p>It is fair when every request costs about the same. It is a bad fit when one request uploads a video and the next one hits <code>/health</code>. The video stays on A while B and C keep taking cheap checks.</p>

<h2>Weighted round robin</h2>

<p>In the figure, A has weight 5 and the other two have weight 1. Five requests hit A before B or C see one.</p>

<p>Use this when the machines are different sizes. A <code>c7g.xlarge</code> and a <code>t4g.small</code> should not take the same count. nginx writes it as <code>weight=5</code> on the upstream. HAProxy writes it as <code>weight</code> on the server line.</p>

<h2>Least connections</h2>

<p>The next request goes to the server with the fewest open requests. Long requests pile up, so the balancer stops sending them more work.</p>

<p>nginx calls this <code>least_conn</code>. HAProxy calls it <code>leastconn</code>. An Application Load Balancer does not give you a round-robin dropdown. It uses least outstanding requests, which is this idea: in-flight requests, not a completed count.</p>

<h2>IP hash</h2>

<p>The same client IP keeps landing on the same server. That is sticky routing without a cookie.</p>

<p>It is also how one office NAT melts a single box. Every laptop shares the public address, so they all hash together. In the figure, client A stays on server A and client B lands on server C.</p>

<p>nginx calls this <code>ip_hash</code>. A Network Load Balancer does not hash the IP for the life of a laptop. It picks a target for a flow, and that choice sticks for the life of the connection. Same family of idea, different lifetime.</p>

<h2>Power of two choices</h2>

<p>Pick two servers at random. Send the request to the one with less load. You skip a scan of the whole pool, and you still dodge the server that is already buried.</p>

<p>Plain random is the version that does not take the second look. Power of two is the one worth remembering. Envoy and a lot of service meshes use a form of it. You will not find a radio button with this name on an Application Load Balancer.</p>

<h2>What I check before I pick one</h2>

<p>If the requests are short and the machines match, round robin is enough. If the machines differ, add weights. If some requests stay open for seconds, use least connections. If you need a client to stay on one box, know that IP hash will also glue a whole NAT to that box. Power of two is what I want inside a mesh, where no human is going to retune weights at 2am.</p>

<p>Hope you enjoyed this one. If you want to argue about sticky sessions versus a shared store, find me on X at https://x.com/harundotdev.</p>
