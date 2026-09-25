import { defineConfig, defaultAllowedOrigins } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

// Tailscale worktree dev routing: the app is path-proxied at
// https://<host>/<slug> (port 443) while Vite is proxied at
// https://<host>:<vite-port>. The browser's page origin is therefore the bare
// https://<host>, which is a *different* origin from the one Vite serves
// modules on, so it has to be an allowed CORS origin.
// See docs/superpowers/specs/2026-08-18-tailscale-worktree-dev-routing-design.md
const publicOrigin = process.env.VITE_PUBLIC_ORIGIN;
const publicUrl = publicOrigin ? new URL(publicOrigin) : null;

export default defineConfig({
    define: {
        // Default media CDN for production builds when the env var is unset
        // (common when GitHub Actions repo vars are empty). Keep ASSET_URL off
        // Railway so /build JS stays same-origin.
        'import.meta.env.VITE_ASSET_BASE_URL': JSON.stringify(
            process.env.VITE_ASSET_BASE_URL || 'https://cdn.harun.dev',
        ),
    },
    plugins: [
        laravel({
            input: 'resources/js/app.tsx',
            ssr: 'resources/js/ssr.tsx',
            refresh: true,
            detectTls: publicOrigin ? false : undefined,
        }),
        react(),
    ],
    ssr: { noExternal: true },
    // Let Vite split dependencies by their actual consumers. Manual vendor
    // chunks pulled shared React dependencies into Recharts, making public
    // pages download the admin chart library before they could render.
    server: publicUrl ? {
        origin: publicOrigin,
        // Must be set explicitly. laravel-vite-plugin falls back to
        // `cors: { origin: server.origin }` when we don't, and a *string*
        // origin makes Vite's cors middleware echo that literal value back as
        // Access-Control-Allow-Origin instead of matching the request. That
        // pins the header to the :<vite-port> URL and blocks every module
        // request from the page origin. An array gets matched and reflected.
        cors: {
            origin: [
                defaultAllowedOrigins,
                publicOrigin,
                `${publicUrl.protocol}//${publicUrl.hostname}`,
            ],
        },
        hmr: {
            protocol: 'wss',
            host: publicUrl.hostname,
            clientPort: 443,
        },
    } : undefined,
});
