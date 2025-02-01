import { createInertiaApp } from '@inertiajs/react'
import createServer from '@inertiajs/server'
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers'
import React from 'react'
import { renderToString } from 'react-dom/server'

const appName = import.meta.env.VITE_APP_NAME || 'Laravel'

createServer((page) => {
  return createInertiaApp({
    page,
    render: async ({ component, props }) => {
      const pages = import.meta.glob('./Pages/**/*.tsx', { eager: true })
      const resolvedComponent = await resolvePageComponent(
        `./Pages/${component}.tsx`,
        pages
      )

      // Add meta tags and SEO data
      const seoTags = {
        title: `${resolvedComponent.default.title || ''} | ${appName}`,
        meta: [
          {
            name: 'description',
            content: resolvedComponent.default.description || '',
          },
          {
            name: 'keywords',
            content: resolvedComponent.default.keywords || '',
          },
          {
            property: 'og:title',
            content: resolvedComponent.default.title || '',
          },
          {
            property: 'og:description',
            content: resolvedComponent.default.description || '',
          },
          {
            property: 'og:type',
            content: 'website',
          },
          {
            name: 'twitter:card',
            content: 'summary_large_image',
          },
          {
            name: 'twitter:title',
            content: resolvedComponent.default.title || '',
          },
          {
            name: 'twitter:description',
            content: resolvedComponent.default.description || '',
          },
        ],
      }

      const app = React.createElement(resolvedComponent.default, {
        ...props,
        seoTags,
      })

      const body = renderToString(app)

      return {
        head: [],
        body: body
      }
    },
  })
}) 