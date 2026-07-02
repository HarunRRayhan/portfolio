import { Link } from '@inertiajs/react'
import { ArrowRight, Briefcase, Sparkles } from 'lucide-react'

export type CaseStudyCardSummary = {
  slug: string
  codename: string
  client: string
  industry: string
  duration: string
  headlineOutcome: string
  problem: string
  techStack: string[]
  url: string
  coverImageUrl?: string | null
}

type Props = {
  studies: CaseStudyCardSummary[]
}

export function ServiceRelatedCaseStudies({ studies }: Props) {
  if (!studies.length) {
    return null
  }

  return (
    <section className="border-t border-slate-200 bg-slate-50 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Case studies</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              Related work (codenamed)
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
              Real engagements, anonymized with constellation codenames. Client details generalized per NDA.
            </p>
          </div>
          <Link
            href="/case-studies"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 hover:text-amber-800"
          >
            All case studies
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {studies.map((study) => (
            <article
              key={study.slug}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <Link href={study.url} className="block h-full p-6">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-800">
                  <Sparkles className="h-3.5 w-3.5" />
                  {study.industry}
                </div>
                <h3 className="mt-3 text-xl font-semibold text-slate-950">{study.codename}</h3>
                <p className="mt-2 line-clamp-2 text-sm text-slate-600">{study.client}</p>
                <p className="mt-4 text-sm font-medium text-slate-900">{study.headlineOutcome}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {study.techStack.slice(0, 3).map((tech) => (
                    <span
                      key={tech}
                      className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                  Read case study
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

type HomeProps = {
  studies: CaseStudyCardSummary[]
}

export function CaseStudiesHomeSection({ studies }: HomeProps) {
  if (!studies.length) {
    return (
      <section className="border-y border-slate-200 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <Briefcase className="mx-auto h-8 w-8 text-slate-400" />
          <h2 className="mt-4 text-2xl font-semibold text-slate-950">Case studies launching soon</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-600">
            Constellation-codenamed stories from real engagements. First publish drops on a Tuesday when you are ready.
          </p>
          <Link
            href="/case-studies"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            View case studies
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="border-y border-slate-200 bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Selected work</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Case studies
            </h2>
            <p className="mt-3 max-w-2xl text-slate-600">
              Problems, diagnosis, and outcomes from the field. Codenames only, no client names.
            </p>
          </div>
          <Link
            href="/case-studies"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900"
          >
            Browse all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {studies.map((study) => (
            <article
              key={study.slug}
              className="group overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-50 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <Link href={study.url} className="block">
                <div className="aspect-[16/9] overflow-hidden bg-slate-200">
                  {study.coverImageUrl ? (
                    <img
                      src={study.coverImageUrl}
                      alt={study.codename}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full items-end bg-gradient-to-br from-slate-900 to-slate-700 p-6 text-white">
                      <span className="text-lg font-semibold">{study.codename}</span>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-800">
                    {study.industry}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-950">{study.codename}</h3>
                  <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-600">{study.problem}</p>
                  <p className="mt-4 text-sm font-semibold text-slate-900">{study.headlineOutcome}</p>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}