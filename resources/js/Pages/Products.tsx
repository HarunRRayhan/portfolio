import { useState } from "react"
import { Head, Link } from "@inertiajs/react"
import { ArrowUpRight, Check, Code2, Search, Terminal, X } from "lucide-react"
import { cn } from "@/lib/utils"

const categories = [
    "All products",
    "Cloud & AI",
    "Developer tools",
    "Commerce"
] as const
type Category = (typeof categories)[number]
type Product = {
    id: string
    name: string
    url: string
    category: Exclude<Category, "All products">
    tagline: string
    description: string
    logo: string
    backdrop: string
    extraLinks: { label: string; href: string }[]
}

const products: Product[] = [
    {
        id: "cloudploy",
        name: "CloudPloy",
        url: "https://cloudploy.com",
        category: "Cloud & AI",
        tagline: "Deploy from the AI tool you already use.",
        description:
            "Connect Claude Code, Cursor, or another MCP client to your cloud. Bring your own server or provision one, and let CloudPloy handle the deployment.",
        logo: "/images/products/cloudploy-icon.svg",
        backdrop: "bg-[#edf1ff]",
        extraLinks: []
    },
    {
        id: "skaleagents",
        name: "SkaleAgents",
        url: "https://skaleagents.com",
        category: "Cloud & AI",
        tagline: "Specialist agents for your next code review.",
        description:
            "Review code and infrastructure with AI DevOps agents. Run audits from your editor or the web app, then work through the findings with your team.",
        logo: "/images/products/skaleagents-icon.svg",
        backdrop: "bg-[#f0eafa]",
        extraLinks: []
    },
    {
        id: "toolblip",
        name: "Toolblip",
        url: "https://toolblip.com",
        category: "Developer tools",
        tagline: "Everyday tools, one browser tab away.",
        description:
            "Format JSON, encode Base64, generate QR codes, and get on with your work. Free browser-based utilities with no signup required.",
        logo: "/images/products/toolblip.svg",
        backdrop: "bg-[#e9f2ed]",
        extraLinks: []
    },
    {
        id: "crontinel",
        name: "Crontinel",
        url: "https://crontinel.com",
        category: "Developer tools",
        tagline: "Know when your background jobs go quiet.",
        description:
            "Monitor scheduled jobs, queues, workers, and AI agent runs. Open-source SDKs help you catch the failures an uptime check can miss.",
        logo: "/images/products/crontinel.png",
        backdrop: "bg-[#f6eee6]",
        extraLinks: [
            { label: "GitHub", href: "https://github.com/crontinel/crontinel" },
            {
                label: "Laravel package",
                href: "https://github.com/crontinel/laravel"
            }
        ]
    },
    {
        id: "appnary",
        name: "Appnary",
        url: "https://appnary.com",
        category: "Commerce",
        tagline: "Shopify apps built for the people running the store.",
        description:
            "Simple tools for Shopify merchants. Starting with Pixel Tracker for ad performance and ROAS, with more apps in development.",
        logo: "/images/products/appnary-icon.png",
        backdrop: "bg-[#eef0fb]",
        extraLinks: []
    },
    {
        id: "amazingplugins",
        name: "Amazing Plugins",
        url: "https://amazingplugins.com",
        category: "Commerce",
        tagline: "Small plugins that take a job off your list.",
        description:
            "Free WooCommerce plugins, each built to solve one specific problem. Fix accessibility issues or clean up stale orders without an upgrade pitch.",
        logo: "/images/products/amazingplugins.jpg",
        backdrop: "bg-[#f5f0df]",
        extraLinks: [
            {
                label: "GitHub (Stale Order Cleaner)",
                href: "https://github.com/AmazingPlugins/stale-order-cleaner-for-woocommerce"
            },
            {
                label: "WordPress.org",
                href: "https://wordpress.org/plugins/woocommerce-accessibility-fixer/"
            }
        ]
    }
]

const focusRing =
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-700"

