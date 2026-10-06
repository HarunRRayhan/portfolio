<?php

namespace App\Support;

/**
 * Contextual links between published posts and service pages.
 *
 * Tag order is most specific first. A post gets one service. Each service
 * lists two or three posts that already exist in the catalog.
 */
final class ContentLinks
{
    /**
     * @var array<string, string>
     */
    private const TAG_SERVICE = [
        'cost-optimization' => '/services/performance-optimization',
        'terraform' => '/services/infrastructure-as-code',
        'github-actions' => '/services/automated-deployment',
        'security' => '/services/security-consulting',
        'iam' => '/services/security-consulting',
        'waf' => '/services/security-consulting',
        'migration' => '/services/vibe-code-migration',
        'scaling' => '/services/vibe-scaling',
        'rag' => '/services/mlops',
        'bedrock' => '/services/mlops',
        'sagemaker' => '/services/mlops',
        'postgresql' => '/services/database-optimization',
        'databases' => '/services/database-optimization',
        'redis' => '/services/database-optimization',
        'lambda' => '/services/serverless-infrastructure',
        'serverless' => '/services/serverless-infrastructure',
        'mcp' => '/services/serverless-infrastructure',
        'devops' => '/services/devops',
        'laravel' => '/services/devops',
        'lightsail' => '/services/aws-cloud',
        'ec2' => '/services/aws-cloud',
        'wordpress' => '/services/aws-cloud',
        'cloudfront' => '/services/aws-cloud',
        'cdn' => '/services/aws-cloud',
        'ai' => '/services/mlops',
        'cloud' => '/services/cloud-architecture',
        'aws' => '/services/cloud-architecture',
    ];

    /**
     * @var array<string, list<string>>
     */
    private const READING = [
        '/services/cloud-architecture' => [
            'first-3-things-i-always-do-after-creating-a-new-aws-account',
            '5-aws-mistakes-quietly-draining-your-bank-account',
            'how-to-start-learning-aws-cloud-and-get-certified',
        ],
        '/services/devops' => [
            'github-actions-lambda-terraform-cicd',
            'multi-agent-claude-code-aws-devops-routines',
            'production-ai-code-review-for-terraform-and-lambda-prs',
        ],
        '/services/infrastructure-as-code' => [
            'terraform-state-more-sensitive-than-env',
            'deploying-a-laravel-application-to-amazon-ec2-using-terraform',
            'github-actions-lambda-terraform-cicd',
        ],
        '/services/serverless-infrastructure' => [
            'serverless-ai-inference-endpoints-with-aws-bedrock-and-lambda',
            'deploying-an-mcp-server-on-aws-lambda',
            'how-i-architected-a-fully-serverless-saas-on-aws-lambda-with-fastify',
        ],
        '/services/automated-deployment' => [
            'github-actions-lambda-terraform-cicd',
            'production-ai-code-review-for-terraform-and-lambda-prs',
            'pre-merge-checklist-ai-generated-prs',
        ],
        '/services/security-consulting' => [
            'lock-down-bedrock-iam-lambda-data-leak',
            'aws-waf-cloudfront-solo-dev',
            'terraform-state-more-sensitive-than-env',
        ],
        '/services/performance-optimization' => [
            '5-aws-mistakes-quietly-draining-your-bank-account',
            'lambda-snapstart-terraform-cold-starts',
            'ecs-fargate-spot-capacity-providers',
        ],
        '/services/infrastructure-migration' => [
            'snapshot-restore-of-lightsail-instance-to-lightsail-ec2',
            'when-your-app-outgrows-the-tool-that-built-it',
            'migrated-lambda-ai-app-to-bedrock-openai-compatible-apis-without-rewriting-everything',
        ],
        '/services/mlops' => [
            'building-a-production-rag-pipeline-on-aws-lambda-pgvector',
            'bedrock-agents-production-knowledge-bases',
            'llm-observability-langfuse-lambda-cloudwatch',
        ],
        '/services/database-migration' => [
            'add-database-to-application-hosted-in-amazon-lightsail',
            'connect-redis-elasticache-to-application-in-amazon-lightsail-instance',
            'snapshot-restore-of-lightsail-instance-to-lightsail-ec2',
        ],
        '/services/monitoring-observability' => [
            'install-cloud-watch-agent-in-amazon-lightsail-instance-for-monitoring-logging-and-debugging',
            'llm-observability-langfuse-lambda-cloudwatch',
        ],
        '/services/database-optimization' => [
            'building-a-production-rag-pipeline-on-aws-lambda-pgvector',
            'connect-redis-elasticache-to-application-in-amazon-lightsail-instance',
            'add-database-to-application-hosted-in-amazon-lightsail',
        ],
        '/services/aws-cloud' => [
            'deploy-laravel-application-to-amazon-ec2-instance',
            'deploy-wordpress-app-to-amazon-lightsail',
            'first-3-things-i-always-do-after-creating-a-new-aws-account',
        ],
        '/services/multi-cloud-architecture' => [
            'first-3-things-i-always-do-after-creating-a-new-aws-account',
            '5-aws-mistakes-quietly-draining-your-bank-account',
        ],
        '/services/vibe-scaling' => [
            'when-your-app-outgrows-the-tool-that-built-it',
            'how-i-make-ai-coding-agents-safe-in-a-real-aws-codebase',
            'pre-merge-checklist-ai-generated-prs',
        ],
        '/services/vibe-code-migration' => [
            'when-your-app-outgrows-the-tool-that-built-it',
            'serverless-laravel-on-aws-lambda-with-bref-and-terraform',
            'everything-new-in-laravel-13',
        ],
    ];

    /**
     * @param  array<string, mixed>|null  $post
     * @return array{title: string, url: string}|null
     */
    public static function forPost(?array $post): ?array
    {
        if ($post === null) {
            return null;
        }

        $tags = collect($post['tags'] ?? [])
            ->map(fn (mixed $tag) => is_array($tag) ? (string) ($tag['slug'] ?? '') : '')
            ->filter(fn (string $slug) => $slug !== '')
            ->all();

        foreach (self::TAG_SERVICE as $tag => $path) {
            if (in_array($tag, $tags, true)) {
                return self::service($path);
            }
        }

        return null;
    }

    /**
     * @return list<array{title: string, url: string, brief: string}>
     */
    public static function readingForService(string $serviceSlug): array
    {
        $blog = new BlogRepository;
        $slugs = self::READING['/services/'.$serviceSlug] ?? [];

        return collect($slugs)
            ->map(function (string $slug) use ($blog): ?array {
                $post = $blog->find($slug);

                if ($post === null || ! $blog->isPublic($post)) {
                    return null;
                }

                return [
                    'title' => (string) $post['title'],
                    'url' => $blog->relativeUrl($slug),
                    'brief' => (string) $post['brief'],
                ];
            })
            ->filter()
            ->values()
            ->all();
    }

    /**
     * @return array{title: string, url: string}
     */
    private static function service(string $path): array
    {
        foreach (SiteCatalog::services() as $row) {
            if ($row[1] === $path) {
                return [
                    'title' => $row[0],
                    'url' => $row[1],
                ];
            }
        }

        throw new \RuntimeException("Unknown service path: {$path}");
    }
}
