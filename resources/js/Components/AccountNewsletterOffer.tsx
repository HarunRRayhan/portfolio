import * as Dialog from '@radix-ui/react-dialog'
import { router } from '@inertiajs/react'
import { Mail } from 'lucide-react'
import { useState } from 'react'

/** Shown once, on the first page after a new account agrees to the Terms. Nothing is pre-ticked: one click opts in. */
export function AccountNewsletterOffer({ onClose }: { onClose: () => void }) {
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  const subscribe = () => {
    setBusy(true)
    router.post(route('newsletter.account'), {}, {
      preserveScroll: true,
      preserveState: true,
      onSuccess: () => setDone(true),
      onFinish: () => setBusy(false),
    })
  }

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
            <Mail className="h-5 w-5" aria-hidden />
          </span>
          {done ? (
            <>
              <Dialog.Title className="mt-4 text-xl font-semibold text-slate-950 dark:text-white">You're subscribed</Dialog.Title>
              <Dialog.Description className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                The next issue lands in your inbox. Every email has an unsubscribe link.
              </Dialog.Description>
              <button onClick={onClose} className="mt-6 w-full rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900">
                Done
              </button>
            </>
          ) : (
            <>
              <Dialog.Title className="mt-4 text-xl font-semibold text-slate-950 dark:text-white">Get the weekly newsletter?</Dialog.Title>
              <Dialog.Description className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                New posts and roadmap updates, plus your weekly progress and next lesson, once a week, to the email you signed in with. Unsubscribe anytime.
              </Dialog.Description>
              <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
                <button
                  onClick={subscribe}
                  disabled={busy}
                  className="flex-1 rounded-full bg-amber-500 px-4 py-2.5 text-sm font-semibold text-amber-950 hover:bg-amber-400 disabled:opacity-60"
                >
                  {busy ? 'Subscribing…' : 'Subscribe'}
                </button>
                <button onClick={onClose} className="flex-1 rounded-full border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                  No thanks
                </button>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
