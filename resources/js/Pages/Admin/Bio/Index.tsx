import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Head, Link, router } from '@inertiajs/react'
import { useEffect, useState } from 'react'
import { BarChart3, ExternalLink, GripVertical, Pencil, Plus, Trash2 } from 'lucide-react'
import { bioIcon } from '@/lib/bioIcons'

interface BioLinkRecord {
  id: number
  label: string
  url: string
  icon: string
  tab: string | null
  priority: number
  expires_at: string | null
  is_active: boolean
  clicks_count: number
}

export default function Index({ links }: { links: BioLinkRecord[] }) {
  const [items, setItems] = useState<BioLinkRecord[]>(links)
  const [dragId, setDragId] = useState<number | null>(null)

  // Keep local order in sync when the server sends a fresh list (after any mutation).
  useEffect(() => setItems(links), [links])

  const persistOrder = (ordered: BioLinkRecord[]) => {
    router.post(
      '/admin/bio/reorder',
      { ids: ordered.map((l) => l.id) },
      { preserveScroll: true, preserveState: true },
    )
  }

  const handleDrop = (targetId: number) => {
    if (dragId === null || dragId === targetId) return
    const from = items.findIndex((l) => l.id === dragId)
    const to = items.findIndex((l) => l.id === targetId)
    if (from === -1 || to === -1) return

    const next = [...items]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    setItems(next)
    setDragId(null)
    persistOrder(next)
  }

  const toggleActive = (link: BioLinkRecord) => {
    router.patch(`/admin/bio/${link.id}/toggle`, {}, { preserveScroll: true })
  }

  const destroy = (link: BioLinkRecord) => {
    if (!confirm(`Delete "${link.label}"? This cannot be undone.`)) return
    router.delete(`/admin/bio/${link.id}`, { preserveScroll: true })
  }

  return (
    <AuthenticatedLayout
      header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Bio Links</h2>}
    >
      <Head title="Bio Links" />

      <div className="py-6 sm:py-12">
        <div className="mx-auto max-w-4xl space-y-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              Drag rows to reorder. Changes are saved automatically.{' '}
              <a href="/bio" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                View public page ↗
              </a>
            </p>
            <div className="flex shrink-0 items-center gap-2">
              <Link
                href="/admin/bio/analytics"
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 ring-1 ring-gray-200 transition hover:bg-gray-50"
              >
                <BarChart3 className="h-4 w-4" />
                Analytics
              </Link>
              <Link
                href="/admin/bio/create"
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4" />
                Add link
              </Link>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            {items.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <p className="text-sm text-gray-500">No bio links yet.</p>
                <Link href="/admin/bio/create" className="mt-2 inline-block text-sm font-medium text-indigo-600 hover:underline">
                  Create your first one
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {items.map((link) => {
                  const Icon = bioIcon(link.icon)
                  return (
                    <li
                      key={link.id}
                      draggable
                      onDragStart={() => setDragId(link.id)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleDrop(link.id)}
                      className={
                        'flex items-center gap-3 px-3 py-3 sm:px-4 ' +
                        (dragId === link.id ? 'opacity-50' : 'hover:bg-gray-50')
                      }
                    >
                      <span className="cursor-grab text-gray-300 active:cursor-grabbing" title="Drag to reorder">
                        <GripVertical className="h-5 w-5" />
                      </span>

                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                        <Icon className="h-4 w-4" />
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">{link.label}</p>
                        <p className="truncate text-xs text-gray-400">{link.url}</p>
                      </div>

                      {link.tab && link.tab !== 'default' && (
                        <span className="hidden shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 sm:inline">
                          {link.tab}
                        </span>
                      )}

                      <span
                        className="hidden shrink-0 text-xs tabular-nums text-gray-400 sm:inline"
                        title="Total clicks"
                      >
                        {link.clicks_count}
                      </span>

                      <button
                        type="button"
                        onClick={() => toggleActive(link)}
                        role="switch"
                        aria-checked={link.is_active}
                        title={link.is_active ? 'Active — click to hide' : 'Hidden — click to show'}
                        className={
                          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ' +
                          (link.is_active ? 'bg-emerald-500' : 'bg-gray-300')
                        }
                      >
                        <span
                          className={
                            'inline-block h-5 w-5 transform rounded-full bg-white shadow transition ' +
                            (link.is_active ? 'translate-x-5' : 'translate-x-0.5')
                          }
                        />
                      </button>

                      <div className="flex shrink-0 items-center gap-1">
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open link"
                          className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                        <Link
                          href={`/admin/bio/${link.id}/edit`}
                          title="Edit"
                          className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => destroy(link)}
                          title="Delete"
                          className="rounded-md p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
