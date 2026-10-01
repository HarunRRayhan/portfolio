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
                    'question' => 'What are the benefits of using AWS for my business?',
                    'answer' => 'You pay for what you use, and you can add capacity without buying a machine. The useful part is the managed services around the app, not the size of the catalog.',
                ],
                [
                    'question' => 'How do you ensure security in AWS environments?',
                    'answer' => 'IAM, the network, and encryption in transit and at rest. I add GuardDuty or Security Hub only if they tell you something the logs don\'t.',
                ],
                [
                    'question' => 'Can you help migrate our existing infrastructure to AWS?',
                    'answer' => 'Yes. I look at what you run now, write the cutover plan, and check the data before traffic moves.',
                ],
                [
                    'question' => 'How do you handle cost optimization in AWS?',
                    'answer' => 'I look at what you\'re paying for and not using, then right-size it or turn it off. A savings plan only for load that is actually steady.',
                ],
                [
                    'question' => 'Can you help with AWS compliance requirements?',
                    'answer' => 'I can help with HIPAA, PCI DSS, GDPR, and SOC 2. That means access, encryption, logging, and the paperwork an audit will ask for.',
                ],
                [
                    'question' => 'What ongoing support do you provide for AWS environments?',
                    'answer' => 'After the change, I leave monitoring, a short list of what to patch, and notes on the cost. I do not staff a night desk. The alarms should reach the person who can fix the thing.',
                ],
            ],
            'automated-deployment' => [
                [
                    'question' => 'What is CI/CD and why is it important?',
                    'answer' => 'A pull request builds and tests before it merges, and the same pipeline ships it. A release stops being a checklist in someone\'s head.',
                ],
                [
                    'question' => 'How long does it take to implement a CI/CD pipeline?',
                    'answer' => 'A small pipeline is a few days. One with several services and a database is a few weeks.',
                ],
                [
                    'question' => 'Can you integrate CI/CD with our existing tools and workflows?',
                    'answer' => 'Yes. I use the git host and the deploy target you already have.',
                ],
                [
                    'question' => 'How do you ensure security in CI/CD pipelines?',
                    'answer' => 'Secrets stay out of the log, and a known-bad dependency fails the build.',
                ],
                [
                    'question' => 'What are the benefits of automated deployment?',
                    'answer' => 'You can ship more often, roll back, and stop retyping the same steps.',
                ],
                [
                    'question' => 'How do you handle database changes in CI/CD pipelines?',
                    'answer' => 'Schema changes go through versioned migrations in the same pipeline, with a rollback. I don\'t hand-edit production.',
                ],
            ],
            'cloud-architecture' => [
                [
                    'question' => 'What cloud platforms do you work with?',
                    'answer' => 'Mostly AWS. I use Azure or Google Cloud when the project already lives there, or when one provider is not the whole answer.',
                ],
                [
                    'question' => 'How do you ensure scalability in cloud architecture?',
                    'answer' => 'Auto-scaling and a load balancer where the app needs them, plus caching in front of the database. I don\'t add a service because it\'s fashionable.',
                ],
                [
                    'question' => 'Can you help with cloud migration?',
                    'answer' => 'Yes. I write down the downtime, the data check, and how we roll back before anything moves.',
                ],
                [
                    'question' => 'How do you address security concerns in cloud architecture?',
                    'answer' => 'Encryption, IAM, and a network that isn\'t one flat open space. I name the control an audit will ask for.',
                ],
                [
                    'question' => 'What\'s your approach to cost optimization in cloud architecture?',
                    'answer' => 'I cut what you\'re not using, then look at steady load for a savings plan. Tags so the bill has names on it.',
                ],
            ],
            'database-migration' => [
                [
                    'question' => 'Why should I consider database migration?',
                    'answer' => 'When the current database is slow, expensive, or missing something you actually need. I won\'t move it just to be on something newer.',
                ],
                [
                    'question' => 'How do you ensure data integrity during migration?',
                    'answer' => 'I compare counts and checksums on both sides before traffic points at the new database. If they don\'t match, it doesn\'t cut over.',
                ],
                [
                    'question' => 'How do you minimize downtime during database migration?',
                    'answer' => 'I name the window. Replication can shrink it. If some downtime is required, we pick a quiet hour.',
                ],
                [
                    'question' => 'Can you migrate between different types of databases?',
                    'answer' => 'Yes, including from one relational database to another, or over to something else. The schema change is planned and tested before the real copy.',
                ],
                [
                    'question' => 'How do you handle large-scale database migrations?',
                    'answer' => 'I copy in slices, not one giant transfer, and I watch the new database under load before you call it done.',
                ],
            ],
            'database-optimization' => [
                [
                    'question' => 'What are the signs that my database needs optimization?',
                    'answer' => 'Slow queries, timeouts, and a CPU graph that\'s pegged. If the app feels slow and the database is the wait, that\'s the sign.',
                ],
                [
                    'question' => 'How can database optimization improve my business operations?',
                    'answer' => 'Pages get faster, and you stop paying for a bigger database that a missing index would have fixed.',
                ],
                [
                    'question' => 'Do you work with both SQL and NoSQL databases?',
                    'answer' => 'Yes. I work with MySQL, PostgreSQL, and SQL Server, and with MongoDB and Redis when those are what you already run. The fix depends on which one is slow.',
                ],
                [
                    'question' => 'How do you ensure data integrity during the optimization process?',
                    'answer' => 'I try the change in staging first, and I take a backup before anything that rewrites data.',
                ],
                [
                    'question' => 'Can you help with database optimization in cloud environments?',
                    'answer' => 'Yes. On AWS, and on Google Cloud or Azure if that\'s where it already runs.',
                ],
                [
                    'question' => 'How long does the database optimization process typically take?',
                    'answer' => 'A few days for the obvious queries. A few weeks if the schema itself is the problem.',
                ],
            ],
            'devops' => [
                [
                    'question' => 'What DevOps tools do you use?',
                    'answer' => 'GitLab CI or Jenkins, Docker, Kubernetes when you already need it, Ansible, and Terraform. I pick what fits the stack you have.',
                ],
                [
                    'question' => 'How long does it take to implement DevOps practices?',
                    'answer' => 'A first pipeline is weeks, not a six-month program. After that it\'s your team using it.',
                ],
                [
                    'question' => 'How do you measure the success of DevOps implementation?',
                    'answer' => 'How often you ship, how long a change takes, and how often it fails. I write those down before and after.',
                ],
                [
                    'question' => 'Can DevOps practices be implemented in a non-tech company?',
                    'answer' => 'If you ship software, yes. The industry doesn\'t change the pipeline.',
                ],
                [
                    'question' => 'How does DevOps impact security?',
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
                    'question' => 'How long does a typical infrastructure migration take?',
                    'answer' => 'A small move is a few weeks. A large one is months. I\'ll say which after I see what has to move.',
                ],
                [
                    'question' => 'How do you ensure data security during the migration process?',
                    'answer' => 'The copy is encrypted, and the temporary path is closed when the move is done.',
                ],
                [
                    'question' => 'Can you migrate our infrastructure to multiple cloud providers?',
                    'answer' => 'Yes, when the move really needs more than one cloud. I plan the split around cost, the failure you cannot accept, and how the two sides talk to each other.',
                ],
                [
                    'question' => 'How do you handle legacy systems during migration?',
                    'answer' => 'I list what it depends on, then we pick a lift-and-shift or a rewrite. I won\'t rewrite it by default.',
                ],
                [
                    'question' => 'What kind of support do you provide post-migration?',
                    'answer' => 'I watch the first week: errors, cost, and what got slower. I don\'t stay on as a night desk.',
                ],
                [
                    'question' => 'How do you minimize downtime during the migration process?',
                    'answer' => 'I name the window and how we roll back. A parallel environment can shrink it. Near zero only if the app can actually do that.',
                ],
            ],
            'mlops' => [
                [
                    'question' => 'What is MLOps and why is it important?',
                    'answer' => 'The path from a notebook to a model that users hit, with a way to train it again and see if it drifted.',
                ],
                [
                    'question' => 'How does MLOps differ from traditional DevOps?',
                    'answer' => 'DevOps versions code. This also has to version the data and the model, and watch whether the answers got worse.',
                ],
                [
                    'question' => 'What are the key components of an MLOps pipeline?',
                    'answer' => 'Data in, a training job, a registry, a way to serve the model, and an alarm when it drifts.',
                ],
                [
                    'question' => 'How do you handle model versioning in MLOps?',
                    'answer' => 'I version the data, the code, and the model, usually with MLflow or DVC, so last month\'s result can be rebuilt.',
                ],
                [
                    'question' => 'How do you ensure the security of ML models and data in an MLOps setup?',
                    'answer' => 'The training data and the endpoint get real access control, and the data is encrypted. I follow the policy your security people already have.',
                ],
                [
                    'question' => 'Can you help with the transition from traditional data science workflows to MLOps?',
                    'answer' => 'I look at how a model leaves the notebook today, then add the pipeline and the registry. Your team sees one training run and one deploy.',
                ],
            ],
            'monitoring-observability' => [
                [
                    'question' => 'What\'s the difference between monitoring and observability?',
                    'answer' => 'Monitoring is the metric you already decided to watch. Observability is being able to ask why a request was slow when you didn\'t predict the question.',
                ],
                [
                    'question' => 'What tools do you use for monitoring and observability?',
                    'answer' => 'Prometheus, Grafana, and CloudWatch. Datadog or an ELK stack if you already pay for one. I start with what you have.',
                ],
                [
                    'question' => 'How can improved monitoring and observability benefit my business?',
                    'answer' => 'You hear about a failure before your users do, and you can see which part ate the time.',
                ],
                [
                    'question' => 'Can you help with setting up custom dashboards and alerts?',
                    'answer' => 'Yes. A few graphs you\'d open during an incident, and an alarm that pages a person. Not a wall of green boxes.',
                ],
                [
                    'question' => 'How do you handle monitoring for microservices architectures?',
                    'answer' => 'I trace one request across the services, put the logs in one place, and give each service a health check.',
                ],
            ],
            'multi-cloud-architecture' => [
                [
                    'question' => 'What are the benefits of a multi-cloud architecture?',
                    'answer' => 'A second cloud helps when one provider is a failure you cannot accept. It also adds a bill and a network between them. I only recommend it for that reason.',
                ],
                [
                    'question' => 'How do you handle security across multiple cloud providers?',
                    'answer' => 'The same idea for access on both sides, encryption between them, and one place that sees both.',
                ],
                [
                    'question' => 'How do you ensure consistent performance across different cloud providers?',
                    'answer' => 'I measure the path that crosses clouds. If that hop is the slow part, the split was the wrong shape.',
                ],
                [
                    'question' => 'How do you manage costs in a multi-cloud environment?',
                    'answer' => 'One view of both bills, and a reason each workload sits where it sits.',
                ],
                [
                    'question' => 'How do you handle data synchronization between different cloud providers?',
                    'answer' => 'I name what has to be copied, how fresh it has to be, and what you do when the copy falls behind.',
                ],
                [
                    'question' => 'What tools do you use for multi-cloud management?',
                    'answer' => 'Terraform for both sides, and Prometheus or Grafana if you want one set of graphs. Kubernetes only if you\'re already running it.',
                ],
            ],
            'performance-optimization' => [
                [
                    'question' => 'What areas of performance do you focus on?',
                    'answer' => 'The slow request. That might be the front end, the app, the database, or the network. I start where the time goes.',
                ],
                [
                    'question' => 'How long does the performance optimization process typically take?',
                    'answer' => 'Often a few weeks for the slow paths. I measure again before talking about more work.',
                ],
                [
                    'question' => 'Can you help with mobile app performance optimization?',
                    'answer' => 'I can look at a slow start and chatty network calls. If it\'s a native problem I don\'t know, I\'ll say so.',
                ],
                [
                    'question' => 'How do you approach database performance optimization?',
                    'answer' => 'Slow queries, indexes, and caching. MySQL, PostgreSQL, or MongoDB if that\'s what you run.',
                ],
                [
                    'question' => 'Do you offer performance optimization for e-commerce platforms?',
                    'answer' => 'Same measurement. Checkout and the catalog under load, including a sale spike if that\'s the failure you care about.',
                ],
                [
                    'question' => 'How do you measure the success of performance optimizations?',
                    'answer' => 'Response time and error rate, before and after. If you care about conversion, we look at that too.',
                ],
            ],
            'security-consulting' => [
                [
                    'question' => 'What types of security assessments do you offer?',
                    'answer' => 'I review the cloud account, the network, and the app, and I run a vulnerability scan. If you need a full penetration test, I\'ll say whether that\'s the right job.',
                ],
                [
                    'question' => 'How often should we conduct security assessments?',
                    'answer' => 'After a big change, and at least once a year if an auditor expects it. Critical systems more often.',
                ],
                [
                    'question' => 'Can you help with compliance requirements (e.g., GDPR, HIPAA, PCI DSS)?',
                    'answer' => 'I can help with the controls and the evidence an audit will ask for, including GDPR, HIPAA, PCI DSS, and ISO 27001. I will tell you if a control is missing instead of papering over it.',
                ],
                [
                    'question' => 'How do you handle the security of cloud environments?',
                    'answer' => 'Mostly AWS. I read the account config, IAM, encryption, and the logs.',
                ],
                [
                    'question' => 'What\'s your approach to incident response planning?',
                    'answer' => 'Who gets called, how you tell it\'s real, and a short practice run. A binder nobody opens doesn\'t count.',
                ],
                [
                    'question' => 'How do you stay updated with the latest security threats and technologies?',
                    'answer' => 'I keep up by reading the incidents, the vendor notes, and the certifications I actually hold. If a new issue matters to your stack, it goes in the review.',
                ],
            ],
            'serverless-infrastructure' => [
                [
                    'question' => 'What is serverless infrastructure?',
                    'answer' => 'You deploy a function. The cloud runs it when something happens, and you pay for that run. You still own the bugs.',
                ],
                [
                    'question' => 'What are the benefits of going serverless?',
                    'answer' => 'Less to patch, and the bill follows the traffic. A function that runs all day is just a server.',
                ],
                [
                    'question' => 'Is serverless suitable for all applications?',
                    'answer' => 'Good for APIs, jobs, and spiky traffic. A steady, long-running process is often happier on a normal service.',
                ],
                [
                    'question' => 'How do you handle monitoring and debugging in serverless applications?',
                    'answer' => 'Logs, a trace, the duration, and an alarm. Plus the bill.',
                ],
                [
                    'question' => 'How do you ensure security in serverless applications?',
                    'answer' => 'The function gets the IAM role it needs, not admin. The API checks who is calling.',
                ],
                [
                    'question' => 'How do you handle state management in serverless applications?',
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
