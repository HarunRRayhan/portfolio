// Anonymous public pages are served without cookies so Cloudflare can cache them
// (App\Http\Middleware\CacheablePublicPage). The first form POST then needs an
// XSRF-TOKEN cookie, so fetch one on the first interaction instead of on page load.
const EVENTS = ['pointerdown', 'keydown', 'focusin', 'touchstart'] as const;

export function fetchCsrfCookieOnFirstInteraction(): void {
    const run = () => {
        EVENTS.forEach((event) => document.removeEventListener(event, run, true));
        if (/(?:^|; )XSRF-TOKEN=/.test(document.cookie)) {
            return;
        }
        fetch('/sanctum/csrf-cookie', { credentials: 'same-origin' }).catch(() => {});
    };
    EVENTS.forEach((event) => document.addEventListener(event, run, { capture: true, passive: true }));
}
