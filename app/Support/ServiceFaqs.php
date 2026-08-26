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
                    'answer' => 'AWS offers numerous benefits including scalability, cost-effectiveness, global reach, and access to a wide range of cloud services. It allows businesses to innovate faster, reduce IT costs, and scale their infrastructure as needed. With AWS, you can quickly deploy applications, easily manage your IT resources, and benefit from built-in security features.',
                ],
                [
                    'question' => 'How do you ensure security in AWS environments?',
                    'answer' => 'We implement a multi-layered security approach in AWS environments. This includes using AWS Identity and Access Management (IAM) for fine-grained access control, implementing network security through Virtual Private Clouds (VPCs) and security groups, encrypting data at rest and in transit, and utilizing AWS security services like GuardDuty and Security Hub. We also follow AWS security best practices and can help with compliance requirements.',
                ],
                [
                    'question' => 'Can you help migrate our existing infrastructure to AWS?',
                    'answer' => 'Yes, we specialize in AWS migrations. Our process involves assessing your current infrastructure, designing an optimal AWS architecture, planning the migration strategy, and executing the migration with minimal downtime. We use AWS migration tools and best practices to ensure a smooth transition. This includes services like AWS Database Migration Service (DMS) for database migrations and AWS Application Discovery Service to help plan your migration. We also implement strategies to minimize risks and ensure business continuity throughout the migration process.',
                ],
                [
                    'question' => 'How do you handle cost optimization in AWS?',
                    'answer' => 'Cost optimization is a key focus in our AWS management approach. We employ several strategies including: 1) Right-sizing instances to ensure you\'re not over-provisioning resources, 2) Utilizing AWS cost management tools like AWS Cost Explorer and AWS Budgets, 3) Implementing auto-scaling to match resource allocation with demand, 4) Leveraging reserved instances and savings plans for predictable workloads, 5) Identifying and removing unused resources, and 6) Continuously monitoring and optimizing your AWS environment for cost-efficiency.',
                ],
                [
                    'question' => 'Can you help with AWS compliance requirements?',
                    'answer' => 'Absolutely. We have extensive experience in helping businesses meet various compliance requirements in AWS environments. This includes standards such as HIPAA, PCI DSS, GDPR, and SOC 2. We leverage AWS compliance-enabling services and implement best practices to ensure your AWS infrastructure meets necessary regulatory requirements. Our approach includes implementing proper access controls, encryption, logging, and monitoring, as well as assisting with documentation and audit preparation.',
                ],
                [
                    'question' => 'What ongoing support do you provide for AWS environments?',
                    'answer' => 'We offer comprehensive ongoing support for AWS environments. This includes 24/7 monitoring and alerting, regular security patching and updates, performance optimization, cost management, and troubleshooting. We also provide proactive recommendations for improvements and new AWS features that could benefit your business. Our team stays up-to-date with the latest AWS services and best practices to ensure your environment remains optimized, secure, and aligned with your business goals.',
                ],
            ],
            'automated-deployment' => [
                [
                    'question' => 'What is CI/CD and why is it important?',
                    'answer' => 'CI/CD stands for Continuous Integration and Continuous Delivery/Deployment. It\'s a set of practices that automate the process of building, testing, and deploying software. CI/CD is important because it helps teams deliver high-quality software faster and more reliably, reducing the risk of errors and improving overall efficiency.',
                ],
                [
                    'question' => 'How long does it take to implement a CI/CD pipeline?',
                    'answer' => 'The time to implement a CI/CD pipeline can vary depending on the complexity of your project and your current infrastructure. A basic pipeline can be set up in a few days, while more complex setups might take a few weeks. We work closely with your team to ensure a smooth implementation and knowledge transfer throughout the process.',
                ],
                [
                    'question' => 'Can you integrate CI/CD with our existing tools and workflows?',
                    'answer' => 'Yes, we design CI/CD pipelines to integrate seamlessly with your existing tools and workflows. Whether you\'re using specific version control systems, project management tools, or deployment environments, we can create a pipeline that fits into your current processes while improving efficiency and reliability.',
                ],
                [
                    'question' => 'How do you ensure security in CI/CD pipelines?',
                    'answer' => 'Security is a crucial aspect of our CI/CD implementations. We incorporate security best practices such as secret management, access control, and vulnerability scanning into the pipeline. We also integrate security testing tools to catch potential issues early in the development process and ensure that only approved, secure code makes it to production.',
                ],
                [
                    'question' => 'What are the benefits of automated deployment?',
                    'answer' => 'Automated deployment offers numerous benefits, including: 1) Faster and more frequent releases, 2) Reduced human error in the deployment process, 3) Consistent and repeatable deployments across different environments, 4) Easier rollbacks in case of issues, 5) Improved collaboration between development and operations teams, and 6) More time for developers to focus on building features rather than managing deployments.',
                ],
                [
                    'question' => 'How do you handle database changes in CI/CD pipelines?',
                    'answer' => 'Handling database changes in CI/CD pipelines is crucial for maintaining data integrity and ensuring smooth deployments. We typically use database migration tools that can be integrated into the CI/CD process. These tools allow version control of database schemas and data, automated testing of migrations, and rollback capabilities. We also implement strategies like blue-green deployments or canary releases to minimize downtime and risk when deploying database changes.',
                ],
            ],
            'cloud-architecture' => [
                [
                    'question' => 'What cloud platforms do you work with?',
                    'answer' => 'We primarily work with AWS (Amazon Web Services), but we also have expertise in Microsoft Azure and Google Cloud Platform. Our team can help you choose the best cloud platform for your specific needs and requirements.',
                ],
                [
                    'question' => 'How do you ensure scalability in cloud architecture?',
                    'answer' => 'We design cloud architectures with scalability in mind from the ground up. This includes using auto-scaling groups, load balancers, and serverless technologies where appropriate. We also implement best practices for database scaling and caching to ensure your application can handle increased loads seamlessly.',
                ],
                [
                    'question' => 'Can you help with cloud migration?',
                    'answer' => 'Yes, we offer comprehensive cloud migration services. We\'ll assess your current infrastructure, develop a migration strategy, and execute the migration with minimal downtime. Our approach ensures data integrity and maintains business continuity throughout the process.',
                ],
                [
                    'question' => 'How do you address security concerns in cloud architecture?',
                    'answer' => 'Security is a top priority in our cloud architecture designs. We implement best practices such as encryption at rest and in transit, identity and access management (IAM), network segmentation, and regular security audits. We also ensure compliance with relevant industry standards and regulations.',
                ],
                [
                    'question' => 'What\'s your approach to cost optimization in cloud architecture?',
                    'answer' => 'We take a proactive approach to cost optimization. This includes right-sizing resources, leveraging reserved instances or savings plans, implementing auto-scaling to match demand, and using cost allocation tags. We also provide ongoing monitoring and recommendations to ensure your cloud spend remains optimized as your needs evolve.',
                ],
            ],
            'database-migration' => [
                [
                    'question' => 'Why should I consider database migration?',
                    'answer' => 'Database migration can offer numerous benefits, including improved performance, scalability, and cost-efficiency. It can also provide access to new features and capabilities, better security, and easier maintenance. If your current database is struggling to meet your needs or if you\'re looking to modernize your infrastructure, database migration might be the right choice.',
                ],
                [
                    'question' => 'How do you ensure data integrity during migration?',
                    'answer' => 'Ensuring data integrity is our top priority during migration. We use a combination of techniques, including thorough pre-migration testing, data validation checks, and post-migration reconciliation. We also implement robust error handling and rollback procedures. Where possible, we use tools that provide checksums or other integrity verification methods to ensure that every piece of data is accurately transferred.',
                ],
                [
                    'question' => 'How do you minimize downtime during database migration?',
                    'answer' => 'We employ several strategies to minimize downtime, depending on your specific needs and constraints. These may include using replication to keep the old and new databases in sync during migration, performing the migration in phases, or using \'zero-downtime\' migration techniques where possible. In cases where some downtime is unavoidable, we carefully plan the migration to occur during off-peak hours to minimize disruption.',
                ],
                [
                    'question' => 'Can you migrate between different types of databases?',
                    'answer' => 'Yes, we can handle migrations between different types of databases, often referred to as heterogeneous migrations. This could involve moving from a relational database to a NoSQL database, or between different relational database management systems (e.g., from Oracle to PostgreSQL). These migrations often involve schema conversion and data transformation, which we carefully plan and execute to ensure compatibility and optimal performance in the new environment.',
                ],
                [
                    'question' => 'How do you handle large-scale database migrations?',
                    'answer' => 'For large-scale migrations, we employ a variety of techniques to ensure efficiency and reliability. This may include parallel processing to speed up data transfer, incremental migration approaches to reduce risk, and specialized tools designed for handling large volumes of data. We also pay special attention to performance optimization both during and after the migration to ensure that the new database can handle the large-scale data effectively.',
                ],
            ],
            'database-optimization' => [
                [
                    'question' => 'What are the signs that my database needs optimization?',
                    'answer' => 'Common signs include slow query performance, high CPU or memory usage, frequent timeouts, and difficulty scaling to meet growing demands. If your application is experiencing slow response times or if you\'re seeing increased costs for database operations, it might be time for optimization.',
                ],
                [
                    'question' => 'How can database optimization improve my business operations?',
                    'answer' => 'Database optimization can significantly enhance your business operations by improving application performance, reducing response times, lowering infrastructure costs, and enabling your systems to handle larger data volumes and user loads. This leads to better user experience, increased productivity, and the ability to scale your business more effectively.',
                ],
                [
                    'question' => 'Do you work with both SQL and NoSQL databases?',
                    'answer' => 'Yes, we have expertise in optimizing both SQL databases (like MySQL, PostgreSQL, and SQL Server) and NoSQL databases (such as MongoDB, Cassandra, and Redis). Our team is well-versed in the unique characteristics and optimization strategies for various database systems.',
                ],
                [
                    'question' => 'How do you ensure data integrity during the optimization process?',
                    'answer' => 'Data integrity is our top priority during any optimization process. We use a combination of techniques including thorough testing in staging environments, implementing transactional processes where possible, and creating backups before making any significant changes. We also use monitoring tools to ensure that data remains consistent throughout the optimization process.',
                ],
                [
                    'question' => 'Can you help with database optimization in cloud environments?',
                    'answer' => 'Absolutely. We have extensive experience optimizing databases in various cloud environments, including AWS, Google Cloud, and Azure. We can help you leverage cloud-specific features and services to enhance your database performance, implement effective scaling strategies, and optimize costs in cloud settings.',
                ],
                [
                    'question' => 'How long does the database optimization process typically take?',
                    'answer' => 'The duration of the optimization process can vary depending on the size and complexity of your database, as well as the specific issues being addressed. A basic optimization might take a few days, while more complex projects could span several weeks. We always provide a detailed timeline and keep you updated throughout the process.',
                ],
            ],
            'devops' => [
                [
                    'question' => 'What DevOps tools do you use?',
                    'answer' => 'We use a wide range of DevOps tools, including but not limited to Jenkins, GitLab CI/CD, Docker, Kubernetes, Ansible, and Terraform. We\'ll help you choose and implement the best tools for your specific needs and existing technology stack.',
                ],
                [
                    'question' => 'How long does it take to implement DevOps practices?',
                    'answer' => 'The timeline for implementing DevOps practices varies depending on the size and complexity of your organization. Typically, initial implementation can take 3-6 months, with ongoing optimization and cultural shifts continuing beyond that. We\'ll work with you to create a tailored implementation plan.',
                ],
                [
                    'question' => 'How do you measure the success of DevOps implementation?',
                    'answer' => 'We measure success through various metrics, including deployment frequency, lead time for changes, mean time to recovery (MTTR), and change failure rate. We\'ll also look at team satisfaction and collaboration improvements. We\'ll work with you to establish baseline metrics and track improvements over time.',
                ],
                [
                    'question' => 'Can DevOps practices be implemented in a non-tech company?',
                    'answer' => 'While DevOps originated in the tech industry, its principles can be applied to any organization that develops or maintains software, regardless of the industry. We have experience implementing DevOps practices in various sectors, including finance, healthcare, and manufacturing.',
                ],
                [
                    'question' => 'How does DevOps impact security?',
                    'answer' => 'DevOps and security go hand-in-hand in what\'s often called DevSecOps. By integrating security practices into the DevOps workflow, we can improve your overall security posture. This includes implementing automated security testing, continuous monitoring, and rapid response to vulnerabilities. The result is a more secure development and deployment process.',
                ],
            ],
            'infrastructure-as-code' => [
                [
                    'question' => 'What is Infrastructure as Code (IaC)?',
                    'answer' => 'Infrastructure as Code (IaC) is the practice of managing and provisioning computing infrastructure through machine-readable definition files, rather than physical hardware configuration or interactive configuration tools. It allows you to manage your IT infrastructure using configuration files, making it easier to edit and distribute configurations, and ensuring that you provision the same environment every time.',
                ],
                [
                    'question' => 'What are the benefits of using Infrastructure as Code?',
                    'answer' => 'IaC offers numerous benefits, including: 1) Consistency and reduced errors in infrastructure deployment, 2) Faster provisioning and scaling of infrastructure, 3) Version control and change tracking for infrastructure, 4) Easier collaboration among team members, 5) Improved documentation of infrastructure, 6) Cost reduction through efficient resource utilization, and 7) Enhanced security through consistent application of security policies.',
                ],
                [
                    'question' => 'Which IaC tools do you work with?',
                    'answer' => 'We work with a variety of IaC tools to suit different needs and environments. Some popular tools we use include Terraform, AWS CloudFormation, Ansible, Puppet, and Chef. We also have experience with newer tools like Pulumi and cloud-specific solutions like Azure Resource Manager. We can help you choose the best tool for your specific requirements and integrate it into your workflow.',
                ],
                [
                    'question' => 'How do you ensure security in IaC implementations?',
                    'answer' => 'Security is a crucial aspect of our IaC implementations. We incorporate security best practices into our IaC templates, including proper access controls, encryption, and network segmentation. We also use tools to scan IaC code for potential security issues and integrate security checks into the CI/CD pipeline. Additionally, we implement infrastructure monitoring and logging to detect and respond to potential security incidents.',
                ],
                [
                    'question' => 'Can you integrate IaC with our existing CI/CD pipeline?',
                    'answer' => 'Yes, we specialize in integrating IaC with existing CI/CD pipelines. This integration allows for automated testing and deployment of infrastructure changes alongside your application code. We can work with various CI/CD tools such as Jenkins, GitLab CI, GitHub Actions, and others to ensure seamless integration of your IaC workflows.',
                ],
                [
                    'question' => 'How long does it typically take to implement an IaC solution?',
                    'answer' => 'The timeline for implementing an IaC solution can vary depending on the complexity of your infrastructure and the scope of the project. A basic implementation might take a few weeks, while more complex, enterprise-wide solutions could take several months. We work closely with your team to develop a phased approach, often starting with a pilot project to demonstrate value quickly before expanding to your full infrastructure.',
                ],
            ],
            'infrastructure-migration' => [
                [
                    'question' => 'How long does a typical infrastructure migration take?',
                    'answer' => 'The duration of an infrastructure migration can vary significantly depending on the size and complexity of your current infrastructure, as well as the target environment. A small to medium-sized migration might take a few weeks to a couple of months, while larger, more complex migrations could take several months to a year. We work closely with you to develop a realistic timeline and ensure minimal disruption to your operations throughout the process.',
                ],
                [
                    'question' => 'How do you ensure data security during the migration process?',
                    'answer' => 'Data security is our top priority during migrations. We implement multiple layers of security measures, including encryption for data in transit and at rest, secure VPN connections, and strict access controls. We also perform thorough security audits before, during, and after the migration process. Additionally, we ensure compliance with relevant industry standards and regulations throughout the migration.',
                ],
                [
                    'question' => 'Can you migrate our infrastructure to multiple cloud providers?',
                    'answer' => 'Yes, we have expertise in multi-cloud migrations. We can help you distribute your infrastructure across multiple cloud providers to optimize for cost, performance, and redundancy. Our team is well-versed in the nuances of different cloud platforms and can design a migration strategy that leverages the strengths of each provider while ensuring interoperability and efficient management.',
                ],
                [
                    'question' => 'How do you handle legacy systems during migration?',
                    'answer' => 'Legacy systems often require special attention during migrations. Our approach includes thorough assessment of legacy systems, identifying dependencies, and determining the best migration strategy - whether it\'s lift-and-shift, re-platforming, or re-architecting. We may use specialized tools for legacy migrations and often implement middleware or APIs to ensure compatibility with modern systems. In some cases, we might recommend phased migration approaches to minimize risk and disruption.',
                ],
                [
                    'question' => 'What kind of support do you provide post-migration?',
                    'answer' => 'Our support doesn\'t end with the migration. We provide comprehensive post-migration support, including monitoring, optimization, and troubleshooting. We ensure that your team is well-trained on the new infrastructure and can manage day-to-day operations. We also offer ongoing managed services if you prefer to have continuous expert support. Our goal is to ensure that you\'re getting the maximum benefit from your newly migrated infrastructure.',
                ],
                [
                    'question' => 'How do you minimize downtime during the migration process?',
                    'answer' => 'Minimizing downtime is a critical aspect of our migration strategy. We employ several techniques including parallel environments, data synchronization, incremental migration, off-peak scheduling, automated migration tools, and robust rollback procedures. Our goal is to make the transition as seamless as possible, often achieving near-zero downtime for critical systems.',
                ],
            ],
            'mlops' => [
                [
                    'question' => 'What is MLOps and why is it important?',
                    'answer' => 'MLOps, or Machine Learning Operations, is a set of practices that combines Machine Learning, DevOps, and Data Engineering to deploy and maintain ML models in production reliably and efficiently. It\'s important because it addresses the unique challenges of ML systems, such as reproducibility, versioning, and the need for continuous monitoring and retraining. MLOps helps organizations move from experimental ML projects to production-ready AI systems that deliver consistent business value.',
                ],
                [
                    'question' => 'How does MLOps differ from traditional DevOps?',
                    'answer' => 'While MLOps builds on DevOps principles, it addresses the specific needs of ML systems. Key differences include: 1) Data versioning and management, as ML models depend heavily on data, 2) Model versioning, which goes beyond code versioning, 3) Experiment tracking and reproducibility, 4) Model-specific testing and validation, 5) Continuous monitoring for model performance and data drift, and 6) Automated retraining and deployment of models. These additional complexities make MLOps a specialized field that requires expertise in both ML and operations.',
                ],
                [
                    'question' => 'What are the key components of an MLOps pipeline?',
                    'answer' => 'A comprehensive MLOps pipeline typically includes the following key components: 1) Data ingestion and preparation, 2) Feature engineering and storage, 3) Model training and hyperparameter tuning, 4) Model evaluation and validation, 5) Model versioning and registry, 6) Model deployment and serving, 7) Monitoring and logging, 8) Automated retraining and deployment. Each of these components requires careful design and implementation to ensure a smooth, efficient, and reliable ML workflow.',
                ],
                [
                    'question' => 'How do you handle model versioning in MLOps?',
                    'answer' => 'Model versioning is crucial in MLOps to ensure reproducibility and traceability. We use specialized tools like MLflow or DVC (Data Version Control) to version not just the model code, but also the data, hyperparameters, and entire training environment. This allows us to recreate any model version exactly as it was. We also implement a model registry that serves as a centralized repository for managing model versions, including metadata about each version\'s performance, training data, and deployment status.',
                ],
                [
                    'question' => 'How do you ensure the security of ML models and data in an MLOps setup?',
                    'answer' => 'Security is a critical aspect of our MLOps implementations. We employ several strategies: 1) Data encryption both at rest and in transit, 2) Strict access controls and authentication for all components of the ML pipeline, 3) Secure model serving with API authentication and rate limiting, 4) Regular security audits and vulnerability assessments, 5) Compliance with data protection regulations like GDPR or CCPA, 6) Secure feature stores with proper data governance, and 7) Monitoring for unusual access patterns or potential data leaks. We also work closely with your security team to ensure our MLOps setup aligns with your organization\'s security policies.',
                ],
                [
                    'question' => 'Can you help with the transition from traditional data science workflows to MLOps?',
                    'answer' => 'We specialize in helping organizations make this transition. Our approach includes: 1) Assessing your current workflows and identifying areas for improvement, 2) Introducing MLOps tools and practices gradually to minimize disruption, 3) Setting up automated CI/CD pipelines for ML workflows, 4) Implementing proper versioning for data, code, and models, 5) Establishing monitoring and logging practices for production models, 6) Training your team on MLOps best practices and tools. We understand that this transition can be challenging, so we work closely with your team to ensure a smooth adoption of MLOps practices.',
                ],
            ],
            'monitoring-observability' => [
                [
                    'question' => 'What\'s the difference between monitoring and observability?',
                    'answer' => 'While monitoring and observability are related, they serve different purposes. Monitoring typically involves tracking predefined sets of metrics and logs to understand the health and performance of systems. Observability, on the other hand, goes a step further by providing deeper insights into the internal states of systems based on the data they generate. It allows you to understand and debug complex systems, even when facing unforeseen issues.',
                ],
                [
                    'question' => 'What tools do you use for monitoring and observability?',
                    'answer' => 'We use a variety of tools depending on the specific needs and existing infrastructure of each client. Some common tools we work with include Prometheus, Grafana, ELK stack (Elasticsearch, Logstash, Kibana), Datadog, New Relic, and cloud-native solutions like AWS CloudWatch or Google Cloud\'s operations suite. We can also integrate with existing tools you may already be using.',
                ],
                [
                    'question' => 'How can improved monitoring and observability benefit my business?',
                    'answer' => 'Improved monitoring and observability can significantly benefit your business by providing real-time insights into your systems\' performance and health. This leads to faster problem detection and resolution, reduced downtime, improved user experience, and more efficient resource utilization. It also enables data-driven decision making and can help in capacity planning and cost optimization.',
                ],
                [
                    'question' => 'Can you help with setting up custom dashboards and alerts?',
                    'answer' => 'Yes, we specialize in creating custom dashboards and alert systems tailored to your specific needs. We work closely with your team to understand what metrics and indicators are most important for your business, and then design intuitive, informative dashboards to visualize this data. We also set up intelligent alerting systems that can notify the right people at the right time, helping to minimize false alarms and ensure quick responses to real issues.',
                ],
                [
                    'question' => 'How do you handle monitoring for microservices architectures?',
                    'answer' => 'Monitoring microservices architectures requires a specialized approach due to their distributed nature. We implement distributed tracing to track requests across multiple services, use service meshes for improved visibility, and set up centralized logging and monitoring solutions. We also focus on implementing effective health checks, dependency mapping, and anomaly detection to ensure the overall health and performance of your microservices ecosystem.',
                ],
            ],
            'multi-cloud-architecture' => [
                [
                    'question' => 'What are the benefits of a multi-cloud architecture?',
                    'answer' => 'Multi-cloud architecture offers several key benefits: 1) Reduced vendor lock-in and dependency, 2) Ability to leverage the best services from each provider, 3) Enhanced reliability and redundancy, 4) Potential cost savings through provider competition, 5) Geographic flexibility for global deployments, and 6) Improved disaster recovery capabilities.',
                ],
                [
                    'question' => 'How do you handle security across multiple cloud providers?',
                    'answer' => 'We implement a comprehensive security strategy that includes: 1) Unified identity and access management across providers, 2) Consistent security policies and compliance standards, 3) Centralized monitoring and threat detection, 4) Encrypted data transmission between clouds, 5) Regular security audits and assessments, and 6) Automated security controls and policies enforcement.',
                ],
                [
                    'question' => 'How do you ensure consistent performance across different cloud providers?',
                    'answer' => 'We maintain consistent performance through: 1) Automated performance monitoring and alerting, 2) Load balancing across providers, 3) Optimized network connectivity and routing, 4) Regular performance benchmarking and optimization, 5) Service-level agreement (SLA) monitoring, and 6) Proactive capacity planning and scaling.',
                ],
                [
                    'question' => 'How do you manage costs in a multi-cloud environment?',
                    'answer' => 'Cost management in multi-cloud environments involves: 1) Centralized cost monitoring and reporting, 2) Automated resource optimization and scaling, 3) Strategic workload placement based on provider pricing, 4) Reserved capacity planning across providers, 5) Regular cost analysis and optimization recommendations, and 6) Implementation of cost allocation and chargeback mechanisms.',
                ],
                [
                    'question' => 'How do you handle data synchronization between different cloud providers?',
                    'answer' => 'Data synchronization is managed through: 1) Real-time data replication services, 2) Automated backup and recovery processes, 3) Consistent data governance policies, 4) Optimized data transfer routes, 5) Monitoring of data consistency and integrity, and 6) Implementation of disaster recovery and failover procedures.',
                ],
                [
                    'question' => 'What tools do you use for multi-cloud management?',
                    'answer' => 'We utilize a variety of tools including: 1) Terraform for infrastructure as code across providers, 2) Kubernetes for container orchestration, 3) HashiCorp Vault for secrets management, 4) Prometheus and Grafana for monitoring, 5) CI/CD tools for automated deployments, and 6) Custom dashboards for unified visibility and control.',
                ],
            ],
            'performance-optimization' => [
                [
                    'question' => 'What areas of performance do you focus on?',
                    'answer' => 'We focus on all aspects of application and infrastructure performance, including frontend responsiveness, backend efficiency, database optimization, network latency reduction, and infrastructure scalability. Our goal is to improve overall system performance, reduce response times, and enhance user experience.',
                ],
                [
                    'question' => 'How long does the performance optimization process typically take?',
                    'answer' => 'The duration of the optimization process varies depending on the complexity of your system and the scope of improvements needed. A typical engagement might last 4-8 weeks for the initial assessment and implementation of key optimizations. However, we also offer ongoing optimization services to ensure continued performance improvements over time.',
                ],
                [
                    'question' => 'Can you help with mobile app performance optimization?',
                    'answer' => 'Yes, we have expertise in optimizing both native mobile apps and mobile web applications. Our mobile optimization services include improving app launch times, reducing battery consumption, optimizing network requests, and enhancing overall app responsiveness. We use mobile-specific profiling tools and follow best practices for iOS and Android platforms.',
                ],
                [
                    'question' => 'How do you approach database performance optimization?',
                    'answer' => 'Our database optimization approach includes analyzing query performance, optimizing indexing strategies, improving data models, and fine-tuning database configurations. We work with various database systems, including SQL databases like MySQL and PostgreSQL, as well as NoSQL databases like MongoDB. We also implement caching strategies and database sharding when necessary to improve scalability.',
                ],
                [
                    'question' => 'Do you offer performance optimization for e-commerce platforms?',
                    'answer' => 'Absolutely. We have extensive experience optimizing e-commerce platforms to handle high traffic volumes, especially during peak sales periods. Our e-commerce optimization services include improving page load times, optimizing checkout processes, implementing efficient caching strategies, and ensuring seamless integration with payment gateways and inventory management systems.',
                ],
                [
                    'question' => 'How do you measure the success of performance optimizations?',
                    'answer' => 'We use a variety of metrics to measure the success of our optimizations, including response times, throughput, error rates, and resource utilization. We also focus on business-relevant metrics such as conversion rates, user engagement, and customer satisfaction scores. We implement comprehensive monitoring solutions to track these metrics before, during, and after the optimization process, providing you with clear visibility into the improvements achieved.',
                ],
            ],
            'security-consulting' => [
                [
                    'question' => 'What types of security assessments do you offer?',
                    'answer' => 'We offer a wide range of security assessments, including vulnerability assessments, penetration testing, code reviews, network security assessments, cloud security assessments, and social engineering tests. Our approach is tailored to your specific needs and risk profile.',
                ],
                [
                    'question' => 'How often should we conduct security assessments?',
                    'answer' => 'The frequency of security assessments depends on various factors, including your industry, regulatory requirements, and risk profile. Generally, we recommend conducting comprehensive assessments at least annually, with more frequent targeted assessments for critical systems or after significant changes to your infrastructure.',
                ],
                [
                    'question' => 'Can you help with compliance requirements (e.g., GDPR, HIPAA, PCI DSS)?',
                    'answer' => 'Yes, we have extensive experience in helping organizations achieve and maintain compliance with various regulatory standards. Our team is well-versed in GDPR, HIPAA, PCI DSS, ISO 27001, and other industry-specific regulations. We can assist with gap analysis, implementation of required controls, and preparation for audits.',
                ],
                [
                    'question' => 'How do you handle the security of cloud environments?',
                    'answer' => 'We have expertise in securing cloud environments across major providers like AWS, Azure, and Google Cloud. Our approach includes assessing cloud configurations, implementing security best practices, setting up proper identity and access management, ensuring data encryption, and establishing continuous monitoring. We also assist with cloud-native security tools and services specific to each platform.',
                ],
                [
                    'question' => 'What\'s your approach to incident response planning?',
                    'answer' => 'Our incident response planning service involves developing a comprehensive plan tailored to your organization. This includes defining roles and responsibilities, establishing communication protocols, creating incident classification and escalation procedures, and setting up tools for detection and response. We also conduct tabletop exercises to test and refine the plan, ensuring your team is prepared to handle security incidents effectively.',
                ],
                [
                    'question' => 'How do you stay updated with the latest security threats and technologies?',
                    'answer' => 'Staying current is crucial in the rapidly evolving field of cybersecurity. Our team regularly participates in industry conferences, undergoes continuous training, and maintains various security certifications. We also subscribe to threat intelligence feeds, participate in security communities, and conduct ongoing research to stay ahead of emerging threats and technologies.',
                ],
            ],
            'serverless-infrastructure' => [
                [
                    'question' => 'What is serverless infrastructure?',
                    'answer' => 'Serverless infrastructure is a cloud computing execution model where the cloud provider automatically manages the infrastructure needed to run your code. You only pay for the actual compute time used by your functions, making it highly cost-effective for many use cases. This approach eliminates the need to provision and manage servers, allowing developers to focus solely on writing code.',
                ],
                [
                    'question' => 'What are the benefits of going serverless?',
                    'answer' => 'Serverless offers numerous benefits including: 1) Reduced operational costs - pay only for actual usage, 2) Automatic scaling - handles varying workloads efficiently, 3) Reduced maintenance - no server management required, 4) Faster time to market - focus on code, not infrastructure, 5) Built-in high availability and fault tolerance, and 6) Improved developer productivity through simplified deployment and operations.',
                ],
                [
                    'question' => 'Is serverless suitable for all applications?',
                    'answer' => 'While serverless is powerful, it\'s not a one-size-fits-all solution. It\'s particularly well-suited for event-driven applications, APIs, data processing, and applications with variable workloads. However, applications with consistent, long-running processes or those requiring very low latency might be better served by traditional server-based architectures. We can help evaluate your specific use case to determine if serverless is the right choice.',
                ],
                [
                    'question' => 'How do you handle monitoring and debugging in serverless applications?',
                    'answer' => 'We implement comprehensive monitoring and debugging strategies using cloud-native tools and third-party solutions. This includes: 1) Distributed tracing for function execution, 2) Detailed logging and error tracking, 3) Performance metrics monitoring, 4) Cost tracking and optimization, and 5) Real-time alerts for issues. We also implement proper error handling and retry mechanisms to ensure reliable operation.',
                ],
                [
                    'question' => 'How do you ensure security in serverless applications?',
                    'answer' => 'Security in serverless applications involves multiple layers: 1) Function-level security through proper IAM roles and permissions, 2) API security using authentication and authorization, 3) Data security through encryption at rest and in transit, 4) Network security with VPC integration when needed, 5) Regular security audits and vulnerability scanning, and 6) Compliance with relevant standards and regulations.',
                ],
                [
                    'question' => 'How do you handle state management in serverless applications?',
                    'answer' => 'While serverless functions are stateless by nature, we implement various strategies for state management: 1) Using managed database services like DynamoDB or Aurora Serverless, 2) Leveraging caching services for performance optimization, 3) Implementing event-driven architectures for complex workflows, 4) Using step functions for orchestration, and 5) Integrating with message queues for asynchronous processing.',
                ],
            ],
            'vibe-code-migration' => [
                [
                    'question' => 'Does migrating mean my prototype was a mistake?',
                    'answer' => 'No. Building fast with AI coding tools is a smart way to get a real product in front of people, and it worked. A prototype stack is meant to prove an idea, not run forever. Moving to a production language and framework is the next step after that, not a fix for a wrong first one.',
                ],
                [
                    'question' => 'Will we lose any data or features in the migration?',
                    'answer' => 'No. Keeping everything is the whole reason to do it carefully. We write down every feature in the current app and turn it into a checklist the new build has to pass. Data moves over in stages with row counts and key records verified on both sides. If something does not match, it does not ship.',
                ],
                [
                    'question' => 'Why not just keep scaling the current stack instead of moving?',
                    'answer' => 'Often that is the right call, and it is a separate service we offer called Vibe Scaler. Scaling in place works when the stack is sound and only its config and slow paths need attention. Migration is for when the stack itself is the ceiling, where the language or framework cannot get you where the product is going no matter how much you tune it. We will tell you honestly which case you are in before you spend anything.',
                ],
                [
                    'question' => 'How do you handle cutover and downtime?',
                    'answer' => 'We run the new app next to the old one rather than flipping a switch. Traffic moves across in stages, starting small, and we watch each step. The old version stays ready the whole time, so if anything looks wrong we route back to it in seconds while we sort it out.',
                ],
                [
                    'question' => 'What languages and frameworks do you migrate to?',
                    'answer' => 'Whatever fits where your product is heading. In practice that is often a typed backend on Node, Python, Go, or PHP with a framework like Laravel, a React front end, and PostgreSQL behind it. We pick the target for the next few years of the product, not just the next release.',
                ],
                [
                    'question' => 'How long does a migration take?',
                    'answer' => 'It depends on how much the app does, which is why the first step is mapping every feature. A small app can move in a few weeks. A larger one ships in stages, with parts running on the new stack while the rest still runs on the old one, so you are never waiting on one big release.',
                ],
            ],
            'vibe-scaling' => [
                [
                    'question' => 'Is there something wrong with vibe coding my app?',
                    'answer' => 'No. Building with AI coding tools to get a real product in front of people is a smart way to start, and it worked. You have users, and payments are coming in. That is the hard part, and most ideas never reach it. Scaling what you built is a different kind of work, and that is the part we do.',
                ],
                [
                    'question' => 'What does scaling in place mean?',
                    'answer' => 'It means we improve the app you already have instead of rewriting it. We keep your language, framework, and hosting, and fix the parts that cannot keep up with your traffic. You keep running your business while we do it.',
                ],
                [
                    'question' => 'What if my app actually needs a full rewrite?',
                    'answer' => 'Sometimes it does. If your stack has hit a real ceiling and no amount of tuning will get it where you need to go, we will tell you that plainly. Moving an app to a different language or framework is a separate service we offer, so you get an honest answer instead of patches that will not hold.',
                ],
                [
                    'question' => 'How do you decide what to fix first?',
                    'answer' => 'We measure before we touch anything. We run your app under load that matches your real traffic, watch where it slows down or falls over, and start with the changes that buy you the most headroom for the least risk.',
                ],
                [
                    'question' => 'Will my app go down while you work on it?',
                    'answer' => 'No. We ship changes in small pieces and test each one before it goes live. We also set up a fast way to roll back a deploy, so if something looks wrong after a release we can undo it in seconds.',
                ],
                [
                    'question' => 'Which stacks do you work with?',
                    'answer' => 'Most apps that come out of tools like Cursor, Bolt, Lovable, Replit, and v0. In practice that means React or Next.js on the front end, a Node, Python, or PHP backend, and PostgreSQL or MySQL behind it. If you are on something else, ask us and we will tell you honestly whether we can help.',
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
