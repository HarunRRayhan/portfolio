---
title: "18 Load Balancer Algorithms You Should Know Cold"
slug: "eight-load-balancer-algorithms"
brief: "18 ways a balancer picks the next server. Each one has its own picture, under the section that explains it."
publishedAt: "2099-06-01T18:00:00.000Z"
draft: true
draftToken: "0244a19b63b72390aea9abe4216731d1"
readTimeInMinutes: 16
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

<p>There are 18 of them below. Each one gets its own figure. Press play and the requests walk in. Next and Previous move one step. Send one more adds a single request on top of the step you are on. Speed changes how fast the walk moves.</p>

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

<h2>9. Random</h2>

<p>Skip the memory. Each request is a new draw, so 3 requests in a row can hit the same box. nginx calls this <code>random</code>. I only use it when every request is cheap and the same size.</p>

<div data-blog-activity="load-balancer" data-algorithm="random"></div>

<p>The clumps are the feature. If a clump would hurt, you wanted number 8, not this.</p>

<h2>10. Weighted random</h2>

<p>Same idea, with the sizes put back in. A weight of 5 against two weights of 1 means A should see about 5 of every 7 requests, but not on a fixed lap.</p>

<div data-blog-activity="load-balancer" data-algorithm="weighted-random"></div>

<p>nginx is <code>random</code> plus <code>weight</code> on the server. B can win twice in a row. Number 2 will not do that.</p>

<h2>11. Least bandwidth</h2>

<p>Count bytes, not connections. A 20 MB upload should keep its server out of the rotation longer than 20 calls to <code>/health</code>.</p>

<div data-blog-activity="load-balancer" data-algorithm="least-bandwidth"></div>

<p>Appliance balancers expose this. Stock nginx does not. If you cannot see bytes at the balancer, least connections is the stand-in.</p>

<h2>12. Cookie affinity</h2>

<p>The first request uses whatever algorithm you already picked. The balancer sets a cookie, and the next 10 requests from that browser skip the math and follow it.</p>

<div data-blog-activity="load-balancer" data-algorithm="cookie-affinity"></div>

<p>An Application Load Balancer calls this stickiness on the target group. It keeps one browser on one process. It does not split an office NAT.</p>

<h2>13. Maglev</h2>

<p>Google's balancer builds a lookup table. Key 18 always hits the same slot, and the slot names a server. It is consistent hashing built for a VIP that has to answer quickly.</p>

<div data-blog-activity="load-balancer" data-algorithm="maglev"></div>

<p>When 1 backend out of 100 dies, Maglev moves about 1 percent of the keys. A naive hash of the key moves almost all of them.</p>

<h2>14. Rendezvous hashing</h2>

<p>Also called highest random weight. Each key scores all 3 servers and picks the winner. No ring, no table to rebuild by hand.</p>

<div data-blog-activity="load-balancer" data-algorithm="rendezvous"></div>

<p>Add a 4th server and about 1 key in 4 moves. The other 3 stay. That is why caches like it.</p>

<h2>15. IP and port hash</h2>

<p>Number 6 hashes the address and glues a whole NAT to one box. This one also hashes the source port, so 40 laptops behind 1 public IP can land on 3 servers.</p>

<div data-blog-activity="load-balancer" data-algorithm="ip-port-hash"></div>

<p>A Network Load Balancer flow hash works this way for the life of the connection. <code>ip_hash</code> in nginx does not look at the port.</p>

<h2>16. Priority and failover</h2>

<p>This one does not spread load. The first requests stay on A until A is down or over its cap, then they spill to B.</p>

<div data-blog-activity="load-balancer" data-algorithm="priority-failover"></div>

<p>nginx marks the others <code>backup</code>. HAProxy uses a <code>backup</code> server. I use it for a warm standby, not for a pool.</p>

<h2>17. Header hash</h2>

<p>Hash <code>x-user-id</code>, not the IP. User 18 stays on one server when the phone moves from office wifi to a mobile network. The 40 laptops on the NAT do not share a user id, so they do not share a server.</p>

<div data-blog-activity="load-balancer" data-algorithm="header-hash"></div>

<p>Envoy can hash a header. If the header is missing, every anonymous request becomes 1 hot key. Require the header, or fall through to number 8.</p>

<h2>18. Peak EWMA</h2>

<p>Number 5 can forgive a server after one fast reply. Peak EWMA does not. A spike to 400 ms keeps that server quiet while the 12 ms and 18 ms servers take the next requests.</p>

<div data-blog-activity="load-balancer" data-algorithm="peak-ewma"></div>

<p>Linkerd uses this inside the mesh. The average is exponential, and the peak is what it refuses to forget.</p>

<h2>What I check before I pick one</h2>

<p>If the requests are short and the machines match, round robin is enough. If the machines differ and the requests are short, add weights. If some requests stay open, use least connections, and add weights if the machines differ too. If one box is slow even when it looks idle, look at response time.</p>

<p>If you need a client to stay on one box, know that IP hash will also glue a whole NAT to that box. If you need a cache key to stay put, use consistent hashing. Power of two is what I want inside a mesh, where no human is going to retune weights at 2am.</p>

<p>Hope you enjoyed this one. If you want to argue about sticky sessions versus a shared store, find me on X at https://x.com/harundotdev.</p>
