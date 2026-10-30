import { useState } from "react"
import { Link } from "@inertiajs/react"
import { ArrowRight, ArrowUpRight, Check, ChevronDown, Copy, Star } from "lucide-react"
import { Github } from "@/lib/icons"
import { cn } from "@/lib/utils"

const repoUrl = "https://github.com/HarunRRayhan/RayStack"

const focusRing =
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-700"

const globalInstall = {
    code: "git clone --depth 1 https://github.com/HarunRRayhan/RayStack.git ~/.raystack && ~/.raystack/install.sh",
    note: "Installs all twenty-one skills globally for Claude Code. Add --agent codex, cursor, or grok for another agent. To update, run git -C ~/.raystack pull && ~/.raystack/install.sh."
}

const installs = [
    {
        agent: "skills CLI",
        code: "npx skills add HarunRRayhan/RayStack -g -a claude-code",
        note: "Swap claude-code for codex or cursor, list several, or drop -a to pick from a list."
    },
    {
        agent: "Claude Code",
        code: "/plugin marketplace add HarunRRayhan/RayStack\n/plugin install raystack@raystack",
        note: "Then type /raystack in the repo you want reviewed."
    },
    {
        agent: "Codex",
        code: "codex plugin marketplace add HarunRRayhan/RayStack\ncodex plugin add raystack@raystack",
        note: "Or run ~/.raystack/install.sh --agent codex."
    },
    {
        agent: "Cursor",
        code: "~/.raystack/install.sh --agent cursor",
        note: "After the clone above. It copies the skills to ~/.cursor/skills/."
    },
    {
        agent: "Grok",
        code: "grok plugin marketplace add HarunRRayhan/RayStack\ngrok plugin install raystack --trust",
        note: "Not tested end to end yet. ~/.raystack/install.sh --agent grok works too."
    },
    {
        agent: "Any other agent",
        code: "~/.raystack/install.sh --agent custom --dir /path/to/skills",
        note: "--dry-run shows what it would do. --uninstall removes all twenty-one skills."
    }
]

const skillGroups: { title: string; skills: [string, string][] }[] = [
    {
        title: "Development",
        skills: [
            ["dev", "The entry point. Sees where the project is, picks Quick, Standard, or Full, and runs the next step."],
            ["dev-hub", "Sets up AGENTS.md, a decisions log, and the docs folders. Can grow into a planning hub for several repos."],
            ["dev-research", "Dated research notes with a source beside every fact."],
            ["dev-prd", "Asks until it can write the PRD, with each behaviour written as a numbered, testable line."],
            ["dev-spec", "Architecture and per-area specs, checked against the shipped engineering principles."],
            ["dev-plan", "One plan per slice. Every behaviour maps to a task before any code is written."],
            ["dev-build", "A fresh agent builds each task and another reviews it. A ledger lets a stopped build resume, then a final review and ship."]
        ]
    },
    {
        title: "Reviews",
        skills: [
            ["raystack", "The entry point. Picks the reviews that fit this repo and runs them."],
            ["aws-billing-review", "AWS spend, with savings ranked in $/mo."],
            ["aws-security-review", "IAM, public exposure, logging, and secrets on AWS."],
            ["aws-bottleneck-review", "Throttling, limits, quotas, and single points on the request path."],
            ["infra-review", "Deploys, rollback, backups, monitoring, and exposure on any platform."],
            ["scaling-review", "What breaks first at 10x and 100x load."],
            ["database-review", "Queries, indexes, migrations, backups, connections, and bloat."],
            ["app-security-review", "Your app's code: IDOR, injection, secrets, CSRF, and vulnerable dependencies. Every finding needs a working exploit."],
            ["aws-readonly-setup", "No read-only AWS access yet? Signs you in and creates a role that can read config but not data or anything it could change."]
        ]
    },
    {
        title: "Principles and workflow",
        skills: [
            ["principle-ship", "Done means merged, deployed, and checked live. Asks before merging unless you turn that off."],
            ["principle-smallest-change", "The smallest change that fully solves the task."],
            ["principle-ask-with-question-tool", "Questions go through your agent's question prompt, not plain chat."],
            ["principle-secrets-layout", "One flat secrets folder, examples committed, real values never."],
            ["local-verify", "Checks a change in a real local browser against a throwaway database before it ships."]
        ]
    }
]

