import InputError from '@/Components/InputError'
import InputLabel from '@/Components/InputLabel'
import PrimaryButton from '@/Components/PrimaryButton'
import TextInput from '@/Components/TextInput'
import { Link } from '@inertiajs/react'

export interface ShortLinkFormData {
  destination_url: string
  code: string
  title: string
  expires_at: string
  is_active: boolean
  [key: string]: string | boolean
}

interface Props {
  data: ShortLinkFormData
  setData: (key: keyof ShortLinkFormData, value: string | boolean) => void
  errors: Partial<Record<keyof ShortLinkFormData, string>>
  processing: boolean
  onSubmit: (e: React.FormEvent) => void
  submitLabel: string
  /** Shown once a code exists (edit only) -- there's nothing to preview on create. */
  shortUrl?: string | null
}

export default function ShortLinkForm({
  data,
  setData,
  errors,
  processing,
  onSubmit,
  submitLabel,
  shortUrl = null,
}: Props) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <InputLabel htmlFor="destination_url" value="Destination URL" />
        <TextInput
          id="destination_url"
          type="text"
          className="mt-1 block w-full"
          value={data.destination_url}
          onChange={(e) => setData('destination_url', e.target.value)}
          placeholder="https://example.com/the-real-page"
          isFocused
          required
        />
        <InputError message={errors.destination_url} className="mt-2" />
      </div>

      <div>
        <InputLabel htmlFor="code" value="Custom code (optional)" />
        <TextInput
          id="code"
          className="mt-1 block w-full"
          value={data.code}
          onChange={(e) => setData('code', e.target.value)}
          placeholder="leave blank to generate one"
        />
        {shortUrl ? (
          <p className="mt-1 text-xs text-gray-400">
            Live at <code className="rounded bg-gray-100 px-1 py-0.5 font-mono text-indigo-600">{shortUrl}</code>
          </p>
        ) : (
          <p className="mt-1 text-xs text-gray-500">Letters, numbers, dashes and underscores only.</p>
        )}
        <InputError message={errors.code} className="mt-2" />
      </div>

      <div>
        <InputLabel htmlFor="title" value="Title (optional)" />
        <TextInput
          id="title"
          className="mt-1 block w-full"
          value={data.title}
          onChange={(e) => setData('title', e.target.value)}
          placeholder="A note to tell this link apart from the rest"
        />
        <InputError message={errors.title} className="mt-2" />
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
        <p className="mt-1 text-xs text-gray-500">Leave blank to never expire. Expired links 404 instead of redirecting.</p>
        <InputError message={errors.expires_at} className="mt-2" />
      </div>

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={data.is_active}
          onChange={(e) => setData('is_active', e.target.checked)}
          className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
        />
        <span className="text-sm text-gray-700">Active (redirects visitors)</span>
      </label>

      <div className="flex items-center gap-4 pt-2">
        <PrimaryButton disabled={processing}>{submitLabel}</PrimaryButton>
        <Link href="/admin/short" className="text-sm text-gray-600 hover:text-gray-900">
          Cancel
        </Link>
      </div>
    </form>
  )
}
