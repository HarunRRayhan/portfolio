'use client'

import {useState, useEffect, FormEvent, ChangeEvent} from "react"
import {Menubar} from "@/Components/Menubar"
import {Footer} from "@/Components/Footer"
import {motion} from "framer-motion"
import {Button} from "@/Components/ui/button"
import {Input} from "@/Components/ui/input"
import {Textarea} from "@/Components/ui/textarea"
import {Label} from "@/Components/ui/label"
import {Check, ChevronsUpDown, Plus, Send} from "lucide-react"
import {cn} from "@/lib/utils"
import {Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList} from "@/Components/ui/command"
import {Popover, PopoverContent, PopoverTrigger} from "@/Components/ui/popover"
import type React from "react"
import {ErrorBoundary} from "@/Components/ErrorBoundary"
import {Head} from "@inertiajs/react";

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

export default function Contact() {
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [subject, setSubject] = useState("")
    const [message, setMessage] = useState("")
    const [selectedServices, setSelectedServices] = useState<string[]>([])
    const [open, setOpen] = useState(false)
    const [searchValue, setSearchValue] = useState("")
    const [services, setServices] = useState<string[]>(predefinedServices)

    useEffect(() => {
        const textarea = document.getElementById("message") as HTMLTextAreaElement
        if (textarea) {
            textarea.style.height = "auto"
            textarea.style.height = `${textarea.scrollHeight}px`
        }
    }, [message])

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        // Handle form submission logic here
        console.log({name, email, subject, message, selectedServices})
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
            <Head>
                <title>Contact</title>
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
                                className="max-w-2xl mx-auto"
                            >
                                <form onSubmit={handleSubmit}
                                      className="space-y-6 bg-white p-8 rounded-lg shadow-lg border border-gray-100">
                                    <div>
                                        <Label htmlFor="name" className="text-base">Name <span className="text-red-500">*</span></Label>
                                        <Input 
                                            id="name" 
                                            value={name} 
                                            onChange={handleInputChange} 
                                            placeholder="Enter your name"
                                            className="bg-gray-50/50 border-gray-200 focus:bg-white transition-colors text-base h-12"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="email" className="text-base">Email <span className="text-red-500">*</span></Label>
                                        <Input 
                                            id="email" 
                                            type="email" 
                                            value={email} 
                                            onChange={handleInputChange}
                                            placeholder="Enter your email address"
                                            className="bg-gray-50/50 border-gray-200 focus:bg-white transition-colors text-base h-12"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="subject" className="text-base">Subject <span className="text-red-500">*</span></Label>
                                        <Input 
                                            id="subject" 
                                            value={subject} 
                                            onChange={handleInputChange}
                                            placeholder="What is your message about?"
                                            className="bg-gray-50/50 border-gray-200 focus:bg-white transition-colors text-base h-12"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="message" className="text-base">Message <span className="text-red-500">*</span></Label>
                                        <Textarea
                                            id="message"
                                            value={message}
                                            onChange={handleInputChange}
                                            placeholder="Write your message here..."
                                            className="min-h-[100px] resize-none overflow-hidden bg-gray-50/50 border-gray-200 focus:bg-white transition-colors text-base"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="services" className="text-base">Services</Label>
                                        <Popover open={open} onOpenChange={setOpen}>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" role="combobox" aria-expanded={open}
                                                        className="w-full justify-between bg-gray-50/50 border-gray-200 hover:bg-gray-50/80 text-base h-12">
                                                    {selectedServices.length > 0 ? `${selectedServices.length} selected` : "Select services"}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50"/>
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                                <Command>
                                                    <CommandInput
                                                        placeholder="Search or add services..."
                                                        value={searchValue}
                                                        onChange={(e) => setSearchValue(e.target.value)}
                                                    />
                                                    <CommandList>
                                                        <CommandEmpty>
                                                            {searchValue.trim() ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => addCustomService(searchValue)}
                                                                    className="flex w-full items-center gap-2 text-sm hover:bg-accent hover:text-accent-foreground"
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
                                                                    <CommandItem key={service}
                                                                                 onSelect={() => toggleService(service)}>
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
                                        className="h-10 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold px-8 rounded-md transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-opacity-50 flex items-center gap-2 justify-center"
                                    >
                                        <Send className="w-4 h-4"/>
                                        Send Message
                                    </Button>
                                </form>
                            </motion.div>
                        </div>
                    </section>
                </main>
                <Footer/>
            </div>
        </ErrorBoundary>
    )
}
