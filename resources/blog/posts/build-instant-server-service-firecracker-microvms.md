---
title: "How to Build Your Own Instant-Server Service Using Firecracker MicroVMs"
seoTitle: "Build an Instant-Server Service Using Firecracker MicroVMs"
slug: "build-instant-server-service-firecracker-microvms"
brief: "Most agent sandboxes run in Firecracker microVMs. Here's how to build a small instant-server service yourself: host, jailer, networking, snapshots, a warm pool, and the API."
publishedAt: "2099-06-01T18:00:00.000Z"
draft: true
draftToken: "1ce8fd7883bf5227b544f17a29da72d9"
readTimeInMinutes: 22
coverImageUrl: "/blog-assets/build-instant-server-service-firecracker-microvms/cover-v2.jpg"
reactionCount: 0
responseCount: 0
replyCount: 0
tags:
  - name: AWS
    slug: aws
  - name: Firecracker
    slug: firecracker
  - name: Infrastructure
    slug: infrastructure
  - name: AI
    slug: ai
---

<p>Every agent sandbox launch I read this year has the same line in its docs. <a href="https://instabox.sh" target="_blank" rel="noopener noreferrer">InstaBox</a>, the "cloud computers for AI agents" product from InsForge in <a href="https://www.ycombinator.com/companies/insforge" target="_blank" rel="noopener noreferrer">YC's Spring 2026 batch</a>, says each machine is "a Firecracker microVM". <a href="https://github.com/e2b-dev/infra" target="_blank" rel="noopener noreferrer">E2B's infra repo</a> says "one Firecracker microVM per sandbox". <a href="https://vercel.com/docs/vercel-sandbox" target="_blank" rel="noopener noreferrer">Vercel Sandbox</a> says each sandbox "runs in a secure Firecracker microVM". <a href="https://docs.superserve.ai/introduction" target="_blank" rel="noopener noreferrer">Superserve</a> says its sandboxes are "powered by Firecracker MicroVMs".</p>

<p>I ran into Firecracker before, from the other side. When I wrote about <a href="/blog/lambda-snapstart-terraform-cold-starts">Lambda SnapStart</a> in July, the whole trick turned out to be a snapshot of a Firecracker microVM. So this time I wanted the operator's view. Not the SDK. The host, the jail, the network, the snapshot, and the small API that hands you a box.</p>

<p>This post builds a small version of that service end to end. One Linux host, Firecracker v1.18.0 under the jailer, one network namespace per box, a golden snapshot, a warm pool, a persistent <code>/data</code> disk per box, and a TypeScript control plane where <code>POST /boxes</code> claims a VM that's already restored instead of booting one.</p>

<p>An honest note before the commands. I wrote this on a Mac, and macOS has no KVM. I checked every command and JSON body against the Firecracker v1.18.0 docs and its OpenAPI spec, and the TypeScript passes <code>tsc --strict</code>. But I haven't run this stack on real KVM hardware. Treat it as a reviewed design, and test it on a metal host before you trust it.</p>

<h2>Why a microVM and not a container</h2>

<p>A container shares the host kernel. Every syscall the agent's code makes lands in the same kernel your control plane runs on, and one kernel bug is a way out. That's fine for code you wrote. It's not fine for code a model wrote five seconds ago, or code a stranger pasted into your free tier.</p>

<p>A Firecracker microVM gets its own guest kernel, and the wall between guest and host is KVM, which is hardware virtualization. The <a href="https://github.com/firecracker-microvm/firecracker/blob/v1.18.0/README.md" target="_blank" rel="noopener noreferrer">README</a> says Firecracker "excludes unnecessary devices and guest-facing functionality to reduce the memory footprint and attack surface area of each microVM". Per the <a href="https://github.com/firecracker-microvm/firecracker/blob/v1.18.0/docs/design.md" target="_blank" rel="noopener noreferrer">design doc</a>, the guest gets VirtIO net and block, vsock, a serial console, and a partial keyboard controller that only exists so the guest can ask for a reboot.</p>

<p>Then it stacks process-level walls on top. Firecracker installs seccomp filters per thread by default. The <a href="https://github.com/firecracker-microvm/firecracker/blob/v1.18.0/docs/jailer.md" target="_blank" rel="noopener noreferrer">jailer</a> puts each VMM process in its own chroot, mount namespace and cgroup, optionally its own network and PID namespace, and drops to an unprivileged uid before it execs Firecracker. The design doc's threat model treats every vCPU thread as "running malicious code as soon as they have been started". That's the stance you want for agent code.</p>

<p>It's also light enough to do per request. Firecracker's <a href="https://github.com/firecracker-microvm/firecracker/blob/v1.18.0/SPECIFICATION.md" target="_blank" rel="noopener noreferrer">specification</a> promises at most 5 MiB of VMM memory overhead for a 1 vCPU, 128 MiB guest, and at most 125 ms from the <code>InstanceStart</code> call to the guest's <code>/sbin/init</code>, measured with a minimal kernel and rootfs. AWS <a href="https://github.com/firecracker-microvm/firecracker/blob/v1.18.0/README.md" target="_blank" rel="noopener noreferrer">built it</a> for services like Lambda and Fargate.</p>

<h2>The pieces of a small instant-server service</h2>

<p>Here's everything the rest of the post builds, so you know where each command fits.</p>

<ul>
  <li><strong>The host.</strong> An EC2 instance with <code>/dev/kvm</code>, Firecracker and the jailer pinned to v1.18.0, cgroup v2, and one nftables ruleset that boxes can't get around.</li>
  <li><strong>The golden snapshot.</strong> One VM, booted once, warmed up, paused, snapshotted, and then killed. It's never resumed.</li>
  <li><strong>Slots.</strong> A slot is a network namespace, a jail, a copy-on-write rootfs, and a VM restored from the golden snapshot and left paused. The warm pool is a list of slots.</li>
  <li><strong>Boxes.</strong> A box is a slot someone claimed. It gets an identity through Firecracker's metadata service, its own <code>/data</code> disk, and then it's resumed.</li>
  <li><strong>The control plane.</strong> <code>hrr_boxd.ts</code>, a small HTTP API on the host that owns the pool, the box lifecycle, metering and quotas. A gateway in front of it (not shown) proxies SSH and HTTP to each box.</li>
</ul>

<figure><img src="/blog-assets/build-instant-server-service-firecracker-microvms/diagram-architecture.jpg" alt="Architecture diagram: a customer or agent sends POST /boxes to the control plane (quotas, placement, per-second metering, idle reaper), which picks a metal host with /dev/kvm. On the host, a host agent drives each Firecracker API socket and reads the snapshot store (vmlinux, read-only rootfs.ext4, memory and vmstate files). Restores fill a warm pool of paused VMs, which are resumed into boxes, each with its own jailer, network namespace and /data disk. Box traffic leaves through nftables NAT, which drops 169.254.169.254 and box-to-box traffic." width="1600" height="900" loading="lazy" decoding="async"><figcaption>The whole service on one host. The control plane never boots anything on the request path; it hands out a VM the pool already restored.</figcaption></figure>

<h2>The host has to expose /dev/kvm</h2>

