const NEWSLETTER_AVATARS = [
    '/images/newsletter/avatar-1.svg',
    '/images/newsletter/avatar-2.svg',
    '/images/newsletter/avatar-3.svg',
]

export function pickNewsletterAvatars(): [string, string] {
    // Stable on the server and browser so the initial render hydrates unchanged.
    return [NEWSLETTER_AVATARS[0], NEWSLETTER_AVATARS[1]]
}
