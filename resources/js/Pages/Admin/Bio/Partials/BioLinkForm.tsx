import InputError from '@/Components/InputError'
import InputLabel from '@/Components/InputLabel'
import PrimaryButton from '@/Components/PrimaryButton'
import TextInput from '@/Components/TextInput'
import { Link } from '@inertiajs/react'
import { BIO_ICONS, BIO_ICON_KEYS } from '@/lib/bioIcons'
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
  [key: string]: string | number | boolean
}

interface Props {
  data: BioLinkFormData
  setData: (key: keyof BioLinkFormData, value: string | number | boolean) => void
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
