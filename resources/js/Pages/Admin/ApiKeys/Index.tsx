import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Button } from '@/Components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card'
import { Input } from '@/Components/ui/input'
import { Label } from '@/Components/ui/label'
import { Head, router, useForm, usePage } from '@inertiajs/react'
import { PageProps as InertiaPageProps } from '@inertiajs/core'
import { useState } from 'react'
import { AlertTriangle, Check, Copy, KeyRound, Trash2 } from 'lucide-react'

interface ApiKeyRecord {
  id: number
  name: string
  rate_limit_per_minute: number | null
  rate_limit_per_day: number | null
  last_used_at: string | null
  created_at: string | null
  abilities: string[]
  is_legacy_unrestricted: boolean
  expires_at: string | null
}

interface Flash {
  type?: 'success' | 'error'
  message?: string
  token?: string
}

interface PageProps extends InertiaPageProps {
  flash?: Flash
}

function formatDate(value: string | null) {
  if (!value) return 'never'
  return new Date(value).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <button
      type="button"
      onClick={copy}
      title={copied ? 'Copied' : 'Copy token'}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-amber-900 px-3 py-1.5 text-xs font-medium text-amber-50 transition hover:bg-amber-800"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

interface CreateApiKeyFormData {
  name: string
  abilities: string[]
  expires_at: string
  rate_limit_per_minute: string
  rate_limit_per_day: string
  [key: string]: string | string[]
}

interface CapabilityPreset {
  label: string
  abilities: string[]
}

function defaultExpiry() {
  const date = new Date(Date.now() + 90 * 86400000)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

export default function Index({ tokens, capabilities, presets }: {
  tokens: ApiKeyRecord[]
  capabilities: Record<string, string>
  presets: Record<string, CapabilityPreset>
}) {
  const { flash } = usePage<PageProps>().props

  const { data, setData, post, processing, errors, reset, transform } = useForm<CreateApiKeyFormData>({
    name: '',
    abilities: ['short-links:create'],
    expires_at: defaultExpiry(),
    rate_limit_per_minute: '',
    rate_limit_per_day: '',
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    transform((values) => ({
      ...values,
      expires_at: values.expires_at ? new Date(values.expires_at).toISOString() : null,
    }))
    post(route('admin.api-keys.store'), {
      preserveScroll: true,
      onSuccess: () => reset(),
    })
  }

  const destroy = (token: ApiKeyRecord) => {
    if (!confirm(`Revoke "${token.name}"? Anything using this key will stop working immediately.`)) return
    router.delete(route('admin.api-keys.destroy', token.id), { preserveScroll: true })
  }

  return (
    <AuthenticatedLayout
      header={<h2 className="text-xl font-semibold leading-tight text-gray-800">API Keys</h2>}
    >
      <Head title="API Keys" />

      <div className="py-6 sm:py-12">
        <div className="mx-auto max-w-4xl space-y-6 px-4 sm:px-6 lg:px-8">
          <p className="text-sm text-gray-500">
            API keys authenticate requests to the public <code className="rounded bg-gray-100 px-1 py-0.5 font-mono text-xs text-indigo-600">/api/v1</code> endpoints.
            Choose the capabilities and expiration each integration needs. Existing unrestricted keys keep working until revoked.
          </p>

          {flash?.token && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <div className="min-w-0 flex-1 space-y-2">
                  <p className="text-sm font-semibold text-amber-900">
                    Copy this key now. You won&apos;t be able to see it again.
                  </p>
                  <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-white px-3 py-2">
                    <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-mono text-sm text-gray-800">
                      {flash.token}
                    </code>
                    <CopyButton text={flash.token} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {!flash?.token && flash?.message && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {flash.message}
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Create API key</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={submit} className="grid gap-4 sm:grid-cols-3">
                <div className="sm:col-span-1">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    className="mt-1"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    placeholder="e.g. Zapier integration"
                    required
                  />
                  {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
                </div>

                <div className="sm:col-span-1">
                  <Label htmlFor="rate_limit_per_minute">Rate limit / minute</Label>
                  <Input
                    id="rate_limit_per_minute"
                    type="number"
                    min={1}
                    className="mt-1"
                    value={data.rate_limit_per_minute}
                    onChange={(e) => setData('rate_limit_per_minute', e.target.value)}
                    placeholder="default (60)"
                  />
                  {errors.rate_limit_per_minute && (
                    <p className="mt-1 text-xs text-red-600">{errors.rate_limit_per_minute}</p>
                  )}
                </div>

                <div className="sm:col-span-1">
                  <Label htmlFor="rate_limit_per_day">Rate limit / day</Label>
                  <Input
                    id="rate_limit_per_day"
                    type="number"
                    min={1}
                    className="mt-1"
                    value={data.rate_limit_per_day}
                    onChange={(e) => setData('rate_limit_per_day', e.target.value)}
                    placeholder="default (2000)"
                  />
                  {errors.rate_limit_per_day && (
                    <p className="mt-1 text-xs text-red-600">{errors.rate_limit_per_day}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <Label htmlFor="capability_preset">Capabilities</Label>
                  <select
                    id="capability_preset"
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                    value={Object.entries(presets).find(([, preset]) => preset.abilities.length === data.abilities.length && preset.abilities.every((ability) => data.abilities.includes(ability)))?.[0] ?? 'custom'}
                    onChange={(e) => {
                      const preset = presets[e.target.value]
                      if (preset) setData('abilities', preset.abilities)
                    }}
                  >
                    {Object.entries(presets).map(([value, preset]) => <option key={value} value={value}>{preset.label}</option>)}
                    <option value="custom">Custom selection</option>
                  </select>
                  <div className="mt-3 grid gap-2">
                    {Object.entries(capabilities).map(([ability, label]) => (
                      <label key={ability} className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={data.abilities.includes(ability)}
                          onChange={(e) => setData('abilities', e.target.checked ? [...data.abilities, ability] : data.abilities.filter((value) => value !== ability))}
                          className="rounded border-gray-300"
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                  {errors.abilities && <p className="mt-1 text-xs text-red-600">{errors.abilities}</p>}
                </div>

                <div>
                  <Label htmlFor="expires_at">Expires at (your local time)</Label>
                  <Input
                    id="expires_at"
                    type="datetime-local"
                    className="mt-1"
                    value={data.expires_at}
                    onChange={(e) => setData('expires_at', e.target.value)}
                  />
                  <p className="mt-2 text-xs text-gray-500">Defaults to 90 days. Clear the date for no expiration.</p>
                  {errors.expires_at && <p className="mt-1 text-xs text-red-600">{errors.expires_at}</p>}
                </div>

                <div className="sm:col-span-3">
                  <Button type="submit" disabled={processing}>
                    <KeyRound className="mr-2 h-4 w-4" />
                    Create API key
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
            {tokens.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <p className="text-sm text-gray-500">No API keys yet.</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-100">
                <thead>
                  <tr className="text-left text-xs font-medium uppercase tracking-wide text-gray-400">
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Capabilities</th>
                    <th className="px-4 py-3">Expires</th>
                    <th className="px-4 py-3">Per minute</th>
                    <th className="px-4 py-3">Per day</th>
                    <th className="px-4 py-3">Last used</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tokens.map((token) => (
                    <tr key={token.id} className="text-sm text-gray-700">
                      <td className="px-4 py-3 font-medium text-gray-900">{token.name}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {token.is_legacy_unrestricted ? (
                          <span className="font-medium text-amber-700">Legacy: unrestricted</span>
                        ) : token.abilities.map((ability) => <div key={ability}>{capabilities[ability] ?? ability}</div>)}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {token.expires_at ? (
                          <>
                            {formatDate(token.expires_at)}
                            {new Date(token.expires_at).getTime() <= Date.now() && <div className="font-medium text-red-600">Expired</div>}
                          </>
                        ) : 'No expiration'}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {token.rate_limit_per_minute ?? 'default (60/min)'}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {token.rate_limit_per_day ?? 'default (2000/day)'}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(token.last_used_at)}</td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(token.created_at)}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => destroy(token)}
                          title="Revoke"
                          className="rounded-md p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
