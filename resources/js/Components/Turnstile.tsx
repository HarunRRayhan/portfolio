import { useEffect, useRef } from 'react';

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
}: {
    siteKey: string;
    onToken: (token: string) => void;
}) {
    const ref = useRef<HTMLDivElement>(null);
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
                    callback: (t: string) => onTokenRef.current(t),
                    'expired-callback': () => onTokenRef.current(''),
                    'error-callback': () => onTokenRef.current(''),
                });
            })
            .catch(() => onTokenRef.current(''));

        return () => {
            cancelled = true;
            if (id) window.turnstile?.remove(id);
        };
    }, [siteKey]);

    return <div ref={ref} />;
}
