import { Link, usePage } from '@inertiajs/react'

type ReadingPost = {
  title: string
  url: string
  brief: string
}

export function ServicePageReading() {
  const { url, props } = usePage()
  const pathname = url.split('?')[0]

  if (!pathname.startsWith('/services/')) {
    return null
  }

  const posts = (props as { serviceReading?: ReadingPost[] }).serviceReading ?? []
  const related = (props as { relatedServices?: { title: string; url: string }[] }).relatedServices ?? []

  if (posts.length === 0 && related.length === 0) {
    return null
  }

  return (
    <section className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-600 dark:text-slate-300">Writing</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">From the writing</h2>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
          Posts that sit next to this work.
        </p>
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <article
              key={post.url}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <Link href={post.url} className="block h-full">
                <h3 className="text-lg font-semibold tracking-tight text-slate-950 dark:text-white">{post.title}</h3>
                <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{post.brief}</p>
              </Link>
            </article>
          ))}
        </div>
        {related.length > 0 && (
          <p className="mt-10 text-sm text-slate-600 dark:text-slate-300">
            Related services:{' '}
            {related.map((service, index) => (
              <span key={service.url}>
                {index > 0 && ' · '}
                <Link href={service.url} className="font-medium text-slate-900 dark:text-white underline decoration-slate-300 underline-offset-4 hover:decoration-slate-900">
                  {service.title}
                </Link>
              </span>
            ))}
          </p>
        )}
      </div>
    </section>
  )
}
