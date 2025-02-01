import { createInertiaApp } from '@inertiajs/react'
import createServer from '@inertiajs/server'
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers'
import { createRoot } from 'react-dom/client'
import route from 'ziggy-js'

const appName = import.meta.env.VITE_APP_NAME || 'Laravel'

createServer((page) =>
  createInertiaApp({
    page,
    render: async (page) => {
      const pages = import.meta.glob('./Pages/**/*.tsx', { eager: true })
      const componentModule = await resolvePageComponent(
        `./Pages/${page.component}.tsx`,
        pages
      )
      const component = componentModule.default

      // Add meta tags and SEO data
      const seoTags = {
        title: `${component.title || page.props.title || ''} | ${appName}`,
        meta: [
          {
            name: 'description',
            content: component.description || page.props.description || '',
          },
          {
            name: 'keywords',
            content: component.keywords || page.props.keywords || '',
          },
          {
            property: 'og:title',
            content: component.title || page.props.title || '',
          },
          {
            property: 'og:description',
            content: component.description || page.props.description || '',
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
            content: component.title || page.props.title || '',
          },
          {
            name: 'twitter:description',
            content: component.description || page.props.description || '',
          },
        ],
      }

      return createInertiaApp({
        title: (title) => `${title} | ${appName}`,
        resolve: (name) => resolvePageComponent(`./Pages/${name}.tsx`, pages),
        setup: ({ el, App, props }) => {
          const root = createRoot(el)
          return root.render(<App {...props} />)
        },
        page: {
          ...page,
          props: {
            ...page.props,
            seoTags,
          },
        },
      })
    },
  })
) 