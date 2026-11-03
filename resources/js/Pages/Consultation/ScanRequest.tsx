import { Head, Link, useForm } from '@inertiajs/react'
import { Loader2, Sparkles } from 'lucide-react'
import { FormEvent } from 'react'

const inputClass = 'w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-white outline-none ring-slate-400 focus:ring-2'
const buttonClass = 'inline-flex items-center justify-center gap-2 bg-slate-900 px-5 py-3 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200'

export default function ScanRequest({
  scanCredit,
  contactEmail,
  bookUrl,
}: {
  scanCredit: { id: number; expires_at: string } | null
  contactEmail: string
  bookUrl: string
}) {
  const form = useForm({ repo_url: '', notes: '' })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    form.post('/consultation/scan')
  }

  return (
    <>
      <Head title="Open-source scan" />
      <section className="border-b border-slate-200 dark:border-slate-800 bg-gradient-to-b from-slate-50 dark:from-slate-950 to-white dark:to-slate-950 py-16 sm:py-20">
        <div className="container mx-auto max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-md border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 px-3 py-1.5 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Open-source scan
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Request a scan
          </h1>
          <p className="mt-4 text-lg leading-7 text-slate-500 dark:text-slate-400">
            I run my security, code and infra reviews on one public GitHub repo and send you the report.
          </p>
        </div>
      </section>

      <section className="bg-white dark:bg-slate-900 py-14 sm:py-16">
        <div className="container mx-auto max-w-2xl">
          {scanCredit ? (
            <form onSubmit={submit} className="space-y-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Uses your scan credit. Valid until {new Date(scanCredit.expires_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}.
              </p>
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-slate-700 dark:text-slate-200">Repo URL</span>
                <input
                  required
                  type="url"
                  placeholder="https://github.com/you/project"
                  className={inputClass}
                  value={form.data.repo_url}
                  onChange={(e) => form.setData('repo_url', e.target.value)}
                />
                {form.errors.repo_url && <span className="mt-1 block text-sm text-red-600">{form.errors.repo_url}</span>}
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-slate-700 dark:text-slate-200">Notes (optional)</span>
                <textarea
                  rows={4}
                  maxLength={5000}
                  className={inputClass}
                  value={form.data.notes}
                  onChange={(e) => form.setData('notes', e.target.value)}
                />
                {form.errors.notes && <span className="mt-1 block text-sm text-red-600">{form.errors.notes}</span>}
              </label>
              <button type="submit" disabled={form.processing} className={buttonClass}>
                {form.processing && <Loader2 className="h-4 w-4 animate-spin" />}
                Send request
              </button>
            </form>
          ) : (
            <div className="border border-slate-200 dark:border-slate-800 p-6 text-sm text-slate-700 dark:text-slate-200">
              <p>You don’t have a scan credit right now. Scans come with the $499/mo sponsorship.</p>
              <p className="mt-2 text-slate-500 dark:text-slate-400">
                Think this is a mistake? Email <a className="underline underline-offset-4" href={`mailto:${contactEmail}`}>{contactEmail}</a>.
              </p>
              <Link href={bookUrl} className={`${buttonClass} mt-5`}>Back to consultation</Link>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
