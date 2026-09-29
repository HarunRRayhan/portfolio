'use client'

import React, { useEffect, useRef } from 'react'

const marqueeSpeedPxPerSecond = 28

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
    `<a href="https://launchtory.com/projects/harun-dev">Harun.dev on Launchtory</a>`,
    `<a href="https://web-review.com" target="_blank" rel="dofollow"><img src="https://web-review.com/badge.png" alt="Featured on Web Review" width="200" height="54" /></a>`,
    `<a href="https://aitoolfame.com/item/harun-r-rayhan" target="_blank" rel="noopener noreferrer">
<img src="https://aitoolfame.com/badge-light.svg" alt="Featured on aitoolfame.com" style="height: 54px; width: auto;" />
</a>`,
    `<a href="https://tinyhunt.dev/projects/harun-dev?utm_source=badge" target="_blank" rel="noopener noreferrer">
  <img src="https://r2.direasy-multi-tenant.focusapps.app/uploads/616d0b1a-3979-4b8c-94d1-b4f1fedd3ead/1783232956807/nynif7cioz/featured-on-light.svg" alt="Featured on TinyHunt" style="height:44px;width:auto"/>
</a>`,
    `<a href="https://startupfa.me/s/harun-dev?utm_source=harun.dev" target="_blank"><img src="https://startupfa.me/badges/featured-badge.webp" alt="Harun.dev - Featured on Startup Fame" width="171" height="54" /></a>`,
    `<a href="https://codehype.ai/product/harun-dev-consulting?utm_source=codehype_badge" target="_blank" rel="noopener noreferrer">
  <img src="https://codehype.ai/badges/harun-dev-consulting.svg?variant=find-us&v=20" alt="Featured on CodeHype" width="180" height="65" loading="lazy" decoding="async" style="display:inline-block;border:0;width:100%;max-width:180px;height:auto;max-height:65px;" />
</a>`,
]

export function DirectoryBadgeSlider() {
    const trackRef = useRef<HTMLDivElement | null>(null)
    const isPointerInsideRef = useRef(false)
    const isFocusedRef = useRef(false)

    useEffect(() => {
        const track = trackRef.current
        if (!track) return

        const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
        const originalBadges = Array.from(track.children)
        let animationFrame: number | null = null
        let previousTimestamp: number | null = null
        let offsetPx = 0

        const stopAnimation = () => {
            if (animationFrame !== null) {
                window.cancelAnimationFrame(animationFrame)
                animationFrame = null
            }
            previousTimestamp = null
        }

        const animate = (timestamp: number) => {
            if (previousTimestamp !== null && !isPointerInsideRef.current && !isFocusedRef.current) {
                const firstBadge = track.firstElementChild as HTMLElement | null
                const badgeWidth = firstBadge?.getBoundingClientRect().width ?? 0

                if (firstBadge && badgeWidth > 0) {
                    const elapsedMs = Math.min(timestamp - previousTimestamp, 50)
                    offsetPx += (marqueeSpeedPxPerSecond * elapsedMs) / 1000

                    while (offsetPx >= badgeWidth) {
                        offsetPx -= badgeWidth
                        const badgeToRecycle = track.firstElementChild
                        if (badgeToRecycle) track.appendChild(badgeToRecycle)
                    }

                    track.style.transform = `translate3d(-${offsetPx}px, 0, 0)`
                }
            }

            previousTimestamp = timestamp
            animationFrame = window.requestAnimationFrame(animate)
        }

        const startAnimation = () => {
            if (motionPreference.matches || animationFrame !== null) return
            previousTimestamp = null
            animationFrame = window.requestAnimationFrame(animate)
        }

        const handleMotionPreferenceChange = () => {
            if (motionPreference.matches) {
                stopAnimation()
                track.replaceChildren(...originalBadges)
                offsetPx = 0
                track.style.transform = 'translate3d(0, 0, 0)'
                return
            }

            startAnimation()
        }

        if (!motionPreference.matches) startAnimation()
        motionPreference.addEventListener('change', handleMotionPreferenceChange)

        return () => {
            stopAnimation()
            motionPreference.removeEventListener('change', handleMotionPreferenceChange)
        }
    }, [])

    return (
        <section
            role="region"
            aria-label="Featured directory badges"
            className="mt-8 border-t border-slate-800/80 pt-6"
            onPointerEnter={() => {
                isPointerInsideRef.current = true
            }}
            onPointerLeave={() => {
                isPointerInsideRef.current = false
            }}
            onFocusCapture={() => {
                isFocusedRef.current = true
            }}
            onBlurCapture={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                    isFocusedRef.current = false
                }
            }}
        >
            <div className="mx-auto w-full max-w-6xl">
                <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">Featured on</p>
                <div className="overflow-hidden" aria-live="off">
                    <div ref={trackRef} className="flex w-max will-change-transform">
                        {directoryBadges.map((markup, index) => (
                            <div
                                key={index}
                                className="flex h-[76px] w-[148px] shrink-0 items-center justify-center px-2 sm:w-[180px]"
                            >
                                <div
                                    className="flex h-full w-full items-center justify-center text-sm text-slate-500 [&_a]:inline-flex [&_a]:max-w-full [&_a]:items-center [&_a]:justify-center [&_a]:text-slate-400 [&_a]:transition-colors [&_a:hover]:text-slate-200 [&_img]:block [&_img]:h-auto [&_img]:w-auto [&_img]:max-h-12 [&_img]:max-w-full [&_img]:object-contain [&_img]:opacity-80"
                                    dangerouslySetInnerHTML={{ __html: markup }}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
