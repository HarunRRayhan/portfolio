---
title: "Running OpenClaw on Amazon EC2 with Claude and Telegram"
slug: "running-openclaw-on-amazon-ec2-with-claude-and-telegram"
brief: "I stumbled on OpenClaw a few weeks ago and immediately wanted to try it. The pitch is straightforward: it's an open-source AI gateway that connects LLMs to messaging platforms like Telegram, Discord, "
publishedAt: "2026-03-20T13:02:05.406Z"
readTimeInMinutes: 9
reactionCount: 0
responseCount: 0
replyCount: 0
sourceUrl: "https://web.archive.org/web/*/https://blog.harun.dev/running-openclaw-on-amazon-ec2-with-claude-and-telegram"
coverImageUrl: "https://raw.githubusercontent.com/HarunRRayhan/blog-assets/main/covers/running-openclaw-on-amazon-ec2-with-claude-and-telegram/cover.jpg"
tags:
  - name: "AWS"
    slug: "aws"
  - name: "AI"
    slug: "ai"
  - name: "ec2"
    slug: "ec2"
  - name: "telegram"
    slug: "telegram"
  - name: "Node.js"
    slug: "nodejs"
---
<p>I stumbled on OpenClaw a few weeks ago and immediately wanted to try it. The pitch is straightforward: it's an open-source AI gateway that connects LLMs to messaging platforms like Telegram, Discord, and WhatsApp. You bring your own model, point OpenClaw at it, and suddenly you've got an AI assistant living inside your chat app.</p>
<p>What really pulled me in was the community. Over 13,700 skills contributed by users, MCP integration baked in, support for the A2A protocol, and a workflow engine called Lobster that lets you chain tools together. It felt like someone had taken everything I wanted from a personal AI setup and packaged it into one CLI tool.</p>
<p>So I decided to throw it on an EC2 instance and wire it up to Telegram. The whole thing took about 30 minutes. Here's what I ended up with:</p>
<p><img src="https://raw.githubusercontent.com/HarunRRayhan/blog-assets/main/posts/openclaw-ec2/telegram-demo.png" alt="Telegram bot responding to /help command" /></p>
<p>That's the Telegram bot responding to <code>/help</code>. Sessions, options, status commands, skills. All working. Let me walk you through how I set this up.</p>
<h2>Launching the EC2 Instance</h2>
<p>I originally planned to use a t4g.medium (Graviton ARM64) because the per-hour cost is lower. But I ran into something annoying. The standard Ubuntu 24.04 LTS AMI doesn't support Graviton processors. Only the Ubuntu Pro AMI does, and I didn't want to deal with Pro licensing for a side project. So I went with t3.medium on x86_64 instead. Totally fine for what we're doing here.</p>
<p>Here's the instance config I used:</p>
<ul>
<li><strong>AMI</strong>: Ubuntu 24.04 LTS (x86_64)</li>
<li><strong>Instance type</strong>: t3.medium (2 vCPU, 4 GB RAM)</li>
<li><strong>Storage</strong>: 100 GB gp3</li>
<li><strong>Region</strong>: ap-southeast-1 (Singapore)</li>
</ul>
<p><img src="https://raw.githubusercontent.com/HarunRRayhan/blog-assets/main/posts/openclaw-ec2/ec2-launch.jpg" alt="EC2 launch configuration page" /></p>
<p>Make sure you create or select a key pair for SSH access. You'll need it in a minute.</p>
<p>For the security group, open port 22 for SSH (restricted to your IP). OpenClaw's gateway runs on loopback by default, so you don't need to expose any extra ports to the internet. That's actually a nice security touch.</p>
<p>After clicking Launch, give it about 30 seconds to spin up.</p>
<p><img src="https://raw.githubusercontent.com/HarunRRayhan/blog-assets/main/posts/openclaw-ec2/ec2-running.png" alt="EC2 instance running in the console" /></p>
<p>Once the instance shows "running" with a green dot, grab the public IP and SSH in:</p>
<pre><code class="language-bash">ssh -i ~/.ssh/your-key.pem ubuntu@&lt;your-ec2-ip&gt;
</code></pre>
<p><img src="https://raw.githubusercontent.com/HarunRRayhan/blog-assets/main/posts/openclaw-ec2/ssh-terminal.png" alt="SSH terminal showing Ubuntu welcome message" /></p>
<p>You should see the Ubuntu welcome banner. We're in.</p>
<h2>Installing Node.js and OpenClaw</h2>
<p>First things first, update the system packages. Fresh Ubuntu installs always have a bunch of pending updates:</p>
<pre><code class="language-bash">sudo apt-get update -y &amp;&amp; sudo apt-get upgrade -y
</code></pre>
<p>OpenClaw needs Node.js 22. The version that ships with Ubuntu's default repos is way too old, so we'll use the NodeSource setup script:</p>
<pre><code class="language-bash">curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
</code></pre>
<p>Verify it installed correctly:</p>
<pre><code class="language-bash">node --version   # v22.22.1
npm --version    # 10.9.4
</code></pre>
<p><img src="https://raw.githubusercontent.com/HarunRRayhan/blog-assets/main/posts/openclaw-ec2/node-version.png" alt="Node.js version check in terminal" /></p>
<p>Now install OpenClaw globally:</p>
<pre><code class="language-bash">sudo npm install -g openclaw
</code></pre>
<p>This pulls in about 539 packages. Took roughly 20 seconds on my t3.medium.</p>
<p><img src="https://raw.githubusercontent.com/HarunRRayhan/blog-assets/main/posts/openclaw-ec2/openclaw-install.png" alt="OpenClaw npm install output" /></p>
<p>That's the foundation sorted. Node.js and OpenClaw are ready to go.</p>
<h2>Connecting Claude as Your LLM</h2>
<p>This is where you tell OpenClaw which model to talk to. The cleanest path is to use an Anthropic API key directly. During onboarding, OpenClaw will ask you to pick a provider. Choose <strong>Anthropic</strong>, paste your API key, and select the model you want (I went with <code>claude-sonnet-4</code> for a good balance of speed and quality).</p>
<p>If you don't have an API key yet, head to <a href="https://console.anthropic.com">console.anthropic.com</a> and create one. You'll need some credits loaded on your account.</p>
<p>Now, before we run the onboarding, I want to mention something I tried that's worth knowing about.</p>
<h3>Side Note: Claude Max Proxy</h3>
<p>If you have a Claude Max subscription, there's a tool called <code>claude-max-api-proxy</code> that exposes an OpenAI-compatible API endpoint locally. It piggybacks on your Claude Code authentication so you don't need a separate API key. I set this up and it actually works well at the infrastructure level. The proxy runs as a systemd service, stays up across reboots, and responds to API calls just fine.</p>
<p>Here's how I set it up, in case you want to try it:</p>
<pre><code class="language-bash"># Install Claude Code and the proxy
sudo npm install -g @anthropic-ai/claude-code
sudo npm install -g claude-max-api-proxy
</code></pre>
<p><img src="https://raw.githubusercontent.com/HarunRRayhan/blog-assets/main/posts/openclaw-ec2/claude-code-install.png" alt="Claude Code installation" /></p>
<p>After installing Claude Code, authenticate it by running <code>claude</code> once. It'll open a browser link for OAuth. Once authenticated, you'll see the TUI:</p>
<p><img src="https://raw.githubusercontent.com/HarunRRayhan/blog-assets/main/posts/openclaw-ec2/claude-code-tui.png" alt="Claude Code TUI showing authenticated session" /></p>
<p><img src="https://raw.githubusercontent.com/HarunRRayhan/blog-assets/main/posts/openclaw-ec2/proxy-install.png" alt="claude-max-api-proxy installation" /></p>
<p>Then create a systemd service so the proxy runs in the background:</p>
<pre><code class="language-bash">sudo tee /etc/systemd/system/claude-proxy.service &gt; /dev/null &lt;&lt;EOF
[Unit]
Description=Claude Max API Proxy
After=network.target

