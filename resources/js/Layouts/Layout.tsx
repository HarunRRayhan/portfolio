import React from 'react'
import { Head } from '@inertiajs/react'
import { Menubar } from '@/Components/Menubar'
import { Footer } from '@/Components/Footer'

interface LayoutProps {
  children: React.ReactNode
  title?: string
  description?: string
  keywords?: string
  ogImage?: string
}

export default function Layout({
  children,
  title,
  description,
  keywords,
  ogImage,
}: LayoutProps) {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="keywords" content={keywords} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={ogImage} />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={ogImage} />
      </Head>

      <div className="min-h-screen bg-white">
        <Menubar />
        <main>{children}</main>
        <Footer />
      </div>
    </>
  )
} 