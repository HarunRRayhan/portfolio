import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Head, useForm } from '@inertiajs/react'
import MediaItemForm, { type MediaItemFormData } from './Partials/MediaItemForm'

interface MediaItemRecord {
  id: number
  type: 'slide' | 'video'
  title: string
  slug: string
  summary: string | null
  url: string
  share_url: string
  thumbnail_url: string | null
  source_label: string | null
  published_at: string | null
  is_active: boolean
  priority: number
  short_link_code: string | null
}

export default function Edit({ item }: { item: MediaItemRecord }) {
  const { data, setData, post, transform, processing, errors } = useForm<MediaItemFormData>({
    type: item.type,
    title: item.title,
    slug: item.slug ?? '',
    summary: item.summary ?? '',
    url: item.url,
    source_label: item.source_label ?? '',
    thumbnail: null,
    remove_thumbnail: false,
    published_at: item.published_at ?? '',
    is_active: item.is_active,
    priority: item.priority ?? '',
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    // PHP never populates $_FILES for PUT bodies, multipart or not, so a real
    // file upload has to ride in on a POST with a spoofed _method instead.
    transform((data) => ({ ...data, _method: 'put' }))
    post(`/admin/media/${item.id}`, { forceFormData: true })
  }

  return (
    <AuthenticatedLayout
      header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Edit {item.title}</h2>}
    >
      <Head title={`Edit · ${item.title}`} />

      <div className="py-6 sm:py-12">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <MediaItemForm
              data={data}
              setData={setData}
              errors={errors}
              processing={processing}
              onSubmit={submit}
              submitLabel="Save changes"
              existingThumbnailUrl={item.thumbnail_url}
            />
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
