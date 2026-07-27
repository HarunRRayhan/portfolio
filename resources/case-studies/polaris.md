---
slug: polaris
codename: Polaris
title: "Polaris: Migrating a 15-Year-Old ERP Off Zend Framework 1"
publishedAt: "2026-07-27"
duration: "6 to 12 months"
problem: "The ERP ran on Zend Framework 1, a PHP framework roughly 15 years old. It couldn't scale, had lost community and vendor support, was hard to hire for, and carried security and compliance gaps while feature work slowed to a crawl."
approach: "We rebuilt the system on Symfony, split the frontend off from the backend, and broke the backend into microservices so the team could change one part without risking the rest."
outcome:
  - "Noticeably faster for day-to-day operations"
  - "Far fewer production incidents"
  - "Features shipping in weeks, not months"
  - "Lower hosting and maintenance cost"
  - "Incremental releases without a full-system deploy"
services:
  - "Vibe Code Migration"
  - "Vibe Scaler"
techStack:
  - "Zend Framework 1"
  - "Symfony"
  - "PHP"
  - "Microservices"
  - "REST APIs"
tags:
  - "Legacy Migration"
  - "ERP"
  - "Symfony"
  - "Microservices"
---
<h2>Stack</h2>
<p>Before: Zend Framework 1, PHP, a single codebase with the frontend and backend welded together.</p>
<p>After: Symfony, PHP, a set of smaller services with the frontend split off from the backend and talking to it over REST.</p>

<h2>Context</h2>
<p>Polaris is the internal system a business runs its operations on. Inventory, orders, finance, and the reports pulled out of all of it. A system like this rarely gets rewritten, because it works and everyone depends on it. So it kept running on the framework it was born on, and that framework turned 15.</p>
<p>Nobody wants to be the person who touches the system that pays everyone. That's why it sat untouched for so long, and it's also why it eventually became a problem.</p>

<h2>Problem</h2>
<p>Zend Framework 1 stopped keeping up. It couldn't scale with the load the business was putting on it, and there was no path to fix that inside the old framework.</p>
<p>Support had dried up too. No more community updates, no vendor behind it, and almost nobody left to hire who knew it well. Security and compliance gaps kept opening with nothing upstream to close them. Features that should have taken days took weeks, and some never got built at all.</p>

<h2>Diagnosis</h2>
<p>Most of the pain traced back to age.</p>
<ul>
  <li>The packages the app leaned on hadn't shipped an update in years, so every dependency was a dead end.</li>
  <li>Hiring was brutal. The developers who knew Zend 1 well had moved on a decade ago.</li>
  <li>The frontend and backend lived in one codebase, so a small UI change could reach deep into the business logic and break it. Every change felt risky.</li>
  <li>An unsupported framework meant the security exposure only grew, and no patch was coming.</li>
</ul>
<p>None of these get better on their own. They compound.</p>

<h2>Approach</h2>
<p>We rebuilt on Symfony and used the rebuild to fix the structure, not just the framework.</p>
<p>The big move was splitting the frontend off from the backend. Once they were separate, we could break the backend into smaller services, each owning one part of the system. A change to orders no longer put finance at risk.</p>
<p>With a larger team working over 6 to 12 months, a big-bang cutover was never the plan. As is typical for a migration like this, the safe path is to move module by module and run the old and new systems side by side during the handover, so the business keeps operating while pieces cross over one at a time.</p>

<h2>Outcomes</h2>
<p>The system got noticeably faster, and the incidents that used to interrupt the team mostly went away.</p>
<p>The decoupling paid off most in how the team ships. Because the frontend and the services are separate, a change to one part goes out on its own without a full-system release. Work that used to take months started landing in weeks.</p>
<p>Running costs came down too. A supported framework and smaller services are cheaper to host and cheaper to keep alive, and maintenance stopped being a specialist skill that only a shrinking pool of people still had.</p>

<h2>Why this became two services</h2>
<p>Polaris ran fine for years, right up until the tool that built it couldn't carry it anymore. That story is more common now than it used to be. Plenty of teams are sitting on something that started in a quick-build tool or an old framework, works today, and won't survive the next round of growth.</p>
<p>You don't have to rewrite it from scratch to move off it. That's the idea behind <a href="/services/vibe-code-migration">Vibe Code Migration</a> and <a href="/services/vibe-scaling">Vibe Scaler</a>: take a system that outgrew what built it, move it onto a stack it can grow on, and keep every feature people already rely on.</p>
