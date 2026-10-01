import {useState, useEffect, useRef, FormEvent, ChangeEvent} from "react"
import {motion} from "framer-motion"
import {Button} from "@/Components/ui/button"
import {Input} from "@/Components/ui/input"
import {Textarea} from "@/Components/ui/textarea"
import {Label} from "@/Components/ui/label"
import {ChevronsUpDown, Plus, Send} from "lucide-react"
import {cn} from "@/lib/utils"
import {Popover, PopoverContent, PopoverTrigger} from "@/Components/ui/popover"
import type React from "react"
import {Link, router} from '@inertiajs/react'
import {toast} from "@/lib/toast"
import { PageProps as InertiaPageProps } from '@inertiajs/core'
import confetti from 'canvas-confetti';
import { Envelope } from "@/Components/ui/envelope"
import { AnimatePresence } from "framer-motion"
import { getImageUrl } from "@/lib/imageUtils"
import { trackLeadConversion } from "@/lib/analytics"

const predefinedServices = [
    "Cloud Architecture & Migration",
    "DevOps Implementation",
    "Infrastructure as Code (IaC)",
    "Containerization & Orchestration",
    "CI/CD Pipeline Optimization",
    "Serverless Architecture",
    "Microservices Design",
    "Performance Optimization",
    "Security & Compliance",
    "Monitoring & Logging",
    "Database Management",
    "Scalability Solutions",
]

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
    const [selectedServices, setSelectedServices] = useState<string[]>([])
    const [open, setOpen] = useState(false)
    const [searchValue, setSearchValue] = useState("")
    const serviceSearchRef = useRef<HTMLInputElement>(null)
    const [services, setServices] = useState<string[]>(predefinedServices)
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
            services: selectedServices,
            referrer
        }, {
            preserveScroll: true,
            onSuccess: (page) => {
                const submissionFlash = (page.props as PageProps).flash
                if (submissionFlash?.type !== 'success') {
                    setSubmissionError(submissionFlash?.message || "We couldn't confirm your message was sent. Please try again.")
                    return
                }

                trackLeadConversion('contact_form')
                setShowEnvelope(true)
                setShowForm(false)
                triggerConfetti()
                window.scrollTo({ top: 0, behavior: 'smooth' })
                toast.success("Thank you for your message! We will get back to you soon.", {
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
        setSelectedServices([])
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

    const toggleService = (service: string) => {
        setSelectedServices((current) =>
            current.includes(service) ? current.filter((s) => s !== service) : [...current, service],
        )
    }

    const addCustomService = (value: string) => {
        const newService = value.trim()
        if (newService && !services.includes(newService)) {
            setServices((prev) => [...prev, newService])
            setSelectedServices((prev) => [...prev, newService])
            setSearchValue("")
        }
    }

    return (
        <>
            {/* Hero Section */}
                    <section
                        className="min-h-[400px] bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 flex items-center">
                        <div className="container mx-auto py-20">
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
                    <section className="py-20 sm:py-28 lg:py-32 bg-gray-50">
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
                                                        placeholder="Enter your name"
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
                                                        placeholder="Enter your email address"
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
                                                        placeholder="Write your message here..."
                                                        className={cn(
                                                            "min-h-[150px] resize-none overflow-hidden bg-gray-50/50 border-gray-200 focus:bg-white transition-colors text-lg p-4",
                                                            errors.message && "border-red-500 focus:border-red-500"
                                                        )}
                                                        required
                                                    />
                                                    {errors.message && <p className="text-red-500 text-sm mt-1">{errors.message}</p>}
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="services" className="text-lg font-medium">Services</Label>
                                                    <Popover open={open} onOpenChange={setOpen}>
                                                        <PopoverTrigger asChild>
                                                            <Button
                                                                id="services"
                                                                type="button"
                                                                variant="outline"
                                                                aria-expanded={open}
                                                                className="w-full justify-between bg-gray-50/50 border-gray-200 hover:bg-gray-50/80 text-lg h-14 px-4 focus:ring-2 focus:ring-amber-500 focus:ring-opacity-50 focus:border-amber-500"
                                                            >
                                                                {selectedServices.length > 0 ? `${selectedServices.length} selected` : "Select services"}
                                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" aria-hidden="true"/>
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent
                                                            aria-label="Choose services"
                                                            className="w-[--radix-popover-trigger-width] p-0 bg-white"
                                                            onOpenAutoFocus={(event) => {
                                                                event.preventDefault()
                                                                serviceSearchRef.current?.focus()
                                                            }}
                                                        >
                                                            <div className="border-b p-3">
                                                                <Label htmlFor="service-search" className="sr-only">Search services</Label>
                                                                <Input
                                                                    ref={serviceSearchRef}
                                                                    id="service-search"
                                                                    type="search"
                                                                    placeholder="Search or add services..."
                                                                    value={searchValue}
                                                                    onChange={(event) => setSearchValue(event.target.value)}
                                                                />
                                                            </div>
                                                            <fieldset className="max-h-[300px] overflow-y-auto p-3">
                                                                <legend className="sr-only">Available services</legend>
                                                                {services
                                                                    .filter((service) => service.toLowerCase().includes(searchValue.toLowerCase()))
                                                                    .map((service) => (
                                                                        <label key={service} className="flex cursor-pointer items-center gap-3 rounded-sm px-2 py-2 text-sm hover:bg-slate-100 focus-within:bg-slate-100">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={selectedServices.includes(service)}
                                                                                onChange={() => toggleService(service)}
                                                                                className="h-4 w-4 rounded border-slate-400 text-amber-700 focus:ring-amber-700"
                                                                            />
                                                                            {service}
                                                                        </label>
                                                                    ))}
                                                                {!services.some((service) => service.toLowerCase().includes(searchValue.toLowerCase())) && (
                                                                    <p className="px-2 py-2 text-sm text-slate-600">No matching services.</p>
                                                                )}
                                                                {searchValue.trim() && !services.some((service) => service.toLowerCase() === searchValue.trim().toLowerCase()) && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            addCustomService(searchValue)
                                                                            serviceSearchRef.current?.focus()
                                                                        }}
                                                                        className="flex w-full items-center gap-2 rounded-sm p-2 text-sm hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-700"
                                                                    >
                                                                        <Plus className="h-4 w-4" aria-hidden="true"/>
                                                                        Add &quot;{searchValue.trim()}&quot;
                                                                    </button>
                                                                )}
                                                            </fieldset>
                                                        </PopoverContent>
                                                    </Popover>
                                                    <div className="mt-2 flex flex-wrap gap-2">
                                                        {selectedServices.map((service) => (
                                                            <span key={service}
                                                                  className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-sm">
                            {service}
                                                            <button type="button" onClick={() => toggleService(service)}
                                                                    aria-label={`Remove ${service}`}
                                                                    className="ml-2 rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-700">
                                                              &times;
                                                            </button>
                                                          </span>
                                                        ))}
                                                    </div>
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
