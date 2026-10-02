import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Head, Link } from '@inertiajs/react'
import { FormEvent, useEffect, useState } from 'react'
import { DialogDescription, DialogTitle } from '@headlessui/react'
import Modal from '@/Components/Modal'
import AlternateTimes from './AlternateTimes'
import { ErrorSummary, fieldErrorProps, useConsultationAction } from '../Partials/FormFeedback'

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
  client_message: string | null
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
  cancellation,
}: {
  booking: Booking
  events: { id: number; event: string; actor: string | null; created_at: string }[]
  slots: Slot[]
  googleConnected: boolean
  cancellation: { refundStatus: 'pending' | 'refunded' | 'not_needed'; bookingAmountCents: number; currency: string }
}) {
  const [blockSlot, setBlockSlot] = useState(false)
  const [taskTitle, setTaskTitle] = useState('')
  const [adminNote, setAdminNote] = useState('')
  const [clientMessage, setClientMessage] = useState('')
  const [selectedPropose, setSelectedPropose] = useState<string[]>([])
  useEffect(() => {
    const available = new Set(slots.map(slot => slot.start))
    setSelectedPropose(current => {
      const next = current.filter(start => available.has(start))
      return next.length === current.length ? current : next
    })
  }, [slots])
  const action = useConsultationAction()
  const summaryId = 'booking-errors'
  const [confirmCancellation, setConfirmCancellation] = useState(false)
  const bookingAmount = new Intl.NumberFormat(undefined, { style: 'currency', currency: cancellation.currency.toUpperCase() }).format(cancellation.bookingAmountCents / 100)

  const approve = () => {
    action.submit(`/admin/consultations/bookings/${booking.id}/approve`, {
      admin_note: adminNote,
      client_message: clientMessage,
    })
  }

  const decline = () => {
    action.submit(`/admin/consultations/bookings/${booking.id}/decline`, {
      block_slot: blockSlot,
      task_title: taskTitle,
      admin_note: adminNote,
      client_message: clientMessage,
    })
  }

  const propose = (e: FormEvent) => {
    e.preventDefault()
    const chosen = slots.filter((s) => selectedPropose.includes(s.start))
    if (!chosen.length) return
    action.submit(`/admin/consultations/bookings/${booking.id}/propose-reschedule`, {
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
      <Modal show={confirmCancellation} maxWidth="md" closeable={!action.processing} onClose={() => setConfirmCancellation(false)}>
        <div className="space-y-4 p-6">
          <DialogTitle as="h2" className="text-lg font-semibold text-gray-900">Approve cancellation?</DialogTitle>
          <DialogDescription as="div" className="space-y-2 text-sm text-gray-700">
            <p>{booking.client_name} · {booking.public_id}</p>
            <p><time dateTime={booking.starts_at}>{formatLocal(booking.starts_at)}</time></p>
            <p>Booking total: {bookingAmount}</p>
            {cancellation.refundStatus === 'pending'
              ? <p>This will request a full payment refund to the original payment method. Stripe determines the remaining refundable amount.</p>
              : cancellation.refundStatus === 'refunded'
                ? <p>This payment has already been refunded. No new refund will be requested.</p>
                : <p>No payment refund is needed for this booking.</p>}
            <p>The consultation will be cancelled and its calendar time released.</p>
          </DialogDescription>
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" disabled={action.processing} onClick={() => setConfirmCancellation(false)}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm disabled:opacity-50">Go back</button>
            <button type="button" disabled={action.processing}
              onClick={() => action.submit(`/admin/consultations/bookings/${booking.id}/approve-cancel`, {}, 'post', () => setConfirmCancellation(false))}
              className="rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
              {action.processing ? 'Confirming…' : 'Confirm cancellation'}
            </button>
          </div>
        </div>
      </Modal>

      <div className="py-6 sm:py-12">
        <div className="mx-auto grid max-w-5xl gap-6 px-4 lg:grid-cols-3 sm:px-6 lg:px-8">
          <div className="space-y-4 lg:col-span-2" aria-busy={action.processing}>
            <ErrorSummary errors={action.errors} id={summaryId} />
            {action.processing && <p role="status" className="text-sm text-gray-600">Submitting…</p>}
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
              {booking.client_message && (
                <p>
                  <span className="text-gray-400">Message sent · </span>
                  {booking.client_message}
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
                {(booking.status === 'pending_approval' || booking.status === 'paid_reschedule_pending_approval') && (
                  <>
                    <label htmlFor="booking-client-message" className="block text-sm text-gray-700">Message to the customer (optional)</label>
                    <textarea
                      id="booking-client-message"
                      autoFocus
                      disabled={action.processing}
                      {...fieldErrorProps(action.errors, 'client_message', summaryId)}
                      value={clientMessage}
                      onChange={(e) => setClientMessage(e.target.value)}
                      placeholder="Included in the approval or decline email"
                      className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                      rows={3}
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={action.processing}
                        onClick={approve}
                        className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={action.processing}
                        onClick={decline}
                        className="rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
                      >
                        {booking.status === 'paid_reschedule_pending_approval' ? 'Decline new time' : 'Decline'}
                      </button>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="booking-admin-note" className="block text-sm text-gray-700">Internal note (optional)</label>
                      <textarea
                        id="booking-admin-note"
                        disabled={action.processing}
                        {...fieldErrorProps(action.errors, 'admin_note', summaryId)}
                        value={adminNote}
                        onChange={(e) => setAdminNote(e.target.value)}
                        placeholder="Only visible in admin"
                        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                        rows={2}
                      />
                    </div>
                  </>
                )}
                {booking.status === 'pending_approval' && (
                  <div className="space-y-2 border-t border-gray-100 pt-4">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        disabled={action.processing}
                        {...fieldErrorProps(action.errors, 'block_slot', summaryId)}
                        type="checkbox"
                        checked={blockSlot}
                        onChange={(e) => setBlockSlot(e.target.checked)}
                      />
                      On decline, block this slot on Google Calendar
                    </label>
                    {blockSlot && (
                      <label className="block text-sm text-gray-700">Task title
                      <input
                        disabled={action.processing}
                        {...fieldErrorProps(action.errors, 'task_title', summaryId)}
                        value={taskTitle}
                        onChange={(e) => setTaskTitle(e.target.value)}
                        placeholder="Task title"
                        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                      />
                      </label>
                    )}
                  </div>
                )}

                {(booking.status === 'pending_approval' || booking.status === 'reschedule_requested') && (
                  <form onSubmit={propose} aria-busy={action.processing} className="space-y-3 border-t border-gray-100 pt-4">
                    <p className="text-sm font-medium text-gray-800">Propose alternate times</p>
                    <AlternateTimes slots={slots} selected={selectedPropose} onToggle={togglePropose}
                      disabled={action.processing} errors={action.errors} summaryId={summaryId} />
                    <button
                      type="submit"
                      disabled={action.processing || selectedPropose.length === 0}
                      className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
                    >
                      Send proposed times
                    </button>
                  </form>
                )}
                {booking.status === 'reschedule_requested' && (
                  <div className="space-y-2 border-t border-gray-100 pt-4">
                    <label htmlFor="booking-admin-note" className="block text-sm text-gray-700">Internal note (optional)</label>
                    <textarea
                      id="booking-admin-note"
                      disabled={action.processing}
                      {...fieldErrorProps(action.errors, 'admin_note', summaryId)}
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="Only visible in admin"
                      className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                      rows={2}
                    />
                  </div>
                )}
              </div>
            )}

            {booking.status === 'cancel_requested' && (
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={action.processing}
                  onClick={() => setConfirmCancellation(true)}
                  className="rounded-md bg-rose-600 px-4 py-2 text-sm text-white"
                >
                  Approve cancel
                </button>
                <button
                  type="button"
                  disabled={action.processing}
                  onClick={() => action.submit(`/admin/consultations/bookings/${booking.id}/deny-cancel`)}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm"
                >
                  Keep booking
                </button>
              </div>
            )}

            {booking.status === 'reschedule_requested' && (
              <button
                type="button"
                disabled={action.processing}
                onClick={() => action.submit(`/admin/consultations/bookings/${booking.id}/deny-reschedule`)}
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
