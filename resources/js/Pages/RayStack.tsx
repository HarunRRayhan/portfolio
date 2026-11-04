import { useState } from "react"
import { Link } from "@inertiajs/react"
import { ArrowRight, ArrowUpRight, Check, ChevronDown, Copy, Star } from "lucide-react"
import { Github } from "@/lib/icons"
import { cn } from "@/lib/utils"

const repoUrl = "https://github.com/HarunRRayhan/RayStack"

const focusRing =
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-700"

const getSh = "curl -fsSL https://raw.githubusercontent.com/HarunRRayhan/RayStack/main/get.sh | bash"

// An agent can't answer the per-agent questions, so its prompts add --yes.
const globalPrompt = "Install RayStack globally: run `" + getSh + " -s -- --yes`, then tell me which agents it installed for."

type AgentInstall = { name: string; flag: string; logo: string; global: string; project: string; extra?: string; promptOnly?: string }

// Folders match install.sh's agent table in the RayStack repo.
const agentInstalls: AgentInstall[] = [
    { name: "Claude Code", flag: "claude", logo: "claude", global: "~/.claude/skills", project: ".claude/skills", extra: "Plugin instead: claude plugin marketplace add HarunRRayhan/RayStack, then claude plugin install raystack@raystack. Use the script or the plugin, not both. Only Claude Code enforces the read-only review guard." },
    { name: "Claude (desktop app)", flag: "claude", logo: "claude", global: "~/.claude/skills", project: ".claude/skills", promptOnly: "Paste into the Code tab of the Claude desktop app, which is Claude Code. The skills go to ~/.claude/skills." },
    { name: "Codex", flag: "codex", logo: "codex", global: "~/.agents/skills", project: ".agents/skills", extra: "Plugin instead: codex plugin marketplace add HarunRRayhan/RayStack, then codex plugin add raystack@raystack." },
    { name: "ChatGPT (desktop app)", flag: "codex", logo: "chatgpt", global: "~/.agents/skills", project: ".agents/skills", promptOnly: "Paste into Codex in the ChatGPT desktop app. The skills go to ~/.agents/skills." },
    { name: "Cursor", flag: "cursor", logo: "cursor", global: "~/.cursor/skills", project: ".cursor/skills" },
    { name: "Grok Build", flag: "grok", logo: "grok", global: "~/.grok/skills", project: ".claude/skills", extra: "Grok also reads ~/.claude/skills and ~/.cursor/skills, so a Claude Code or Cursor install already covers it. Plugin instead: grok plugin install HarunRRayhan/RayStack --trust." },
    { name: "Grok (app)", flag: "grok", logo: "grok", global: "~/.grok/skills", project: ".claude/skills", promptOnly: "Paste into the Grok app, where it can run commands on your machine. The skills go to ~/.grok/skills, which Grok Build reads too." },
    { name: "Antigravity", flag: "antigravity", logo: "antigravity", global: "~/.gemini/antigravity/skills", project: ".agents/skills" },
    { name: "Gemini CLI", flag: "gemini", logo: "gemini", global: "~/.gemini/skills", project: ".agents/skills" },
    { name: "GitHub Copilot", flag: "copilot", logo: "copilot", global: "~/.copilot/skills", project: ".agents/skills" },
    { name: "Windsurf", flag: "windsurf", logo: "windsurf", global: "~/.codeium/windsurf/skills", project: ".windsurf/skills" },
    { name: "Cline", flag: "cline", logo: "cline", global: "~/.agents/skills", project: ".agents/skills" },
    { name: "Kiro", flag: "kiro", logo: "kiro", global: "~/.kiro/skills", project: ".kiro/skills" },
    { name: "Roo Code", flag: "roo", logo: "roo", global: "~/.roo/skills", project: ".roo/skills" },
    { name: "Kilo Code", flag: "kilo", logo: "kilo", global: "~/.kilo/skills", project: ".agents/skills" },
    { name: "Amp", flag: "amp", logo: "amp", global: "~/.config/agents/skills", project: ".agents/skills" },
    { name: "Goose", flag: "goose", logo: "goose", global: "~/.config/goose/skills", project: ".goose/skills" },
    { name: "OpenCode", flag: "opencode", logo: "opencode", global: "~/.config/opencode/skills", project: ".opencode/skills" },
    { name: "Qwen Code", flag: "qwen", logo: "qwen", global: "~/.qwen/skills", project: ".qwen/skills" },
    { name: "Trae", flag: "trae", logo: "trae", global: "~/.trae/skills", project: ".trae/skills" },
    { name: "Junie", flag: "junie", logo: "junie", global: "~/.junie/skills", project: ".junie/skills" },
    { name: "Augment", flag: "augment", logo: "augment", global: "~/.augment/skills", project: ".augment/skills" },
    { name: "Warp", flag: "warp", logo: "warp", global: "~/.agents/skills", project: ".agents/skills" },
    { name: "Zed", flag: "zed", logo: "zed", global: "~/.agents/skills", project: ".agents/skills" },
    { name: "OpenHands", flag: "openhands", logo: "openhands", global: "~/.openhands/skills", project: ".openhands/skills" },
    { name: "Continue", flag: "continue", logo: "continue", global: "~/.continue/skills", project: ".continue/skills" },
    { name: "OpenClaw (Clawdbot)", flag: "openclaw", logo: "openclaw", global: "~/.openclaw/skills", project: "skills", extra: "Still on the old name? Use --agent clawdbot or --agent moltbot." },
]

