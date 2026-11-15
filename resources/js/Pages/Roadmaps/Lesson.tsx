import { Link, router } from '@inertiajs/react'
import { ArrowLeft, ArrowRight, Check, ChevronRight } from 'lucide-react'
import { Comments, type RoadmapComment } from '@/Components/Roadmap/Comments'
import { type Lesson, LessonDetail, OptionalTag, UnlockCard, levelLabel } from '@/Components/Roadmap/shared'
import { cn } from '@/lib/utils'

type Neighbour = { id: string; title: string; topicId: string } | null

type Props = {
  roadmap: { slug: string; title: string }
  topic: { id: string; title: string; level: string }
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
          <Link href={`${base}/${topic.id}`} className="hover:text-slate-800 dark:hover:text-slate-200">{topic.title}</Link>
        </nav>

        <p className="mt-6 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          {levelLabel[topic.level]} · Lesson {position} of {lessonCount} {lesson.optional && <OptionalTag />}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">{lesson.title}</h1>

        {locked ? (
          <UnlockCard className="mt-8" />
        ) : (
          <>
            <button
              onClick={toggle}
              className={cn('mt-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold', lesson.done ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-emerald-600 text-white hover:bg-emerald-500')}
            >
              <Check className="h-4 w-4" /> {lesson.done ? 'Done (click to undo)' : hasAccount ? 'Mark as done' : 'Sign in to track progress'}
            </button>
            <LessonDetail lesson={lesson} loginHref={loginHref} />
          </>
        )}

        <nav className="mt-10 grid gap-3 sm:grid-cols-2" aria-label="Lessons">
          {prev ? (
            <Link href={link(prev)} className="rounded-xl border border-slate-200 p-4 hover:border-emerald-400 dark:border-slate-800">
              <span className="inline-flex items-center gap-1 text-xs text-slate-500"><ArrowLeft className="h-3.5 w-3.5" /> Previous</span>
              <span className="mt-1 block font-semibold text-slate-900 dark:text-white">{prev.title}</span>
            </Link>
          ) : <span />}
          {next && (
            <Link href={link(next)} className="rounded-xl border border-slate-200 p-4 text-right hover:border-emerald-400 dark:border-slate-800">
              <span className="inline-flex items-center gap-1 text-xs text-slate-500">Next <ArrowRight className="h-3.5 w-3.5" /></span>
              <span className="mt-1 block font-semibold text-slate-900 dark:text-white">{next.title}</span>
            </Link>
          )}
        </nav>

        <Comments comments={comments} count={commentCount} postUrl={`${here}/comments`} loginHref={loginHref} />
      </section>
    </div>
  )
}
