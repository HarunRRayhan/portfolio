import '../css/app.css';

import { createInertiaApp, type ResolvedComponent } from '@inertiajs/react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import PublicLayout from './Layouts/PublicLayout';
import { SubscribeProvider } from './Components/SubscribeProvider';
import { resolveDocumentTitle } from './lib/documentTitle';

const pages = import.meta.glob('./Pages/**/*.tsx') as Record<
    string,
    () => Promise<{ default: ResolvedComponent }>
>;

// Initial HTML has its own critical styles. Before enabling interactions or
// SPA navigation, finish loading the shared styles used by menus and forms.
const deferredStyles = document.querySelector<HTMLLinkElement>('link[data-deferred-app-styles]');
const stylesReady = deferredStyles && !deferredStyles.sheet && !deferredStyles.dataset.failed
    ? new Promise<void>((resolve) => {
        deferredStyles.addEventListener('load', () => resolve(), { once: true });
        deferredStyles.addEventListener('error', () => resolve(), { once: true });
        deferredStyles.media = 'all';
    })
    : Promise.resolve();

createInertiaApp({
    title: (title) => resolveDocumentTitle(title ?? '', import.meta.env.VITE_APP_NAME),
    resolve: async (name) => {
        await stylesReady;
        const page = (await pages[`./Pages/${name}.tsx`]()).default;

        // Admin/authenticated pages render their own AuthenticatedLayout (sidebar nav)
        // and don't need the public marketing Menubar/Footer.
        const isAdminArea = name === 'Dashboard' || name === 'Profile/Edit' || name.startsWith('Admin/');

        // Apply PublicLayout as default for all other pages unless they specify their own
        if (!page.layout && !isAdminArea) {
            page.layout = PublicLayout
        }

        return page;
    },
    setup({ el, App, props }) {
        const subscriberCount = (props.initialPage.props as { newsletter?: { subscriberCount?: number } }).newsletter
            ?.subscriberCount ?? 0;

        const tree = (
            <SubscribeProvider subscriberCount={subscriberCount} initialUrl={props.initialPage.url}>
                <App {...props} />
            </SubscribeProvider>
        );
        if (el.hasChildNodes()) {
            hydrateRoot(el, tree);
        } else {
            createRoot(el).render(tree);
        }
    },
    progress: {
        color: '#4B5563',
    },
});
