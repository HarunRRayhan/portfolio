import { useEffect, useRef } from 'react'

interface BlogDiscussionProps {
  title: string
  sourceUrl: string
  canonicalUrl: string
}

export function BlogDiscussion({ title, sourceUrl, canonicalUrl }: BlogDiscussionProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const repo = import.meta.env.VITE_GISCUS_REPO
    const repoId = import.meta.env.VITE_GISCUS_REPO_ID
    const category = import.meta.env.VITE_GISCUS_CATEGORY
    const categoryId = import.meta.env.VITE_GISCUS_CATEGORY_ID

    if (!repo || !repoId || !category || !categoryId || !containerRef.current) {
      return
    }

    containerRef.current.innerHTML = ''

    const script = document.createElement('script')
    script.src = 'https://giscus.app/client.js'
    script.setAttribute('data-repo', repo)
    script.setAttribute('data-repo-id', repoId)
    script.setAttribute('data-category', category)
    script.setAttribute('data-category-id', categoryId)
    script.setAttribute('data-mapping', 'pathname')
    script.setAttribute('data-strict', '0')
    script.setAttribute('data-reactions-enabled', '1')
    script.setAttribute('data-emit-metadata', '0')
    script.setAttribute('data-input-position', 'bottom')
    script.setAttribute('data-theme', 'preferred_color_scheme')
    script.setAttribute('data-lang', 'en')
    script.setAttribute('data-loading', 'lazy')
    script.crossOrigin = 'anonymous'
    script.async = true

    containerRef.current.appendChild(script)
  }, [])

  return (
    <section className="mt-16 rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-sm backdrop-blur-sm">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#7C3AED]">Comments</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Continue the discussion</h2>
          <p className="mt-2 max-w-2xl text-slate-600">
            Commenting stays scoped to the blog. If the Giscus configuration is present, comments appear here.
            Otherwise, use the original discussion link until the on-site comments are enabled.
          </p>
        </div>
        <a
          href={sourceUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-[#7C3AED] hover:text-[#7C3AED]"
        >
          Open archived discussion
        </a>
      </div>

      <div ref={containerRef} className="min-h-[120px]" />

      {!import.meta.env.VITE_GISCUS_REPO ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
          <p className="font-medium text-slate-800">Giscus is not configured yet.</p>
          <p className="mt-2">
            New blog comments can be enabled by setting the Giscus environment variables. Until then, readers can
            follow the archived thread for discussion.
          </p>
          <p className="mt-2 text-xs text-slate-500">Article: {title}</p>
          <p className="mt-1 text-xs text-slate-500">Canonical: {canonicalUrl}</p>
        </div>
      ) : null}
    </section>
  )
}
