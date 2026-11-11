import { Head, router, useForm, usePage } from '@inertiajs/react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronLeft, Loader2, Sparkles, X } from 'lucide-react'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import { trackLeadConversion } from '@/lib/analytics'

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

type BookingUser = { name: string; email: string }

const inputClass = 'w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-white outline-none ring-slate-400 focus:ring-2'

// Magic-link accounts get the email local part as their name; don't prefill that.
function prefillName(user: BookingUser | null | undefined): string {
  if (!user) return ''
  return user.name.includes(' ') || user.name !== user.email.split('@')[0] ? user.name : ''
}

type Credit = { id: number; tier_slug: string | null; tier_name: string | null; kind: 'call' | 'scan'; expires_at: string }

type SponsorTier = { slug: string; url: string | null; kind: string }

function ManualPaymentNote({ contactUrl, contactEmail }: { contactUrl: string; contactEmail: string }) {
  return (
    <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
      GitHub doesn’t support your payment method? Use the{' '}
      <a href={contactUrl} className="font-medium text-slate-700 underline underline-offset-4 dark:text-slate-200">contact page</a>{' '}
      or <a href={`mailto:${contactEmail}`} className="font-medium text-slate-700 underline underline-offset-4 dark:text-slate-200">email me</a>{' '}
      and I’ll set it up by hand.
    </p>
  )
}

const accentBySlug: Record<string, { border: string; button: string; ring: string }> = {
  pro: {
    border: 'border-t-slate-300 border-b-slate-300',
    button: 'bg-slate-900 hover:bg-slate-800',
    ring: 'ring-slate-300',
  },
  max: {
    border: 'border-t-amber-600 border-b-amber-600',
    button: 'bg-amber-700 hover:bg-amber-800',
    ring: 'ring-amber-600',
  },
  ultra: {
    border: 'border-t-rose-700 border-b-rose-700',
    button: 'bg-rose-800 hover:bg-rose-900',
    ring: 'ring-rose-700',
  },
}

function formatLocal(iso: string, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone,
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

function localDateKey(iso: string, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(new Date(iso))
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))

  return [values.year, values.month, values.day].join('-')
}

function formatLocalDay(iso: string, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      timeZone,
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

function browserTimezone(available: string[]): string {
  const local = Intl.DateTimeFormat().resolvedOptions().timeZone

  return available.includes(local) ? local : available.includes('UTC') ? 'UTC' : available[0] ?? 'UTC'
}

function timezoneLabel(timezone: string): string {
  try {
    const offset = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'shortOffset',
    })
      .formatToParts(new Date())
      .find((part) => part.type === 'timeZoneName')?.value

    return `${timezone} (${offset?.replace(/^GMT$/, 'UTC').replace(/^GMT/, 'UTC') ?? 'UTC'})`
  } catch {
    return timezone
  }
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(iso))
}

function referralFromUrl(): string {
  if (typeof window === 'undefined') return ''

  return new URLSearchParams(window.location.search).get('sa_ref') ?? ''
}

