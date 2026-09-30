import { Head, Link, router, usePage } from '@inertiajs/react'
import { ArrowRight, CalendarDays, Clock3, Eye, MessageCircle, Rss, Search, Tag } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
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
  coverImageFallbackUrl?: string | null
  coverImageSources?: Array<{ url: string; width: number }>
  coverImageAlt: string
  viewCount: number
  tags: Array<{ name: string; slug: string }>
  url: string
  canonicalUrl: string
  shareUrl: string
  sourceUrl: string
}

interface BlogIndexProps {
  posts: BlogPostSummary[]
  canonicalUrl: string
}

function restoreOriginalCover(image: HTMLImageElement, fallback?: string | null) {
  if (image.srcset && fallback) {
    // Origin builds can become ready before the separate CDN upload.
    // Removing srcset also ensures a failed original cannot retry in a loop.
    image.removeAttribute('srcset')
    image.src = fallback
  }
}

export default function BlogIndex({ posts, canonicalUrl }: BlogIndexProps) {
  const description =
    'AWS, DevOps, Laravel, serverless architecture, and practical engineering notes from Harun\'s blog.'

  const page = usePage()
  const params = useMemo(() => new URL(page.url, canonicalUrl).searchParams, [page.url, canonicalUrl])
  const query = params.get('q') ?? ''
  const topic = params.get('topic') ?? ''
  const [search, setSearch] = useState(query)

  useEffect(() => setSearch(query), [query])

  const topics = useMemo(() => {
    const counts = new Map<string, { slug: string; name: string; count: number }>()
    posts.forEach((post) => {
      new Map(post.tags.map((tag) => [tag.slug, tag])).forEach((tag) => {
        const existing = counts.get(tag.slug)
        counts.set(tag.slug, { ...tag, count: (existing?.count ?? 0) + 1 })
      })
    })
    return Array.from(counts.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [posts])

  const matchingPosts = useMemo(() => {
    const words = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean)
    return posts.filter((post) => {
      if (topic && !post.tags.some((tag) => tag.slug === topic)) return false
      const text = [post.title, post.brief, ...post.tags.map((tag) => tag.name)].join(' ').toLocaleLowerCase()
      return words.every((word) => text.includes(word))
    })
  }, [posts, query, topic])

  const updateFilters = (nextQuery: string, nextTopic: string) => {
    const next = new URL(page.url, canonicalUrl)
    if (nextQuery.trim()) next.searchParams.set('q', nextQuery.trim())
    else next.searchParams.delete('q')
    if (nextTopic) next.searchParams.set('topic', nextTopic)
    else next.searchParams.delete('topic')
    // Match Laravel's RFC3986 URLs so a reload does not create a second history
    // entry just because URLSearchParams encodes spaces as '+' instead of '%20'.
    const encode = (value: string) => encodeURIComponent(value).replace(/[!'()*]/g,
      (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`)
    const queryString = Array.from(next.searchParams, ([key, value]) => `${encode(key)}=${encode(value)}`).join('&')
    // Client-side visits retain the published catalog and integrate with Inertia's back/forward history.
    router.push({ url: `${next.pathname}${queryString ? `?${queryString}` : ''}${next.hash}`, preserveScroll: true, preserveState: true })
  }

  const submitSearch = (event: FormEvent) => {
    event.preventDefault()
    updateFilters(search, topic)
  }

  const totalComments = posts.reduce((sum, post) => sum + post.responseCount + post.replyCount, 0)

  return (
    <>
      <Head>
        <link head-key="blog-rss" rel="alternate" type="application/rss+xml" title="Harun's Blog RSS Feed" href="/blog/feed.xml" />
      </Head>

      <div className="pt-24">
          <section className="mx-auto max-w-7xl px-4 pb-6 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between sm:pb-8">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-5xl">Engineering notes</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                  Practical posts on AWS, DevOps, Laravel, and running software in production.
                </p>
                <p className="mt-3 text-xs text-slate-500 sm:text-sm">
                  {posts.length} articles <span aria-hidden="true" className="mx-2 text-slate-300">/</span>
                  {topics.length} topics <span aria-hidden="true" className="mx-2 text-slate-300">/</span>
                  {totalComments} comments
                </p>
              </div>
              <a href="/blog/feed.xml"
                className="inline-flex w-fit shrink-0 items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-600">
                <Rss className="h-4 w-4" /> RSS feed
              </a>
            </div>
          </section>

          <section id="latest" aria-label="Blog articles" className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
            <h2 className="sr-only">Articles</h2>
            <form onSubmit={submitSearch} role="search" aria-label="Find articles"
              className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(12rem,18rem)]">
              <div>
                <label htmlFor="blog-search" className="mb-1.5 block text-sm font-medium text-slate-700">Search articles</label>
                <div className="flex">
                  <input id="blog-search" type="search" name="q" value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Title, description, or topic"
                    className="min-w-0 flex-1 rounded-l-lg border border-r-0 border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 placeholder:text-slate-400 focus:z-10 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600" />
                  <button type="submit" className="inline-flex items-center gap-2 rounded-r-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700 focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600">
                    <Search className="h-4 w-4" aria-hidden="true" /> Search
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="blog-topic" className="mb-1.5 block text-sm font-medium text-slate-700">Topic</label>
                <select id="blog-topic" name="topic" value={topic}
                  onChange={(event) => updateFilters(search, event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600">
                  <option value="">All topics</option>
                  {topic && !topics.some((entry) => entry.slug === topic) && <option value={topic}>Unknown topic</option>}
                  {topics.map((entry) => <option key={entry.slug} value={entry.slug}>{entry.name} ({entry.count})</option>)}
                </select>
              </div>
            </form>
            <div className="mb-5 flex items-center justify-between gap-3 text-sm">
              <p role="status" aria-live="polite" className="text-slate-500">
                {matchingPosts.length === posts.length ? `${posts.length} articles` : `${matchingPosts.length} of ${posts.length} articles`}
              </p>
              {(query || topic || search) && <button type="button" onClick={() => { setSearch(''); updateFilters('', '') }}
                className="font-medium text-slate-700 underline underline-offset-4 hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-600">
                Clear filters
              </button>}
            </div>
            {matchingPosts.length === 0 && <div className="border-y border-slate-200 py-12 text-center">
              <h2 className="text-xl font-semibold text-slate-950">No articles found</h2>
              <p className="mt-2 text-sm text-slate-600">Try another search or choose a different topic.</p>
              <button type="button" onClick={() => { setSearch(''); updateFilters('', '') }}
                className="mt-5 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600">
                Show all articles
              </button>
            </div>}
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {matchingPosts.map((post, index) => (
                <article
                  key={post.slug}
                  className="group relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_70px_-34px_rgba(15,23,42,0.45)]"
                >
                  <Link href={post.url} className="absolute inset-0 z-10" aria-label={post.title} />

                  <div className="pointer-events-none relative aspect-[16/10] overflow-hidden bg-slate-100">
                    {post.coverImageUrl ? (
                      <img
                        src={post.coverImageUrl}
                        alt={post.coverImageAlt}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading={index === 0 ? 'eager' : 'lazy'}
                        fetchPriority={index === 0 ? 'high' : 'auto'}
                        decoding="async"
                        ref={(image) => {
                          // SSR images can fail before hydration attaches onError.
                          if (image?.complete && image.naturalWidth === 0) {
                            restoreOriginalCover(image, post.coverImageFallbackUrl)
                          }
                        }}
                        onError={(event) => restoreOriginalCover(event.currentTarget, post.coverImageFallbackUrl)}
                        srcSet={post.coverImageSources?.map(image => `${image.url} ${image.width}w`).join(', ') || undefined}
                        sizes="(min-width: 1280px) 400px, (min-width: 768px) 50vw, 100vw"
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
                        {post.viewCount ?? 0} all-time views
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
                    url={post.shareUrl}
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
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">Get new articles in your feed.</h2>
                  <p className="mt-3 max-w-3xl text-slate-600">
                    Follow the RSS feed to read new posts in your favorite reader.
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
