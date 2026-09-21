import { Head, useForm } from '@inertiajs/react'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Check,
  Coffee,
  Heart,
  LockKeyhole,
  Repeat2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import type { FormEvent } from 'react'
import type { LucideIcon } from 'lucide-react'
import { useState } from 'react'

type Cadence = 'once' | 'monthly'

type SponsorProps = {
  canonicalUrl?: string
  stripeConfigured?: boolean
  checkoutStatus?: 'success' | 'cancelled' | null
  minAmountCents?: number
  maxAmountCents?: number
  suggestedAmountCents?: number[]
}

type SupportPoint = {
  icon: LucideIcon
  title: string
  description: string
}

const supportPoints: SupportPoint[] = [
  {
    icon: Sparkles,
    title: 'You get the notes',
    description: 'Practical writing about cloud, DevOps, and building software without a paywall.',
  },
  {
    icon: Coffee,
    title: 'It stays independent',
    description: 'Support gives me room to publish useful work that is not tied to a client or a sales pitch.',
  },
  {
    icon: Heart,
    title: 'It funds the boring bits',
    description: 'Hosting, tools, test environments, and the time it takes to make things clear all cost something.',
  },
]

const formatCents = (cents: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)

const amountValue = (cents: number) => (cents / 100).toFixed(2)

