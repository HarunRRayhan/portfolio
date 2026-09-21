<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Unsubscribed | {{ config('app.name') }}</title>
    <style>
        :root { color-scheme: dark; font-family: ui-sans-serif, system-ui, sans-serif; }
        body { margin: 0; min-height: 100vh; background: #020617; color: #f8fafc; }
        main { max-width: 32rem; margin: 0 auto; padding: 4rem 1.5rem; }
        .card { padding: 2.5rem; border: 1px solid #1e293b; border-radius: 1.5rem; background: #0f172a; box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.5); }
        .eyebrow { color: #34d399; font: 600 0.7rem/1.2 ui-monospace, monospace; letter-spacing: 0.24em; text-transform: uppercase; }
        h1 { margin: 1rem 0 0; font-size: 1.875rem; line-height: 1.2; letter-spacing: -0.025em; }
        p { margin-top: 1rem; color: #94a3b8; line-height: 1.75; }
        a { display: inline-flex; margin-top: 2rem; padding: 0.75rem 1.25rem; border-radius: 9999px; background: #fff; color: #020617; font-size: 0.875rem; font-weight: 600; text-decoration: none; }
        a:hover { background: #f1f5f9; }
    </style>
</head>
<body>
    <main>
        <div class="card">
            <div class="eyebrow">Newsletter</div>
            <h1>You’re unsubscribed.</h1>
            <p>You won’t receive the weekly blog digest anymore.</p>
            <a href="{{ url('/') }}">Back to harun.dev</a>
        </div>
    </main>
</body>
</html>
