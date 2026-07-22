import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Head, useForm } from '@inertiajs/react'
import ShortLinkForm, { type ShortLinkFormData } from './Partials/ShortLinkForm'

export default function Create() {
  const { data, setData, post, processing, errors } = useForm<ShortLinkFormData>({
    destination_url: '',
    code: '',
    title: '',
    expires_at: '',
    is_active: true,
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    post('/admin/short')
  }

  return (
    <AuthenticatedLayout
      header={<h2 className="text-xl font-semibold leading-tight text-gray-800">New Short Link</h2>}
    >
      <Head title="New Short Link" />

      <div className="py-6 sm:py-12">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <ShortLinkForm
              data={data}
              setData={setData}
              errors={errors}
              processing={processing}
              onSubmit={submit}
              submitLabel="Create short link"
            />
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
