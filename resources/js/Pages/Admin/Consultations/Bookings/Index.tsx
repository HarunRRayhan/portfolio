import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Head, Link } from '@inertiajs/react'

type BookingRow = {
  id: number
  public_id: string
  status: string
  client_name: string
  client_email: string
  starts_at: string
  amount_due_cents: number
  tier: { name: string; slug: string } | null
  created_at: string
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
  googleConnected,
}: {
  bookings: BookingRow[]
  filterStatus: string
  googleConnected: boolean
}) {
  const statuses = [
    '',
    'pending_approval',
    'awaiting_payment',
    'confirmed',
    'reschedule_proposed',
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

          <div className="flex flex-wrap items-center gap-2">
            {statuses.map((s) => (
              <Link
                key={s || 'all'}
                href={s ? `/admin/consultations/bookings?status=${s}` : '/admin/consultations/bookings'}
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

          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            {bookings.length === 0 ? (
              <p className="px-6 py-16 text-center text-sm text-gray-500">No bookings yet.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {bookings.map((b) => (
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
                        <p className="text-sm text-gray-500">
                          {formatLocal(b.starts_at)} · {b.status}
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
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
