import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Head, useForm } from '@inertiajs/react'
import BioLinkForm, { type BioLinkFormData } from './Partials/BioLinkForm'

export default function Create() {
  const { data, setData, post, processing, errors } = useForm<BioLinkFormData>({
    label: '',
    description: '',
    url: '',
    icon: 'link',
    thumbnail: null,
    featured: false,
    remove_thumbnail: false,
    tab: 'default',
    tab_slug: '',
    priority: 100,
    expires_at: '',
    is_active: true,
    include_countries: [],
    exclude_countries: [],
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    post('/admin/bio', { forceFormData: true })
  }

  return (
    <AuthenticatedLayout
      header={<h2 className="text-xl font-semibold leading-tight text-gray-800">New Bio Link</h2>}
    >
      <Head title="New Bio Link" />

      <div className="py-6 sm:py-12">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <BioLinkForm
              data={data}
              setData={setData}
              errors={errors}
              processing={processing}
              onSubmit={submit}
              submitLabel="Create link"
            />
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
