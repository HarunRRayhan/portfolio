import { useEffect, useRef, useState } from 'react';

type TurnstileApi = {
    render: (el: HTMLElement, opts: Record<string, unknown>) => string;
    remove: (id: string) => void;
};

declare global {
    interface Window {
        turnstile?: TurnstileApi;
    }
}

const SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
let loader: Promise<void> | null = null;

function load(): Promise<void> {
    loader ??= new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = SRC;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => {
            loader = null;
            reject(new Error('Turnstile failed to load'));
        };
        document.head.appendChild(script);
    });
    return loader;
}

export default function Turnstile({
    siteKey,
    onToken,
    theme = 'light',
}: {
    siteKey: string;
    onToken: (token: string) => void;
    // Match the page, not the OS: Turnstile's own 'auto' follows the OS even on light pages.
    theme?: 'light' | 'dark';
}) {
    const ref = useRef<HTMLDivElement>(null);
    const [failed, setFailed] = useState(false);
    const onTokenRef = useRef(onToken);
    onTokenRef.current = onToken;

    useEffect(() => {
        let id: string | undefined;
        let cancelled = false;

        load()
            .then(() => {
                if (cancelled || !ref.current || !window.turnstile) return;
                id = window.turnstile.render(ref.current, {
                    sitekey: siteKey,
                    theme,
                    callback: (t: string) => onTokenRef.current(t),
                    'expired-callback': () => onTokenRef.current(''),
                    'error-callback': () => onTokenRef.current(''),
                });
            })
            .catch(() => {
                setFailed(true);
                onTokenRef.current('');
            });

        return () => {
            cancelled = true;
            if (id) window.turnstile?.remove(id);
        };
    }, [siteKey, theme]);

    if (failed) {
        return <p className="text-sm text-red-600">Verification failed to load. Refresh to retry.</p>;
    }

    return <div ref={ref} />;
}
