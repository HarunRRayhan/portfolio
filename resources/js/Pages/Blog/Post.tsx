import { Head, Link } from '@inertiajs/react'
import { Footer } from '@/Components/Footer'
import { Menubar } from '@/Components/Menubar'
import { ErrorBoundary } from '@/Components/ErrorBoundary'
import { BlogDiscussion } from '@/Components/BlogDiscussion'
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  ChevronRight,
  Clock3,
  MessageCircle,
  Sparkles,
  Tag,
} from 'lucide-react'

interface BlogPostTag {
  name: string
  slug: string
}

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
  tags: BlogPostTag[]
  url: string
  canonicalUrl: string
  sourceUrl: string
}

interface BlogPost extends BlogPostSummary {
  contentHtml: string
  contentText: string
}

interface BlogCommentUser {
  id: number
  name: string
  email?: string | null
}

interface BlogCommentNode {
  id: number
  content: string
  createdAtIso: string
  createdAtHuman: string
  parentId: number | null
  user: BlogCommentUser | null
  children: BlogCommentNode[]
}

interface BlogPostPageProps {
  publication: {
    title: string
    url: string
    host: string
  }
  post: BlogPost
  relatedPosts: BlogPostSummary[]
  canonicalUrl: string
  siteUrl: string
  commentCount: number
  comments: BlogCommentNode[]
}

function buildRelatedTagList(posts: BlogPostSummary[]): string[] {
  const tags = new Set<string>()

  posts.forEach((post) => {
    post.tags.slice(0, 3).forEach((tag) => tags.add(tag.name))
  })

  return Array.from(tags).slice(0, 6)
}

