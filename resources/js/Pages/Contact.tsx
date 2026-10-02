import {useState, useEffect, FormEvent, ChangeEvent} from "react"
import {motion} from "framer-motion"
import {Button} from "@/Components/ui/button"
import {Input} from "@/Components/ui/input"
import {Textarea} from "@/Components/ui/textarea"
import {Label} from "@/Components/ui/label"
import {Send} from "lucide-react"
import {cn} from "@/lib/utils"
import type React from "react"
import {Link, router} from '@inertiajs/react'
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
            referrer
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
            onFinish: () => setIsSubmitting(false),
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

    return (
        <>
            {/* Hero Section */}
                    <section className="bg-slate-950">
                        <div className="container mx-auto px-4 pb-8 pt-28 sm:pb-10 sm:pt-32">
                            <motion.div
                                initial={{opacity: 0, y: 20}}
                                animate={{opacity: 1, y: 0}}
                                transition={{duration: 0.8}}
                                className="text-center max-w-3xl mx-auto"
                            >
                                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Send a note</h1>
                                <p className="text-xl text-white/80">
                                    I read these and reply myself. If you want a time on the calendar,{' '}
                                    <Link href="/consultation" className="underline underline-offset-4 hover:text-white">book a consult</Link>.
                                </p>
                            </motion.div>
                        </div>
                    </section>

                    {/* Contact Form Section */}
                    <section className="bg-gray-50 py-8 sm:py-12">
                        <div className="container mx-auto px-4">
                            <motion.div
                                initial={{opacity: 0, y: 20}}
                                animate={{opacity: 1, y: 0}}
                                transition={{duration: 0.6}}
                                className="max-w-3xl mx-auto"
                            >
                                <AnimatePresence mode="wait">
                                    {showForm && (
                                        <motion.div
                                            key="form"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <form onSubmit={handleSubmit}
                                                  className="space-y-8 bg-white p-6 sm:p-10 lg:p-12 rounded-xl shadow-lg border border-gray-100">
                                                <input type="hidden" name="referrer" value={referrer} />
                                                <div className="space-y-3">
                                                    <Label htmlFor="name" className="text-lg font-medium">Name <span className="text-red-500">*</span></Label>
                                                    <Input 
                                                        id="name" 
                                                        value={name} 
                                                        onChange={handleInputChange}
                                                        className={cn(
                                                            "bg-gray-50/50 border-gray-200 focus:bg-white transition-colors text-lg h-14 px-4",
                                                            errors.name && "border-red-500 focus:border-red-500"
                                                        )}
                                                        required
                                                    />
                                                    {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                                                </div>
                                                <div className="space-y-3">
                                                    <Label htmlFor="email" className="text-lg font-medium">Email <span className="text-red-500">*</span></Label>
                                                    <Input 
                                                        id="email" 
                                                        type="email" 
                                                        value={email} 
                                                        onChange={handleInputChange}
                                                        className={cn(
                                                            "bg-gray-50/50 border-gray-200 focus:bg-white transition-colors text-lg h-14 px-4",
                                                            errors.email && "border-red-500 focus:border-red-500"
                                                        )}
                                                        required
                                                    />
                                                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                                                </div>
                                                <div className="space-y-3">
                                                    <Label htmlFor="subject" className="text-lg font-medium">Subject <span className="text-red-500">*</span></Label>
                                                    <Input 
                                                        id="subject" 
                                                        value={subject} 
                                                        onChange={handleInputChange}
                                                        placeholder="What is your message about?"
                                                        className={cn(
                                                            "bg-gray-50/50 border-gray-200 focus:bg-white transition-colors text-lg h-14 px-4",
                                                            errors.subject && "border-red-500 focus:border-red-500"
                                                        )}
                                                        required
                                                    />
                                                    {errors.subject && <p className="text-red-500 text-sm mt-1">{errors.subject}</p>}
                                                </div>
                                                <div className="space-y-3">
                                                    <Label htmlFor="message" className="text-lg font-medium">Message <span className="text-red-500">*</span></Label>
                                                    <Textarea
                                                        id="message"
                                                        value={message}
                                                        onChange={handleInputChange}
                                                        className={cn(
                                                            "min-h-[150px] resize-none overflow-hidden bg-gray-50/50 border-gray-200 focus:bg-white transition-colors text-lg p-4",
                                                            errors.message && "border-red-500 focus:border-red-500"
                                                        )}
                                                        required
                                                    />
                                                    {errors.message && <p className="text-red-500 text-sm mt-1">{errors.message}</p>}
                                                </div>
                                                {submissionError && (
                                                    <p role="alert" className="text-red-500 text-sm">{submissionError}</p>
                                                )}
                                                <Button
                                                    type="submit"
                                                    disabled={isSubmitting}
                                                    className="h-12 bg-slate-900 hover:bg-slate-800 text-white text-base font-semibold px-6 rounded-md transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-amber-400 focus:ring-opacity-75 focus:bg-slate-800 flex items-center gap-2 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {isSubmitting ? (
                                                        <>
                                                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                            </svg>
                                                            <span className="ml-2">Sending...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Send className="w-5 h-5" />
                                                            Send Message
                                                        </>
                                                    )}
                                                </Button>
                                            </form>
                                        </motion.div>
                                    )}

                                    {showEnvelope && (
                                        <motion.div
                                            key="confirmation"
                                            className="bg-white p-6 sm:p-10 lg:p-12 rounded-xl shadow-lg border border-gray-100"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                        >
                                            <Envelope onComplete={handleNewRequest} />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        </div>
                    </section>
        </>
    )
}
