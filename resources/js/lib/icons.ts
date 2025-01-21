import {
  Twitter,
  Globe,
  Linkedin,
  Github,
  Mail,
  type LucideIcon,
} from "lucide-react"

export type Icon = LucideIcon

export const Icons = {
  twitter: Twitter,
  globe: Globe,
  linkedin: Linkedin,
  github: Github,
  mail: Mail,
} as const 