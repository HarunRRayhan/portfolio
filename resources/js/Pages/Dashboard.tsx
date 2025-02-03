import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function Dashboard() {
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Dashboard
                </h2>
            }
        >
            <Head>
                <title>Dashboard | Harun R. Rayhan - Cloud & DevOps Services</title>
                <meta name="description" content="Access your personal dashboard to manage your cloud and DevOps services, view project status, and track consultations." />
                <meta name="keywords" content="dashboard, client portal, cloud services management, DevOps projects" />
                
                {/* OpenGraph Tags */}
                <meta property="og:title" content="Dashboard | Harun R. Rayhan - Cloud & DevOps Services" />
                <meta property="og:description" content="Access your personal dashboard to manage your cloud and DevOps services, view project status, and track consultations." />
                <meta property="og:type" content="website" />
                <meta property="og:url" content={window.location.href} />
                
                {/* Twitter Card Tags */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="Dashboard | Harun R. Rayhan - Cloud & DevOps Services" />
                <meta name="twitter:description" content="Access your personal dashboard to manage your cloud and DevOps services, view project status, and track consultations." />
                
                {/* Canonical URL */}
                <link rel="canonical" href={window.location.href} />

                {/* JSON-LD Structured Data */}
                <script type="application/ld+json">
                    {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "WebPage",
                        "name": "Client Dashboard - Harun R. Rayhan",
                        "description": "Personal dashboard for managing cloud and DevOps services",
                        "isAccessibleForFree": false,
                        "breadcrumb": {
                            "@type": "BreadcrumbList",
                            "itemListElement": [{
                                "@type": "ListItem",
                                "position": 1,
                                "name": "Dashboard",
                                "item": window.location.href
                            }]
                        }
                    })}
                </script>
            </Head>

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            You're logged in!
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
