<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        @php
            // Built in @php so Blade's @context directive cannot rewrite the JSON keys.
            $organizationJsonLd = \App\Support\SeoMeta::organizationGraph();
            $seo = data_get($page, 'props.seo');
        @endphp
        @if (is_array($seo))
            @include('partials.seo-meta', ['seo' => $seo])
        @else
            <title inertia>{{ config('app.name', 'Laravel') }}</title>
        @endif
        <script type="application/ld+json">{!! json_encode($organizationJsonLd, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) !!}</script>

        <!-- Favicon -->
        <link rel="icon" href="/favicon.ico" sizes="any">
        <link rel="icon" type="image/svg+xml" href="/favicon.svg">
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
        <link rel="manifest" href="/site.webmanifest">

        <!-- Optional fonts keep slow downloads from shifting already-painted text. -->
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link
            rel="preload"
            as="style"
            href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=JetBrains+Mono:wght@400;500;600;700&family=Hind+Siliguri:wght@400;500;600;700&display=optional"
            onload="this.onload=null;this.rel='stylesheet'"
        >
        <noscript>
            <link
                href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=JetBrains+Mono:wght@400;500;600;700&family=Hind+Siliguri:wght@400;500;600;700&display=optional"
                rel="stylesheet"
            >
        </noscript>

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/Pages/{$page['component']}.tsx"])
        @inertiaHead
        @php
            $isDraftBlogPost = ($page['component'] ?? null) === 'Blog/Post' && data_get($page, 'props.post.isDraft');
            $isBookingStatus = ($page['component'] ?? null) === 'Book/Status';
        @endphp
        @if ($isDraftBlogPost)
            <meta name="robots" content="noindex, nofollow, noarchive">
            <meta name="googlebot" content="noindex, nofollow, noarchive">
        @endif

        @if (config('services.ga4.measurement_id') && ! $isDraftBlogPost && ! $isBookingStatus)
            <script>
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', @js(config('services.ga4.measurement_id')), {
                    page_location: window.location.href,
                    page_title: document.title,
                });

                // Queue events immediately, but let the page finish loading
                // before analytics competes for network and main-thread time.
                (() => {
                    const loadAnalytics = () => {
                        const script = document.createElement('script');
                        script.async = true;
                        script.src = 'https://www.googletagmanager.com/gtag/js?id=' + @js(config('services.ga4.measurement_id'));
                        document.head.appendChild(script);
                    };
                    const scheduleAnalytics = () => {
                        if ('requestIdleCallback' in window) {
                            window.requestIdleCallback(loadAnalytics, { timeout: 1500 });
                        } else {
                            window.setTimeout(loadAnalytics, 0);
                        }
                    };
                    if (document.readyState === 'complete') {
                        scheduleAnalytics();
                    } else {
                        window.addEventListener('load', scheduleAnalytics, { once: true });
                    }
                })();
            </script>
        @endif
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
