import { Head, Link } from '@inertiajs/react'
import { Footer } from '@/Components/Footer'
import { Menubar } from '@/Components/Menubar'
import { ErrorBoundary } from '@/Components/ErrorBoundary'
import { BlogDiscussion } from '@/Components/BlogDiscussion'
import { ArrowLeft, CalendarDays, Clock3, ExternalLink, MessageCircle, Tag } from 'lucide-react'

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
}

export default function BlogPostPage({ publication, post, relatedPosts, canonicalUrl, siteUrl }: BlogPostPageProps) {
  const description = post.brief
  const coverImageUrl = post.coverImageUrl
    ? post.coverImageUrl.startsWith('/')
      ? `${siteUrl}${post.coverImageUrl}`
      : post.coverImageUrl
    : null

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
    image: coverImageUrl ? [coverImageUrl] : undefined,
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
        {coverImageUrl ? <meta property="og:image" content={coverImageUrl} /> : null}
        <meta name="twitter:card" content={coverImageUrl ? 'summary_large_image' : 'summary'} />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={description} />
        {coverImageUrl ? <meta name="twitter:image" content={coverImageUrl} /> : null}
        <link rel="canonical" href={canonicalUrl} />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
        <Menubar />

        <main className="pt-24">
          <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-[#7C3AED] hover:text-[#7C3AED]"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to blog
              </Link>
            </div>

            <article className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
              {coverImageUrl ? (
                <div className="relative aspect-[21/9] overflow-hidden bg-slate-100">
                  <img src={coverImageUrl} alt={post.title} className="h-full w-full object-cover" />
                </div>
              ) : null}

              <div className="p-6 md:p-10 lg:p-12">
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                  <span className="inline-flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    {post.publishedAtHuman}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Clock3 className="h-4 w-4" />
                    {post.readTimeLabel}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    {post.responseCount + post.replyCount} comments
                  </span>
                </div>

                <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
                  {post.title}
                </h1>

                <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">{post.brief}</p>

                <div className="mt-6 flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span
                      key={tag.slug}
                      className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
                    >
                      <Tag className="h-3 w-3" />
                      {tag.name}
                    </span>
                  ))}
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  <a
                    href={post.sourceUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-2 rounded-full bg-[#7C3AED] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#6D28D9]"
                  >
                    Open archived discussion
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <Link
                    href="/blog"
                    className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-[#7C3AED] hover:text-[#7C3AED]"
                  >
                    More posts
                  </Link>
                </div>
              </div>

              <div
                className="blog-content border-t border-slate-200 px-6 py-8 text-[1.05rem] leading-8 text-slate-700 md:px-10 lg:px-12 [&_a]:text-[#7C3AED] [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-[#7C3AED] [&_blockquote]:pl-4 [&_blockquote]:italic [&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sm [&_h2]:mt-12 [&_h2]:mb-4 [&_h2]:text-3xl [&_h2]:font-semibold [&_h3]:mt-10 [&_h3]:mb-3 [&_h3]:text-2xl [&_h3]:font-semibold [&_img]:my-8 [&_img]:rounded-2xl [&_img]:shadow-sm [&_ol]:my-6 [&_ol]:list-decimal [&_ol]:space-y-3 [&_ol]:pl-6 [&_p]:my-5 [&_pre]:my-6 [&_pre]:overflow-x-auto [&_pre]:rounded-2xl [&_pre]:bg-slate-950 [&_pre]:p-5 [&_pre]:text-slate-100 [&_ul]:my-6 [&_ul]:list-disc [&_ul]:space-y-3 [&_ul]:pl-6"
                dangerouslySetInnerHTML={{ __html: post.contentHtml }}
              />
            </article>
          </section>

          <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#7C3AED]">Related posts</p>
              <div className="mt-6 grid gap-5 md:grid-cols-3">
                {relatedPosts.map((related) => (
                  <Link
                    key={related.slug}
                    href={related.url}
                    className="rounded-2xl border border-slate-200 p-5 transition-all hover:-translate-y-1 hover:border-[#7C3AED] hover:shadow-lg"
                  >
                    <p className="text-xs font-medium text-slate-500">{related.publishedAtHuman}</p>
                    <h2 className="mt-2 text-lg font-semibold text-slate-950">{related.title}</h2>
                    <p className="mt-3 line-clamp-4 text-sm leading-7 text-slate-600">{related.brief}</p>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-5xl px-4 pb-16 sm:px-6 lg:px-8">
            <BlogDiscussion title={post.title} canonicalUrl={canonicalUrl} sourceUrl={post.sourceUrl} />
          </section>
        </main>

        <Footer />
      </div>
    </ErrorBoundary>
  )
}
