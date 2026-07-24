import '../css/app.css';
import './bootstrap';

import { createInertiaApp, type ResolvedComponent } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import PublicLayout from './Layouts/PublicLayout';
import { SubscribeProvider } from './Components/SubscribeProvider';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';
const pages = import.meta.glob('./Pages/**/*.tsx') as Record<
    string,
    () => Promise<{ default: ResolvedComponent }>
>;

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: async (name) => {
        const page = (await pages[`./Pages/${name}.tsx`]()).default;

        // Apply PublicLayout as default for all pages unless they specify their own
        if (!page.layout) {
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