export default function BlogPostPage({
  publication,
  post,
  relatedPosts,
  canonicalUrl,
  siteUrl,
  commentCount,
  comments,
}: BlogPostPageProps) {
  const description = post.brief
  const coverImageUrl = post.coverImageUrl ?? null
  const metaImageUrl = coverImageUrl
    ? coverImageUrl.startsWith('/')
      ? `${siteUrl}${coverImageUrl}`
      : coverImageUrl
    : null
  const relatedTags = buildRelatedTagList(relatedPosts.length > 0 ? relatedPosts : [post])

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description,
    datePublished: post.publishedAtIso,
    author: {
      '@type': 'Person',
      name: 'Harun R. Rayhan',
    },
    publisher: {
      '@type': 'Organization',
      name: publication.title,
      url: publication.url,
    },
    mainEntityOfPage: canonicalUrl,
    image: metaImageUrl ? [metaImageUrl] : undefined,
  }

  return (
    <ErrorBoundary>
      <Head>
        <title>{`${post.title} | Harun's Blog`}</title>
        <meta name="description" content={description} />
        <meta name="keywords" content={post.tags.map((tag) => tag.name).join(', ')} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonicalUrl} />
        {metaImageUrl ? <meta property="og:image" content={metaImageUrl} /> : null}
        <meta name="twitter:card" content={metaImageUrl ? 'summary_large_image' : 'summary'} />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={description} />
        {metaImageUrl ? <meta name="twitter:image" content={metaImageUrl} /> : null}
        <link rel="canonical" href={canonicalUrl} />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Head>

      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.09),_transparent_28%),linear-gradient(180deg,#faf8f6_0%,#ffffff_40%)] text-slate-950">
        <Menubar />

        <main className="pt-24">
          <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_30px_90px_-55px_rgba(15,23,42,0.45)]">
              <div className="grid lg:grid-cols-[minmax(0,1.15fr)_380px]">
                <div className="p-6 md:p-10 lg:p-12 xl:p-14">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-violet-700">
                    <span className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1.5 text-[0.72rem] tracking-[0.22em] text-violet-700">
                      <Sparkles className="h-3.5 w-3.5" />
                      Blog article
                    </span>
                    <span className="text-slate-400">/</span>
                    <Link href="/blog" className="transition-colors hover:text-slate-950">
                      Blog archive
                    </Link>
                  </div>

                  <h1 className="mt-6 max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                    {post.title}
                  </h1>

                  <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600 sm:text-xl sm:leading-9">
                    {post.brief}
                  </p>

                  <div className="mt-8 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 font-medium text-slate-700">
                      <CalendarDays className="h-4 w-4" />
                      {post.publishedAtHuman}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 font-medium text-slate-700">
                      <Clock3 className="h-4 w-4" />
                      {post.readTimeLabel}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 font-medium text-slate-700">
                      <MessageCircle className="h-4 w-4" />
                      {commentCount} comments
                    </span>
                  </div>

                  <div className="mt-8 flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <span
                        key={tag.slug}
                        className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700"
                      >
                        <Tag className="h-3 w-3" />
                        {tag.name}
                      </span>
                    ))}
                  </div>

                  <div className="mt-10 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">What to expect</p>
                      <p className="mt-3 text-sm leading-7 text-slate-700">
                        A practical, opinionated write-up with a production-first point of view.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Reading flow</p>
                      <p className="mt-3 text-sm leading-7 text-slate-700">
                        Strong headings, breathable spacing, and code blocks that are easier to scan.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Current post</p>
                      <p className="mt-3 text-sm leading-7 text-slate-700 line-clamp-3">{post.brief}</p>
                    </div>
                  </div>
                </div>

                <aside className="border-t border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,252,0.95),rgba(255,255,255,1))] p-6 sm:p-8 lg:border-l lg:border-t-0 lg:p-8">
                  {coverImageUrl ? (
                    <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-100 shadow-sm">
                      <img src={coverImageUrl} alt={post.title} className="h-64 w-full object-cover" />
                    </div>
                  ) : (
                    <div className="rounded-[1.75rem] border border-slate-200 bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.18),_transparent_48%),linear-gradient(180deg,#1f2937_0%,#0f172a_100%)] p-6 text-white shadow-sm">
                      <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white/90">
                        <BookOpen className="h-3.5 w-3.5" />
                        Reading mode
                      </p>
                      <div className="mt-6 space-y-3">
                        <p className="text-2xl font-semibold tracking-tight">{post.title}</p>
                        <p className="text-sm leading-7 text-white/75">
                          A cleaner editorial surface for a long-form technical article.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="mt-6 space-y-4">
                    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-700">At a glance</p>
                      <dl className="mt-4 space-y-3 text-sm">
                        <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3">
                          <dt className="text-slate-500">Published</dt>
                          <dd className="font-medium text-slate-950">{post.publishedAtHuman}</dd>
                        </div>
                        <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3">
                          <dt className="text-slate-500">Read time</dt>
                          <dd className="font-medium text-slate-950">{post.readTimeLabel}</dd>
                        </div>
                        <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3">
                          <dt className="text-slate-500">Comments</dt>
                          <dd className="font-medium text-slate-950">{commentCount}</dd>
                        </div>
                      </dl>
                    </div>

                    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-700">Related reading</p>
                      <div className="mt-4 space-y-3">
                        {relatedPosts.slice(0, 3).map((related) => (
                          <Link
                            key={related.slug}
                            href={related.url}
                            className="group block rounded-2xl border border-slate-200 p-4 transition-colors hover:border-violet-300 hover:bg-violet-50/60"
                          >
                            <p className="text-xs font-medium text-slate-500">{related.publishedAtHuman}</p>
                            <h2 className="mt-2 text-base font-semibold tracking-tight text-slate-950 transition-colors group-hover:text-violet-700">
                              {related.title}
                            </h2>
                            <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{related.brief}</p>
                            <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-violet-700">
                              Read more
                              <ArrowRight className="h-4 w-4" />
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-700">Topics</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {relatedTags.length > 0 ? (
                          relatedTags.map((tag) => (
                            <span key={tag} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
                            No related topics
                          </span>
                        )}
                      </div>
                    </div>

                    <Link
                      href="/blog"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back to archive
                    </Link>
                  </div>
                </aside>
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
              <article className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 bg-slate-50/80 px-6 py-5 md:px-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-700">Article</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Focused reading area with improved spacing, lighter code blocks, and less visual clutter.
                  </p>
                </div>

                <div className="px-6 py-8 md:px-8 lg:px-10">
                  <div className="mx-auto max-w-[70ch]">
                    <div
                      className="blog-content text-[1.05rem] leading-8 text-slate-700 [&_a]:font-medium [&_a]:text-violet-700 [&_a]:underline [&_a]:underline-offset-4 [&_blockquote]:my-8 [&_blockquote]:border-l-4 [&_blockquote]:border-violet-500 [&_blockquote]:bg-violet-50 [&_blockquote]:px-5 [&_blockquote]:py-4 [&_blockquote]:not-italic [&_blockquote]:text-slate-700 [&_blockquote]:rounded-r-2xl [&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.95em] [&_h2]:mt-14 [&_h2]:mb-4 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-slate-950 [&_h3]:mt-10 [&_h3]:mb-3 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:tracking-tight [&_h3]:text-slate-950 [&_img]:my-8 [&_img]:rounded-2xl [&_img]:border [&_img]:border-slate-200 [&_img]:shadow-sm [&_li]:my-2 [&_ol]:my-6 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6 [&_p]:my-5 [&_pre]:my-8 [&_pre]:overflow-x-auto [&_pre]:rounded-[1.5rem] [&_pre]:border [&_pre]:border-slate-200 [&_pre]:bg-[#f8fafc] [&_pre]:p-5 [&_pre]:text-slate-900 [&_pre]:shadow-[0_12px_35px_-22px_rgba(15,23,42,0.45)] [&_pre]:font-mono [&_pre]:text-[0.95rem] [&_pre]:leading-7 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-inherit [&_pre_code]:whitespace-pre-wrap [&_pre_code]:break-words [&_ul]:my-6 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6"
                      dangerouslySetInnerHTML={{ __html: post.contentHtml }}
                    />
                  </div>
                </div>
              </article>

              <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
                <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-700">Read next</p>
                  <div className="mt-4 space-y-3">
                    {relatedPosts.slice(0, 4).map((related) => (
                      <Link
                        key={related.slug}
                        href={related.url}
                        className="group flex items-start justify-between gap-4 rounded-2xl border border-slate-200 p-4 transition-colors hover:border-violet-300 hover:bg-violet-50/60"
                      >
                        <div>
                          <p className="text-xs font-medium text-slate-500">{related.publishedAtHuman}</p>
                          <h2 className="mt-2 text-sm font-semibold leading-6 text-slate-950 transition-colors group-hover:text-violet-700">
                            {related.title}
                          </h2>
                        </div>
                        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-400 transition-colors group-hover:text-violet-700" />
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-700">Navigation</p>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    Keep moving through the archive or jump back to the latest posts.
                  </p>
                  <div className="mt-4 space-y-3">
                    <Link
                      href="/blog"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-violet-300 hover:text-violet-700"
                    >
                      <BookOpen className="h-4 w-4" />
                      Blog archive
                    </Link>
                    <a
                      href="#discussion"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-700"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Jump to discussion
                    </a>
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-violet-950 p-5 text-white shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">Reading note</p>
                  <p className="mt-3 text-sm leading-7 text-white/80">
                    This layout prioritizes the article first, then surfaces related reading and discussion without crowding the page.
                  </p>
                  <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-white">
                    Keep reading
                    <ArrowUpRight className="h-4 w-4" />
                  </div>
                </div>
              </aside>
            </div>
          </section>

          <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
            <BlogDiscussion
              slug={post.slug}
              title={post.title}
              commentCount={commentCount}
              comments={comments}
            />
          </section>
        </main>

        <Footer />
      </div>
    </ErrorBoundary>
  )
}
