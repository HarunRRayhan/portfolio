import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Head, Link, router, useForm } from '@inertiajs/react'
import { Heart } from 'lucide-react'
import { FormEvent } from 'react'

interface Credit {
  id: number
  kind: string
  expires_at: string | null
  used_at: string | null
  revoked_at: string | null
  booking: { public_id: string; starts_at: string | null; status: string } | null
}

interface Sponsorship {
  id: number
  github_login: string
  github_sponsor_id: string
  grant_email: string | null
  user: { name: string; email: string } | null
  tier_slug: string | null
  kind: string
  status: string
  source: string
  started_at: string | null
  credits: Credit[]
}

interface Paginated<T> {
  data: T[]
  links: { url: string | null; label: string; active: boolean }[]
  last_page: number
  total: number
}

const statusClass: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  cancelled: 'bg-gray-50 text-gray-500 ring-gray-200',
  revoked: 'bg-red-50 text-red-700 ring-red-200',
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'none'
}

function GrantForm({ tiers, form, onDone }: { tiers: string[]; form: ReturnType<typeof useGrantForm>; onDone: () => void }) {
  const submit = (e: FormEvent) => {
    e.preventDefault()
    form.post(route('admin.sponsorships.store'), { preserveScroll: true, onSuccess: () => { form.reset(); onDone() } })
  }
  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-gray-900">
        {form.data.sponsorship_id ? 'Grant credits to this donation' : 'Grant credits manually'}
      </p>
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="sm:col-span-2">
          <label htmlFor="identifier" className="block text-xs font-medium text-gray-600">Email or GitHub login</label>
          <input
            id="identifier"
            value={form.data.identifier}
            readOnly={!!form.data.sponsorship_id}
            onChange={(e) => form.setData('identifier', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 text-sm"
          />
          {form.errors.identifier && <p className="mt-1 text-xs text-red-600">{form.errors.identifier}</p>}
        </div>
        <div>
          <label htmlFor="tier_slug" className="block text-xs font-medium text-gray-600">Tier</label>
          <select id="tier_slug" value={form.data.tier_slug} onChange={(e) => form.setData('tier_slug', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 text-sm">
            {tiers.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          {form.errors.tier_slug && <p className="mt-1 text-xs text-red-600">{form.errors.tier_slug}</p>}
        </div>
        <div>
          <label htmlFor="expires_at" className="block text-xs font-medium text-gray-600">Expires (optional)</label>
          <input id="expires_at" type="date" value={form.data.expires_at} onChange={(e) => form.setData('expires_at', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 text-sm" />
          {form.errors.expires_at && <p className="mt-1 text-xs text-red-600">{form.errors.expires_at}</p>}
        </div>
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={form.processing} className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50">Grant</button>
        {form.data.sponsorship_id && (
          <button type="button" onClick={() => { form.reset(); onDone() }} className="rounded-md px-3 py-1.5 text-sm text-gray-600 ring-1 ring-gray-200">Cancel</button>
        )}
      </div>
    </form>
  )
}

function useGrantForm(tiers: string[]) {
  return useForm({ identifier: '', tier_slug: tiers[0] ?? '', expires_at: '', sponsorship_id: '' as number | '' })
}

function Row({ s, onGrant }: { s: Sponsorship; onGrant: (s: Sponsorship) => void }) {
  const revoke = () => {
    if (confirm(`Revoke ${s.github_login}'s sponsorship? Future bookings using its credits will be cancelled.`)) {
      router.post(route('admin.sponsorships.revoke', s.id), {}, { preserveScroll: true })
    }
  }
  return (
    <li className="px-4 py-4 sm:px-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900">
            {s.github_login} &middot; {s.tier_slug ?? 'donation'}
          </p>
          <p className="truncate text-sm text-gray-500">
            {s.user ? `${s.user.name} (${s.user.email})` : (s.grant_email ?? 'not linked to a user')} &middot; {s.source} &middot; {formatDate(s.started_at)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={'rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ' + (statusClass[s.status] ?? statusClass.cancelled)}>{s.status}</span>
          {s.tier_slug === null && s.status === 'active' && (
            <button type="button" onClick={() => onGrant(s)} className="rounded-md px-2.5 py-1 text-xs font-medium text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-50">Grant credits</button>
          )}
          {s.status === 'active' && (
            <button type="button" onClick={revoke} className="rounded-md px-2.5 py-1 text-xs font-medium text-red-700 ring-1 ring-red-200 hover:bg-red-50">Revoke</button>
          )}
        </div>
      </div>
      {s.credits.length > 0 && (
        <ul className="mt-2 space-y-1 text-xs text-gray-600">
          {s.credits.map((c) => (
            <li key={c.id}>
              {c.kind}: {c.revoked_at ? 'revoked' : c.used_at ? 'used' : 'unused'}, expires {formatDate(c.expires_at)}
              {c.booking && <> &middot; booking {c.booking.public_id} ({c.booking.status}, {formatDate(c.booking.starts_at)})</>}
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}

export default function Index({ sponsorships, tiers }: { sponsorships: Paginated<Sponsorship>; tiers: string[] }) {
  const form = useGrantForm(tiers)
  const prefill = (s: Sponsorship) => {
    form.setData({ identifier: s.github_login, tier_slug: tiers[0] ?? '', expires_at: '', sponsorship_id: s.id })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Sponsorships</h2>}>
      <Head title="Sponsorships" />

      <div className="py-6 sm:py-12">
        <div className="mx-auto max-w-4xl space-y-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-5 py-4 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pink-50 text-pink-600">
              <Heart className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-semibold tabular-nums text-gray-900">{sponsorships.total}</p>
              <p className="text-sm text-gray-500">{sponsorships.total === 1 ? 'sponsorship' : 'sponsorships'}</p>
            </div>
          </div>

          <GrantForm tiers={tiers} form={form} onDone={() => undefined} />

          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            {sponsorships.data.length === 0 ? (
              <p className="px-6 py-16 text-center text-sm text-gray-500">No sponsorships yet.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {sponsorships.data.map((s) => <Row key={s.id} s={s} onGrant={prefill} />)}
              </ul>
            )}
          </div>

          {sponsorships.last_page > 1 && (
            <nav className="flex flex-wrap items-center justify-center gap-1">
              {sponsorships.links.map((link, index) => {
                const label = link.label.replace('&laquo;', '«').replace('&raquo;', '»')
                return link.url ? (
                  <Link key={index} href={link.url} preserveScroll className={'rounded-md px-3 py-1.5 text-sm font-medium transition ' + (link.active ? 'bg-gray-900 text-white' : 'text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50')}>
                    {label}
                  </Link>
                ) : (
                  <span key={index} className="cursor-default rounded-md px-3 py-1.5 text-sm font-medium text-gray-300">{label}</span>
                )
              })}
            </nav>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