[Service]
Type=simple
ExecStart=/usr/bin/claude-max-api
Restart=always
RestartSec=5
User=ubuntu
Environment=HOME=/home/ubuntu

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable claude-proxy
sudo systemctl start claude-proxy
</code></pre>
<pre><code class="language-bash">sudo systemctl status claude-proxy
</code></pre>
<p><img src="https://raw.githubusercontent.com/HarunRRayhan/blog-assets/main/posts/openclaw-ec2/systemd-status.png" alt="systemd showing claude-proxy service active and running" /></p>
<p>The proxy serves on port 3456 and exposes three models:</p>
<p><img src="https://raw.githubusercontent.com/HarunRRayhan/blog-assets/main/posts/openclaw-ec2/curl-models.png" alt="curl showing /v1/models response with three Claude models" /></p>
<p><code>claude-opus-4</code>, <code>claude-sonnet-4</code>, and <code>claude-haiku-4</code>. You can hit it with any OpenAI-compatible client.</p>
<p><strong>However</strong>, there's a catch. As of OpenClaw 2026.3.13, there's an open GitHub issue where custom providers have a serialization bug. Plain text messages get sent to the LLM as <code>[object Object]</code> instead of the actual content. The proxy itself works perfectly (I confirmed this with direct curl tests), but OpenClaw's custom provider handling mangles the payload. So for now, stick with the direct Anthropic API key approach for OpenClaw. The proxy is still useful for other tools that speak the OpenAI format, and this bug will likely get fixed in a future release.</p>
<h2>Setting Up Telegram</h2>
<p>Before running OpenClaw's onboarding, you need a Telegram bot token. Open Telegram, search for <strong>@BotFather</strong>, and start a chat. Send <code>/newbot</code>, pick a display name for your bot, then choose a username (it has to end in "bot"). BotFather will reply with an API token. Copy that token somewhere safe. You'll paste it during onboarding in a second.</p>
<p>Now run the OpenClaw onboarding wizard:</p>
<pre><code class="language-bash">openclaw onboard
</code></pre>
<p>The wizard is interactive but pretty quick once you know what to pick. Choose <strong>Manual</strong> for the setup type, then <strong>Local gateway</strong> since we're running everything on this machine. When it asks for the LLM provider, pick <strong>Anthropic</strong> and paste your <code>ANTHROPIC_API_KEY</code>. I went with <code>claude-sonnet-4</code> for the model, good balance of speed and cost.</p>
<p>For the gateway, I picked Loopback (localhost only) and Token-based auth. Tailscale I left off. Then when it asks about channels, paste your Telegram bot token. Skip the DM access policies and the search provider for now. You can configure both later.</p>
<p>The gateway starts on port 18789, bound to loopback. Nothing outside the machine can reach it directly. Your Telegram bot connects outbound to Telegram's servers, so no inbound ports need to be opened. That's actually a nice default from a security standpoint.</p>
<p>After onboarding finishes, you need to approve the Telegram pairing. OpenClaw generates a pairing code. Run:</p>
<pre><code class="language-bash">openclaw pairing approve telegram &lt;YOUR_PAIRING_CODE&gt;
</code></pre>
<p><img src="https://raw.githubusercontent.com/HarunRRayhan/blog-assets/main/posts/openclaw-ec2/pairing-approved.jpg" alt="Pairing approved confirmation in terminal" /></p>
<p>Once approved, your Telegram bot is live and connected to Claude.</p>
<h2>Running and Testing</h2>
<p>With the pairing approved, open your Telegram bot and send <code>/help</code>. You should see a full command list broken into sections: Session management, Options, Status, and Skills.</p>
<p><img src="https://raw.githubusercontent.com/HarunRRayhan/blog-assets/main/posts/openclaw-ec2/telegram-demo.png" alt="Telegram /help response showing all available commands" /></p>
<p>That response means everything is wired up correctly. The Telegram bot is talking to the OpenClaw gateway, which is sending requests to Claude through the Anthropic API.</p>
<p>Try sending a regular message. Something like "explain how DNS works in two sentences." Claude should respond right in the Telegram chat. The latency depends on your region and the model you picked. With <code>claude-sonnet-4</code> in ap-southeast-1, I was seeing responses in about 3 to 5 seconds for short prompts. Longer conversations take a bit more, obviously.</p>
<p>Once you're in, start poking around. The <code>/session</code> commands are something I kept coming back to. You can name sessions and switch between them, which I found useful when I didn't want a coding thread bleeding into unrelated questions.</p>
<p>The skills system is genuinely impressive. Over 13,700 community-contributed skills, browsable from Telegram with <code>/skills</code>. I spent way too long just scrolling through them. Web search, code execution, all sorts of things you can wire in without writing any code yourself.</p>
<p>One practical note: if you close your SSH session, the OpenClaw gateway stops. For a persistent setup, you'll want to run it as a systemd service or inside a tmux session. I used tmux during my testing because it was quick:</p>
<pre><code class="language-bash">tmux new -s openclaw
openclaw gateway start
# Ctrl+B then D to detach
</code></pre>
<p>Then you can disconnect from SSH and the gateway keeps running. Reconnect later with <code>tmux attach -t openclaw</code>.</p>
<h2>Wrapping Up</h2>
<p>So that's OpenClaw on EC2, talking to Claude, accessible through Telegram. The whole setup took me about 30 minutes, and most of that was the t3.medium pivot and fiddling with the proxy (which, as I mentioned, you can skip entirely by using the Anthropic API key directly).</p>
<p>What I like about this setup is the flexibility. Telegram is just one channel. OpenClaw supports Discord, WhatsApp, and Slack too. You could wire up multiple channels to the same gateway and have Claude available wherever your team already hangs out. The MCP integration means you can connect external tools and data sources. And the Lobster workflow engine opens up automation possibilities that I haven't even started exploring yet.</p>
<p>The t3.medium handles it comfortably. OpenClaw's resource usage is pretty light when idle, and even during active conversations the CPU barely moves. You could probably get away with a t3.small if you wanted to cut costs further, though I haven't tested that personally.</p>
<p>If you're looking for a self-hosted alternative to paying per-seat for AI chat tools, this is worth trying. Throw it on an EC2 instance, connect your Anthropic key, and you've got a private AI assistant that your whole team can reach through Telegram.</p>
<p>Hope you enjoyed this one. If you set up OpenClaw or run into something I didn't cover, find me on Twitter at <a href="https://x.com/HarunRRayhan">https://x.com/HarunRRayhan</a>. Always happy to chat about this stuff.</p>
<p><img src="https://images.pexels.com/photos/7688757/pexels-photo-7688757.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="AI automation technology" />
<sub>Photo by <a href="https://www.pexels.com/@yaroslav-shuraev">Yaroslav Shuraev</a> on <a href="https://www.pexels.com/photo/woman-with-prosthesis-and-smartphone-7688757/">Pexels</a></sub></p>
