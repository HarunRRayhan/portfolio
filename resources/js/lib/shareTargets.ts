import { Facebook, Linkedin, Mail, Messenger, Snapchat, Twitter, WhatsApp } from '@/lib/icons'

// One-tap social-share targets shown in every ShareSheet, under the QR.
// `href` builds each platform's share-intent URL. `bg`/`fg` are the brand
// tile colors for the icon circle (a CSS `background` value, so gradients
// like Messenger's work too).
export const SOCIAL_SHARE = [
  {
    name: 'X',
    label: undefined as string | undefined,
    Icon: Twitter,
    bg: '#000000',
    fg: '#ffffff',
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
    bg: '#1877F2',
    fg: '#ffffff',
    href: (url: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    name: 'WhatsApp',
    label: undefined as string | undefined,
    Icon: WhatsApp,
    bg: '#25D366',
    fg: '#ffffff',
    href: (url: string, title: string) => `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
  },
  {
    name: 'LinkedIn',
    label: undefined as string | undefined,
    Icon: Linkedin,
    bg: '#0A66C2',
    fg: '#ffffff',
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
    bg: 'linear-gradient(135deg, #00B2FF 0%, #A033FF 50%, #FF5271 100%)',
    fg: '#ffffff',
    href: (url: string) => `fb-messenger://share/?link=${encodeURIComponent(url)}`,
  },
  {
    name: 'Snapchat',
    label: undefined as string | undefined,
    Icon: Snapchat,
    bg: '#FFFC00',
    fg: '#ffffff',
    href: (url: string) => `https://www.snapchat.com/share?link=${encodeURIComponent(url)}`,
  },
  {
    name: 'Email',
    label: undefined as string | undefined,
    Icon: Mail,
    bg: '#4B5563',
    fg: '#ffffff',
    href: (url: string, title: string) =>
      `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`,
  },
] as const
