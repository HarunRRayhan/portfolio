'use client'

import { useMemo, useState, type FormEvent } from 'react'
import { Link, useForm, usePage } from '@inertiajs/react'
import SocialLoginButtons from '@/Components/SocialLoginButtons'
import { Button } from '@/Components/ui/button'
import { Textarea } from '@/Components/ui/textarea'
import { cn } from '@/lib/utils'
import { LogIn, MessageSquare, Reply, Send } from 'lucide-react'

type BlogCommentUser = {
  id: number
  name: string
  email?: string | null
}

type BlogCommentNode = {
  id: number
  content: string
  createdAtIso: string
  createdAtHuman: string
  parentId: number | null
  user: BlogCommentUser | null
  children: BlogCommentNode[]
}

interface BlogDiscussionProps {
  slug: string
  title: string
  commentCount: number
  comments: BlogCommentNode[]
}

type InertiaAuthProps = {
  auth: {
    user: BlogCommentUser | null
  }
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function CommentAvatar({ name }: { name: string }) {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-500 text-xs font-semibold text-white shadow-sm">
      {getInitials(name)}
    </div>
  )
}

function CommentItem({
  comment,
  depth = 0,
  onReply,
}: {
  comment: BlogCommentNode
  depth?: number
  onReply: (comment: BlogCommentNode) => void
}) {
  const authorName = comment.user?.name ?? 'Anonymous'

  return (
    <article className={cn('rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm', depth > 0 && 'ml-4 border-l-4 border-l-violet-200')}>
      <div className="flex items-start gap-3">
        <CommentAvatar name={authorName} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">{authorName}</p>
              <p className="text-xs text-slate-500">{comment.createdAtHuman}</p>
            </div>

            <button
              type="button"
              onClick={() => onReply(comment)}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-violet-300 hover:text-violet-700"
            >
              <Reply className="h-3.5 w-3.5" />
              Reply
            </button>
          </div>

          <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">{comment.content}</p>
        </div>
      </div>

      {comment.children.length > 0 ? (
        <div className="mt-4 space-y-4">
          {comment.children.map((child) => (
            <CommentItem key={child.id} comment={child} depth={depth + 1} onReply={onReply} />
          ))}
        </div>
      ) : null}
    </article>
  )
}

export function BlogDiscussion({ slug, title, commentCount, comments }: BlogDiscussionProps) {
  const { auth } = usePage().props as InertiaAuthProps
  const [replyTarget, setReplyTarget] = useState<BlogCommentNode | null>(null)
  const { data, setData, post, processing, errors, reset } = useForm<{
    content: string
    parent_id: number | null
  }>({
    content: '',
    parent_id: null,
  })

  const submitUrl = route('blog.comments.store', slug)
  const isAuthenticated = Boolean(auth?.user)

  const commentHeading = useMemo(() => {
    if (commentCount === 1) {
      return '1 comment'
    }

    return `${commentCount} comments`
  }, [commentCount])

  const submitComment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    post(submitUrl, {
      preserveScroll: true,
      onSuccess: () => {
        reset('content', 'parent_id')
        setReplyTarget(null)
      },
    })
  }

  const handleReply = (comment: BlogCommentNode) => {
    setReplyTarget(comment)
    setData('parent_id', comment.id)
  }

  return (
    <section id="discussion" className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,252,0.92),rgba(255,255,255,1))] px-6 py-6 md:px-8 md:py-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-700">Discussion</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Join the conversation</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
              A focused discussion space with threaded replies and an unobtrusive editor.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
            <MessageSquare className="h-4 w-4 text-violet-600" />
            {commentHeading}
          </div>
        </div>
      </div>

      <div className="grid gap-8 p-6 md:p-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.85fr)]">
        <div className="space-y-4">
          {comments.length > 0 ? (
            comments.map((comment) => <CommentItem key={comment.id} comment={comment} onReply={handleReply} />)
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-6 text-sm leading-7 text-slate-600">
              <p className="font-semibold text-slate-900">No comments yet.</p>
              <p className="mt-2">Be the first to start the thread on {title}.</p>
            </div>
          )}
        </div>

        <aside className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 shadow-sm lg:sticky lg:top-24 lg:self-start">
          {isAuthenticated ? (
            <form onSubmit={submitComment} className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Write a comment</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Signed in as <span className="font-medium text-slate-900">{auth.user?.name}</span>.
                </p>
              </div>

              {replyTarget ? (
                <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-900">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">Replying to {replyTarget.user?.name ?? 'a comment'}</p>
                      <p className="mt-1 text-xs text-violet-700">Clear this if you want to post a new top-level comment.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setReplyTarget(null)
                        setData('parent_id', null)
                      }}
                      className="text-xs font-medium text-violet-700 underline decoration-violet-300 underline-offset-2"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              ) : null}

              <div>
                <Textarea
                  value={data.content}
                  onChange={(event) => setData('content', event.target.value)}
                  placeholder="Write something thoughtful, useful, or both."
                  className="min-h-[200px] resize-y bg-white"
                />
                {errors.content ? <p className="mt-2 text-sm text-red-600">{errors.content}</p> : null}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs leading-6 text-slate-500">
                  Comments are tied to your signed-in Laravel account. Keep it respectful and on topic.
                </p>

                <Button type="submit" disabled={processing || data.content.trim().length === 0} className="gap-2 rounded-full px-5">
                  <Send className="h-4 w-4" />
                  Post comment
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Sign in to comment</p>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  Discussion works best with a real identity. Sign in to reply, join threads, and keep your comments attached to your profile.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href={route('login')}
                  className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-700"
                >
                  <LogIn className="h-4 w-4" />
                  Sign in
                </Link>
                <Link
                  href={route('register')}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-violet-300 hover:text-violet-700"
                >
                  Create account
                </Link>
              </div>

              <SocialLoginButtons redirectTo={`/blog/${slug}#discussion`} compact />

              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs leading-6 text-slate-500">
                Sign in with the provider you prefer, then come back to this thread to post your comment.
              </div>
            </div>
          )}
        </aside>
      </div>
    </section>
  )
}