export default function Book({
  tiers,
  canonicalUrl,
  minLeadHours = 48,
  timezones = [],
  bookingUser,
  credits = [],
  sponsorTiers = [],
  sponsorsUrl,
  contactUrl,
  contactEmail,
  hasGithubIdentity = false,
  githubLinkUrl,
  scanUrl,
}: {
  bookingUser?: BookingUser | null
  tiers: Tier[]
  canonicalUrl?: string
  minLeadHours?: number
  timezones?: string[]
  credits?: Credit[]
  sponsorTiers?: SponsorTier[]
  sponsorsUrl: string
  contactUrl: string
  contactEmail: string
  hasGithubIdentity?: boolean
  githubLinkUrl: string
  scanUrl: string
}) {
  const [step, setStep] = useState<'plans' | 'details'>('plans')
  const [selectedCredit, setSelectedCredit] = useState<Credit | null>(null)
  const [slots, setSlots] = useState<Slot[]>([])
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [timezone, setTimezone] = useState(() => browserTimezone(timezones))
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [slotsError, setSlotsError] = useState<string | null>(null)
  const [availabilityAttempt, setAvailabilityAttempt] = useState(0)

  const callCredits = credits.filter((c) => c.kind === 'call')
  const hasScanCredit = credits.some((c) => c.kind === 'scan')
  const sponsorUrlFor = (slug: string) => sponsorTiers.find((t) => t.slug === slug)?.url || sponsorsUrl
  const selectedSlug = selectedCredit?.tier_slug ?? null
  const selected = tiers.find((t) => t.slug === selectedSlug) ?? null

  const days = useMemo(() => {
    const grouped = new Map<string, { key: string; label: string; slots: Slot[] }>()

    slots.forEach((slot) => {
      const key = localDateKey(slot.start, timezone)
      const day = grouped.get(key)

      if (day) {
        day.slots.push(slot)
      } else {
        grouped.set(key, { key, label: formatLocalDay(slot.start, timezone), slots: [slot] })
      }
    })

    return Array.from(grouped.values())
  }, [slots, timezone])

  useEffect(() => {
    if (days.length === 0) {
      setSelectedDay(null)
      return
    }

    if (!selectedDay || !days.some((day) => day.key === selectedDay)) {
      setSelectedDay(days[0].key)
    }
  }, [days, selectedDay])

  const selectedDaySlots = days.find((day) => day.key === selectedDay)?.slots ?? []

  const form = useForm({
    credit_id: '',
    client_name: prefillName(bookingUser),
    company_name: '',
    website: '',
    notes: '',
    role: '',
    team_size: '',
    budget: '',
    starts_at: '',
    sa_ref: referralFromUrl(),
  })

  const page = usePage()
  const errors = (page.props.errors ?? {}) as Record<string, string>

  useEffect(() => {
    if (step !== 'details' || !selectedCredit?.tier_slug) return

    const controller = new AbortController()
    let active = true
    const timeout = window.setTimeout(() => controller.abort(), 15_000)
    setSlotsLoading(true)
    setSlotsError(null)
    const params = new URLSearchParams({ tier: selectedCredit.tier_slug, credit: String(selectedCredit.id) })
    fetch(`/book/availability?${params}`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('Availability request failed')
        const data = await response.json()
        if (!Array.isArray(data?.slots) || !data.slots.every((slot: Slot) => (
          slot && typeof slot.start === 'string' && typeof slot.end === 'string'
          && Number.isFinite(Date.parse(slot.start)) && Number.isFinite(Date.parse(slot.end))
          && Date.parse(slot.end) > Date.parse(slot.start)
        ))) throw new Error('Invalid availability response')
        if (active) setSlots(data.slots)
      })
      .catch(() => {
        if (!active) return
        setSlots([])
        setSlotsError('I couldn’t load available times. Retry, or send a note and I’ll find a time.')
      })
      .finally(() => {
        window.clearTimeout(timeout)
        if (active) setSlotsLoading(false)
      })

    return () => {
      active = false
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [selectedCredit, step, availabilityAttempt])

  const retryAvailability = () => {
    setSlotsLoading(true)
    setSlotsError(null)
    setSlots([])
    setSelectedDay(null)
    form.setData('starts_at', '')
    setAvailabilityAttempt((attempt) => attempt + 1)
  }

  const startBooking = (credit: Credit) => {
    setSelectedCredit(credit)
    setSlots([])
    setSlotsLoading(true)
    setSlotsError(null)
    setSelectedDay(null)
    form.setData((data) => ({ ...data, credit_id: String(credit.id), starts_at: '' }))
    setStep('details')
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    form.post('/book', {
      onSuccess: () => trackLeadConversion('consultation_booking'),
    })
  }

  return (
    <>
      <Head><meta head-key="referrer" name="referrer" content="no-referrer" /></Head>

      <section className="relative overflow-hidden border-b border-slate-200 dark:border-slate-800 bg-gradient-to-b from-slate-50 dark:from-slate-950 via-white dark:via-slate-950 to-slate-50 dark:to-slate-950">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(245,158,11,0.08),_transparent_55%)]" />
        <div className="container relative mx-auto py-16 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-md border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 px-3 py-1.5 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {callCredits.length > 0 ? 'Your credits' : 'Pricing plans'}
              </span>
            </div>
            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl lg:text-5xl"
            >
              {callCredits.length > 0 ? 'Pick a time for your call.' : 'Sponsor on GitHub, then book a time.'}
            </motion.h1>
            <p className="mt-4 text-lg leading-7 text-slate-500 dark:text-slate-400">
              {callCredits.length > 0 ? 'Pick' : 'Sponsor me on GitHub, then pick'} a time at least {minLeadHours} hours ahead. I check my calendar and
              approve each request by email. Your credit is held until then and comes back if I decline.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white dark:bg-slate-900 py-14 sm:py-16">
        <div className="container mx-auto">
          <AnimatePresence mode="wait">
            {step === 'plans' ? (
              <motion.div
                key="plans"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mx-auto max-w-5xl"
              >
                {hasScanCredit && (
                  <div className="mb-8 flex flex-col items-start justify-between gap-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:flex-row sm:items-center">
                    <p className="text-sm text-slate-700 dark:text-slate-200">
                      You have an open-source scan credit. Tell me which repo to scan.
                    </p>
                    <a
                      href={scanUrl}
                      className="shrink-0 bg-slate-900 px-5 py-3 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                    >
                      Request a scan
                    </a>
                  </div>
                )}
                {callCredits.length > 0 ? (
                  <div className="grid gap-6 md:grid-cols-3">
                    {callCredits.map((credit) => {
                      const tier = tiers.find((t) => t.slug === credit.tier_slug)
                      const accent = accentBySlug[credit.tier_slug ?? ''] ?? accentBySlug.pro
                      return (
                        <div
                          key={credit.id}
                          className={`flex flex-col border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 ${accent.border} border-t-[3px] border-b-[3px]`}
                        >
                          <div className="flex-1 px-6 pb-4 pt-8 text-center">
                            <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                              {credit.tier_name ?? tier?.name}
                            </p>
                            <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                              {tier?.duration_minutes ?? 60}-min call
                            </p>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Book by {formatDate(credit.expires_at)}</p>
                          </div>
                          <div className="p-6">
                            <button
                              type="button"
                              disabled={!tier}
                              onClick={() => startBooking(credit)}
                              className={`w-full py-3 text-center font-mono text-xs font-semibold uppercase tracking-[0.16em] text-white transition ${accent.button} disabled:opacity-50`}
                            >
                              Book this call
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <>
                    <div className="grid gap-6 md:grid-cols-3">
                    {tiers.map((tier) => {
                      const accent = accentBySlug[tier.slug] ?? accentBySlug.pro
                      const isRecommended = tier.slug === 'max'
                      return (
                        <div
                          key={tier.slug}
                          className={`relative flex flex-col border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 ${accent.border} border-t-[3px] border-b-[3px] ${isRecommended ? `ring-2 ${accent.ring} ring-offset-2` : ''}`}
                        >
                          {isRecommended && (
                            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-700 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-white shadow-sm">
                              Recommended
                            </span>
                          )}
                          <div className="px-6 pb-4 pt-8 text-center">
                            <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                              {tier.name}
                            </p>
                            <p className="mt-3 text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
                              {tier.price_display}
                              <span className="ml-1 text-base font-medium text-slate-600 dark:text-slate-300">/ one time</span>
                            </p>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{tier.duration_minutes} minutes · book within 60 days</p>
                          </div>
                          <ul className="flex-1 border-t border-slate-100 dark:border-slate-800 px-6">
                            {tier.features.map((f) => (
                              <li
                                key={f.label}
                                className="flex items-start gap-3 border-b border-slate-100 dark:border-slate-800 py-3.5 text-sm text-slate-700 dark:text-slate-200 last:border-b-0"
                              >
                                <span
                                  role="img"
                                  aria-label={f.included ? 'Included' : 'Not included'}
                                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                                    f.included ? 'bg-amber-500 text-amber-950' : 'bg-rose-600 text-white'
                                  }`}
                                >
                                  {f.included ? <Check className="h-3 w-3" aria-hidden="true" /> : <X className="h-3 w-3" aria-hidden="true" />}
                                </span>
                                <span className={f.included ? '' : 'text-slate-600 dark:text-slate-300'}>{f.label}</span>
                              </li>
                            ))}
                          </ul>
                          <div className="p-6">
                            <a
                              href={sponsorUrlFor(tier.slug)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`block w-full py-3 text-center font-mono text-xs font-semibold uppercase tracking-[0.16em] text-white transition ${accent.button}`}
                            >
                              Sponsor on GitHub
                            </a>
                          </div>
                        </div>
                      )
                    })}
                    </div>
                    <div className="mt-6 flex flex-col items-start justify-between gap-4 border border-slate-200 dark:border-slate-800 border-t-[3px] border-t-amber-600 bg-white dark:bg-slate-900 p-6 sm:flex-row sm:items-center">
                      <div>
                        <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Monthly</p>
                        <p className="mt-2 text-lg font-bold text-slate-900 dark:text-white">
                          $899/mo · 2 × Max calls + 1 open-source scan each month (save $299 vs. buying two Max calls)
                        </p>
                      </div>
                      <a
                        href={sponsorUrlFor('monthly')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`shrink-0 px-5 py-3 text-center font-mono text-xs font-semibold uppercase tracking-[0.16em] text-white transition ${accentBySlug.max.button}`}
                      >
                        Sponsor on GitHub
                      </a>
                    </div>
                  </>
                )}
                {!hasGithubIdentity && callCredits.length === 0 && (
                  <div className="mt-8 flex flex-col items-start justify-between gap-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:flex-row sm:items-center">
                    {bookingUser ? (
                      <>
                        <p className="text-sm text-slate-700 dark:text-slate-200">
                          Sponsored on GitHub? Sign out, then sign in with GitHub using the same email, and your credits appear here.
                        </p>
                        <button
                          type="button"
                          onClick={() => router.post('/logout')}
                          className="shrink-0 border border-slate-300 dark:border-slate-700 px-5 py-3 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-slate-700 dark:text-slate-200 transition hover:bg-slate-50 dark:hover:bg-slate-950"
                        >
                          Sign out
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-slate-700 dark:text-slate-200">Already sponsored? Sign in with GitHub to book.</p>
                        <a
                          href={githubLinkUrl}
                          className="shrink-0 bg-slate-900 px-5 py-3 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                        >
                          Sign in with GitHub
                        </a>
                      </>
                    )}
                  </div>
                )}
                <ManualPaymentNote contactUrl={contactUrl} contactEmail={contactEmail} />
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
                  className="mb-6 inline-flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </button>

                <form onSubmit={submit} className="space-y-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8">
                  <div>
                    <p className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {selected?.name}
                    </p>
                    <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                      {selected?.duration_minutes}-min call
                    </p>
                    {selectedCredit && (
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Paid with your sponsor credit. Book by {formatDate(selectedCredit.expires_at)}.
                      </p>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block text-sm">
                      <span className="mb-1.5 block font-medium text-slate-700 dark:text-slate-200">Name</span>
                      <input
                        required
                        value={form.data.client_name}
                        onChange={(e) => form.setData('client_name', e.target.value)}
                        className={inputClass}
                      />
                      {errors.client_name && <p className="mt-1 text-xs text-rose-600">{errors.client_name}</p>}
                    </label>
                    <label className="block text-sm">
                      <span className="mb-1.5 block font-medium text-slate-700 dark:text-slate-200">Company name</span>
                      <input
                        required
                        value={form.data.company_name}
                        onChange={(e) => form.setData('company_name', e.target.value)}
                        className={inputClass}
                      />
                      {errors.company_name && <p className="mt-1 text-xs text-rose-600">{errors.company_name}</p>}
                    </label>
                    <label className="block text-sm">
                      <span className="mb-1.5 block font-medium text-slate-700 dark:text-slate-200">Website</span>
                      <input
                        type="text"
                        inputMode="url"
                        required
                        placeholder="acme.com"
                        value={form.data.website}
                        onChange={(e) => form.setData('website', e.target.value)}
                        className={inputClass}
                      />
                      {errors.website && <p className="mt-1 text-xs text-rose-600">{errors.website}</p>}
                    </label>
                    <label className="block text-sm">
                      <span className="mb-1.5 block font-medium text-slate-700 dark:text-slate-200">Role (optional)</span>
                      <input
                        value={form.data.role}
                        onChange={(e) => form.setData('role', e.target.value)}
                        className={inputClass}
                      />
                      {errors.role && <p className="mt-1 text-xs text-rose-600">{errors.role}</p>}
                    </label>
                    <label className="block text-sm">
                      <span className="mb-1.5 block font-medium text-slate-700 dark:text-slate-200">Team size (optional)</span>
                      <select
                        value={form.data.team_size}
                        onChange={(e) => form.setData('team_size', e.target.value)}
                        className={inputClass}
                      >
                        <option value="">Choose…</option>
                        {['Just me', '2-10', '11-50', '51-200', '200+'].map((size) => (
                          <option key={size} value={size}>{size}</option>
                        ))}
                      </select>
                      {errors.team_size && <p className="mt-1 text-xs text-rose-600">{errors.team_size}</p>}
                    </label>
                    <label className="block text-sm">
                      <span className="mb-1.5 block font-medium text-slate-700 dark:text-slate-200">Budget (optional)</span>
                      <select
                        value={form.data.budget}
                        onChange={(e) => form.setData('budget', e.target.value)}
                        className={inputClass}
                      >
                        <option value="">Choose…</option>
                        {['Under $1k', '$1k-$5k', '$5k-$20k', '$20k+', 'Not sure yet'].map((budget) => (
                          <option key={budget} value={budget}>{budget}</option>
                        ))}
                      </select>
                      {errors.budget && <p className="mt-1 text-xs text-rose-600">{errors.budget}</p>}
                    </label>
                  </div>

                  <label className="block text-sm">
                    <span className="mb-1.5 block font-medium text-slate-700 dark:text-slate-200">What do you need help with?</span>
                    <textarea
                      rows={4}
                      required
                      value={form.data.notes}
                      onChange={(e) => form.setData('notes', e.target.value)}
                      className={inputClass}
                    />
                    {errors.notes && <p className="mt-1 text-xs text-rose-600">{errors.notes}</p>}
                  </label>

                  {bookingUser && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">Updates go to {bookingUser.email}.</p>
                  )}

                   <div>
                     <div className="mb-4">
                       <label htmlFor="booking-timezone" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                         Timezone
                       </label>
                       <select
                         id="booking-timezone"
                         value={timezone}
                         onChange={(e) => {
                           setTimezone(e.target.value)
                           form.setData('starts_at', '')
                         }}
                         className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none ring-slate-400 focus:ring-2"
                       >
                         {timezones.map((zone) => (
                           <option key={zone} value={zone}>
                             {timezoneLabel(zone)}
                           </option>
                         ))}
                       </select>
                     </div>
                     <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Pick a time</span>
                    {slotsLoading ? (
                      <div role="status" className="flex items-center gap-2 py-8 text-sm text-slate-500 dark:text-slate-400">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading open slots…
                      </div>
                    ) : slotsError ? (
                      <div role="alert" className="border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 px-4 py-5 text-sm text-rose-800 dark:text-rose-300">
                        <p>{slotsError}</p>
                        <div className="mt-3 flex items-center gap-4">
                          <button
                            type="button"
                            onClick={retryAvailability}
                            className="border border-rose-300 bg-white dark:bg-slate-900 px-4 py-2 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700"
                          >
                            Retry
                          </button>
                          <a href="/contact" className="underline underline-offset-4">Send a note</a>
                        </div>
                      </div>
                    ) : slots.length === 0 ? (
                      <p className="border border-dashed border-slate-200 dark:border-slate-800 px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                        No open slots right now. Please check back later or{' '}
                        <a href="/contact" className="font-medium text-slate-700 dark:text-slate-200 underline underline-offset-4">send a note</a>{' '}
                        to arrange a time.
                      </p>
                    ) : (
                      <>
                        <div className="flex gap-2 overflow-x-auto pb-2" role="tablist" aria-label="Available days">
                          {days.map((day) => {
                            const active = selectedDay === day.key

                            return (
                              <button
                                key={day.key}
                                type="button"
                                role="tab"
                                aria-selected={active}
                                onClick={() => {
                                  setSelectedDay(day.key)
                                   if (form.data.starts_at && localDateKey(form.data.starts_at, timezone) !== day.key) {
                                    form.setData('starts_at', '')
                                  }
                                }}
                                className={`min-w-36 shrink-0 border px-3 py-2 text-left transition ${
                                  active
                                    ? 'border-slate-900 bg-slate-900 text-white'
                                    : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-slate-400'
                                }`}
                              >
                                <span className="block text-sm font-medium">{day.label}</span>
                                <span className={`mt-0.5 block text-xs ${active ? 'text-slate-300' : 'text-slate-400'}`}>
                                  {day.slots.length} {day.slots.length === 1 ? 'slot' : 'slots'}
                                </span>
                              </button>
                            )
                          })}
                        </div>

                        <div className="mt-3 grid max-h-72 gap-2 overflow-y-auto sm:grid-cols-2">
                          {selectedDaySlots.map((slot) => {
                          const active = form.data.starts_at === slot.start
                          return (
                            <button
                              key={slot.start}
                              type="button"
                              onClick={() => form.setData('starts_at', slot.start)}
                              className={`border px-3 py-2 text-left text-sm transition ${
                                active
                                  ? 'border-slate-900 bg-slate-900 text-white'
                                  : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-slate-400'
                              }`}
                            >
                              {formatLocal(slot.start, timezone)}
                            </button>
                          )
                          })}
                        </div>
                      </>
                    )}
                    {errors.starts_at && <p className="mt-1 text-xs text-rose-600">{errors.starts_at}</p>}
                    {errors.credit_id && <p className="mt-1 text-xs text-rose-600">{errors.credit_id}</p>}
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
                    I’ll check my calendar and confirm within 48 hours. Your credit is held until then. If I can’t make it, you get it back.
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
