FROM composer:latest AS composer
WORKDIR /app
COPY . .
RUN composer install --no-dev --optimize-autoloader

FROM node:18 AS deps

# Add build arguments
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
ENV NODE_OPTIONS="--max-old-space-size=8192"

WORKDIR /app

# Copy package files
COPY package*.json ./

# Debug: print package.json and package-lock.json
RUN cat package.json && echo '---' && cat package-lock.json

# Install ALL dependencies for building
RUN npm ci --no-audit --no-fund

# Debug: check installed modules
RUN npm ls @inertiajs/react laravel-vite-plugin || true

FROM node:18 AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Install TypeScript globally
RUN npm install -g typescript

# Create missing type declarations
RUN mkdir -p types && \
    echo 'declare module "clsx" { const clsx: (...args: any[]) => string; export default clsx; }' > types/clsx.d.ts && \
    echo 'declare module "tailwind-merge" { export function twMerge(...args: any[]): string; }' > types/tailwind-merge.d.ts && \
    echo 'declare module "canvas-confetti" { const confetti: any; export default confetti; }' > types/canvas-confetti.d.ts && \
    echo 'declare module "sonner" { export const Toaster: any; export const toast: any; }' > types/sonner.d.ts && \
    echo 'declare module "lucide-react" { export * from "lucide-react"; }' > types/lucide-react.d.ts && \
    echo 'declare module "@inertiajs/react" { export * from "@inertiajs/react"; }' > types/inertiajs-react.d.ts && \
    echo 'declare module "@inertiajs/core" { export * from "@inertiajs/core"; }' > types/inertiajs-core.d.ts && \
    echo 'declare module "@headlessui/react" { export * from "@headlessui/react"; }' > types/headlessui-react.d.ts && \
    echo 'declare module "@radix-ui/react-accordion" { export * from "@radix-ui/react-accordion"; }' > types/radix-ui-accordion.d.ts && \
    echo 'declare module "@radix-ui/react-slot" { export * from "@radix-ui/react-slot"; }' > types/radix-ui-slot.d.ts && \
    echo 'declare module "@radix-ui/react-dialog" { export * from "@radix-ui/react-dialog"; }' > types/radix-ui-dialog.d.ts && \
    echo 'declare module "@radix-ui/react-navigation-menu" { export * from "@radix-ui/react-navigation-menu"; }' > types/radix-ui-navigation-menu.d.ts && \
    echo 'declare module "@radix-ui/react-popover" { export * from "@radix-ui/react-popover"; }' > types/radix-ui-popover.d.ts && \
    echo 'declare module "class-variance-authority" { export * from "class-variance-authority"; }' > types/class-variance-authority.d.ts && \
    echo 'declare module "embla-carousel-react" { export * from "embla-carousel-react"; }' > types/embla-carousel-react.d.ts && \
    echo 'declare module "laravel-vite-plugin" { export * from "laravel-vite-plugin"; }' > types/laravel-vite-plugin.d.ts && \
    echo 'declare module "laravel-vite-plugin/inertia-helpers" { export * from "laravel-vite-plugin/inertia-helpers"; }' > types/laravel-vite-plugin-inertia-helpers.d.ts && \
    echo 'declare module "framer-motion" { export * from "framer-motion"; }' > types/framer-motion.d.ts

# Create TypeScript configuration
RUN echo '{ \
  "compilerOptions": { \
    "target": "es5", \
    "lib": ["dom", "dom.iterable", "esnext"], \
    "allowJs": true, \
    "skipLibCheck": true, \
    "strict": false, \
    "forceConsistentCasingInFileNames": true, \
    "noEmit": true, \
    "esModuleInterop": true, \
    "module": "esnext", \
    "moduleResolution": "node", \
    "resolveJsonModule": true, \
    "isolatedModules": true, \
    "jsx": "preserve", \
    "incremental": true, \
    "baseUrl": ".", \
    "paths": { \
      "@/*": ["resources/js/*"] \
    }, \
    "types": ["vite/client", "node"] \
  }, \
  "include": ["resources/js/**/*.ts", "resources/js/**/*.tsx", "types/**/*.d.ts"], \
  "exclude": ["node_modules"] \
}' > tsconfig.json

