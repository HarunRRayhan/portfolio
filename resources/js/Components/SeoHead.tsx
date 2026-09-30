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
  const { seo, siteJsonLd = [] } = usePage().props as { seo?: SeoPayload | null; siteJsonLd?: Record<string, unknown>[] }

  return (
    <Head title={seo?.title}>
      {seo ? [
        <meta key="description" head-key="description" name="description" content={seo.description} />,
        <meta key="og:title" head-key="og:title" property="og:title" content={seo.title} />,
        <meta key="og:description" head-key="og:description" property="og:description" content={seo.description} />,
        <meta key="og:type" head-key="og:type" property="og:type" content={seo.ogType ?? 'website'} />,
        <meta key="og:url" head-key="og:url" property="og:url" content={seo.canonicalUrl} />,
        <meta key="og:site_name" head-key="og:site_name" property="og:site_name" content="Harun R. Rayhan" />,
        <meta key="twitter:card" head-key="twitter:card" name="twitter:card" content="summary_large_image" />,
        <meta key="twitter:title" head-key="twitter:title" name="twitter:title" content={seo.title} />,
        <meta key="twitter:description" head-key="twitter:description" name="twitter:description" content={seo.description} />,
        <link key="canonical" head-key="canonical" rel="canonical" href={seo.canonicalUrl} />,
      ] : null}
      {seo?.ogImage ? [
        <meta key="og:image" head-key="og:image" property="og:image" content={seo.ogImage} />,
        <meta key="og:image:width" head-key="og:image:width" property="og:image:width" content="1200" />,
        <meta key="og:image:height" head-key="og:image:height" property="og:image:height" content="630" />,
        <meta key="twitter:image" head-key="twitter:image" name="twitter:image" content={seo.ogImage} />,
      ] : null}
      {seo?.noindex ? [
        <meta key="robots" head-key="robots" name="robots" content="noindex, nofollow, noarchive" />,
        <meta key="googlebot" head-key="googlebot" name="googlebot" content="noindex, nofollow, noarchive" />,
      ] : null}
      {siteJsonLd.map((graph, index) => (
        <script key={`site-jsonld-${index}`} head-key={`site-jsonld-${index}`} type="application/ld+json">
          {JSON.stringify(graph).replace(/</g, '\\u003c')}
        </script>
      ))}
      {(seo?.jsonLd ?? []).map((graph, index) => (
        <script key={`seo-jsonld-${index}`} head-key={`seo-jsonld-${index}`} type="application/ld+json">
          {JSON.stringify(graph).replace(/</g, '\\u003c')}
        </script>
      ))}
    </Head>
  )
}
