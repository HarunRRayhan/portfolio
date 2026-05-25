---
title: "Snapshot and Restore of Amazon Lightsail Instance to Lightsail/EC2"
slug: "snapshot-restore-of-lightsail-instance-to-lightsail-ec2"
brief: "Taking regular backup/snapshots of a production application is important. It is one of the main requirements of a disaster recovery(DR) plan. But snapshots are not only for DR, you can use them to move/clone instances to different regions or availabi..."
publishedAt: "2022-05-12T14:15:58.167Z"
readTimeInMinutes: 5
reactionCount: 0
responseCount: 0
replyCount: 0
sourceUrl: "https://web.archive.org/web/*/https://blog.harun.dev/snapshot-restore-of-lightsail-instance-to-lightsail-ec2"
coverImageUrl: "https://cdn.hashnode.com/res/hashnode/image/upload/v1652364928139/yQ4DEo7dA.png"
tags:
  - name: "AWS"
    slug: "aws"
  - name: "Cloud"
    slug: "cloud"
  - name: "WordPress"
    slug: "wordpress"
  - name: "Laravel"
    slug: "laravel"
  - name: "ec2"
    slug: "ec2"
---
<p>Taking regular backup/snapshots of a production application is important. It is one of the main requirements of a disaster recovery(DR) plan. But snapshots are not only for DR, you can use them to move/clone instances to different regions or availability zone(AZ). Maybe move to a higher spec instance. Or maybe you want to move to Amazon EC2 altogether. </p>
<h2 id="heading-prerequisites">Prerequisites</h2>
<p>You just need an existing Amazon Lightsail instance. Don't worry if you don't have one, follow how to <a target="_blank" href="https://harun.dev/blog/deploy-wordpress-app-to-amazon-lightsail"><strong>Deploy WordPress App to Amazon Lightsail</strong></a>. </p>
<h2 id="heading-take-snapshot-backup">Take Snapshot (Backup)</h2>
<ol>
<li><p>Click on the instance name you want to take a snapshot. All of the instances are listed under the <strong>Instances</strong> tab of the home page. 
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1652276595201/R3KWMrmbY.png" alt="Amazon Lightsail Instances" /></p>
</li>
<li><p>Go to the <strong>Snapshots</strong> tab of your instance page. 
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1652276809173/QeAJzi5B9.png" alt="Amazon Lightsail Instance Snapshot" />
(B) We are going to create a manual snapshot. This one will take a snapshot instantly.
(C) Optionally, you can set up an automatic snapshot too. It will take daily snapshots. </p>
<blockquote>
<p>⚠️ <strong><em>For production instance, always set up an automatic snapshot. </em></strong></p>
</blockquote>
</li>
<li><p>Give it a name and click <strong>Create</strong>. 
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1652277314811/vY0klcQ0u.png" alt="Amazon Lightsail Instance Snapshot" />
It will take some time if this is the first snapshot of the instance, size is another factor. Subsequent snapshots are faster, as it takes incremental backups, only changes from the last snapshot. </p>
</li>
<li><p>Upon completion, it will look like this: 
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1652277636707/z3QUzzdTY.png" alt="Amazon Lightsail Instance Snapshot" /></p>
</li>
<li><p>You will find all of the snapshots in the <strong>Snapshots</strong> tab of the homepage. I have just one: 
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1652277823766/xBicTLwpc.png" alt="Amazon Lightsail all snapshots" /></p>
</li>
</ol>
<h2 id="heading-restore-to-new-amazon-lightsail-instance">Restore to new Amazon Lightsail instance</h2>
<ol>
<li><p>Click on these 👇 three dots: 
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1652278253575/66DQ_Myis.png" alt="Lightsail Snapshot restore menu" /></p>
</li>
<li><p>Click on <strong>Create new instance</strong> from this menu: 
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1652278347973/Lb09a0P_tP.png" alt="Lightsail Snapshot restore menu" /></p>
<blockquote>
<p>ℹ️ You can click on the second item, <strong>Copy to another Region</strong> to literally copy to another region and restore to a new instance there. Snapshot stored in an S3 bucket in the same region where the instance launched. You can't access the S3 bucket as it's managed by AWS. To restore a snapshot to a new instance in another region, you have to copy it first.</p>
</blockquote>
</li>
<li><p>The page looks familiar, right? It's the same create instance page.
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1652279009412/Z5_gktIsy.png" alt="Create an instance from a snapshot in Amazon Lightsail" />
(A) You can change the availability zone(AZ) if you want. It's great if you are using multiple instances for horizontal scaling, gives high availability(HA). 
(B) Choose an instance the same size or larger than the source. Choose larger for vertical scaling. If you need a larger instance than you originally have, this is the way.
(C) Give it a name, and 
(D) Click the <strong>Create instance</strong> button from the bottom of the page.</p>
</li>
</ol>
<p>Wait a moment, maybe a few minutes. Congratulations 🎉 you just restored your instance. </p>
<p>...</p>
<h2 id="heading-copy-to-another-region">Copy to another Region</h2>
<p>Snapshot stored in an S3 bucket in the same region where the instance launched. You can't access the S3 bucket as it's managed by AWS. To restore a snapshot to a new instance in another region, you have to copy it first. Let's copy it to another region.</p>
<ol>
<li><p>Go to the <strong>Snapshots</strong> tab of the homepage. Find your instance and snapshot. Click the three dots. And then click <strong>Copy to another Region</strong>:
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1652280120596/KG3CA5XoC.png" alt="Copy snapshot to another Region in Amazon Lightsail" /></p>
</li>
<li><p>(A) Choose the region you want to copy the snapshot, (B) give it a name, and (C) click the <strong>Copy snapshot</strong> button from the bottom of the page. 
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1652279993049/8ENAFcW2C.png" alt="Copy snapshot to another Region in Amazon Lightsail" /></p>
</li>
<li><p>It will take a few minutes to copy the snapshot.</p>
</li>
</ol>
<p>...</p>
<h2 id="heading-restoreexport-to-amazon-ec2-instance">Restore/Export to Amazon EC2 instance</h2>
<ol>
<li><p>Click three dots from the snapshot menu you want to restore to EC2 and click the <strong>Export to Amazon EC2</strong> menu item 
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1652281038616/V9usMFaL7.png" alt="Export to Amazon EC2" /></p>
</li>
<li><p>Click the <strong>Yes, continue</strong> button in the popup. Click <strong>Acknowledge</strong> in the next popup.
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1652281327886/UOQteEtmX.png" alt="Export to Amazon EC2" /></p>
<blockquote>
<p>⚠️ If you are not in the free-tier or cross the free-tier limit, you may get charged for this. If you are not sure, don't do it. Just follow my demo.</p>
</blockquote>
</li>
<li><p>You will see a task running like this ↓. Wait for a while to finish. A small snapshot wouldn't take much time. 
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1652281563424/lc_Mz-K0d.png" alt="Export to Amazon EC2" /></p>
</li>
<li><p>After the copy task is completed, go to <a target="_blank" href="https://us-east-1.console.aws.amazon.com/ec2/v2/home?region=us-east-1#Snapshots:">Snapshots of EC2 Management Console</a>. Choose the correct region. You should see your snapshot there.</p>
</li>
<li><p>Select the snapshot and click the <strong>Create image from snapshot</strong> from the <strong>Actions</strong> menu 
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1652281992820/AGSDZSL0V.png" alt="Snapshots on EC2 Management Console" /></p>
</li>
<li><p>Give the name of the image and click the <strong>Create image</strong> button from the bottom of the page
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1652282168870/rem3kb_a1.png" alt="Snapshots on EC2 Management Console" /></p>
</li>
<li><p>Now go to <a target="_blank" href="https://us-east-1.console.aws.amazon.com/ec2/v2/home?region=us-east-1#Images:visibility=owned-by-me">AMIs page of EC2 Management Console</a>. Choose the correct region, N. Virginia (us-east-1) in my case. You should see all of your AMIs.</p>
</li>
<li><p>Select the AMIs you just created and click the <strong>Lunch Instance from AMI</strong> button in the top right corner. 
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1652362498403/WWWDZ_9xk.png" alt="CleanShot 2022-05-12 at 19.34.19@2x.png" /></p>
</li>
<li><p>You will see a traditional EC2 Lunch page: 
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1652363162708/wxsZxlGt6.png" alt="CleanShot 2022-05-12 at 19.44.03@2x.png" />
(A) Give your instance a name. (B) Choose an instance type, for my case, it's free tier eligible t2.micro. (C) Choose existing key pair or create a new one. You need it to log in via SSH. (D) Check the ports you want to open, in my case I selected all of them. </p>
</li>
</ol>
<p>Now, click the <strong>Lunch instance</strong> button from the right sidebar. Wait for a while to instance state to become <strong><em>Running</em></strong> and Status check <strong><em>2/2 checks passed</em></strong>. </p>
<ol>
<li>You will see the EC2 Instances page like this:
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1652363823997/TMySzalyO.png" alt="CleanShot 2022-05-12 at 19.56.19@2x.png" />
Select the instance. Copy the public IP address and try it in the browser. You should see the same page as Amazon Lightsail instance. </li>
</ol>
<blockquote>
<p>ℹ️ Manual snapshots will not be deleted even if you delete the instance. So, don't forget to delete unnecessary snapshots to save bills.</p>
</blockquote>
<p>...</p>
<h2 id="heading-conclusion">Conclusion</h2>
<p>Hope you enjoyed this article. Ask your questions in the comment. Subscribe to my newsletter to get weekly updates. </p>
