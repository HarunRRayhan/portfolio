import { Link, router, useForm, usePage } from '@inertiajs/react'
import { MessageSquare } from 'lucide-react'
import { FormEvent, useState } from 'react'
import type { PageProps } from '@/types'

export type RoadmapComment = {
  id: number
  content: string
  createdAt: string | null
  user: { id: number; name: string } | null
  replies: RoadmapComment[]
}

const when = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '')

/** Public discussion. Anyone can read; posting and replying needs an account. */
export function Comments({ comments, count, postUrl, loginHref }: { comments: RoadmapComment[]; count: number; postUrl: string; loginHref: string }) {
  const { auth } = usePage<PageProps>().props

  return (
    <section id="comments" className="mt-14 scroll-mt-28">
      <h2 className="inline-flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
        <MessageSquare className="h-5 w-5" aria-hidden /> Comments {count > 0 && <span className="text-slate-400">({count})</span>}
      </h2>

      {auth?.user ? (
        <CommentForm postUrl={postUrl} />
      ) : (
        <p className="mt-4 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">
          <Link href={loginHref} className="font-semibold text-amber-700 underline underline-offset-2 dark:text-amber-400">Log in or sign up</Link> to comment.
        </p>
      )}

      {comments.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">No comments yet.</p>
      ) : (
        <ul className="mt-6 space-y-5">
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
    <form onSubmit={submit} className="mt-4">
      <label htmlFor={id} className="sr-only">{parentId ? 'Your reply' : 'Your comment'}</label>
      <textarea
        id={id}
        value={form.data.content}
        onChange={(e) => form.setData('content', e.target.value)}
        rows={parentId ? 2 : 3}
        maxLength={3000}
        required
        placeholder={parentId ? 'Write a reply' : 'Share a tip, a question or a better resource'}
        className="block w-full rounded-xl border-slate-300 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
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
  const canDelete = !!auth?.user && (auth.user.id === comment.user?.id || auth.isAdmin)
  const remove = () => {
    if (confirm('Delete this comment?')) router.delete(`/roadmaps/comments/${comment.id}`, { preserveScroll: true, preserveState: true })
  }

  return (
    <li>
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
        <p className="text-xs text-slate-500">
          <span className="font-semibold text-slate-800 dark:text-slate-100">{comment.user?.name ?? 'Deleted user'}</span> · {when(comment.createdAt)}
        </p>
        <p className="mt-1 whitespace-pre-line break-words text-sm text-slate-700 dark:text-slate-200">{comment.content}</p>
        <div className="mt-2 flex gap-3 text-xs">
          {auth?.user && depth === 0 && <button onClick={() => setReplying(!replying)} className="font-medium text-amber-700 dark:text-amber-400">Reply</button>}
          {canDelete && <button onClick={remove} className="text-slate-500 hover:text-red-600">Delete</button>}
        </div>
      </div>
      {replying && <div className="ml-6"><CommentForm postUrl={postUrl} parentId={comment.id} onDone={() => setReplying(false)} /></div>}
      {comment.replies.length > 0 && (
        <ul className="ml-6 mt-3 space-y-3 border-l-2 border-slate-100 pl-4 dark:border-slate-800">
          {comment.replies.map((r) => <CommentItem key={r.id} comment={r} postUrl={postUrl} depth={depth + 1} />)}
        </ul>
      )}
    </li>
  )
}
