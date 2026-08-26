import '../css/app.css';
import './bootstrap';

import { createInertiaApp, type ResolvedComponent } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import PublicLayout from './Layouts/PublicLayout';
import { SubscribeProvider } from './Components/SubscribeProvider';
import { resolveDocumentTitle } from './lib/documentTitle';

const pages = import.meta.glob('./Pages/**/*.tsx') as Record<
    string,
    () => Promise<{ default: ResolvedComponent }>
>;

createInertiaApp({
    title: (title) => resolveDocumentTitle(title ?? '', import.meta.env.VITE_APP_NAME),
    resolve: async (name) => {
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
        const root = createRoot(el);

        root.render(
            <SubscribeProvider>
                <App {...props} />
            </SubscribeProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});
