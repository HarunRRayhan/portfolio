---
title: "I Stopped Putting an ALB in Front of My Private MCP Just for TLS"
slug: "agentcore-gateway-private-ca-without-the-alb"
brief: "AgentCore Gateway can now trust your private CA on VPC Lattice MCP, OpenAPI, and HTTP targets. Here is the API shape, what Terraform still cannot express, and the expiry alarm I would add."
publishedAt: "2026-10-05T07:00:00.000Z"
readTimeInMinutes: 9
coverImageUrl: "/blog-assets/agentcore-gateway-private-ca-without-the-alb/cover.jpg"
reactionCount: 0
responseCount: 0
replyCount: 0
tags:
  - name: MCP
    slug: mcp
  - name: AWS
    slug: aws
  - name: Terraform
    slug: terraform
  - name: Security
    slug: security
  - name: AI
    slug: ai
---

<p>The MCP server was already inside the VPC. <code>hrr-mcp.internal.example.com</code> presented a certificate from our own CA, the security group only allowed the Lattice ENIs, and nothing about that host was meant to be reachable from the internet.</p>

<p>AgentCore Gateway still refused the handshake. By default it trusts public certificate authorities only. A private CA looks the same as a cert it has never heard of. The documented fix, until October 2, 2026, was an internal Application Load Balancer with a public ACM certificate in front of the server, and <code>routing_domain</code> set to that ALB's DNS name.</p>

<p>That worked. It also meant a load balancer, a listener, a target group, and a public name for a server that was never supposed to have one. The ALB existed so the gateway would trust a certificate. It did not exist because I needed to balance anything.</p>

<p>On October 2, AWS shipped the other option. You register the private CA on the gateway target. The gateway fetches the PEM from S3 or Secrets Manager and uses it as the trust anchor for that target. No ALB in the middle.</p>

<h2>What October 2 actually changed</h2>

<p>This is outbound TLS from AgentCore Gateway to a target on a VPC Lattice private endpoint. Lambda invoke is a different path, and so is inbound auth for the client talking to the gateway.</p>

<p>You don't paste the certificate into the API request. You store a PEM and pass a reference. On create or update, the gateway reads that object with the gateway execution role, checks it, encrypts it with the gateway's own KMS key, and keeps it as the trust anchor for outbound connections to that one target.</p>

<p>The PEM has to be a CA certificate. Basic constraints must say <code>CA:TRUE</code>. A leaf certificate gets rejected. The file, chain included, has to be 16 KB or smaller. If it lives in S3, the object has to be in the same Region as the gateway. A chain is allowed. The gateway tracks the earliest <code>notAfter</code> in the file, so an intermediate that expires first is the one that matters.</p>

<h2>Which targets can use it</h2>

<p>Private CA trust only applies when the target already has a <code>privateEndpoint</code>, managed Lattice or self-managed. These are the types AWS lists.</p>

<table>
<thead>
<tr>
<th>Target</th>
<th>Private CA on the target</th>
</tr>
</thead>
<tbody>
<tr>
<td>MCP server (<code>mcp.mcpServer</code>)</td>
<td>Yes</td>
</tr>
<tr>
<td>OpenAPI (<code>mcp.openApiSchema</code>)</td>
<td>Yes. One domain per target. A spec with several server hosts is a support case, not a second config block.</td>
</tr>
<tr>
<td>HTTP proxy (<code>http.passthrough</code>)</td>
<td>Yes</td>
</tr>
<tr>
<td>Lambda</td>
<td>No. The gateway invokes the function. There is no customer TLS handshake to trust.</td>
</tr>
<tr>
<td>Smithy</td>
<td>No <code>privateEndpoint</code> on Smithy targets today.</td>
</tr>
<tr>
<td>API Gateway as a native REST target</td>
<td>No private endpoint on that target type. Export the API as OpenAPI and attach that schema instead.</td>
</tr>
</tbody>
</table>

<p>If the tool is a Lambda in a private subnet, you do not need this feature. If the tool is an MCP server or an HTTP API you run yourself, and that process presents your CA, this is the feature.</p>

<h2>Register the CA on the target</h2>

<p><code>certificateConfigurations</code> is an array with exactly one entry. That entry sets exactly one source, <code>s3</code> or <code>secretsManager</code>. Two sources, or an empty array with both keys, fails immediately. The gateway checks the URI, the secret ARN, and the account id before it accepts the request. Everything else waits.</p>

