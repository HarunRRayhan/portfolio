import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Head, router } from '@inertiajs/react'
import { FormEvent, useState } from 'react'

type WindowRow = {
  id?: number
  weekday: number
  start_time: string
  end_time: string
  is_active: boolean
}

const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function Availability({
  scheduleTimezone,
  windows: initialWindows,
  googleConnected,
  googleEmail,
  timezones,
}: {
  scheduleTimezone: string
  windows: WindowRow[]
  googleConnected: boolean
  googleEmail: string | null
  timezones: string[]
}) {
  const [windows, setWindows] = useState<WindowRow[]>(
    initialWindows.length
      ? initialWindows
      : [{ weekday: 1, start_time: '10:00', end_time: '13:00', is_active: true }],
  )
  const [tz, setTz] = useState(scheduleTimezone)

  const save = (e: FormEvent) => {
    e.preventDefault()
    router.put('/admin/consultations/availability', {
      schedule_timezone: tz,
      windows: windows.map((w) => ({
        weekday: w.weekday,
        start_time: w.start_time,
        end_time: w.end_time,
        is_active: w.is_active,
      })),
    })
  }

  const addWindow = () => {
    setWindows((w) => [...w, { weekday: 1, start_time: '10:00', end_time: '12:00', is_active: true }])
  }

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-800">Availability</h2>}>
      <Head title="Consultation availability" />

      <div className="py-6 sm:py-12">
        <div className="mx-auto max-w-3xl space-y-6 px-4 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm space-y-3">
            <h3 className="font-semibold text-gray-900">Google Calendar</h3>
            {googleConnected ? (
              <>
                <p className="text-sm text-gray-600">Connected{googleEmail ? ` as ${googleEmail}` : ''}.</p>
                <button
                  type="button"
                  onClick={() => router.post('/admin/consultations/google/disconnect')}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                >
                  Disconnect
                </button>
              </>
            ) : (
              <a
                href="/admin/consultations/google/redirect"
                className="inline-flex rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white"
              >
                Connect Google Calendar
              </a>
            )}
          </div>

          <form onSubmit={save} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm space-y-4">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-gray-700">Schedule timezone (wall-clock windows)</span>
              <select
                value={tz}
                onChange={(e) => setTz(e.target.value)}
                className="w-full rounded-md border border-gray-200 px-3 py-2"
              >
                {timezones.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <span className="mt-1 block text-xs text-gray-500">
                Slots are stored in UTC; visitors see times in their browser timezone.
              </span>
            </label>

            <div className="space-y-3">
              {windows.map((w, i) => (
                <div key={i} className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  <select
                    value={w.weekday}
                    onChange={(e) => {
                      const next = [...windows]
                      next[i] = { ...w, weekday: Number(e.target.value) }
                      setWindows(next)
                    }}
                    className="rounded-md border border-gray-200 px-2 py-2 text-sm"
                  >
                    {weekdayLabels.map((label, idx) => (
                      <option key={label} value={idx}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="time"
                    value={w.start_time}
                    onChange={(e) => {
                      const next = [...windows]
                      next[i] = { ...w, start_time: e.target.value }
                      setWindows(next)
                    }}
                    className="rounded-md border border-gray-200 px-2 py-2 text-sm"
                  />
                  <input
                    type="time"
                    value={w.end_time}
                    onChange={(e) => {
                      const next = [...windows]
                      next[i] = { ...w, end_time: e.target.value }
                      setWindows(next)
                    }}
                    className="rounded-md border border-gray-200 px-2 py-2 text-sm"
                  />
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={w.is_active}
                      onChange={(e) => {
                        const next = [...windows]
                        next[i] = { ...w, is_active: e.target.checked }
                        setWindows(next)
                      }}
                    />
                    Active
                  </label>
                  <button
                    type="button"
                    onClick={() => setWindows(windows.filter((_, j) => j !== i))}
                    className="text-sm text-rose-600"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button type="button" onClick={addWindow} className="rounded-md border border-gray-300 px-3 py-2 text-sm">
                Add window
              </button>
              <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white">
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
