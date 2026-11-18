import { Link, router, useForm, usePage } from '@inertiajs/react'
import { MessageSquare } from 'lucide-react'
import { FormEvent, useState } from 'react'
import type { PageProps } from '@/types'
import UserAvatar from '@/Components/UserAvatar'
import SponsorTag from '@/Components/SponsorTag'

export type RoadmapComment = {
  id: number
  content: string
  createdAt: string | null
  user: { mine: boolean; name: string; avatarUrl: string | null; profile: string; sponsor: boolean } | null
  replies: RoadmapComment[]
}

const when = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '')

const initial = (name?: string | null) => (name?.trim().charAt(0) || '?').toUpperCase()

function Avatar({ name, small }: { name?: string | null; small?: boolean }) {
  return (
    <span aria-hidden className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 font-semibold text-amber-950 ${small ? 'h-7 w-7 text-xs' : 'h-9 w-9 text-sm'}`}>
      {initial(name)}
    </span>
  )
}

/** Public discussion. Anyone can read; posting and replying needs an account. */
export function Comments({ comments, count, postUrl, loginHref }: { comments: RoadmapComment[]; count: number; postUrl: string; loginHref: string }) {
  const { auth } = usePage<PageProps>().props

  return (
    <section id="comments" aria-labelledby="comments-title" className="mt-16 scroll-mt-28 rounded-3xl border border-slate-200 bg-slate-50 p-5 sm:p-8 dark:border-slate-800 dark:bg-slate-900/60">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="comments-title" className="inline-flex items-center gap-2 text-xl font-semibold text-slate-900 dark:text-white">
            <MessageSquare className="h-5 w-5 text-amber-600" aria-hidden /> Discussion
            {count > 0 && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300">{count}</span>}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Tips, questions and better resources from other learners.</p>
        </div>
      </div>

      {auth?.user ? (
        <div className="mt-6 flex gap-3">
          <Avatar name={auth.user.name} />
          <div className="min-w-0 flex-1"><CommentForm postUrl={postUrl} /></div>
        </div>
      ) : (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm text-slate-600 dark:text-slate-300">Log in or sign up to comment.</p>
          <Link href={loginHref} className="rounded-full bg-slate-900 px-4 py-1.5 text-sm font-semibold text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900">Log in or sign up</Link>
        </div>
      )}

      {comments.length === 0 ? (
        <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">No comments yet. Start the discussion.</p>
      ) : (
        <ul className="mt-8 space-y-6">
          {comments.map((c) => <CommentItem key={c.id} comment={c} postUrl={postUrl} />)}
        </ul>
      )}
    </section>
  )
}

function CommentForm({ postUrl, parentId, onDone }: { postUrl: string; parentId?: number; onDone?: () => void }) {
  const form = useForm({ content: '', parent_id: parentId ?? null })
  const submit = (e: FormEvent) => {
    e.preventDefault()
    form.post(postUrl, { preserveScroll: true, preserveState: true, onSuccess: () => { form.reset('content'); onDone?.() } })
  }
  const id = `comment-${parentId ?? 'new'}`

  return (
    <form onSubmit={submit} className={parentId ? 'mt-3' : ''}>
      <label htmlFor={id} className="sr-only">{parentId ? 'Your reply' : 'Your comment'}</label>
      <textarea
        id={id}
        value={form.data.content}
        onChange={(e) => form.setData('content', e.target.value)}
        rows={parentId ? 2 : 3}
        maxLength={3000}
        required
        placeholder={parentId ? 'Write a reply' : 'Share a tip, a question or a better resource'}
        className="block w-full rounded-2xl border-slate-200 bg-white text-sm shadow-sm focus:border-amber-400 focus:ring-amber-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
      />
      {form.errors.content && <p className="mt-1 text-xs text-red-600">{form.errors.content}</p>}
      <div className="mt-2 flex gap-2">
        <button type="submit" disabled={form.processing || !form.data.content.trim()} className="rounded-full bg-slate-900 px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-slate-900">
          {parentId ? 'Reply' : 'Post comment'}
        </button>
        {onDone && <button type="button" onClick={onDone} className="rounded-full px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300">Cancel</button>}
      </div>
    </form>
  )
}

function CommentItem({ comment, postUrl, depth = 0 }: { comment: RoadmapComment; postUrl: string; depth?: number }) {
  const { auth } = usePage<PageProps>().props
  const [replying, setReplying] = useState(false)
  const canDelete = !!auth?.user && (!!comment.user?.mine || auth.isAdmin)
  const remove = () => {
    if (confirm('Delete this comment?')) router.delete(`/roadmaps/comments/${comment.id}`, { preserveScroll: true, preserveState: true })
  }

  return (
    <li className="flex gap-3">
      {comment.user ? (
        <UserAvatar name={comment.user.name} url={comment.user.avatarUrl} className={depth > 0 ? 'h-7 w-7 text-xs' : undefined} />
      ) : (
        <Avatar name={null} small={depth > 0} />
      )}
      <div className="min-w-0 flex-1">
        <div className="rounded-2xl rounded-tl-sm bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
          <p className="text-xs text-slate-500">
            {comment.user ? (
              <>
                <Link href={`/u/${comment.user.profile}`} className="font-semibold text-slate-800 hover:underline dark:text-slate-100">{comment.user.name}</Link>
                {comment.user.sponsor && <> <SponsorTag /></>}
              </>
            ) : (
              <span className="font-semibold text-slate-800 dark:text-slate-100">Deleted user</span>
            )} · {when(comment.createdAt)}
          </p>
          <p className="mt-1 whitespace-pre-line break-words text-sm leading-6 text-slate-700 dark:text-slate-200">{comment.content}</p>
        </div>
        <div className="mt-1.5 flex gap-3 pl-1 text-xs">
          {auth?.user && depth === 0 && <button onClick={() => setReplying(!replying)} className="font-medium text-amber-700 hover:underline dark:text-amber-400">Reply</button>}
          {canDelete && <button onClick={remove} className="text-slate-500 hover:text-red-600">Delete</button>}
        </div>
        {replying && <CommentForm postUrl={postUrl} parentId={comment.id} onDone={() => setReplying(false)} />}
        {comment.replies.length > 0 && (
          <ul className="mt-4 space-y-4">
            {comment.replies.map((r) => <CommentItem key={r.id} comment={r} postUrl={postUrl} depth={depth + 1} />)}
          </ul>
        )}
      </div>
    </li>
  )
}
