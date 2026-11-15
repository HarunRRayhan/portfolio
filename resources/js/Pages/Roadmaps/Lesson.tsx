import { Link, router } from '@inertiajs/react'
import { ArrowLeft, ArrowRight, Check, ChevronRight } from 'lucide-react'
import { Comments, type RoadmapComment } from '@/Components/Roadmap/Comments'
import { type Lesson, LessonDetail, OptionalTag, UnlockCard, lessonLetter, levelLabel } from '@/Components/Roadmap/shared'
import { cn } from '@/lib/utils'

type Neighbour = { id: string; title: string; topicId: string } | null

type Props = {
  roadmap: { slug: string; title: string }
  topic: { id: string; number: number; title: string; level: string }
  lesson: Lesson
  position: number
  lessonCount: number
  locked: boolean
  hasAccount: boolean
  prev: Neighbour
  next: Neighbour
  comments: RoadmapComment[]
  commentCount: number
}

export default function RoadmapLesson({ roadmap, topic, lesson, position, lessonCount, locked, hasAccount, prev, next, comments, commentCount }: Props) {
  const base = `/roadmaps/${roadmap.slug}`
  const here = `${base}/${topic.id}/${lesson.id}`
  const loginHref = `/login?redirect=${encodeURIComponent(here)}`
  const toggle = () => {
    if (!hasAccount) {
      router.visit(loginHref)
      return
    }
    router[lesson.done ? 'delete' : 'post'](`${base}/lessons/${lesson.id}`, {}, { preserveScroll: true })
  }
  const link = (n: NonNullable<Neighbour>) => `${base}/${n.topicId}/${n.id}`

  return (
    <div className="pt-24">
      <section className="mx-auto max-w-3xl px-4 pb-24 pt-8 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-sm text-slate-500">
          <Link href={base} className="hover:text-slate-800 dark:hover:text-slate-200">{roadmap.title}</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href={`${base}/${topic.id}`} className="hover:text-slate-800 dark:hover:text-slate-200">{topic.number}. {topic.title}</Link>
        </nav>

        <p className="mt-6 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          {levelLabel[topic.level]} · Topic {topic.number} · Lesson {lessonLetter(position - 1)} of {lessonLetter(lessonCount - 1)} {lesson.optional && <OptionalTag />}
        </p>
        <h1 className="mt-2 flex items-center gap-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
          <span className="inline-flex h-10 min-w-10 items-center justify-center rounded-xl bg-amber-500 px-2 text-lg font-bold text-amber-950">{topic.number}{lessonLetter(position - 1)}</span>
          {lesson.title}
        </h1>

        {locked ? (
          <UnlockCard className="mt-8" />
        ) : (
          <>
            <button
              onClick={toggle}
              className={cn('mt-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold', lesson.done ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-950 dark:text-amber-300' : 'bg-amber-500 text-amber-950 hover:bg-amber-400')}
            >
              <Check className="h-4 w-4" /> {lesson.done ? 'Done (click to undo)' : hasAccount ? 'Mark as done' : 'Sign in to track progress'}
            </button>
            <LessonDetail lesson={lesson} loginHref={loginHref} />
          </>
        )}

        <nav className="mt-10 grid gap-3 sm:grid-cols-2" aria-label="Lessons">
          {prev ? (
            <Link href={link(prev)} className="rounded-xl border border-slate-200 p-4 hover:border-amber-400 dark:border-slate-800">
              <span className="inline-flex items-center gap-1 text-xs text-slate-500"><ArrowLeft className="h-3.5 w-3.5" /> Previous</span>
              <span className="mt-1 block font-semibold text-slate-900 dark:text-white">{prev.title}</span>
            </Link>
          ) : <span />}
          {next && (
            <Link href={link(next)} className="rounded-xl border border-slate-200 p-4 text-right hover:border-amber-400 dark:border-slate-800">
              <span className="inline-flex items-center gap-1 text-xs text-slate-500">Next <ArrowRight className="h-3.5 w-3.5" /></span>
              <span className="mt-1 block font-semibold text-slate-900 dark:text-white">{next.title}</span>
            </Link>
          )}
        </nav>

        {!locked && <Comments comments={comments} count={commentCount} postUrl={`${here}/comments`} loginHref={loginHref} />}
      </section>
    </div>
  )
}
