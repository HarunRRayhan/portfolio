---
title: "First 3 things I always do after creating a new AWS account"
slug: "first-3-things-i-always-do-after-creating-a-new-aws-account"
brief: "As part of my job, I create AWS accounts frequently. I do lots of things depending on account needs before starting to use it. I found 3 common things I do with all of the new AWS accounts. I made a checklist. Nowadays I do these 3 things first and t..."
publishedAt: "2022-07-06T14:18:18.492Z"
readTimeInMinutes: 5
reactionCount: 0
responseCount: 1
replyCount: 1
sourceUrl: "https://web.archive.org/web/*/https://blog.harun.dev/first-3-things-i-always-do-after-creating-a-new-aws-account"
coverImageUrl: "https://cdn.hashnode.com/res/hashnode/image/upload/v1657117059559/5ikTkCN2F.png"
tags:
  - name: "AWS"
    slug: "aws"
  - name: "IAM"
    slug: "iam"
  - name: "Security"
    slug: "security"
  - name: "Amazon Web Services"
    slug: "amazon-web-services"
---
<p>As part of my job, I create AWS accounts frequently. I do lots of things depending on account needs before starting to use it. I found 3 common things I do with all of the new AWS accounts. I made a checklist. Nowadays I do these 3 things first and then everything else. </p>
<p>Let's make your account more secure and more protected than ever. 🔐</p>
<h2 id="heading-1-budget-with-alerts">1. Budget with Alerts</h2>
<p>One of the common issues with AWS is bills. People gets surprising bills because of misconfiguration or keep expensive services running unknowingly. Although, budget and alerts can NOT fix these issues but help keep bills tidy. And gives alerts if crosses the budget almost instantly.</p>
<p>Let's set a budget and a couple of alerts. </p>
<ol>
<li>Go to <a target="_blank" href="https://console.aws.amazon.com/billing/home#/budgets"><strong>Budget Console</strong></a></li>
<li>Click on the "<strong>Create Budget</strong>" button.</li>
<li>Choose the first option, "<strong>Cost budget - Recommended</strong>" from the next page.</li>
<li>From the next page: 
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1656945288308/bIPTXFqTW.png" alt="CleanShot 2022-07-04 at 20.33.25@2x.png" /><ul>
<li>A. Give it a name.</li>
<li>B. Set the Period as <strong>Month</strong> for this demo, but you can choose any other period.</li>
<li>C. Set Budget renewal type as <strong>Recurring budget</strong></li>
<li>D. Choose <strong>Fixed</strong> from the Budgeting method.</li>
<li>E. Give a real budget amount to your need, mine is a demo account so $10 is fine for me. Let me iterate again, choose a real amount.</li>
<li>F. From the bottom-right of the page click "Next"</li>
</ul>
</li>
<li>From the next page, click on the "<strong>Add an alert threshold</strong>. Going to set a couple of alerts. 
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1656945969434/yGqNrA0Eu.png" alt="CleanShot 2022-07-04 at 20.43.58@2x.png" /></li>
<li>Let's set an actual budget alert: 
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1656946180091/ic5styUxa.png" alt="CleanShot 2022-07-04 at 20.48.00@2x.png" /><ul>
<li>A. Choose <strong>80</strong> from the threshold.</li>
<li>B. Select <strong>Actual</strong> from the trigger</li>
<li>C. Put as many real and active emails as necessary. (⚠️ please add active email to save yourself from disaster).</li>
<li>D. Let's add another one.
<em>Actual budget alert only sends notifications when you spent threshold amount. For example, it will send an email to me after spending $8 (80% of 10$). So, we need something else together with it.</em></li>
</ul>
</li>
<li><p>Now set a forecasted budget alert:
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1656946633128/jTqCv7R6K.png" alt="CleanShot 2022-07-04 at 20.55.35@2xa.png" />
Everything is the same as the first alert, only change Trigger to <strong>Forecasted</strong>. So, it will send you an alert if AWS forecast that you will spend more than your threshold.   After configuring it, click the <strong>Next</strong> button from the bottom of the page.</p>
</li>
<li><p>Click the <strong>Next</strong> again from the next page. And then click the <strong>Create Budget</strong> button from the final page.</p>
</li>
</ol>
<p>And you are done with, you probably going to be saved from a disaster by email notifications.</p>
<p>...</p>
<h2 id="heading-2-add-multi-factor-authentication-mfa">2. Add Multi-Factor Authentication (MFA)</h2>
<p>You should use MFA for all IAM accounts including the root account. If not possible, at least apply it to root and privileged accounts. Login to the account (root or IAM) and let's protect it.</p>
<ol>
<li>Go to <a target="_blank" href="https://console.aws.amazon.com/iam/home#/security_credentials$mfa"><strong>Security Credentials of IAM Console</strong></a></li>
<li>Click on the "Assign MFA device" 
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1657111562695/G47bzXcts.png" alt="CleanShot 2022-07-06 at 18.45.13@2x.png" /></li>
<li>Choose <strong>Virtual MFA device</strong> from the popup</li>
<li>You can choose either of these apps: Authy, Duo Mobile, LastPass Authenticator, Microsoft Authenticator, Google Authenticator, Symantec VIP. My personal choice is Authy.</li>
<li>Click on the "Show QR code" from the next popup and scan it from your MFA app. Then enter two codes (one after another). And then click the "Assign MFA" button. 
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1657112093771/vyB0BX5om.png" alt="CleanShot 2022-07-06 at 18.52.42@2x.png" /></li>
</ol>
<p>...</p>
<h2 id="heading-bonus-set-alias-for-the-account">(bonus) Set Alias for the Account</h2>
<p>Account ID or Alias is required to log in IAM account. Account ID is a long number. Humans are bad with a long number. A meaningful alias can save you from the trouble of remembering the account ID. Let's set an alias for your account: </p>
<ol>
<li>Go to <a target="_blank" href="https://console.aws.amazon.com/iamv2"><strong>IAM Console</strong></a> after login into the root account.</li>
<li>You will see a <strong>Create</strong> button in the right sidebar under the account alias. </li>
<li>Choose a unique and memorable alias for your account and click "Save changes". </li>
</ol>
<p>Use the alias instead of account ID next time you are logging into an IAM account.</p>
<p>...</p>
<h2 id="heading-3-create-iam-accounts-for-day-to-day-tasks">3. Create IAM account(s) for Day-to-Day tasks</h2>
<p>You need the root account for a few <a target="_blank" href="https://docs.aws.amazon.com/accounts/latest/reference/root-user-tasks.html">tasks</a>. Other than that you should not use the Root account. Perhaps, not for day-to-day tasks, lunching, and provisioning services. </p>
<p>I always create an IAM account with admin permission. I do all of the tasks from this account except those tasks that require the root account. So, let's create an admin IAM account. </p>
<ol>
<li>Go to <a target="_blank" href="console.aws.amazon.com/iamv2/home#/users"><strong>Users page of IAM Console</strong></a>.</li>
<li>Click on the <strong>Add users</strong> button from top-right corner. </li>
<li>You will be in this page: 
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1657115139748/qnRC-GFHY.png" alt="CleanShot 2022-07-06 at 19.42.16@2x.png" /><ul>
<li>A. Choose an username</li>
<li>B. Chosse access type. I need both CLI and AWS Console access</li>
<li>C. You can enter your custom password or choose auto generated.</li>
<li>D. It's better to require reset password to choose it's own.</li>
<li>E. Click on the <strong>Next: Permission</strong> button from the bottom-right</li>
</ul>
</li>
<li>You are in the permission page: 
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1657115468984/bHYj1c_6X.png" alt="CleanShot 2022-07-06 at 19.50.04@2x.png" /><ul>
<li>A. Choose <strong>Attach existing policies directly</strong> from the top options</li>
<li>B. Search for the <strong>AdministratorAccess</strong> role</li>
<li>C. Choose the <strong>AdministratorAccess</strong> role</li>
<li>D. Click on the <strong>Next: Tags</strong> button</li>
</ul>
</li>
<li>You are in the tags page. You can add you tag(s) if you want but it's optional. Click in the <strong>Next: Review</strong> button.</li>
<li>Take a look on everything and check if it's matches to mine. And then click on the <strong>Create user</strong> button. 
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1657115746019/M_4JaTtXY.png" alt="CleanShot 2022-07-06 at 19.55.22@2x.png" /></li>
<li>Now we are in the final page: 
<img src="https://cdn.hashnode.com/res/hashnode/image/upload/v1657115912225/AwtCueh_h.png" alt="CleanShot 2022-07-06 at 19.57.03@2x.png" /><ul>
<li>A. The link to login to the console</li>
<li>B &amp; C. Username &amp; Password to login to the console</li>
<li>D &amp; E. Access key &amp; secret to login via CLI or App</li>
<li>F. You can download the .csv file with credentails. You can save it in safer place for later use. </li>
</ul>
</li>
</ol>
<p>...</p>
<h2 id="heading-conclusion">Conclusion</h2>
<p>There are more things to do to save bills and tighten security of your account. But these are the first 3 things I do and doesn't require much technical knowledge. </p>
<p>You can subscribe to my newsletter in <a target="_blank" href="https://harun.dev/blog">my blog</a>. Follow me on <a target="_blank" href="https://twitter.com/HarunRRayhan">Twitter</a>, <a target="_blank" href="https://dev.to/harunrrayhan">Dev.to</a>, and <a target="_blank" href="https://hashnode.com/@HarunRRayhan">Hashnode</a> for regular updates. Don't hesitate to show your love by clicking Like 👍 button.</p>
