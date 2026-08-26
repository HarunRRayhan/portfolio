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
            ['Cloud Architecture', '/services/cloud-architecture', 'Scalable, secure, and cost-effective cloud architecture design and implementation.'],
            ['DevOps', '/services/devops', 'Modern DevOps practices that streamline development and operations workflows.'],
            ['Infrastructure as Code', '/services/infrastructure-as-code', 'Terraform and IaC tooling for consistent, repeatable, version-controlled infrastructure.'],
            ['Serverless Infrastructure', '/services/serverless-infrastructure', 'Serverless designs that cut operational overhead and cost while scaling on demand.'],
            ['Automated Deployment', '/services/automated-deployment', 'CI/CD pipelines for faster, more reliable software delivery.'],
            ['Security Consulting', '/services/security-consulting', 'Cloud security assessments and hardening across accounts, networks, and workloads.'],
            ['Performance Optimization', '/services/performance-optimization', 'Tuning cloud infrastructure for throughput, latency, and cost efficiency.'],
            ['Infrastructure Migration', '/services/infrastructure-migration', 'Migrations to modern, scalable platforms with minimal downtime.'],
            ['MLOps', '/services/mlops', 'Automated machine learning workflows and the infrastructure that runs them.'],
            ['Database Migration', '/services/database-migration', 'Database moves to cloud platforms with minimal downtime and no data loss.'],
            ['Monitoring and Observability', '/services/monitoring-observability', 'Metrics, logs, and traces that give real insight into infrastructure and apps.'],
            ['Database Optimization', '/services/database-optimization', 'Query, schema, and instance tuning for faster and more reliable databases.'],
            ['AWS Cloud', '/services/aws-cloud', 'AWS consulting across compute, networking, storage, and managed services.'],
            ['Multi-Cloud Architecture', '/services/multi-cloud-architecture', 'Architectures that use the strengths of more than one cloud provider.'],
            ['Vibe Scaling', '/services/vibe-scaling', 'Taking an AI-built app that found real users and making it hold up under real traffic.'],
            ['Vibe Code Migration', '/services/vibe-code-migration', 'Moving an AI-built prototype onto a production language and framework, feature for feature.'],
        ];
    }

    /**
     * @return list<CatalogRow>
     */
    public static function pages(): array
    {
        return [
            ['About', '/about', 'Background, experience, and how I work with teams.'],
            ['Contact', '/contact', 'Start a project or ask a question.'],
            ['Bio', '/bio', 'Short bio and links.'],
            ['Bio (Bangla)', '/hrr', 'Bangla bio and links.'],
            ['Book a Call', '/book', 'Schedule a consulting call.'],
            ['Products', '/products', 'Tools and products I build, including Crontinel.'],
            ['Case Studies', '/case-studies', 'Index of client engagements and their outcomes.'],
            ['Services', '/services', 'Index of all consulting services.'],
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
            '/services',
            '/book',
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
