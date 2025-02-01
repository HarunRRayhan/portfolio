<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <!-- SEO Meta Tags -->
        @if(isset($page['props']['seoTags']))
            <title>{{ $page['props']['seoTags']['title'] }}</title>
            @foreach($page['props']['seoTags']['meta'] as $meta)
                <meta @foreach($meta as $key => $value) {{ $key }}="{{ $value }}" @endforeach>
            @endforeach
        @else
            <title>{{ config('app.name', 'Laravel') }}</title>
        @endif

        <!-- Favicon -->
        <link rel="icon" type="image/x-icon" href="/favicon.ico">

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

        <!-- Scripts and Styles -->
        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx'])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
