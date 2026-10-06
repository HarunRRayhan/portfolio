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

  if (posts.length === 0) {
    return null
  }

  return (
    <section className="border-t border-slate-200 bg-white py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-600">Writing</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">From the writing</h2>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
          Posts that sit next to this work.
        </p>
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <article
              key={post.url}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <Link href={post.url} className="block h-full">
                <h3 className="text-lg font-semibold tracking-tight text-slate-950">{post.title}</h3>
                <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-600">{post.brief}</p>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
