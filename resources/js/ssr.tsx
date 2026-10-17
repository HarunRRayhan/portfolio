import { createInertiaApp } from '@inertiajs/react';
import createServer from '@inertiajs/react/server';
import { renderToString } from 'react-dom/server';
import type { ComponentType } from 'react';
import Homepage from './Pages/Homepage';
import BlogIndex from './Pages/Blog/Index';
import BlogPost from './Pages/Blog/Post';
import PublicLayout from './Layouts/PublicLayout';
import { SubscribeProvider } from './Components/SubscribeProvider';
import { resolveDocumentTitle } from './lib/documentTitle';
import type { Page } from '@inertiajs/core';

const extraPages = import.meta.glob(
    [
        './Pages/Services.tsx', './Pages/Services/*.tsx', './Pages/Products.tsx',
        './Pages/About.tsx', './Pages/Bio.tsx', './Pages/Book.tsx', './Pages/Contact.tsx',
        './Pages/Privacy.tsx', './Pages/Sponsor.tsx', './Pages/Terms.tsx',
        './Pages/CaseStudies/*.tsx', './Pages/Media/*.tsx',
    ],
    { eager: true },
) as Record<string, { default: ComponentType }>;

export const renderPage = (page: Page) => createInertiaApp({
    page,
    render: renderToString,
    title: (title) => resolveDocumentTitle(title ?? '', import.meta.env.VITE_APP_NAME),
    resolve: (name) => {
        const component = name === 'Homepage' ? Homepage
            : name === 'Blog/Index' ? BlogIndex
            : name === 'Blog/Post' ? BlogPost
            : extraPages[`./Pages/${name}.tsx`]?.default;
        const props = page.props as { post?: { isDraft?: boolean }; auth?: { user?: unknown } };
        if (!component || props.auth?.user || props.post?.isDraft) {
            throw new Error(`SSR is not enabled for ${name}`);
        }
        // Same default as app.tsx: pages with their own layout (Bio) keep it.
        return Object.assign(component, { layout: (component as { layout?: typeof PublicLayout }).layout ?? PublicLayout });
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
