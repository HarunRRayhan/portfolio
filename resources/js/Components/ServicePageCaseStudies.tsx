import { usePage } from '@inertiajs/react'
import { ServiceRelatedCaseStudies, type CaseStudyCardSummary } from '@/Components/CaseStudiesSections'

export function ServicePageCaseStudies() {
  const { url, props } = usePage()
  const pathname = url.split('?')[0]
  const match = pathname.match(/^\/services\/([^/]+)/)

  if (!match?.[1]) {
    return null
  }

  const slug = match[1]
  const byService = (props as { caseStudiesByService?: Record<string, CaseStudyCardSummary[]> })
    .caseStudiesByService
  const studies = byService?.[slug] ?? []

  return <ServiceRelatedCaseStudies studies={studies} />
}