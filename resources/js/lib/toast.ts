import type { ExternalToast } from 'sonner'

// Keep the notification UI off the initial rendering path. The host queues
// messages until its subscription is mounted, including simultaneous results.
function notify(type: 'success' | 'error', message: string, options?: ExternalToast) {
  return import('@/Components/ToastHost').then(({ showToast }) => showToast(type, message, options))
}

export const toast = {
  success: (message: string, options?: ExternalToast) => notify('success', message, options),
  error: (message: string, options?: ExternalToast) => notify('error', message, options),
}
