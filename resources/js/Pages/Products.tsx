import { Head, Link } from "@inertiajs/react"
import { ExternalLink } from "lucide-react"

const products = [
  {
    name: "Toolblip",
    url: "https://toolblip.com",
    tagline: "Website & brand monitoring",
    description:
      "Monitor your websites, APIs, and brand mentions in real time. Get instant alerts when something goes down, your SSL is about to expire, or your brand is mentioned online. Toolblip helps you stay on top of your digital presence without the noise.",
    benefits: [
      "Uptime monitoring with global checkpoints",
      "SSL certificate expiry alerts",
      "Brand mention tracking across the web",
      "Slack, email, and webhook notifications",
    ],
  },
  {
    name: "Ploy.cloud",
    url: "https://ploy.cloud",
    tagline: "Cloud platform engineering",
    description:
      "A curated platform for cloud engineers who want to ship faster. Ploy.cloud provides battle-tested Terraform modules, CI/CD templates, and architecture blueprints drawn from real production environments — not theoretical white papers.",
    benefits: [
      "Production-grade Terraform modules",
      "CI/CD pipeline templates for AWS",
      "Architecture decision records",
      "Cloud cost optimization playbooks",
    ],
  },
  {
    name: "Crontinel",
    url: "https://crontinel.com",
    tagline: "Cron job monitoring & alerts",
    description:
      "Never miss a scheduled task again. Crontinel monitors your cron jobs, scheduled tasks, and background workers so you know instantly when something fails, stalls, or runs longer than expected.",
    benefits: [
      "Heartbeat monitoring for any scheduled task",
      "Execution duration and anomaly tracking",
      "Multi-channel alerts (email, Slack, SMS)",
      "Historical run logs and uptime reporting",
    ],
  },
  {
    name: "Appnary",
    url: "https://appnary.com",
    tagline: "Directory of hand-picked apps",
    description:
      "A carefully curated directory of the best software tools and apps for developers, designers, and product teams. Every listing is hand-picked and reviewed so you spend less time searching and more time building.",
    benefits: [
      "Hand-picked tools across every category",
      "Honest reviews from real users",
      "Comparison guides and alternatives",
      "Weekly curated updates",
    ],
  },
  {
    name: "Amazing Plugins",
    url: "https://amazingplugins.com",
    tagline: "Premium Laravel plugins",
    description:
      "High-quality, well-documented Laravel plugins and packages built with modern PHP practices. From admin panels to API toolkits, each plugin is production-tested and maintained for the long haul.",
    benefits: [
      "Production-tested Laravel packages",
      "Comprehensive documentation",
      "Active maintenance and support",
      "Modern PHP 8.x standards",
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
          content="Products built by Harun R. Rayhan — Toolblip, Ploy.cloud, Crontinel, Appnary, and Amazing Plugins."
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
              Every product here solves a problem I ran into myself. Some are monitoring tools, some are
              directories, some are developer tooling. All of them are actively maintained.
            </p>
          </div>

          {/* Product cards */}
          <div className="space-y-8">
            {products.map((product) => (
              <div
                key={product.name}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-md sm:p-10"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-slate-900">{product.name}</h2>
                    <p className="mt-1 text-base font-medium text-amber-600">{product.tagline}</p>
                    <p className="mt-3 text-slate-600 leading-relaxed">{product.description}</p>

                    <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                      {product.benefits.map((benefit) => (
                        <li key={benefit} className="flex items-start gap-2 text-sm text-slate-600">
                          <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-4 border-t border-slate-100 pt-5">
                  <a
                    href={product.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 active:scale-[0.97]"
                  >
                    Visit {product.name}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
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
