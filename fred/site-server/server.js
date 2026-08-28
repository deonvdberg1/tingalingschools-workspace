// AutoEffortless unified site server
// Serves: marketing site (fred/website) at /, app store SPA (fred/storefront/dist) at /apps
import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = 8092
const WEBSITE_DIR = path.join(__dirname, '..', 'website')
const STORE_DIST = path.join(__dirname, '..', 'storefront', 'dist')

const app = express()
app.disable('x-powered-by')

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
