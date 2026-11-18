import { Link, useForm, usePage } from '@inertiajs/react'
import { ArrowRight, Heart } from 'lucide-react'
import { Github } from '@/lib/icons'
import { FormEvent, useState } from 'react'
import Turnstile from '@/Components/Turnstile'
import { COUNTRY_OPTIONS } from '@/lib/countries'
import { useIsDark } from '@/lib/theme'
import { cn } from '@/lib/utils'

type Plan = 'monthly' | 'yearly' | 'lifetime'
type Props = {
  prefill: { name: string; email: string; country: string }
  plans: Record<Plan, { label: string; price: string }>
  mine: { id: string; plan: Plan; method: string; status: string; url: string; createdAt: string }[]
}

const statusLabel: Record<string, string> = { new: 'Waiting for payment', paid: 'Payment sent, checking', approved: 'Approved', declined: 'Declined' }

export default function Pay({ prefill, plans, mine }: Props) {
  const page = usePage().props as { sponsorsUrl?: string; turnstileSiteKey?: string | null }
  const sponsorsUrl = page.sponsorsUrl ?? '/sponsor-me'
  const siteKey = page.turnstileSiteKey
  const dark = useIsDark()
  const [widgetKey, setWidgetKey] = useState(0)

  const form = useForm({ name: prefill.name, email: prefill.email, country: prefill.country, plan: 'yearly' as Plan, method: prefill.country === 'BD' ? 'bkash' : 'other', note: '', 'cf-turnstile-response': '' })
  const methods = [
    { id: 'github', label: 'GitHub Sponsors', hint: 'Card or PayPal, in every country GitHub supports.' },
    ...(form.data.country === 'BD' ? [{ id: 'bkash', label: 'bKash', hint: 'I email you the number and amount in BDT.' }] : []),
    { id: 'other', label: 'Another method', hint: 'Tell me what you can use; I reply with what works.' },
  ]
  const setCountry = (country: string) => form.setData((d) => ({ ...d, country, method: d.method === 'bkash' && country !== 'BD' ? 'other' : d.method }))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    form.post('/sponsor-me/pay', { onFinish: () => setWidgetKey((k) => k + 1) })
  }

  const field = 'mt-1 block w-full rounded-lg border-slate-300 bg-white text-sm shadow-sm focus:border-amber-400 focus:ring-amber-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white'
  const label = 'block text-sm font-medium text-slate-700 dark:text-slate-200'
  const err = (m?: string) => m && <p className="mt-1 text-xs text-red-600">{m}</p>

  return (
    <div className="pt-24">
      <section className="mx-auto max-w-2xl px-4 pb-24 pt-8 sm:px-6">
        <h1 className="flex items-center gap-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
          <Heart className="h-8 w-8 fill-rose-500 text-rose-500" aria-hidden /> Sponsor another way
        </h1>
        <p className="mt-3 text-slate-600 dark:text-slate-300">
          GitHub Sponsors doesn't work everywhere. Tell me where you are and how you can pay, and I'll unlock the Intermediate and Advanced roadmap topics by hand.
        </p>

        {mine.length > 0 && (
          <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40">
            <p className="text-sm font-semibold text-amber-950 dark:text-amber-100">Your requests</p>
            <ul className="mt-2 space-y-1 text-sm">
              {mine.map((r) => (
                <li key={r.id}>
                  <Link href={r.url} className="text-amber-900 underline underline-offset-2 dark:text-amber-200">
                    {plans[r.plan]?.label ?? r.plan} · {r.method === 'bkash' ? 'bKash' : 'Another method'} · {statusLabel[r.status] ?? r.status}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={submit} className="mt-8 space-y-5 rounded-3xl border border-slate-200 bg-white p-5 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className={label}>Name</label>
              <input id="name" required maxLength={120} value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} className={field} autoComplete="name" />
              {err(form.errors.name)}
            </div>
            <div>
              <label htmlFor="email" className={label}>Email</label>
              <input id="email" type="email" required value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} className={field} autoComplete="email" />
              <p className="mt-1 text-xs text-slate-500">Access unlocks for the account that signs in with this email.</p>
              {err(form.errors.email)}
            </div>
          </div>

          <div>
            <label htmlFor="country" className={label}>Country</label>
            <select id="country" required value={form.data.country} onChange={(e) => setCountry(e.target.value)} className={field}>
              <option value="" disabled>Choose your country</option>
              {COUNTRY_OPTIONS.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
            {err(form.errors.country)}
          </div>

          <fieldset>
            <legend className={label}>Plan</legend>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {(Object.keys(plans) as Plan[]).map((p) => (
                <label key={p} className={cn('cursor-pointer rounded-xl border px-3 py-2.5 text-center text-sm', form.data.plan === p ? 'border-amber-400 bg-amber-50 font-semibold text-amber-950 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100' : 'border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-200')}>
                  <input type="radio" name="plan" value={p} checked={form.data.plan === p} onChange={() => form.setData('plan', p)} className="sr-only" />
                  {plans[p].label}
                  <span className="block text-xs font-normal text-slate-500">{plans[p].price}</span>
                </label>
              ))}
            </div>
            {err(form.errors.plan)}
          </fieldset>

          <fieldset>
            <legend className={label}>How you'll pay</legend>
            <div className="mt-2 space-y-2">
              {methods.map((m) => (
                <label key={m.id} className={cn('flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3', form.data.method === m.id ? 'border-amber-400 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/40' : 'border-slate-200 dark:border-slate-700')}>
                  <input type="radio" name="method" value={m.id} checked={form.data.method === m.id} onChange={() => form.setData('method', m.id)} className="mt-1 text-amber-600 focus:ring-amber-500" />
                  <span className="text-sm">
                    <span className="font-medium text-slate-900 dark:text-white">{m.label}</span>
                    <span className="block text-slate-500 dark:text-slate-400">{m.hint}</span>
                  </span>
                </label>
              ))}
            </div>
            {err(form.errors.method)}
          </fieldset>

          {form.data.method === 'github' ? (
            <a href={sponsorsUrl} target="_blank" rel="noopener noreferrer" className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#bf3989] px-4 py-3 text-sm font-semibold text-white hover:bg-[#a82e78]">
              <Github className="h-4 w-4" /> Sponsor on GitHub
            </a>
          ) : (
            <>
              <div>
                <label htmlFor="note" className={label}>{form.data.method === 'other' ? 'Which payment methods can you use?' : 'Anything else? (optional)'}</label>
                <textarea id="note" rows={3} maxLength={2000} required={form.data.method === 'other'} value={form.data.note} onChange={(e) => form.setData('note', e.target.value)} className={field} />
                {err(form.errors.note)}
              </div>
              {siteKey && (
                <div>
                  <Turnstile key={widgetKey} siteKey={siteKey} onToken={(t) => form.setData('cf-turnstile-response', t)} theme={dark ? 'dark' : 'light'} />
                  {err(form.errors['cf-turnstile-response'])}
                </div>
              )}
              <button type="submit" disabled={form.processing || (!!siteKey && !form.data['cf-turnstile-response'])} className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-slate-900">
                Send request <ArrowRight className="h-4 w-4" />
              </button>
              <p className="text-xs text-slate-500 dark:text-slate-400">You get an email with a private link. {form.data.method === 'bkash' ? 'I send the bKash number by email; after paying, use the link to add the transaction ID.' : 'I reply by email.'}</p>
            </>
          )}
        </form>
      </section>
    </div>
  )
}
