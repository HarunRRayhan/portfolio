import { Activity, BrainCircuit, Cloud, Database, Globe, Infinity as InfinityIcon, Library, Network, Rocket, ShieldCheck, Sparkles, type LucideIcon } from 'lucide-react'
import { getImageUrl } from '@/lib/imageUtils'
import { cn } from '@/lib/utils'

// Keep in sync with RoadmapRepository::ICONS / COLORS. Class names are literal so Tailwind keeps them.
const icons: Record<string, LucideIcon> = {
  globe: Globe,
  cloud: Cloud,
  infinity: InfinityIcon,
  activity: Activity,
  'brain-circuit': BrainCircuit,
  'shield-check': ShieldCheck,
  network: Network,
  database: Database,
  sparkles: Sparkles,
  rocket: Rocket,
  library: Library,
}

const palettes: Record<string, { bg: string; glow: string; icon: string; path: string }> = {
  sky: { bg: 'to-sky-700', glow: 'bg-sky-400', icon: 'text-sky-300', path: 'stroke-sky-300' },
  amber: { bg: 'to-amber-700', glow: 'bg-amber-400', icon: 'text-amber-300', path: 'stroke-amber-300' },
  indigo: { bg: 'to-indigo-700', glow: 'bg-indigo-400', icon: 'text-indigo-300', path: 'stroke-indigo-300' },
  rose: { bg: 'to-rose-700', glow: 'bg-rose-400', icon: 'text-rose-300', path: 'stroke-rose-300' },
  violet: { bg: 'to-violet-700', glow: 'bg-violet-400', icon: 'text-violet-300', path: 'stroke-violet-300' },
  emerald: { bg: 'to-emerald-700', glow: 'bg-emerald-400', icon: 'text-emerald-300', path: 'stroke-emerald-300' },
  cyan: { bg: 'to-cyan-700', glow: 'bg-cyan-400', icon: 'text-cyan-300', path: 'stroke-cyan-300' },
  blue: { bg: 'to-blue-700', glow: 'bg-blue-400', icon: 'text-blue-300', path: 'stroke-blue-300' },
  fuchsia: { bg: 'to-fuchsia-700', glow: 'bg-fuchsia-400', icon: 'text-fuchsia-300', path: 'stroke-fuchsia-300' },
  orange: { bg: 'to-orange-700', glow: 'bg-orange-400', icon: 'text-orange-300', path: 'stroke-orange-300' },
  teal: { bg: 'to-teal-700', glow: 'bg-teal-400', icon: 'text-teal-300', path: 'stroke-teal-300' },
}

export type RoadmapArtData = { icon: string; color: string; logos: string[] }

/** Decorative header art: accent gradient, a winding dashed "road", the roadmap icon and its tech logos. */
export function RoadmapArt({ art, size = 'card', className }: { art: RoadmapArtData; size?: 'card' | 'hero'; className?: string }) {
  const Icon = icons[art.icon] ?? Globe
  const p = palettes[art.color] ?? palettes.amber
  const hero = size === 'hero'

  return (
    <div aria-hidden className={cn('relative isolate overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900', p.bg, hero ? 'h-44 rounded-[2rem] sm:h-56' : 'h-36', className)}>
      {/* dot grid */}
      <div className="absolute inset-0 opacity-[0.18] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:18px_18px]" />
      {/* glow */}
      <div className={cn('absolute -right-10 -top-16 h-48 w-48 rounded-full opacity-40 blur-3xl', p.glow)} />
      {/* winding road with milestones */}
      <svg viewBox="0 0 400 160" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <path d="M-10 130 C 70 130, 90 60, 170 70 S 280 140, 330 70 S 390 20, 420 30" fill="none" strokeWidth="3" strokeDasharray="2 10" strokeLinecap="round" className={cn('opacity-70', p.path)} />
        {[[40, 128], [170, 70], [330, 70]].map(([x, y]) => (
          <circle key={x} cx={x} cy={y} r="5" className="fill-white/90" />
        ))}
      </svg>
      {/* big ghost icon */}
      <Icon className={cn('absolute opacity-15', p.icon, hero ? '-bottom-8 right-6 h-52 w-52' : '-bottom-6 right-2 h-32 w-32')} strokeWidth={1.25} />
      {/* icon badge */}
      <span className={cn('absolute flex items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm', hero ? 'left-6 top-6 h-16 w-16' : 'left-5 top-5 h-12 w-12')}>
        <Icon className={cn(p.icon, hero ? 'h-8 w-8' : 'h-6 w-6')} />
      </span>
      {/* tech logos */}
      {art.logos.length > 0 && (
        <div className={cn('absolute flex gap-2', hero ? 'bottom-6 left-6' : 'bottom-4 left-5')}>
          {art.logos.map((logo) => (
            <span key={logo} className={cn('flex items-center justify-center rounded-xl bg-white shadow-lg ring-1 ring-black/5', hero ? 'h-12 w-12 p-2' : 'h-9 w-9 p-1.5')}>
              <img src={getImageUrl(logo)} alt="" loading="lazy" className="h-full w-full object-contain" />
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
