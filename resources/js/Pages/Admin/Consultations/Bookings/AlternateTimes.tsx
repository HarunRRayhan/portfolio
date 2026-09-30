import { useEffect, useMemo, useState } from 'react'
import { fieldErrorProps, type FormErrors } from '../Partials/FormFeedback'

type Slot = { start: string; end: string }

function localDateKey(value: string) {
  const date = new Date(value)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export default function AlternateTimes({ slots, selected, onToggle, disabled, errors, summaryId }: {
  slots: Slot[]
  selected: string[]
  onToggle: (start: string) => void
  disabled: boolean
  errors: FormErrors
  summaryId: string
}) {
  const days = useMemo(() => {
    const grouped = new Map<string, Slot[]>()
    for (const slot of [...slots].sort((a, b) => Date.parse(a.start) - Date.parse(b.start))) {
      const key = localDateKey(slot.start)
      grouped.set(key, [...(grouped.get(key) ?? []), slot])
    }
    return [...grouped].map(([date, times]) => ({ date, times }))
  }, [slots])
  const [selectedDate, setSelectedDate] = useState(days[0]?.date ?? '')
  useEffect(() => {
    setSelectedDate(current => days.some(day => day.date === current) ? current : days[0]?.date ?? '')
  }, [days])
  const dayIndex = days.findIndex(day => day.date === selectedDate)
  const currentDay = days[dayIndex]
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

  if (!slots.length) {
    return <p className="text-sm text-gray-500">No alternate times are available. Check your availability and calendar before trying again.</p>
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">{slots.length} available times across {days.length} dates · {timezone}</p>
      <label htmlFor="alternate-date" className="block text-sm font-medium text-gray-700">Alternate date</label>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" disabled={disabled || dayIndex <= 0} onClick={() => setSelectedDate(days[dayIndex - 1].date)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm disabled:opacity-40">Previous date</button>
        <select id="alternate-date" value={selectedDate} disabled={disabled} onChange={event => setSelectedDate(event.target.value)}
          className="min-w-0 flex-1 rounded-md border border-gray-300 px-2 py-2 text-sm">
          {days.map(day => <option key={day.date} value={day.date}>
            {new Date(day.times[0].start).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
          </option>)}
        </select>
        <button type="button" disabled={disabled || dayIndex >= days.length - 1} onClick={() => setSelectedDate(days[dayIndex + 1].date)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm disabled:opacity-40">Next date</button>
      </div>
      <fieldset disabled={disabled} {...fieldErrorProps(errors, 'slots', summaryId)} className="grid max-h-48 gap-2 overflow-y-auto sm:grid-cols-2">
        <legend className="sr-only">Alternate consultation times</legend>
        {currentDay?.times.map(slot => (
          <label key={slot.start} className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" {...fieldErrorProps(errors, 'slots', summaryId)} checked={selected.includes(slot.start)} onChange={() => onToggle(slot.start)} />
            {new Date(slot.start).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
            {' – '}{new Date(slot.end).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
          </label>
        ))}
      </fieldset>
      <p role="status" className="text-sm text-gray-600">{selected.length} {selected.length === 1 ? 'time' : 'times'} selected</p>
    </div>
  )
}
