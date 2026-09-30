import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Head, useForm } from '@inertiajs/react'
import { FormEvent } from 'react'
import { ErrorSummary, fieldErrorProps, useConsultationAction } from '../Partials/FormFeedback'

type Coupon = {
  id: number
  code: string
  percent_off: number
  tier_slugs: string[]
  max_redemptions: number | null
  redeemed_count: number
  expires_at: string | null
  is_active: boolean
}

type Tier = { slug: string; name: string }

export default function CouponsIndex({ coupons, tiers }: { coupons: Coupon[]; tiers: Tier[] }) {
  const form = useForm({
    code: '',
    percent_off: 20,
    tier_slugs: tiers.map((t) => t.slug),
    max_redemptions: '' as string | number,
    expires_at: '',
    is_active: true,
  })

  const action = useConsultationAction()
  const summaryId = 'coupon-errors'

  const submit = (e: FormEvent) => {
    e.preventDefault()
    action.submit('/admin/consultations/coupons', {
      ...form.data,
      max_redemptions: form.data.max_redemptions === '' ? null : Number(form.data.max_redemptions),
      expires_at: form.data.expires_at || null,
    }, 'post', () => form.reset())
  }

  const toggleTier = (slug: string) => {
    const current = form.data.tier_slugs
    form.setData(
      'tier_slugs',
      current.includes(slug) ? current.filter((s) => s !== slug) : [...current, slug],
    )
  }

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-800">Coupons</h2>}>
      <Head title="Consultation coupons" />

      <div className="py-6 sm:py-12">
        <div className="mx-auto max-w-3xl space-y-6 px-4 sm:px-6 lg:px-8">
          <form onSubmit={submit} aria-busy={action.processing} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm space-y-3">
            <h3 className="font-semibold text-gray-900">Create coupon</h3>
            <ErrorSummary errors={action.errors} id={summaryId} />
            <fieldset disabled={action.processing} className="space-y-3 disabled:opacity-70">
              <label htmlFor="coupon-code" className="block text-sm">Coupon code</label>
              <input
                id="coupon-code"
                {...fieldErrorProps(action.errors, 'code', summaryId)}
                value={form.data.code}
                onChange={(e) => form.setData('code', e.target.value)}
                placeholder="CODE"
                className="w-full rounded-md border border-gray-200 px-3 py-2 uppercase"
                required
              />
              <label className="block text-sm">
                Percent off
                <input
                  type="number"
                  min={1}
                  max={100}
                  {...fieldErrorProps(action.errors, 'percent_off', summaryId)}
                  value={form.data.percent_off}
                  onChange={(e) => form.setData('percent_off', Number(e.target.value))}
                  className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2"
                />
              </label>
              <fieldset className="flex flex-wrap gap-3 text-sm" {...fieldErrorProps(action.errors, 'tier_slugs', summaryId)}>
                <legend className="mb-2">Applicable plans</legend>
                {tiers.map((t) => (
                  <label key={t.slug} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      {...fieldErrorProps(action.errors, 'tier_slugs', summaryId)}
                      checked={form.data.tier_slugs.includes(t.slug)}
                      onChange={() => toggleTier(t.slug)}
                    />
                    {t.name}
                  </label>
                ))}
              </fieldset>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm">Max redemptions (optional)
                <input
                  {...fieldErrorProps(action.errors, 'max_redemptions', summaryId)}
                  type="number"
                  min={1}
                  value={form.data.max_redemptions}
                  onChange={(e) => form.setData('max_redemptions', e.target.value)}
                  placeholder="Max redemptions (optional)"
                  className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2"
                />
                </label>
                <label className="block text-sm">Expires at (optional)
                <input
                  {...fieldErrorProps(action.errors, 'expires_at', summaryId)}
                  type="datetime-local"
                  value={form.data.expires_at}
                  onChange={(e) => form.setData('expires_at', e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2"
                />
                </label>
              </div>
              <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white">
                {action.processing ? 'Creating…' : 'Create'}
              </button>
            </fieldset>
          </form>

          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <ul className="divide-y divide-gray-100">
              {coupons.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-4 px-5 py-4 text-sm">
                  <div>
                    <p className="font-mono font-semibold text-gray-900">{c.code}</p>
                    <p className="text-gray-500">
                      {c.percent_off}% · {c.tier_slugs.join(', ')} · {c.redeemed_count}
                      {c.max_redemptions ? `/${c.max_redemptions}` : ''} used
                      {!c.is_active ? ' · inactive' : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={action.processing}
                    onClick={() => {
                      if (confirm(`Delete ${c.code}?`)) {
                        action.submit(`/admin/consultations/coupons/${c.id}`, {}, 'delete')
                      }
                    }}
                    className="text-rose-600"
                  >
                    Delete
                  </button>
                </li>
              ))}
              {coupons.length === 0 && (
                <li className="px-5 py-10 text-center text-gray-500">No coupons yet.</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
