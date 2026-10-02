<?php

namespace App\Support;

/**
 * Shared lists of public pages used by /sitemap.xml, /llms.txt, and SEO meta.
 *
 * @phpstan-type CatalogRow array{0: string, 1: string, 2: string}
 */
final class SiteCatalog
{
    public static function siteUrl(): string
    {
        return rtrim((string) config('app.url', url('/')), '/');
    }

    /**
     * @return list<CatalogRow>
     */
    public static function services(): array
    {
        return [
            ['Cloud Architecture', '/services/cloud-architecture', 'I design the AWS layout: accounts, network, and the services the app actually needs.'],
            ['DevOps', '/services/devops', 'CI, infrastructure as code, and a release path the team can run without me in the room.'],
            ['Infrastructure as Code', '/services/infrastructure-as-code', 'Need to change AWS infrastructure without guessing what Terraform will touch? I can help review the current stack, make the change, and check the plan before it is applied.'],
            ['Serverless Infrastructure', '/services/serverless-infrastructure', 'Lambda, queues, and the rest of a serverless setup, when you want less to patch and a bill that follows the traffic.'],
            ['Automated Deployment', '/services/automated-deployment', 'Pipelines that build, test, and ship, without a checklist in someone\'s head.'],
            ['Security Consulting', '/services/security-consulting', 'I look at IAM, network boundaries, and the logs, then close the paths that are wider than the job.'],
            ['Performance Optimization', '/services/performance-optimization', 'I measure the slow path, fix that, and stop paying for capacity you aren\'t using.'],
            ['Infrastructure Migration', '/services/infrastructure-migration', 'I move the platform with a plan for downtime, the data, and the first week after cutover.'],
            ['MLOps', '/services/mlops', 'The infrastructure around training and serving models, from the notebook to production.'],
            ['Database Migration', '/services/database-migration', 'I move the database and check the data on both sides before anything goes live.'],
            ['Monitoring and Observability', '/services/monitoring-observability', 'Metrics, logs, and traces, so you hear about a failure before your users do.'],
            ['Database Optimization', '/services/database-optimization', 'Slow queries, missing indexes, and connection limits. I fix the ones that show up under real load.'],
            ['AWS Cloud', '/services/aws-cloud', 'Accounts, networking, compute, and the managed services around them.'],
            ['Multi-Cloud Architecture', '/services/multi-cloud-architecture', 'A setup that uses more than one cloud, when AWS alone isn\'t the whole answer.'],
            ['Vibe Scaling', '/services/vibe-scaling', 'You built it fast with an AI coding tool and it found users. I scale that app in place so it can take the traffic and the payments.'],
            ['Vibe Code Migration', '/services/vibe-code-migration', 'The prototype found users. When that stack can\'t carry it, I port it to a production language and framework and keep the features working.'],
        ];
    }

    /**
     * @return list<CatalogRow>
     */
    public static function pages(): array
    {
        return [
            ['About', '/about', '15 years, mostly on AWS. Cloud architecture, release automation, and production.'],
            ['Sponsor', '/sponsor-me', 'Support the writing, tools, and experiments I share.'],
            ['Contact', '/contact', 'Send a note. Harun reads it and replies himself.'],
            ['Bio', '/bio', 'Short bio and links.'],
            ['Bio (Bangla)', '/hrr', 'Bangla bio and links.'],
            ['Consultation', '/consultation', 'Book a paid DevOps consultation.'],
            ['Products', '/products', 'Tools and products I build, including Crontinel.'],
            ['Case Studies', '/case-studies', 'Work from real engagements. The client name stays off the page.'],
            ['Services', '/services', 'An AI-built app that has to survive production, an AWS setup that\'s expensive or fragile, or a release process you don\'t trust.'],
            ['Blog', '/blog', 'Index of all writing on cloud, DevOps, and AWS.'],
            ['Slides', '/slides', 'Talk decks and presentations.'],
            ['Videos', '/videos', 'Recorded talks and walkthroughs.'],
        ];
    }

    /**
     * @return list<CatalogRow>
     */
    public static function optional(): array
    {
        return [
            ['Privacy Policy', '/privacy', 'How data on this site is handled.'],
            ['Terms', '/terms', 'Terms of use for this site.'],
            ['Blog RSS Feed', '/blog/feed.xml', 'Atom feed of blog posts.'],
            ['Case Studies RSS Feed', '/case-studies/feed.xml', 'Atom feed of case studies.'],
            ['Sitemap', '/sitemap.xml', 'XML sitemap of every indexable URL.'],
            ['llms-full.txt', '/llms-full.txt', 'This index with the full text of every post and case study inlined.'],
        ];
    }

    /**
     * Indexable paths for /sitemap.xml. Privacy and terms stay out so they
     * do not compete with commercial pages; they remain in llms Optional.
     *
     * @return list<string>
     */
    public static function sitemapStaticPaths(): array
    {
        $paths = [
            '/',
            '/about',
            '/sponsor-me',
            '/services',
            '/consultation',
            '/contact',
            '/blog',
            '/case-studies',
            '/slides',
            '/videos',
            '/bio',
            '/hrr',
            '/products',
        ];

        foreach (self::services() as $service) {
            $paths[] = $service[1];
        }

        return $paths;
    }

    public static function llmsLinkSections(?string $siteUrl = null): string
    {
        $siteUrl ??= self::siteUrl();

        $render = fn (array $rows): string => collect($rows)
            ->map(fn (array $row) => '- ['.$row[0].']('.$siteUrl.$row[1].'): '.$row[2])
            ->implode("\n");

        $serviceLinks = $render(self::services());
        $pageLinks = $render(self::pages());
        $optionalLinks = $render(self::optional());

        return <<<MD
## Services

{$serviceLinks}

## Pages

{$pageLinks}

## Optional

{$optionalLinks}
MD;
    }
}
