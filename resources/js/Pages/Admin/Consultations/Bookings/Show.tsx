import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Head, Link, router } from '@inertiajs/react'
import { FormEvent, useState } from 'react'

type Booking = {
  id: number
  public_id: string
  status: string
  client_name: string
  client_email: string
  company_name: string | null
  notes: string | null
  starts_at: string
  ends_at: string
  list_price_cents: number
  amount_due_cents: number
  discount_percent: number
  campaign_discount_cents: number
  hold_expires_at: string | null
  payment_due_at: string | null
  meet_link: string | null
  admin_note: string | null
  proposed_slots: { start: string; end: string }[] | null
  tier: { name: string; slug: string; duration_minutes: number } | null
  coupon_code: string | null
}

type Slot = { start: string; end: string }

function formatLocal(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(new Date(iso))
}

export default function Show({
  booking,
  events,
  slots,
}: {
  booking: Booking
  events: { id: number; event: string; actor: string | null; created_at: string }[]
  slots: Slot[]
  googleConnected: boolean
}) {
  const [blockSlot, setBlockSlot] = useState(false)
  const [taskTitle, setTaskTitle] = useState('')
  const [adminNote, setAdminNote] = useState('')
  const [selectedPropose, setSelectedPropose] = useState<string[]>([])

  const approve = () => {
    router.post(`/admin/consultations/bookings/${booking.id}/approve`, { admin_note: adminNote })
  }

  const decline = () => {
    router.post(`/admin/consultations/bookings/${booking.id}/decline`, {
      block_slot: blockSlot,
      task_title: taskTitle,
      admin_note: adminNote,
    })
  }

  const propose = (e: FormEvent) => {
    e.preventDefault()
    const chosen = slots.filter((s) => selectedPropose.includes(s.start))
    router.post(`/admin/consultations/bookings/${booking.id}/propose-reschedule`, {
      slots: chosen,
      admin_note: adminNote,
    })
  }

  const togglePropose = (start: string) => {
    setSelectedPropose((prev) =>
      prev.includes(start) ? prev.filter((s) => s !== start) : [...prev, start],
    )
  }

  return (
    <AuthenticatedLayout
      header={
        <div className="flex items-center gap-3">
          <Link href="/admin/consultations/bookings" className="text-sm text-gray-500 hover:text-gray-800">
            ← Inbox
          </Link>
          <h2 className="text-xl font-semibold text-gray-800">{booking.client_name}</h2>
        </div>
      }
    >
      <Head title={`Booking ${booking.public_id}`} />

      <div className="py-6 sm:py-12">
        <div className="mx-auto grid max-w-5xl gap-6 px-4 lg:grid-cols-3 sm:px-6 lg:px-8">
          <div className="space-y-4 lg:col-span-2">
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm space-y-2 text-sm">
              <p>
                <span className="text-gray-400">Status · </span>
                {booking.status}
              </p>
              <p>
                <span className="text-gray-400">Plan · </span>
                {booking.tier?.name}
              </p>
              <p>
                <span className="text-gray-400">When · </span>
                {formatLocal(booking.starts_at)}
              </p>
              <p>
                <span className="text-gray-400">Email · </span>
                <a className="text-indigo-600" href={`mailto:${booking.client_email}`}>
                  {booking.client_email}
                </a>
              </p>
              {booking.company_name && (
                <p>
                  <span className="text-gray-400">Company · </span>
                  {booking.company_name}
                </p>
              )}
              <p>
                <span className="text-gray-400">List price · </span>$
                {(booking.list_price_cents / 100).toFixed(2)}
              </p>
              <p>
                <span className="text-gray-400">Amount · </span>$
                {(booking.amount_due_cents / 100).toFixed(2)}
                {booking.campaign_discount_cents > 0
                  ? ` · $${(booking.campaign_discount_cents / 100).toFixed(2)} launch discount`
                  : ''}
                {booking.coupon_code ? ` · coupon ${booking.coupon_code}` : ''}
              </p>
              {booking.notes && (
                <p>
                  <span className="text-gray-400">Notes · </span>
                  {booking.notes}
                </p>
              )}
              {booking.meet_link && (
                <p>
                  <span className="text-gray-400">Meet · </span>
                  <a href={booking.meet_link} className="text-indigo-600 underline" target="_blank" rel="noreferrer">
                    {booking.meet_link}
                  </a>
                </p>
              )}
            </div>

            {(booking.status === 'pending_approval' ||
              booking.status === 'reschedule_requested' ||
              booking.status === 'paid_reschedule_pending_approval') && (
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm space-y-4">
                <h3 className="font-semibold text-gray-900">Review</h3>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Internal note (optional)"
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  rows={2}
                />
                {(booking.status === 'pending_approval' || booking.status === 'paid_reschedule_pending_approval') && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={approve}
                      className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={decline}
                      className="rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
                    >
                      {booking.status === 'paid_reschedule_pending_approval' ? 'Decline new time' : 'Decline'}
                    </button>
                  </div>
                )}
                {booking.status === 'pending_approval' && (
                  <div className="space-y-2 border-t border-gray-100 pt-4">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={blockSlot}
                        onChange={(e) => setBlockSlot(e.target.checked)}
                      />
                      On decline, block this slot on Google Calendar
                    </label>
                    {blockSlot && (
                      <input
                        value={taskTitle}
                        onChange={(e) => setTaskTitle(e.target.value)}
                        placeholder="Task title"
                        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                      />
                    )}
                  </div>
                )}

                {(booking.status === 'pending_approval' || booking.status === 'reschedule_requested') && (
                  <form onSubmit={propose} className="space-y-3 border-t border-gray-100 pt-4">
                    <p className="text-sm font-medium text-gray-800">Propose alternate times</p>
                    <div className="grid max-h-48 gap-1 overflow-y-auto sm:grid-cols-2">
                      {slots.slice(0, 40).map((s) => (
                        <label key={s.start} className="flex items-center gap-2 text-xs text-gray-700">
                          <input
                            type="checkbox"
                            checked={selectedPropose.includes(s.start)}
                            onChange={() => togglePropose(s.start)}
                          />
                          {formatLocal(s.start)}
                        </label>
                      ))}
                    </div>
                    <button
                      type="submit"
                      disabled={selectedPropose.length === 0}
                      className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
                    >
                      Send proposed times
                    </button>
                  </form>
                )}
              </div>
            )}

            {booking.status === 'cancel_requested' && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => router.post(`/admin/consultations/bookings/${booking.id}/approve-cancel`)}
                  className="rounded-md bg-rose-600 px-4 py-2 text-sm text-white"
                >
                  Approve cancel
                </button>
                <button
                  type="button"
                  onClick={() => router.post(`/admin/consultations/bookings/${booking.id}/deny-cancel`)}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm"
                >
                  Keep booking
                </button>
              </div>
            )}

            {booking.status === 'reschedule_requested' && (
              <button
                type="button"
                onClick={() => router.post(`/admin/consultations/bookings/${booking.id}/deny-reschedule`)}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm"
              >
                Deny reschedule (keep original)
              </button>
            )}
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-gray-900">Audit</h3>
            <ul className="space-y-2 text-xs text-gray-600">
              {events.map((e) => (
                <li key={e.id}>
                  <span className="font-medium text-gray-800">{e.event}</span>
                  {e.actor ? ` · ${e.actor}` : ''}
                  <div className="text-gray-400">{formatLocal(e.created_at)}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
