import {
  BookOpen,
  Briefcase,
  Calendar,
  ExternalLink,
  FileText,
  Heart,
  Home,
  Link as LinkIcon,
  MapPin,
  MessageCircle,
  Music,
  Phone,
  Rss,
  Send,
  ShoppingBag,
  Star,
  Video,
} from 'lucide-react'
import { Facebook, Github, Instagram, Linkedin, Mail, Threads, TikTok, Twitter, YouTube } from '@/lib/icons'
import type { ComponentType, SVGProps } from 'react'

export type BioIcon = ComponentType<SVGProps<SVGSVGElement>>

// Central registry of the icons that can be attached to a bio link. The string
// key is what gets persisted in the `bio_links.icon` column, so it must stay
// stable. Both the admin icon picker and the public /bio page read from here.
export const BIO_ICONS: Record<string, { label: string; Icon: BioIcon }> = {
  link: { label: 'Link', Icon: LinkIcon },
  globe: { label: 'Website', Icon: ExternalLink },
  home: { label: 'Home', Icon: Home },
  blog: { label: 'Blog', Icon: BookOpen },
  message: { label: 'Message', Icon: MessageCircle },
  mail: { label: 'Email', Icon: Mail },
  phone: { label: 'Phone', Icon: Phone },
  calendar: { label: 'Book a call', Icon: Calendar },
  file: { label: 'Document', Icon: FileText },
  work: { label: 'Work', Icon: Briefcase },
  location: { label: 'Location', Icon: MapPin },
  github: { label: 'GitHub', Icon: Github },
  linkedin: { label: 'LinkedIn', Icon: Linkedin },
  twitter: { label: 'X / Twitter', Icon: Twitter },
  instagram: { label: 'Instagram', Icon: Instagram },
  tiktok: { label: 'TikTok', Icon: TikTok },
  youtube: { label: 'YouTube', Icon: YouTube },
  facebook: { label: 'Facebook', Icon: Facebook },
  threads: { label: 'Threads', Icon: Threads },
  send: { label: 'Telegram / Send', Icon: Send },
  video: { label: 'Video', Icon: Video },
  music: { label: 'Music', Icon: Music },
  shop: { label: 'Shop', Icon: ShoppingBag },
  rss: { label: 'RSS', Icon: Rss },
  star: { label: 'Featured', Icon: Star },
  heart: { label: 'Support', Icon: Heart },
}

export const BIO_ICON_KEYS = Object.keys(BIO_ICONS)

export const DEFAULT_BIO_ICON = 'link'

export function bioIcon(key: string | null | undefined): BioIcon {
  return (key && BIO_ICONS[key]?.Icon) || BIO_ICONS[DEFAULT_BIO_ICON].Icon
}
