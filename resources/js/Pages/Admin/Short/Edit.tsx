import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Head, useForm } from '@inertiajs/react'
import ShortLinkForm, { type ShortLinkFormData } from './Partials/ShortLinkForm'

interface ShortLinkRecord {
  id: number
  code: string
  destination_url: string
  title: string | null
  short_url: string
  is_active: boolean
  expires_at: string | null
}

export default function Edit({ link }: { link: ShortLinkRecord }) {
  const { data, setData, put, processing, errors } = useForm<ShortLinkFormData>({
    destination_url: link.destination_url,
    code: link.code,
    title: link.title ?? '',
    expires_at: link.expires_at ?? '',
    is_active: link.is_active,
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    put(`/admin/short/${link.id}`)
  }

  return (
    <AuthenticatedLayout
      header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Edit Short Link</h2>}
    >
      <Head title={`Edit · ${link.code}`} />

      <div className="py-6 sm:py-12">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <ShortLinkForm
              data={data}
              setData={setData}
              errors={errors}
              processing={processing}
              onSubmit={submit}
              submitLabel="Save changes"
              shortUrl={link.short_url}
            />
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
