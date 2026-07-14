import { Head, Link } from "@inertiajs/react"
import { ExternalLink, Link as LinkIcon } from "lucide-react"

const products = [
  {
    name: "Toolblip",
    url: "https://toolblip.com",
    tagline: "Free online developer tools",
    logo: "/images/products/toolblip.svg",
    logoBg: "bg-white",
    description:
      "A collection of 1,565 free developer tools that run entirely in your browser. JSON formatters, Base64 encoders, QR generators, word counters, SEO tools, and more. No signup, no tracking, no server round-trips - just paste and go. Privacy-first, nothing leaves your browser.",
    benefits: [
      "1,565 tools across 18 categories",
      "100% free, no signup required",
      "Runs in your browser - no data leaves your machine",
      "Privacy-first: no tracking, no uploads",
    ],
    extraLinks: [],
  },
  {
    name: "PloyCloud",
    url: "https://ploy.cloud",
    tagline: "Managed hosting for Laravel, WordPress, PHP, and Node.js",
    logo: "/images/products/ploycloud-icon.svg",
    logoBg: "bg-white",
    description:
      "Deploy Laravel, WordPress, PHP, and Node.js apps to AWS, Google Cloud, DigitalOcean, Vultr, or your own server in minutes. Docker-powered automation handles provisioning, SSL, security, database setup, and zero-downtime releases. Connect your code repository, pick your cloud provider, and deploy - no DevOps expertise required.",
    benefits: [
      "Deploy to AWS, GCP, DigitalOcean, Vultr, or custom servers",
      "Docker-powered automation with zero-downtime releases",
      "Automatic SSL, security, and database setup",
      "No markup on cloud costs - you pay your provider directly",
    ],
    extraLinks: [],
  },
  {
    name: "Crontinel",
    url: "https://crontinel.com",
    tagline: "Cron, queue, and background job monitoring",
    logo: "/images/products/crontinel.png",
    logoBg: "bg-white",
    description:
      "Open-source monitoring that goes beyond uptime pings. Crontinel hooks into your scheduler, queue driver, and agent runner to track job runs, queue depth, worker state, model latency, and agent tool calls. Detects silently failed cron jobs, crashed workers, and agent loops in under 60 seconds. No per-task wrapping required - one SDK hooks everything.",
    benefits: [
      "60-second detection of silent cron failures",
      "Per-worker status, queue depth, and failed job rate",
      "Zero per-task instrumentation - one SDK hooks in",
      "Open-source (MIT), self-host or use cloud",
    ],
    extraLinks: [
      { label: "GitHub", href: "https://github.com/crontinel/crontinel" },
      { label: "Laravel package", href: "https://github.com/crontinel/laravel" },
    ],
  },
  {
    name: "Appnary",
    url: "https://appnary.com",
    tagline: "Shopify apps for merchants",
    logo: "/images/products/appnary.svg",
    logoBg: "bg-white",
    description:
      "Launching soon on the Shopify App Store. Simple, affordable tools built for Shopify merchants, not enterprise teams. First app: Pixel Tracker for tracking ad performance and ROAS directly in your Shopify dashboard. More apps in development.",
    benefits: [
      "Pixel Tracker - ad performance and ROAS tracking",
      "Built for merchants, not enterprise teams",
      "Simple, transparent pricing",
      "More apps coming soon",
    ],
    extraLinks: [],
  },
  {
    name: "Amazing Plugins",
    url: "https://amazingplugins.com",
    tagline: "Free WooCommerce plugins",
    logo: "/images/products/amazingplugins.jpg",
    logoBg: "bg-white",
    description:
      "Small, sharp WooCommerce plugins built by a two-person studio. Each plugin solves one specific problem and gets out of the way. WooCommerce Accessibility Fixer fixes 10 common accessibility issues in one click. Stale Order Cleaner finds and deletes stale orders in bulk. All plugins are genuinely free - no product limits, no upgrade nagging, no hidden paywalls.",
    benefits: [
      "WooCommerce Accessibility Fixer - 10 a11y fixes in one click",
      "Stale Order Cleaner - bulk delete stale orders with dry-run preview",
      "Every plugin is genuinely free, no bait-and-switch",
      "Two-week release cadence with rollback on every plugin",
    ],
    extraLinks: [
      { label: "GitHub (Stale Order Cleaner)", href: "https://github.com/AmazingPlugins/stale-order-cleaner-for-woocommerce" },
      { label: "WordPress.org", href: "https://wordpress.org/plugins/woocommerce-accessibility-fixer/" },
    ],
  },
]

export default function Products() {
  return (
    <>
      <Head>
        <title>Products | Harun R. Rayhan</title>
        <meta
          name="description"
          content="Products built by Harun R. Rayhan - Toolblip, PloyCloud, Crontinel, Appnary, and Amazing Plugins."
        />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-16 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-slate-500">Products</p>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Tools I build and maintain
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
              Every product here solves a problem I ran into myself. Some are developer tools, some are
              monitoring infrastructure, some are e-commerce plugins. All of them are actively maintained.
            </p>
          </div>

          {/* Product cards */}
          <div className="space-y-8">
            {products.map((product) => (
              <div
                key={product.name}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-md sm:p-10"
              >
                <div className="flex items-start gap-5">
                  {/* Real logo */}
                  <div className={cn(
                    "flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-100",
                    product.logoBg
                  )}>
                    <img
                      src={product.logo}
                      alt={`${product.name} logo`}
                      className="h-10 w-10 object-contain"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold text-slate-900">{product.name}</h2>
                    <p className="mt-0.5 text-base font-medium text-amber-600">{product.tagline}</p>
                    <p className="mt-3 text-slate-600 leading-relaxed">{product.description}</p>

                    <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                      {product.benefits.map((benefit) => (
                        <li key={benefit} className="flex items-start gap-2 text-sm text-slate-600">
                          <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                          {benefit}
                        </li>
                      ))}
                    </ul>

                    <div className="mt-6 flex flex-wrap items-center gap-3">
                      <a
                        href={product.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 active:scale-[0.97]"
                      >
                        Visit {product.name}
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                      {product.extraLinks.map((link) => (
                        <a
                          key={link.label}
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                        >
                          <LinkIcon className="h-3.5 w-3.5" />
                          {link.label}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="mt-16 text-center">
            <p className="text-slate-500">
              Have questions about any of these products?{" "}
              <Link href="/contact" className="font-medium text-slate-900 underline underline-offset-2 hover:text-amber-600">
                Get in touch
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

// Helper for conditional classes
function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ")
}
