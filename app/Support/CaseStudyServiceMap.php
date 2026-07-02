<?php

namespace App\Support;

/**
 * Maps case study frontmatter "services" labels to /services/{slug} routes.
 */
class CaseStudyServiceMap
{
    /**
     * @return array<string, string> label => slug
     */
    public static function labelToSlug(): array
    {
        return [
            'Multi-Cloud Architecture' => 'multi-cloud-architecture',
            'AWS Cloud' => 'aws-cloud',
            'DevOps' => 'devops',
            'DevOps Implementation' => 'devops',
            'Infrastructure as Code' => 'infrastructure-as-code',
            'Serverless Infrastructure' => 'serverless-infrastructure',
            'Automated Deployment' => 'automated-deployment',
            'Security Consulting' => 'security-consulting',
            'Performance Optimization' => 'performance-optimization',
            'Infrastructure Migration' => 'infrastructure-migration',
            'MLOps' => 'mlops',
            'Database Migration' => 'database-migration',
            'Monitoring & Observability' => 'monitoring-observability',
            'Monitoring Observability' => 'monitoring-observability',
            'Database Optimization' => 'database-optimization',
            'Cloud Architecture' => 'cloud-architecture',
            'Cost Optimization' => 'performance-optimization',
        ];
    }

    public static function slugForLabel(string $label): ?string
    {
        $map = self::labelToSlug();

        if (isset($map[$label])) {
            return $map[$label];
        }

        $normalized = strtolower(trim($label));
        foreach ($map as $key => $slug) {
            if (strtolower($key) === $normalized) {
                return $slug;
            }
        }

        return null;
    }

    /**
     * @param  array<int, string>  $labels
     * @return array<int, string>
     */
    public static function slugsForLabels(array $labels): array
    {
        return collect($labels)
            ->map(fn (string $label) => self::slugForLabel($label))
            ->filter()
            ->unique()
            ->values()
            ->all();
    }
}