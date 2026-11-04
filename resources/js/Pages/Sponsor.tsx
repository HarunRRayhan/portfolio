import { motion } from 'framer-motion'
import {
  ArrowRight,
  Coins,
  Coffee,
  Fuel,
  Heart,
  Plane,
  Repeat2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Github } from '@/lib/icons'

type SponsorProps = {
  canonicalUrl?: string
  sponsorsUrl: string
  contactUrl: string
  contactEmail: string
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

function SponsorCard({ sponsorsUrl }: SponsorProps) {
  return (
    <div id="sponsor-checkout" className="relative overflow-hidden rounded-2xl border border-[#30363d] bg-[#0d1117] p-6 shadow-2xl sm:p-7">
      <div className="flex items-center justify-between border-b border-[#30363d] pb-5">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#161b22] ring-1 ring-[#30363d]">
            <Github aria-hidden="true" className="h-6 w-6 text-[#e6edf3]" />
          </span>
          <div>
            <p className="text-sm font-semibold text-[#e6edf3]">GitHub Sponsors</p>
            <p className="text-xs text-[#8b949e]">Give once or monthly</p>
          </div>
        </div>
        <Heart aria-hidden="true" className="h-5 w-5 fill-[#db61a2] text-[#db61a2]" />
      </div>

      <p className="mt-6 text-sm leading-6 text-[#c9d1d9]">
        Sponsorships run through GitHub Sponsors. Pick a tier or any amount you like, and GitHub handles the payment.
      </p>

      <a
        href={sponsorsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-flex w-full items-center justify-center gap-2.5 rounded-lg border border-[#db61a2]/40 bg-[#bf3989] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#a82e78] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#db61a2]/40"
      >
        <Github aria-hidden="true" className="h-5 w-5" />
        Sponsor on GitHub
        <Heart aria-hidden="true" className="h-4 w-4 fill-current" />
      </a>

      <a
        href="#other-payment-methods"
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#30363d] bg-[#21262d] px-5 py-3 text-sm font-medium text-[#e6edf3] transition hover:border-[#8b949e] hover:bg-[#30363d] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#8b949e]/40"
      >
        GitHub doesn’t support my payment method
        <ArrowRight aria-hidden="true" className="h-4 w-4" />
      </a>
    </div>
  )
}

export default function Sponsor({ sponsorsUrl, contactUrl, contactEmail }: SponsorProps) {
  return (
    <>

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
                className="relative mt-8 max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-5"
                aria-label="Your support fuels the next flight"
              >
                <div aria-hidden="true" className="absolute -right-10 -top-12 h-28 w-28 rounded-full bg-amber-400/10 blur-2xl" />
                <div className="relative">
                  <div className="flex items-center justify-between gap-4">
                    <span className="inline-flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">
                      <Coins className="h-4 w-4 text-amber-300" />
                      Support / fuel / flight
                    </span>
                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                      <Sparkles className="h-3 w-3" />
                      airborne
                    </span>
                  </div>

                  <div className="relative mt-5 h-16" aria-hidden="true">
                    <div className="absolute left-7 right-8 top-1/2 border-t border-dashed border-amber-300/30" />
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 rounded-xl border border-amber-300/20 bg-amber-400/10 p-2 text-amber-300">
                      <Coins className="h-5 w-5" />
                    </div>
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-violet-300/20 bg-violet-400/10 p-2 text-violet-200">
                      <Fuel className="h-5 w-5" />
                    </div>
                    <motion.div
                      animate={{ x: [0, 8, 0], y: [0, -3, 0], rotate: [0, 2, 0] }}
                      transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute right-0 top-1/2 -translate-y-1/2 text-amber-300 drop-shadow-[0_0_8px_rgba(252,211,77,0.75)]"
                    >
                      <Plane className="h-8 w-8" fill="currentColor" strokeWidth={1.5} />
                    </motion.div>
                  </div>

                  <p className="mt-3 text-sm text-slate-300">A little fuel for the next thing I publish.</p>
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.12 }}
              className="relative mx-auto w-full max-w-md"
            >
              <div aria-hidden="true" className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-amber-400/50 via-violet-400/20 to-transparent blur-lg" />
              <SponsorCard sponsorsUrl={sponsorsUrl} contactUrl={contactUrl} contactEmail={contactEmail} />
            </motion.div>
          </div>
        </div>
      </section>

      <section id="support-options" className="bg-white dark:bg-slate-900 py-20 sm:py-24">
        <div className="container mx-auto">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Support the work</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">Choose what works for you.</h2>
            <p className="mt-4 text-base leading-7 text-slate-500 dark:text-slate-400">
              Give once or every month. GitHub handles the payment.
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-4xl gap-4 md:grid-cols-3">
            {[
              {
                icon: Coffee,
                title: 'Pick a tier',
                description: 'Choose a sponsor tier on GitHub, or set a custom amount.',
              },
              {
                icon: Repeat2,
                title: 'Once or monthly',
                description: 'Give once, or keep it going every month. Cancel any time on GitHub.',
              },
              {
                icon: ShieldCheck,
                title: 'Pay on GitHub',
                description: 'Your payment details stay with GitHub, not on this site.',
              },
            ].map(({ icon: Icon, title, description }) => (
              <div key={title} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-5">
                <Icon className="h-5 w-5 text-slate-900 dark:text-white" />
                <h3 className="mt-5 text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="other-payment-methods" className="scroll-mt-24 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-20 sm:py-24">
        <div className="container mx-auto">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Another way to pay</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">GitHub doesn’t support your payment method?</h2>
            <p className="mt-4 text-base leading-7 text-slate-500 dark:text-slate-400">
              GitHub Sponsors depends on the payment methods GitHub accepts in your country. If yours isn’t one of them, you can still sponsor. I’ll set it up with you by hand.
            </p>
          </div>

          <ol className="mx-auto mt-12 grid max-w-4xl gap-4 md:grid-cols-3">
            {[
              {
                title: 'Check GitHub first',
                description: 'Open the sponsor page and go to checkout. If your card, bank or wallet isn’t offered there, carry on to the next step.',
              },
              {
                title: 'Send me a short note',
                description: 'Use the contact page or email me. Say your country, the amount, whether it is once or monthly, and which payment methods you can use.',
              },
              {
                title: 'I reply with options',
                description: 'I’ll answer with what can work for your country and we agree on one. I won’t ask for card details over email.',
              },
            ].map(({ title, description }, i) => (
              <li key={title} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-5">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 dark:bg-white text-xs font-bold text-white dark:text-slate-900">{i + 1}</span>
                <h3 className="mt-4 text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>
              </li>
            ))}
          </ol>

          <div className="mx-auto mt-10 flex max-w-4xl flex-col gap-3 sm:flex-row sm:justify-center">
            <a
              href={contactUrl}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 dark:bg-white px-5 py-3 text-sm font-semibold text-white dark:text-slate-900 transition hover:bg-slate-700 dark:hover:bg-slate-200"
            >
              Open the contact page
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </a>
            <a
              href={`mailto:${contactEmail}`}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 px-5 py-3 text-sm font-semibold text-slate-900 dark:text-white transition hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Email {contactEmail}
            </a>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-20 sm:py-24">
        <div className="container mx-auto">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:gap-20">
            <div>
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Why sponsor me?</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">Because useful work takes time.</h2>
              <p className="mt-5 text-base leading-7 text-slate-500 dark:text-slate-400">
                Most of what I publish is free to read. I share the lessons I wish I had earlier, build tools for problems I keep seeing, and leave the rough edges visible. Your support helps me keep that work public instead of putting it behind a paywall.
              </p>
              <a href="/about" className="group mt-7 inline-flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white transition hover:text-amber-700 dark:hover:text-amber-300">
                See what I work on
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {supportPoints.map(({ icon: Icon, title, description }) => (
                <div key={title} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                  <Icon className="h-5 w-5 text-slate-900 dark:text-white" />
                  <h3 className="mt-5 text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-16 flex flex-col gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div className="flex items-start gap-4">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-500">
                <Heart className="h-5 w-5 fill-current" />
              </span>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">Thanks for being here.</p>
                <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">Reading, sharing, and sending a note count too.</p>
              </div>
            </div>
            <a href="#sponsor-checkout" className="group inline-flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white transition hover:text-amber-700 dark:hover:text-amber-300">
              Sponsor this work
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
