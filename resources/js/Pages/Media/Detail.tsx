import { Head, Link } from '@inertiajs/react'
import { ArrowLeft, CalendarDays, MonitorPlay, Presentation } from 'lucide-react'

type MediaItemDetail = {
  slug: string
  title: string
  summary: string | null
  thumbnailUrl: string | null
  sourceLabel: string | null
  publishedAtHuman: string | null
  shareUrl: string
  embedUrl: string | null
}

type RelatedMediaItem = {
  slug: string
  title: string
  thumbnailUrl: string | null
  detailUrl: string
}

type Props = {
  type: 'slide' | 'video'
  item: MediaItemDetail
  related: RelatedMediaItem[]
  canonicalUrl: string
}

const copyByType = {
  slide: {
    backLabel: 'Back to slides',
    backHref: '/slides',
    ctaLabel: 'View slides',
    relatedHeading: 'Related slides',
    fallbackDescription: 'A slide deck from a talk or workshop.',
  },
  video: {
    backLabel: 'Back to videos',
    backHref: '/videos',
    ctaLabel: 'Watch video',
    relatedHeading: 'Related videos',
    fallbackDescription: 'A recorded talk or walkthrough.',
  },
} as const

export default function MediaDetailPage({ type, item, related, canonicalUrl }: Props) {
  const copy = copyByType[type]
  const Icon = type === 'slide' ? Presentation : MonitorPlay
  const title = `${item.title} | Harun R. Rayhan`
  const description = item.summary || copy.fallbackDescription
  const showEmbed = type === 'video' && item.embedUrl !== null

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={item.title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonicalUrl} />
        {item.thumbnailUrl ? <meta property="og:image" content={item.thumbnailUrl} /> : null}
        <link rel="canonical" href={canonicalUrl} />
      </Head>

      <div className="pt-24">
        <section id={item.slug} className="mx-auto max-w-5xl px-4 pb-16 sm:px-6 lg:px-8">
          <Link
            href={copy.backHref}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition-colors hover:text-slate-950"
          >
            <ArrowLeft className="h-4 w-4" />
            {copy.backLabel}
          </Link>

          <div className="mt-6 max-w-3xl">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{item.title}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
              {item.sourceLabel ? <span>{item.sourceLabel}</span> : null}
              {item.publishedAtHuman ? (
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4" />
                  {item.publishedAtHuman}
                </span>
              ) : null}
            </div>
            {item.summary ? <p className="mt-5 text-lg leading-8 text-slate-600">{item.summary}</p> : null}
          </div>

          <div className="mt-10">
            {showEmbed ? (
              <div className="relative aspect-video overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950">
                <iframe
                  src={item.embedUrl as string}
                  title={item.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="absolute inset-0 h-full w-full border-0"
                />
              </div>
            ) : (
              <div className="relative aspect-video overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-100">
                {item.thumbnailUrl ? (
                  <img src={item.thumbnailUrl} alt={item.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full flex-col justify-end bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-8 text-white">
                    <Icon className="h-8 w-8 text-amber-200/90" />
                    <p className="mt-4 text-2xl font-semibold">{item.title}</p>
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/30">
                  <a
                    href={item.shareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg transition hover:bg-slate-100"
                  >
                    {copy.ctaLabel}
                  </a>
                </div>
              </div>
            )}
          </div>

          {related.length > 0 ? (
            <div className="mt-12">
              <h2 className="text-xl font-semibold text-slate-950">{copy.relatedHeading}</h2>
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((r) => (
                  <Link
                    key={r.slug}
                    href={r.detailUrl}
                    className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-slate-300"
                  >
                    <div className="relative aspect-video overflow-hidden bg-slate-100">
                      {r.thumbnailUrl ? (
                        <img
                          src={r.thumbnailUrl}
                          alt={r.title}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full items-end bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-4 text-white">
                          <p className="text-sm font-semibold">{r.title}</p>
                        </div>
                      )}
                    </div>
                    <p className="p-4 font-semibold text-slate-950">{r.title}</p>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </>
  )
}
