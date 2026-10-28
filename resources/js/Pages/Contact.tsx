import {useState, useEffect, FormEvent, ChangeEvent} from "react"
import {motion} from "framer-motion"
import {Button} from "@/Components/ui/button"
import {Input} from "@/Components/ui/input"
import {Textarea} from "@/Components/ui/textarea"
import {Label} from "@/Components/ui/label"
import {Send} from "lucide-react"
import {cn} from "@/lib/utils"
import type React from "react"
import {Link, router, usePage} from '@inertiajs/react'
import Turnstile from "@/Components/Turnstile"
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
        "h-12 bg-white border-slate-200 text-base px-4 focus-visible:ring-amber-400",
        errors[field] && "border-red-500 focus-visible:ring-red-400"
    )

    return (
        <>
            <section className="bg-slate-950">
                <div className="container mx-auto px-4 pb-12 pt-28 sm:pb-16 sm:pt-32">
                    <motion.div
                        initial={{opacity: 0, y: 20}}
                        animate={{opacity: 1, y: 0}}
                        transition={{duration: 0.6}}
                        className="max-w-2xl"
                    >
                        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-amber-400">Contact</p>
                        <h1 className="mb-4 text-4xl font-bold text-white md:text-5xl">Send a note</h1>
                        <p className="text-lg text-white/75">
                            I read these and reply myself. If you want a time on the calendar,{' '}
                            <Link href="/consultation" className="text-white underline underline-offset-4 hover:text-amber-300">book a consult</Link>.
                        </p>
                    </motion.div>
                </div>
            </section>

            <section className="bg-slate-50 py-10 sm:py-14">
                <div className="container mx-auto px-4">
                    <div className="mx-auto max-w-3xl">
                        <AnimatePresence mode="wait">
                            {showForm && (
                                <motion.form
                                    key="form"
                                    onSubmit={handleSubmit}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10"
                                >
                                    <input type="hidden" name="referrer" value={referrer} />
                                    <div className="grid gap-6 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="name" className="text-sm font-medium text-slate-700">Name <span className="text-red-500">*</span></Label>
                                            <Input id="name" value={name} onChange={handleInputChange} autoComplete="name" className={fieldClass('name')} required />
                                            {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email <span className="text-red-500">*</span></Label>
                                            <Input id="email" type="email" value={email} onChange={handleInputChange} autoComplete="email" className={fieldClass('email')} required />
                                            {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="subject" className="text-sm font-medium text-slate-700">Subject <span className="text-red-500">*</span></Label>
                                        <Input id="subject" value={subject} onChange={handleInputChange} placeholder="What is it about?" className={fieldClass('subject')} required />
                                        {errors.subject && <p className="text-sm text-red-600">{errors.subject}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="message" className="text-sm font-medium text-slate-700">Message <span className="text-red-500">*</span></Label>
                                        <Textarea
                                            id="message"
                                            value={message}
                                            onChange={handleInputChange}
                                            placeholder="A few lines on what you need, your stack, and any deadline."
                                            className={cn(
                                                "min-h-[180px] resize-none overflow-hidden bg-white border-slate-200 text-base p-4 focus-visible:ring-amber-400",
                                                errors.message && "border-red-500 focus-visible:ring-red-400"
                                            )}
                                            required
                                        />
                                        {errors.message && <p className="text-sm text-red-600">{errors.message}</p>}
                                    </div>

                                    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                                        <input
                                            type="checkbox"
                                            checked={subscribe}
                                            onChange={(e) => setSubscribe(e.target.checked)}
                                            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-amber-400"
                                        />
                                        <span>
                                            <span className="font-medium text-slate-900">Subscribe to the newsletter.</span>{' '}
                                            New posts and tools, about once a week. Unsubscribe any time.
                                        </span>
                                    </label>

                                    {siteKey && (
                                        <div>
                                            <Turnstile key={widgetKey} siteKey={siteKey} onToken={setTurnstileToken} />
                                            {errors['cf-turnstile-response'] && <p className="mt-2 text-sm text-red-600">{errors['cf-turnstile-response']}</p>}
                                        </div>
                                    )}

                                    {submissionError && (
                                        <p role="alert" className="text-sm text-red-600">{submissionError}</p>
                                    )}

                                    <div className="flex flex-col-reverse gap-4 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
                                        <p className="text-sm text-slate-500">
                                            Rather email? <a href="mailto:me@harun.dev" className="font-medium text-slate-700 underline underline-offset-4">me@harun.dev</a>
                                        </p>
                                        <Button
                                            type="submit"
                                            disabled={isSubmitting || (!!siteKey && !turnstileToken)}
                                            className="h-12 gap-2 rounded-lg bg-slate-900 px-6 text-base font-semibold text-white hover:bg-slate-800 focus-visible:ring-4 focus-visible:ring-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
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
                                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10"
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
