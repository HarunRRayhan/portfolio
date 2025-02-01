import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            ssr: 'resources/js/ssr.js',
            refresh: true,
        }),
        react(),
    ],
    ssr: {
        noExternal: ['@inertiajs/server', 'ziggy-js'],
    },
    optimizeDeps: {
        include: ['@inertiajs/react', '@inertiajs/server', 'ziggy-js'],
    },
    build: {
        commonjsOptions: {
            include: [/@inertiajs\/server/, /node_modules/, /ziggy-js/],
        },
    },
});
