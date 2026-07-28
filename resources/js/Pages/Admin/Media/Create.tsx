import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Head, useForm } from '@inertiajs/react'
import MediaItemForm, { type MediaItemFormData } from './Partials/MediaItemForm'

export default function Create() {
  const { data, setData, post, processing, errors } = useForm<MediaItemFormData>({
    type: 'slide',
    title: '',
    slug: '',
    summary: '',
    url: '',
    source_label: '',
    thumbnail: null,
    remove_thumbnail: false,
    published_at: '',
    is_active: true,
    priority: 100,
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    post('/admin/media', { forceFormData: true })
  }

  return (
    <AuthenticatedLayout
      header={<h2 className="text-xl font-semibold leading-tight text-gray-800">New slide or video</h2>}
    >
      <Head title="New slide or video" />

      <div className="py-6 sm:py-12">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <MediaItemForm
              data={data}
              setData={setData}
              errors={errors}
              processing={processing}
              onSubmit={submit}
              submitLabel="Create"
            />
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
