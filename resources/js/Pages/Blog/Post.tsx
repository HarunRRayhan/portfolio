'use client'

import { Head, Link } from '@inertiajs/react'
import { useEffect, useMemo, useRef } from 'react'
import hljs from 'highlight.js/lib/common'
import 'highlight.js/styles/github-dark.css'
import { Footer } from '@/Components/Footer'
import { Menubar } from '@/Components/Menubar'
import { ErrorBoundary } from '@/Components/ErrorBoundary'
import { BlogDiscussion } from '@/Components/BlogDiscussion'
import { ArrowRight, BookOpen, CalendarDays, Clock3, MessageCircle, Sparkles, Tag } from 'lucide-react'

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

function getCodeLanguage(code: HTMLElement): string {
  const className = code.className || ''
  const match = className.match(/language-([a-z0-9-]+)/i) ?? className.match(/lang-([a-z0-9-]+)/i)

  if (!match?.[1]) {
    return 'code'
  }

  return match[1].replace(/-/g, ' ')
}

function enhanceCodeBlocks(root: HTMLElement) {
  const blocks = Array.from(root.querySelectorAll('pre'))

  blocks.forEach((pre) => {
    if (pre.dataset.enhanced === 'true') {
      return
    }

    const code = pre.querySelector('code')
    if (!(code instanceof HTMLElement)) {
      return
    }

    pre.dataset.enhanced = 'true'
    pre.classList.add('m-0', 'overflow-x-auto', 'bg-transparent', 'p-0')
    code.classList.add('bg-transparent', 'p-0')

    try {
      hljs.highlightElement(code)
    } catch (error) {
      console.warn('Code highlighting failed:', error)
    }

    const wrapper = document.createElement('div')
    wrapper.className =
      'group relative my-8 overflow-hidden rounded-[1.5rem] border border-slate-700 bg-slate-950 shadow-[0_24px_70px_-34px_rgba(15,23,42,0.75)]'

    const toolbar = document.createElement('div')
    toolbar.className = 'flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3'

    const languageBadge = document.createElement('span')
    languageBadge.className =
      'inline-flex items-center rounded-full bg-white/5 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-slate-200'
    languageBadge.textContent = getCodeLanguage(code)

    const copyButton = document.createElement('button')
    copyButton.type = 'button'
    copyButton.className =
      'inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/15'
    copyButton.textContent = 'Copy'

    const resetLabel = copyButton.textContent ?? 'Copy'
    copyButton.addEventListener('click', async () => {
      const sourceText = code.innerText || pre.innerText

      try {
        await navigator.clipboard.writeText(sourceText)
        copyButton.textContent = 'Copied'
        copyButton.disabled = true
        window.setTimeout(() => {
          copyButton.textContent = resetLabel
          copyButton.disabled = false
        }, 1400)
      } catch (error) {
        console.warn('Unable to copy code block:', error)
        copyButton.textContent = 'Copy failed'
        window.setTimeout(() => {
          copyButton.textContent = resetLabel
        }, 1400)
      }
    })

    toolbar.append(languageBadge, copyButton)

    if (pre.parentNode) {
      pre.parentNode.insertBefore(wrapper, pre)
      wrapper.append(toolbar, pre)
    }
  })
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
  const contentRef = useRef<HTMLDivElement | null>(null)
  const coverImageUrl = post.coverImageUrl ?? null
  const metaImageUrl = coverImageUrl
    ? coverImageUrl.startsWith('/')
      ? `${siteUrl}${coverImageUrl}`
      : coverImageUrl
    : null
  const relatedTags = buildRelatedTagList(relatedPosts.length > 0 ? relatedPosts : [post])
  const relatedRailPosts = relatedPosts.length > 1 ? [...relatedPosts, ...relatedPosts] : relatedPosts

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

  useEffect(() => {
    if (!contentRef.current) {
      return
    }

    enhanceCodeBlocks(contentRef.current)
  }, [post.slug, post.contentHtml])

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

      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.08),_transparent_28%),linear-gradient(180deg,#fafafa_0%,#ffffff_42%)] text-slate-950">
        <Menubar />

        <main className="pt-24">
          <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <article className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_30px_90px_-55px_rgba(15,23,42,0.45)]">
              {coverImageUrl ? (
                <div className="overflow-hidden border-b border-slate-200 bg-slate-100">
                  <img src={coverImageUrl} alt={post.title} className="h-[clamp(16rem,42vw,30rem)] w-full object-cover" />
                </div>
              ) : (
                <div className="border-b border-slate-200 bg-[linear-gradient(180deg,#0f172a_0%,#111827_100%)] px-6 py-14 text-white sm:px-10 sm:py-16 lg:px-14 lg:py-20">
                  <div className="max-w-3xl space-y-5">
                    <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white/90">
                      <BookOpen className="h-3.5 w-3.5" />
                      Reading mode
                    </p>
                    <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">{post.title}</h1>
                    <p className="max-w-2xl text-lg leading-8 text-white/75 sm:text-xl sm:leading-9">{post.brief}</p>
                  </div>
                </div>
              )}

              <div className="px-6 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1.5 text-[0.72rem] tracking-[0.22em] text-white">
                    <Sparkles className="h-3.5 w-3.5" />
                    Blog article
                  </span>
                  <span className="text-slate-400">/</span>
                  <Link href="/blog" className="transition-colors hover:text-slate-950">
                    Blog archive
                  </Link>
                </div>

                <h1 className="mt-6 max-w-5xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                  {post.title}
                </h1>

                <p className="mt-5 max-w-4xl text-lg leading-8 text-slate-600 sm:text-xl sm:leading-9">{post.brief}</p>

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

              </div>
            </article>
          </section>

          <section id="article" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <article className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 bg-slate-50/80 px-6 py-5 md:px-8">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Article</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Clean reading surface, wider measure, lighter code blocks, and no sidebar clutter.
                </p>
              </div>

              <div className="px-6 py-8 md:px-8 lg:px-10">
                <div ref={contentRef} className="mx-auto max-w-[78ch]">
                  <div
                    className="blog-content text-[1.05rem] leading-8 text-slate-700 [&_a]:font-medium [&_a]:text-slate-900 [&_a]:underline [&_a]:underline-offset-4 [&_blockquote]:my-8 [&_blockquote]:rounded-r-2xl [&_blockquote]:border-l-4 [&_blockquote]:border-slate-300 [&_blockquote]:bg-slate-50 [&_blockquote]:px-5 [&_blockquote]:py-4 [&_blockquote]:not-italic [&_blockquote]:text-slate-700 [&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.95em] [&_h2]:mt-14 [&_h2]:mb-4 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-slate-950 [&_h3]:mt-10 [&_h3]:mb-3 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:tracking-tight [&_h3]:text-slate-950 [&_img]:my-8 [&_img]:rounded-2xl [&_img]:border [&_img]:border-slate-200 [&_img]:shadow-sm [&_li]:my-2 [&_ol]:my-6 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6 [&_p]:my-5 [&_pre]:my-0 [&_pre]:overflow-x-auto [&_pre]:bg-transparent [&_pre]:p-4 [&_pre]:text-slate-100 [&_pre]:font-mono [&_pre]:text-[0.95rem] [&_pre]:leading-7 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-inherit [&_pre_code]:whitespace-pre-wrap [&_pre_code]:break-words [&_ul]:my-6 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6"
                    dangerouslySetInnerHTML={{ __html: post.contentHtml }}
                  />
                </div>
              </div>
            </article>
          </section>

          {relatedPosts.length > 0 ? (
            <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Related reading</p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                      More posts, sliding underneath the article
                    </h2>
                  </div>
                  <p className="max-w-2xl text-sm leading-7 text-slate-500">
                    Kept below the post instead of in a sidebar, with a slow continuous motion for a cleaner editorial feel.
                  </p>
                </div>

                <div className="mt-6 overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-50/60 p-4">
                  <div className="related-marquee-track flex w-max gap-4 pr-4">
                    {relatedRailPosts.map((related, index) => (
                      <article
                        key={`${related.slug}-${index}`}
                        className="group w-[min(80vw,21rem)] shrink-0 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_24px_70px_-34px_rgba(15,23,42,0.35)]"
                      >
                        <Link href={related.url} className="block h-full">
                          <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                            {related.coverImageUrl ? (
                              <img
                                src={related.coverImageUrl}
                                alt={related.title}
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                loading="lazy"
                              />
                            ) : (
                              <div className="flex h-full items-end bg-[linear-gradient(135deg,#0f172a_0%,#1f2937_100%)] p-5 text-white">
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">Article</p>
                                  <p className="mt-2 text-xl font-semibold tracking-tight">{related.title}</p>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="p-5">
                            <p className="text-xs font-medium text-slate-500">{related.publishedAtHuman}</p>
                            <h3 className="mt-2 text-lg font-semibold tracking-tight text-slate-950 transition-colors group-hover:text-slate-700">
                              {related.title}
                            </h3>
                            <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-600">{related.brief}</p>

                            <div className="mt-4 flex flex-wrap gap-2">
                              {related.tags.slice(0, 3).map((tag) => (
                                <span key={tag.slug} className="rounded-full bg-slate-100 px-2.5 py-1 text-[0.72rem] font-medium text-slate-600">
                                  {tag.name}
                                </span>
                              ))}
                            </div>

                            <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                              Read more
                              <ArrowRight className="h-4 w-4" />
                            </div>
                          </div>
                        </Link>
                      </article>
                    ))}
                  </div>
                </div>
              </div>

              <style>{`
                @keyframes related-marquee {
                  0% {
                    transform: translateX(0);
                  }
                  100% {
                    transform: translateX(-50%);
                  }
                }

                .related-marquee-track {
                  animation: related-marquee 44s linear infinite;
                }

                .related-marquee-track:hover {
                  animation-play-state: paused;
                }
              `}</style>
            </section>
          ) : null}

          <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <ErrorBoundary>
              <BlogDiscussion slug={post.slug} title={post.title} commentCount={commentCount} comments={comments} />
            </ErrorBoundary>
          </section>
        </main>

        <Footer />
      </div>
    </ErrorBoundary>
  )
}
