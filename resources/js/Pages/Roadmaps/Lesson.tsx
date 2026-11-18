import { useEffect } from 'react'
import { Link, router } from '@inertiajs/react'
import { showToast } from '@/Components/ToastHost'
import { ArrowLeft, ArrowRight, Check, ChevronRight } from 'lucide-react'
import { Comments, type RoadmapComment } from '@/Components/Roadmap/Comments'
import { type Lesson, LessonDetail, OptionalTag, UnlockCard, lessonLetter, levelLabel } from '@/Components/Roadmap/shared'
import { cn } from '@/lib/utils'

type Neighbour = { id: string; title: string; topicId: string; topicTitle: string; topicNumber: number } | null
type Sibling = { id: string; title: string; optional: boolean; done: boolean }

type Props = {
  roadmap: { slug: string; title: string }
  topic: { id: string; number: number; title: string; level: string }
  lesson: Lesson
  position: number
  lessonCount: number
  siblings: Sibling[]
  locked: boolean
  hasAccount: boolean
  prev: Neighbour
  next: Neighbour
  comments: RoadmapComment[]
  commentCount: number
}

export default function RoadmapLesson({ roadmap, topic, lesson, position, lessonCount, siblings, locked, hasAccount, prev, next, comments, commentCount }: Props) {
  useEffect(() => {
    fetch(`/roadmaps/${roadmap.slug}/view`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' }, body: JSON.stringify({ topic: topic.id, lesson: lesson.id }) }).catch(() => {})
  }, [roadmap.slug, topic.id, lesson.id])
  const base = `/roadmaps/${roadmap.slug}`
  const here = `${base}/${topic.id}/${lesson.id}`
  const loginHref = `/login?redirect=${encodeURIComponent(here)}`
  const lessonUrl = `${base}/lessons/${lesson.id}`
  const link = (n: NonNullable<Neighbour>) => `${base}/${n.topicId}/${n.id}`
  // After marking done: the next lesson in this topic, or the next topic's page when this was the last lesson.
  const continueUrl = next ? (next.topicId === topic.id ? link(next) : `${base}/${next.topicId}`) : null
  const setDone = (done: boolean) =>
    router[done ? 'post' : 'delete'](lessonUrl, {}, {
      preserveScroll: true,
      preserveState: true, // keep a half-typed comment
      onSuccess: () => {
        if (!done) return showToast('success', 'Lesson marked as not done')
        showToast('success', 'Lesson marked as done', { action: { label: 'Undo', onClick: () => router.delete(lessonUrl, { preserveScroll: true, preserveState: true }) } })
        if (continueUrl) router.visit(continueUrl)
      },
    })
  const toggle = () => {
    if (!hasAccount) {
      router.visit(loginHref)
      return
    }
    setDone(!lesson.done)
  }

  return (
    <div className="pt-24">
      <section className="mx-auto max-w-3xl px-4 pb-24 pt-8 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-sm text-slate-500">
          <Link href="/roadmaps" className="hover:text-slate-800 dark:hover:text-slate-200">Roadmaps</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href={base} className="hover:text-slate-800 dark:hover:text-slate-200">{roadmap.title}</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href={`${base}/${topic.id}`} className="hover:text-slate-800 dark:hover:text-slate-200">{topic.number}. {topic.title}</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span aria-current="page" className="font-medium text-slate-800 dark:text-slate-200">{lessonLetter(position - 1)}. {lesson.title}</span>
        </nav>

        <p className="mt-6 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          {levelLabel[topic.level]} · Topic {topic.number} · Lesson {lessonLetter(position - 1)} of {lessonLetter(lessonCount - 1)} {lesson.optional && <OptionalTag />}
        </p>
        <h1 className="mt-2 flex items-center gap-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
          <span className="inline-flex h-10 min-w-10 items-center justify-center rounded-xl bg-amber-500 px-2 text-lg font-bold text-amber-950">{topic.number}{lessonLetter(position - 1)}</span>
          {lesson.title}
        </h1>

        {/* Where this lesson sits in its topic: one step per lesson, current highlighted, done ticked. */}
        <ol aria-label={`Lessons in ${topic.title}`} className="mt-5 flex flex-wrap gap-1.5">
          {siblings.map((s, i) => {
            const current = s.id === lesson.id
            return (
              <li key={s.id}>
                <Link
                  href={`${base}/${topic.id}/${s.id}`}
                  title={`${lessonLetter(i)}. ${s.title}${s.optional ? ' (optional)' : ''}`}
                  aria-current={current ? 'step' : undefined}
                  className={cn(
                    'inline-flex h-8 min-w-8 items-center justify-center gap-1 rounded-full border px-2.5 text-xs font-semibold transition',
                    current ? 'border-amber-500 bg-amber-500 text-amber-950' : s.done ? 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300' : 'border-slate-200 text-slate-600 hover:border-amber-400 dark:border-slate-700 dark:text-slate-300',
                    s.optional && !current && 'border-dashed',
                  )}
                >
                  {s.done && !current ? <Check className="h-3 w-3" aria-hidden /> : null}
                  {lessonLetter(i)}
                  <span className="sr-only">. {s.title}{s.done ? ', done' : ''}</span>
                </Link>
              </li>
            )
          })}
        </ol>

        {locked ? (
          <UnlockCard className="mt-8" />
        ) : (
          <>
            <button
              onClick={toggle}
              className={cn('mt-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold', lesson.done ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-950 dark:text-amber-300' : 'bg-amber-500 text-amber-950 hover:bg-amber-400')}
            >
              <Check className="h-4 w-4" /> {lesson.done ? 'Done (click to undo)' : hasAccount ? (continueUrl ? 'Mark as done and continue' : 'Mark as done') : 'Sign in to track progress'}
            </button>
            <LessonDetail lesson={lesson} loginHref={loginHref} />
          </>
        )}

        <nav className="mt-10 grid gap-3 sm:grid-cols-2" aria-label="Lessons">
          {prev ? (
            <Link href={link(prev)} className="rounded-xl border border-slate-200 p-4 hover:border-amber-400 dark:border-slate-800">
              <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                <ArrowLeft className="h-3.5 w-3.5" /> {prev.topicId === topic.id ? 'Previous lesson' : `Previous topic · ${prev.topicNumber}. ${prev.topicTitle}`}
              </span>
              <span className="mt-1 block font-semibold text-slate-900 dark:text-white">{prev.title}</span>
            </Link>
          ) : <span />}
          {/* Crossing into a new topic opens that topic's page, the same place "Mark as done and continue" goes. */}
          {next && (next.topicId === topic.id ? (
            <Link href={link(next)} className="rounded-xl border border-slate-200 p-4 text-right hover:border-amber-400 dark:border-slate-800">
              <span className="inline-flex items-center gap-1 text-xs text-slate-500">Next lesson <ArrowRight className="h-3.5 w-3.5" /></span>
              <span className="mt-1 block font-semibold text-slate-900 dark:text-white">{next.title}</span>
            </Link>
          ) : (
            <Link href={`${base}/${next.topicId}`} className="rounded-xl border border-amber-300 bg-amber-50/50 p-4 text-right hover:border-amber-400 dark:border-amber-900 dark:bg-amber-950/20">
              <span className="inline-flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400">End of this topic · Next topic <ArrowRight className="h-3.5 w-3.5" /></span>
              <span className="mt-1 block font-semibold text-slate-900 dark:text-white">{next.topicNumber}. {next.topicTitle}</span>
            </Link>
          ))}
        </nav>

        {!locked && <Comments comments={comments} count={commentCount} postUrl={`${here}/comments`} loginHref={loginHref} />}
      </section>
    </div>
  )
}
