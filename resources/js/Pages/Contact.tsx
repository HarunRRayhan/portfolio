'use client'

import {useState, useEffect, FormEvent, ChangeEvent} from "react"
import {Menubar} from "@/Components/Menubar"
import {Footer} from "@/Components/Footer"
import {motion} from "framer-motion"
import {Button} from "@/Components/ui/button"
import {Input} from "@/Components/ui/input"
import {Textarea} from "@/Components/ui/textarea"
import {Label} from "@/Components/ui/label"
import {Check, ChevronsUpDown, Plus, Send, X} from "lucide-react"
import {cn} from "@/lib/utils"
import {Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList} from "@/Components/ui/command"
import {Popover, PopoverContent, PopoverTrigger} from "@/Components/ui/popover"
import type React from "react"
import {ErrorBoundary} from "@/Components/ErrorBoundary"
import {Head} from "@inertiajs/react";
import {router} from '@inertiajs/react'
import {toast} from "sonner"
import { Toaster } from "sonner"
import { usePage } from '@inertiajs/react'
import { PageProps as InertiaPageProps } from '@inertiajs/core'
import confetti from 'canvas-confetti';
import { Envelope } from "@/Components/ui/envelope"
import { AnimatePresence } from "framer-motion"

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

export default function Contact() {
    const { flash } = usePage<PageProps>().props
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [subject, setSubject] = useState("")
    const [message, setMessage] = useState("")
    const [selectedServices, setSelectedServices] = useState<string[]>([])
    const [open, setOpen] = useState(false)
    const [searchValue, setSearchValue] = useState("")
    const [services, setServices] = useState<string[]>(predefinedServices)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [referrer, setReferrer] = useState("")
    const [errors, setErrors] = useState<Record<string, string>>({})
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
            colors: ['#7C3AED', '#8B5CF6', '#6D28D9'],
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

        router.post('/contact', {
            name,
            email,
            subject,
            message,
            services: selectedServices,
            referrer
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setIsSubmitting(false)
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
                setIsSubmitting(false)
            }
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
        <ErrorBoundary>
            <Toaster position="top-right" richColors />
            <Head>
                <title>Contact Harun | Cloud & DevOps Consulting Services</title>
                <meta name="description" content="Get in touch for expert cloud computing and DevOps consulting services. Let's discuss your project needs in AWS, infrastructure automation, CI/CD, or any other cloud services." />
                <meta name="keywords" content="contact, cloud consulting, DevOps services, AWS expert, professional services, cloud architecture" />
                
                {/* OpenGraph Tags */}
                <meta property="og:title" content="Contact Harun | Cloud & DevOps Consulting Services" />
                <meta property="og:description" content="Get in touch for expert cloud computing and DevOps consulting services. Let's discuss your project needs in AWS, infrastructure automation, CI/CD, or any other cloud services." />
                <meta property="og:type" content="website" />
                <meta property="og:url" content={window.location.href} />
                
                {/* Twitter Card Tags */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="Contact Harun | Cloud & DevOps Consulting Services" />
                <meta name="twitter:description" content="Get in touch for expert cloud computing and DevOps consulting services. Let's discuss your project needs in AWS, infrastructure automation, CI/CD, or any other cloud services." />
                
                {/* Canonical URL */}
                <link rel="canonical" href={window.location.href} />

                {/* JSON-LD Structured Data */}
                <script type="application/ld+json">
                    {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "ContactPage",
                        "name": "Contact Harun - Cloud & DevOps Consulting",
                        "description": "Get in touch for expert cloud computing and DevOps consulting services.",
                        "mainEntity": {
                            "@type": "Organization",
                            "name": "Harun's Cloud & DevOps Services",
                            "contactPoint": {
                                "@type": "ContactPoint",
                                "contactType": "customer service",
                                "availableLanguage": ["English"],
                                "areaServed": "Worldwide"
                            },
                            "serviceType": predefinedServices
                        }
                    })}
                </script>
            </Head>
            <div className="flex flex-col min-h-screen relative">
                <div className="fixed top-0 left-0 right-0 z-50">
                    <Menubar/>
                </div>
                <main className="flex-1">
                    {/* Hero Section */}
                    <section
                        className="min-h-[400px] bg-gradient-to-br from-[#86D2F1] via-[#7C3AED] to-[#8B5CF6] flex items-center">
                        <div className="container mx-auto px-4 py-20">
                            <motion.div
                                initial={{opacity: 0, y: 20}}
                                animate={{opacity: 1, y: 0}}
                                transition={{duration: 0.8}}
                                className="text-center max-w-3xl mx-auto"
                            >
                                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Get in Touch</h1>
                                <p className="text-xl text-white/80">
                                    Have a project in mind? Let's discuss how we can help you achieve your goals.
                                </p>
                            </motion.div>
                        </div>
                    </section>

                    {/* Contact Form Section */}
                    <section className="py-32 bg-gray-50">
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
                                                  className="space-y-8 bg-white p-12 rounded-xl shadow-lg border border-gray-100">
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
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Tab' && !e.shiftKey) {
                                                                e.preventDefault();
                                                                setOpen(true);
                                                                setTimeout(() => {
                                                                    const searchInput = document.querySelector('[cmdk-input]') as HTMLInputElement;
                                                                    if (searchInput) {
                                                                        searchInput.focus();
                                                                    }
                                                                }, 0);
                                                            }
                                                        }}
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
                                                                variant="outline" 
                                                                role="combobox" 
                                                                aria-expanded={open}
                                                                tabIndex={0}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                                        e.preventDefault();
                                                                        setOpen(true);
                                                                    }
                                                                }}
                                                                className="w-full justify-between bg-gray-50/50 border-gray-200 hover:bg-gray-50/80 text-lg h-14 px-4 focus:ring-2 focus:ring-purple-600 focus:ring-opacity-50 focus:border-purple-600"
                                                            >
                                                                {selectedServices.length > 0 ? `${selectedServices.length} selected` : "Select services"}
                                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50"/>
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent 
                                                            className="w-[--radix-popover-trigger-width] p-0"
                                                            onOpenAutoFocus={(e) => {
                                                                const searchInput = document.querySelector('[cmdk-input]') as HTMLInputElement;
                                                                if (searchInput) {
                                                                    searchInput.focus();
                                                                }
                                                            }}
                                                        >
                                                            <Command>
                                                                <CommandInput
                                                                    placeholder="Search or add services..."
                                                                    value={searchValue}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Tab' && !searchValue) {
                                                                            e.preventDefault();
                                                                            setOpen(false);
                                                                            const submitButton = document.querySelector('button[type="submit"]');
                                                                            if (submitButton) {
                                                                                (submitButton as HTMLElement).focus();
                                                                            }
                                                                        }
                                                                        if (e.key === 'Escape') {
                                                                            setOpen(false);
                                                                        }
                                                                    }}
                                                                    onChange={(e) => setSearchValue(e.target.value)}
                                                                />
                                                                <CommandList>
                                                                    <CommandEmpty>
                                                                        {searchValue.trim() ? (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => addCustomService(searchValue)}
                                                                                onKeyDown={(e) => {
                                                                                    if (e.key === 'Enter') {
                                                                                        e.preventDefault();
                                                                                        addCustomService(searchValue);
                                                                                    }
                                                                                }}
                                                                                className="flex w-full items-center gap-2 p-2 text-sm hover:bg-accent hover:text-accent-foreground"
                                                                            >
                                                                                <Plus className="h-4 w-4"/>
                                                                                Add &quot;{searchValue}&quot;
                                                                            </button>
                                                                        ) : null}
                                                                    </CommandEmpty>
                                                                    <CommandGroup>
                                                                        {services
                                                                            .filter((service) => service.toLowerCase().includes(searchValue.toLowerCase()))
                                                                            .map((service) => (
                                                                                <CommandItem 
                                                                                    key={service}
                                                                                    onSelect={() => toggleService(service)}
                                                                                    onKeyDown={(e) => {
                                                                                        if (e.key === 'Enter') {
                                                                                            e.preventDefault();
                                                                                            toggleService(service);
                                                                                        }
                                                                                    }}
                                                                                    className="cursor-pointer"
                                                                                >
                                                                                    <Check
                                                                                        className={cn(
                                                                                            "mr-2 h-4 w-4",
                                                                                            selectedServices.includes(service) ? "opacity-100" : "opacity-0",
                                                                                        )}
                                                                                    />
                                                                                    {service}
                                                                                </CommandItem>
                                                                            ))}
                                                                    </CommandGroup>
                                                                </CommandList>
                                                            </Command>
                                                        </PopoverContent>
                                                    </Popover>
                                                    <div className="mt-2 flex flex-wrap gap-2">
                                                        {selectedServices.map((service) => (
                                                            <span key={service}
                                                                  className="bg-[#7C3AED] text-white px-2 py-1 rounded-full text-sm">
                            {service}
                                                            <button type="button" onClick={() => toggleService(service)}
                                                                    className="ml-2 focus:outline-none">
                                                              &times;
                                                            </button>
                                                          </span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <Button
                                                    type="submit"
                                                    disabled={isSubmitting}
                                                    className="h-12 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-base font-semibold px-6 rounded-md transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-400 focus:ring-opacity-75 focus:bg-[#6D28D9] flex items-center gap-2 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
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
                                            className="bg-white p-12 rounded-xl shadow-lg border border-gray-100"
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
                </main>
                <Footer/>
            </div>
        </ErrorBoundary>
    )
}
