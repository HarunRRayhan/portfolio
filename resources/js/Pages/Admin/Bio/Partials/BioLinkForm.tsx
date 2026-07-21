import InputError from '@/Components/InputError'
import InputLabel from '@/Components/InputLabel'
import PrimaryButton from '@/Components/PrimaryButton'
import TextInput from '@/Components/TextInput'
import { Link } from '@inertiajs/react'
import { BIO_ICONS, BIO_ICON_KEYS } from '@/lib/bioIcons'
import CountryMultiSelect from '@/Components/CountryMultiSelect'
import { countryName } from '@/lib/countries'
import { useMemo } from 'react'

export interface BioLinkFormData {
  label: string
  url: string
  icon: string
  tab: string
  tab_slug: string
  priority: number | string
  expires_at: string
  is_active: boolean
  include_countries: string[]
  exclude_countries: string[]
  [key: string]: string | number | boolean | string[]
}

interface Props {
  data: BioLinkFormData
  setData: (key: keyof BioLinkFormData, value: string | number | boolean | string[]) => void
  errors: Partial<Record<keyof BioLinkFormData, string>>
  processing: boolean
  onSubmit: (e: React.FormEvent) => void
  submitLabel: string
}

export default function BioLinkForm({ data, setData, errors, processing, onSubmit, submitLabel }: Props) {
  const slugPreview = useMemo(
    () =>
      data.tab && data.tab !== 'default'
        ? data.tab.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
        : 'default',
    [data.tab],
  )

  const overlap = useMemo(
    () => data.include_countries.filter((c) => data.exclude_countries.includes(c)),
    [data.include_countries, data.exclude_countries],
  )

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <InputLabel htmlFor="label" value="Label" />
        <TextInput
          id="label"
          className="mt-1 block w-full"
          value={data.label}
          onChange={(e) => setData('label', e.target.value)}
          placeholder="e.g. My Blog"
          isFocused
          required
        />
        <InputError message={errors.label} className="mt-2" />
      </div>

      <div>
        <InputLabel htmlFor="url" value="URL" />
        <TextInput
          id="url"
          type="text"
          className="mt-1 block w-full"
          value={data.url}
          onChange={(e) => setData('url', e.target.value)}
          placeholder="https://example.com or mailto:you@example.com"
          required
        />
        <InputError message={errors.url} className="mt-2" />
      </div>

      <div>
        <InputLabel value="Icon" />
        <div className="mt-2 grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-11">
          {BIO_ICON_KEYS.map((key) => {
            const { label, Icon } = BIO_ICONS[key]
            const selected = data.icon === key
            return (
              <button
                type="button"
                key={key}
                title={label}
                aria-label={label}
                aria-pressed={selected}
                onClick={() => setData('icon', key)}
                className={
                  'flex aspect-square items-center justify-center rounded-lg border transition ' +
                  (selected
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-600 ring-2 ring-indigo-200'
                    : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50')
                }
              >
                <Icon className="h-5 w-5" />
              </button>
            )
          })}
        </div>
        <InputError message={errors.icon} className="mt-2" />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <InputLabel htmlFor="priority" value="Sort order (lower shows first)" />
          <TextInput
            id="priority"
            type="number"
            min={0}
            className="mt-1 block w-full"
            value={data.priority}
            onChange={(e) => setData('priority', e.target.value)}
          />
          <InputError message={errors.priority} className="mt-2" />
        </div>

        <div>
          <InputLabel htmlFor="tab" value="Tab / group (optional)" />
          <TextInput
            id="tab"
            className="mt-1 block w-full"
            value={data.tab}
            onChange={(e) => setData('tab', e.target.value)}
            placeholder="default"
          />
          {data.tab && data.tab !== 'default' && (
            <p className="mt-1 text-xs text-gray-400">
              URL slug: <code className="rounded bg-gray-100 px-1 py-0.5 font-mono text-indigo-600">{slugPreview}</code>
            </p>
          )}
          <InputError message={errors.tab} className="mt-2" />
        </div>
      </div>

      <div>
        <InputLabel htmlFor="expires_at" value="Expires at (optional)" />
        <TextInput
          id="expires_at"
          type="datetime-local"
          className="mt-1 block w-full"
          value={data.expires_at}
          onChange={(e) => setData('expires_at', e.target.value)}
        />
        <p className="mt-1 text-xs text-gray-500">Leave blank to never expire. Expired links stay hidden on /bio.</p>
        <InputError message={errors.expires_at} className="mt-2" />
      </div>

      <fieldset className="rounded-lg border border-gray-200 p-4">
        <legend className="px-1 text-sm font-medium text-gray-700">Country targeting (optional)</legend>
        <p className="text-xs text-gray-500">
          Leave both empty to show this link everywhere. If the visitor&rsquo;s country can&rsquo;t be
          determined, a link limited to specific countries stays hidden, while a link that only blocks
          countries still shows.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <InputLabel htmlFor="include_countries" value="Show only in" />
            <div className="mt-1">
              <CountryMultiSelect
                id="include_countries"
                selected={data.include_countries}
                onChange={(codes) => setData('include_countries', codes)}
              />
            </div>
            <InputError message={errors.include_countries} className="mt-2" />
          </div>

          <div>
            <InputLabel htmlFor="exclude_countries" value="Hide in" />
            <div className="mt-1">
              <CountryMultiSelect
                id="exclude_countries"
                selected={data.exclude_countries}
                onChange={(codes) => setData('exclude_countries', codes)}
              />
            </div>
            <InputError message={errors.exclude_countries} className="mt-2" />
          </div>
        </div>

        {overlap.length > 0 && (
          <p className="mt-3 text-xs text-amber-600">
            {overlap.map((c) => countryName(c)).join(', ')} {overlap.length === 1 ? 'is' : 'are'} on both
            lists and will be hidden — blocking wins.
          </p>
        )}
      </fieldset>

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={data.is_active}
          onChange={(e) => setData('is_active', e.target.checked)}
          className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
        />
        <span className="text-sm text-gray-700">Active (visible on the public /bio page)</span>
      </label>

      <div className="flex items-center gap-4 pt-2">
        <PrimaryButton disabled={processing}>{submitLabel}</PrimaryButton>
        <Link href="/admin/bio" className="text-sm text-gray-600 hover:text-gray-900">
          Cancel
        </Link>
      </div>
    </form>
  )
}