<p>This is the MCP target I would create, with the CA in S3. Names are examples.</p>

<pre><code class="language-json">{
  &quot;name&quot;: &quot;hrr-private-mcp&quot;,
  &quot;privateEndpoint&quot;: {
    &quot;managedVpcResource&quot;: {
      &quot;vpcIdentifier&quot;: &quot;vpc-0abc123def456&quot;,
      &quot;subnetIds&quot;: [&quot;subnet-0abc123&quot;, &quot;subnet-0def456&quot;],
      &quot;endpointIpAddressType&quot;: &quot;IPV4&quot;,
      &quot;securityGroupIds&quot;: [&quot;sg-0abc123def&quot;]
    }
  },
  &quot;targetConfiguration&quot;: {
    &quot;mcp&quot;: {
      &quot;mcpServer&quot;: {
        &quot;endpoint&quot;: &quot;https://hrr-mcp.internal.example.com/mcp&quot;
      }
    }
  },
  &quot;certificateConfigurations&quot;: [
    {
      &quot;s3&quot;: {
        &quot;uri&quot;: &quot;s3://hrr-agentcore-ca/private-ca.pem&quot;,
        &quot;bucketOwnerAccountId&quot;: &quot;111122223333&quot;
      }
    }
  ]
}</code></pre>

<p><code>bucketOwnerAccountId</code> is optional. When you set it, S3 checks that the bucket owner is that account. I set it. A wrong bucket in another account should fail the read, not silently trust whatever object happens to be at that key.</p>

<p>Secrets Manager is the same shape, with a string secret, not a binary one. OpenAPI targets use it the same way. The schema's server URL still has to be the private host.</p>

<pre><code class="language-json">&quot;certificateConfigurations&quot;: [
  {
    &quot;secretsManager&quot;: {
      &quot;secretArn&quot;: &quot;arn:aws:secretsmanager:us-west-2:111122223333:secret:hrr/agentcore/private-ca-AbCdEf&quot;
    }
  }
]</code></pre>

<p>To drop the private CA later, call <code>UpdateGatewayTarget</code> and leave <code>certificateConfigurations</code> out. The target goes back to public CAs only. A failed update doesn't swap the cert. If validation of the new PEM fails, the target stays on the certificate it already trusted.</p>

<h2>Terraform still documents the ALB</h2>

<p>I checked <code>aws_bedrockagentcore_gateway_target</code> on the current HashiCorp AWS provider docs before writing this. <code>private_endpoint</code> is there. <code>certificate_configurations</code> is not. The registry page still tells you to put an internal ALB in front and set <code>routing_domain</code> to the ALB DNS name when the server uses a private certificate.</p>

<p>So this is what Terraform can express today. It is the workaround, not the October 2 path.</p>

<pre><code class="language-hcl">resource &quot;aws_bedrockagentcore_gateway_target&quot; &quot;hrr_mcp&quot; {
  gateway_identifier = aws_bedrockagentcore_gateway.hrr.gateway_id
  name               = &quot;hrr-private-mcp-via-alb&quot;

  target_configuration {
    mcp {
      mcp_server {
        endpoint = &quot;https://hrr-mcp.example.com/mcp&quot;
      }
    }
  }

  private_endpoint {
    managed_vpc_resource {
      vpc_identifier           = aws_vpc.hrr.id
      subnet_ids               = aws_subnet.hrr[*].id
      endpoint_ip_address_type = &quot;IPV4&quot;
      routing_domain           = aws_lb.hrr_mcp.dns_name
    }
  }
}</code></pre>

<p>The endpoint host has to match the public ACM certificate on that ALB. <code>routing_domain</code> is where Lattice actually sends the traffic.</p>

<p>Until the provider grows an argument for <code>certificateConfigurations</code>, I would create the private-endpoint target in Terraform and register the CA with <code>aws bedrock-agentcore-control update-gateway-target</code>, or whatever the CLI name is in the version you have. Check it. Don't invent a Terraform block the provider will reject. If a later provider release adds the argument, move the PEM reference into the resource and delete the extra CLI step. Two writers for the same field will fight.</p>

<h2>The execution role has to read the PEM</h2>

