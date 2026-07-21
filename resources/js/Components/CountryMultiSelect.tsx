import { COUNTRY_OPTIONS, countryFlag, countryName } from '@/lib/countries'
import { X } from 'lucide-react'
import { useMemo, useState } from 'react'

interface Props {
  id: string
  selected: string[]
  onChange: (codes: string[]) => void
  placeholder?: string
}

/**
 * Searchable multi-select over ISO country codes. Selected countries render as
 * removable chips; the list below filters as you type and hides anything already
 * chosen.
 */
export default function CountryMultiSelect({ id, selected, onChange, placeholder }: Props) {
  const [query, setQuery] = useState('')

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    const available = COUNTRY_OPTIONS.filter((c) => !selected.includes(c.code))

    if (!q) return available.slice(0, 8)

    return available
      .filter((c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q))
      .slice(0, 8)
  }, [query, selected])

  const add = (code: string) => {
    onChange([...selected, code])
    setQuery('')
  }

  return (
    <div>
      {selected.length > 0 && (
        <ul className="mb-2 flex flex-wrap gap-1.5">
          {selected.map((code) => (
            <li key={code}>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 py-1 pl-2.5 pr-1 text-xs font-medium text-indigo-700">
                <span aria-hidden="true">{countryFlag(code)}</span>
                {countryName(code)}
                <button
                  type="button"
                  onClick={() => onChange(selected.filter((c) => c !== code))}
                  aria-label={`Remove ${countryName(code)}`}
                  className="rounded-full p-0.5 text-indigo-400 transition hover:bg-indigo-100 hover:text-indigo-700"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <input
        id={id}
        type="text"
        role="combobox"
        aria-expanded={matches.length > 0}
        aria-controls={`${id}-options`}
        autoComplete="off"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder ?? 'Search countries...'}
        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
      />

      {matches.length > 0 && (
        <ul
          id={`${id}-options`}
          className="mt-1 max-h-48 overflow-y-auto rounded-md border border-gray-200 bg-white py-1 shadow-sm"
        >
          {matches.map((c) => (
            <li key={c.code}>
              <button
                type="button"
                onClick={() => add(c.code)}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-gray-700 transition hover:bg-indigo-50 hover:text-indigo-700"
              >
                <span aria-hidden="true">{c.flag}</span>
                <span className="flex-1">{c.name}</span>
                <span className="font-mono text-xs text-gray-400">{c.code}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
