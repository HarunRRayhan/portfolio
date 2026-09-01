import { Head, router, usePage } from '@inertiajs/react'
import { FormEvent, useState } from 'react'

type Tier = {
  slug: string
  name: string
  price_display: string
  duration_minutes: number
}

type Booking = {
  public_id: string
  status: string
  client_name: string
  client_email: string
  notes: string | null
  starts_at: string
  ends_at: string
  list_price_cents: number
  amount_due_cents: number
  discount_percent: number
  campaign_discount_cents: number
  payment_due_at: string | null
  payment_received?: boolean
  meet_link: string | null
  proposed_slots: { start: string; end: string }[] | null
  tier: Tier | null
}

function formatLocal(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(new Date(iso))
}

const statusLabel: Record<string, string> = {
  pending_approval: 'Pending approval',
  awaiting_payment: 'Awaiting payment',
  confirmed: 'Confirmed',
  declined: 'Declined',
  reschedule_proposed: 'Pick a new time',
  paid_reschedule_pending_approval: 'New time pending approval',
  expired: 'Expired',
  cancel_requested: 'Cancel requested',
  reschedule_requested: 'Reschedule requested',
  cancelled: 'Cancelled',
}

export default function Status({
  booking,
  flashPaid,
  flashCancelledCheckout,
}: {
  booking: Booking
  flashPaid?: boolean
  flashCancelledCheckout?: boolean
}) {
  const [note, setNote] = useState('')
  const page = usePage()
  const flash = (page.props.flash ?? null) as { type?: string; message?: string } | null

  const pay = () => {
    router.post(`/book/b/${booking.public_id}/pay`)
  }

  const cancel = () => {
    if (!confirm('Request cancellation? Harun will review it.')) return
    router.post(`/book/b/${booking.public_id}/cancel`)
  }

  const reschedule = (e: FormEvent) => {
    e.preventDefault()
    router.post(`/book/b/${booking.public_id}/reschedule`, { note })
  }

  const pick = (startsAt: string) => {
    router.post(`/book/b/${booking.public_id}/pick-proposed`, { starts_at: startsAt })
  }

  return (
    <>
      <Head title={`Booking · ${booking.tier?.name ?? 'Consultation'}`} />

      <section className="border-b border-slate-200 bg-slate-50 py-14">
        <div className="container mx-auto max-w-xl">
          <p className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-500">Your booking</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {booking.tier?.name ?? 'Consultation'}
          </h1>
          <p className="mt-2 text-slate-500">
            Status:{' '}
            <span className="font-medium text-slate-800">
              {booking.status === 'awaiting_payment' && booking.payment_received
                ? 'Payment received, confirming'
                : statusLabel[booking.status] ?? booking.status}
            </span>
          </p>
        </div>
      </section>

      <section className="bg-white py-10">
        <div className="container mx-auto max-w-xl space-y-6">
          {(flash?.message || flashPaid || flashCancelledCheckout) && (
            <div className="border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              {flashPaid && 'Payment received — confirmation may take a moment.'}
              {flashCancelledCheckout && 'Checkout cancelled. You can try again when ready.'}
              {flash?.message}
            </div>
          )}

          <div className="border border-slate-200 p-6 space-y-3 text-sm text-slate-700">
            <p>
              <span className="text-slate-400">When · </span>
              {formatLocal(booking.starts_at)}
            </p>
            {booking.campaign_discount_cents > 0 && (
              <p>
                <span className="text-slate-400">List price · </span>
                ${(booking.list_price_cents / 100).toFixed(2)}
              </p>
            )}
            <p>
              <span className="text-slate-400">Amount · </span>
              ${(booking.amount_due_cents / 100).toFixed(2)}
            </p>
            {booking.campaign_discount_cents > 0 && (
              <p>
                <span className="text-slate-400">Launch discount · </span>-${(booking.campaign_discount_cents / 100).toFixed(2)}
              </p>
            )}
            {booking.discount_percent > 0 && (
              <p>
                <span className="text-slate-400">Coupon · </span>{booking.discount_percent}% off
              </p>
            )}
            {booking.payment_due_at && booking.status === 'awaiting_payment' && (
              <p>
                <span className="text-slate-400">Pay by · </span>
                {formatLocal(booking.payment_due_at)}
              </p>
            )}
            {booking.meet_link && (
              <p>
                <span className="text-slate-400">Meet · </span>
                <a className="text-sky-600 underline" href={booking.meet_link} target="_blank" rel="noreferrer">
                  Join Google Meet
                </a>
              </p>
            )}
          </div>

          {booking.status === 'awaiting_payment' && !booking.payment_received && (
            <button
              type="button"
              onClick={pay}
              className="w-full bg-sky-500 py-3 font-mono text-xs font-semibold uppercase tracking-wider text-white hover:bg-sky-600"
            >
              Pay with Stripe
            </button>
          )}

          {booking.status === 'reschedule_proposed' && booking.proposed_slots && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-800">Proposed times</p>
              {booking.proposed_slots.map((s) => (
                <button
                  key={s.start}
                  type="button"
                  onClick={() => pick(s.start)}
                  className="block w-full border border-slate-200 px-4 py-3 text-left text-sm hover:border-slate-400"
                >
                  {formatLocal(s.start)}
                </button>
              ))}
            </div>
          )}

          {booking.status === 'confirmed' && (
            <div className="space-y-4 border border-slate-200 p-6">
              <p className="text-sm text-slate-600">
                Need to change plans? Cancel and reschedule requests need approval. New times must still be at least 48
                hours out.
              </p>
              <button
                type="button"
                onClick={cancel}
                className="w-full border border-slate-300 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Request cancellation
              </button>
              <form onSubmit={reschedule} className="space-y-2">
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder="Why do you need to reschedule?"
                  className="w-full border border-slate-200 px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  className="w-full border border-slate-300 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Request reschedule
                </button>
              </form>
            </div>
          )}

          <a href="/book" className="inline-block text-sm text-slate-500 underline hover:text-slate-800">
            Back to plans
          </a>
        </div>
      </section>
    </>
  )
}
