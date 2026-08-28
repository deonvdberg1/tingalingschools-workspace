// Seed Paystack plans for all 15 apps + 3 packages.
// Each plan carries a 7-day trial (start_date = now + 7 days).
// Run: node scripts/seed-paystack.js  (needs PAYSTACK_SECRET_KEY in dashboard-api/.env)
// Writes plan codes to dashboard-api/data/plan-codes.json

import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const API_DIR = path.join(__dirname, '..')
const PLANS_FILE = path.join(API_DIR, 'data', 'plan-codes.json')

// Load env
const env = fs.readFileSync(path.join(API_DIR, '.env'), 'utf8')
const keyMatch = env.match(/^PAYSTACK_SECRET_KEY=(.*)$/m)
const secret = keyMatch ? keyMatch[1].trim() : ''
if (!secret) {
  console.error('❌ PAYSTACK_SECRET_KEY not found in dashboard-api/.env')
  process.exit(1)
}

import { PRODUCTS, PACKAGES } from '../../storefront/src/data/products.js'

const BASE = 'https://api.paystack.co'
const headers = { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' }

async function api(path, method = 'GET', body = null) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok || json.status === false) throw new Error(`${method} ${path}: ${json.message || res.status}`)
  return json.data
}

const monthlyCents = (price) => parseInt(String(price).match(/\d+/)[0], 10) * 100
const trialStart = new Date(Date.now() + 7 * 86400000).toISOString()

const entries = [
  ...PRODUCTS.map((p) => ({ key: p.slug, name: p.name, amount: monthlyCents(p.price) })),
  ...PACKAGES.map((p) => ({ key: p.id, name: `${p.name} (package)`, amount: p.price * 100 }))
]

const results = {}
for (const e of entries) {
  try {
    // Try to find an existing plan first (idempotent)
    const existing = await api('/plan?perPage=200').catch(() => [])
    const found = existing.find((pl) => pl.name === e.name && pl.amount === e.amount && pl.currency === 'ZAR')
    let code
    if (found) {
      code = found.plan_code
      console.log(`= ${e.key} (${e.name}) already exists → ${code}`)
    } else {
      // NOTE: Paystack does NOT accept start_date on plan creation.
      // The 7-day trial is applied at checkout time (transaction/initialize
      // with plan + start_date) in paystack-routes.js.
      const created = await api('/plan', 'POST', {
        name: e.name,
        amount: e.amount,
        interval: 'monthly',
        currency: 'ZAR'
      })
      code = created.plan_code
      console.log(`✓ created ${e.key} (${e.name}) → ${code}`)
    }
    results[e.key] = code
  } catch (err) {
    console.error(`✗ ${e.key} (${e.name}): ${err.message}`)
  }
}

fs.writeFileSync(PLANS_FILE, JSON.stringify(results, null, 2))
console.log(`\nSaved ${Object.keys(results).length} plan codes → ${PLANS_FILE}`)
