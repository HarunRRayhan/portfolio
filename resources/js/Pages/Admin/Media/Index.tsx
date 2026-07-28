import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Head, Link, router } from '@inertiajs/react'
import { useEffect, useState } from 'react'
import { ChevronDown, ChevronUp, Copy, ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react'

interface MediaItemRecord {
  id: number
  type: 'slide' | 'video'
  title: string
  slug: string
  summary: string | null
  url: string
  share_url: string
  thumbnail_url: string | null
  source_label: string | null
  published_at: string | null
  is_active: boolean
  priority: number
  short_link_code: string | null
}

function formatPublished(value: string | null): string {
  if (!value) return 'Not scheduled'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not scheduled'
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function Index({
  items,
  filterType,
}: {
  items: MediaItemRecord[]
  filterType: 'slide' | 'video' | null
}) {
  const [slides, setSlides] = useState<MediaItemRecord[]>(items.filter((i) => i.type === 'slide'))
  const [videos, setVideos] = useState<MediaItemRecord[]>(items.filter((i) => i.type === 'video'))
  const [copiedId, setCopiedId] = useState<number | null>(null)

  // Keep local order in sync when the server sends a fresh list (after any mutation).
  useEffect(() => {
    setSlides(items.filter((i) => i.type === 'slide'))
    setVideos(items.filter((i) => i.type === 'video'))
  }, [items])

  const persistOrder = (ordered: MediaItemRecord[]) => {
    router.post(
      '/admin/media/reorder',
      { ids: ordered.map((i) => i.id) },
      { preserveScroll: true, preserveState: true },
    )
  }

  const move = (
    list: MediaItemRecord[],
    setList: (next: MediaItemRecord[]) => void,
    index: number,
    direction: -1 | 1,
  ) => {
    const target = index + direction
    if (target < 0 || target >= list.length) return
    const next = [...list]
    const [moved] = next.splice(index, 1)
    next.splice(target, 0, moved)
    setList(next)
    persistOrder(next)
  }

  const toggleActive = (item: MediaItemRecord) => {
    router.patch(`/admin/media/${item.id}/toggle`, {}, { preserveScroll: true })
  }

  const destroy = (item: MediaItemRecord) => {
    if (!confirm(`Delete "${item.title}"? This can't be undone.`)) return
    router.delete(`/admin/media/${item.id}`, { preserveScroll: true })
  }

  const copyLink = async (item: MediaItemRecord) => {
    try {
      await navigator.clipboard.writeText(item.share_url)
      setCopiedId(item.id)
      setTimeout(() => setCopiedId((id) => (id === item.id ? null : id)), 1500)
    } catch {
      // Clipboard access can be blocked; the link below still opens fine either way.
    }
  }

  const renderGroup = (
    label: string,
    list: MediaItemRecord[],
    setList: (next: MediaItemRecord[]) => void,
  ) => (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-700">{label}</h3>
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        {list.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm text-gray-500">No {label.toLowerCase()} yet.</p>
            <Link href="/admin/media/create" className="mt-2 inline-block text-sm font-medium text-indigo-600 hover:underline">
              Add one
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {list.map((item, index) => (
              <li key={item.id} className="flex items-center gap-3 px-3 py-3 sm:px-4 hover:bg-gray-50">
                <div className="flex shrink-0 flex-col items-center gap-0.5 text-gray-300">
                  <button
                    type="button"
                    onClick={() => move(list, setList, index, -1)}
                    disabled={index === 0}
                    title="Move up"
                    className="rounded p-0.5 hover:bg-gray-100 hover:text-gray-600 disabled:pointer-events-none disabled:opacity-30"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(list, setList, index, 1)}
                    disabled={index === list.length - 1}
                    title="Move down"
                    className="rounded p-0.5 hover:bg-gray-100 hover:text-gray-600 disabled:pointer-events-none disabled:opacity-30"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>

                {item.thumbnail_url ? (
                  <img
                    src={item.thumbnail_url}
                    alt=""
                    className="h-10 w-10 shrink-0 rounded-lg border border-gray-200 object-cover"
                  />
                ) : (
                  <span className="h-10 w-10 shrink-0 rounded-lg border border-gray-200 bg-gray-50" />
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">{item.title}</p>
                  <p className="truncate text-xs text-gray-400">
                    {item.source_label ?? 'No source'} · {formatPublished(item.published_at)}
                  </p>
                </div>

                <div className="hidden shrink-0 items-center gap-1 sm:flex">
                  <a
                    href={item.share_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={item.short_link_code ? `Short link: ${item.short_link_code}` : 'Open share link'}
                    className="max-w-[10rem] truncate text-xs text-indigo-600 hover:underline"
                  >
                    {item.share_url}
                  </a>
                  <button
                    type="button"
                    onClick={() => copyLink(item)}
                    title="Copy link"
                    className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  {copiedId === item.id && <span className="text-xs text-emerald-600">Copied</span>}
                </div>

                <button
                  type="button"
                  onClick={() => toggleActive(item)}
                  role="switch"
                  aria-checked={item.is_active}
                  title={item.is_active ? 'Active, click to hide' : 'Hidden, click to show'}
                  className={
                    'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ' +
                    (item.is_active ? 'bg-emerald-500' : 'bg-gray-300')
                  }
                >
                  <span
                    className={
                      'inline-block h-5 w-5 transform rounded-full bg-white shadow transition ' +
                      (item.is_active ? 'translate-x-5' : 'translate-x-0.5')
                    }
                  />
                </button>

                <div className="flex shrink-0 items-center gap-1">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Open source"
                    className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <Link
                    href={`/admin/media/${item.id}/edit`}
                    title="Edit"
                    className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => destroy(item)}
                    title="Delete"
                    className="rounded-md p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )

  const filterTabs: { label: string; href: string; value: 'slide' | 'video' | null }[] = [
    { label: 'All', href: '/admin/media', value: null },
    { label: 'Slides', href: '/admin/media?type=slide', value: 'slide' },
    { label: 'Videos', href: '/admin/media?type=video', value: 'video' },
  ]

  return (
    <AuthenticatedLayout
      header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Slides &amp; Videos</h2>}
    >
      <Head title="Slides & Videos" />

      <div className="py-6 sm:py-12">
        <div className="mx-auto max-w-4xl space-y-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              Use the arrows to reorder. Slides and videos sort independently.
            </p>
            <Link
              href="/admin/media/create"
              className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              New slide or video
            </Link>
          </div>

          <div className="flex gap-2">
            {filterTabs.map((tab) => (
              <Link
                key={tab.label}
                href={tab.href}
                className={
                  'rounded-lg px-3 py-1.5 text-sm font-medium transition ' +
                  (filterType === tab.value
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700')
                }
              >
                {tab.label}
              </Link>
            ))}
          </div>

          {filterType !== 'video' && renderGroup('Slides', slides, setSlides)}
          {filterType !== 'slide' && renderGroup('Videos', videos, setVideos)}
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
