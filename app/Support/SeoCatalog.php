<?php

namespace App\Support;

use Illuminate\Http\Request;

final class SeoCatalog
{
    /**
     * @return list<string>
     */
    public static function personSameAs(): array
    {
        return [
            'https://github.com/HarunRRayhan',
            'https://www.linkedin.com/in/harunrrayhan/',
            'https://x.com/harundotdev',
        ];
    }

    public static function forRequest(Request $request): ?SeoMeta
    {
        return self::forPath(self::normalizePath($request->path()));
    }

    public static function forPath(string $path): ?SeoMeta
    {
        $path = self::normalizePath($path);
        $pages = self::pages();

        return $pages[$path] ?? null;
    }

    public static function normalizePath(string $path): string
    {
        $path = '/'.ltrim($path, '/');

        if ($path === '/' || $path === '') {
            return '/';
        }

        return rtrim($path, '/') ?: '/';
    }

    public static function assetUrl(string $path): string
    {
        return Cdn::url($path);
    }

    public static function defaultOgImage(): string
    {
        return self::assetUrl('/images/og/bio.jpg');
    }

    private static function absoluteAssetUrl(?string $path): ?string
    {
        if ($path === null || $path === '') {
            return null;
        }

        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return $path;
        }

        return self::assetUrl($path);
    }

    public static function siteName(): string
    {
        return 'Harun R. Rayhan';
    }

    /**
     * @return array<string, SeoMeta>
     */
    public static function pages(): array
    {
        $siteUrl = SiteCatalog::siteUrl();
        $pages = [];

        $pages['/'] = new SeoMeta(
            title: 'Harun R. Rayhan - Senior Software Engineer & DevOps Consultant',
            description: 'Expert software engineer and DevOps consultant specializing in cloud architecture, AWS solutions, and infrastructure automation.',
            canonicalUrl: $siteUrl.'/',
            ogImage: self::defaultOgImage(),
            ogType: 'website',
            jsonLd: [self::personGraph($siteUrl)],
        );

        $pages['/about'] = new SeoMeta(
            title: 'About Harun | Cloud Architect & DevOps Engineer',
            description: 'Learn about Harun\'s journey, expertise in cloud architecture, DevOps engineering, and professional experience.',
            canonicalUrl: $siteUrl.'/about',
            ogType: 'profile',
        );

        $pages['/services'] = new SeoMeta(
            title: 'Professional Cloud & DevOps Services | Harun\'s Portfolio',
            description: 'Expert cloud computing, DevOps, and software engineering services including AWS, Infrastructure as Code, CI/CD, security consulting, and performance optimization.',
            canonicalUrl: $siteUrl.'/services',
        );

        $pages['/contact'] = new SeoMeta(
            title: 'Contact Harun | Cloud & DevOps Consulting Services',
            description: 'Get in touch for expert cloud computing and DevOps consulting services. Let\'s discuss your project needs in AWS, infrastructure automation, CI/CD, or any other cloud services.',
            canonicalUrl: $siteUrl.'/contact',
        );

        $pages['/book'] = new SeoMeta(
            title: 'Book a Consultation | Cloud & DevOps Expert - Harun R. Rayhan',
            description: 'Book a paid DevOps consultation (Light, Pro, or Max). The first 1,001 booking requests get $100 off before any valid coupon is applied.',
            canonicalUrl: $siteUrl.'/book',
        );

        $pages['/products'] = new SeoMeta(
            title: 'Products | Harun R. Rayhan',
            description: 'Products built by Harun R. Rayhan - Toolblip, PloyCloud, Crontinel, Appnary, and Amazing Plugins.',
            canonicalUrl: $siteUrl.'/products',
        );

        $pages['/bio'] = new SeoMeta(
            title: 'Harun R. Rayhan | Bio',
            description: "Harun R. Rayhan's bio page with quick links to his portfolio, blog, contact details, and social profiles.",
            canonicalUrl: $siteUrl.'/bio',
            ogImage: self::assetUrl('/images/og/bio.jpg'),
        );

        $pages['/hrr'] = new SeoMeta(
            title: 'Harun R. Rayhan | বায়ো',
            description: 'হারুন আর রায়হানের বায়ো পেজ, যেখানে পাবেন পোর্টফোলিও, ব্লগ, যোগাযোগের তথ্য এবং সোশ্যাল মিডিয়া প্রোফাইলের দ্রুত লিংক।',
            canonicalUrl: $siteUrl.'/hrr',
            ogImage: self::assetUrl('/images/og/bio.jpg'),
        );

        $pages['/blog'] = new SeoMeta(
            title: 'Blog | Harun R. Rayhan',
            description: 'Writing on AWS, DevOps, Laravel, serverless, and shipping production systems.',
            canonicalUrl: $siteUrl.'/blog',
        );

        $pages['/case-studies'] = new SeoMeta(
            title: 'Case Studies | Harun R. Rayhan',
            description: 'Anonymized cloud and DevOps case studies from client engagements.',
            canonicalUrl: $siteUrl.'/case-studies',
        );

        $pages['/slides'] = new SeoMeta(
            title: 'Slides | Harun R. Rayhan',
            description: 'Talk decks and presentations on cloud, DevOps, and AWS.',
            canonicalUrl: $siteUrl.'/slides',
        );

        $pages['/videos'] = new SeoMeta(
            title: 'Videos | Harun R. Rayhan',
            description: 'Recorded talks and walkthroughs on cloud, DevOps, and AWS.',
            canonicalUrl: $siteUrl.'/videos',
        );

        $pages['/privacy'] = new SeoMeta(
            title: 'Privacy Policy | Harun\'s Portfolio',
            description: 'Privacy policy and data protection information for Harun\'s Portfolio website and services.',
            canonicalUrl: $siteUrl.'/privacy',
        );

        $pages['/terms'] = new SeoMeta(
            title: 'Terms of Service | Harun\'s Portfolio',
            description: 'Terms of service and conditions for using Harun\'s Portfolio website and services.',
            canonicalUrl: $siteUrl.'/terms',
        );

        $pages['/admin/dashboard'] = new SeoMeta(
            title: 'Dashboard | Harun R. Rayhan - Cloud & DevOps Services',
            description: 'Access your personal dashboard to manage your cloud and DevOps services, view project status, and track consultations.',
            canonicalUrl: $siteUrl.'/admin/dashboard',
            noindex: true,
        );

        foreach (self::servicePages() as $path => $meta) {
            $pages[$path] = $meta;
        }

        return $pages;
    }

    /**
     * @return array<string, SeoMeta>
     */
    private static function servicePages(): array
    {
        $siteUrl = SiteCatalog::siteUrl();
        $bySlug = [];

        foreach (SiteCatalog::services() as [$name, $path, $brief]) {
            $slug = ltrim($path, '/');
            $slug = str_starts_with($slug, 'services/') ? substr($slug, strlen('services/')) : $slug;
            $bySlug[$slug] = ['name' => $name, 'path' => $path, 'brief' => $brief];
        }

        $overrides = [
            'cloud-architecture' => [
                'title' => 'Cloud Architecture | Harun R. Rayhan',
                'description' => 'Design and implement scalable, secure, and cost-effective cloud architectures for your business.',
            ],
            'devops' => [
                'title' => 'DevOps Implementation & Consulting Services | Harun R. Rayhan',
                'description' => 'Transform your development and operations with expert DevOps consulting services. Implement CI/CD pipelines, automation, and modern DevOps practices to accelerate your software delivery.',
            ],
            'infrastructure-as-code' => [
                'title' => 'Infrastructure as Code (IaC) Services | Harun R. Rayhan',
                'description' => 'Expert Infrastructure as Code (IaC) services using Terraform, AWS CDK, and other modern tools. Automate your infrastructure deployment and management for better efficiency and reliability.',
            ],
            'serverless-infrastructure' => [
                'title' => 'Serverless Infrastructure Services | Harun R. Rayhan',
                'description' => 'Expert serverless architecture and implementation services. Build scalable, cost-effective applications using AWS Lambda, Azure Functions, and other serverless technologies.',
            ],
            'automated-deployment' => [
                'title' => 'Automated Deployment & CI/CD Services | Harun R. Rayhan',
                'description' => 'Expert automated deployment and CI/CD implementation services. Streamline your software delivery pipeline with efficient automation and reliable deployment processes.',
            ],
            'security-consulting' => [
                'title' => 'Security Consulting & Implementation Services | Harun R. Rayhan',
                'description' => 'Expert security consulting services. Protect your infrastructure and applications with comprehensive security assessments, implementation, and best practices.',
            ],
            'performance-optimization' => [
                'title' => 'Cloud Performance Optimization Services | Harun R. Rayhan',
                'description' => 'Expert cloud performance optimization services. Enhance your cloud infrastructure efficiency, reduce costs, and improve application performance through advanced optimization techniques.',
            ],
            'infrastructure-migration' => [
                'title' => 'Infrastructure Migration Services | Harun R. Rayhan',
                'description' => 'Expert infrastructure migration services. Seamlessly migrate your infrastructure to modern platforms with minimal disruption and maximum efficiency.',
            ],
            'mlops' => [
                'title' => 'MLOps & Machine Learning Operations Services | Harun R. Rayhan',
                'description' => 'Expert MLOps services. Streamline your machine learning operations with automated pipelines, model deployment, and monitoring solutions.',
            ],
            'database-migration' => [
                'title' => 'Database Migration Services | Harun R. Rayhan',
                'description' => 'Expert database migration services. Seamlessly migrate your databases to modern platforms with minimal downtime and zero data loss.',
            ],
            'monitoring-observability' => [
                'title' => 'Monitoring & Observability Services | Harun R. Rayhan',
                'description' => 'Expert monitoring and observability services. Gain deep insights into your systems with comprehensive monitoring, logging, and observability solutions.',
            ],
            'database-optimization' => [
                'title' => 'Database Performance Optimization Services | Harun R. Rayhan',
                'description' => 'Expert database optimization services. Enhance your database performance, improve query efficiency, and optimize resource utilization for better scalability.',
            ],
            'aws-cloud' => [
                'title' => 'AWS Cloud Services & Solutions | Harun R. Rayhan',
                'description' => 'Expert AWS cloud solutions and consulting services. Leverage the full power of Amazon Web Services with our certified professionals for scalable, secure, and cost-effective cloud infrastructure.',
            ],
            'multi-cloud-architecture' => [
                'title' => 'Multi-Cloud Architecture Services | Harun R. Rayhan',
                'description' => 'Expert multi-cloud architecture and implementation services. Design and manage efficient cloud solutions across AWS, Azure, Google Cloud, and other providers.',
            ],
            'vibe-scaling' => [
                'title' => 'Vibe Scaler: Scale Your AI-Built App | Harun R. Rayhan',
                'description' => 'You built your app fast with AI coding tools and it found real users. We scale it in place: performance under load, database fixes, monitoring, and reliability, no rewrite required.',
            ],
            'vibe-code-migration' => [
                'title' => 'Vibe Code Migration: Port Your AI-Built App to a Production Stack | Harun R. Rayhan',
                'description' => 'Your prototype found real users, but the stack it started on cannot be its permanent home. We port it to a production language and framework, feature for feature, without losing data or the users you already have.',
            ],
        ];

        $pages = [];

        foreach ($bySlug as $slug => $row) {
            $override = $overrides[$slug] ?? [];
            $path = $row['path'];
            $canonical = $siteUrl.$path;
            $title = $override['title'] ?? ($row['name'].' | Harun R. Rayhan');
            $description = $override['description'] ?? $row['brief'];
            $faqs = ServiceFaqs::forSlug($slug);

            $jsonLd = [self::serviceGraph($row['name'], $description, $canonical)];

            if ($faqs !== []) {
                $jsonLd[] = self::faqPageGraph($faqs);
            }

            $pages[$path] = new SeoMeta(
                title: $title,
                description: $description,
                canonicalUrl: $canonical,
                ogImage: self::assetUrl('/service-assets/'.$slug.'/hero.jpg'),
                jsonLd: $jsonLd,
            );
        }

        return $pages;
    }

    /**
     * @return array<string, mixed>
     */
    public static function personGraph(string $siteUrl): array
    {
        $siteUrl = rtrim($siteUrl, '/');

        return [
            '@context' => 'https://schema.org',
            '@type' => 'Person',
            '@id' => $siteUrl.'/#person',
            'name' => 'Harun R. Rayhan',
            'jobTitle' => 'Senior Software Engineer & DevOps Consultant',
            'description' => 'Expert software engineer and DevOps consultant specializing in cloud architecture and AWS solutions',
            'url' => $siteUrl.'/',
            'sameAs' => self::personSameAs(),
            'worksFor' => [
                '@id' => $siteUrl.'/#organization',
            ],
            'knowsAbout' => [
                'Software Engineering',
                'DevOps',
                'Cloud Architecture',
                'AWS',
                'Infrastructure Automation',
                'CI/CD',
                'Cloud Security',
            ],
            'offers' => [
                '@type' => 'Offer',
                'name' => 'DevOps and Cloud Consulting Services',
                'description' => 'Professional consulting services in cloud architecture, DevOps implementation, and infrastructure automation',
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function serviceGraph(string $name, string $description, string $canonicalUrl): array
    {
        return [
            '@context' => 'https://schema.org',
            '@type' => 'Service',
            'name' => $name,
            'description' => $description,
            'url' => $canonicalUrl,
            'provider' => [
                '@type' => 'Person',
                'name' => 'Harun R. Rayhan',
                'url' => SiteCatalog::siteUrl().'/',
            ],
            'serviceType' => $name,
        ];
    }

    /**
     * @param  list<array{question: string, answer: string}>  $faqs
     * @return array<string, mixed>
     */
    public static function faqPageGraph(array $faqs): array
    {
        return [
            '@context' => 'https://schema.org',
            '@type' => 'FAQPage',
            'mainEntity' => array_map(fn (array $faq) => [
                '@type' => 'Question',
                'name' => $faq['question'],
                'acceptedAnswer' => [
                    '@type' => 'Answer',
                    'text' => $faq['answer'],
                ],
            ], $faqs),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function articleGraph(
        string $type,
        string $headline,
        string $description,
        string $canonicalUrl,
        ?string $datePublished = null,
        ?string $image = null,
        string $publisherName = 'Harun R. Rayhan',
        ?string $publisherUrl = null,
    ): array {
        $publisherUrl = rtrim($publisherUrl ?? SiteCatalog::siteUrl(), '/');
        $absoluteImage = self::absoluteAssetUrl($image);

        $graph = [
            '@context' => 'https://schema.org',
            '@type' => $type,
            'headline' => $headline,
            'description' => $description,
            'author' => [
                '@type' => 'Person',
                'name' => 'Harun R. Rayhan',
            ],
            'publisher' => [
                '@type' => 'Organization',
                'name' => $publisherName,
                'url' => $publisherUrl,
            ],
            'mainEntityOfPage' => $canonicalUrl,
        ];

        if ($datePublished !== null && $datePublished !== '') {
            $graph['datePublished'] = $datePublished;
        }

        if ($absoluteImage !== null) {
            $graph['image'] = [$absoluteImage];
        }

        return $graph;
    }

    public static function forBlogPost(
        string $title,
        string $description,
        string $canonicalUrl,
        ?string $ogImage,
        bool $noindex = false,
        ?string $datePublished = null,
        ?string $publisherName = null,
        ?string $publisherUrl = null,
    ): SeoMeta {
        return new SeoMeta(
            title: $title.' | Harun\'s Blog',
            description: $description,
            canonicalUrl: $canonicalUrl,
            ogImage: $ogImage,
            ogType: 'article',
            jsonLd: [self::articleGraph(
                'BlogPosting',
                $title,
                $description,
                $canonicalUrl,
                $datePublished,
                $ogImage,
                $publisherName ?? 'Harun R. Rayhan',
                $publisherUrl,
            )],
            noindex: $noindex,
        );
    }

    public static function forCaseStudy(
        string $title,
        string $description,
        string $canonicalUrl,
        ?string $ogImage,
        ?string $datePublished = null,
    ): SeoMeta {
        return new SeoMeta(
            title: $title.' | Case Studies',
            description: $description,
            canonicalUrl: $canonicalUrl,
            ogImage: $ogImage,
            ogType: 'article',
            jsonLd: [self::articleGraph(
                'Article',
                $title,
                $description,
                $canonicalUrl,
                $datePublished,
                $ogImage,
            )],
        );
    }

    public static function forMedia(string $title, string $description, string $canonicalUrl, ?string $ogImage = null): SeoMeta
    {
        return new SeoMeta(
            title: $title,
            description: $description,
            canonicalUrl: $canonicalUrl,
            ogImage: $ogImage,
        );
    }
}
