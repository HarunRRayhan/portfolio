'use client'

import React from 'react'

type InstagramBoldCoverProps = {
    eyebrow?: string
    title: string
    subtitle?: string
    note?: string
    accentLabel?: string
}

export function InstagramBoldCover({
    eyebrow = 'DECISION 1',
    title,
    subtitle,
    note,
    accentLabel = '7 days',
}: InstagramBoldCoverProps) {
    return (
        <section className="relative aspect-[16/9] w-full overflow-hidden bg-[#fbfbf8] text-[#111111]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(0,0,0,0.03),transparent_22%),radial-gradient(circle_at_18%_82%,rgba(0,0,0,0.025),transparent_24%)]" />

            <div className="absolute left-0 top-0 h-full w-full px-16 py-14 sm:px-20 sm:py-16">
                <p className="text-sm font-bold uppercase tracking-[0.32em] text-[#7a7a7a]">
                    {eyebrow}
                </p>

                <div className="mt-16 max-w-[980px]">
                    <h1 className="max-w-[12ch] text-[clamp(3.9rem,7.2vw,7.9rem)] font-black leading-[0.9] tracking-[-0.06em] text-[#111111]">
                        {title}
                    </h1>

                    {subtitle ? (
                        <p className="mt-8 max-w-[14ch] text-[clamp(1.35rem,2.2vw,2.4rem)] font-medium leading-tight text-[#7a7a7a]">
                            {subtitle}
                        </p>
                    ) : null}

                    {note ? (
                        <div className="mt-10 inline-flex max-w-[36rem] items-center gap-4 rounded-full border border-black/10 bg-white/80 px-5 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.05)] backdrop-blur-sm">
                            <span className="h-3 w-3 rounded-full bg-black" />
                            <span className="text-lg font-semibold text-[#111111] sm:text-xl">{note}</span>
                        </div>
                    ) : null}
                </div>

                <div className="absolute right-14 top-14 hidden h-40 w-40 rounded-[2rem] border border-black/5 bg-black/[0.02] shadow-[0_12px_30px_rgba(0,0,0,0.05)] lg:block" />

                <div className="absolute bottom-14 left-16 right-16 grid gap-4 lg:grid-cols-[1.08fr_0.02fr_1.08fr_0.02fr_0.86fr] lg:items-stretch">
                    <TimelineCard label="Warm-up" title="No posting" active={false} />
                    <Arrow />
                    <TimelineCard label="Day 7" title={accentLabel} active />
                    <Arrow />
                    <TimelineCard label="Method" title="Schedule posts" active={false} />
                </div>
            </div>
        </section>
    )
}

function TimelineCard({
    label,
    title,
    active,
}: {
    label: string
    title: string
    active: boolean
}) {
    return (
        <div
            className={[
                'rounded-[1.75rem] border bg-white/70 p-6 backdrop-blur-sm',
                active
                    ? 'border-[#2f6fed]/35 shadow-[0_16px_40px_rgba(47,111,237,0.12)]'
                    : 'border-black/10 shadow-[0_10px_30px_rgba(0,0,0,0.05)]',
            ].join(' ')}
        >
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#7a7a7a] sm:text-sm">{label}</p>
            <p className="mt-5 text-2xl font-black tracking-[-0.04em] text-[#111111] sm:text-[2rem]">
                {title}
            </p>
        </div>
    )
}

function Arrow() {
    return <div className="hidden items-center justify-center text-2xl font-black text-black/35 lg:flex">→</div>
}
