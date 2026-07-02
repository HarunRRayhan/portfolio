import { Head, Link } from '@inertiajs/react'
import { ArrowRight, CalendarDays, Clock3, Sparkles } from 'lucide-react'

export type CaseStudySummary = {
  slug: string
  codename: string
  client: string
  industry: string
  duration: string
  headlineOutcome: string
  problem: string
  brief: string
  techStack: string[]
  publishedAtHuman: string
  readTimeLabel: string
  url: string
  coverImageUrl?: string | null
}

type Props = {
  studies: CaseStudySummary[]
  canonicalUrl: string
}

export default function CaseStudiesIndex({ studies, canonicalUrl }: Props) {
  const description =
    'Anonymized case studies from real cloud and DevOps engagements. Constellation codenames, concrete outcomes, no client names.'

  return (
    <>
      <Head>
        <title>Case Studies | Harun R. Rayhan</title>
        <meta name="description" content={description} />
        <meta property="og:title" content="Case Studies | Harun R. Rayhan" />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <link rel="canonical" href={canonicalUrl} />
      </Head>

      <div className="pt-24">
        <section className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">
              <Sparkles className="h-3.5 w-3.5 text-amber-700" />
              Constellation series
            </p>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Case studies
            </h1>
            <p className="mt-4 text-lg leading-8 text-slate-600">{description}</p>
          </div>

          {studies.length === 0 ? (
            <div className="mt-16 rounded-[2rem] border border-dashed border-slate-300 bg-white p-12 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Coming soon</p>
              <p className="mx-auto mt-4 max-w-lg text-slate-600">
                The first story publishes on a Tuesday when you add it to{' '}
                <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm">resources/case-studies/PLAN.md</code>{' '}
                and ship a markdown file. Your 5pm Tuesday cron will nudge you to pick an idea.
              </p>
              <Link
                href="/services"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Explore services
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="mt-12 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
              {studies.map((study) => (
                <article
                  key={study.slug}
                  className="group overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <Link href={study.url} className="block h-full">
                    <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                      {study.coverImageUrl ? (
                        <img
                          src={study.coverImageUrl}
                          alt={study.codename}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full flex-col justify-end bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-6 text-white">
                          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-200/90">
                            {study.industry}
                          </p>
                          <p className="mt-2 text-2xl font-semibold">{study.codename}</p>
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-500">
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {study.publishedAtHuman}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Clock3 className="h-3.5 w-3.5" />
                          {study.readTimeLabel}
                        </span>
                      </div>
                      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-amber-800">
                        {study.industry}
                      </p>
                      <h2 className="mt-2 text-2xl font-semibold text-slate-950">{study.codename}</h2>
                      <p className="mt-2 text-sm text-slate-600">{study.client}</p>
                      <p className="mt-4 text-sm font-semibold text-slate-900">{study.headlineOutcome}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {study.techStack.slice(0, 4).map((tech) => (
                          <span
                            key={tech}
                            className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                          >
                            {tech}
                          </span>
                        ))}
                        {study.techStack.length > 4 ? (
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                            +{study.techStack.length - 4}
                          </span>
                        ) : null}
                      </div>
                      <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                        Read case study
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