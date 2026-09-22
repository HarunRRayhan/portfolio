const NEWSLETTER_AVATARS = [
    '/images/newsletter/avatar-1.svg',
    '/images/newsletter/avatar-2.svg',
    '/images/newsletter/avatar-3.svg',
]

export function pickNewsletterAvatars(): [string, string] {
    const firstIndex = Math.floor(Math.random() * NEWSLETTER_AVATARS.length)
    const secondIndex =
        (firstIndex + 1 + Math.floor(Math.random() * (NEWSLETTER_AVATARS.length - 1))) % NEWSLETTER_AVATARS.length

    return [
        NEWSLETTER_AVATARS[firstIndex] ?? NEWSLETTER_AVATARS[0],
        NEWSLETTER_AVATARS[secondIndex] ?? NEWSLETTER_AVATARS[1],
    ]
}