<p>Firecracker needs read and write access to <code>/dev/kvm</code>. The <a href="https://github.com/firecracker-microvm/firecracker/blob/v1.18.0/docs/getting-started.md" target="_blank" rel="noopener noreferrer">getting-started guide</a> suggests a <code>c5.metal</code> with Ubuntu 24.04, and it still says "EC2 only supports KVM on .metal instance types".</p>

<p>That stopped being the whole story in February 2026, when AWS <a href="https://aws.amazon.com/about-aws/whats-new/2026/02/amazon-ec2-nested-virtualization-on-virtual/" target="_blank" rel="noopener noreferrer">launched nested virtualization</a> on virtual instances. The <a href="https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/amazon-ec2-nested-virtualization.html" target="_blank" rel="noopener noreferrer">current EC2 docs</a> list M7i, M7i-flex, M8i, M8id, M8i-flex, C7i, C7i-flex, C8i, C8id, C8i-flex, R7i, R7iz, R8i, R8id, R8i-flex, X8i, I7i and I7ie, with KVM and Hyper-V as the supported L1 hypervisors. You turn it on at launch with <code>--cpu-options "NestedVirtualization=enabled"</code>, or on a stopped instance with <code>modify-instance-cpu-options</code>. AWS says there's no extra charge for it. Every family on that list is Intel, so no Graviton yet.</p>

<p>I'd still run the real fleet on metal, for two reasons. The same AWS page tells you to evaluate bare metal for workloads that are "performance sensitive or have strict latency requirements", and a box service is exactly that. And Firecracker's own <a href="https://github.com/firecracker-microvm/firecracker/blob/v1.18.0/README.md#tested-platforms" target="_blank" rel="noopener noreferrer">tested platforms</a> table is all <code>.metal</code>: <code>m6i.metal</code>, <code>m7i.metal-24xl</code>, <code>m8i.metal-48xl</code>, <code>m7a.metal-48xl</code>, <code>m8g.metal-24xl</code>, <code>m9g.metal-48xl</code> and a few more. I couldn't find Firecracker docs that cover running inside nested virtualization, so I'd use nested instances for dev boxes and CI, and metal for production.</p>

<p>Here's the host prep. The first command runs from your laptop. The rest run on the host as root.</p>

<pre><code class="language-bash"># From your laptop: does this virtual instance type expose virtualization at all?
# An empty list means no nested virtualization.
aws ec2 describe-instance-types --instance-types m8i.2xlarge \
  --query &quot;InstanceTypes[].ProcessorInfo.SupportedFeatures&quot;

# On the host: is KVM loaded, and can we use it?
lsmod | grep kvm
[ -r /dev/kvm ] &amp;&amp; [ -w /dev/kvm ] &amp;&amp; echo &quot;OK&quot; || echo &quot;FAIL&quot;

# cgroup v2 controllers the jailer will write to (cpu.max, memory.max)
echo &quot;+cpu +memory&quot; &gt; /sys/fs/cgroup/cgroup.subtree_control
mkdir -p /sys/fs/cgroup/firecracker
echo &quot;+cpu +memory&quot; &gt; /sys/fs/cgroup/firecracker/cgroup.subtree_control

# Pin the release and check the published checksum
FC=v1.18.0
ARCH=&quot;$(uname -m)&quot;
BASE=&quot;https://github.com/firecracker-microvm/firecracker/releases/download/${FC}&quot;
curl -fsSLO &quot;${BASE}/firecracker-${FC}-${ARCH}.tgz&quot;
curl -fsSLO &quot;${BASE}/firecracker-${FC}-${ARCH}.tgz.sha256.txt&quot;
sha256sum -c &quot;firecracker-${FC}-${ARCH}.tgz.sha256.txt&quot;
tar -xzf &quot;firecracker-${FC}-${ARCH}.tgz&quot;
install -m 0755 &quot;release-${FC}-${ARCH}/firecracker-${FC}-${ARCH}&quot; /usr/local/bin/firecracker
install -m 0755 &quot;release-${FC}-${ARCH}/jailer-${FC}-${ARCH}&quot; /usr/local/bin/jailer</code></pre>

<p>The cgroup v2 part isn't optional in my book. The <a href="https://github.com/firecracker-microvm/firecracker/blob/v1.18.0/docs/snapshotting/snapshot-support.md#limitations" target="_blank" rel="noopener noreferrer">snapshot docs</a> list "high snapshot restoration latency when cgroups V1 are in use" as a known limitation and strongly recommend v2. An instant-box service is mostly snapshot restores.</p>

<h2>One box by hand, under the jailer</h2>

<p>You need two artifacts: an uncompressed guest kernel and an ext4 rootfs. For a first run, the getting-started guide has a script that pulls both from Firecracker's CI bucket, patches an SSH key into the Ubuntu rootfs, and leaves you with <code>$KERNEL</code>, <code>$ROOTFS</code> and <code>$KEY_NAME</code>. For production, build your own with <a href="https://github.com/firecracker-microvm/firecracker/blob/v1.18.0/docs/rootfs-and-kernel-setup.md" target="_blank" rel="noopener noreferrer">rootfs-and-kernel-setup.md</a>.</p>

<p>Pick the guest kernel on purpose. The <a href="https://github.com/firecracker-microvm/firecracker/blob/v1.18.0/docs/kernel-policy.md" target="_blank" rel="noopener noreferrer">kernel policy</a> supports 5.10, 6.1 and 6.18 guests, but the snapshot section below leans on VMGenID, and Linux only reseeds its RNG from VMGenID from 5.18 onward. So 6.1 or 6.18, not 5.10.</p>

<p>This boots the golden VM. It's the only VM in the system that boots from a kernel. Everything after it restores from its snapshot.</p>

<pre><code class="language-bash"># One-time: boot the golden VM. Slot 254 is reserved for it.
hrr-net-up.sh 254

ID=hrr-golden
JAIL=&quot;/srv/jailer/firecracker/$ID/root&quot;
mkdir -p &quot;$JAIL/run&quot;
cp &quot;$KERNEL&quot; &quot;$JAIL/vmlinux&quot;          # $KERNEL, $ROOTFS: from the getting-started script
cp --reflink=always &quot;$ROOTFS&quot; &quot;$JAIL/rootfs.ext4&quot;
truncate -s 1M &quot;$JAIL/data.ext4&quot;     # placeholder, swapped for the real /data disk later
chown -R 20254:20254 &quot;$JAIL&quot;

jailer --id &quot;$ID&quot; --exec-file /usr/local/bin/firecracker \
  --uid 20254 --gid 20254 --cgroup-version 2 \
  --netns /var/run/netns/hrr-254 --new-pid-ns --daemonize

SOCK=&quot;$JAIL/run/firecracker.socket&quot;
until [ -S &quot;$SOCK&quot; ]; do sleep 0.01; done
fc() { curl -sS --fail-with-body --unix-socket &quot;$SOCK&quot; -X &quot;$1&quot; &quot;http://localhost$2&quot; \
         -H 'Content-Type: application/json' -d &quot;$3&quot;; }

