<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Technical lessons moved from "How the Internet Works" to "Networking" with their ids kept.
 * Carry learners' progress, XP keys, comment threads and view counts over to the new location.
 */
return new class extends Migration
{
    private const FROM = 'internet-networking';

    private const TO = 'networking';

    /** lesson id => [old topic, new topic] */
    private const LESSONS = [
        'ipv4-address-classes' => ['ipv4', 'ipv4-in-depth'],
        'ipv4-public-ranges' => ['ipv4', 'ipv4-in-depth'],
        'ipv4-special-ranges' => ['ipv4', 'ipv4-in-depth'],
        'ipv4-special-table' => ['ipv4', 'ipv4-in-depth'],
        'ipv4-broadcast' => ['ipv4', 'ipv4-in-depth'],
        'ipv4-multicast-ranges' => ['ipv4', 'ipv4-in-depth'],
        'ipv4-multicast-how' => ['ipv4', 'ipv4-in-depth'],
        'mtu' => ['packets', 'ipv4-in-depth'],
        'ipv6-special-table' => ['ipv6-basics', 'ipv6-in-depth'],
        'ipv6-public-allocation' => ['ipv6-basics', 'ipv6-in-depth'],
        'slaac' => ['ipv6-basics', 'ipv6-in-depth'],
        'ipv6-neighbor-discovery' => ['ipv6-basics', 'ipv6-in-depth'],
        'ipv6-multicast' => ['ipv6-basics', 'ipv6-in-depth'],
        'mac-addresses-and-ethernet' => ['what-is-a-network', 'switching-vlans'],
        'tcp-reliability' => ['tcp-vs-udp', 'transport-in-depth'],
        'socket-programming' => ['tcp-vs-udp', 'transport-in-depth'],
        'icmp-and-diagnostics' => ['osi-model', 'transport-in-depth'],
        'tls-versions' => ['tls-https', 'tls-in-depth'],
        'private-cas' => ['tls-https', 'tls-in-depth'],
        'bgp-path-selection' => ['bgp', 'bgp-in-depth'],
        'bgp-rfc' => ['bgp', 'bgp-in-depth'],
        'rate-limiting-and-wafs' => ['ddos', 'firewalls'],
        'subnet-masks' => ['subnets-cidr', 'subnets-cidr'],
        'cidr-notation' => ['subnets-cidr', 'subnets-cidr'],
        'planning-vpc-subnets' => ['subnets-cidr', 'subnets-cidr'],
        'source-nat' => ['nat', 'nat'],
        'nat-inbound' => ['nat', 'nat'],
        'cloud-nat-gateways' => ['nat', 'nat'],
        'internet-gateways' => ['nat', 'nat'],
        'routing-tables' => ['routing', 'routing'],
        'hops-and-traceroute' => ['routing', 'routing'],
        'static-vs-dynamic-routing' => ['routing', 'routing'],
        'l4-vs-l7' => ['load-balancers', 'load-balancers'],
        'lb-algorithms' => ['load-balancers', 'load-balancers'],
        'health-checks' => ['load-balancers', 'load-balancers'],
        'consistent-hashing' => ['load-balancers', 'load-balancers'],
    ];

    /** Topics that moved whole, ids kept. */
    private const TOPICS = ['subnets-cidr', 'nat', 'routing', 'load-balancers'];

    public function up(): void
    {
        $this->move(self::FROM, self::TO, false);
    }

    public function down(): void
    {
        $this->move(self::TO, self::FROM, true);
    }

    private function move(string $from, string $to, bool $back): void
    {
        DB::transaction(function () use ($from, $to, $back) {
            $ids = array_keys(self::LESSONS);
            $users = DB::table('roadmap_progress')->where('roadmap_slug', $from)->whereIn('step_id', $ids)->distinct()->pluck('user_id');
            DB::table('roadmap_progress')->where('roadmap_slug', $from)->whereIn('step_id', $ids)->update(['roadmap_slug' => $to]);
            $now = now();
            foreach ($users as $userId) {
                DB::table('roadmap_starts')->insertOrIgnore(['user_id' => $userId, 'roadmap_slug' => $to, 'created_at' => $now, 'updated_at' => $now]);
            }

            $renames = [];
            foreach (self::LESSONS as $lesson => [$oldTopic, $newTopic]) {
                [$fromTopic, $toTopic] = $back ? [$newTopic, $oldTopic] : [$oldTopic, $newTopic];
                $renames['xp_awards']["lesson:$from/$lesson"] = "lesson:$to/$lesson";
                $renames['roadmap_comment_threads']["$from/$fromTopic/$lesson"] = "$to/$toTopic/$lesson";
                $renames['roadmap_views']["$from/$fromTopic/$lesson"] = "$to/$toTopic/$lesson";
            }
            foreach (self::TOPICS as $topic) {
                $renames['xp_awards']["topic:$from/$topic"] = "topic:$to/$topic";
                $renames['roadmap_comment_threads']["$from/$topic"] = "$to/$topic";
                $renames['roadmap_views']["$from/$topic"] = "$to/$topic";
            }

            $column = ['xp_awards' => 'key', 'roadmap_comment_threads' => 'key', 'roadmap_views' => 'roadmap_slug'];
            foreach ($renames as $table => $map) {
                foreach ($map as $old => $new) {
                    // Skip a rename that would collide with a row already at the new key.
                    if ($table === 'xp_awards') {
                        $taken = DB::table($table)->where('key', $new)->pluck('user_id');
                        DB::table($table)->where('key', $old)->whereNotIn('user_id', $taken)->update(['key' => $new]);
                    } elseif (! DB::table($table)->where($column[$table], $new)->exists()) {
                        DB::table($table)->where($column[$table], $old)->update([$column[$table] => $new]);
                    }
                }
            }
        });
    }
};
