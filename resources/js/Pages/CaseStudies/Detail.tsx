import { Head, Link } from '@inertiajs/react'
import { ArrowRight, CalendarDays, Clock3, Share2, Sparkles } from 'lucide-react'
import { CaseStudyArticleBody } from '@/Components/CaseStudyArticleBody'
import { ShareButton } from '@/Components/ShareButton'
import type { CaseStudySummary } from '@/Pages/CaseStudies/Index'

export type CaseStudyDetail = CaseStudySummary & {
  contentHtml: string
  approach: string
  outcomes: string[]
  services: string[]
  serviceSlugs: string[]
  tags: Array<{ name: string; slug: string }>
  canonicalUrl: string
}

type Props = {
  study: CaseStudyDetail
  relatedStudies: CaseStudySummary[]
  canonicalUrl: string
  siteUrl: string
}

const servicePath = (slug: string) => `/services/${slug}`

export default function CaseStudyDetailPage({ study, relatedStudies, canonicalUrl, siteUrl }: Props) {
  const description = study.brief || study.problem
  const metaImageUrl = study.coverImageUrl
    ? study.coverImageUrl.startsWith('/')
      ? `${siteUrl}${study.coverImageUrl}`
      : study.coverImageUrl
    : null

  return (
    <>
      <Head>
        <title>{`${study.title} | Case Studies`}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={study.title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonicalUrl} />
        {metaImageUrl ? <meta property="og:image" content={metaImageUrl} /> : null}
        <meta name="twitter:card" content={metaImageUrl ? 'summary_large_image' : 'summary'} />
        <meta name="twitter:title" content={study.title} />
        <meta name="twitter:description" content={description} />
        {metaImageUrl ? <meta name="twitter:image" content={metaImageUrl} /> : null}
        <link rel="canonical" href={canonicalUrl} />
      </Head>

      <div className="pt-24">
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <article className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_30px_90px_-55px_rgba(15,23,42,0.45)]">
            <div className="border-b border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800 px-6 py-12 text-white sm:px-10 sm:py-16 lg:px-12">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
                <Link href="/case-studies" className="transition-colors hover:text-white">
                  Case studies
                </Link>
                <span className="text-white/30">/</span>
                <span className="text-white/80">{study.codename}</span>
              </div>

              <div className="mt-8 max-w-3xl">
                {study.industry ? (
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-200/90">
                    {study.industry}
                  </p>
                ) : null}
                <h1 className={`text-4xl font-semibold tracking-tight sm:text-5xl ${study.industry ? 'mt-4' : ''}`}>
                  {study.title}
                </h1>
                {study.headlineOutcome ? (
                  <p className="mt-5 text-lg leading-8 text-white/80 sm:text-xl">{study.headlineOutcome}</p>
                ) : null}
                {study.client ? (
                  <p className="mt-4 text-sm leading-7 text-white/60">{study.client}</p>
                ) : null}
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/60">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4" />
                  {study.publishedAtHuman}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 className="h-4 w-4" />
                  {study.readTimeLabel}
                </span>
                <span>{study.duration}</span>
                <ShareButton
                  url={study.canonicalUrl}
                  title={study.title}
                  shareTitle={study.title}
                  label={`Share "${study.title}"`}
                  theme="slate"
                  triggerClassName="inline-flex items-center gap-1.5 text-white/60 transition-colors hover:text-white"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </ShareButton>
              </div>
            </div>

            <div className="grid gap-10 px-6 py-10 lg:grid-cols-[minmax(0,1fr)_280px] lg:px-12 lg:py-12">
              <div>
                <div
                  className={`grid gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 ${study.approach ? 'sm:grid-cols-2' : ''}`}
                >
                  <div className="bg-white p-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-800">Problem</p>
                    <p className="mt-3 text-base font-medium leading-7 text-slate-900">{study.problem}</p>
                  </div>
                  {study.approach ? (
                    <div className="bg-white p-6">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Approach</p>
                      <p className="mt-3 text-base font-medium leading-7 text-slate-900">{study.approach}</p>
                    </div>
                  ) : null}
                </div>

                {study.outcomes.length > 0 ? (
                  <div className="mt-8 rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50/80 to-white p-6 sm:p-8">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-800">Results</p>
                    <ul className="mt-5 grid gap-4 sm:grid-cols-2">
                      {study.outcomes.map((line) => (
                        <li key={line} className="flex gap-3">
                          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
                          <span className="text-base font-medium leading-7 text-slate-900">{line}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="mt-10">
                  <CaseStudyArticleBody html={study.contentHtml} slug={study.slug} />
                </div>

                <p className="mt-10 border-t border-slate-200 pt-8 text-sm leading-7 text-slate-500">
                  Client details have been anonymized to protect confidentiality. Codenames are assigned by Harun.
                  Tech stack and outcomes are representative and have been generalized where required by NDA.
                </p>
              </div>

              <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
                {study.services.length > 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Services</p>
                    <ul className="mt-3 space-y-2">
                      {study.serviceSlugs.map((slug, i) => (
                        <li key={slug}>
                          <Link
                            href={servicePath(slug)}
                            className="text-sm font-semibold text-slate-800 hover:text-amber-800"
                          >
                            {study.services[i] ?? slug}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Stack</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {study.techStack.map((tech) => (
                      <span
                        key={tech}
                        className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                {study.tags.length > 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Topics</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {study.tags.map((tag) => (
                        <span
                          key={tag.slug}
                          className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </aside>
            </div>
          </article>

          {relatedStudies.length > 0 ? (
            <div className="mt-12">
              <h2 className="text-xl font-semibold text-slate-950">More case studies</h2>
              <div className="mt-6 grid gap-6 md:grid-cols-3">
                {relatedStudies.map((related) => (
                  <Link
                    key={related.slug}
                    href={related.url}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-800">
                      {related.industry}
                    </p>
                    <p className="mt-2 font-semibold text-slate-950">{related.codename}</p>
                    <p className="mt-2 line-clamp-2 text-sm text-slate-600">{related.headlineOutcome}</p>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-12 flex justify-center pb-16">
            <Link
              href="/book"
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Book a session
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </>
  )
}