fc PUT /machine-config '{&quot;vcpu_count&quot;: 2, &quot;mem_size_mib&quot;: 1024, &quot;smt&quot;: false}'
fc PUT /boot-source '{&quot;kernel_image_path&quot;: &quot;/vmlinux&quot;,
                      &quot;boot_args&quot;: &quot;8250.nr_uarts=0 reboot=k panic=1&quot;}'
fc PUT /drives/rootfs '{&quot;drive_id&quot;: &quot;rootfs&quot;, &quot;path_on_host&quot;: &quot;/rootfs.ext4&quot;,
                        &quot;is_root_device&quot;: true, &quot;is_read_only&quot;: false}'
fc PUT /drives/data '{&quot;drive_id&quot;: &quot;data&quot;, &quot;path_on_host&quot;: &quot;/data.ext4&quot;,
                      &quot;is_root_device&quot;: false, &quot;is_read_only&quot;: false}'
fc PUT /network-interfaces/eth0 '{&quot;iface_id&quot;: &quot;eth0&quot;, &quot;guest_mac&quot;: &quot;06:00:AC:10:00:02&quot;,
                                  &quot;host_dev_name&quot;: &quot;tap0&quot;}'
fc PUT /mmds/config '{&quot;version&quot;: &quot;V2&quot;, &quot;network_interfaces&quot;: [&quot;eth0&quot;],
                      &quot;ipv4_address&quot;: &quot;169.254.170.2&quot;}'
fc PUT /entropy '{}'
sleep 0.015   # getting-started.md: config is applied async, let it land before start
fc PUT /actions '{&quot;action_type&quot;: &quot;InstanceStart&quot;}'</code></pre>

<p>A few things in there are easy to miss:</p>

<ul>
  <li>Every path in the API calls is relative to the jail root, <code>/srv/jailer/firecracker/hrr-golden/root</code>. The jailer copies the Firecracker binary into that chroot and Firecracker can't see anything outside it.</li>
  <li><code>vcpu_count</code> has to be 1 or an even number, per the <a href="https://github.com/firecracker-microvm/firecracker/blob/v1.18.0/src/firecracker/swagger/firecracker.yaml" target="_blank" rel="noopener noreferrer">API spec</a>.</li>
  <li><code>8250.nr_uarts=0</code> turns the serial console off. The <a href="https://github.com/firecracker-microvm/firecracker/blob/v1.18.0/docs/prod-host-setup.md" target="_blank" rel="noopener noreferrer">production host guide</a> recommends that, because the guest can otherwise write without limit to Firecracker's stdout.</li>
  <li>The <code>data</code> drive is a 1 MiB placeholder that the guest never mounts. It's how each box gets its own disk later.</li>
  <li><code>/mmds/config</code> can only be set before boot. I moved MMDS off the default <code>169.254.169.254</code> so nobody confuses it with the EC2 metadata service I'm about to block.</li>
  <li><code>PUT /entropy</code> adds a <code>virtio-rng</code> device, one more entropy source for the guest after restore.</li>
</ul>

<p>The guest MAC <code>06:00:AC:10:00:02</code> isn't random. The CI rootfs derives its IP from the MAC, so this one means <code>172.16.0.2</code>. Every clone will have that same MAC and IP, which is why the network has to be built around it.</p>

<h2>Networking: one namespace per box</h2>

<p>Firecracker gives each guest a TAP device and nothing more. The design doc is blunt about it: "Firecracker does not perform any network traffic filtering. All egress traffic from a guest is therefore considered untrusted, and should be filtered at the host-level."</p>

<p>Clones make this harder. Every VM restored from the golden snapshot expects a TAP called <code>tap0</code> and believes its IP is <code>172.16.0.2</code>. The fix in Firecracker's <a href="https://github.com/firecracker-microvm/firecracker/blob/v1.18.0/docs/snapshotting/network-for-clones.md" target="_blank" rel="noopener noreferrer">network-for-clones doc</a> is a network namespace per clone, so every box can have its own <code>tap0</code>, plus a veth pair and NAT to make each one unique on the host. That's what this script does, and the golden VM uses it too, as slot 254.</p>

<pre><code class="language-bash">#!/usr/bin/env bash
# hrr-net-up.sh &lt;slot&gt;: a namespace that looks exactly like the golden VM's network
set -euo pipefail
N=&quot;$1&quot;
NS=&quot;hrr-$N&quot;

ip netns add &quot;$NS&quot;
# Inside: the same tap0 and 172.16.0.1/30 the golden VM was snapshotted with
ip netns exec &quot;$NS&quot; ip tuntap add name tap0 mode tap
ip netns exec &quot;$NS&quot; ip addr add 172.16.0.1/30 dev tap0
ip netns exec &quot;$NS&quot; ip link set tap0 up

# A veth pair to the host. The host end gets a unique /30 per slot.
ip link add &quot;hrrv$N&quot; type veth peer name veth0 netns &quot;$NS&quot;
ip addr add &quot;10.200.$N.1/30&quot; dev &quot;hrrv$N&quot;
ip link set &quot;hrrv$N&quot; up
ip netns exec &quot;$NS&quot; ip addr add &quot;10.200.$N.2/30&quot; dev veth0
ip netns exec &quot;$NS&quot; ip link set veth0 up
ip netns exec &quot;$NS&quot; ip route add default via &quot;10.200.$N.1&quot;
ip netns exec &quot;$NS&quot; sysctl -qw net.ipv4.ip_forward=1

# Inbound SSH/HTTP to the guest, DNS to the host resolver, everything out as 10.200.N.2
ip netns exec &quot;$NS&quot; nft -f - &lt;&lt;NFT
table ip hrr {
  chain pre {
    type nat hook prerouting priority dstnat;
    iifname &quot;veth0&quot; tcp dport { 22, 8080 } dnat to 172.16.0.2
    iifname &quot;tap0&quot; udp dport 53 dnat to 10.200.$N.1
  }
  chain post {
    type nat hook postrouting priority srcnat;
    oifname &quot;veth0&quot; masquerade
  }
}
NFT</code></pre>

<p>From the host, box <code>N</code> is <code>10.200.N.2</code>. The gateway connects there on port 22 or 8080 and the namespace forwards it to the guest. Outbound, the guest's traffic leaves the namespace as <code>10.200.N.2</code> and then the host decides what's allowed.</p>

<p>Here's that host ruleset. The <a href="https://github.com/firecracker-microvm/firecracker/blob/v1.18.0/docs/prod-host-setup.md#filtering-guest-egress-network-traffic" target="_blank" rel="noopener noreferrer">production guide</a> shows a single rule that drops traffic from <code>tap*</code> to <code>169.254.169.254</code>. My taps live inside namespaces, so the host sees the <code>hrrv*</code> veths instead, and I block more than IMDS.</p>

