<?php

// Credentials must already be in the environment. Never include them in output.
require dirname(__DIR__).'/vendor/autoload.php';

$token = getenv('CLOUDFLARE_API_TOKEN');
$account = getenv('CLOUDFLARE_ACCOUNT_ID');
$days = filter_var($argv[1] ?? 1, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 30]]);

if (! $token || ! $account || $days === false) {
    fwrite(STDERR, "Usage: php scripts/cloudflare-web-vitals.php [days:1-30]\nRequires CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID in the environment.\n");
    exit(1);
}

$end = gmdate('Y-m-d\TH:i:s\Z');
$start = gmdate('Y-m-d\TH:i:s\Z', time() - $days * 86400);
$query = <<<'GRAPHQL'
query($account: string, $start: Time, $end: Time) {
  viewer {
    accounts(filter: {accountTag: $account}) {
      rumWebVitalsEventsAdaptiveGroups(
        limit: 100,
        filter: {datetime_geq: $start, datetime_lt: $end, requestHost: "harun.dev", requestPath: "/", bot: 0}
      ) {
        count
        dimensions { deviceType }
        quantiles {
          firstContentfulPaintP75 timeToFirstByteP75 largestContentfulPaintP75
          interactionToNextPaintP75 cumulativeLayoutShiftP75
          lcpElementRenderDelayP75 lcpResourceLoadDelayP75 lcpResourceLoadTimeP75
          inpInputDelayP75 inpProcessingDurationP75 inpPresentationDelayP75
        }
      }
    }
  }
}
GRAPHQL;

try {
    $response = (new GuzzleHttp\Client)->post('https://api.cloudflare.com/client/v4/graphql', [
        'timeout' => 30,
        'http_errors' => false,
        'headers' => ['Authorization' => 'Bearer '.$token],
        'json' => ['query' => $query, 'variables' => compact('account', 'start', 'end')],
    ]);
    $data = json_decode($response->getBody(), true, 512, JSON_THROW_ON_ERROR);
    if ($response->getStatusCode() !== 200 || ! empty($data['errors'])) {
        fwrite(STDERR, "Cloudflare could not return Web Analytics data. Check account-level Analytics:Read access and the account ID.\n");
        exit(1);
    }
    echo json_encode([
        'host' => 'harun.dev', 'path' => '/', 'start' => $start, 'end' => $end,
        'source' => 'Cloudflare Web Analytics, bot-filtered adaptive event groups',
        'notes' => 'Counts are events, not unique visitors. Quantiles are per device group, not averages of daily percentiles. Audit traffic may be present. An empty result does not prove good performance.',
        'groups' => $data['data']['viewer']['accounts'][0]['rumWebVitalsEventsAdaptiveGroups'] ?? [],
    ], JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR).PHP_EOL;
} catch (Throwable) {
    fwrite(STDERR, "Web Analytics request failed. No credentials were written to output.\n");
    exit(1);
}
