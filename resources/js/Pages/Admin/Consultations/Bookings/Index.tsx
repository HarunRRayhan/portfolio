import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Head, Link, router } from '@inertiajs/react'
import { FormEvent, useEffect, useState } from 'react'

type BookingRow = {
  id: number
  public_id: string
  status: string
  client_name: string
  client_email: string
  company_name: string | null
  starts_at: string
  amount_due_cents: number
  tier: { name: string; slug: string } | null
  created_at: string
}

type PaginatedBookings = {
  data: BookingRow[]
  total: number
  from: number | null
  to: number | null
  current_page: number
  last_page: number
  prev_page_url: string | null
  next_page_url: string | null
}

function formatLocal(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso))
}

export default function Index({
  bookings,
  filterStatus,
  searchQuery,
  googleConnected,
}: {
  bookings: PaginatedBookings
  filterStatus: string
  searchQuery: string
  googleConnected: boolean
}) {
  const [query, setQuery] = useState(searchQuery)
  const [searching, setSearching] = useState(false)
  useEffect(() => setQuery(searchQuery), [searchQuery])

  const search = (event: FormEvent) => {
    event.preventDefault()
    if (searching) return
    router.get('/admin/consultations/bookings', { q: query.trim(), status: filterStatus }, {
      preserveState: true,
      onStart: () => setSearching(true),
      onFinish: () => setSearching(false),
    })
  }

  const statusUrl = (status: string) => {
    const parameters = new URLSearchParams()
    if (status) parameters.set('status', status)
    if (searchQuery) parameters.set('q', searchQuery)
    return `/admin/consultations/bookings${parameters.size ? `?${parameters}` : ''}`
  }

  const statuses = [
    '',
    'pending_approval',
    'awaiting_payment',
    'confirmed',
    'reschedule_proposed',
    'paid_reschedule_pending_approval',
    'cancel_requested',
    'reschedule_requested',
    'declined',
    'expired',
    'cancelled',
  ]

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-800">Consultations</h2>}>
      <Head title="Consultations" />

      <div className="py-6 sm:py-12">
        <div className="mx-auto max-w-5xl space-y-4 px-4 sm:px-6 lg:px-8">
          {!googleConnected && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Google Calendar is not connected.{' '}
              <Link href="/admin/consultations/availability" className="underline">
                Connect it under Availability
              </Link>
              .
            </div>
          )}

          <form onSubmit={search} role="search" aria-label="Find bookings" className="space-y-2">
            <label htmlFor="booking-search" className="block text-sm font-medium text-gray-700">Search bookings</label>
            <div className="flex gap-2">
              <input id="booking-search" type="search" value={query} maxLength={200}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Name, email, company, or booking ID"
                className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm" />
              <button type="submit" disabled={searching} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
                {searching ? 'Searching…' : 'Search'}
              </button>
            </div>
          </form>

          <div className="flex flex-wrap items-center gap-2">
            {statuses.map((s) => (
              <Link
                key={s || 'all'}
                href={statusUrl(s)}
                aria-current={filterStatus === s ? 'page' : undefined}
                className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                  filterStatus === s ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'
                }`}
              >
                {s || 'all'}
              </Link>
            ))}
            <Link
              href="/admin/consultations/availability"
              className="ml-auto text-sm text-indigo-600 hover:underline"
            >
              Availability
            </Link>
            <Link href="/admin/consultations/coupons" className="text-sm text-indigo-600 hover:underline">
              Coupons
            </Link>
          </div>

          <p className="text-sm text-gray-600" role="status">
            {bookings.data.length ? `Showing ${bookings.from}–${bookings.to} of ${bookings.total} bookings` : `${bookings.total} bookings`}
          </p>
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            {bookings.data.length === 0 ? (
              <div className="px-6 py-16 text-center text-sm text-gray-500">
                <p>{bookings.total > 0 ? 'No bookings on this page.' : searchQuery || filterStatus ? 'No bookings match these filters.' : 'No bookings yet.'}</p>
                {bookings.total > 0 && <Link href={statusUrl(filterStatus)} className="mt-3 inline-block text-indigo-600 underline">Back to first page</Link>}
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {bookings.data.map((b) => (
                  <li key={b.id}>
                    <Link
                      href={`/admin/consultations/bookings/${b.id}`}
                      className="flex flex-col gap-1 px-5 py-4 hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {b.client_name}{' '}
                          <span className="font-normal text-gray-500">· {b.tier?.name}</span>
                        </p>
                        {b.company_name && <p className="text-sm text-gray-500">{b.company_name}</p>}
                        <p className="text-sm text-gray-500">
                          {formatLocal(b.starts_at)} · {b.status}
                          <span className="block text-xs">{b.public_id}</span>
                        </p>
                      </div>
                      <p className="text-sm font-medium text-gray-700">
                        ${(b.amount_due_cents / 100).toFixed(2)}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {bookings.last_page > 1 && (
            <nav aria-label="Booking pagination" className="flex items-center justify-between gap-3 text-sm">
              {bookings.prev_page_url ? <Link href={bookings.prev_page_url} className="rounded-md border border-gray-300 px-3 py-2">Previous page</Link>
                : <span aria-disabled="true" className="px-3 py-2 text-gray-400">Previous page</span>}
              <span>Page {bookings.current_page} of {bookings.last_page}</span>
              {bookings.next_page_url ? <Link href={bookings.next_page_url} className="rounded-md border border-gray-300 px-3 py-2">Next page</Link>
                : <span aria-disabled="true" className="px-3 py-2 text-gray-400">Next page</span>}
            </nav>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
