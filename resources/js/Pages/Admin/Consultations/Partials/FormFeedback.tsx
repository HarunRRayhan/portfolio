import { router } from '@inertiajs/react'
import type { RequestPayload } from '@inertiajs/core'
import { useEffect, useRef, useState } from 'react'

export type FormErrors = Record<string, string>

export function useConsultationAction() {
  const [errors, setErrors] = useState<FormErrors>({})
  const [processing, setProcessing] = useState(false)
  const pending = useRef(false)

  const submit = (
    url: string,
    data: RequestPayload = {},
    method: 'post' | 'put' | 'delete' = 'post',
    onSuccess?: () => void,
  ) => {
    if (pending.current) return
    pending.current = true
    setProcessing(true)
    setErrors({})
    router.visit(url, {
      method,
      data,
      preserveScroll: true,
      preserveState: true,
      onError: (validationErrors) => setErrors(validationErrors),
      onSuccess: () => onSuccess?.(),
      onFinish: () => {
        pending.current = false
        setProcessing(false)
      },
    })
  }

  return { errors, processing, submit }
}

export function ErrorSummary({ errors, id }: { errors: FormErrors; id: string }) {
  const summary = useRef<HTMLDivElement>(null)
  const entries = Object.entries(errors).filter(([, message]) => Boolean(message))

  useEffect(() => {
    if (Object.values(errors).some(Boolean)) summary.current?.focus()
  }, [errors])

  if (!entries.length) return null

  return (
    <div ref={summary} id={id} role="alert" tabIndex={-1}
      className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 focus:outline focus:outline-2 focus:outline-red-600">
      <p className="font-medium">Please check the following:</p>
      <ul className="mt-1 list-disc space-y-1 pl-5">
        {entries.map(([field, message]) => <li key={field}>{message}</li>)}
      </ul>
    </div>
  )
}

export function fieldErrorProps(errors: FormErrors, field: string, summaryId: string) {
  const invalid = Object.keys(errors).some((key) => key === field || key.startsWith(`${field}.`))
  return {
    'aria-invalid': invalid || undefined,
    'aria-describedby': invalid ? summaryId : undefined,
  }
}
