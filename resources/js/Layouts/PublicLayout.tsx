import React, { PropsWithChildren } from 'react'
import { Menubar } from '@/Components/Menubar'
import { Footer } from '@/Components/Footer'
import { ErrorBoundary } from '@/Components/ErrorBoundary'
import { ServicePageCaseStudies } from '@/Components/ServicePageCaseStudies'
import { SeoHead } from '@/Components/SeoHead'

interface PublicLayoutProps {
  /** Override the default slate-50 background. Pages with custom gradients pass their own. */
  background?: string
  /** Hide footer on pages like Bio */
  hideFooter?: boolean
}

export default function PublicLayout({
  children,
  background = 'bg-slate-50',
  hideFooter = false,
}: PropsWithChildren<PublicLayoutProps>) {
  return (
    <div className={`min-h-screen ${background} font-sans text-slate-900`}>
      <SeoHead />
      <ErrorBoundary>
        <Menubar />
      </ErrorBoundary>
      <main>
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
      <ErrorBoundary>
        <ServicePageCaseStudies />
      </ErrorBoundary>
      {!hideFooter && (
        <ErrorBoundary>
          <Footer />
        </ErrorBoundary>
      )}
    </div>
  )
}
