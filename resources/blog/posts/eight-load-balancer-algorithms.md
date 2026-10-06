---
title: "8 Load Balancer Algorithms You Should Know Cold"
slug: "eight-load-balancer-algorithms"
brief: "8 ways a balancer picks the next server. Each one has its own picture, under the section that explains it."
publishedAt: "2099-06-01T18:00:00.000Z"
draft: true
draftToken: "0244a19b63b72390aea9abe4216731d1"
readTimeInMinutes: 11
coverImageUrl: "/blog-assets/eight-load-balancer-algorithms/cover.jpg"
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

<p>There are 8 below. Each one gets its own figure. Press play and the requests walk in. Next and Previous move one step. Send one more adds a single request on top of the step you are on. Speed changes how fast the walk moves.</p>

<h2>1. Round robin</h2>

<p>Request 1 goes to A, 2 to B, 3 to C, 4 back to A. nginx uses this unless you say otherwise. HAProxy calls it <code>balance roundrobin</code>.</p>

<div data-blog-activity="load-balancer" data-algorithm="round-robin"></div>

<p>It is fair when every request costs about the same. It is a bad fit when one request uploads a video and the next one hits <code>/health</code>. The video stays on A while B and C keep taking cheap checks.</p>

<h2>2. Weighted round robin</h2>

<p>Use this when the machines are different sizes. A <code>c7g.xlarge</code> and a <code>t4g.small</code> should not take the same count. nginx writes it as <code>weight=5</code> on the upstream. HAProxy writes it as <code>weight</code> on the server line.</p>

<div data-blog-activity="load-balancer" data-algorithm="weighted-round-robin"></div>

<p>The lap is fixed. A takes five, then B takes one, then C takes one, then A starts again. A server that finishes early does not get to jump the queue.</p>

<h2>3. Least connections</h2>

<p>The next request goes to the server with the fewest open requests. Long requests pile up, so the balancer stops sending them more work.</p>

<div data-blog-activity="load-balancer" data-algorithm="least-connections"></div>

<p>nginx calls this <code>least_conn</code>. HAProxy calls it <code>leastconn</code>. An Application Load Balancer does not give you a round-robin dropdown. It uses least outstanding requests, which is this idea: in-flight requests, not a completed count.</p>

<h2>4. Weighted least connections</h2>

<p>Least connections on its own still treats a large box and a small box as equals. Weights fix that. One open request on a weight-5 server is less busy than one open request on a weight-1 server.</p>

<div data-blog-activity="load-balancer" data-algorithm="weighted-least-connections"></div>

<p>HAProxy writes this as <code>balance leastconn</code> plus a <code>weight</code> on each server. The picture still leans on A, and a server that drains its queue can take the next request before the lap says so.</p>

<h2>5. Least response time</h2>

<p>Connections are not the whole story. A server with two open requests that answers in 12 ms can be a better pick than an idle server that answers in 40 ms.</p>

<div data-blog-activity="load-balancer" data-algorithm="least-response-time"></div>

<p>HAProxy calls this least response time. It multiplies open connections by a recent response time and picks the smaller product. I use it when the boxes are the same size on paper and one of them is actually slow.</p>

<h2>6. IP hash</h2>

<p>The same client IP keeps landing on the same server. That is sticky routing without a cookie.</p>

<div data-blog-activity="load-balancer" data-algorithm="ip-hash"></div>

<p>It is also how one office NAT melts a single box. Every laptop shares the public address, so they all hash together. nginx calls this <code>ip_hash</code>. A Network Load Balancer does not hash the IP for the life of a laptop. It picks a target for a flow, and that choice sticks for the life of the connection.</p>

<h2>7. Consistent hashing</h2>

<p>IP hash sticks a client to a server. Consistent hashing sticks a key to a server, and it tries not to move every key when you add or remove a node.</p>

<div data-blog-activity="load-balancer" data-algorithm="consistent-hash"></div>

<p>Envoy calls a form of this ring hash. You meet it in caches and in meshes, where the point is that key A stays on the same box for the next request. Maglev, which Google uses in front of a lot of traffic, is the same family.</p>

<h2>8. Power of two choices</h2>

<p>Pick two servers at random. Send the request to the one with less load. You skip a scan of the whole pool, and you still dodge the server that is already buried.</p>

<div data-blog-activity="load-balancer" data-algorithm="power-of-two"></div>

<p>Plain random is the version that does not take the second look. Power of two is the one worth remembering. Envoy and a lot of service meshes use a form of it. You will not find a radio button with this name on an Application Load Balancer.</p>

<h2>What I check before I pick one</h2>

<p>If the requests are short and the machines match, round robin is enough. If the machines differ and the requests are short, add weights. If some requests stay open, use least connections, and add weights if the machines differ too. If one box is slow even when it looks idle, look at response time.</p>

<p>If you need a client to stay on one box, know that IP hash will also glue a whole NAT to that box. If you need a cache key to stay put, use consistent hashing. Power of two is what I want inside a mesh, where no human is going to retune weights at 2am.</p>

<p>Hope you enjoyed this one. If you want to argue about sticky sessions versus a shared store, find me on X at https://x.com/harundotdev.</p>
