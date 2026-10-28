import {useState, useEffect, FormEvent, ChangeEvent} from "react"
import {motion} from "framer-motion"
import {Button} from "@/Components/ui/button"
import {Input} from "@/Components/ui/input"
import {Textarea} from "@/Components/ui/textarea"
import {Label} from "@/Components/ui/label"
import {ArrowRight, Lock, Send} from "lucide-react"
import {cn} from "@/lib/utils"
import type React from "react"
import {Link, router, usePage} from '@inertiajs/react'
import Turnstile from "@/Components/Turnstile"
import { useIsDark } from "@/lib/theme"
import {toast} from "@/lib/toast"
import { PageProps as InertiaPageProps } from '@inertiajs/core'
import confetti from 'canvas-confetti';
import { Envelope } from "@/Components/ui/envelope"
import { AnimatePresence } from "framer-motion"
import { trackLeadConversion } from "@/lib/analytics"

interface PageProps extends InertiaPageProps {
    flash?: {
        type?: 'success' | 'error';
        message?: string;
    };
}

export default function Contact({ canonicalUrl }: { canonicalUrl?: string }) {
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [subject, setSubject] = useState("")
    const [message, setMessage] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [referrer, setReferrer] = useState("")
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [submissionError, setSubmissionError] = useState<string | null>(null)
    const [showEnvelope, setShowEnvelope] = useState(false)
    const [showForm, setShowForm] = useState(true)
    const [subscribe, setSubscribe] = useState(true)
    const [turnstileToken, setTurnstileToken] = useState("")
    // Turnstile tokens are single-use: remount the widget after every submit for a fresh one.
    const [widgetKey, setWidgetKey] = useState(0)
    const dark = useIsDark()
    const siteKey = (usePage().props as { turnstileSiteKey?: string | null }).turnstileSiteKey

    useEffect(() => {
        setReferrer(document.referrer || 'direct')

        const textarea = document.getElementById("message") as HTMLTextAreaElement
        if (textarea) {
            textarea.style.height = "auto"
            textarea.style.height = `${textarea.scrollHeight}px`
        }
    }, [message])

    const triggerConfetti = () => {
        confetti({
            particleCount: 150,
            spread: 100,
            origin: { y: 0.6 },
            colors: ['#D97706', '#F59E0B', '#FCD34D'],
            angle: 90,
            startVelocity: 30,
            gravity: 0.5,
            ticks: 200
        });
    }

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)
        setErrors({})
        setSubmissionError(null)

        router.post('/contact', {
            name,
            email,
            subject,
            message,
            services: [],
            referrer,
            subscribe,
            'cf-turnstile-response': turnstileToken,
        }, {
            preserveScroll: true,
            onSuccess: (page) => {
                const submissionFlash = (page.props as PageProps).flash
                if (submissionFlash?.type !== 'success') {
                    setSubmissionError(submissionFlash?.message || "I couldn't confirm your message was sent. Please try again.")
                    return
                }

                trackLeadConversion('contact_form')
                setShowEnvelope(true)
                setShowForm(false)
                triggerConfetti()
                window.scrollTo({ top: 0, behavior: 'smooth' })
                toast.success("Thanks. I read these and reply myself.", {
                    duration: 5000,
                    position: 'top-right'
                })
            },
            onError: (errors: any) => {
                setErrors(errors)
                toast.error("Please check the form for errors.", {
                    duration: 5000,
                    position: 'top-right'
                })
            },
            onFinish: () => {
                setIsSubmitting(false)
                setTurnstileToken("")
                setWidgetKey((k) => k + 1)
            },
        })
    }

    const handleNewRequest = () => {
        resetForm()
        setShowEnvelope(false)
        setShowForm(true)
    }

    const resetForm = () => {
        setName("")
        setEmail("")
        setSubject("")
        setMessage("")
        setShowForm(true)
    }

    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const {id, value} = e.target
        switch (id) {
            case "name":
                setName(value)
                break
            case "email":
                setEmail(value)
                break
            case "subject":
                setSubject(value)
                break
            case "message":
                setMessage(value)
                if (e.target instanceof HTMLTextAreaElement) {
                    e.target.style.height = "auto"
                    e.target.style.height = `${e.target.scrollHeight}px`
                }
                break
        }
    }

    const fieldClass = (field: string) => cn(
        "h-12 bg-white border-slate-200 text-base px-4 focus-visible:ring-amber-400 dark:bg-slate-950 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500",
        errors[field] && "border-red-500 focus-visible:ring-red-400"
    )

    return (
        <>
            <section className="relative overflow-hidden bg-slate-950 pb-16 pt-28 sm:pt-32 lg:pb-24">
                <div aria-hidden className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />
                <div className="container relative mx-auto grid gap-12 px-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
                    <motion.div
                        initial={{opacity: 0, y: 20}}
                        animate={{opacity: 1, y: 0}}
                        transition={{duration: 0.6}}
                        className="lg:pt-6"
                    >
                        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-amber-400">Contact</p>
                        <h1 className="mb-5 text-4xl font-bold tracking-tight text-white md:text-5xl">Send a note</h1>
                        <p className="text-lg leading-relaxed text-slate-300">
                            I read every message and reply myself. Tell me what you are building and where it hurts.
                        </p>

                        <ol className="mt-10 space-y-6">
                            {[
                                ['Write it out', 'A few lines on the problem, your stack, and any deadline.'],
                                ['I reply by email', 'From me, not a sales team. Hit reply to keep the thread going.'],
                                ['We pick a next step', 'A quick answer, a pointer, or a call if it needs one.'],
                            ].map(([title, body], i) => (
                                <li key={title} className="flex gap-4">
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-amber-400/40 text-sm font-semibold text-amber-300">{i + 1}</span>
                                    <div>
                                        <p className="font-semibold text-white">{title}</p>
                                        <p className="text-sm text-slate-400">{body}</p>
                                    </div>
                                </li>
                            ))}
                        </ol>

                        <div className="mt-10 rounded-xl border border-slate-800 bg-slate-900/60 p-5">
                            <p className="font-semibold text-white">Want a time on the calendar?</p>
                            <p className="mt-1 text-sm text-slate-400">Skip the back and forth and pick a slot.</p>
                            <Link href="/consultation" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-amber-300 hover:text-amber-200">
                                Book a consult <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </motion.div>

                    <div>
                        <AnimatePresence mode="wait">
                            {showForm && (
                                <motion.form
                                    key="form"
                                    onSubmit={handleSubmit}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.4, delay: 0.1 }}
                                    className="space-y-6 rounded-2xl bg-white p-6 shadow-2xl shadow-black/30 ring-1 ring-slate-900/5 dark:bg-slate-900 dark:ring-white/10 sm:p-8 lg:p-10"
                                >
                                    <input type="hidden" name="referrer" value={referrer} />
                                    <div className="grid gap-6 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="name" className="text-sm font-medium text-slate-700 dark:text-slate-200">Name <span className="text-red-500">*</span></Label>
                                            <Input id="name" value={name} onChange={handleInputChange} autoComplete="name" className={fieldClass('name')} required />
                                            {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-200">Email <span className="text-red-500">*</span></Label>
                                            <Input id="email" type="email" value={email} onChange={handleInputChange} autoComplete="email" className={fieldClass('email')} required />
                                            {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="subject" className="text-sm font-medium text-slate-700 dark:text-slate-200">Subject <span className="text-red-500">*</span></Label>
                                        <Input id="subject" value={subject} onChange={handleInputChange} placeholder="What is it about?" className={fieldClass('subject')} required />
                                        {errors.subject && <p className="text-sm text-red-600">{errors.subject}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="message" className="text-sm font-medium text-slate-700 dark:text-slate-200">Message <span className="text-red-500">*</span></Label>
                                        <Textarea
                                            id="message"
                                            value={message}
                                            onChange={handleInputChange}
                                            placeholder="A few lines on what you need, your stack, and any deadline."
                                            className={cn(
                                                "min-h-[180px] resize-none overflow-hidden bg-white border-slate-200 text-base p-4 focus-visible:ring-amber-400 dark:bg-slate-950 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500",
                                                errors.message && "border-red-500 focus-visible:ring-red-400"
                                            )}
                                            required
                                        />
                                        {errors.message && <p className="text-sm text-red-600">{errors.message}</p>}
                                    </div>

                                    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300">
                                        <input
                                            type="checkbox"
                                            checked={subscribe}
                                            onChange={(e) => setSubscribe(e.target.checked)}
                                            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-amber-400 dark:border-slate-600 dark:bg-slate-900 dark:text-amber-500"
                                        />
                                        <span>
                                            <span className="font-medium text-slate-900 dark:text-white">Subscribe to the newsletter.</span>{' '}
                                            New posts and tools, about once a week. Unsubscribe any time.
                                        </span>
                                    </label>

                                    {siteKey && (
                                        <div>
                                            <Turnstile key={widgetKey} siteKey={siteKey} onToken={setTurnstileToken} theme={dark ? 'dark' : 'light'} />
                                            {errors['cf-turnstile-response'] && <p className="mt-2 text-sm text-red-600">{errors['cf-turnstile-response']}</p>}
                                        </div>
                                    )}

                                    {submissionError && (
                                        <p role="alert" className="text-sm text-red-600">{submissionError}</p>
                                    )}

                                    <div className="flex flex-col-reverse gap-4 border-t border-slate-100 pt-6 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                                        <p className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                            <Lock className="h-4 w-4 shrink-0" />
                                            <span>Only I see this. <Link href="/privacy" className="underline underline-offset-4 hover:text-slate-700 dark:hover:text-slate-200">Privacy</Link></span>
                                        </p>
                                        <Button
                                            type="submit"
                                            disabled={isSubmitting || (!!siteKey && !turnstileToken)}
                                            className="h-12 gap-2 rounded-lg bg-slate-900 px-6 text-base font-semibold text-white hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 focus-visible:ring-4 focus-visible:ring-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <Send className="h-5 w-5" />
                                            {isSubmitting ? 'Sending...' : 'Send message'}
                                        </Button>
                                    </div>
                                </motion.form>
                            )}

                            {showEnvelope && (
                                <motion.div
                                    key="confirmation"
                                    className="rounded-2xl bg-white p-6 shadow-2xl shadow-black/30 sm:p-10 dark:bg-slate-900"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                >
                                    <Envelope onComplete={handleNewRequest} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </section>
        </>
    )
}
