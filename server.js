import path from 'path'
import { fileURLToPath } from 'url'
import express from 'express'
import { createServer as createViteServer } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function createServer() {
  const app = express()

  // Create Vite server in middleware mode
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'custom',
    base: '/'
  })

  // Use vite's connect instance as middleware
  app.use(vite.middlewares)

  app.use('*', async (req, res) => {
    const url = req.originalUrl

    try {
      // Load the server entry module
      const { render } = await vite.ssrLoadModule('/resources/js/ssr.tsx')
      
      // Render the app
      const rendered = await render(url)
      
      // Send the rendered HTML
      res.status(200).set({ 'Content-Type': 'text/html' }).end(rendered)
    } catch (e) {
      vite.ssrFixStacktrace(e)
      console.error(e)
      res.status(500).end(e.message)
    }
  })

  app.listen(3000, () => {
    console.log('Server running at http://localhost:3000')
  })
}

createServer() 