<p>The gateway assumes its execution role to fetch the certificate. Trust <code>bedrock-agentcore.amazonaws.com</code>. Then grant the read on the one object, not the bucket.</p>

<pre><code class="language-json">{
  &quot;Version&quot;: &quot;2012-10-17&quot;,
  &quot;Statement&quot;: [
    {
      &quot;Effect&quot;: &quot;Allow&quot;,
      &quot;Action&quot;: &quot;s3:GetObject&quot;,
      &quot;Resource&quot;: &quot;arn:aws:s3:::hrr-agentcore-ca/private-ca.pem&quot;
    }
  ]
}</code></pre>

<p>Secrets Manager is <code>secretsmanager:GetSecretValue</code> on that secret ARN. If the object or the secret uses a customer managed KMS key, the same role needs <code>kms:Decrypt</code> on that key. Miss this and the API response still looks fine. The target fails a minute later, when the async check can't read the PEM.</p>

<p>A <code>privateEndpoint</code> target also can't use <code>NO_AUTH</code> as the gateway's inbound authorizer unless you attach an interceptor Lambda. That rule was already true before private CAs. The CA doesn't relax it.</p>

<h2>READY is not instant</h2>

<p>Most certificate checks are asynchronous. Create or update returns, then the target workflow reads the PEM.</p>

<p>Success is status <code>READY</code>. A bad create lands on <code>FAILED</code>. A bad update lands on <code>UPDATE_UNSUCCESSFUL</code>, and the previous certificate keeps serving. <code>statusReasons</code> is where the boring failures show up: no private endpoint, unsupported target type, missing S3 object or secret, expired cert, not a CA, file over 16 KB.</p>

<p>The synchronous rejects are narrower. Each entry must set exactly one of <code>s3</code> or <code>secretsManager</code>, and the URI, ARN, and account id have to look valid. Those come back on the request. Everything else is a status you have to poll.</p>

<p>At call time the server certificate has to chain to the CA you registered, sit inside its validity window, and carry a subject alternative name that matches the target host. A mismatch is a client-side configuration error from the gateway, not a service fault. I would log the target host and the SAN next to each other before I touched IAM again.</p>

<h2>Revocation does not mean what you think</h2>

<p>The gateway doesn't check CRLs, and it doesn't do OCSP. If your CA revokes a server certificate, the gateway keeps trusting it until that certificate expires, as long as it still chains to the CA you configured and the hostname matches.</p>

<p>To stop trusting it, update the target. Pass a new PEM that no longer includes that CA, or omit <code>certificateConfigurations</code> and go back to public CAs. There's no revoke API on the gateway.</p>

<p>Even after a good update, an open connection can keep the old trust material. The gateway reuses TLS connections and only checks the certificate on the handshake. That connection can live up to 900 seconds. A rotation is immediate for new connections. In-flight ones can lag a quarter of an hour. If you are rotating because a key leaked, 15 minutes of old handshakes is part of the plan, not a surprise you want at 2 a.m.</p>

<h2>Alarm before the cert expires</h2>

<p>Once a private CA is configured, the gateway emits <code>EarliestCertificateDaysToExpiry</code>. It is the whole number of days until the earliest <code>notAfter</code> in the PEM. A negative value means it already expired. The metric only exists for targets that have a private certificate configured.</p>

<p>When that certificate expires, the next handshake fails and the target is unreachable. Tool calls die. I would alarm when the value drops under 14, on the target that holds <code>hrr-private-mcp</code>, and send it to the SNS topic you already use for gateway failures. Fourteen days is enough time to publish a new PEM and call <code>UpdateGatewayTarget</code>. It's not enough time if the only person who can issue the cert is on leave, so pick the number for your CA.</p>

<p>Inbound auth is a separate problem. A 401 from the gateway, a bad audience, a missing scope: that is the client proving who it is. I wrote that up in <a href="/blog/mcp-authentication-fix-401-remote-server">MCP Authentication Explained: Fix 401 Errors in a Remote MCP Server</a>. Private CA trust never fixes a 401, and a valid token never fixes a handshake to <code>hrr-mcp.internal.example.com</code>.</p>

<p>Hope you enjoyed this one. If you have already deleted the ALB, or the provider grew a <code>certificate_configurations</code> block and I should update the Terraform section, find me on X at <a href="https://x.com/harundotdev">https://x.com/harundotdev</a>.</p>
