import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Head, router } from '@inertiajs/react'
import { useState } from 'react'
import { Mail } from 'lucide-react'

export default function Templates({ ownerEmail }: { ownerEmail: string }) {
  const [sending, setSending] = useState(false)

  const sendTest = () =>
    router.post(route('admin.newsletter.test'), {}, {
      preserveScroll: true,
      onStart: () => setSending(true),
      onFinish: () => setSending(false),
    })

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Templates</h2>}>
      <Head title="Newsletter templates" />

      <div className="py-6 sm:py-12">
        <div className="mx-auto max-w-5xl space-y-4 px-4 sm:px-6 lg:px-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border-2 border-indigo-200 bg-white px-5 py-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="font-medium text-gray-900">Weekly digest</p>
                <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">Default · in use</span>
              </div>
              <p className="mt-1 text-sm text-gray-500">Up to three posts from the last week, two products and curated X posts.</p>
            </div>
            <div className="rounded-lg border border-dashed border-gray-300 px-5 py-4">
              <p className="font-medium text-gray-400">More templates</p>
              <p className="mt-1 text-sm text-gray-400">Coming soon.</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-3">
              <p className="text-sm text-gray-500">Preview with this week's posts (or the latest ones when nothing new went out).</p>
              <button
                type="button"
                onClick={sendTest}
                disabled={sending}
                className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
              >
                <Mail className="h-4 w-4" />
                {sending ? 'Sending…' : `Send test to ${ownerEmail}`}
              </button>
            </div>
            <iframe title="Weekly digest preview" src={route('admin.newsletter.preview')} className="h-[80vh] w-full" />
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
