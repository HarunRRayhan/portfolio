import { Link, useForm } from '@inertiajs/react'
import { CheckCircle2, Clock, Heart } from 'lucide-react'
import { FormEvent } from 'react'

type Props = {
  request: { id: string; plan: string; method: string; country: string; status: string; transactionId: string | null; createdAt: string }
  bankDetails: string | null
  paidUrl: string
}

const planLabel: Record<string, string> = { monthly: 'Monthly ($5)', yearly: 'Yearly ($10)', lifetime: 'Lifetime ($100)' }

export default function PayRequest({ request, bankDetails, paidUrl }: Props) {
  const form = useForm({ transaction_id: '', payer_account: '' })
  const submit = (e: FormEvent) => {
    e.preventDefault()
    form.post(paidUrl, { preserveScroll: true })
  }
  const bank = request.method === 'bank'
  const open = request.status === 'new' || request.status === 'paid'
  const field = 'mt-1 block w-full rounded-lg border-slate-300 bg-white text-sm shadow-sm focus:border-amber-400 focus:ring-amber-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white'

  return (
    <div className="pt-24">
      <section className="mx-auto max-w-xl px-4 pb-24 pt-8 sm:px-6">
        <h1 className="flex items-center gap-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
          <Heart className="h-7 w-7 fill-rose-500 text-rose-500" aria-hidden /> Your request
        </h1>
        <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800"><dt className="text-slate-500">Plan</dt><dd className="mt-1 font-semibold text-slate-900 dark:text-white">{planLabel[request.plan] ?? request.plan}</dd></div>
          <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800"><dt className="text-slate-500">Method</dt><dd className="mt-1 font-semibold text-slate-900 dark:text-white">{bank ? 'Bank transfer' : 'Another method'}</dd></div>
        </dl>

        {request.status === 'approved' && (
          <p className="mt-6 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
            <CheckCircle2 className="h-5 w-5" /> Approved. <Link href="/roadmaps" className="font-semibold underline">Open the roadmaps</Link>
          </p>
        )}
        {request.status === 'declined' && <p className="mt-6 rounded-2xl border border-slate-200 p-4 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">This request was closed. Reply to my email if that's a mistake.</p>}
        {request.status === 'paid' && (
          <p className="mt-6 flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            <Clock className="h-5 w-5" /> Payment details received ({request.transactionId}). I'll check and unlock your access.
          </p>
        )}

        {open && bank && (
          <form onSubmit={submit} className="mt-6 space-y-4 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {bankDetails ? 'Send the amount in BDT to this account, then add the transfer details below.' : "I'll email you the bank details and the amount in BDT. After you send the money, add the transfer details here."}
            </p>
            {bankDetails && <pre className="whitespace-pre-wrap rounded-xl bg-slate-50 p-4 font-mono text-sm text-slate-900 dark:bg-slate-950 dark:text-slate-100">{bankDetails}</pre>}
            <div>
              <label htmlFor="transaction_id" className="block text-sm font-medium text-slate-700 dark:text-slate-200">Transfer reference or transaction ID</label>
              <input id="transaction_id" required maxLength={64} value={form.data.transaction_id} onChange={(e) => form.setData('transaction_id', e.target.value)} className={field} placeholder="From your bank's receipt" />
              {form.errors.transaction_id && <p className="mt-1 text-xs text-red-600">{form.errors.transaction_id}</p>}
            </div>
            <div>
              <label htmlFor="payer_account" className="block text-sm font-medium text-slate-700 dark:text-slate-200">Account name or number you paid from</label>
              <input id="payer_account" required maxLength={120} value={form.data.payer_account} onChange={(e) => form.setData('payer_account', e.target.value)} className={field}  />
              {form.errors.payer_account && <p className="mt-1 text-xs text-red-600">{form.errors.payer_account}</p>}
            </div>
            <button type="submit" disabled={form.processing} className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-slate-900">
              {request.status === 'paid' ? 'Update payment details' : 'Send payment details'}
            </button>
          </form>
        )}
        {open && !bank && request.status === 'new' && <p className="mt-6 text-sm text-slate-600 dark:text-slate-300">I'll reply by email with a way to pay that works for you.</p>}
      </section>
    </div>
  )
}
