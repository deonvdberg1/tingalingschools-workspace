// AutoEffortless unified site server
// Serves: marketing site (fred/website) at /, app store SPA (fred/storefront/dist) at /apps
// store.autoeffortless.com → store SPA at root; all other hosts → marketing site at /
import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = 8092
const WEBSITE_DIR = path.join(__dirname, '..', 'website')
const STORE_DIST = path.join(__dirname, '..', 'storefront', 'dist')
const STORE_HOSTS = new Set(['store.autoeffortless.com'])

const app = express()
app.disable('x-powered-by')

// Host-based routing: store host gets the store SPA at root
app.use((req, res, next) => {
  const host = (req.headers.host || '').split(':')[0].toLowerCase()
  if (STORE_HOSTS.has(host) && !req.path.startsWith('/apps')) {
    // Store SPA at root (SPA fallback for client-side routes)
    if (req.path === '/' || !req.path.includes('.')) {
      return res.sendFile(path.join(STORE_DIST, 'index.html'))
    }
    return express.static(STORE_DIST)(req, res, next)
  }
  next()
})

// 1. Marketing site (static, served at root)
app.use(express.static(WEBSITE_DIR))

// 2. App store SPA under /apps
app.use('/apps', express.static(STORE_DIST))
app.get('/apps/*', (req, res) => {
  res.sendFile(path.join(STORE_DIST, 'index.html'))
})

// 3. Fallback: unknown paths on the marketing site
app.use((req, res) => {
  res.status(404).send('Not found')
})

app.listen(PORT, '127.0.0.1', () => {
  console.log(`[site-server] AutoEffortless unified site on http://127.0.0.1:${PORT}`)
})
