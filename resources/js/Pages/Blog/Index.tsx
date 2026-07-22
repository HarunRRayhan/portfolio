import { Head, Link } from '@inertiajs/react'
import { ArrowRight, CalendarDays, Clock3, Eye, MessageCircle, Rss, Sparkles, Tag } from 'lucide-react'
import { ShareButton } from '@/Components/ShareButton'

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
  viewCount: number
  tags: Array<{ name: string; slug: string }>
  url: string
  canonicalUrl: string
  sourceUrl: string
}

interface BlogIndexProps {
  posts: BlogPostSummary[]
  canonicalUrl: string
}

export default function BlogIndex({ posts, canonicalUrl }: BlogIndexProps) {
  const description =
    'AWS, DevOps, Laravel, serverless architecture, and practical engineering notes from Harun\'s blog.'

  const uniqueTags = new Set(posts.flatMap((post) => post.tags.map((tag) => tag.name))).size
  const totalComments = posts.reduce((sum, post) => sum + post.responseCount + post.replyCount, 0)

  return (
    <>
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

      <div className="pt-24">
          <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm sm:p-10 lg:p-12">
                <p className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white">
                  <Sparkles className="h-3.5 w-3.5" />
                  Writing hub
                </p>
                <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                  Engineering notes, shipping lessons, and practical systems thinking.
                </h1>
                <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
                  A home for long-form posts on AWS, DevOps, Laravel, serverless architecture, and how production software
                  actually gets built.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <a
                    href="#latest"
                    className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
                  >
                    Browse latest
                    <ArrowRight className="h-4 w-4" />
                  </a>
                  <a
                    href="/blog/feed.xml"
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950"
                  >
                    RSS feed
                    <Rss className="h-4 w-4" />
                  </a>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-sm font-medium text-slate-500">Posts</p>
                  <p className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">{posts.length}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">Latest articles published on this site.</p>
                </div>
                <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-sm font-medium text-slate-500">Topics</p>
                  <p className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">{uniqueTags}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">Tags currently represented across the blog archive.</p>
                </div>
                <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:col-span-2 lg:col-span-1">
                  <p className="text-sm font-medium text-slate-500">Comments</p>
                  <p className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">{totalComments}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">Threaded discussion count across the live posts.</p>
                </div>
              </div>
            </div>
          </section>

          <section id="latest" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Latest writing</p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">A cleaner reading surface for technical posts</h2>
              </div>
              <p className="max-w-2xl text-sm leading-7 text-slate-500">
                Each post uses a consistent editorial layout: clear metadata, generous spacing, stronger hierarchy, and a card
                system that keeps the writing front and center.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {posts.map((post) => (
                <article
                  key={post.slug}
                  className="group relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_70px_-34px_rgba(15,23,42,0.45)]"
                >
                  <Link href={post.url} className="absolute inset-0 z-10" aria-label={post.title} />

                  <div className="pointer-events-none relative aspect-[16/10] overflow-hidden bg-slate-100">
                    {post.coverImageUrl ? (
                      <img
                        src={post.coverImageUrl}
                        alt={post.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full items-end bg-[linear-gradient(135deg,#0f172a_0%,#1f2937_100%)] p-6 text-white">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/70">Article</p>
                          <p className="mt-3 text-2xl font-semibold tracking-tight">{post.title}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pointer-events-none p-6">
                    <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-500">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {post.publishedAtHuman}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock3 className="h-3.5 w-3.5" />
                        {post.readTimeLabel}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <MessageCircle className="h-3.5 w-3.5" />
                        {post.responseCount + post.replyCount} comments
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Eye className="h-3.5 w-3.5" />
                        {post.viewCount ?? 0} views
                      </span>
                    </div>

                    <h3 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950 transition-colors group-hover:text-slate-700">
                      {post.title}
                    </h3>
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

                    <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                      Read article
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>

                  <ShareButton
                    url={post.canonicalUrl}
                    title={post.title}
                    shareTitle={post.title}
                    label={`Share "${post.title}"`}
                    theme="slate"
                    wrapperClassName="absolute right-4 top-4 z-20"
                    triggerClassName="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-600 shadow-sm backdrop-blur transition hover:border-slate-300 hover:text-slate-950"
                  />
                </article>
              ))}
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Latest updates</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">Stay close to the writing.</h2>
                  <p className="mt-3 max-w-3xl text-slate-600">
                    New articles appear here first, with RSS and sitemap updates keeping readers and search engines in sync.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <a
                    href="/blog/feed.xml"
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950"
                  >
                    RSS feed
                    <Rss className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </section>
      </div>
    </>
  )
}