<pre><code class="language-nft"># /etc/nftables.d/hrr-host.nft
# Replace ens5 with your uplink: ip -j route list default | jq -r '.[0].dev'
table inet hrr_host {
  chain input {
    type filter hook input priority filter; policy accept;
    iifname &quot;hrrv*&quot; ct state established,related accept
    iifname &quot;hrrv*&quot; udp dport 53 accept          # the host resolver, nothing else
    iifname &quot;hrrv*&quot; counter drop
  }
  chain forward {
    type filter hook forward priority filter; policy drop;
    ct state established,related accept
    iifname &quot;hrrv*&quot; ip daddr 169.254.0.0/16 counter drop    # IMDS and the rest of link-local
    iifname &quot;hrrv*&quot; oifname &quot;hrrv*&quot; counter drop             # box to box
    iifname &quot;hrrv*&quot; ip daddr { 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 100.64.0.0/10 } counter drop
    iifname &quot;hrrv*&quot; tcp dport { 25, 465, 587 } counter drop  # no spam relays on day one
    iifname &quot;hrrv*&quot; oifname &quot;ens5&quot; counter accept
  }
  chain postrouting {
    type nat hook postrouting priority srcnat; policy accept;
    oifname &quot;ens5&quot; ip saddr 10.200.0.0/16 masquerade
  }
}</code></pre>

<p>In order: boxes can't reach the EC2 metadata service or anything else link-local, can't reach each other, can't reach your VPC or other private ranges, can't send mail, and can only talk to the host on DNS. Run a resolver on the host and point guests at <code>172.16.0.1</code>, which the namespace forwards to it. Dropping all of <code>169.254.0.0/16</code> also cuts off the VPC resolver at <code>169.254.169.253</code>, so the host resolver isn't optional.</p>

<p>The forward policy is <code>drop</code>, so this host shouldn't run anything else that forwards traffic, like Docker.</p>

<p>The one thing nftables can't do well is a domain allowlist. It sees IPs, and agents want to reach <code>pypi.org</code>, not an address. If you need "only these domains", send egress through an HTTP proxy that checks the CONNECT host or TLS SNI, and only let the proxy out. Superserve <a href="https://docs.superserve.ai/sandbox/networking" target="_blank" rel="noopener noreferrer">documents allow and deny lists</a> by CIDR or domain, which is the feature you're rebuilding there.</p>

<h2>Snapshot once, restore per request</h2>

<p>Booting is the slow path. The 125 ms in the spec is with a minimal kernel and rootfs, and a real box has systemd, an SSH server, your agent, and whatever runtime the user expects to be warm. You don't want to pay that on every <code>POST</code>.</p>

<p>So you pay it once. Boot the golden VM, warm it up, and snapshot it. A <a href="https://github.com/firecracker-microvm/firecracker/blob/v1.18.0/docs/snapshotting/snapshot-support.md" target="_blank" rel="noopener noreferrer">Firecracker snapshot</a> is a guest memory file plus a small microVM state file with the device and KVM state. Disks aren't part of it. They're yours to manage.</p>

<pre><code class="language-bash">G=&quot;ip netns exec hrr-254 ssh -i $KEY_NAME root@172.16.0.2&quot;

# Warm whatever your boxes need on first use. hrr-agent is your in-guest agent.
$G 'systemctl start hrr-agent &amp;&amp; /opt/hrr/warm.sh'
# random-for-clones.md: don't hand every clone the same saved seed
$G 'rm -f /var/lib/systemd/random-seed &amp;&amp; sync'

fc PATCH /vm '{&quot;state&quot;: &quot;Paused&quot;}'
fc PUT /snapshot/create '{&quot;snapshot_type&quot;: &quot;Full&quot;,
                          &quot;snapshot_path&quot;: &quot;/snap.vmstate&quot;,
                          &quot;mem_file_path&quot;: &quot;/snap.mem&quot;}'

# Never resume the golden VM. Kill it and publish its files.
kill -9 &quot;$(cat &quot;$JAIL/firecracker.pid&quot;)&quot;
mkdir -p /var/lib/hrr/golden
for f in vmlinux rootfs.ext4 snap.vmstate snap.mem; do
  ln &quot;$JAIL/$f&quot; &quot;/var/lib/hrr/golden/$f&quot;