# Create Vite configuration
RUN echo 'import { defineConfig } from "vite"; \
import laravel from "laravel-vite-plugin"; \
import react from "@vitejs/plugin-react"; \
import path from "path"; \
export default defineConfig({ \
  plugins: [ \
    laravel({ \
      input: "resources/js/app.tsx", \
      refresh: true, \
    }), \
    react(), \
  ], \
  resolve: { \
    alias: { \
      "@": path.resolve(__dirname, "./resources/js"), \
    }, \
  }, \
  build: { \
    chunkSizeWarningLimit: 1600, \
    outDir: "public/build", \
    manifest: true, \
    rollupOptions: { \
      output: { \
        manualChunks: { \
          vendor: ["react", "react-dom"], \
        }, \
      }, \
    }, \
  }, \
});' > vite.config.ts

# Copy source files
COPY . .

# Build the application
RUN npm run build

FROM php:8.2-fpm-alpine

# Install system dependencies
RUN apk add --no-cache \
    linux-headers \
    $PHPIZE_DEPS \
    nodejs \
    npm \
    postgresql-dev \
    libzip-dev \
    zip \
    unzip \
    git \
    nginx \
    supervisor \
    openssl

# Install PHP extensions
RUN docker-php-ext-install pdo pdo_pgsql zip

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copy built files from builder stage
COPY --from=builder /app/public/build ./public/build
COPY --from=builder /app/public ./public
COPY --from=builder /app/bootstrap ./bootstrap
COPY --from=builder /app/config ./config
COPY --from=builder /app/database ./database
COPY --from=builder /app/resources ./resources
COPY --from=builder /app/routes ./routes
COPY --from=builder /app/storage ./storage
COPY --from=builder /app/app ./app
COPY --from=composer /app/vendor ./vendor
COPY --from=builder /app/composer.json ./
COPY --from=builder /app/composer.lock ./
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./
COPY --from=builder /app/artisan ./
COPY --from=builder /app/.env ./

# Copy Nginx configuration
COPY docker/nginx.conf /etc/nginx/http.d/default.conf

# Create SSL directory
RUN mkdir -p /etc/nginx/ssl

# Set permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html/storage \
    && chmod -R 755 /var/www/html/bootstrap/cache \
    && chmod -R 755 /var/www/html/public/build \
    && chmod -R 755 /etc/nginx/ssl

# Generate application key if not set
RUN php artisan key:generate --force

# Create storage link
RUN php artisan storage:link

# Clear and cache configuration
RUN php artisan config:clear \
    && php artisan config:cache \
    && php artisan route:clear \
    && php artisan route:cache \
    && php artisan view:clear \
    && php artisan view:cache \
    && php artisan optimize

# Create supervisor configuration
RUN echo "[supervisord]" > /etc/supervisord.conf \
    && echo "nodaemon=true" >> /etc/supervisord.conf \
    && echo "user=root" >> /etc/supervisord.conf \
    && echo "logfile=/var/log/supervisord.log" >> /etc/supervisord.conf \
    && echo "pidfile=/var/run/supervisord.pid" >> /etc/supervisord.conf \
    && echo "" >> /etc/supervisord.conf \
    && echo "[program:php-fpm]" >> /etc/supervisord.conf \
    && echo "command=php-fpm" >> /etc/supervisord.conf \
    && echo "" >> /etc/supervisord.conf \
    && echo "[program:nginx]" >> /etc/supervisord.conf \
    && echo "command=nginx -g 'daemon off;'" >> /etc/supervisord.conf

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Expose the ports
EXPOSE 80 443

# Start supervisor
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"] 