export default function Sponsor({
  canonicalUrl = '/sponsor-me',
  stripeConfigured = false,
  checkoutStatus = null,
  minAmountCents = 100,
  maxAmountCents = 1_000_000,
  suggestedAmountCents = [500, 1_000, 2_500, 5_000],
}: SponsorProps) {
  const [cadence, setCadence] = useState<Cadence>('once')
  const form = useForm({
    amount: amountValue(1_000),
    cadence: 'once' as Cadence,
  })
  const formErrors = form.errors as Record<string, string | undefined>

  const chooseCadence = (nextCadence: Cadence) => {
    setCadence(nextCadence)
    form.setData('cadence', nextCadence)
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    form.post('/sponsor-me/checkout', { preserveScroll: true })
  }

  const suggestedAmounts = suggestedAmountCents.filter(
    (amount) => amount >= minAmountCents && amount <= maxAmountCents,
  )

  return (
    <>
      <Head>
        <title>Why Sponsor My Work? | Harun R. Rayhan</title>
        <meta
          name="description"
          content="Support Harun R. Rayhan's practical technical writing, small tools, and independent experiments with a one-time or monthly contribution."
        />
        <meta property="og:title" content="Why Sponsor My Work? | Harun R. Rayhan" />
        <meta
          property="og:description"
          content="Support the practical technical writing, small tools, and independent experiments shared by Harun R. Rayhan."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Why Sponsor My Work? | Harun R. Rayhan" />
        <meta
          name="twitter:description"
          content="Support the practical technical writing, small tools, and independent experiments shared by Harun R. Rayhan."
        />
        <link rel="canonical" href={canonicalUrl} />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Why Sponsor My Work?',
            description: 'Support Harun R. Rayhan\'s practical technical writing, small tools, and independent experiments.',
            url: canonicalUrl,
            about: {
              '@type': 'Person',
              name: 'Harun R. Rayhan',
              url: 'https://harun.dev',
            },
          })}
        </script>
      </Head>

      <section className="relative isolate overflow-hidden bg-slate-950 text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div aria-hidden="true" className="pointer-events-none absolute -right-32 top-10 h-96 w-96 rounded-full bg-amber-500/20 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -left-40 bottom-0 h-80 w-80 rounded-full bg-violet-500/15 blur-3xl" />

        <div className="container relative mx-auto py-24 pt-32 sm:py-28 sm:pt-40 lg:py-32 lg:pt-44">
          <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.06] px-3 py-1.5"
              >
                <Heart className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300">
                  Why sponsor this work
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.08 }}
                className="mt-6 max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
              >
                Help me keep the useful stuff free.
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.16 }}
                className="mt-6 max-w-xl text-lg leading-8 text-slate-300"
              >
                I turn real infrastructure problems into practical notes, small tools, and answers people can use.
                Sponsorship helps pay for the time, services, and experiments behind that work.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.24 }}
                className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-slate-400"
              >
                <span className="inline-flex items-center gap-2">
                  <LockKeyhole className="h-4 w-4 text-emerald-400" />
                  Checkout by Stripe
                </span>
                <span className="inline-flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400" />
                  Choose your amount
                </span>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.12 }}
              className="relative mx-auto w-full max-w-md"
            >
              <div aria-hidden="true" className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-amber-400/50 via-violet-400/20 to-transparent blur-lg" />
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.07] p-6 shadow-2xl backdrop-blur sm:p-8">
                <div className="flex items-center justify-between border-b border-white/10 pb-5">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/15 text-amber-300">
                      <Coffee className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-white">support.log</p>
                      <p className="font-mono text-[11px] text-slate-500">public / 2026</p>
                    </div>
                  </div>
                  <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                    open
                  </span>
                </div>

                <div className="mt-7 space-y-4 font-mono text-sm leading-6">
                  <p className="text-slate-500"><span className="text-amber-300">$</span> tail -f /more-good-stuff</p>
                  <p className="text-slate-200">new notes, experiments, and tools</p>
                  <p className="text-slate-500">// thanks for helping me make time for this</p>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/10 bg-black/10 p-3">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">once</p>
                    <p className="mt-1 text-sm font-semibold text-white">Your call</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/10 p-3">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">monthly</p>
                    <p className="mt-1 text-sm font-semibold text-white">Your call</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section id="support-options" className="bg-white py-20 sm:py-24">
        <div className="container mx-auto">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Pick a cadence</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Choose what works for you.</h2>
            <p className="mt-4 text-base leading-7 text-slate-500">
              Pick an amount, choose once or monthly, then finish securely on Stripe.
            </p>
          </div>

          {checkoutStatus === 'success' && (
            <div className="mx-auto mt-8 max-w-2xl rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm text-emerald-800" role="status">
              If you just finished checkout, thank you. It helps keep the work here public.
            </div>
          )}

          {checkoutStatus === 'cancelled' && (
            <div className="mx-auto mt-8 max-w-2xl rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm text-slate-600" role="status">
              No problem. You can choose an amount and try again whenever you like.
            </div>
          )}

          <div className="mx-auto mt-12 max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_20px_60px_-36px_rgba(15,23,42,0.32)] sm:p-8">
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
              {([
                { value: 'once' as const, label: 'One-time', icon: Coffee },
                { value: 'monthly' as const, label: 'Monthly', icon: Repeat2 },
              ]).map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={cadence === value}
                  onClick={() => chooseCadence(value)}
                  className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition ${
                    cadence === value
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>

            <form onSubmit={submit} className="mt-8">
              <label htmlFor="sponsor-amount" className="block text-sm font-semibold text-slate-900">
                Your amount
              </label>
              <div className="relative mt-2">
                <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-xl font-semibold text-slate-400">$</span>
                <input
                  id="sponsor-amount"
                  name="amount"
                  type="number"
                  inputMode="decimal"
                  min={amountValue(minAmountCents)}
                  max={amountValue(maxAmountCents)}
                  step="0.01"
                  value={form.data.amount}
                  onChange={(event) => form.setData('amount', event.target.value)}
                  className="w-full rounded-xl border border-slate-300 py-4 pl-10 pr-4 text-2xl font-semibold text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
                  aria-describedby="sponsor-amount-help"
                  required
                />
              </div>
              <p id="sponsor-amount-help" className="mt-2 text-xs text-slate-500">
                Minimum {formatCents(minAmountCents)}. Choose any amount up to {formatCents(maxAmountCents)}.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {suggestedAmounts.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => form.setData('amount', amountValue(amount))}
                    className="rounded-full border border-slate-200 px-3.5 py-1.5 text-sm font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                  >
                    {formatCents(amount)}
                  </button>
                ))}
              </div>

              {(formErrors.amount || formErrors.cadence || formErrors.checkout) && (
                <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
                  {formErrors.amount || formErrors.cadence || formErrors.checkout}
                </div>
              )}

              <button
                type="submit"
                disabled={form.processing || !stripeConfigured}
                className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-4 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {form.processing ? 'Opening Stripe...' : stripeConfigured ? 'Continue to Stripe Checkout' : 'Checkout is unavailable'}
                {!form.processing && <ArrowRight className="h-4 w-4" />}
              </button>

              <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-slate-500">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Stripe handles your payment details. This site never sees your card number.
              </p>
            </form>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-50 py-20 sm:py-24">
        <div className="container mx-auto">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:gap-20">
            <div>
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Why sponsor me?</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Because useful work takes time.</h2>
              <p className="mt-5 text-base leading-7 text-slate-500">
                Most of what I publish is free to read. I share the lessons I wish I had earlier, build tools for problems I keep seeing, and leave the rough edges visible. Your support helps me keep that work public instead of putting it behind a paywall.
              </p>
              <a href="/about" className="group mt-7 inline-flex items-center gap-2 text-sm font-semibold text-slate-900 transition hover:text-amber-700">
                See what I work on
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {supportPoints.map(({ icon: Icon, title, description }) => (
                <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <Icon className="h-5 w-5 text-slate-900" />
                  <h3 className="mt-5 text-sm font-semibold text-slate-900">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-16 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div className="flex items-start gap-4">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-500">
                <Heart className="h-5 w-5 fill-current" />
              </span>
              <div>
                <p className="font-semibold text-slate-900">Thanks for being here.</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">Reading, sharing, and sending a note count too.</p>
              </div>
            </div>
            <a href="#support-options" className="group inline-flex items-center gap-2 text-sm font-semibold text-slate-900 transition hover:text-amber-700">
              Choose an amount
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
