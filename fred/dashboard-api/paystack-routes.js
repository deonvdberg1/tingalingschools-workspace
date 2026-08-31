// ── Paystack Checkout & Provisioning Routes ──
// Handles storefront purchases: single-use, subscription (with 7-day trial), and packages.
// Flow: POST /api/checkout → Paystack authorize_url → customer pays →
//       webhook charge.success → auto-create account → email login → entitlements

import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { execFile } from 'child_process'
import { promisify } from 'util'

const execFileP = promisify(execFile)
const PAYSTACK_BASE = 'https://api.paystack.co'
const PLANS_FILE = path.join(process.cwd(), 'data', 'plan-codes.json')

// ── Snowman store orders (log-only, no account provisioning) ──
const SNOWMAN_ORDERS_FILE = path.join(process.cwd(), 'data', 'snowman-orders.json')
function loadSnowmanOrders() {
  try { return JSON.parse(fs.readFileSync(SNOWMAN_ORDERS_FILE, 'utf8')) } catch { return [] }
}
function saveSnowmanOrder(order) {
  const orders = loadSnowmanOrders()
  if (orders.some((o) => o.reference === order.reference)) return false
  orders.push(order)
  try { fs.writeFileSync(SNOWMAN_ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf8') } catch (e) { console.error('[Snowman] order save error:', e.message) }
  notifySnowmanOrder(order)
  return true
}

// ── Email notifications for Snowman orders (buyer confirmation + business alert) ──
function notifySnowmanOrder(order) {
  const lines = (order.items || []).map((i) => `• ${i.name} x${i.qty} — R${(Number(i.price) || 0).toFixed(2)}`).join('\n')
  const total = `R${Number(order.amount || 0).toFixed(2)}`
  const deliveryLine = order.delivery === 'delivery'
    ? `Delivery to:\n${order.address || '—'}\n${order.delivery_details ? 'Details: ' + order.delivery_details + '\n' : ''}`
    : 'Pickup in store'
  const common = `Order: ${order.reference}\n\n${lines}\n\nTotal: ${total}\n${deliveryLine}\n\n— Snowman Water & Ice (autoeffortless.com shop)`
  // Business alert
  sendEmail('info@snowmankzn.co.za', `🧊 New online order ${order.reference} — ${total}`, `New order received!\n\nCustomer: ${order.name || '—'} (${order.phone || 'no phone'})\nEmail: ${order.email || '—'}\n\n${common}`)
  // Buyer confirmation
  if (order.email) {
    sendEmail(order.email, `Thank you for your order — Snowman Water & Ice 🧊`, `Hi ${order.name || 'there'},\n\nThank you for shopping with Snowman Water & Ice. We've received your order and will confirm delivery/pickup shortly.\n\n${common}`)
  }
}

// Products & packages catalogue (single source: storefront data)
import { PRODUCTS, PACKAGES, SINGLE_USE_PRICES } from '../storefront/src/data/products.js'

// ── Plan-code registry (slug/packageId → Paystack plan_code) ──
function loadPlanCodes() {
  try {
    return JSON.parse(fs.readFileSync(PLANS_FILE, 'utf8'))
  } catch {
    return {}
  }
}
function planCodeFor(key) {
  return loadPlanCodes()[key] || null
}
function planKeyFor(code) {
  const codes = loadPlanCodes()
  for (const [key, c] of Object.entries(codes)) if (c === code) return key
  return null
}

function getSecret() {
  return process.env.PAYSTACK_SECRET_KEY || ''
}

function paystackHeaders() {
  return { Authorization: `Bearer ${getSecret()}`, 'Content-Type': 'application/json' }
}

async function paystack(path, method = 'GET', body = null) {
  const res = await fetch(`${PAYSTACK_BASE}${path}`, {
    method,
    headers: paystackHeaders(),
    body: body ? JSON.stringify(body) : undefined
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok || json.status === false) {
    throw new Error(`Paystack ${method} ${path}: ${json.message || `HTTP ${res.status}`}`)
  }
  return json.data
}

// ── Catalogue helpers ──
const productBySlug = (slug) => PRODUCTS.find((p) => p.slug === slug)
const packageById = (id) => PACKAGES.find((p) => p.id === id)

// Monthly price in cents from the display price (e.g. "R99–R199/mo" → 9900)
function monthlyCents(product) {
  const m = String(product.price).match(/(\d+)/)
  return m ? parseInt(m[1], 10) * 100 : 0
}

function singleUseCents(slug) {
  const m = String(SINGLE_USE_PRICES[slug] || '0').match(/(\d+)/)
  return m ? parseInt(m[1], 10) * 100 : 0
}

function packageCents(pkg) {
  return pkg.price * 100
}

// ── Email via gog CLI (Gmail, info@autoeffortless.com) ──
async function sendEmail(to, subject, body) {
  try {
    // Explicit account — gog has multiple stored tokens and needs --account
    await execFileP('/opt/homebrew/bin/gog', ['gmail', 'send', '--account', 'info@autoeffortless.com', '--to', to, '--subject', subject, '--body', body], { timeout: 30000 })
    return true
  } catch (e) {
    console.warn('[Paystack] email failed:', e.message)
    return false
  }
}

// ── Provision an account + entitlement after successful payment ──
async function provisionPurchase({ query, run, saveDb }, { email, name, productKey, kind, providerRef, amountCents }) {
  // 1. Ensure user exists (auto-create with generated password)
  let user = query('SELECT * FROM users WHERE email = ?', [email])[0]
  let isNewUser = false
  if (!user) {
    const password = crypto.randomBytes(6).toString('base64url').slice(0, 10)
    const plainPassword = password // email gets the plaintext
    // Auth compares SHA-256 hashes — store the hash, email the plaintext
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex')
    run('INSERT INTO users (email, password, name, role, client_id) VALUES (?, ?, ?, ?, NULL)', [email, passwordHash, name || email.split('@')[0], 'client_admin'])
    user = query('SELECT * FROM users WHERE email = ?', [email])[0]
    isNewUser = true
    // Persist immediately so the account survives restart
    if (saveDb) saveDb()
    // Keep the plaintext for the welcome email (user.password is now the hash)
    user = { ...user, plainPassword }
  }

  // 2. Record the purchase / entitlement
  const expires = kind === 'single' ? new Date(Date.now() + 30 * 86400000).toISOString() : null
  run(
    `INSERT INTO purchases (email, user_id, product_key, kind, status, provider, provider_ref, amount_cents, expires_at)
     VALUES (?, ?, ?, ?, 'active', 'paystack', ?, ?, ?)`,
    [email, user.id, productKey, kind, providerRef, amountCents, expires]
  )
  if (saveDb) saveDb()

  // 3. Welcome email with login details for new users
  if (isNewUser) {
    const productLabel = productKey.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    const body = [
      `Hi ${user.name},`,
      '',
      `Welcome to AutoEffortless! 🎉 Your ${productLabel} is active and ready to use.`,
      '',
      'Your apps live in one place — sign in to open them:',
      'https://app.autoeffortless.com/my-apps',
      '',
      'Your login details:',
      `Email: ${email}`,
      `Password: ${user.plainPassword}`,
      '',
      'You can change your password after logging in.',
      '',
      'Questions? Just reply to this email — we reply fast.',
      '',
      '— The AutoEffortless Team'
    ].join('\n')
    await sendEmail(email, `Welcome to AutoEffortless — your ${productLabel} is active 🎉`, body)
  } else {
    const productLabel = productKey.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    await sendEmail(email, `Your ${productLabel} purchase is active ✅`, `Hi ${user.name},\n\nYour ${productLabel} is active. Open it anytime at https://app.autoeffortless.com/my-apps\n\n— The AutoEffortless Team`)
  }

  return { user, isNewUser }
}

export default function setupPaystackRoutes(app, { query, run, saveDb }) {

  // ── Ensure purchases table exists (lazy — db initialises after route setup) ──
  let tableChecked = false
  function ensureTable() {
    if (tableChecked) return
    run(`CREATE TABLE IF NOT EXISTS purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      user_id INTEGER,
      product_key TEXT NOT NULL,
      kind TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      provider TEXT DEFAULT 'paystack',
      provider_ref TEXT,
      amount_cents INTEGER,
      starts_at TEXT,
      expires_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )`)
    if (saveDb) saveDb()
    tableChecked = true
  }

  // ── Create a checkout session ──
  app.post('/api/checkout', async (req, res) => {
    try {
      ensureTable()
      const { product, pkg, mode, email, name } = req.body || {}
      if (!getSecret()) return res.status(503).json({ error: 'Paystack not configured yet' })
      if (!email) return res.status(400).json({ error: 'email is required' })

      let metadata, amountCents, planCode

      if (pkg) {
        const p = packageById(pkg)
        if (!p) return res.status(400).json({ error: 'unknown package' })
        amountCents = packageCents(p)
        metadata = { kind: 'subscription', productKey: p.id, packageName: p.name }
        planCode = planCodeFor(p.id)
      } else {
        const prod = productBySlug(product)
        if (!prod) return res.status(400).json({ error: 'unknown product' })
        metadata = { kind: mode === 'single' ? 'single' : 'subscription', productKey: prod.slug, productName: prod.name }
        if (mode === 'single') {
          amountCents = singleUseCents(prod.slug)
        } else {
          amountCents = monthlyCents(prod)
          planCode = planCodeFor(prod.slug)
        }
      }

      const initBody = {
        email,
        amount: amountCents,
        currency: 'ZAR',
        metadata,
        callback_url: 'https://autoeffortless.com/apps/thanks',
        channels: ['card']
      }
      if (name) initBody.metadata.customerName = name
      if (planCode) {
        // Subscription via plan → Paystack creates the subscription on success
        initBody.plan = planCode
        // 7-day free trial: first charge scheduled 7 days out (start_date is a
        // valid /transaction/initialize param for scheduled/trial payments)
        initBody.start_date = new Date(Date.now() + 7 * 86400000).toISOString()
        delete initBody.amount
      }

      const data = await paystack('/transaction/initialize', 'POST', initBody)
      res.json({ authorization_url: data.authorization_url, reference: data.reference })
    } catch (e) {
      console.error('[Paystack] checkout error:', e.message)
      res.status(500).json({ error: e.message })
    }
  })

  // ── Paystack webhook (raw body required for signature verification) ──
  app.post('/api/paystack/webhook', async (req, res) => {
    try {
      const signature = req.headers['x-paystack-signature']
      const secret = getSecret()
      if (!secret) return res.status(503).json({ error: 'Paystack not configured' })
      const hash = crypto.createHmac('sha512', secret).update(req.body).digest('hex')
      if (signature !== hash) return res.status(401).json({ error: 'invalid signature' })

      const event = JSON.parse(req.body.toString('utf8'))
      console.log('[Paystack] webhook event:', event.event)

      // Provision idempotently: one active purchase per (email, product_key)
      const handleProvision = async (kind, ref) => {
        const email = event.data.customer?.email
        if (!email) return
        const meta = event.data.metadata || {}
        let productKey = meta.productKey || planKeyFor(event.data.plan?.plan_code || '') || 'unknown'
        const existing = query('SELECT id FROM purchases WHERE email = ? AND product_key = ? AND status = ?', [email, productKey, 'active'])
        if (existing.length) return // already provisioned
        await provisionPurchase({ query, run, saveDb }, {
          email,
          name: meta.customerName,
          productKey,
          kind,
          providerRef: ref,
          amountCents: event.data.amount || 0
        })
      }

      if (event.event === 'subscription.create') {
        // Trial start: user authorised card at checkout, first charge in 7 days
        await handleProvision('subscription', `sub:${event.data.subscription_code || 'unknown'}`)
      } else if (event.event === 'charge.success') {
        if (event.data.metadata?.source === 'snowman') {
          // Snowman store order — log only (no AutoEffortless account/purchase provisioning)
          const meta = event.data.metadata || {}
          let items = []
          try { items = JSON.parse(meta.items_json || '[]') } catch {}
          saveSnowmanOrder({
            reference: event.data.reference,
            email: event.data.customer?.email,
            name: meta.customer_name || '',
            phone: meta.customer_phone || '',
            delivery: meta.delivery || '',
            address: meta.address || '',
            delivery_details: meta.delivery_details || '',
            items,
            amount: (event.data.amount || 0) / 100,
            currency: event.data.currency || 'ZAR',
            date: new Date().toISOString(),
          })
        } else {
          // Single purchases, or first subscription charge (trial ended)
          const kind = event.data.metadata?.kind === 'single' ? 'single' : 'subscription'
          await handleProvision(kind, event.data.reference)
        }
      } else if (event.event === 'subscription.disable' || event.event === 'subscription.cancel') {
        const email = event.data.customer?.email
        if (email) {
          run(`UPDATE purchases SET status = 'cancelled' WHERE email = ? AND status = 'active'`, [email])
          if (saveDb) saveDb()
        }
      }

      res.json({ received: true })
    } catch (e) {
      console.error('[Paystack] webhook error:', e.message)
      res.status(500).json({ error: e.message })
    }
  })

  // ── List Paystack plans (admin/debug) ──
  app.get('/api/checkout/plans', async (req, res) => {
    try {
      if (!getSecret()) return res.status(503).json({ error: 'Paystack not configured yet' })
      const plans = await paystack('/plan?perPage=100')
      res.json(plans)
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  })

  // ── Snowman store: initialize checkout (custom amount, no plan) ──
  app.post('/api/snowman/checkout', async (req, res) => {
    try {
      const { email, name, phone, delivery, address, delivery_details, amount_cents, items } = req.body || {}
      if (!email || !amount_cents || amount_cents < 100) {
        return res.status(400).json({ error: 'email and amount_cents (>= 100) are required' })
      }
      if (!getSecret()) return res.status(503).json({ error: 'Paystack not configured' })
      const tx = await paystack('/transaction/initialize', 'POST', {
        email: String(email).trim(),
        amount: Math.round(amount_cents),
        metadata: {
          source: 'snowman',
          customer_name: String(name || '').slice(0, 100),
          customer_phone: String(phone || '').slice(0, 30),
          delivery: String(delivery || 'pickup'),
          address: String(address || '').slice(0, 200),
          delivery_details: String(delivery_details || '').slice(0, 300),
          items_json: JSON.stringify(Array.isArray(items) ? items : []),
        },
        callback_url: 'https://snowman-v2.autoeffortless.com/checkout.html',
        channels: ['card'],
      })
      res.json({ authorization_url: tx.authorization_url, reference: tx.reference })
    } catch (e) {
      console.error('[Snowman checkout] error:', e.message)
      res.status(502).json({ error: e.message })
    }
  })

  // ── Snowman store: verify + fetch order after payment ──
  app.get('/api/snowman/order', async (req, res) => {
    try {
      const ref = String(req.query.reference || '').trim()
      if (!ref) return res.status(400).json({ error: 'reference required' })
      const orders = loadSnowmanOrders()
      const order = orders.find((o) => o.reference === ref)
      if (order) return res.json({ status: 'success', order })
      if (!getSecret()) return res.json({ status: 'pending' })
      try {
        const data = await paystack(`/transaction/verify/${encodeURIComponent(ref)}`)
        if (data.status === 'success') {
          const meta = data.metadata || {}
          let items = []
          try { items = JSON.parse(meta.items_json || '[]') } catch {}
          const o = {
            reference: ref,
            email: data.customer?.email || '',
            name: meta.customer_name || '',
            phone: meta.customer_phone || '',
            delivery: meta.delivery || '',
            address: meta.address || '',
            delivery_details: meta.delivery_details || '',
            items,
            amount: (data.amount || 0) / 100,
            currency: data.currency || 'ZAR',
            date: new Date().toISOString(),
          }
          saveSnowmanOrder(o)
          return res.json({ status: 'success', order: o })
        }
        return res.json({ status: data.status || 'pending' })
      } catch (e) {
        return res.json({ status: 'pending' })
      }
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  })

  return {}
}
