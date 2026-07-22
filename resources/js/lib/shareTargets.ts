import { Facebook, Linkedin, Reddit, Twitter, WhatsApp } from '@/lib/icons'

// One-tap social-share targets shown in every ShareSheet, under the QR and
// above Share/Copy. `href` builds each platform's share-intent URL.
export const SOCIAL_SHARE = [
  {
    name: 'X',
    label: undefined as string | undefined,
    Icon: Twitter,
    href: (url: string, title: string) =>
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  },
  {
    name: 'Facebook',
    // "Share on Facebook" is a common cosmetic-filter target in ad-blocker
    // social-widget lists — a differently worded label keeps this button
    // visible without changing what it does.
    label: 'Share to Facebook' as string | undefined,
    Icon: Facebook,
    href: (url: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    name: 'LinkedIn',
    label: undefined as string | undefined,
    Icon: Linkedin,
    href: (url: string) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
  {
    name: 'WhatsApp',
    label: undefined as string | undefined,
    Icon: WhatsApp,
    href: (url: string, title: string) => `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
  },
  {
    name: 'Reddit',
    label: undefined as string | undefined,
    Icon: Reddit,
    href: (url: string, title: string) =>
      `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
  },
] as const
