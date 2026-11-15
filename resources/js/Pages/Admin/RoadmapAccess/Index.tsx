import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Head, router, useForm } from '@inertiajs/react'
import { FormEvent } from 'react'

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

const formatDate = (value: string) => new Date(value).toLocaleDateString(undefined, { dateStyle: 'medium' })

export default function Index({ grants }: { grants: Grant[] }) {
  const form = useForm({ email: '', expires_at: '', note: '' })
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
          <form onSubmit={submit} className="space-y-3 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-gray-900">Give Intermediate + Advanced access</p>
            <p className="text-xs text-gray-500">Matches the person's verified sign-in email, now or when they sign up later.</p>
            <div className="grid gap-3 sm:grid-cols-4">
              <div className="sm:col-span-2">
                <label htmlFor="email" className="block text-xs font-medium text-gray-600">Email</label>
                <input id="email" type="email" required value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 text-sm" />
                {form.errors.email && <p className="mt-1 text-xs text-red-600">{form.errors.email}</p>}
              </div>
              <div>
                <label htmlFor="expires_at" className="block text-xs font-medium text-gray-600">Access until</label>
                <input id="expires_at" type="date" required value={form.data.expires_at} onChange={(e) => form.setData('expires_at', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 text-sm" />
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
