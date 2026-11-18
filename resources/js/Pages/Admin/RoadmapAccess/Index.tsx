import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Head, router, useForm } from '@inertiajs/react'
import { FormEvent, useState } from 'react'

interface Grant {
  id: number
  email: string
  note: string | null
  expires_at: string
  revoked_at: string | null
  status: 'active' | 'expired' | 'revoked'
}

const statusClass: Record<Grant['status'], string> = {
  active: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  expired: 'bg-gray-50 text-gray-500 ring-gray-200',
  revoked: 'bg-red-50 text-red-700 ring-red-200',
}

interface PayRequest {
  id: string
  name: string
  email: string
  country: string
  plan: Plan
  method: string
  note: string | null
  status: 'new' | 'paid' | 'approved' | 'declined'
  transaction_id: string | null
  payer_phone: string | null
  created_at: string
}

type Plan = 'monthly' | 'yearly' | 'lifetime'

const requestClass: Record<PayRequest['status'], string> = {
  new: 'bg-amber-50 text-amber-800 ring-amber-200',
  paid: 'bg-sky-50 text-sky-800 ring-sky-200',
  approved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  declined: 'bg-gray-50 text-gray-500 ring-gray-200',
}

function RequestRow({ r, plans }: { r: PayRequest; plans: Record<Plan, { label: string; price: string }> }) {
  const [plan, setPlan] = useState<Plan>(r.plan)
  const open = r.status === 'new' || r.status === 'paid'
  const approve = () => {
    if (confirm(`Give ${r.email} ${plans[plan].label} access?`)) router.post(route('admin.roadmap-access.approve', r.id), { plan }, { preserveScroll: true })
  }
  const decline = () => {
    if (confirm(`Decline the request from ${r.email}?`)) router.post(route('admin.roadmap-access.decline', r.id), {}, { preserveScroll: true })
  }

  return (
    <li className="space-y-2 px-4 py-4 sm:px-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="min-w-0 truncate text-sm font-semibold text-gray-900">{r.name} · <a href={`mailto:${r.email}`} className="font-normal text-gray-600 underline">{r.email}</a></p>
        <span className={'rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ' + requestClass[r.status]}>{r.status === 'paid' ? 'payment sent' : r.status}</span>
      </div>
      <p className="text-sm text-gray-600">
        {r.country} · asked for {plans[r.plan]?.label ?? r.plan} · {r.method === 'bkash' ? 'bKash' : 'other method'} · {formatDate(r.created_at)}
      </p>
      {r.transaction_id && <p className="text-sm text-gray-900">Txn <span className="font-mono">{r.transaction_id}</span> from <span className="font-mono">{r.payer_phone}</span></p>}
      {r.note && <p className="whitespace-pre-line rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-700">{r.note}</p>}
      {open && (
        <div className="flex flex-wrap items-center gap-2">
          <select value={plan} onChange={(e) => setPlan(e.target.value as Plan)} className="rounded-md border-gray-300 py-1 text-sm">
            {(Object.keys(plans) as Plan[]).map((p) => <option key={p} value={p}>{plans[p].label}</option>)}
          </select>
          <button type="button" onClick={approve} className="rounded-md bg-emerald-600 px-3 py-1 text-sm font-medium text-white hover:bg-emerald-700">Approve</button>
          <button type="button" onClick={decline} className="rounded-md px-3 py-1 text-sm font-medium text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50">Decline</button>
        </div>
      )}
    </li>
  )
}

const formatDate = (value: string) => new Date(value).toLocaleDateString(undefined, { dateStyle: 'medium' })

export default function Index({ grants, requests, plans }: { grants: Grant[]; requests: PayRequest[]; plans: Record<Plan, { label: string; price: string }> }) {
  const form = useForm({ email: '', plan: 'yearly' as Plan | '', expires_at: '', note: '' })
  const submit = (e: FormEvent) => {
    e.preventDefault()
    form.post(route('admin.roadmap-access.store'), { preserveScroll: true, onSuccess: () => form.reset() })
  }
  const revoke = (g: Grant) => {
    if (confirm(`Revoke roadmap access for ${g.email}?`)) {
      router.post(route('admin.roadmap-access.revoke', g.id), {}, { preserveScroll: true })
    }
  }

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Roadmap access</h2>}>
      <Head title="Roadmap access" />
      <div className="py-6 sm:py-12">
        <div className="mx-auto max-w-4xl space-y-4 px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <p className="border-b border-gray-100 px-5 py-3 text-sm font-semibold text-gray-900">Pay-another-way requests</p>
            {requests.length === 0 ? (
              <p className="px-6 py-10 text-center text-sm text-gray-500">No requests yet. They come from /sponsor-me/pay.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {requests.map((r) => <RequestRow key={r.id} r={r} plans={plans} />)}
              </ul>
            )}
          </div>

          <form onSubmit={submit} className="space-y-3 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-gray-900">Give Intermediate + Advanced access</p>
            <p className="text-xs text-gray-500">For payments made elsewhere (email, bank, cash). Matches the person's verified sign-in email, now or when they sign up later. Monthly, yearly and lifetime count from today.</p>
            <div className="grid gap-3 sm:grid-cols-4">
              <div className="sm:col-span-2">
                <label htmlFor="email" className="block text-xs font-medium text-gray-600">Email</label>
                <input id="email" type="email" required value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 text-sm" />
                {form.errors.email && <p className="mt-1 text-xs text-red-600">{form.errors.email}</p>}
              </div>
              <div>
                <label htmlFor="plan" className="block text-xs font-medium text-gray-600">Plan</label>
                <select id="plan" value={form.data.plan} onChange={(e) => form.setData('plan', e.target.value as Plan | '')} className="mt-1 block w-full rounded-md border-gray-300 text-sm">
                  {(Object.keys(plans) as Plan[]).map((p) => <option key={p} value={p}>{plans[p].label}</option>)}
                  <option value="">Custom date</option>
                </select>
              </div>
              <div className={form.data.plan ? 'hidden' : ''}>
                <label htmlFor="expires_at" className="block text-xs font-medium text-gray-600">Access until</label>
                <input id="expires_at" type="date" required={!form.data.plan} value={form.data.expires_at} onChange={(e) => form.setData('expires_at', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 text-sm" />
                {form.errors.expires_at && <p className="mt-1 text-xs text-red-600">{form.errors.expires_at}</p>}
              </div>
              <div>
                <label htmlFor="note" className="block text-xs font-medium text-gray-600">Note (optional)</label>
                <input id="note" value={form.data.note} onChange={(e) => form.setData('note', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 text-sm" />
                {form.errors.note && <p className="mt-1 text-xs text-red-600">{form.errors.note}</p>}
              </div>
            </div>
            <button type="submit" disabled={form.processing} className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50">Grant access</button>
          </form>

          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            {grants.length === 0 ? (
              <p className="px-6 py-16 text-center text-sm text-gray-500">No manual grants yet.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {grants.map((g) => (
                  <li key={g.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900">{g.email}</p>
                      <p className="truncate text-sm text-gray-500">Until {formatDate(g.expires_at)}{g.note ? ` · ${g.note}` : ''}</p>
                    </div>
                    <span className={'rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ' + statusClass[g.status]}>{g.status}</span>
                    {g.status === 'active' && (
                      <button type="button" onClick={() => revoke(g)} className="rounded-md px-2.5 py-1 text-xs font-medium text-red-700 ring-1 ring-red-200 hover:bg-red-50">Revoke</button>
                    )}
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
