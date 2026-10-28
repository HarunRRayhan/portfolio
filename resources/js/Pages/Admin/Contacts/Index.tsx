import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Head, Link, router } from '@inertiajs/react'
import { useState } from 'react'
import { Inbox, Reply, Trash2 } from 'lucide-react'

interface Submission {
  id: number
  name: string
  email: string
  subject: string
  message: string
  referrer: string | null
  status: string
  created_at: string | null
}

interface Paginated<T> {
  data: T[]
  links: { url: string | null; label: string; active: boolean }[]
  last_page: number
  total: number
}

const statusLabel: Record<string, string> = { pending: 'mail failed', sent: 'new' }

const statusClass: Record<string, string> = {
  pending: 'bg-red-50 text-red-700 ring-red-200',
  sent: 'bg-amber-50 text-amber-700 ring-amber-200',
  replied: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  archived: 'bg-gray-50 text-gray-500 ring-gray-200',
  spam: 'bg-gray-50 text-gray-400 ring-gray-200',
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'unknown'
}

function Row({ submission, statuses }: { submission: Submission; statuses: string[] }) {
  const [open, setOpen] = useState(false)
  const setStatus = (status: string) =>
    router.patch(route('admin.contacts.update', submission.id), { status }, { preserveScroll: true })
  const remove = () => {
    if (confirm(`Delete the message from ${submission.name}?`)) {
      router.delete(route('admin.contacts.destroy', submission.id), { preserveScroll: true })
    }
  }
  const replyHref = `mailto:${encodeURIComponent(submission.email)}?subject=${encodeURIComponent('Re: ' + submission.subject)}`

  return (
    <li className="px-4 py-4 sm:px-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="min-w-0 flex-1 text-left">
          <p className="truncate text-sm font-semibold text-gray-900">{submission.subject}</p>
          <p className="truncate text-sm text-gray-500">
            {submission.name} &middot; {submission.email} &middot; {formatDate(submission.created_at)}
          </p>
          {!open && <p className="mt-1 line-clamp-1 text-sm text-gray-600">{submission.message}</p>}
        </button>
        <div className="flex items-center gap-2">
          <select
            value={submission.status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="Status"
            className={'rounded-full border-0 py-0.5 pl-2.5 pr-7 text-xs font-medium ring-1 ' + (statusClass[submission.status] ?? statusClass.archived)}
          >
            {statuses.map((s) => (
              <option key={s} value={s}>{statusLabel[s] ?? s}</option>
            ))}
          </select>
          <a
            href={replyHref}
            onClick={() => submission.status !== 'replied' && setStatus('replied')}
            title="Reply"
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <Reply className="h-4 w-4" />
          </a>
          <button type="button" onClick={remove} title="Delete" className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      {open && (
        <div className="mt-3 space-y-2">
          <p className="whitespace-pre-wrap rounded-md bg-gray-50 p-3 text-sm text-gray-800">{submission.message}</p>
          {submission.referrer && <p className="text-xs text-gray-400">Referrer: {submission.referrer}</p>}
        </div>
      )}
    </li>
  )
}

export default function Index({ submissions, statuses }: { submissions: Paginated<Submission>; statuses: string[] }) {
  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Contacts</h2>}>
      <Head title="Contact messages" />

      <div className="py-6 sm:py-12">
        <div className="mx-auto max-w-4xl space-y-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-5 py-4 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
              <Inbox className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-semibold tabular-nums text-gray-900">{submissions.total}</p>
              <p className="text-sm text-gray-500">{submissions.total === 1 ? 'message' : 'messages'}</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            {submissions.data.length === 0 ? (
              <p className="px-6 py-16 text-center text-sm text-gray-500">No messages yet.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {submissions.data.map((s) => (
                  <Row key={s.id} submission={s} statuses={statuses} />
                ))}
              </ul>
            )}
          </div>

          {submissions.last_page > 1 && (
            <nav className="flex flex-wrap items-center justify-center gap-1">
              {submissions.links.map((link, index) => {
                const label = link.label.replace('&laquo;', '«').replace('&raquo;', '»')
                return link.url ? (
                  <Link
                    key={index}
                    href={link.url}
                    preserveScroll
                    className={
                      'rounded-md px-3 py-1.5 text-sm font-medium transition ' +
                      (link.active ? 'bg-gray-900 text-white' : 'text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50')
                    }
                  >
                    {label}
                  </Link>
                ) : (
                  <span key={index} className="cursor-default rounded-md px-3 py-1.5 text-sm font-medium text-gray-300">
                    {label}
                  </span>
                )
              })}
            </nav>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