done
chown root:root /var/lib/hrr/golden/*
chmod 0444 /var/lib/hrr/golden/*</code></pre>

<p>Three details matter more than they look.</p>

<p><strong>The golden VM is never resumed.</strong> The snapshot docs walk through which patterns are safe. "Boot A, snapshot, terminate, load in B" is safe. Resuming the original and a clone from the same state isn't, because both continue with the same random state and tokens. Kill the golden VM.</p>

<p><strong>The clones' rootfs is the golden VM's disk after the snapshot, not the image you started from.</strong> The guest's page cache in <code>snap.mem</code> describes that disk at that moment. Hand a clone a different disk and its filesystem state won't match its memory. Firecracker drains and <code>fsync</code>s block devices during snapshot creation, so the file is consistent once the call returns.</p>

<p><strong>Loading a snapshot is lazy.</strong> With the <code>File</code> backend, Firecracker <code>mmap</code>s the memory file <code>MAP_PRIVATE</code>. Pages load from it on first touch and writes go to private copy-on-write memory. That's why restore is fast, and it's also why <code>snap.mem</code> must stay unchanged on disk for as long as any clone runs. All the clones on a host share its read pages through the page cache.</p>

<p>If kernel page faults are too slow for you, the <code>Uffd</code> backend hands every page fault to a process you write, over <a href="https://github.com/firecracker-microvm/firecracker/blob/v1.18.0/docs/snapshotting/handling-page-faults-on-snapshot-resume.md" target="_blank" rel="noopener noreferrer">userfaultfd</a>. That's where you'd prefetch the pages a box always touches, or pull memory from somewhere other than local disk. Firecracker gives you the protocol, not the handler. Start with <code>File</code>.</p>

<p>You'll also see diff snapshots, which only write pages dirtied since the last snapshot. In v1.18.0 the docs still mark them as developer preview, and most diff files have to be merged onto a base with <code>snapshot-editor</code> before you can resume them. I'd use full snapshots for both the golden image and idle boxes, and come back to diffs once they're stable.</p>

<p>Here's what a single <code>POST /boxes</code> does once the pool is warm. Nothing on the request path boots a kernel.</p>

<figure><img src="/blog-assets/build-instant-server-service-firecracker-microvms/diagram-request-lifecycle.jpg" alt="Flow diagram of one request: POST /boxes checks quota and picks a host. If the warm pool has a paused VM it is resumed in a few milliseconds; if not, a VM is restored from the snapshot with lazy page loading. Both paths go through post-restore fix-ups (new SSH keys, machine-id, MMDS identity, stepping the clock), then the box gets its /data disk and network, and the API returns id, ssh and url in under a second. Later an idle timeout pauses, snapshots or destroys the box and stops the meter; the same customer can resume from that box's own snapshot." width="1600" height="900" loading="lazy" decoding="async"><figcaption>Both paths meet at the fix-ups. Skip them and every clone shares the golden VM's keys and identity.</figcaption></figure>

<p>Before reading on, try the three paths yourself. The figure below races a cold boot against a snapshot restore and a claim from the warm pool. Start all three at once and watch where the time goes on each lane. The cold boot spends it on the kernel, init and your app. The restore spends a few milliseconds loading state, more if the memory file sits on network storage. The warm pool has already paid both before anyone asked. The timings are illustrative, in the range public write-ups report, not a benchmark. Switch to the burst view to see what pool size does to p99, and skip the fix-ups to see what goes wrong.</p>

<div data-blog-activity="firecracker-boot"></div>

<h2>A warm pool of paused clones</h2>

<p>A restore is quick, but a slot also needs a namespace, a jail and a rootfs copy, and the jailer gets slower with load. Its docs measured jail creation at about 2x slower with 10 jails starting in parallel on a host with no mount points, and about 10x with 500 mount points. So I don't do any of that on the request path. A slot is built ahead of time, restored, and left paused.</p>

<pre><code class="language-bash">#!/usr/bin/env bash
# hrr-slot-up.sh &lt;slot&gt;: one restored, paused microVM, waiting to be claimed
set -euo pipefail
N=&quot;$1&quot;
ID=&quot;hrr-slot-$N&quot;
GOLD=/var/lib/hrr/golden
JAIL=&quot;/srv/jailer/firecracker/$ID/root&quot;
U=$((20000 + N))

hrr-net-up.sh &quot;$N&quot;

# Shared files are hard links. The rootfs is a reflink: instant, and CoW per box.
mkdir -p &quot;$JAIL/run&quot;
ln &quot;$GOLD/vmlinux&quot; &quot;$GOLD/snap.vmstate&quot; &quot;$GOLD/snap.mem&quot; &quot;$JAIL/&quot;
cp --reflink=always &quot;$GOLD/rootfs.ext4&quot; &quot;$JAIL/rootfs.ext4&quot;
truncate -s 1M &quot;$JAIL/data.ext4&quot;
chown &quot;$U:$U&quot; &quot;$JAIL&quot; &quot;$JAIL/run&quot; &quot;$JAIL/rootfs.ext4&quot; &quot;$JAIL/data.ext4&quot;
chmod 0600 &quot;$JAIL/rootfs.ext4&quot;

jailer --id &quot;$ID&quot; --exec-file /usr/local/bin/firecracker \
  --uid &quot;$U&quot; --gid &quot;$U&quot; \
  --cgroup-version 2 --cgroup &quot;cpu.max=200000 100000&quot; --cgroup &quot;memory.max=1280M&quot; \
  --netns &quot;/var/run/netns/hrr-$N&quot; --new-pid-ns --daemonize

SOCK=&quot;$JAIL/run/firecracker.socket&quot;
for _ in $(seq 200); do [ -S &quot;$SOCK&quot; ] &amp;&amp; break; sleep 0.01; done

curl -sS --fail-with-body --unix-socket &quot;$SOCK&quot; -X PUT http://localhost/snapshot/load \
  -H 'Content-Type: application/json' \
  -d '{&quot;snapshot_path&quot;: &quot;/snap.vmstate&quot;,
       &quot;mem_backend&quot;: {&quot;backend_path&quot;: &quot;/snap.mem&quot;, &quot;backend_type&quot;: &quot;File&quot;},
       &quot;clock_realtime&quot;: true,
       &quot;resume_vm&quot;: false}'</code></pre>

<p>The rootfs uses <code>cp --reflink=always</code>, which only works on a filesystem with reflinks, like XFS or Btrfs. On those it's a metadata-only copy, so every box starts with a private, writable rootfs that shares blocks with the golden one until it writes. On ext4 the command fails rather than quietly copying gigabytes, which is the behaviour I want. The hard links mean <code>/var/lib/hrr</code> and <code>/srv/jailer</code> have to be on the same filesystem.</p>

<p>Each slot runs under its own uid and gid, which the production guide recommends, so a broken jail can't read a neighbour's files. <code>cpu.max=200000 100000</code> caps the box at two CPUs' worth of time per 100 ms period. <code>memory.max</code> leaves some room above the guest's 1024 MiB for the VMM itself.</p>

<p>How big should the pool be? It needs to cover the boxes requested while a slot is being rebuilt. If you hand out 2 boxes a second at peak and a slot takes 3 seconds to build, a pool of 6 runs dry. Measure your slot build time on your hardware and size from that. When the pool is empty, the API returns 503 and the client retries, which is better than quietly falling back to a cold boot.</p>

<h2>Every clone wakes up with the same secrets</h2>

<p>This is the part of the instant-box idea that's easy to get wrong. A restored VM resumes exactly where the golden VM stopped. Anything it had already generated, every clone has too. The snapshot docs say it directly: without a strong way to keep unique things unique, "we consider resuming execution from the same state more than once insecure."</p>

<p>The kernel side is mostly handled. Firecracker always enables a VMGenID device and writes a fresh 16-byte ID on every restore. Linux 5.18 and later uses that to reseed its CSPRNG. There's still a short window between the vCPUs resuming and the reseed, which <a href="https://github.com/firecracker-microvm/firecracker/blob/v1.18.0/docs/snapshotting/random-for-clones.md" target="_blank" rel="noopener noreferrer">random-for-clones.md</a> calls out, and it does nothing for state that userspace already pulled out of the kernel. Lambda has the same problem, and the <a href="https://docs.aws.amazon.com/lambda/latest/dg/snapstart-uniqueness.html" target="_blank" rel="noopener noreferrer">SnapStart uniqueness guide</a> reads like a checklist for this section.</p>

<table>
  <thead>
    <tr><th>State</th><th>Same in every clone?</th><th>What I'd do</th></tr>
  </thead>
  <tbody>
    <tr><td>Kernel CSPRNG</td><td>Reseeded via VMGenID on Linux 5.18+, after a short window</td><td>6.1+ guest kernel, the entropy device, and no secrets generated in that window</td></tr>
    <tr><td><code>/var/lib/systemd/random-seed</code></td><td>Yes</td><td>Delete before the snapshot (done above)</td></tr>
    <tr><td><code>/proc/sys/kernel/random/boot_id</code></td><td>Yes</td><td>Bind-mount a fresh file over it if anything reads it</td></tr>
    <tr><td>SSH host keys, <code>/etc/machine-id</code></td><td>Yes</td><td>Regenerate on claim, before the gateway sends traffic</td></tr>
    <tr><td>Userspace RNGs, cached tokens, UUIDs</td><td>Yes</td><td>Don't create them before the snapshot; regenerate on claim</td></tr>
    <tr><td>MAC and IP</td><td>Yes</td><td>Namespace per box plus NAT (done above)</td></tr>
    <tr><td>Wall clock</td><td>Resumes from snapshot time</td><td><code>clock_realtime</code> on load, then step the clock on claim</td></tr>
    <tr><td>vsock connections</td><td>Closed by the snapshot</td><td>Agent reconnects; guest listen sockets survive</td></tr>
    <tr><td>MMDS data</td><td>Not in the snapshot</td><td><code>PUT /mmds</code> with the box identity on claim</td></tr>
  </tbody>
</table>

<p>Those last rows are how a clone finds out it's a new box. The control plane writes <code>{box: {id, owner, claimedAt}}</code> into MMDS, and the agent in the guest polls it at <code>169.254.170.2</code> with an MMDS V2 token. When the ID changes from empty to something, it regenerates keys and machine ID, steps the clock, and mounts <code>/data</code>.</p>

<p>About the clock: <code>clock_realtime: true</code> only exists on x86_64, needs host Linux 5.16 or later, and advances kvm-clock by the time since the snapshot was taken, at load. The docs don't say what happens to the guest clock while a loaded slot sits paused in the pool, so I wouldn't rely on it. Firecracker's <a href="https://github.com/firecracker-microvm/firecracker/blob/v1.18.0/FAQ.md" target="_blank" rel="noopener noreferrer">FAQ</a> recommends NTP in the guest, and at scale a KVM PTP clock as the NTP source. I'd have the agent step the clock on claim as well, before anything checks a TLS certificate.</p>

<h2>/data lives on its own disk</h2>

<p>InstaBox's homepage describes "a 20 GiB persistent disk at <code>/data</code>" next to a separate root disk. I like that split, and the placeholder drive makes it possible on top of a shared snapshot.</p>

<pre><code class="language-bash">#!/usr/bin/env bash
# hrr-data-attach.sh &lt;box-id&gt; &lt;slot&gt;: create the box's /data disk once, link it into the jail
set -euo pipefail
BOX=&quot;$1&quot;
N=&quot;$2&quot;
DISK=&quot;/var/lib/hrr/data/$BOX.ext4&quot;

if [ ! -f &quot;$DISK&quot; ]; then
  truncate -s 20G &quot;$DISK&quot;
  mkfs.ext4 -q -L hrr-data &quot;$DISK&quot;
fi
chown &quot;$((20000 + N)):$((20000 + N))&quot; &quot;$DISK&quot;
ln -f &quot;$DISK&quot; &quot;/srv/jailer/firecracker/hrr-slot-$N/root/box.ext4&quot;</code></pre>

<p>On claim, the control plane links the box's disk into the jail and calls <code>PATCH /drives/data</code> with the new path. The <a href="https://github.com/firecracker-microvm/firecracker/blob/v1.18.0/docs/api_requests/patch-block.md" target="_blank" rel="noopener noreferrer">block update docs</a> describe exactly this placeholder pattern, with one rule: the guest must not have the device mounted or be reading it while you swap. The golden VM never touched it, so that holds. The agent then mounts <code>LABEL=hrr-data</code> on <code>/data</code>. The label matters, because device names like <code>/dev/vdb</code> depend on the order the drives were added.</p>

<p>The rootfs is disposable. Resetting a box means throwing away its reflinked rootfs and taking a fresh slot. <code>/data</code> outlives that, and it outlives <code>DELETE /boxes/:id</code> too, until you add a volume API to remove it.</p>

<p>Pausing a box stops its vCPUs but keeps all its RAM. For boxes idle long enough to matter, hibernate them to disk:</p>

<pre><code class="language-bash"># Idle for a long time: write the box to disk, then free its RAM
fc PATCH /vm '{&quot;state&quot;: &quot;Paused&quot;}'
fc PUT /snapshot/create '{&quot;snapshot_type&quot;: &quot;Full&quot;,
                          &quot;snapshot_path&quot;: &quot;/box.vmstate&quot;,
                          &quot;mem_file_path&quot;: &quot;/box.mem&quot;}'
# move box.vmstate, box.mem, rootfs.ext4 and box.ext4 somewhere safe, then hrr-slot-down.sh
# Waking it later = a fresh jail with the same relative paths + PUT /snapshot/load.
# Each hibernation snapshot is loaded once, which is the safe pattern in snapshot-support.md.</code></pre>

<h2>The control plane: POST /boxes without a boot</h2>

<p>This is the whole API for one host. Claiming a box is a hard link and three Firecracker calls: write the identity to MMDS, resume, and swap the data disk. That's why the target of under a second is realistic. It's a target, though. I haven't measured it.</p>

<p>The control plane also owns the lifecycle (pause, resume, destroy, idle timeout), per-second metering, and a per-owner quota.</p>

<pre><code class="language-typescript">// hrr_boxd.ts: the control plane for one host. Node 22+, runs as root next to the jails.
import http from &quot;node:http&quot;;
import { execFile } from &quot;node:child_process&quot;;
import { promisify } from &quot;node:util&quot;;
import { randomUUID } from &quot;node:crypto&quot;;
import { readFile } from &quot;node:fs/promises&quot;;

const run = promisify(execFile);
const HRR_POOL_TARGET = 8;
const HRR_IDLE_MS = 15 * 60_000;
const HRR_MAX_BOXES_PER_OWNER = 5;
const HRR_KEYS = new Map&lt;string, string&gt;(Object.entries(JSON.parse(process.env.HRR_API_KEYS ?? &quot;{}&quot;)));

type HrrSlot = { slot: number; sock: string };
type HrrBox = HrrSlot &amp; {
  id: string;
  owner: string;
  state: &quot;running&quot; | &quot;paused&quot;;
  lastActive: number; // the SSH/HTTP gateway (not shown) bumps this on traffic
  runningMs: number;
  since: number;
  cpuAtClaim: number;
};

class HrrHttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const pool: HrrSlot[] = [];
const boxes = new Map&lt;string, HrrBox&gt;();
const freeSlots: number[] = [];
let nextSlot = 0;
let filling = false;

// One Firecracker API call over the jail's unix socket
function hrr_fc(sock: string, method: &quot;PUT&quot; | &quot;PATCH&quot;, path: string, body: unknown) {
  const data = JSON.stringify(body);
  return new Promise&lt;void&gt;((resolve, reject) =&gt; {
    const req = http.request(
      {
        socketPath: sock,
        method,
        path,
        headers: { &quot;Content-Type&quot;: &quot;application/json&quot;, &quot;Content-Length&quot;: Buffer.byteLength(data) },
      },
      (res) =&gt; {
        let out = &quot;&quot;;
        res.on(&quot;data&quot;, (chunk) =&gt; (out += chunk));
        res.on(&quot;end&quot;, () =&gt;
          (res.statusCode ?? 500) &lt; 300
            ? resolve()
            : reject(new Error(`${method} ${path} ${res.statusCode}: ${out}`)),
        );
      },
    );
    req.on(&quot;error&quot;, reject);
    req.end(data);
  });
}

async function hrr_fill_pool() {
  if (filling) return;
  filling = true;
  try {
    while (pool.length &lt; HRR_POOL_TARGET) {
      const slot = freeSlots.pop() ?? nextSlot++;
      if (slot &gt; 253) break; // 254 is the golden VM; the /30 scheme runs out after that
      await run(&quot;/usr/local/sbin/hrr-slot-up.sh&quot;, [String(slot)]);
      pool.push({ slot, sock: `/srv/jailer/firecracker/hrr-slot-${slot}/root/run/firecracker.socket` });
    }
  } finally {
    filling = false;
  }
}

function hrr_refill() {
  hrr_fill_pool().catch((err) =&gt; console.error(&quot;pool refill failed&quot;, err));
}

async function hrr_cpu_seconds(slot: number) {
  // jailer + cgroup v2: &lt;cgroup root&gt;/&lt;parent-cgroup, default &quot;firecracker&quot;&gt;/&lt;id&gt;
  const stat = await readFile(`/sys/fs/cgroup/firecracker/hrr-slot-${slot}/cpu.stat`, &quot;utf8&quot;);
  return Number(/^usage_usec (\d+)$/m.exec(stat)?.[1] ?? 0) / 1e6;
}

function hrr_set_state(box: HrrBox, next: HrrBox[&quot;state&quot;]) {
  const now = Date.now();
  if (box.state === &quot;running&quot;) box.runningMs += now - box.since;
  box.state = next;
  box.since = now;
}

function hrr_billable_seconds(box: HrrBox) {
  const live = box.state === &quot;running&quot; ? Date.now() - box.since : 0;
  return Math.ceil((box.runningMs + live) / 1000);
}

async function hrr_create_box(owner: string) {
  const mine = [...boxes.values()].filter((b) =&gt; b.owner === owner).length;
  if (mine &gt;= HRR_MAX_BOXES_PER_OWNER) throw new HrrHttpError(429, &quot;box quota reached&quot;);
  const slot = pool.shift();
  if (!slot) throw new HrrHttpError(503, &quot;warm pool empty, retry shortly&quot;);
  hrr_refill();

  const id = `box-${randomUUID().slice(0, 8)}`;
  try {
    await run(&quot;/usr/local/sbin/hrr-data-attach.sh&quot;, [id, String(slot.slot)]);
    // The MMDS data store isn't in the snapshot, so this is where a clone learns who it is
    await hrr_fc(slot.sock, &quot;PUT&quot;, &quot;/mmds&quot;, { box: { id, owner, claimedAt: new Date().toISOString() } });
    await hrr_fc(slot.sock, &quot;PATCH&quot;, &quot;/vm&quot;, { state: &quot;Resumed&quot; });
    // Swap the placeholder for the real disk; the agent mounts LABEL=hrr-data when it appears
    await hrr_fc(slot.sock, &quot;PATCH&quot;, &quot;/drives/data&quot;, { drive_id: &quot;data&quot;, path_on_host: &quot;/box.ext4&quot; });
  } catch (err) {
    await run(&quot;/usr/local/sbin/hrr-slot-down.sh&quot;, [String(slot.slot)]).catch(() =&gt; {});
    freeSlots.push(slot.slot);
    throw err;
  }

  const now = Date.now();
  const box: HrrBox = {
    ...slot, id, owner, state: &quot;running&quot;, lastActive: now, runningMs: 0, since: now,
    cpuAtClaim: await hrr_cpu_seconds(slot.slot),
  };
  boxes.set(id, box);
  return box;
}

async function hrr_pause(box: HrrBox) {
  await hrr_fc(box.sock, &quot;PATCH&quot;, &quot;/vm&quot;, { state: &quot;Paused&quot; });
  hrr_set_state(box, &quot;paused&quot;);
}

async function hrr_resume(box: HrrBox) {
  await hrr_fc(box.sock, &quot;PATCH&quot;, &quot;/vm&quot;, { state: &quot;Resumed&quot; });
  hrr_set_state(box, &quot;running&quot;);
  box.lastActive = Date.now();
}

async function hrr_destroy(box: HrrBox) {
  const cpu = (await hrr_cpu_seconds(box.slot)) - box.cpuAtClaim;
  hrr_set_state(box, &quot;paused&quot;); // closes the open running interval
  console.log(JSON.stringify({ usage: box.id, owner: box.owner, seconds: hrr_billable_seconds(box), cpu }));
  await run(&quot;/usr/local/sbin/hrr-slot-down.sh&quot;, [String(box.slot)]);
  boxes.delete(box.id);
  freeSlots.push(box.slot);
}

function hrr_auth(req: http.IncomingMessage) {
  const key = req.headers.authorization?.replace(/^Bearer /, &quot;&quot;);
  const owner = key ? HRR_KEYS.get(key) : undefined;
  if (!owner) throw new HrrHttpError(401, &quot;bad api key&quot;);
  return owner;
}

// Idle reaper. Pausing stops the CPU meter; it doesn't give the RAM back.
setInterval(() =&gt; {
  for (const box of boxes.values()) {
    if (box.state === &quot;running&quot; &amp;&amp; Date.now() - box.lastActive &gt; HRR_IDLE_MS) {
      hrr_pause(box).catch((err) =&gt; console.error(box.id, err));
    }
  }
}, 1000);

http
  .createServer(async (req, res) =&gt; {
    const reply = (status: number, body: unknown) =&gt;
      res.writeHead(status, { &quot;Content-Type&quot;: &quot;application/json&quot; }).end(JSON.stringify(body));
    try {
      const owner = hrr_auth(req);
      if (req.method === &quot;POST&quot; &amp;&amp; req.url === &quot;/boxes&quot;) {
        const box = await hrr_create_box(owner);
        return reply(201, {
          id: box.id,
          ssh: `ssh ${box.id}@ssh.boxes.example.dev`,
          http: `https://${box.id}.boxes.example.dev`,
        });
      }
      const [, root, id, action] = (req.url ?? &quot;&quot;).split(&quot;/&quot;); // /boxes/:id[/:action]
      const box = root === &quot;boxes&quot; &amp;&amp; id ? boxes.get(id) : undefined;
      if (!box || box.owner !== owner) return reply(404, { error: &quot;no such box&quot; });

      if (req.method === &quot;POST&quot; &amp;&amp; action === &quot;pause&quot;) await hrr_pause(box);
      else if (req.method === &quot;POST&quot; &amp;&amp; action === &quot;resume&quot;) await hrr_resume(box);
      else if (req.method === &quot;DELETE&quot; &amp;&amp; !action) await hrr_destroy(box);
      else if (req.method !== &quot;GET&quot; || action) return reply(405, { error: &quot;unsupported&quot; });

      return reply(200, { id: box.id, state: box.state, billableSeconds: hrr_billable_seconds(box) });
    } catch (err) {
      reply(err instanceof HrrHttpError ? err.status : 500, { error: (err as Error).message });
    }
  })
  .listen(8080, &quot;127.0.0.1&quot;, hrr_refill);</code></pre>

<p>Some choices in there worth calling out:</p>

<ul>
  <li><strong>Metering has two numbers.</strong> <code>billableSeconds</code> is wall time while running, rounded up to the second. <code>cpu</code> comes from the slot's cgroup v2 <code>cpu.stat</code> <code>usage_usec</code>, minus whatever was spent restoring before the claim. Bill on either. Vercel <a href="https://vercel.com/docs/vercel-sandbox" target="_blank" rel="noopener noreferrer">bills Sandbox CPU</a> on active CPU time and memory on what's provisioned, which is the second model.</li>
  <li><strong>The idle timeout pauses, it doesn't destroy.</strong> InstaBox's <a href="https://instabox.sh/docs/idle-suspend.md" target="_blank" rel="noopener noreferrer">idle docs</a> pause after 30 idle minutes and keep memory and processes. Mine pauses at 15 and leaves hibernation to a second, slower timer.</li>
  <li><strong>A failed claim burns the slot.</strong> If any Firecracker call fails halfway, that VM is in an unknown state. Tear it down and let the pool refill.</li>
  <li><strong>Pool refills never crash the process.</strong> <code>hrr_refill</code> catches errors from the slot script. An unhandled rejection there would take the whole API down with it.</li>
  <li><strong>State lives in memory.</strong> Restart the process and you lose track of running boxes. A real version keeps boxes in a database and reconciles against <code>/srv/jailer</code> on startup.</li>
</ul>

<h2>What I'd check first on real hardware</h2>

<p>Everything above follows the v1.18.0 docs, but these are the parts I'd test first, because the docs don't spell them out:</p>

<ul>
  <li>That the jailer accepts a value with a space in <code>--cgroup "cpu.max=200000 100000"</code>. If it doesn't, create the cgroup yourself and use <code>--parent-cgroup</code>.</li>
  <li>That Firecracker creates its socket in <code>/run</code> inside the jail with the directory pre-created and owned by the slot's uid, as the script assumes.</li>
  <li>That <code>PATCH /drives</code> right after resume, before the agent touches the device, behaves like the documented post-boot case.</li>
  <li>The real numbers on your instance type: slot build time, claim latency, and how many paused 1 GiB clones fit before page cache pressure starts hurting restores.</li>
</ul>

<h2>Going further, depending on your job</h2>

<h3>If you're a DevOps engineer like me</h3>

<ul>
  <li><strong>Harden the host before you tune it.</strong> The <a href="https://github.com/firecracker-microvm/firecracker/blob/v1.18.0/docs/prod-host-setup.md" target="_blank" rel="noopener noreferrer">production guide</a> recommends disabling SMT and Kernel Samepage Merging for multi-tenant hosts, turning swap off, loading microcode early, and running one tenant per Firecracker process. Do those first, then measure.</li>
  <li><strong>Keep host logging quiet.</strong> The same guide describes a setup where turning on host console logging slowed snapshot restore from 3 ms to 8.5 ms on aarch64, because creating TAP devices logged to a slow console. It recommends <code>quiet loglevel=1</code> on the host kernel command line.</li>
  <li><strong>Watch the boxes, not just the host.</strong> Firecracker v1.17 added <code>emit_id</code> to <a href="https://github.com/firecracker-microvm/firecracker/blob/v1.18.0/docs/metrics.md" target="_blank" rel="noopener noreferrer">metrics</a>, so each line carries the microVM ID. Add cgroup <code>cpu.stat</code> and <code>memory.current</code> per slot, the nft counters on the drop rules, and alert on the <code>lost-logs</code> and <code>lost-metrics</code> counters.</li>
  <li><strong>Run a watchdog.</strong> The production guide recommends an outside process that finds unresponsive Firecracker processes and kills them with SIGKILL, because the custom signal handlers can deadlock in rare cases.</li>
  <li><strong>Treat the golden snapshot as a build artifact.</strong> Snapshots must be resumed on <a href="https://github.com/firecracker-microvm/firecracker/blob/v1.18.0/docs/snapshotting/snapshot-support.md#where-can-i-resume-my-snapshots" target="_blank" rel="noopener noreferrer">identical software and hardware</a>. Key it by Firecracker version, host kernel and instance family, rebuild it on every upgrade, and roll hosts instead of upgrading them in place.</li>
</ul>

<h3>If you're a cloud engineer</h3>

<ul>
  <li><strong>Keep each fleet on one instance family.</strong> A snapshot from one CPU generation won't restore on another. That makes "whatever metal is cheapest today" a bad scaling policy, and it's a reason to pick one family per region and stay on it.</li>
  <li><strong>Graviton is an option on metal.</strong> v1.17 <a href="https://github.com/firecracker-microvm/firecracker/blob/v1.18.0/CHANGELOG.md" target="_blank" rel="noopener noreferrer">added support</a> for Graviton5 <code>m9g.metal-48xl</code>. It isn't an option for nested virtualization, where AWS's list is Intel-only.</li>
  <li><strong>Decide where <code>/data</code> survives.</strong> On local NVMe, a box's data dies with the host. If that's not OK, copy <code>/data</code> to S3 on hibernate and pull it back on wake, or pin each box to a host and accept the risk. Make that choice before your first user stores something they care about.</li>
  <li><strong>Plan for a shared egress IP.</strong> With NAT, every box on a host leaves through the host's address. One abusive box can get that IP blocked for every box on the host. If you need clean IPs per customer, that's a separate NAT or Elastic IP design.</li>
</ul>

<h3>If you're a backend or full-stack engineer</h3>

<ul>
  <li><strong>Make <code>POST /boxes</code> idempotent.</strong> Accept an <code>Idempotency-Key</code> header and return the same box on a retry. Agents retry a lot, and a duplicated box is a quota leak.</li>
  <li><strong>Return 503 with <code>Retry-After</code> when the pool is empty.</strong> Don't hold the request open for a cold boot. The client can wait better than your API can.</li>
  <li><strong>Put the agent API on vsock.</strong> Exec, file upload and port forwarding from the control plane over <a href="https://github.com/firecracker-microvm/firecracker/blob/v1.18.0/docs/vsock.md" target="_blank" rel="noopener noreferrer">vsock</a> don't need the guest network at all. Remember that the snapshot closes vsock connections, so reconnect after every restore.</li>
  <li><strong>Keep a usage ledger.</strong> Write every state change with a timestamp to a table, and compute bills from that, not from a counter in memory like my example.</li>
</ul>

<h3>If you're building this as a business</h3>

<ul>
  <li><strong>Cost per box-hour is a division.</strong> Take the host's hourly price from the <a href="https://aws.amazon.com/ec2/pricing/on-demand/" target="_blank" rel="noopener noreferrer">EC2 pricing page</a> and divide by how many boxes you can actually fit. RAM is usually the limit, so that number depends on overcommit: the shared <code>snap.mem</code> pages, the <a href="https://github.com/firecracker-microvm/firecracker/blob/v1.18.0/docs/ballooning.md" target="_blank" rel="noopener noreferrer">balloon device</a> with free page reporting, and how aggressively you hibernate. CPU oversubscription is on by default in Firecracker, so CPU density is a policy choice, not a hard limit.</li>
  <li><strong>Paused isn't free.</strong> A paused box burns no CPU but holds all its RAM. Price idle time accordingly, or hibernate it.</li>
  <li><strong>Free tiers attract crypto miners.</strong> Cap CPU with <code>cpu.max</code>, alert on boxes that sit at their cap for an hour, put free-tier egress behind the allowlist proxy, and keep the fixed idle pause. InstaBox fixes the free plan's idle timeout at 30 minutes, while paid plans can change it.</li>
  <li><strong>Noisy neighbours are mostly disk and network.</strong> Firecracker has token-bucket <a href="https://github.com/firecracker-microvm/firecracker/blob/v1.18.0/docs/api_requests/patch-block.md" target="_blank" rel="noopener noreferrer">rate limiters</a> on every block and network device. The production guide warns that one box writing heavily can fill the host page cache and slow everyone else's I/O. Set limits per plan from day one, because adding them later feels like a downgrade to existing users.</li>
</ul>

<p>Hope you enjoyed this one. If you've run Firecracker in production and one of my assumptions above breaks on real hardware, I'd like to hear which one.</p>

<p>Find me on X at <a href="https://x.com/harundotdev" target="_blank" rel="noopener noreferrer">https://x.com/harundotdev</a>, and grab every other link from my bio at <a href="https://harun.dev/bio" target="_blank" rel="noopener noreferrer">https://harun.dev/bio</a>.</p>
