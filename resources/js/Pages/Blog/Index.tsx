import { Head, Link } from '@inertiajs/react'
import { Footer } from '@/Components/Footer'
import { Menubar } from '@/Components/Menubar'
import { ErrorBoundary } from '@/Components/ErrorBoundary'
import { CalendarDays, ExternalLink, MessageCircle, Newspaper, Tag, Clock3 } from 'lucide-react'

interface BlogPostSummary {
  title: string
  slug: string
  brief: string
  publishedAtHuman: string
  publishedAtIso: string
  readTimeLabel: string
  reactionCount: number
  responseCount: number
  replyCount: number
  coverImageUrl?: string | null
  tags: Array<{ name: string; slug: string }>
  url: string
  canonicalUrl: string
  sourceUrl: string
}

interface BlogIndexProps {
  publication: {
    title: string
    url: string
    host: string
    exportedAt: string
    source: string
  }
  posts: BlogPostSummary[]
  canonicalUrl: string
}

export default function BlogIndex({ publication, posts, canonicalUrl }: BlogIndexProps) {
  const description =
    "AWS, DevOps, Laravel, serverless architecture, and practical engineering notes from Harun's blog."

  return (
    <ErrorBoundary>
      <Head>
        <title>Blog | Harun R. Rayhan</title>
        <meta name="description" content={description} />
        <meta name="keywords" content="AWS blog, DevOps blog, Laravel blog, serverless, infrastructure as code" />
        <meta property="og:title" content="Blog | Harun R. Rayhan" />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Blog | Harun R. Rayhan" />
        <meta name="twitter:description" content={description} />
        <link rel="canonical" href={canonicalUrl} />
        <link rel="alternate" type="application/rss+xml" title="Harun's Blog RSS Feed" href="/blog/feed.xml" />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
        <Menubar />

        <main className="pt-24">
          <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
            <div className="rounded-[2rem] border border-slate-200 bg-white/80 p-8 shadow-sm backdrop-blur-sm md:p-12">
              <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl">
                  <p className="inline-flex items-center gap-2 rounded-full bg-[#7C3AED]/10 px-4 py-2 text-sm font-medium text-[#6D28D9]">
                    <Newspaper className="h-4 w-4" />
                    Publication: {publication.title}
                  </p>
                  <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
                    Blog
                  </h1>
                  <p className="mt-5 text-lg leading-8 text-slate-600">
                    Long-form notes on AWS, DevOps, Laravel, serverless systems, and the practical decisions behind
                    shipping and running production software.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[30rem]">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Posts</p>
                    <p className="mt-2 text-3xl font-semibold text-slate-950">{posts.length}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Source</p>
                    <p className="mt-2 text-xl font-semibold text-slate-950">Hashnode export</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Canonical</p>
                    <p className="mt-2 text-xl font-semibold text-slate-950">harun.dev/blog</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {posts.map((post) => (
                <article
                  key={post.slug}
                  className="group overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <Link href={post.url} className="block">
                    <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
                      {post.coverImageUrl ? (
                        <img
                          src={post.coverImageUrl}
                          alt={post.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : null}
                    </div>
                    <div className="p-6">
                      <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {post.publishedAtHuman}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock3 className="h-3.5 w-3.5" />
                          {post.readTimeLabel}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MessageCircle className="h-3.5 w-3.5" />
                          {post.responseCount + post.replyCount} comments
                        </span>
                      </div>
                      <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950 transition-colors group-hover:text-[#7C3AED]">
                        {post.title}
                      </h2>
                      <p className="mt-3 line-clamp-4 text-sm leading-7 text-slate-600">{post.brief}</p>
                      <div className="mt-5 flex flex-wrap gap-2">
                        {post.tags.slice(0, 4).map((tag) => (
                          <span
                            key={tag.slug}
                            className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
                          >
                            <Tag className="h-3 w-3" />
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#7C3AED]">Syndication</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">One canonical source, many downstream shares</h2>
                  <p className="mt-3 max-w-3xl text-slate-600">
                    Articles publish here first. After 24 hours they can be shared to daily.dev, Hashnode, DevGuru,
                    Medium, and Hacker News without fragmenting the canonical URL.
                  </p>
                </div>
                <a
                  href={publication.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#7C3AED] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#6D28D9]"
                >
                  Open legacy source
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </ErrorBoundary>
  )
}
