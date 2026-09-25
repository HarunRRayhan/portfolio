import { createInertiaApp } from '@inertiajs/react';
import createServer from '@inertiajs/react/server';
import { renderToString } from 'react-dom/server';
import Homepage from './Pages/Homepage';
import PublicLayout from './Layouts/PublicLayout';
import { SubscribeProvider } from './Components/SubscribeProvider';
import { resolveDocumentTitle } from './lib/documentTitle';
import type { Page } from '@inertiajs/core';

export const renderPage = (page: Page) => createInertiaApp({
    page,
    render: renderToString,
    title: (title) => resolveDocumentTitle(title ?? '', import.meta.env.VITE_APP_NAME),
    resolve: (name) => {
        if (name !== 'Homepage') throw new Error(`SSR is not enabled for ${name}`);
        return Object.assign(Homepage, { layout: PublicLayout });
    },
    setup: ({ App, props }) => (
        <SubscribeProvider
            initialUrl={props.initialPage.url}
            subscriberCount={(props.initialPage.props as { newsletter?: { subscriberCount?: number } }).newsletter?.subscriberCount ?? 0}
        >
            <App {...props} />
        </SubscribeProvider>
    ),
});

if (process.env.INERTIA_SSR_BUILD_ONLY !== 'true') createServer(renderPage);
