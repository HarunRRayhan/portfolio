import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Head, Link } from '@inertiajs/react'
import { useState } from 'react'
import axios from 'axios'
import { Eye, EyeOff, Mail } from 'lucide-react'

interface SubscriberRow {
  id: number
  masked_email: string
  source: string | null
  status: string
  created_at: string | null
}

interface PaginationLink {
  url: string | null
  label: string
  active: boolean
}

interface Paginated<T> {
  data: T[]
  links: PaginationLink[]
  current_page: number
  last_page: number
}

function formatDate(value: string | null) {
  if (!value) return 'unknown'
  return new Date(value).toLocaleDateString(undefined, { dateStyle: 'medium' })
}

function EmailCell({ subscriber }: { subscriber: SubscriberRow }) {
  const [revealedEmail, setRevealedEmail] = useState<string | null>(null)
  const [revealing, setRevealing] = useState(false)

  const toggle = async () => {
    if (revealedEmail) {
      setRevealedEmail(null)
      return
    }

    setRevealing(true)
    try {
      const { data } = await axios.get<{ email: string }>(route('admin.newsletter.reveal', subscriber.id))
      setRevealedEmail(data.email)
    } finally {
      setRevealing(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-sm text-gray-800">
        {revealedEmail ?? subscriber.masked_email}
      </span>
      <button
        type="button"
        onClick={toggle}
        disabled={revealing}
        title={revealedEmail ? 'Hide email' : 'Show email'}
        className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
      >
        {revealedEmail ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}

export default function Index({ subscribers, total }: { subscribers: Paginated<SubscriberRow>; total: number }) {
  return (
    <AuthenticatedLayout
      header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Newsletter</h2>}
    >
      <Head title="Newsletter" />

      <div className="py-6 sm:py-12">
        <div className="mx-auto max-w-4xl space-y-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-5 py-4 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-semibold tabular-nums text-gray-900">{total}</p>
              <p className="text-sm text-gray-500">{total === 1 ? 'subscriber' : 'subscribers'}</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            {subscribers.data.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <p className="text-sm text-gray-500">No subscribers yet.</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-100">
                <thead>
                  <tr className="text-left text-xs font-medium uppercase tracking-wide text-gray-400">
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Source</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Subscribed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {subscribers.data.map((subscriber) => (
                    <tr key={subscriber.id} className="text-sm text-gray-700">
                      <td className="px-4 py-3">
                        <EmailCell subscriber={subscriber} />
                      </td>
                      <td className="px-4 py-3 text-gray-500">{subscriber.source ?? 'unknown'}</td>
                      <td className="px-4 py-3 text-gray-500">{subscriber.status}</td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(subscriber.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {subscribers.last_page > 1 && (
            <nav className="flex flex-wrap items-center justify-center gap-1">
              {subscribers.links.map((link, index) => {
                const label = link.label.replace('&laquo;', '«').replace('&raquo;', '»')

                if (!link.url) {
                  return (
                    <span
                      key={index}
                      className="cursor-default rounded-md px-3 py-1.5 text-sm font-medium text-gray-300"
                    >
                      {label}
                    </span>
                  )
                }

                return (
                  <Link
                    key={index}
                    href={link.url}
                    preserveScroll
                    className={
                      'rounded-md px-3 py-1.5 text-sm font-medium transition ' +
                      (link.active
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50')
                    }
                  >
                    {label}
                  </Link>
                )
              })}
            </nav>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
