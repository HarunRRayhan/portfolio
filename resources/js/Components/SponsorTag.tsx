import { Heart } from 'lucide-react'

/** Shown before a sponsor's name; the pink of GitHub's Sponsor button. */
export default function SponsorTag() {
  return (
    <span title="Sponsors this work" className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#bf3989] px-2 py-0.5 text-[11px] font-semibold leading-4 text-white">
      <Heart className="h-3 w-3 fill-current" aria-hidden /> Sponsor
    </span>
  )
}
