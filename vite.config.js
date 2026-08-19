import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    define: {
        'import.meta.env.VITE_ASSET_BASE_URL': JSON.stringify(process.env.VITE_ASSET_BASE_URL),
    },
    plugins: [
        laravel({
            input: 'resources/js/app.tsx',
            refresh: true,
            detectTls: process.env.VITE_PUBLIC_ORIGIN ? false : undefined,
        }),
        react(),
    ],
    server: process.env.VITE_PUBLIC_ORIGIN ? {
        origin: process.env.VITE_PUBLIC_ORIGIN,
        hmr: {
            protocol: 'wss',
            host: new URL(process.env.VITE_PUBLIC_ORIGIN).hostname,
            clientPort: 443,
        },
    } : undefined,
});
