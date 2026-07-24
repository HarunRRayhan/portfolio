import { Facebook, Linkedin, Mail, Messenger, Snapchat, Twitter, WhatsApp } from '@/lib/icons'

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
    name: 'WhatsApp',
    label: undefined as string | undefined,
    Icon: WhatsApp,
    href: (url: string, title: string) => `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
  },
  {
    name: 'LinkedIn',
    label: undefined as string | undefined,
    Icon: Linkedin,
    href: (url: string) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
  {
    name: 'Messenger',
    // The Messenger web send dialog requires a registered Facebook App ID,
    // so this uses the app deep link instead — it opens the Messenger app
    // on mobile (where Messenger sharing is actually used) and is a no-op
    // on desktop rather than a broken share dialog.
    label: undefined as string | undefined,
    Icon: Messenger,
    href: (url: string) => `fb-messenger://share/?link=${encodeURIComponent(url)}`,
  },
  {
    name: 'Snapchat',
    label: undefined as string | undefined,
    Icon: Snapchat,
    href: (url: string) => `https://www.snapchat.com/share?link=${encodeURIComponent(url)}`,
  },
  {
    name: 'Email',
    label: undefined as string | undefined,
    Icon: Mail,
    href: (url: string, title: string) =>
      `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`,
  },
] as const
