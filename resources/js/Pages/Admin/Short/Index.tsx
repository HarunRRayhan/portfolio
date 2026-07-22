import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Head, Link, router } from '@inertiajs/react'
import { useState } from 'react'
import { BarChart3, Check, Copy, ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react'

interface ShortLinkRecord {
  id: number
  code: string
  destination_url: string
  title: string | null
  short_url: string
  is_active: boolean
  expires_at: string | null
  clicks_count: number
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <button
      type="button"
      onClick={copy}
      title={copied ? 'Copied' : 'Copy short URL'}
      className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
    >
      {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
    </button>
  )
}

export default function Index({ links }: { links: ShortLinkRecord[] }) {
  const toggleActive = (link: ShortLinkRecord) => {
    router.patch(`/admin/short/${link.id}/toggle`, {}, { preserveScroll: true })
  }

  const destroy = (link: ShortLinkRecord) => {
    if (!confirm(`Delete "${link.short_url}"? This cannot be undone.`)) return
    router.delete(`/admin/short/${link.id}`, { preserveScroll: true })
  }

  return (
    <AuthenticatedLayout
      header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Short Links</h2>}
    >
      <Head title="Short Links" />

      <div className="py-6 sm:py-12">
        <div className="mx-auto max-w-4xl space-y-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              Share the short link instead of the raw one to see who clicks it and where they come from.
            </p>
            <div className="flex shrink-0 items-center gap-2">
              <Link
                href="/admin/short/analytics"
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 ring-1 ring-gray-200 transition hover:bg-gray-50"
              >
                <BarChart3 className="h-4 w-4" />
                Analytics
              </Link>
              <Link
                href="/admin/short/create"
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4" />
                New short link
              </Link>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            {links.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <p className="text-sm text-gray-500">No short links yet.</p>
                <Link href="/admin/short/create" className="mt-2 inline-block text-sm font-medium text-indigo-600 hover:underline">
                  Create your first one
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {links.map((link) => (
                  <li key={link.id} className="flex items-center gap-3 px-3 py-3 hover:bg-gray-50 sm:px-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {link.short_url.replace(/^https?:\/\//, '')}
                        {link.title && <span className="ml-2 font-normal text-gray-400">{link.title}</span>}
                      </p>
                      <p className="truncate text-xs text-gray-400">{link.destination_url}</p>
                    </div>

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
                      title={link.is_active ? 'Active, click to disable' : 'Disabled, click to enable'}
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
                      <CopyButton text={link.short_url} />
                      <a
                        href={link.destination_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Open destination"
                        className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      <Link
                        href={`/admin/short/${link.id}/edit`}
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
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
