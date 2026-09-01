import { Head, useForm, usePage } from '@inertiajs/react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronLeft, Loader2, Sparkles, X } from 'lucide-react'
import { FormEvent, useEffect, useMemo, useState } from 'react'

type Feature = { label: string; included: boolean }

type Tier = {
  id: number
  slug: string
  name: string
  price_cents: number
  price_display: string
  duration_minutes: number
  features: Feature[]
  includes_recording: boolean
  includes_followup: boolean
}

type Slot = { start: string; end: string }

type LaunchPromotion = {
  discount_cents: number
  limit: number
  remaining_bookings: number
}

const accentBySlug: Record<string, { border: string; button: string; ring: string }> = {
  light: {
    border: 'border-t-slate-700 border-b-slate-700',
    button: 'bg-slate-800 hover:bg-slate-900',
    ring: 'ring-slate-800',
  },
  pro: {
    border: 'border-t-sky-500 border-b-sky-500',
    button: 'bg-sky-500 hover:bg-sky-600',
    ring: 'ring-sky-500',
  },
  max: {
    border: 'border-t-emerald-600 border-b-emerald-600',
    button: 'bg-emerald-600 hover:bg-emerald-700',
    ring: 'ring-emerald-600',
  },
}

function formatLocal(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(cents % 100 ? 2 : 0)}`
}

function csrfToken(): string {
  return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? ''
}

export default function Book({
  tiers,
  canonicalUrl,
  minLeadHours = 48,
  launchPromotion,
}: {
  tiers: Tier[]
  canonicalUrl?: string
  stripeConfigured?: boolean
  minLeadHours?: number
  bufferMinutes?: number
  launchPromotion?: LaunchPromotion
}) {
  const [step, setStep] = useState<'plans' | 'details'>('plans')
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)
  const [slots, setSlots] = useState<Slot[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponMsg, setCouponMsg] = useState<string | null>(null)
  const [discountedCents, setDiscountedCents] = useState<number | null>(null)
  const [campaignDiscountCents, setCampaignDiscountCents] = useState(0)

  const launchAvailable =
    (launchPromotion?.remaining_bookings ?? 0) > 0 && (launchPromotion?.discount_cents ?? 0) > 0
  const launchDiscountDisplay = formatCents(launchPromotion?.discount_cents ?? 0)

  const selected = useMemo(
    () => tiers.find((t) => t.slug === selectedSlug) ?? null,
    [tiers, selectedSlug],
  )

  const form = useForm({
    tier: '',
    client_name: '',
    client_email: '',
    notes: '',
    starts_at: '',
    coupon_code: '',
  })

  const page = usePage()
  const errors = (page.props.errors ?? {}) as Record<string, string>

  useEffect(() => {
    if (!selectedSlug) return

    setSlotsLoading(true)
    const params = new URLSearchParams({ tier: selectedSlug })
    fetch(`/book/availability?${params}`, {
      headers: { Accept: 'application/json' },
    })
      .then((r) => r.json())
      .then((data) => setSlots(Array.isArray(data.slots) ? data.slots : []))
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false))
  }, [selectedSlug])

  const startBooking = (tier: Tier) => {
    setSelectedSlug(tier.slug)
    form.setData('tier', tier.slug)
    form.setData('starts_at', '')
    setDiscountedCents(null)
    setCampaignDiscountCents(
      launchAvailable ? Math.min(tier.price_cents, launchPromotion?.discount_cents ?? 0) : 0,
    )
    setCouponMsg(null)
    setStep('details')
  }

  const applyCoupon = async () => {
    if (!selectedSlug || !form.data.coupon_code.trim()) return
    setCouponMsg(null)
    setCouponLoading(true)

    try {
      const res = await fetch('/book/coupon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-CSRF-TOKEN': csrfToken(),
        },
        body: JSON.stringify({ code: form.data.coupon_code, tier: selectedSlug }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setDiscountedCents(null)
        setCouponMsg(data.message ?? 'Invalid coupon')
        return
      }
      setDiscountedCents(data.amount_due_cents)
      setCampaignDiscountCents(data.campaign_discount_cents ?? 0)
      setCouponMsg(`${data.percent_off}% off applied`)
    } catch {
      setDiscountedCents(null)
      setCouponMsg('Unable to validate coupon right now')
    } finally {
      setCouponLoading(false)
    }
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    form.post('/book')
  }

  const offersLd = tiers.map((t) => ({
    '@type': 'Offer',
    name: t.name,
    price: (
      (launchAvailable ? Math.max(0, t.price_cents - (launchPromotion?.discount_cents ?? 0)) : t.price_cents) / 100
    ).toFixed(2),
    priceCurrency: 'USD',
  }))

  const selectedAmountCents = selected
    ? Math.max(0, selected.price_cents - campaignDiscountCents)
    : null

  return (
    <>
      <Head>
        <title>Book a Consultation | Cloud & DevOps Expert - Harun R. Rayhan</title>
        <meta
          name="description"
          content="Book a paid DevOps consultation — Light, Pro, or Max. The first 1,000 booking requests get $100 off before any valid coupon is applied."
        />
        <meta property="og:title" content="Book a Consultation | Cloud & DevOps Expert - Harun R. Rayhan" />
        <meta
          property="og:description"
          content="Paid DevOps consultations with approval, Google Calendar sync, Stripe checkout, and $100 off for the first 1,000 booking requests."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <link rel="canonical" href={canonicalUrl} />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: 'Cloud & DevOps Consultation',
            description: 'Paid DevOps and infrastructure consultation sessions',
            provider: {
              '@type': 'Person',
              name: 'Harun R. Rayhan',
              jobTitle: 'Cloud & DevOps Expert',
            },
            offers: offersLd,
          })}
        </script>
      </Head>

      <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-slate-50 via-white to-slate-50">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(14,165,233,0.08),_transparent_55%)]" />
        <div className="container relative mx-auto py-16 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white/80 px-3 py-1.5 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Pricing plans
              </span>
            </div>
            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl"
            >
              DevOps consultations that ship clarity
            </motion.h1>
            <p className="mt-4 text-lg leading-7 text-slate-500">
              Pick a plan, request a slot (≥{minLeadHours}h ahead). I approve, then you pay via Stripe.
              Nothing goes on the calendar as confirmed until both happen.
            </p>
            {launchAvailable && (
              <p className="mt-4 text-sm font-medium text-emerald-700">
                Launch offer: the first {launchPromotion?.limit.toLocaleString() ?? 1000} booking requests get {launchDiscountDisplay} off.
                Valid percentage coupons stack after this discount.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="bg-white py-14 sm:py-16">
        <div className="container mx-auto">
          <AnimatePresence mode="wait">
            {step === 'plans' ? (
              <motion.div
                key="plans"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3"
              >
                {tiers.map((tier) => {
                  const accent = accentBySlug[tier.slug] ?? accentBySlug.light
                  return (
                    <div
                      key={tier.slug}
                      className={`flex flex-col border border-slate-200 bg-white ${accent.border} border-t-[3px] border-b-[3px]`}
                    >
                      <div className="px-6 pb-4 pt-8 text-center">
                        <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          {tier.name}
                        </p>
                        <p className="mt-3 text-4xl font-bold tracking-tight text-slate-900">
                          {launchAvailable ? (
                            <>
                              <span className="text-slate-400 line-through">{tier.price_display}</span>
                              {' '}
                              <span className="ml-2">
                                {formatCents(Math.max(0, tier.price_cents - (launchPromotion?.discount_cents ?? 0)))}
                              </span>
                            </>
                          ) : (
                            tier.price_display
                          )}
                          <span className="ml-1 text-base font-medium text-slate-400">/ one time</span>
                        </p>
                        {launchAvailable && <p className="mt-1 text-xs font-medium text-emerald-700">{launchDiscountDisplay} off launch pricing</p>}
                        <p className="mt-1 text-sm text-slate-500">{tier.duration_minutes} minutes</p>
                      </div>
                      <ul className="flex-1 border-t border-slate-100 px-6">
                        {tier.features.map((f) => (
                          <li
                            key={f.label}
                            className="flex items-start gap-3 border-b border-slate-100 py-3.5 text-sm text-slate-700 last:border-b-0"
                          >
                            <span
                              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                                f.included ? 'bg-sky-400 text-white' : 'bg-rose-500 text-white'
                              }`}
                            >
                              {f.included ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                            </span>
                            <span className={f.included ? '' : 'text-slate-400'}>{f.label}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="p-6">
                        <button
                          type="button"
                          onClick={() => startBooking(tier)}
                          className={`w-full py-3 text-center font-mono text-xs font-semibold uppercase tracking-[0.16em] text-white transition ${accent.button}`}
                        >
                          Book {tier.name.replace('Consultation ', '')}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </motion.div>
            ) : (
              <motion.div
                key="details"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mx-auto max-w-2xl"
              >
                <button
                  type="button"
                  onClick={() => setStep('plans')}
                  className="mb-6 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
                >
                  <ChevronLeft className="h-4 w-4" />
                  All plans
                </button>

                <form onSubmit={submit} className="space-y-6 border border-slate-200 bg-white p-6 sm:p-8">
                  <div>
                    <p className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-500">
                      {selected?.name}
                    </p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">
                      {discountedCents !== null
                        ? formatCents(discountedCents)
                        : selectedAmountCents !== null
                          ? formatCents(selectedAmountCents)
                          : selected?.price_display}{' '}
                      <span className="text-base font-medium text-slate-400">
                        · {selected?.duration_minutes} min
                      </span>
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block text-sm">
                      <span className="mb-1.5 block font-medium text-slate-700">Name</span>
                      <input
                        required
                        value={form.data.client_name}
                        onChange={(e) => form.setData('client_name', e.target.value)}
                        className="w-full border border-slate-200 px-3 py-2 text-slate-900 outline-none ring-slate-400 focus:ring-2"
                      />
                      {errors.client_name && <p className="mt-1 text-xs text-rose-600">{errors.client_name}</p>}
                    </label>
                    <label className="block text-sm">
                      <span className="mb-1.5 block font-medium text-slate-700">Email</span>
                      <input
                        type="email"
                        required
                        value={form.data.client_email}
                        onChange={(e) => form.setData('client_email', e.target.value)}
                        className="w-full border border-slate-200 px-3 py-2 text-slate-900 outline-none ring-slate-400 focus:ring-2"
                      />
                      {errors.client_email && <p className="mt-1 text-xs text-rose-600">{errors.client_email}</p>}
                    </label>
                  </div>

                  <label className="block text-sm">
                    <span className="mb-1.5 block font-medium text-slate-700">What should we cover?</span>
                    <textarea
                      rows={4}
                      value={form.data.notes}
                      onChange={(e) => form.setData('notes', e.target.value)}
                      className="w-full border border-slate-200 px-3 py-2 text-slate-900 outline-none ring-slate-400 focus:ring-2"
                    />
                  </label>

                  <div>
                    <span className="mb-1.5 block text-sm font-medium text-slate-700">Coupon (optional)</span>
                    <div className="flex gap-2">
                      <input
                        value={form.data.coupon_code}
                        onChange={(e) => {
                          form.setData('coupon_code', e.target.value)
                          setDiscountedCents(null)
                          setCouponMsg(null)
                        }}
                        className="min-w-0 flex-1 border border-slate-200 px-3 py-2 uppercase text-slate-900 outline-none ring-slate-400 focus:ring-2"
                        placeholder="CODE"
                      />
                      <button
                        type="button"
                        onClick={applyCoupon}
                        className="shrink-0 border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        {couponLoading ? 'Checking…' : 'Apply'}
                      </button>
                    </div>
                    {couponMsg && <p className="mt-1 text-xs text-slate-600">{couponMsg}</p>}
                    {errors.coupon_code && <p className="mt-1 text-xs text-rose-600">{errors.coupon_code}</p>}
                  </div>

                  <div>
                    <span className="mb-1.5 block text-sm font-medium text-slate-700">Pick a time (your local timezone)</span>
                    {slotsLoading ? (
                      <div className="flex items-center gap-2 py-8 text-sm text-slate-500">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading open slots…
                      </div>
                    ) : slots.length === 0 ? (
                      <p className="border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                        No open slots right now. Check back after availability is configured, or email me.
                      </p>
                    ) : (
                      <div className="grid max-h-72 gap-2 overflow-y-auto sm:grid-cols-2">
                        {slots.map((slot) => {
                          const active = form.data.starts_at === slot.start
                          return (
                            <button
                              key={slot.start}
                              type="button"
                              onClick={() => form.setData('starts_at', slot.start)}
                              className={`border px-3 py-2 text-left text-sm transition ${
                                active
                                  ? 'border-slate-900 bg-slate-900 text-white'
                                  : 'border-slate-200 text-slate-700 hover:border-slate-400'
                              }`}
                            >
                              {formatLocal(slot.start)}
                            </button>
                          )
                        })}
                      </div>
                    )}
                    {errors.starts_at && <p className="mt-1 text-xs text-rose-600">{errors.starts_at}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={form.processing || !form.data.starts_at}
                    className="inline-flex w-full items-center justify-center gap-2 bg-slate-900 py-3 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-slate-800 disabled:opacity-50"
                  >
                    {form.processing && <Loader2 className="h-4 w-4 animate-spin" />}
                    Request this slot
                  </button>
                  <p className="text-center text-xs text-slate-400">
                    Requesting does not charge you. The launch discount is checked when you submit. After approval you’ll get a Stripe link (unless the coupon is 100% off).
                  </p>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </>
  )
}
