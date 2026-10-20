import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Head, Link, router } from '@inertiajs/react'
import { useState } from 'react'
import { Eye, Send } from 'lucide-react'

interface Campaign {
  id: number
  key: string
  subject: string
  post_count: number
  subscriber_count: number
  sent_count: number
  failed_count: number
  pending_count: number
  opened_count: number
  click_count: number
  clicker_count: number
  links: { url: string; clicks: number; people: number }[]
  created_at: string | null
  sent_at: string | null
  failures: { id: number; masked_email: string; error: string | null }[]
}

interface Props {
  campaigns: {
    data: Campaign[]
    prev_page_url: string | null
    next_page_url: string | null
    total: number
  }
  schedule: { day: number; time: string; timezone: string }
  activeSubscribers: number
  sentThisWeekAt: string | null
}

const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function formatDateTime(value: string | null) {
  if (!value) return null
  return new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

function successRate(campaign: Campaign) {
  const attempted = campaign.sent_count + campaign.failed_count + campaign.pending_count
  return attempted === 0 ? null : Math.round((campaign.sent_count / attempted) * 1000) / 10
}

function percent(part: number, whole: number) {
  return whole === 0 ? null : Math.round((part / whole) * 1000) / 10
}

function CampaignRow({ campaign }: { campaign: Campaign }) {
  const [open, setOpen] = useState(false)
  const rate = successRate(campaign)
  const openRate = percent(campaign.opened_count, campaign.sent_count)
  const sentAt = formatDateTime(campaign.sent_at)

  return (
    <>
      <tr className="text-sm text-gray-700">
        <td className="px-4 py-3">
          <p className="font-medium text-gray-900">{campaign.subject}</p>
          <p className="text-xs text-gray-400">
            {campaign.key} · {campaign.post_count} {campaign.post_count === 1 ? 'post' : 'posts'}
          </p>
        </td>
        <td className="px-4 py-3 text-gray-500">
          {sentAt ?? <span className="text-amber-600">Not finished</span>}
          {!sentAt && campaign.created_at && (
            <p className="text-xs text-gray-400">started {formatDateTime(campaign.created_at)}</p>
          )}
        </td>
        <td className="px-4 py-3 tabular-nums">{campaign.subscriber_count}</td>
        <td className="px-4 py-3 tabular-nums">
          <span className="text-emerald-700">{campaign.sent_count} sent</span>
          {campaign.failed_count > 0 && (
            <button type="button" onClick={() => setOpen(!open)} className="ml-2 text-red-600 underline">
              {campaign.failed_count} failed
            </button>
          )}
          {campaign.pending_count > 0 && <span className="ml-2 text-gray-400">{campaign.pending_count} pending</span>}
        </td>
        <td className="px-4 py-3 font-medium tabular-nums">{rate === null ? '—' : `${rate}%`}</td>
        <td className="px-4 py-3 tabular-nums">
          {campaign.opened_count}
          {openRate !== null && <span className="text-gray-400"> · {openRate}%</span>}
        </td>
        <td className="px-4 py-3 tabular-nums">
          {campaign.click_count > 0 ? (
            <button type="button" onClick={() => setOpen(!open)} className="text-indigo-700 underline">
              {campaign.click_count} from {campaign.clicker_count} {campaign.clicker_count === 1 ? 'person' : 'people'}
            </button>
          ) : (
            <span className="text-gray-400">0</span>
          )}
        </td>
      </tr>
      {open && (
        <tr>
          <td colSpan={7} className="space-y-3 bg-gray-50 px-4 py-3">
            {campaign.links.length > 0 && (
              <ul className="space-y-1 text-xs">
                {campaign.links.map((link) => (
                  <li key={link.url} className="flex gap-3">
                    <span className="w-28 shrink-0 tabular-nums text-gray-800">
                      {link.clicks} {link.clicks === 1 ? 'click' : 'clicks'} · {link.people}
                    </span>
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="truncate text-gray-500 hover:underline">
                      {link.url}
                    </a>
                  </li>
                ))}
              </ul>
            )}
            <ul className="space-y-1 text-xs">
              {campaign.failures.map((failure) => (
                <li key={failure.id}>
                  <span className="font-mono text-gray-800">{failure.masked_email}</span>
                  <span className="text-gray-500"> · {failure.error ?? 'unknown error'}</span>
                </li>
              ))}
            </ul>
          </td>
        </tr>
      )}
    </>
  )
}

export default function Campaigns({ campaigns, schedule, activeSubscribers, sentThisWeekAt }: Props) {
  const [sending, setSending] = useState(false)

  const sendNow = () => {
    const message = sentThisWeekAt
      ? `You already sent a newsletter this week (${formatDateTime(sentThisWeekAt)}). Are you sure you want to send it again?`
      : `Send this week's newsletter to ${activeSubscribers} active subscribers now? Failed deliveries from this week are retried.`
    if (!confirm(message)) return
    router.post(route('admin.newsletter.send'), {}, {
      preserveScroll: true,
      onStart: () => setSending(true),
      onFinish: () => setSending(false),
    })
  }

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Campaigns</h2>}>
      <Head title="Newsletter campaigns" />

      <div className="py-6 sm:py-12">
        <div className="mx-auto max-w-5xl space-y-4 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-5 py-4 shadow-sm">
            <div className="text-sm text-gray-600">
              <p>
                Sends automatically every <strong>{weekdays[schedule.day]}</strong> at <strong>{schedule.time}</strong> ({schedule.timezone})
                when a post went out in the last seven days.
              </p>
              <p className="text-gray-400">{activeSubscribers} active subscribers. You get one copy of each campaign.</p>
            </div>
            <div className="flex gap-2">
              <a
                href={route('admin.newsletter.preview')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50"
              >
                <Eye className="h-4 w-4" />
                Preview email
              </a>
              <button
                type="button"
                onClick={sendNow}
                disabled={sending}
                className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                {sending ? 'Sending…' : 'Send now'}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
            {campaigns.data.length === 0 ? (
              <p className="px-6 py-16 text-center text-sm text-gray-500">No campaigns have gone out yet.</p>
            ) : (
              <table className="min-w-full divide-y divide-gray-100">
                <thead>
                  <tr className="text-left text-xs font-medium uppercase tracking-wide text-gray-400">
                    <th className="px-4 py-3">Campaign</th>
                    <th className="px-4 py-3">Sent</th>
                    <th className="px-4 py-3">Recipients</th>
                    <th className="px-4 py-3">Deliveries</th>
                    <th className="px-4 py-3">Success</th>
                    <th className="px-4 py-3">Opened</th>
                    <th className="px-4 py-3">Clicks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {campaigns.data.map((campaign) => (
                    <CampaignRow key={campaign.id} campaign={campaign} />
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {(campaigns.prev_page_url || campaigns.next_page_url) && (
            <nav className="flex justify-center gap-2 text-sm font-medium">
              {campaigns.prev_page_url && <Link href={campaigns.prev_page_url} className="rounded-md px-3 py-1.5 ring-1 ring-gray-200 hover:bg-gray-50">« Newer</Link>}
              {campaigns.next_page_url && <Link href={campaigns.next_page_url} className="rounded-md px-3 py-1.5 ring-1 ring-gray-200 hover:bg-gray-50">Older »</Link>}
            </nav>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
