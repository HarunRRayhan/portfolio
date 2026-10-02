<?php

namespace App\Support;

use App\Models\MediaItem;
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
            title: 'Harun R. Rayhan | AWS infrastructure',
            description: 'I design, ship, and run AWS infrastructure. The account, the pipeline, and what happens after it ships.',
            canonicalUrl: $siteUrl.'/',
            ogImage: self::defaultOgImage(),
            ogType: 'website',
            jsonLd: [self::personGraph($siteUrl)],
        );

        $pages['/about'] = new SeoMeta(
            title: '15 years, mostly on AWS | Harun R. Rayhan',
            description: '15 years, mostly on AWS. Cloud architecture, release automation, and production.',
            canonicalUrl: $siteUrl.'/about',
            ogType: 'profile',
            jsonLd: [self::webPageGraph('AboutPage', 'About Harun', $siteUrl.'/about')],
        );

        $pages['/sponsor-me'] = new SeoMeta(
            title: 'Why Sponsor My Work? | Harun R. Rayhan',
            description: "Support Harun R. Rayhan's practical technical writing, small tools, and independent experiments with a one-time or monthly contribution.",
            canonicalUrl: $siteUrl.'/sponsor-me',
            jsonLd: [self::webPageGraph('WebPage', 'Why Sponsor My Work?', $siteUrl.'/sponsor-me')],
        );

        $pages['/services'] = new SeoMeta(
            title: 'What I can help with | Harun R. Rayhan',
            description: 'An AI-built app that has to survive production, an AWS setup that\'s expensive or fragile, or a release process you don\'t trust.',
            canonicalUrl: $siteUrl.'/services',
            ogImage: self::assetUrl('/service-assets/services/hero.jpg'),
            jsonLd: [[
                '@context' => 'https://schema.org',
                '@type' => 'ProfessionalService',
                'name' => "Harun's Cloud & DevOps Services",
                'url' => $siteUrl.'/services',
                'hasOfferCatalog' => [
                    '@type' => 'OfferCatalog',
                    'name' => 'Cloud & DevOps Services',
                    'itemListElement' => array_map(fn (array $row) => [
                        '@type' => 'Offer',
                        'itemOffered' => [
                            '@type' => 'Service',
                            'name' => $row[0],
                            'description' => $row[2],
                            'url' => $siteUrl.$row[1],
                        ],
                    ], SiteCatalog::services()),
                ],
            ]],
        );

        $pages['/contact'] = new SeoMeta(
            title: 'Send a note | Harun R. Rayhan',
            description: 'Send a note. I read these and reply myself.',
            canonicalUrl: $siteUrl.'/contact',
            jsonLd: [self::webPageGraph('ContactPage', 'Contact Harun', $siteUrl.'/contact')],
        );

        $pages['/consultation'] = new SeoMeta(
            title: 'Book a consult | Harun R. Rayhan',
            description: 'Book a paid DevOps consultation (Light, Pro, or Max). The first 1,001 booking requests get $100 off before any valid coupon is applied.',
            canonicalUrl: $siteUrl.'/consultation',
        );

        $pages['/products'] = new SeoMeta(
            title: 'Products | Harun R. Rayhan',
            description: 'Products built by Harun R. Rayhan - CloudPloy, SkaleAgents, Toolblip, Crontinel, Appnary, and Amazing Plugins.',
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
            description: 'Work from real engagements. The client name stays off the page.',
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
            jsonLd: [self::webPageGraph('WebPage', 'Privacy Policy', $siteUrl.'/privacy')],
        );

        $pages['/terms'] = new SeoMeta(
            title: 'Terms of Service | Harun\'s Portfolio',
            description: 'Terms of service and conditions for using Harun\'s Portfolio website and services.',
            canonicalUrl: $siteUrl.'/terms',
            jsonLd: [self::webPageGraph('WebPage', 'Terms of Service', $siteUrl.'/terms')],
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
                'description' => 'I design the AWS layout: accounts, network, and the services the app actually needs.',
            ],
            'devops' => [
                'title' => 'DevOps Implementation & Consulting Services | Harun R. Rayhan',
                'description' => 'CI, infrastructure as code, and a release path the team can run without me in the room.',
            ],
            'infrastructure-as-code' => [
                'title' => 'Infrastructure as Code (IaC) Services | Harun R. Rayhan',
                'description' => 'Get help with Terraform changes, plan reviews, state and IAM checks, and CI workflows for AWS infrastructure. See how Harun approaches the work.',
            ],
            'serverless-infrastructure' => [
                'title' => 'Serverless Infrastructure Services | Harun R. Rayhan',
                'description' => 'Lambda, queues, and the rest of a serverless setup, when you want less to patch and a bill that follows the traffic.',
            ],
            'automated-deployment' => [
                'title' => 'Automated Deployment & CI/CD Services | Harun R. Rayhan',
                'description' => 'Pipelines that build, test, and ship, without a checklist in someone\'s head.',
            ],
            'security-consulting' => [
                'title' => 'Security Consulting & Implementation Services | Harun R. Rayhan',
                'description' => 'I look at IAM, network boundaries, and the logs, then close the paths that are wider than the job.',
            ],
            'performance-optimization' => [
                'title' => 'Cloud Performance Optimization Services | Harun R. Rayhan',
                'description' => 'I measure the slow path, fix that, and stop paying for capacity you aren\'t using.',
            ],
            'infrastructure-migration' => [
                'title' => 'Infrastructure Migration Services | Harun R. Rayhan',
                'description' => 'I move the platform with a plan for downtime, the data, and the first week after cutover.',
            ],
            'mlops' => [
                'title' => 'MLOps & Machine Learning Operations Services | Harun R. Rayhan',
                'description' => 'The infrastructure around training and serving models, from the notebook to production.',
            ],
            'database-migration' => [
                'title' => 'Database Migration Services | Harun R. Rayhan',
                'description' => 'I move the database and check the data on both sides before anything goes live.',
            ],
            'monitoring-observability' => [
                'title' => 'Monitoring & Observability Services | Harun R. Rayhan',
                'description' => 'Metrics, logs, and traces, so you hear about a failure before your users do.',
            ],
            'database-optimization' => [
                'title' => 'Database Performance Optimization Services | Harun R. Rayhan',
                'description' => 'Slow queries, missing indexes, and connection limits. I fix the ones that show up under real load.',
            ],
            'aws-cloud' => [
                'title' => 'AWS Cloud Services & Solutions | Harun R. Rayhan',
                'description' => 'Accounts, networking, compute, and the managed services around them.',
            ],
            'multi-cloud-architecture' => [
                'title' => 'Multi-Cloud Architecture Services | Harun R. Rayhan',
                'description' => 'A setup that uses more than one cloud, when AWS alone isn\'t the whole answer.',
            ],
            'vibe-scaling' => [
                'title' => 'Vibe Scaler: Scale Your AI-Built App | Harun R. Rayhan',
                'description' => 'You built it fast with an AI coding tool and it found users. I scale that app in place so it can take the traffic and the payments.',
            ],
            'vibe-code-migration' => [
                'title' => 'Vibe Code Migration: Port Your AI-Built App to a Production Stack | Harun R. Rayhan',
                'description' => 'The prototype found users. When that stack can\'t carry it, I port it to a production language and framework and keep the features working.',
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
            'description' => 'I design, ship, and run AWS infrastructure.',
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
    private static function webPageGraph(string $type, string $name, string $url): array
    {
        return [
            '@context' => 'https://schema.org',
            '@type' => $type,
            'name' => $name,
            'url' => $url,
            'about' => ['@id' => SiteCatalog::siteUrl().'/#person'],
        ];
    }

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

    public static function forVideo(MediaItem $item, string $canonicalUrl): SeoMeta
    {
        $thumbnail = $item->thumbnail_url ? url($item->thumbnail_url) : null;
        $embedUrl = MediaEmbeds::youtubeEmbedUrl($item->url);
        $jsonLd = [];

        // Never substitute the record creation time or a generic OG image for
        // missing video metadata. Only describe a video playable on this page.
        if ($thumbnail && $embedUrl && $item->published_at && ! $item->published_at->isFuture()) {
            $graph = [
                '@context' => 'https://schema.org',
                '@type' => 'VideoObject',
                '@id' => $canonicalUrl.'#video',
                'name' => $item->title,
                'thumbnailUrl' => [$thumbnail],
                'uploadDate' => $item->published_at->toAtomString(),
                'embedUrl' => $embedUrl,
                'mainEntityOfPage' => $canonicalUrl,
            ];
            if (filled($item->summary)) {
                $graph['description'] = $item->summary;
            }
            $jsonLd[] = $graph;
        }

        return new SeoMeta(
            title: $item->title,
            description: (string) ($item->summary ?? $item->title),
            canonicalUrl: $canonicalUrl,
            ogImage: $thumbnail,
            jsonLd: $jsonLd,
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