// Decorative, static illustrations: product concepts, not live application data.
function ProductIllustration({ product }: { product: Product }) {
    return (
        <div
            aria-hidden="true"
            className={cn(
                "relative flex h-56 items-center justify-center overflow-hidden px-7 pt-10 sm:h-64 sm:px-10",
                product.backdrop
            )}
        >
            <span className="absolute left-6 top-5 text-xs font-medium text-slate-600">
                {product.category}
            </span>
            {product.id === "cloudploy" && (
                <div className="w-full max-w-[350px] -rotate-3 overflow-hidden rounded-lg border border-slate-300/60 bg-white shadow-[0_12px_35px_-15px_#64748b55]">
                    <div className="flex items-center gap-1.5 border-b border-slate-100 px-4 py-3">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#e5bba6]" />
                        <span className="h-1.5 w-1.5 rounded-full bg-[#e8d6a4]" />
                        <span className="h-1.5 w-1.5 rounded-full bg-[#bbcfb0]" />
                        <span className="ml-auto text-[10px] text-slate-400">
                            your next deployment
                        </span>
                        <Terminal className="ml-2 h-3 w-3 text-slate-400" />
                    </div>
                    <div className="space-y-3 p-4 font-mono text-[11px] text-slate-500">
                        <p>
                            <span className="text-indigo-500">❯</span> deploy
                            with cloudploy
                        </p>
                        <p className="flex items-center gap-2">
                            <Check className="h-3 w-3 text-emerald-700" />{" "}
                            Connected to your cloud
                        </p>
                        <div className="flex items-center justify-between rounded bg-[#edf4ef] px-3 py-2 text-emerald-800">
                            <span>Ready to deploy</span>
                            <ArrowUpRight className="h-3 w-3" />
                        </div>
                    </div>
                </div>
            )}
            {product.id === "skaleagents" && (
                <div className="relative flex w-full max-w-[350px] items-center gap-4">
                    <div className="flex h-20 w-20 shrink-0 -rotate-6 items-center justify-center rounded-2xl border border-purple-200/60 bg-white shadow-sm">
                        <img
                            src={product.logo}
                            alt=""
                            className="h-12 w-12 object-contain"
                        />
                    </div>
                    <div className="h-px w-5 shrink-0 bg-purple-300" />
                    <div className="flex-1 space-y-3 text-[11px] text-slate-600">
                        {[
                            "Code review",
                            "Infrastructure audit",
                            "Team findings"
                        ].map((label, index) => (
                            <div
                                key={label}
                                className={cn(
                                    "flex items-center gap-2 rounded-md border border-purple-200/60 bg-white/90 p-3 shadow-sm",
                                    index === 1 && "translate-x-2"
                                )}
                            >
                                <Check className="h-3 w-3 shrink-0 text-emerald-700" />
                                {label}
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {product.id === "toolblip" && (
                <div className="grid -rotate-6 grid-cols-3 gap-3">
                    {["{ }", "Aa", "#", "⇄", "</>", "QR"].map(
                        (symbol, index) => (
                            <div
                                key={symbol}
                                className={cn(
                                    "flex h-16 w-16 items-center justify-center rounded-xl border border-black/10 font-mono text-xl shadow-[0_6px_12px_-8px_#64748b55] sm:h-[72px] sm:w-[72px]",
                                    [
                                        "bg-white text-emerald-800",
                                        "bg-[#fcf7e9] text-amber-800",
                                        "bg-[#f0eafa] text-purple-800"
                                    ][index % 3]
                                )}
                            >
                                {symbol}
                            </div>
                        )
                    )}
                </div>
            )}
            {product.id === "crontinel" && (
                <div className="w-full max-w-[360px] -rotate-3 rounded-lg border border-[#dfd6cd] bg-[#fffdfa] p-4 shadow-[0_12px_35px_-15px_#64748b55]">
                    <div className="mb-3 flex items-center justify-between text-[10px] text-stone-500">
                        <span>Inside your application</span>
                        <span>Illustration</span>
                    </div>
                    {["Scheduled jobs", "Queue workers", "Agent runs"].map(
                        (label, row) => (
                            <div
                                key={label}
                                className="flex items-center gap-3 border-t border-stone-200/60 py-3"
                            >
                                <span className="w-[82px] shrink-0 text-[10px] text-stone-600">
                                    {label}
                                </span>
                                <div className="flex h-5 flex-1 items-center gap-1">
                                    {Array.from({ length: 16 }, (_, i) => (
                                        <span
                                            key={i}
                                            className={cn(
                                                "min-w-0 flex-1 rounded-[1px]",
                                                i % 5 === 0
                                                    ? "bg-[#c9ab85]"
                                                    : "bg-[#afbd98]"
                                            )}
                                            style={{
                                                height: `${35 + ((i * 17 + row * 13) % 65)}%`
                                            }}
                                        />
                                    ))}
                                </div>
                                <Check className="h-3 w-3 shrink-0 text-stone-500" />
                            </div>
                        )
                    )}
                </div>
            )}
            {product.id === "appnary" && (
                <div className="w-[270px] rotate-3 overflow-hidden rounded-xl border border-indigo-200/70 bg-white shadow-[0_12px_35px_-15px_#64748b55]">
                    <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
                        <img
                            src={product.logo}
                            alt=""
                            className="h-8 w-8 object-contain"
                        />
                        <span className="text-xs font-medium text-slate-700">
                            Made for Shopify
                        </span>
                    </div>
                    <div className="p-4">
                        <p className="text-[11px] text-slate-500">
                            Your next customer starts here.
                        </p>
                        <div className="mt-4 flex h-14 items-end gap-2">
                            {[25, 40, 32, 58, 48, 72, 85, 100].map(
                                (height, i) => (
                                    <div
                                        key={i}
                                        className="flex-1 rounded-t bg-indigo-200"
                                        style={{ height: `${height}%` }}
                                    />
                                )
                            )}
                        </div>
                        <p className="mt-3 text-[10px] text-indigo-700">
                            Pixel Tracker · Ad performance
                        </p>
                    </div>
                </div>
            )}
            {product.id === "amazingplugins" && (
                <div className="w-[290px] -rotate-3 rounded-xl border border-amber-200/70 bg-white p-4 shadow-[0_12px_35px_-15px_#64748b55]">
                    <div className="mb-3 flex items-center gap-3">
                        <img
                            src={product.logo}
                            alt=""
                            className="h-9 w-9 rounded-lg object-contain"
                        />
                        <span className="text-xs font-medium text-slate-700">
                            A little help for your store
                        </span>
                    </div>
                    {["Accessibility fixes", "Stale order cleanup"].map(
                        (label) => (
                            <div
                                key={label}
                                className="flex items-center justify-between border-t border-stone-100 py-3 text-[11px] text-stone-600"
                            >
                                <span>{label}</span>
                                <span className="flex h-4 w-7 items-center justify-end rounded-full bg-[#b4c6a0] p-0.5">
                                    <span className="h-3 w-3 rounded-full bg-white" />
                                </span>
                            </div>
                        )
                    )}
                </div>
            )}
        </div>
    )
}

export default function Products() {
    const [category, setCategory] = useState<Category>("All products")
    const [query, setQuery] = useState("")
    const search = query.trim().toLowerCase()
    const visibleProducts = products.filter(
        (product) =>
            (category === "All products" || product.category === category) &&
            `${product.name} ${product.category} ${product.tagline} ${product.description}`
                .toLowerCase()
                .includes(search)
    )

    function resetFilters() {
        setCategory("All products")
        setQuery("")
    }

    return (
        <>
            <Head>
                <title>Products | Harun R. Rayhan</title>
                <meta
                    name="description"
                    content="Products built by Harun R. Rayhan - CloudPloy, SkaleAgents, Toolblip, Crontinel, Appnary, and Amazing Plugins."
                />
            </Head>
            <div className="min-h-screen bg-[#fafaf8] text-[#242821]">
                <div className="mx-auto max-w-7xl px-5 pb-20 pt-28 sm:px-8 sm:pt-36 lg:px-12">
                    <header className="border-b border-[#dedfd8] pb-12 sm:pb-16">
                        <p className="mb-5 flex items-center gap-2.5 text-sm font-medium text-[#686b65]">
                            <span
                                className="h-2 w-2 bg-amber-600"
                                aria-hidden="true"
                            />
                            My products
                        </p>
                        <h1 className="max-w-4xl text-[2.75rem] font-semibold leading-[1.08] tracking-[-0.045em] sm:text-6xl lg:text-7xl">
                            Tools I build.
                            <br />
                            Problems I care about.
                        </h1>
                        <p className="mt-6 max-w-xl text-base leading-7 text-[#686b65] sm:text-lg sm:leading-8">
                            Cloud infrastructure, everyday developer tools, and
                            a little help running your store. These are the
                            products I build and maintain.
                        </p>
                    </header>

                    <section
                        aria-label="Product catalog"
                        className="pt-8 sm:pt-10"
                    >
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                            <div
                                role="group"
                                aria-label="Filter products by category"
                                className="flex flex-wrap gap-1.5"
                            >
                                {categories.map((item) => (
                                    <button
                                        key={item}
                                        type="button"
                                        aria-pressed={category === item}
                                        onClick={() => setCategory(item)}
                                        className={cn(
                                            "min-h-11 rounded-md px-3.5 py-2.5 text-sm transition-colors",
                                            focusRing,
                                            category === item
                                                ? "bg-[#242821] text-white"
                                                : "text-[#686b65] hover:bg-[#eeeee8] hover:text-[#242821]"
                                        )}
                                    >
                                        {item}
                                        {item === "All products" && (
                                            <span className="ml-2 text-xs opacity-70">
                                                {products.length}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                            <div className="relative w-full lg:w-64">
                                <label
                                    htmlFor="product-search"
                                    className="sr-only"
                                >
                                    Search products
                                </label>
                                <Search
                                    aria-hidden="true"
                                    className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-[#686b65]"
                                />
                                <input
                                    id="product-search"
                                    type="search"
                                    value={query}
                                    onChange={(event) =>
                                        setQuery(event.target.value)
                                    }
                                    placeholder="Find your next tool…"
                                    className={cn(
                                        "h-11 w-full appearance-none rounded-md border border-[#dedfd8] bg-transparent pl-10 pr-10 text-sm placeholder:text-[#686b65] [&::-webkit-search-cancel-button]:appearance-none",
                                        focusRing
                                    )}
                                />
                                {query && (
                                    <button
                                        type="button"
                                        aria-label="Clear search"
                                        onClick={() => setQuery("")}
                                        className={cn(
                                            "absolute right-0 top-0 flex h-11 w-10 items-center justify-center rounded text-[#686b65] hover:text-[#242821]",
                                            focusRing
                                        )}
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                        <p
                            role="status"
                            aria-live="polite"
                            aria-atomic="true"
                            className="mb-5 mt-5 text-xs text-[#686b65]"
                        >
                            {visibleProducts.length}{" "}
                            {visibleProducts.length === 1
                                ? "product"
                                : "products"}{" "}
                            shown
                        </p>

                        <div className="grid gap-6 md:grid-cols-2">
                            {visibleProducts.map((product) => (
                                <article
                                    key={product.id}
                                    aria-labelledby={`product-${product.id}`}
                                    className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-[#dedfd8] bg-[#fffefa]"
                                >
                                    <ProductIllustration product={product} />
                                    <div className="flex flex-1 flex-col p-6 sm:p-7">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={cn(
                                                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                                                    product.backdrop
                                                )}
                                            >
                                                <img
                                                    src={product.logo}
                                                    alt=""
                                                    width="28"
                                                    height="28"
                                                    loading="lazy"
                                                    className="h-7 w-7 object-contain"
                                                />
                                            </div>
                                            <h2
                                                id={`product-${product.id}`}
                                                className="text-xl font-semibold tracking-tight sm:text-2xl"
                                            >
                                                {product.name}
                                            </h2>
                                        </div>
                                        <p className="mt-5 text-sm font-medium leading-6">
                                            {product.tagline}
                                        </p>
                                        <p className="mb-6 mt-2 text-sm leading-6 text-[#686b65]">
                                            {product.description}
                                        </p>
                                        <div className="mt-auto">
                                            <a
                                                href={product.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                aria-label={`Explore ${product.name} (opens in a new tab)`}
                                                className={cn(
                                                    "flex min-h-12 items-center justify-between gap-3 border-t border-[#e8e9e1] pt-4 text-sm hover:text-amber-800",
                                                    focusRing
                                                )}
                                            >
                                                <span className="text-xs text-[#686b65]">
                                                    {product.url.replace(
                                                        "https://",
                                                        ""
                                                    )}
                                                </span>
                                                <span className="inline-flex items-center gap-2 font-medium">
                                                    Explore
                                                    <ArrowUpRight
                                                        aria-hidden="true"
                                                        className="h-4 w-4"
                                                    />
                                                </span>
                                            </a>
                                            {product.extraLinks.length > 0 && (
                                                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                                                    {product.extraLinks.map(
                                                        (link) => (
                                                            <a
                                                                key={link.href}
                                                                href={link.href}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className={cn(
                                                                    "inline-flex min-h-8 items-center gap-1 text-xs text-[#686b65] underline decoration-[#c6c8be] underline-offset-4 hover:text-amber-800",
                                                                    focusRing
                                                                )}
                                                            >
                                                                {link.label}
                                                                <ArrowUpRight
                                                                    aria-hidden="true"
                                                                    className="h-3 w-3"
                                                                />
                                                                <span className="sr-only">
                                                                    {" "}
                                                                    (opens in a
                                                                    new tab)
                                                                </span>
                                                            </a>
                                                        )
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                        {visibleProducts.length === 0 && (
                            <div className="rounded-xl border border-dashed border-[#cccec3] px-6 py-16 text-center">
                                <Search
                                    aria-hidden="true"
                                    className="mx-auto mb-4 h-6 w-6 text-[#686b65]"
                                />
                                <h2 className="text-xl font-semibold">
                                    No products found
                                </h2>
                                <p className="mt-2 text-sm text-[#686b65]">
                                    Try another search or category.
                                </p>
                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    className={cn(
                                        "mt-6 min-h-11 rounded-md bg-[#242821] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#42483c]",
                                        focusRing
                                    )}
                                >
                                    Reset filters
                                </button>
                            </div>
                        )}
                    </section>

                    <div className="mt-10 flex items-center gap-3 text-xs text-[#686b65]">
                        <Code2 aria-hidden="true" className="h-4 w-4" />
                        <p>Built by me. Always a work in progress.</p>
                    </div>
                    <section
                        aria-labelledby="products-contact"
                        className="mt-16 flex flex-col items-start justify-between gap-6 border-t border-[#dedfd8] pt-10 sm:mt-20 sm:flex-row sm:items-center sm:pt-12"
                    >
                        <div>
                            <h2
                                id="products-contact"
                                className="text-2xl font-semibold tracking-tight sm:text-3xl"
                            >
                                Have something in mind?
                            </h2>
                            <p className="mt-3 max-w-lg text-sm leading-6 text-[#686b65]">
                                A question about a product, some feedback, or an
                                idea for something useful. I’d like to hear it.
                            </p>
                        </div>
                        <Link
                            href="/contact"
                            className={cn(
                                "inline-flex min-h-12 shrink-0 items-center gap-5 rounded-md bg-[#242821] px-6 py-3 text-sm font-medium text-white hover:bg-[#42483c]",
                                focusRing
                            )}
                        >
                            Get in touch
                            <ArrowUpRight
                                aria-hidden="true"
                                className="h-4 w-4"
                            />
                        </Link>
                    </section>
                </div>
            </div>
        </>
    )
}
