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
        'import.meta.env.VITE_ASSET_BASE_URL': JSON.stringify(process.env.VITE_ASSET_BASE_URL),
    },
    plugins: [
        laravel({
            input: 'resources/js/app.tsx',
            refresh: true,
            detectTls: publicOrigin ? false : undefined,
        }),
        react(),
    ],
    build: {
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules/framer-motion')) {
                        return 'framer-motion'
                    }
                    if (id.includes('node_modules/highlight.js')) {
                        return 'highlight'
                    }
                    if (id.includes('node_modules/recharts')) {
                        return 'recharts'
                    }
                },
            },
        },
    },
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
