import { Head, Link } from '@inertiajs/react'
import { ArrowRight, CalendarDays, MonitorPlay, Presentation, Sparkles } from 'lucide-react'

export type MediaItemSummary = {
  slug: string
  title: string
  summary: string | null
  thumbnailUrl: string | null
  sourceLabel: string | null
  publishedAtHuman: string | null
  detailUrl: string
}

type Props = {
  type: 'slide' | 'video'
  items: MediaItemSummary[]
  canonicalUrl: string
}

const copyByType = {
  slide: {
    eyebrow: 'Slides',
    heading: 'Decks from talks and workshops',
    description:
      "Slide decks from conference talks, meetups, and workshops. If you were in the room, here's the deck. If you weren't, it's still mostly readable on its own.",
    emptyTitle: 'No decks up yet',
    emptyBody: "I haven't posted a deck here yet. Check back after the next talk, or see what I've been writing about instead.",
    ctaLabel: 'View slides',
  },
  video: {
    eyebrow: 'Videos',
    heading: "Talks and walkthroughs, wherever they're published",
    description:
      "Recorded talks and walkthroughs, embedded from wherever they actually live: YouTube, mostly, sometimes a conference site.",
    emptyTitle: 'No videos up yet',
    emptyBody: "Nothing's posted here yet. Check back after the next talk, or see what I've been writing about instead.",
    ctaLabel: 'Watch video',
  },
} as const

export default function MediaIndex({ type, items, canonicalUrl }: Props) {
  const copy = copyByType[type]
  const title = `${copy.eyebrow} | Harun R. Rayhan`
  const Icon = type === 'slide' ? Presentation : MonitorPlay

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={copy.description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={copy.description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <link rel="canonical" href={canonicalUrl} />
      </Head>

      <div className="pt-24">
        <section className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">
              <Sparkles className="h-3.5 w-3.5 text-amber-700" />
              {copy.eyebrow}
            </p>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">{copy.heading}</h1>
            <p className="mt-4 text-lg leading-8 text-slate-600">{copy.description}</p>
          </div>

          {items.length === 0 ? (
            <div className="mt-16 rounded-[2rem] border border-dashed border-slate-300 bg-white p-12 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{copy.emptyTitle}</p>
              <p className="mx-auto mt-4 max-w-lg text-slate-600">{copy.emptyBody}</p>
              <Link
                href="/blog"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Read the blog
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="mt-12 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => (
                <article
                  key={item.slug}
                  className="group overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <Link href={item.detailUrl} className="block h-full">
                    <div className="relative aspect-video overflow-hidden bg-slate-100">
                      {item.thumbnailUrl ? (
                        <img
                          src={item.thumbnailUrl}
                          alt={item.title}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full flex-col justify-end bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-6 text-white">
                          <Icon className="h-6 w-6 text-amber-200/90" />
                          <p className="mt-3 text-xl font-semibold">{item.title}</p>
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-500">
                        {item.sourceLabel ? <span>{item.sourceLabel}</span> : null}
                        {item.publishedAtHuman ? (
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {item.publishedAtHuman}
                          </span>
                        ) : null}
                      </div>
                      <h2 className="mt-3 text-2xl font-semibold text-slate-950">{item.title}</h2>
                      {item.summary ? (
                        <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-600">{item.summary}</p>
                      ) : null}
                      <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                        {copy.ctaLabel}
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  )
}
