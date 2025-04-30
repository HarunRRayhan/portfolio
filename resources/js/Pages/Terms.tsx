import { Head } from '@inertiajs/react'
import { motion } from 'framer-motion'
import { Menubar } from '@/Components/Menubar'
import { Footer } from '@/Components/Footer'
import { Container } from '@/Components/ui/container'
import { ScrollText } from 'lucide-react'

export default function Terms() {
  return (
    <>
      <Head>
        <title>Terms of Service | Harun's Portfolio</title>
        <meta name="description" content="Terms of service and conditions for using Harun's Portfolio website and services." />
        <meta name="keywords" content="terms of service, legal, conditions, portfolio" />
        
        {/* OpenGraph Tags */}
        <meta property="og:title" content="Terms of Service | Harun's Portfolio" />
        <meta property="og:description" content="Terms of service and conditions for using Harun's Portfolio website and services." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={window.location.href} />
        
        {/* Twitter Card Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Terms of Service | Harun's Portfolio" />
        <meta name="twitter:description" content="Terms of service and conditions for using Harun's Portfolio website and services." />
        
        {/* Canonical URL */}
        <link rel="canonical" href={window.location.href} />

        {/* JSON-LD Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Terms of Service",
            "description": "Terms of service and conditions for using Harun's Portfolio website and services.",
            "publisher": {
              "@type": "Person",
              "name": "Harun"
            }
          })}
        </script>
      </Head>
      <main className="flex flex-col min-h-screen">
        <Menubar />
        <section className="py-24 bg-gradient-to-br from-[#86D2F1] via-[#7C3AED] to-[#8B5CF6]">
          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="w-16 h-16 rounded-lg bg-white/10 flex items-center justify-center mx-auto mb-6"
            >
              <ScrollText className="w-8 h-8 text-white" />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl md:text-5xl font-bold text-white mb-6"
            >
              Terms of Service
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xl text-white/90 max-w-3xl mx-auto"
            >
              Please read these terms carefully before using our services.
            </motion.p>
          </div>
        </section>

        <section className="py-24 bg-white">
          <Container>
            <div className="max-w-3xl mx-auto prose prose-lg">
              <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

              <h2>1. Introduction</h2>
              <p>
                Welcome to Harun's Portfolio. By accessing and using this website, you agree to be bound by these Terms of Service.
                These terms apply to all visitors, users, and others who access or use the Service.
              </p>

              <h2>2. Use of Website</h2>
              <p>
                This website is for informational purposes only. You may not use this website for any illegal or unauthorized purpose.
                You agree not to:
              </p>
              <ul>
                <li>Use the website in any way that violates any applicable laws or regulations</li>
                <li>Attempt to gain unauthorized access to any portion of the website</li>
                <li>Interfere with or disrupt the website or servers connected to the website</li>
                <li>Use the website to transmit any harmful code or material</li>
              </ul>

              <h2>3. Intellectual Property</h2>
              <p>
                All content on this website, including but not limited to text, graphics, logos, images, audio clips, digital downloads,
                data compilations, and software, is the property of Harun or its content suppliers and is protected by international
                copyright laws.
              </p>

              <h2>4. Limitation of Liability</h2>
              <p>
                In no event shall Harun, nor any of its officers, directors, and employees, be liable to you for anything arising out of
                or in any way connected with your use of this website, whether such liability is under contract, tort, or otherwise.
              </p>

              <h2>5. Changes to Terms</h2>
              <p>
                We reserve the right to modify these terms at any time. We will notify users of any material changes by posting the new
                Terms of Service on this page. Your continued use of the website after any such changes constitutes your acceptance of
                the new Terms of Service.
              </p>

              <h2>6. Contact</h2>
              <p>
                If you have any questions about these Terms, please contact us at:
                <br />
                Email: <a href="mailto:me@harun.dev" className="text-primary hover:underline">me@harun.dev</a>
              </p>
            </div>
          </Container>
        </section>

        <Footer />
      </main>
    </>
  )
} 