function CodeBlock({ code, label }: { code: string; label: string }) {
    const [copied, setCopied] = useState(false)

    async function copy() {
        try {
            await navigator.clipboard.writeText(code)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch {
            // Clipboard can be blocked; the command stays selectable.
        }
    }

    return (
        <div className="relative rounded-lg bg-[#242821] text-[#f4f4ef] dark:ring-1 dark:ring-slate-700">
            <pre className="overflow-x-auto p-4 pr-14 font-mono text-[13px] leading-6">
                <code>{code}</code>
            </pre>
            <button
                type="button"
                onClick={copy}
                aria-label={`Copy ${label} install command`}
                className={cn(
                    "absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-md text-[#c9cbc2] hover:bg-white/10 dark:hover:bg-slate-900/10 hover:text-white",
                    focusRing
                )}
            >
                {copied ? (
                    <Check aria-hidden="true" className="h-4 w-4" />
                ) : (
                    <Copy aria-hidden="true" className="h-4 w-4" />
                )}
            </button>
            <span role="status" aria-live="polite" className="sr-only">
                {copied ? "Copied" : ""}
            </span>
        </div>
    )
}

function SectionHeading({ id, eyebrow, title }: { id: string; eyebrow: string; title: string }) {
    return (
        <>
            <p className="mb-3 flex items-center gap-2.5 text-sm font-medium text-[#686b65] dark:text-slate-400">
                <span className="h-2 w-2 bg-amber-600" aria-hidden="true" />
                {eyebrow}
            </p>
            <h2 id={id} className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                {title}
            </h2>
        </>
    )
}

export default function RayStack({ stars }: { stars?: number | null }) {
    return (
        <div className="min-h-screen bg-[#fafaf8] dark:bg-slate-950 text-[#242821] dark:text-slate-100">
            <div className="mx-auto max-w-5xl px-5 pb-20 pt-28 sm:px-8 sm:pt-36 lg:px-12">
                <header className="border-b border-[#dedfd8] dark:border-slate-800 pb-12 sm:pb-16">
                    <div className="mb-6 flex items-center gap-3">
                        <img
                            src="/images/products/raystack.svg"
                            alt=""
                            width="40"
                            height="40"
                            className="h-10 w-10"
                        />
                        <p className="text-sm font-medium text-[#686b65] dark:text-slate-400">
                            RayStack v0.6.4 · Open source, MIT
                        </p>
                    </div>
                    <h1 className="max-w-4xl text-[2.75rem] font-semibold leading-[1.08] tracking-[-0.045em] sm:text-6xl">
                        Build and review software with your coding agent.
                    </h1>
                    <p className="mt-6 max-w-2xl text-base leading-7 text-[#686b65] dark:text-slate-400 sm:text-lg sm:leading-8">
                        Point your agent at a repo and type <code className="font-mono text-[#242821] dark:text-slate-100">/raystack</code>. It works out what you want.
                        Build, and it takes a product from idea to shipped code the way I build:
                        decisions logged once, a plan per slice, and every task built and reviewed by
                        separate agents. Review, and you get a ranked findings report on cost, security,
                        bottlenecks, deploys, scaling, or the database, with evidence and a fix you apply
                        yourself. It's how I build and what I check when I audit someone's stack, written
                        down as agent skills.
                    </p>
                    <div className="mt-8 flex flex-wrap gap-3">
                        <a
                            href={repoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                                "inline-flex min-h-12 items-center gap-3 rounded-md bg-[#242821] px-6 py-3 text-sm font-medium text-white hover:bg-[#42483c] dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200",
                                focusRing
                            )}
                        >
                            <Github aria-hidden="true" className="h-4 w-4" />
                            View on GitHub
                            {typeof stars === "number" && (
                                <span className="inline-flex items-center gap-1 rounded bg-white/15 px-2 py-0.5 text-xs tabular-nums dark:bg-slate-900/10">
                                    <Star aria-hidden="true" className="h-3.5 w-3.5 fill-current" />
                                    {stars.toLocaleString("en-US")}
                                    <span className="sr-only">{stars === 1 ? "star" : "stars"}</span>
                                </span>
                            )}
                            <span className="sr-only">(opens in a new tab)</span>
                        </a>
                        <a
                            href="#install"
                            className={cn(
                                "inline-flex min-h-12 items-center gap-3 rounded-md border border-[#cccec3] dark:border-slate-700 px-6 py-3 text-sm font-medium hover:bg-[#eeeee8] dark:hover:bg-slate-800",
                                focusRing
                            )}
                        >
                            Install
                            <ArrowRight aria-hidden="true" className="h-4 w-4 rotate-90" />
                        </a>
                    </div>
                </header>

                <section aria-labelledby="install" className="scroll-mt-28 border-b border-[#dedfd8] dark:border-slate-800 py-14 sm:py-16">
                    <SectionHeading id="install" eyebrow="Install" title="Pick your agent" />
                    <p className="mt-4 max-w-2xl text-sm leading-6 text-[#686b65] dark:text-slate-400">
                        You need <code className="font-mono">git</code>, <code className="font-mono">bash</code> and <code className="font-mono">jq</code>.
                        The PDF export also needs Chrome or Chromium and <code className="font-mono">npx</code>.
                    </p>
                    <div className="mt-8">
                        <h3 className="mb-3 text-base font-semibold">Any agent, one command</h3>
                        <CodeBlock code={globalInstall.code} label="global" />
                        <p className="mt-2 text-xs leading-5 text-[#686b65] dark:text-slate-400">{globalInstall.note}</p>
                    </div>
                    <details className="group mt-8 rounded-xl border border-[#dedfd8] dark:border-slate-800 bg-[#fffefa] dark:bg-slate-900">
                        <summary
                            className={cn(
                                "flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-5 py-3 text-sm font-medium hover:bg-[#f4f4ef] dark:hover:bg-slate-800 [&::-webkit-details-marker]:hidden",
                                focusRing
                            )}
                        >
                            Install for a specific agent: Claude Code, Codex, Cursor, Grok, or any other
                            <ChevronDown
                                aria-hidden="true"
                                className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180"
                            />
                        </summary>
                        <div className="grid gap-8 border-t border-[#dedfd8] dark:border-slate-800 px-5 py-6">
                            {installs.map((install) => (
                                <div key={install.agent}>
                                    <h3 className="mb-3 text-base font-semibold">{install.agent}</h3>
                                    <CodeBlock code={install.code} label={install.agent} />
                                    <p className="mt-2 text-xs leading-5 text-[#686b65] dark:text-slate-400">{install.note}</p>
                                </div>
                            ))}
                        </div>
                    </details>
                </section>

                <section aria-labelledby="skills" className="border-b border-[#dedfd8] dark:border-slate-800 py-14 sm:py-16">
                    <SectionHeading id="skills" eyebrow="Skills" title="Twenty-one skills, three groups" />
                    <p className="mt-4 max-w-2xl text-sm leading-6 text-[#686b65] dark:text-slate-400">
                        <code className="font-mono">/raystack</code> is the one entry point. For build work it
                        hands off to <code className="font-mono">dev</code>, which picks the smallest track that
                        fits, from a quick bug fix to a full product. For reviews it looks at the repo, recommends
                        reviews, and asks once which ones to run. You can also call any skill directly. Principles
                        load on their own when a task matches.
                    </p>
                    {skillGroups.map((group) => (
                        <div key={group.title} className="mt-8">
                            <h3 className="mb-3 text-base font-semibold">{group.title}</h3>
                            <dl className="divide-y divide-[#e8e9e1] dark:divide-slate-800 rounded-xl border border-[#dedfd8] dark:border-slate-800 bg-[#fffefa] dark:bg-slate-900">
                                {group.skills.map(([name, line]) => (
                                    <div key={name} className="grid gap-1 px-5 py-4 sm:grid-cols-[17rem_1fr] sm:gap-6">
                                        <dt className="break-words font-mono text-sm font-medium">{name}</dt>
                                        <dd className="text-sm leading-6 text-[#686b65] dark:text-slate-400">{line}</dd>
                                    </div>
                                ))}
                            </dl>
                        </div>
                    ))}
                </section>

                <section aria-labelledby="read-only" className="border-b border-[#dedfd8] dark:border-slate-800 py-14 sm:py-16">
                    <SectionHeading id="read-only" eyebrow="Safety" title="Read-only by design" />
                    <div className="mt-6 max-w-2xl space-y-4 text-sm leading-6 text-[#686b65] dark:text-slate-400 sm:text-base sm:leading-7">
                        <p>
                            No review changes anything live. Fixes come back as diffs or as commands
                            for you to run.
                        </p>
                        <p>
                            In Claude Code, a guard hook checks every shell command during a review.
                            Cloud and database CLIs get read verbs only, and deploy tools are blocked.
                            The guard is a seatbelt, not a sandbox. Cursor, Codex, and Grok follow the
                            same rules, but nothing enforces them there.
                        </p>
                        <p className="text-[#242821] dark:text-slate-100">
                            So run reviews with read-only credentials: AWS <code className="font-mono">ReadOnlyAccess</code> or{" "}
                            <code className="font-mono">ViewOnlyAccess</code>, and a read-only database role.
                            That's the real boundary.
                        </p>
                        <p>
                            No read-only AWS access yet? <code className="font-mono">aws-readonly-setup</code> does it for
                            you: one browser sign-in, then a role that reads config and billing but not your data, with
                            no access keys created.
                        </p>
                    </div>
                </section>

                <section aria-labelledby="report" className="border-b border-[#dedfd8] dark:border-slate-800 py-14 sm:py-16">
                    <SectionHeading id="report" eyebrow="Output" title="What you get back" />
                    <div className="mt-6 grid gap-8 md:grid-cols-2">
                        <p className="text-sm leading-6 text-[#686b65] dark:text-slate-400 sm:text-base sm:leading-7">
                            Each review writes <code className="font-mono text-[#242821] dark:text-slate-100">reviews/YYYY-MM-DD-&lt;skill&gt;.md</code>{" "}
                            in your repo. It has a short summary, the inputs it used and the ones it
                            lacked, and findings ranked Critical to Low. Each finding has evidence, a fix,
                            and an estimated $/mo where one can be worked out. Want a PDF for a client or
                            your boss? The review offers one at the end.
                        </p>
                        <div aria-hidden="true" className="rounded-lg border border-[#dedfd8] dark:border-slate-800 bg-white dark:bg-slate-900 p-5 font-mono text-[12px] leading-6 text-slate-600 dark:text-slate-300">
                            <p className="text-[#242821] dark:text-slate-100">## Findings</p>
                            <p><span className="text-red-700 dark:text-red-300">Critical</span> · Public S3 bucket with logs</p>
                            <p><span className="text-amber-700 dark:text-amber-300">High</span> · Idle NAT gateway · est. $/mo</p>
                            <p><span className="text-emerald-800 dark:text-emerald-300">Medium</span> · No restore test on RDS</p>
                            <p className="mt-2 text-[#242821] dark:text-slate-100">## Commands for you to run</p>
                        </div>
                    </div>
                    <p className="mt-6 text-sm text-[#686b65] dark:text-slate-400">
                        No live access? A review still works from your IaC and code, marks those findings
                        unconfirmed, and lists what it needs from you.
                    </p>
                </section>

                <section
                    aria-labelledby="raystack-audit"
                    className="flex flex-col items-start justify-between gap-6 pt-12 sm:flex-row sm:items-center"
                >
                    <div>
                        <h2 id="raystack-audit" className="text-2xl font-semibold tracking-tight sm:text-3xl">
                            Want me to look at it myself?
                        </h2>
                        <p className="mt-3 max-w-lg text-sm leading-6 text-[#686b65] dark:text-slate-400">
                            RayStack covers the checks I run first. For a hands-on audit of your
                            stack, book a consultation.
                        </p>
                    </div>
                    <Link
                        href="/consultation"
                        className={cn(
                            "inline-flex min-h-12 shrink-0 items-center gap-5 rounded-md bg-[#242821] px-6 py-3 text-sm font-medium text-white hover:bg-[#42483c] dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200",
                            focusRing
                        )}
                    >
                        Book a consultation
                        <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
                    </Link>
                </section>
            </div>
        </div>
    )
}