const agentInstall = (a: AgentInstall) => {
    const command = getSh + " -s -- --agent " + a.flag
    const app = a.name.replace(/ \(.*\)$/, "")
    return {
        command,
        prompt: "Install RayStack " + (a.promptOnly ? "for " : "globally for ") + app + ": run `" + command + "`, then tell me what it printed."
    }
}

const updateCommand = "~/.raystack/install.sh --update"
const updatePrompt = "Update RayStack: run `" + updateCommand + "`, then tell me the new version."
const uninstallCommand = "~/.raystack/install.sh --uninstall --agent all"
const uninstallPrompt = "Uninstall RayStack: run `" + uninstallCommand + "`, then delete ~/.raystack and ~/.raystack-installs and tell me what was removed."
const customCommand = "~/.raystack/install.sh --agent custom --dir /path/to/its/skills"

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
            ["dev-build", "A fresh agent builds each task and another reviews it. A ledger lets a stopped build resume, then a final review and ship."],
            ["dev-gaps", "For an existing project: finds the missing research, PRD, architecture, specs and plan, then writes them from the code and your answers."],
            ["dev-review", "Mid-build and read-only: checks the architecture, specs and plan against the code for drift, unserved behaviours and over-design."],
            ["dev-migrate", "Moves part of a project to another stack, say a service to Rust, step by step with parity tests."]
        ]
    },
    {
        title: "Reviews",
        skills: [
            ["audit", "The entry point for reviews, as dev is for building. /audit picks the reviews that fit this repo and runs them; /audit security runs one; /audit all runs a scan of every review that fits and writes one ranked summary."],
            ["aws-billing-review", "AWS spend, with savings ranked in $/mo."],
            ["aws-security-review", "IAM, public exposure, logging, and secrets on AWS."],
            ["aws-bottleneck-review", "Throttling, limits, quotas, and single points on the request path."],
            ["infra-review", "Deploys, rollback, backups, monitoring, and exposure on any platform."],
            ["scaling-review", "What breaks first at 10x and 100x load."],
            ["database-review", "Queries, indexes, migrations, backups, connections, and bloat."],
            ["app-security-review", "Your app's code: IDOR, injection, secrets, CSRF, security logging, and vulnerable dependencies. Every finding needs a working exploit."],
            ["performance-review", "Per-request cost today: N+1 queries, unbounded queries, slow work in the request path, caching, and bundle size."],
            ["pipeline-security-review", "CI/CD and supply chain: GitHub Actions pwn requests and injection, unpinned actions, Dockerfiles, IaC, and lockfiles."],
            ["architecture-review", "Finds the pattern your code uses (MVC, layered, CQRS, hexagonal, modular monolith, microservices) and checks it is followed: fat controllers, mixed CQRS sides, layer leaks, cycles, god classes."],
            ["frontend-review", "React, Next, Vue, Svelte, Angular, or Inertia: components, data fetching, re-renders, accessibility, forms, bundle, and SEO basics."],
            ["reliability-review", "Reliability and availability: timeouts, retries, idempotency, queues, health checks, single points of failure, backups, rollback, and SLOs."],
            ["codebase-review", "Code health: test gaps, hot spots, dead code, duplicated rules, swallowed errors, and outdated dependencies."],
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

function CodeBlock({ code, label, prompt, promptFirst = false }: { code: string; label: string; prompt?: string; promptFirst?: boolean }) {
    const [copied, setCopied] = useState<"" | "command" | "prompt">("")

    async function copy(text: string, which: "command" | "prompt") {
        try {
            await navigator.clipboard.writeText(text)
            setCopied(which)
            setTimeout(() => setCopied(""), 2000)
        } catch {
            // Clipboard can be blocked; the command stays selectable.
        }
    }

    const pill = cn(
        "inline-flex min-h-9 items-center gap-1.5 rounded-md px-3 text-xs font-medium text-[#c9cbc2] ring-1 ring-white/15 hover:bg-white/10 hover:text-white",
        focusRing
    )

    return (
        <div className="relative min-w-0 max-w-full rounded-lg bg-[#242821] text-[#f4f4ef] dark:ring-1 dark:ring-slate-700">
            {/* Long commands wrap inside the block; copy still takes the exact text. */}
            <pre className={cn("whitespace-pre-wrap p-4 font-mono text-[13px] leading-6 [overflow-wrap:anywhere]", !prompt && "pr-14")}>
                <code>{promptFirst && prompt ? prompt : code}</code>
            </pre>
            {prompt ? (
                <div className="flex flex-wrap gap-2 border-t border-white/10 px-4 py-3">
                    {(promptFirst
                        ? [
                              { which: "prompt" as const, text: prompt, title: "Copy prompt", aria: `Copy the ${label} prompt for an AI agent` },
                              { which: "command" as const, text: code, title: "Copy command", aria: `Copy the ${label} command` }
                          ]
                        : [
                              { which: "command" as const, text: code, title: "Copy command", aria: `Copy the ${label} command` },
                              { which: "prompt" as const, text: prompt, title: "Copy for AI agent", aria: `Copy the ${label} prompt for an AI agent` }
                          ]
                    ).map((b) => (
                        <button key={b.which} type="button" onClick={() => copy(b.text, b.which)} aria-label={b.aria} className={pill}>
                            {copied === b.which ? <Check aria-hidden="true" className="h-3.5 w-3.5" /> : <Copy aria-hidden="true" className="h-3.5 w-3.5" />}
                            {b.title}
                        </button>
                    ))}
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => copy(code, "command")}
                    aria-label={`Copy ${label} command`}
                    className={cn(
                        "absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-md text-[#c9cbc2] hover:bg-white/10 dark:hover:bg-slate-900/10 hover:text-white",
                        focusRing
                    )}
                >
                    {copied ? <Check aria-hidden="true" className="h-4 w-4" /> : <Copy aria-hidden="true" className="h-4 w-4" />}
                </button>
            )}
            <span role="status" aria-live="polite" className="sr-only">
                {copied === "prompt" ? "Prompt copied" : copied ? "Copied" : ""}
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

export default function RayStack({ stars, version }: { stars?: number | null; version?: string | null }) {
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
                            RayStack {version ?? "v0.6.5"} · Open source, MIT
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
                        <a
                            href={`${repoUrl}/blob/main/docs/guide.md`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                                "inline-flex min-h-12 items-center gap-3 rounded-md border border-[#cccec3] dark:border-slate-700 px-6 py-3 text-sm font-medium hover:bg-[#eeeee8] dark:hover:bg-slate-800",
                                focusRing
                            )}
                        >
                            Read the guide
                            <span className="sr-only">(opens in a new tab)</span>
                        </a>
                    </div>
                </header>

                <section aria-labelledby="install" className="scroll-mt-28 border-b border-[#dedfd8] dark:border-slate-800 py-14 sm:py-16">
                    <SectionHeading id="install" eyebrow="Install" title="One command, every agent" />
                    <p className="mt-4 max-w-2xl text-sm leading-6 text-[#686b65] dark:text-slate-400">
                        You need <code className="font-mono">git</code>, <code className="font-mono">bash</code> and <code className="font-mono">jq</code>.
                        The PDF export also needs Chrome or Chromium and <code className="font-mono">npx</code>.
                    </p>
                    <div className="mt-8 grid gap-8">
                        <div className="min-w-0">
                            <h3 className="mb-3 text-base font-semibold">Global: every agent on your machine</h3>
                            <CodeBlock code={getSh} label="global install" prompt={globalPrompt} />
                            <p className="mt-2 text-xs leading-5 text-[#686b65] dark:text-slate-400">
                                Run the command in a terminal: it finds the coding agents on your machine and asks, for
                                each one, whether to install there. Or copy it for your AI agent and paste it in; that
                                version installs for every agent found without asking. Then start a new agent session
                                and type /raystack.
                            </p>
                        </div>
                    </div>

                    <h3 className="mt-12 text-base font-semibold">Agents</h3>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-[#686b65] dark:text-slate-400">
                        Open yours for its command, or copy it as a prompt for your AI agent. Install for as many agents as you use; add --project . to install into one repo.
                    </p>
                    <div className="mt-4 divide-y divide-[#dedfd8] overflow-hidden rounded-xl border border-[#dedfd8] bg-[#fffefa] dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
                        {agentInstalls.map((a) => (
                            <details key={a.name} className="group">
                                <summary
                                    className={cn(
                                        "flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-5 py-3 text-sm font-medium hover:bg-[#f4f4ef] dark:hover:bg-slate-800 [&::-webkit-details-marker]:hidden",
                                        focusRing
                                    )}
                                >
                                    <span className="flex items-center gap-3">
                                        <img src={`/images/products/agents/${a.logo}.png`} alt="" width="20" height="20" loading="lazy" className="h-5 w-5 rounded" />
                                        {a.name}
                                    </span>
                                    <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" />
                                </summary>
                                <div className="grid gap-5 px-5 pb-6 pt-2">
                                    <div className="min-w-0">
                                        <CodeBlock code={agentInstall(a).command} label={a.name} prompt={agentInstall(a).prompt} promptFirst />
                                        <p className="mt-2 text-xs leading-5 text-[#686b65] dark:text-slate-400">
                                            {a.promptOnly ?? (
                                                <>
                                                    Global folder <code className="font-mono">{a.global}</code>, project folder{" "}
                                                    <code className="font-mono">{a.project}</code> (add --project . to the command).
                                                    {a.extra ? ` ${a.extra}` : ""}
                                                </>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </details>
                        ))}
                        <details className="group">
                            <summary
                                className={cn(
                                    "flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-5 py-3 text-sm font-medium hover:bg-[#f4f4ef] dark:hover:bg-slate-800 [&::-webkit-details-marker]:hidden",
                                    focusRing
                                )}
                            >
                                <span className="flex items-center gap-3">
                                    <span aria-hidden="true" className="flex h-5 w-5 items-center justify-center rounded bg-[#e8e9e3] text-xs dark:bg-slate-700">+</span>
                                    Any other agent
                                </span>
                                <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" />
                            </summary>
                            <div className="grid gap-5 px-5 pb-6 pt-2">
                                <div className="min-w-0">
                                    <CodeBlock
                                        code={customCommand}
                                        label="any other agent"
                                        prompt={"Install RayStack for my agent: run `" + getSh + "` once, then `" + customCommand + "` with the folder my agent reads skills from, and tell me what it printed."}
                                        promptFirst
                                    />
                                    <p className="mt-2 text-xs leading-5 text-[#686b65] dark:text-slate-400">
                                        Replace the folder with the one your agent reads skills from.
                                    </p>
                                </div>
                            </div>
                        </details>
                    </div>
                </section>

                <section aria-labelledby="update" className="border-b border-[#dedfd8] dark:border-slate-800 py-14 sm:py-16">
                    <SectionHeading id="update" eyebrow="Update" title="Get the latest release" />
                    <div className="mt-6 min-w-0">
                        <CodeBlock code={updateCommand} label="update" prompt={updatePrompt} />
                        <p className="mt-2 text-xs leading-5 text-[#686b65] dark:text-slate-400">
                            Or type /raystack update in your agent. It pulls the latest release into ~/.raystack and
                            refreshes every global and project install made from it. Start a new agent session after.
                            Plugin installs update through the agent.
                        </p>
                    </div>
                </section>

                <section aria-labelledby="skills" className="border-b border-[#dedfd8] dark:border-slate-800 py-14 sm:py-16">
                    <SectionHeading id="skills" eyebrow="Skills" title="Thirty-one skills, three groups" />
                    <p className="mt-4 max-w-2xl text-sm leading-6 text-[#686b65] dark:text-slate-400">
                        <code className="font-mono">/raystack</code> is the front door, with two entry points behind it:{" "}
                        <code className="font-mono">/dev</code> for building and <code className="font-mono">/audit</code> for reviews. For build work it
                        hands off to <code className="font-mono">dev</code>, which picks the smallest track that
                        fits, from a quick bug fix to a full product. <code className="font-mono">/raystack project new</code>{" "}
                        starts a product with a short questionnaire, one question at a time, then research, PRD,
                        architecture, specs and a plan. <code className="font-mono">project update</code>,{" "}
                        <code className="font-mono">project review</code> and <code className="font-mono">project migrate</code>{" "}
                        work on an existing codebase. For reviews, <code className="font-mono">/audit</code> looks at the repo,
                        recommends reviews, and asks once which ones to run. Or say what you want, like{" "}
                        <code className="font-mono">/audit cqrs</code> or <code className="font-mono">/audit reliability</code>.{" "}
                        <code className="font-mono">/audit all</code> runs every review that fits and writes one ranked summary. You can also call any skill directly. Principles
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
                        <p>
                            The guard stays on for the rest of the session, so start a new session after a
                            review before you build or run tests. What it checks, read-only credentials for
                            each database and platform, and privacy are in{" "}
                            <a href={`${repoUrl}/blob/main/docs/safety.md`} className={cn("underline underline-offset-4", focusRing)}>
                                the safety doc
                            </a>.
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

                <section aria-labelledby="uninstall" className="border-b border-[#dedfd8] dark:border-slate-800 py-14 sm:py-16">
                    <SectionHeading id="uninstall" eyebrow="Uninstall" title="Remove RayStack" />
                    <div className="mt-6 min-w-0">
                        <CodeBlock code={uninstallCommand + "\nrm -rf ~/.raystack ~/.raystack-installs"} label="uninstall" prompt={uninstallPrompt} />
                        <p className="mt-2 text-xs leading-5 text-[#686b65] dark:text-slate-400">
                            Removes exactly the thirty-one RayStack skills from every agent it finds, then the checkout.
                            For a project install, run the first line with --project . in the repo instead.
                        </p>
                    </div>
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
