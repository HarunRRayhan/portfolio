import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Head, router, useForm } from '@inertiajs/react'
import BioLinkForm, { type BioLinkFormData } from './Partials/BioLinkForm'

interface BioLinkRecord {
  id: number
  label: string
  description: string | null
  url: string
  icon: string
  thumbnail_url: string | null
  featured: boolean
  tab: string | null
  tab_slug: string | null
  priority: number
  expires_at: string | null
  is_active: boolean
  include_countries: string[] | null
  exclude_countries: string[] | null
}

export default function Edit({ link }: { link: BioLinkRecord }) {
  const { data, setData, processing, errors } = useForm<BioLinkFormData>({
    label: link.label,
    description: link.description ?? '',
    url: link.url,
    icon: link.icon ?? 'link',
    thumbnail: null,
    featured: link.featured,
    remove_thumbnail: false,
    tab: link.tab ?? 'default',
    tab_slug: link.tab_slug ?? '',
    priority: link.priority ?? 100,
    expires_at: link.expires_at ?? '',
    is_active: link.is_active,
    include_countries: link.include_countries ?? [],
    exclude_countries: link.exclude_countries ?? [],
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    // PHP never populates $_FILES for PUT bodies, multipart or not, so a real
    // file upload has to ride in on a POST with a spoofed _method instead.
    router.post(`/admin/bio/${link.id}`, { ...data, _method: 'put' }, { forceFormData: true })
  }

  return (
    <AuthenticatedLayout
      header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Edit Bio Link</h2>}
    >
      <Head title={`Edit · ${link.label}`} />

      <div className="py-6 sm:py-12">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <BioLinkForm
              data={data}
              setData={setData}
              errors={errors}
              processing={processing}
              onSubmit={submit}
              submitLabel="Save changes"
              existingThumbnailUrl={link.thumbnail_url}
            />
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
