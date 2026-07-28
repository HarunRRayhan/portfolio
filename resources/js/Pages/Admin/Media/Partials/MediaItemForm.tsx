import InputError from '@/Components/InputError'
import InputLabel from '@/Components/InputLabel'
import PrimaryButton from '@/Components/PrimaryButton'
import TextInput from '@/Components/TextInput'
import { Link } from '@inertiajs/react'
import { useEffect, useRef, useState } from 'react'

export interface MediaItemFormData {
  type: 'slide' | 'video'
  title: string
  slug: string
  summary: string
  url: string
  source_label: string
  thumbnail: File | null
  remove_thumbnail: boolean
  published_at: string
  is_active: boolean
  priority: number | string
  [key: string]: string | number | boolean | File | null
}

interface Props {
  data: MediaItemFormData
  setData: (key: keyof MediaItemFormData, value: string | number | boolean | File | null) => void
  errors: Partial<Record<keyof MediaItemFormData, string>>
  processing: boolean
  onSubmit: (e: React.FormEvent) => void
  submitLabel: string
  /** Thumbnail already stored for this item (edit only) -- shown until replaced or removed. */
  existingThumbnailUrl?: string | null
}

export default function MediaItemForm({
  data,
  setData,
  errors,
  processing,
  onSubmit,
  submitLabel,
  existingThumbnailUrl = null,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [objectUrl, setObjectUrl] = useState<string | null>(null)

  // Blob URLs are only ever created for a freshly-picked file, so revoking on
  // every change/unmount can't clobber anything still in use.
  useEffect(() => () => { if (objectUrl) URL.revokeObjectURL(objectUrl) }, [objectUrl])

  const preview = objectUrl ?? (data.remove_thumbnail ? null : existingThumbnailUrl)

  const pickThumbnail = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    if (objectUrl) URL.revokeObjectURL(objectUrl)
    setObjectUrl(file ? URL.createObjectURL(file) : null)
    setData('thumbnail', file)
    setData('remove_thumbnail', false)
  }

  const removeThumbnail = () => {
    if (objectUrl) URL.revokeObjectURL(objectUrl)
    setObjectUrl(null)
    setData('thumbnail', null)
    setData('remove_thumbnail', true)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <InputLabel value="Type" />
        <div className="mt-2 grid grid-cols-2 gap-2">
          {(['slide', 'video'] as const).map((type) => (
            <button
              type="button"
              key={type}
              aria-pressed={data.type === type}
              onClick={() => setData('type', type)}
              className={
                'rounded-lg border px-4 py-2 text-sm font-medium capitalize transition ' +
                (data.type === type
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-600 ring-2 ring-indigo-200'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50')
              }
            >
              {type}
            </button>
          ))}
        </div>
        <InputError message={errors.type} className="mt-2" />
      </div>

      <div>
        <InputLabel htmlFor="title" value="Title" />
        <TextInput
          id="title"
          className="mt-1 block w-full"
          value={data.title}
          onChange={(e) => setData('title', e.target.value)}
          placeholder="e.g. Scaling Postgres at 10x"
          isFocused
          required
        />
        <InputError message={errors.title} className="mt-2" />
      </div>

      <div>
        <InputLabel htmlFor="slug" value="Slug (optional)" />
        <TextInput
          id="slug"
          className="mt-1 block w-full"
          value={data.slug}
          onChange={(e) => setData('slug', e.target.value)}
          placeholder="e.g. scaling-postgres-at-10x"
        />
        <p className="mt-1 text-xs text-gray-500">Leave blank to generate one from the title.</p>
        <InputError message={errors.slug} className="mt-2" />
      </div>

      <div>
        <InputLabel htmlFor="summary" value="Summary" />
        <textarea
          id="summary"
          rows={4}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          value={data.summary}
          onChange={(e) => setData('summary', e.target.value)}
          placeholder="A couple of sentences about what this is."
        />
        <p className="mt-1 text-xs text-gray-500">Shows up under the title on the public page.</p>
        <InputError message={errors.summary} className="mt-2" />
      </div>

      <div>
        <InputLabel htmlFor="url" value="URL" />
        <TextInput
          id="url"
          type="text"
          className="mt-1 block w-full"
          value={data.url}
          onChange={(e) => setData('url', e.target.value)}
          placeholder="https://youtube.com/watch?v=... or https://docs.google.com/presentation/..."
          required
        />
        <p className="mt-1 text-xs text-gray-500">
          Where this lives: a YouTube link, a Google Slides deck, a SpeakerDeck link, whatever it is.
        </p>
        <InputError message={errors.url} className="mt-2" />
      </div>

      <div>
        <InputLabel htmlFor="source_label" value="Source (optional)" />
        <TextInput
          id="source_label"
          className="mt-1 block w-full"
          value={data.source_label}
          onChange={(e) => setData('source_label', e.target.value)}
          placeholder="YouTube"
        />
        <p className="mt-1 text-xs text-gray-500">e.g. YouTube, or the event name.</p>
        <InputError message={errors.source_label} className="mt-2" />
      </div>

      <div>
        <InputLabel htmlFor="thumbnail" value="Thumbnail (optional)" />
        <div className="mt-2 flex items-start gap-4">
          {preview && (
            <img
              src={preview}
              alt="Thumbnail preview"
              className="h-20 w-20 shrink-0 rounded-lg border border-gray-200 object-cover"
            />
          )}
          <div className="flex-1">
            <input
              id="thumbnail"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={pickThumbnail}
              className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100"
            />
            <p className="mt-1 text-xs text-gray-500">PNG or JPG, up to 2MB.</p>
            {preview && (
              <button
                type="button"
                onClick={removeThumbnail}
                className="mt-2 text-xs font-medium text-red-600 hover:text-red-700"
              >
                Remove thumbnail
              </button>
            )}
          </div>
        </div>
        <InputError message={errors.thumbnail} className="mt-2" />
      </div>

      <div>
        <InputLabel htmlFor="published_at" value="Published at (optional)" />
        <TextInput
          id="published_at"
          type="datetime-local"
          className="mt-1 block w-full"
          value={data.published_at}
          onChange={(e) => setData('published_at', e.target.value)}
        />
        <p className="mt-1 text-xs text-gray-500">
          Shown as the publish date and used for sorting. Leave blank if it's not out yet.
        </p>
        <InputError message={errors.published_at} className="mt-2" />
      </div>

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={data.is_active}
          onChange={(e) => setData('is_active', e.target.checked)}
          className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
        />
        <span className="text-sm text-gray-700">Active (visible on the public page)</span>
      </label>

      <div>
        <InputLabel htmlFor="priority" value="Priority (optional)" />
        <TextInput
          id="priority"
          type="number"
          min={0}
          className="mt-1 block w-full"
          value={data.priority}
          onChange={(e) => setData('priority', e.target.value)}
        />
        <p className="mt-1 text-xs text-gray-500">Lower numbers show first.</p>
        <InputError message={errors.priority} className="mt-2" />
      </div>

      <div className="flex items-center gap-4 pt-2">
        <PrimaryButton disabled={processing}>{submitLabel}</PrimaryButton>
        <Link href="/admin/media" className="text-sm text-gray-600 hover:text-gray-900">
          Cancel
        </Link>
      </div>
    </form>
  )
}
