import { useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster, toast, type ExternalToast } from 'sonner'

type Notification = { type: 'success' | 'error'; message: string; options?: ExternalToast }
const pending: Notification[] = []
let mounted = false
let ready = false

function flush() {
  for (const { type, message, options } of pending.splice(0)) toast[type](message, options)
}

function ToastHost() {
  useEffect(() => {
    ready = true
    flush()
  }, [])

  return <Toaster position="top-right" richColors />
}

export function showToast(type: Notification['type'], message: string, options?: ExternalToast) {
  pending.push({ type, message, options })
  if (ready) {
    flush()
  } else if (!mounted) {
    mounted = true
    const container = document.createElement('div')
    container.dataset.toastHost = ''
    document.body.appendChild(container)
    createRoot(container).render(<ToastHost />)
  }
}
