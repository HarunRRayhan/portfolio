'use client'

import React, { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'

const rotationIntervalMs = 5000

const directoryBadges = [
    `<a href="https://earlyhunt.com/project/skaleagents" target="_blank" rel="noopener">
  <img src="https://earlyhunt.com/badges/earlyhunt-badge-light.svg" alt="Featured on EarlyHunt" width="265" height="58" />
</a>`,
    `<a href="https://sumodir.com" target="_blank" rel="dofollow"><img src="https://sumodir.com/badge.png" alt="Featured on SumoDir" width="200" height="54" /></a>`,
    `<a href="https://twelve.tools" target="_blank"><img src="https://twelve.tools/badge0-white.svg" alt="Featured on Twelve Tools" width="148" height="40"></a>`,
    `<a href="https://dododirectory.com" target="_blank" rel="dofollow"><img src="https://dododirectory.com/badge-light.png" alt="Featured on DodoDirectory" width="200" height="54" /></a>`,
    `<a href="https://wired.business" target="_blank"><img src="https://wired.business/badge0-white.svg" alt="Featured on Wired Business" width="200" height="54"></a>`,
    `<a href="https://tools.launchllama.co?utm_source=badge&utm_medium=referral" target="_blank" rel="noopener noreferrer">
  <img src="https://tools.launchllama.co/featured-badge.png?v=2"
    alt="Featured on Launch Llama Tools"
    width="200" height="52" />
</a>`,
    `<a href="https://aihustle.tools" target="_blank" rel="noopener">AI Hustle</a>`,
    `<a href="https://showmebest.ai" target="_blank"><img src="https://showmebest.ai/badge/feature-badge-white.webp" alt="Featured on ShowMeBestAI" width="220" height="60"></a>`,
    `Featured on <a href="https://aitoolsmarketer.com/">AI Tools for Marketers</a>`,
    `<a href="https://launchboosts.com/project/crontinel" target="_blank"><img src="https://launchboosts.com/badges/featured-dark.svg" alt="Featured on LaunchBoosts" width="180" height="54" /></a>`,
    `<a href="https://www.aitoolsaver.com" target="_blank">Featured on AiToolSaver</a>`,
    `<a href="https://saasbison.com" target="_blank" rel="dofollow"><img src="https://saasbison.com/badge.png" alt="Featured on SaaSBison" width="200" height="54" /></a>`,
    `<a href="https://dang.ai" target="_blank" rel="dofollow noopener" style="display:inline-block;text-decoration:none;"><img src="https://assets.dang.ai/badges/dang-verified-dark.png" alt="Verified on DANG!" width="260" height="94" style="display:block;width:260px;max-width:100%;height:auto;border:0;outline:none;text-decoration:none;" /></a>`,
    `<a href="https://www.launchvault.dev" target="_blank" title="Feature On Launch Vault">
  <img
    src="https://www.launchvault.dev/images/badges/launch-valut-badge.svg"
    alt="Feature On Launch Vault"
    style="width: 195px; height: auto;"
  />
</a>`,
    `<a href="https://indiehunt.io/project/appnary" target="_blank" rel="noopener">
  <img src="https://indiehunt.io/badges/indiehunt-badge-light.svg" alt="Featured on IndieHunt" width="265" height="58" />
</a>`,
    `<a href="https://www.superlaun.ch/products/3530" target="_blank" rel="noopener">
  <img src="https://www.superlaun.ch/badge.png" alt="Featured on Super Launch" width="300" height="300" />
</a>`,
]

export function DirectoryBadgeSlider() {
    const [activeIndex, setActiveIndex] = useState(0)
    const [isPaused, setIsPaused] = useState(false)
    const [isPointerInside, setIsPointerInside] = useState(false)
    const [isFocused, setIsFocused] = useState(false)
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(true)

    useEffect(() => {
        const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
        const updatePreference = () => setPrefersReducedMotion(motionPreference.matches)

        updatePreference()
        motionPreference.addEventListener('change', updatePreference)

        return () => motionPreference.removeEventListener('change', updatePreference)
    }, [])

    useEffect(() => {
        if (isPaused || isPointerInside || isFocused || prefersReducedMotion) return

        const interval = window.setInterval(() => {
            setActiveIndex((index) => (index + 1) % directoryBadges.length)
        }, rotationIntervalMs)

        return () => window.clearInterval(interval)
    }, [isFocused, isPaused, isPointerInside, prefersReducedMotion])

    const showRotationControl = !prefersReducedMotion

    return (
        <section
            role="region"
            aria-label="Featured directory badges"
            aria-roledescription="carousel"
            className="mt-8 border-t border-slate-800/80 pt-6"
            onPointerEnter={() => setIsPointerInside(true)}
            onPointerLeave={() => setIsPointerInside(false)}
            onFocusCapture={() => setIsFocused(true)}
            onBlurCapture={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                    setIsFocused(false)
                }
            }}
        >
            <div className="mx-auto max-w-sm">
                <div className="relative h-[76px] overflow-hidden" aria-live="off">
                    {directoryBadges.map((markup, index) => (
                        <div
                            key={index}
                            role="group"
                            aria-roledescription="slide"
                            aria-label={`${index + 1} of ${directoryBadges.length}`}
                            aria-hidden={index !== activeIndex}
                            inert={index !== activeIndex}
                            className={`absolute inset-0 flex items-center justify-center px-2 transition-opacity duration-300 motion-reduce:transition-none ${
                                index === activeIndex ? 'opacity-100' : 'pointer-events-none opacity-0'
                            }`}
                        >
                            <div
                                className="flex h-full w-full items-center justify-center text-sm text-slate-500 [&_a]:inline-flex [&_a]:max-w-full [&_a]:items-center [&_a]:justify-center [&_a]:text-slate-400 [&_a]:transition-colors [&_a:hover]:text-slate-200 [&_img]:block [&_img]:h-auto [&_img]:w-auto [&_img]:max-h-14 [&_img]:max-w-full [&_img]:object-contain [&_img]:opacity-80"
                                dangerouslySetInnerHTML={{ __html: markup }}
                            />
                        </div>
                    ))}
                </div>

                <div className="mt-2 flex items-center justify-center gap-2">
                    <button
                        type="button"
                        aria-label="Previous badge"
                        onClick={() => setActiveIndex((index) => (index - 1 + directoryBadges.length) % directoryBadges.length)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-800 text-slate-500 transition hover:border-slate-700 hover:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                    >
                        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                    </button>
                    {showRotationControl && (
                        <button
                            type="button"
                            aria-label={isPaused ? 'Resume rotation' : 'Pause rotation'}
                            aria-pressed={isPaused}
                            onClick={() => setIsPaused((paused) => !paused)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-800 text-slate-500 transition hover:border-slate-700 hover:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                        >
                            {isPaused ? (
                                <Play className="h-3.5 w-3.5" aria-hidden="true" />
                            ) : (
                                <Pause className="h-3.5 w-3.5" aria-hidden="true" />
                            )}
                        </button>
                    )}
                    <button
                        type="button"
                        aria-label="Next badge"
                        onClick={() => setActiveIndex((index) => (index + 1) % directoryBadges.length)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-800 text-slate-500 transition hover:border-slate-700 hover:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                    >
                        <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                </div>
            </div>
        </section>
    )
}
