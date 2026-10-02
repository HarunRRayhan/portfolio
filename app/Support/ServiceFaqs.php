<?php

namespace App\Support;

/**
 * FAQ copy mirrored from the service page accordions.
 *
 * @phpstan-type Faq array{question: string, answer: string}
 */
final class ServiceFaqs
{
    /**
     * @return array<string, list<Faq>>
     */
    public static function all(): array
    {
        return [
            'aws-cloud' => [
                [
                    'question' => 'Why AWS?',
                    'answer' => 'You pay for what you use, and you can add capacity without buying a machine. The useful part is the managed services around the app, not the size of the catalog.',
                ],
                [
                    'question' => 'How do you handle security on AWS?',
                    'answer' => 'IAM, the network, and encryption in transit and at rest. I add GuardDuty or Security Hub only if they tell you something the logs don\'t.',
                ],
                [
                    'question' => 'Can you help migrate our existing infrastructure to AWS?',
                    'answer' => 'Yes. I look at what you run now, write the cutover plan, and check the data before traffic moves.',
                ],
                [
                    'question' => 'What do you do about the AWS bill?',
                    'answer' => 'I look at what you\'re paying for and not using, then right-size it or turn it off. A savings plan only for load that is actually steady.',
                ],
                [
                    'question' => 'Can you help with HIPAA, PCI, or SOC 2?',
                    'answer' => 'I can help with HIPAA, PCI DSS, GDPR, and SOC 2. That means access, encryption, logging, and the paperwork an audit will ask for.',
                ],
                [
                    'question' => 'What do you leave behind when the AWS work is done?',
                    'answer' => 'After the change, I leave monitoring, a short list of what to patch, and notes on the cost. I do not staff a night desk. The alarms should reach the person who can fix the thing.',
                ],
            ],
            'automated-deployment' => [
                [
                    'question' => 'What is a pipeline, in practice?',
                    'answer' => 'A pull request builds and tests before it merges, and the same pipeline ships it. A release stops being a checklist in someone\'s head.',
                ],
                [
                    'question' => 'How long does a pipeline take?',
                    'answer' => 'A small pipeline is a few days. One with several services and a database is a few weeks.',
                ],
                [
                    'question' => 'Can you integrate CI/CD with our existing tools and workflows?',
                    'answer' => 'Yes. I use the git host and the deploy target you already have.',
                ],
                [
                    'question' => 'How do you keep a pipeline from leaking secrets?',
                    'answer' => 'Secrets stay out of the log, and a known-bad dependency fails the build.',
                ],
                [
                    'question' => 'What changes once deploys are automated?',
                    'answer' => 'You can ship more often, roll back, and stop retyping the same steps.',
                ],
                [
                    'question' => 'Where do database changes go?',
                    'answer' => 'Schema changes go through versioned migrations in the same pipeline, with a rollback. I don\'t hand-edit production.',
                ],
            ],
            'cloud-architecture' => [
                [
                    'question' => 'Which clouds do you work on?',
                    'answer' => 'Mostly AWS. I use Azure or Google Cloud when the project already lives there, or when one provider is not the whole answer.',
                ],
                [
                    'question' => 'How do you handle more traffic?',
                    'answer' => 'Auto-scaling and a load balancer where the app needs them, plus caching in front of the database. I don\'t add a service because it\'s fashionable.',
                ],
                [
                    'question' => 'Can you move an existing setup?',
                    'answer' => 'Yes. I write down the downtime, the data check, and how we roll back before anything moves.',
                ],
                [
                    'question' => 'How do you handle security in the design?',
                    'answer' => 'Encryption, IAM, and a network that isn\'t one flat open space. I name the control an audit will ask for.',
                ],
                [
                    'question' => 'What do you do about the bill?',
                    'answer' => 'I cut what you\'re not using, then look at steady load for a savings plan. Tags so the bill has names on it.',
                ],
            ],
            'database-migration' => [
                [
                    'question' => 'When is a database move worth it?',
                    'answer' => 'When the current database is slow, expensive, or missing something you actually need. I won\'t move it just to be on something newer.',
                ],
                [
                    'question' => 'How do you know the data made it?',
                    'answer' => 'I compare counts and checksums on both sides before traffic points at the new database. If they don\'t match, it doesn\'t cut over.',
                ],
                [
                    'question' => 'How long is the database down?',
                    'answer' => 'I name the window. Replication can shrink it. If some downtime is required, we pick a quiet hour.',
                ],
                [
                    'question' => 'Can you move from one database type to another?',
                    'answer' => 'Yes, including from one relational database to another, or over to something else. The schema change is planned and tested before the real copy.',
                ],
                [
                    'question' => 'What about a very large database?',
                    'answer' => 'I copy in slices, not one giant transfer, and I watch the new database under load before you call it done.',
                ],
            ],
            'database-optimization' => [
                [
                    'question' => 'How do I know the database is the problem?',
                    'answer' => 'Slow queries, timeouts, and a CPU graph that\'s pegged. If the app feels slow and the database is the wait, that\'s the sign.',
                ],
                [
                    'question' => 'What gets better when the database is faster?',
                    'answer' => 'Pages get faster, and you stop paying for a bigger database that a missing index would have fixed.',
                ],
                [
                    'question' => 'Do you work with SQL and NoSQL?',
                    'answer' => 'Yes. I work with MySQL, PostgreSQL, and SQL Server, and with MongoDB and Redis when those are what you already run. The fix depends on which one is slow.',
                ],
                [
                    'question' => 'Will the data stay intact?',
                    'answer' => 'I try the change in staging first, and I take a backup before anything that rewrites data.',
                ],
                [
                    'question' => 'Can you do this on a cloud database?',
                    'answer' => 'Yes. On AWS, and on Google Cloud or Azure if that\'s where it already runs.',
                ],
                [
                    'question' => 'How long does a database pass take?',
                    'answer' => 'A few days for the obvious queries. A few weeks if the schema itself is the problem.',
                ],
            ],
            'devops' => [
                [
                    'question' => 'What DevOps tools do you use?',
                    'answer' => 'GitLab CI or Jenkins, Docker, Kubernetes when you already need it, Ansible, and Terraform. I pick what fits the stack you have.',
                ],
                [
                    'question' => 'How long until the team can ship without me?',
                    'answer' => 'A first pipeline is weeks, not a six-month program. After that it\'s your team using it.',
                ],
                [
                    'question' => 'How do you tell if it worked?',
                    'answer' => 'How often you ship, how long a change takes, and how often it fails. I write those down before and after.',
                ],
                [
                    'question' => 'Does this only work at a software company?',
                    'answer' => 'If you ship software, yes. The industry doesn\'t change the pipeline.',
                ],
                [
                    'question' => 'Where does security fit?',
                    'answer' => 'Security checks go in the pipeline. Dependency scans, and secrets that never land in the log.',
                ],
            ],
            'infrastructure-as-code' => [
                [
                    'question' => 'Can you work with the Terraform code we already have?',
                    'answer' => 'Yes. I start by reading your modules, state setup, account boundaries, and deployment rules. The aim is to make the requested change in your existing stack rather than replace it with a new template.',
                ],
                [
                    'question' => 'What do you check before applying a Terraform plan?',
                    'answer' => 'I run validation and review the plan for resource replacement, downtime, IAM permissions, and unexpected cost. A valid configuration can still produce a risky plan, so the plan needs a human review.',
                ],
                [
                    'question' => 'Can you add checks to our pull request workflow?',
                    'answer' => 'Yes. I can add validation and plan checks that fit your repository and approval process. Reviewers should be able to see the proposed infrastructure change before an apply.',
                ],
                [
                    'question' => 'What will we have when the work is done?',
                    'answer' => 'You will have the code change, the reviewed plan, and notes on the state assumptions and steps your team needs for the next change. The exact handoff depends on the scope we agree on first.',
                ],
            ],
            'infrastructure-migration' => [
                [
                    'question' => 'How long does a move take?',
                    'answer' => 'A small move is a few weeks. A large one is months. I\'ll say which after I see what has to move.',
                ],
                [
                    'question' => 'How do you keep the data safe during the move?',
                    'answer' => 'The copy is encrypted, and the temporary path is closed when the move is done.',
                ],
                [
                    'question' => 'Can you migrate our infrastructure to multiple cloud providers?',
                    'answer' => 'Yes, when the move really needs more than one cloud. I plan the split around cost, the failure you cannot accept, and how the two sides talk to each other.',
                ],
                [
                    'question' => 'What happens to the old system?',
                    'answer' => 'I list what it depends on, then we pick a lift-and-shift or a rewrite. I won\'t rewrite it by default.',
                ],
                [
                    'question' => 'What happens the week after the move?',
                    'answer' => 'I watch the first week: errors, cost, and what got slower. I don\'t stay on as a night desk.',
                ],
                [
                    'question' => 'How long is the system down?',
                    'answer' => 'I name the window and how we roll back. A parallel environment can shrink it. Near zero only if the app can actually do that.',
                ],
            ],
            'mlops' => [
                [
                    'question' => 'What is MLOps?',
                    'answer' => 'The path from a notebook to a model that users hit, with a way to train it again and see if it drifted.',
                ],
                [
                    'question' => 'How is this different from a normal deploy pipeline?',
                    'answer' => 'DevOps versions code. This also has to version the data and the model, and watch whether the answers got worse.',
                ],
                [
                    'question' => 'What does the pipeline include?',
                    'answer' => 'Data in, a training job, a registry, a way to serve the model, and an alarm when it drifts.',
                ],
                [
                    'question' => 'How do you version a model?',
                    'answer' => 'I version the data, the code, and the model, usually with MLflow or DVC, so last month\'s result can be rebuilt.',
                ],
                [
                    'question' => 'How do you lock down the model and the data?',
                    'answer' => 'The training data and the endpoint get real access control, and the data is encrypted. I follow the policy your security people already have.',
                ],
                [
                    'question' => 'Can you take a notebook and make it a deploy?',
                    'answer' => 'I look at how a model leaves the notebook today, then add the pipeline and the registry. Your team sees one training run and one deploy.',
                ],
            ],
            'monitoring-observability' => [
                [
                    'question' => 'What is the difference between a metric and being able to ask why?',
                    'answer' => 'Monitoring is the metric you already decided to watch. Observability is being able to ask why a request was slow when you didn\'t predict the question.',
                ],
                [
                    'question' => 'Which tools do you use?',
                    'answer' => 'Prometheus, Grafana, and CloudWatch. Datadog or an ELK stack if you already pay for one. I start with what you have.',
                ],
                [
                    'question' => 'What changes once you can see a failure?',
                    'answer' => 'You hear about a failure before your users do, and you can see which part ate the time.',
                ],
                [
                    'question' => 'Can you set up a few graphs and an alarm?',
                    'answer' => 'Yes. A few graphs you\'d open during an incident, and an alarm that pages a person. Not a wall of green boxes.',
                ],
                [
                    'question' => 'How do you watch a system made of many services?',
                    'answer' => 'I trace one request across the services, put the logs in one place, and give each service a health check.',
                ],
            ],
            'multi-cloud-architecture' => [
                [
                    'question' => 'When is more than one cloud worth it?',
                    'answer' => 'A second cloud helps when one provider is a failure you cannot accept. It also adds a bill and a network between them. I only recommend it for that reason.',
                ],
                [
                    'question' => 'How do you handle security on both clouds?',
                    'answer' => 'The same idea for access on both sides, encryption between them, and one place that sees both.',
                ],
                [
                    'question' => 'What if the path between clouds is slow?',
                    'answer' => 'I measure the path that crosses clouds. If that hop is the slow part, the split was the wrong shape.',
                ],
                [
                    'question' => 'How do you read two bills?',
                    'answer' => 'One view of both bills, and a reason each workload sits where it sits.',
                ],
                [
                    'question' => 'How do you keep data in sync across clouds?',
                    'answer' => 'I name what has to be copied, how fresh it has to be, and what you do when the copy falls behind.',
                ],
                [
                    'question' => 'Which tools do you use for more than one cloud?',
                    'answer' => 'Terraform for both sides, and Prometheus or Grafana if you want one set of graphs. Kubernetes only if you\'re already running it.',
                ],
            ],
            'performance-optimization' => [
                [
                    'question' => 'Where do you start when something is slow?',
                    'answer' => 'The slow request. That might be the front end, the app, the database, or the network. I start where the time goes.',
                ],
                [
                    'question' => 'How long does a performance pass take?',
                    'answer' => 'Often a few weeks for the slow paths. I measure again before talking about more work.',
                ],
                [
                    'question' => 'Can you look at a slow mobile app?',
                    'answer' => 'I can look at a slow start and chatty network calls. If it\'s a native problem I don\'t know, I\'ll say so.',
                ],
                [
                    'question' => 'What if the database is the slow part?',
                    'answer' => 'Slow queries, indexes, and caching. MySQL, PostgreSQL, or MongoDB if that\'s what you run.',
                ],
                [
                    'question' => 'Can you look at a slow checkout?',
                    'answer' => 'Same measurement. Checkout and the catalog under load, including a sale spike if that\'s the failure you care about.',
                ],
                [
                    'question' => 'How do you tell if it got faster?',
                    'answer' => 'Response time and error rate, before and after. If you care about conversion, we look at that too.',
                ],
            ],
            'security-consulting' => [
                [
                    'question' => 'What do you actually review?',
                    'answer' => 'I review the cloud account, the network, and the app, and I run a vulnerability scan. If you need a full penetration test, I\'ll say whether that\'s the right job.',
                ],
                [
                    'question' => 'How often should we conduct security assessments?',
                    'answer' => 'After a big change, and at least once a year if an auditor expects it. Critical systems more often.',
                ],
                [
                    'question' => 'Can you help with GDPR, HIPAA, or PCI?',
                    'answer' => 'I can help with the controls and the evidence an audit will ask for, including GDPR, HIPAA, PCI DSS, and ISO 27001. I will tell you if a control is missing instead of papering over it.',
                ],
                [
                    'question' => 'How do you review a cloud account?',
                    'answer' => 'Mostly AWS. I read the account config, IAM, encryption, and the logs.',
                ],
                [
                    'question' => 'What does an incident plan look like?',
                    'answer' => 'Who gets called, how you tell it\'s real, and a short practice run. A binder nobody opens doesn\'t count.',
                ],
                [
                    'question' => 'How do you keep up with new threats?',
                    'answer' => 'I keep up by reading the incidents, the vendor notes, and the certifications I actually hold. If a new issue matters to your stack, it goes in the review.',
                ],
            ],
            'serverless-infrastructure' => [
                [
                    'question' => 'What do you mean by serverless?',
                    'answer' => 'You deploy a function. The cloud runs it when something happens, and you pay for that run. You still own the bugs.',
                ],
                [
                    'question' => 'When is serverless the right shape?',
                    'answer' => 'Less to patch, and the bill follows the traffic. A function that runs all day is just a server.',
                ],
                [
                    'question' => 'Is serverless a fit for every app?',
                    'answer' => 'Good for APIs, jobs, and spiky traffic. A steady, long-running process is often happier on a normal service.',
                ],
                [
                    'question' => 'How do you debug a function?',
                    'answer' => 'Logs, a trace, the duration, and an alarm. Plus the bill.',
                ],
                [
                    'question' => 'How do you lock down a function?',
                    'answer' => 'The function gets the IAM role it needs, not admin. The API checks who is calling.',
                ],
                [
                    'question' => 'Where does the data live?',
                    'answer' => 'The function itself doesn\'t keep state. That lives in a database, a queue, or a cache.',
                ],
            ],
            'vibe-code-migration' => [
                [
                    'question' => 'Does migrating mean my prototype was a mistake?',
                    'answer' => 'No. Building fast with AI coding tools is a smart way to get a real product in front of people, and it worked. A prototype stack is meant to prove an idea, not run forever. Moving to a production language and framework is the next step after that, not a fix for a wrong first one.',
                ],
                [
                    'question' => 'Will we lose any data or features in the migration?',
                    'answer' => 'No. Keeping everything is the whole reason to do it carefully. I write down every feature in the current app and turn it into a checklist the new build has to pass. Data moves over in stages with row counts and key records verified on both sides. If something does not match, it does not ship.',
                ],
                [
                    'question' => 'Why not just keep scaling the current stack instead of moving?',
                    'answer' => 'Often that is the right call, and it is a separate service I offer called Vibe Scaler. Scaling in place works when the stack is sound and only its config and slow paths need attention. Migration is for when the stack itself is the ceiling, where the language or framework cannot get you where the product is going no matter how much you tune it. I will tell you honestly which case you are in before you spend anything.',
                ],
                [
                    'question' => 'How do you handle cutover and downtime?',
                    'answer' => 'I run the new app next to the old one rather than flipping a switch. Traffic moves across in stages, starting small, and I watch each step. The old version stays ready the whole time, so if anything looks wrong I route back to it in seconds while I sort it out.',
                ],
                [
                    'question' => 'What languages and frameworks do you migrate to?',
                    'answer' => 'Whatever fits where your product is heading. In practice that is often a typed backend on Node, Python, Go, or PHP with a framework like Laravel, a React front end, and PostgreSQL behind it. I pick the target for the next few years of the product, not just the next release.',
                ],
                [
                    'question' => 'How long does a migration take?',
                    'answer' => 'It depends on how much the app does, which is why the first step is mapping every feature. A small app can move in a few weeks. A larger one ships in stages, with parts running on the new stack while the rest still runs on the old one, so you are never waiting on one big release.',
                ],
            ],
            'vibe-scaling' => [
                [
                    'question' => 'Is there something wrong with vibe coding my app?',
                    'answer' => 'No. Building with AI coding tools to get a real product in front of people is a smart way to start, and it worked. You have users, and payments are coming in. That is the hard part, and most ideas never reach it. Scaling what you built is a different kind of work, and that is the part I do.',
                ],
                [
                    'question' => 'What does scaling in place mean?',
                    'answer' => 'It means I improve the app you already have instead of rewriting it. I keep your language, framework, and hosting, and fix the parts that cannot keep up with your traffic. You keep running your business while I do it.',
                ],
                [
                    'question' => 'What if my app actually needs a full rewrite?',
                    'answer' => 'Sometimes it does. If your stack has hit a real ceiling and no amount of tuning will get it where you need to go, I will tell you that plainly. Moving an app to a different language or framework is a separate service I offer, so you get an honest answer instead of patches that will not hold.',
                ],
                [
                    'question' => 'How do you decide what to fix first?',
                    'answer' => 'I measure before I touch anything. I run your app under load that matches your real traffic, watch where it slows down or falls over, and start with the changes that buy you the most headroom for the least risk.',
                ],
                [
                    'question' => 'Will my app go down while you work on it?',
                    'answer' => 'No. I ship changes in small pieces and test each one before it goes live. I also set up a fast way to roll back a deploy, so if something looks wrong after a release I can undo it in seconds.',
                ],
                [
                    'question' => 'Which stacks do you work with?',
                    'answer' => 'Most apps that come out of tools like Cursor, Bolt, Lovable, Replit, and v0. In practice that means React or Next.js on the front end, a Node, Python, or PHP backend, and PostgreSQL or MySQL behind it. If you are on something else, ask me and I will tell you honestly whether I can help.',
                ],
            ],
        ];
    }

    /**
     * @return list<Faq>
     */
    public static function forSlug(string $slug): array
    {
        return self::all()[$slug] ?? [];
    }
}
