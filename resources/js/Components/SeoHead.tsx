import { Head, usePage } from '@inertiajs/react'

export type SeoPayload = {
  title: string
  description: string
  canonicalUrl: string
  ogImage?: string | null
  ogType?: string
  jsonLd?: Record<string, unknown>[]
  noindex?: boolean
}

export function SeoHead() {
  const { seo } = usePage().props as { seo?: SeoPayload | null }

  if (!seo) {
    return null
  }

  return (
    <Head title={seo.title}>
      <meta name="description" content={seo.description} />
      <meta property="og:title" content={seo.title} />
      <meta property="og:description" content={seo.description} />
      <meta property="og:type" content={seo.ogType ?? 'website'} />
      <meta property="og:url" content={seo.canonicalUrl} />
      <meta property="og:site_name" content="Harun R. Rayhan" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seo.title} />
      <meta name="twitter:description" content={seo.description} />
      <link rel="canonical" href={seo.canonicalUrl} />
      {seo.ogImage ? (
        <>
          <meta property="og:image" content={seo.ogImage} />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta name="twitter:image" content={seo.ogImage} />
        </>
      ) : null}
      {seo.noindex ? (
        <>
          <meta name="robots" content="noindex, nofollow, noarchive" />
          <meta name="googlebot" content="noindex, nofollow, noarchive" />
        </>
      ) : null}
      {seo.jsonLd?.map((graph, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(graph)}
        </script>
      ))}
    </Head>
  )
}
