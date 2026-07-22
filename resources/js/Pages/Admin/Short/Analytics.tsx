import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Head, Link, router } from '@inertiajs/react'
import { useMemo, useState } from 'react'
import { countryFlag, countryName } from '@/lib/countries'

// Single measure throughout, so one hue rather than a categorical ramp.
const SERIES = '#2a78d6'

interface DailyPoint {
  date: string
  clicks: number
}

interface LinkOption {
  id: number
  code: string
  title: string | null
}

interface LinkRow {
  id: number
  code: string
  title: string | null
  clicks: number
}

interface GroupRow {
  key: string
  clicks: number
}

interface Props {
  days: number
  links: LinkOption[]
  selectedLinkId: number | null
  totalClicks: number
  windowClicks: number
  daily: DailyPoint[]
  byLink: LinkRow[]
  byCountry: GroupRow[]
  byReferer: GroupRow[]
}

const RANGES = [7, 30, 90]

function linkLabel(link: { code: string; title: string | null }) {
  return link.title ? `${link.title} (${link.code})` : link.code
}

function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight text-gray-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  )
}

/** Horizontal ranked list. The bar is a magnitude cue; the number is the value. */
function RankedList({
  title,
  rows,
  empty,
  renderLabel,
}: {
  title: string
  rows: GroupRow[]
  empty: string
  renderLabel: (key: string) => React.ReactNode
}) {
  const max = Math.max(1, ...rows.map((r) => r.clicks))

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>

      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-gray-400">{empty}</p>
      ) : (
        <ol className="mt-4 space-y-2.5">
          {rows.map((row) => (
            <li key={row.key} className="grid grid-cols-[1fr_auto] items-center gap-3">
              <div className="min-w-0">
                <div className="truncate text-sm text-gray-700">{renderLabel(row.key)}</div>
                <div className="mt-1 h-1.5 rounded-full bg-gray-100">
                  <div
                    className="h-1.5 rounded-full"
                    style={{ width: `${(row.clicks / max) * 100}%`, backgroundColor: SERIES }}
                  />
                </div>
              </div>
              <span className="text-sm font-medium tabular-nums text-gray-900">{row.clicks}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

export default function Analytics({
  days,
  links,
  selectedLinkId,
  totalClicks,
  windowClicks,
  daily,
  byLink,
  byCountry,
  byReferer,
}: Props) {
  const [hover, setHover] = useState<DailyPoint | null>(null)

  const max = useMemo(() => Math.max(1, ...daily.map((d) => d.clicks)), [daily])
  const topLink = byLink.find((l) => l.clicks > 0)
  const selectedLink = links.find((l) => l.id === selectedLinkId) ?? null

  const goTo = (params: { days?: number; link?: number | null }) => {
    router.get(
      '/admin/short/analytics',
      {
        days: params.days ?? days,
        link: 'link' in params ? params.link || undefined : selectedLinkId || undefined,
      },
      { preserveState: true, preserveScroll: true },
    )
  }

  const formatDay = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

  return (
    <AuthenticatedLayout
      header={
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold leading-tight text-gray-800">Short Link Analytics</h2>
          <Link href="/admin/short" className="text-sm text-gray-600 hover:text-gray-900">
            Back to links
          </Link>
        </div>
      }
    >
      <Head title="Short Link Analytics" />

      <div className="py-6 sm:py-12">
        <div className="mx-auto max-w-6xl space-y-6 px-4 sm:px-6 lg:px-8">
          {/* Filters sit in one row above the charts. */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1" role="group" aria-label="Time range">
              {RANGES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => goTo({ days: r })}
                  aria-pressed={days === r}
                  className={
                    'rounded-md px-3 py-1.5 text-sm font-medium transition ' +
                    (days === r
                      ? 'bg-gray-900 text-white'
                      : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50')
                  }
                >
                  {r} days
                </button>
              ))}
            </div>

            <select
              value={selectedLinkId ?? ''}
              onChange={(e) => goTo({ link: e.target.value ? Number(e.target.value) : null })}
              className="rounded-md border-gray-300 text-sm text-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">All links</option>
              {links.map((link) => (
                <option key={link.id} value={link.id}>
                  {linkLabel(link)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatTile label={`Clicks in ${days} days`} value={windowClicks.toLocaleString()} />
            <StatTile label="Clicks all time" value={totalClicks.toLocaleString()} />
            {selectedLink ? (
              <StatTile label="Showing" value={selectedLink.code} hint={selectedLink.title ?? undefined} />
            ) : (
              <StatTile
                label="Top link"
                value={topLink ? topLink.code : 'None yet'}
                hint={topLink ? `${topLink.clicks.toLocaleString()} clicks` : 'No clicks yet'}
              />
            )}
          </div>

          {/* Clicks per day. Every day in the window is present, including zeros. */}
          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-baseline justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Clicks per day</h3>
              <p className="text-xs tabular-nums text-gray-500">
                {hover ? `${formatDay(hover.date)} · ${hover.clicks} clicks` : `Peak ${max}`}
              </p>
            </div>

            {windowClicks === 0 ? (
              <p className="mt-6 text-sm text-gray-400">
                No clicks recorded in this window yet. Clicks are tracked when someone follows a short link.
              </p>
            ) : (
              <>
                <div className="mt-4 flex h-40 items-end gap-[2px]" onMouseLeave={() => setHover(null)}>
                  {daily.map((d) => (
                    <button
                      key={d.date}
                      type="button"
                      onMouseEnter={() => setHover(d)}
                      onFocus={() => setHover(d)}
                      title={`${formatDay(d.date)}: ${d.clicks} clicks`}
                      aria-label={`${formatDay(d.date)}: ${d.clicks} clicks`}
                      className="group relative flex h-full flex-1 items-end"
                    >
                      <span
                        className="w-full rounded-t transition-opacity group-hover:opacity-80"
                        style={{
                          // A zero day keeps a hairline so the gap reads as
                          // "measured zero" rather than "no data".
                          height: d.clicks === 0 ? '2px' : `${Math.max(4, (d.clicks / max) * 100)}%`,
                          backgroundColor: d.clicks === 0 ? '#e5e7eb' : SERIES,
                        }}
                      />
                    </button>
                  ))}
                </div>

                <div className="mt-2 flex justify-between text-xs text-gray-400">
                  <span>{formatDay(daily[0].date)}</span>
                  <span>{formatDay(daily[daily.length - 1].date)}</span>
                </div>
              </>
            )}
          </section>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <RankedList
              title="Top countries"
              rows={byCountry}
              empty="No country data yet. Countries resolve once the GeoLite2 database is installed."
              renderLabel={(code) => (
                <span className="inline-flex items-center gap-2">
                  <span aria-hidden="true">{countryFlag(code)}</span>
                  {countryName(code)}
                </span>
              )}
            />

            <RankedList
              title="Top referrers"
              rows={byReferer}
              empty="No referrer data yet."
              renderLabel={(host) => host}
            />
          </div>

          {/* Table view: the same data as the chart, readable without color. Hidden
              when scoped to one link since it would just repeat the stat tiles above. */}
          {!selectedLink && (
            <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
              <h3 className="border-b border-gray-200 px-5 py-4 text-sm font-semibold text-gray-900">
                Clicks by link
              </h3>

              {byLink.length === 0 ? (
                <p className="px-5 py-6 text-sm text-gray-400">No short links yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                      <th scope="col" className="px-5 py-2 font-medium">
                        Link
                      </th>
                      <th scope="col" className="px-5 py-2 text-right font-medium">
                        Clicks
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {byLink.map((link) => (
                      <tr key={link.id}>
                        <td className="px-5 py-3">
                          <Link
                            href={`/admin/short/${link.id}/edit`}
                            className="text-gray-700 hover:text-gray-900"
                          >
                            {linkLabel(link)}
                          </Link>
                        </td>
                        <td className="px-5 py-3 text-right font-medium tabular-nums text-gray-900">
                          {link.clicks.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
