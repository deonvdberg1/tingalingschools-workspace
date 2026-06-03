// ── Billing & Subscriptions Routes ──
// Manages pricing tiers, subscriptions, invoices, and usage metering
// Stripe integration is optional — works fully offline with manual billing

import Stripe from 'stripe';

let stripe = null;

export default function setupBillingRoutes(app, { query, run, saveDb }) {
  
  // ── Initialise Stripe (gracefully handles missing keys) ──
  function initStripe() {
    if (!stripe && process.env.STRIPE_SECRET_KEY) {
      try {
        stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        console.log('[Billing] Stripe initialised');
      } catch (e) {
        console.warn('[Billing] Stripe init failed:', e.message);
      }
    }
    return stripe;
  }

  // ── Helper: generate invoice number ──
  function generateInvoiceNumber() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = query('SELECT COUNT(*) as c FROM invoices')[0].c + 1;
    return `AE-${date}-${String(count).padStart(4, '0')}`;
  }

  // ── Helper: calculate usage for a client this month ──
  function getMonthlyUsage(clientId) {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const startStr = monthStart.toISOString().slice(0, 10);
    
    const messages = query(
      `SELECT COUNT(*) as c FROM messages 
       WHERE client_id = ? AND timestamp >= ? AND direction = 'in'`,
      [clientId, startStr]
    )[0].c;
    
    const autoReplies = query(
      `SELECT COUNT(*) as c FROM messages 
       WHERE client_id = ? AND timestamp >= ? AND direction = 'out'`,
      [clientId, startStr]
    )[0].c;
    
    // Record usage in billing_usage
    const today = new Date().toISOString().slice(0, 10);
    
    // Upsert — insert or update
    run(
      `INSERT INTO billing_usage (client_id, metric, value, recorded_date) VALUES (?, 'messages_received', ?, ?)
       ON CONFLICT(client_id, metric, recorded_date) DO UPDATE SET value = ?`,
      [clientId, messages, today, messages]
    );
    run(
      `INSERT INTO billing_usage (client_id, metric, value, recorded_date) VALUES (?, 'messages_sent', ?, ?)
       ON CONFLICT(client_id, metric, recorded_date) DO UPDATE SET value = ?`,
      [clientId, autoReplies, today, autoReplies]
    );
    saveDb();
    
    // Cumulative usage this month
    const totalIn = query(
      `SELECT SUM(value) as c FROM billing_usage 
       WHERE client_id = ? AND metric = 'messages_received' AND recorded_date >= ?`,
      [clientId, startStr]
    )[0].c || 0;
    
    const totalOut = query(
      `SELECT SUM(value) as c FROM billing_usage 
       WHERE client_id = ? AND metric = 'messages_sent' AND recorded_date >= ?`,
      [clientId, startStr]
    )[0].c || 0;
    
    return { messages_in: totalIn, messages_out: totalOut, total: totalIn + totalOut };
  }

  // ════════════════════════════════════════════════
  //  PRICING TIERS
  // ════════════════════════════════════════════════

  // GET /api/billing/tiers — list all pricing tiers
  app.get('/api/billing/tiers', (req, res) => {
    const tiers = query('SELECT * FROM pricing_tiers WHERE active = 1 ORDER BY monthly_price_zar ASC');
    res.json(tiers.map(t => ({
      ...t,
      features: JSON.parse(t.features || '{}'),
    })));
  });

  // POST /api/billing/tiers — create a tier (overlord only)
  app.post('/api/billing/tiers', (req, res) => {
    const { name, key, description, monthly_price_zar, setup_fee_zar, max_products, max_messages, max_ai_calls, features, recommended } = req.body;
    if (!name || !key || !monthly_price_zar) {
      return res.status(400).json({ error: 'name, key, and monthly_price_zar are required' });
    }
    try {
      run(
        'INSERT INTO pricing_tiers (name, key, description, monthly_price_zar, setup_fee_zar, max_products, max_messages, max_ai_calls, features, recommended) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [name, key, description || '', monthly_price_zar, setup_fee_zar || 0, max_products || 1, max_messages || 0, max_ai_calls || 0, JSON.stringify(features || {}), recommended ? 1 : 0]
      );
      saveDb();
      const tier = query('SELECT * FROM pricing_tiers ORDER BY id DESC LIMIT 1')[0];
      res.status(201).json({ ...tier, features: JSON.parse(tier.features) });
    } catch (e) {
      res.status(400).json({ error: 'Tier key already exists or invalid data' });
    }
  });

  // PUT /api/billing/tiers/:id — update a tier
  app.put('/api/billing/tiers/:id', (req, res) => {
    const { name, description, monthly_price_zar, setup_fee_zar, max_products, max_messages, max_ai_calls, features, recommended, active } = req.body;
    const fields = [];
    const values = [];
    if (name !== undefined) { fields.push('name = ?'); values.push(name); }
    if (description !== undefined) { fields.push('description = ?'); values.push(description); }
    if (monthly_price_zar !== undefined) { fields.push('monthly_price_zar = ?'); values.push(monthly_price_zar); }
    if (setup_fee_zar !== undefined) { fields.push('setup_fee_zar = ?'); values.push(setup_fee_zar); }
    if (max_products !== undefined) { fields.push('max_products = ?'); values.push(max_products); }
    if (max_messages !== undefined) { fields.push('max_messages = ?'); values.push(max_messages); }
    if (max_ai_calls !== undefined) { fields.push('max_ai_calls = ?'); values.push(max_ai_calls); }
    if (features !== undefined) { fields.push('features = ?'); values.push(JSON.stringify(features)); }
    if (recommended !== undefined) { fields.push('recommended = ?'); values.push(recommended ? 1 : 0); }
    if (active !== undefined) { fields.push('active = ?'); values.push(active ? 1 : 0); }
    if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });
    values.push(req.params.id);
    run('UPDATE pricing_tiers SET ' + fields.join(', ') + ' WHERE id = ?', values);
    saveDb();
    const tier = query('SELECT * FROM pricing_tiers WHERE id = ?', [req.params.id]);
    if (tier.length === 0) return res.status(404).json({ error: 'Tier not found' });
    res.json({ ...tier[0], features: JSON.parse(tier[0].features) });
  });

  // ════════════════════════════════════════════════
  //  SUBSCRIPTIONS
  // ════════════════════════════════════════════════

  // GET /api/clients/:id/subscription — get client's subscription
  app.get('/api/clients/:id/subscription', (req, res) => {
    const sub = query('SELECT * FROM subscriptions WHERE client_id = ?', [req.params.id]);
    if (sub.length === 0) {
      // Create default subscription if none exists
      run('INSERT INTO subscriptions (client_id, tier_key, status) VALUES (?, "starter", "trialing")', [req.params.id]);
      saveDb();
      const newSub = query('SELECT * FROM subscriptions WHERE client_id = ?', [req.params.id]);
      const tier = query('SELECT * FROM pricing_tiers WHERE key = "starter"')[0];
      return res.json({
        ...newSub[0],
        tier: tier ? { ...tier, features: JSON.parse(tier.features) } : null,
        usage: getMonthlyUsage(parseInt(req.params.id)),
      });
    }
    const tier = query('SELECT * FROM pricing_tiers WHERE key = ?', [sub[0].tier_key])[0];
    res.json({
      ...sub[0],
      tier: tier ? { ...tier, features: JSON.parse(tier.features) } : null,
      usage: getMonthlyUsage(parseInt(req.params.id)),
    });
  });

  // POST /api/clients/:id/subscription/change — change tier (overlord or client_admin)
  app.post('/api/clients/:id/subscription/change', (req, res) => {
    const { tier_key } = req.body;
    if (!tier_key) return res.status(400).json({ error: 'tier_key is required' });
    
    const tier = query('SELECT * FROM pricing_tiers WHERE key = ? AND active = 1', [tier_key]);
    if (tier.length === 0) return res.status(404).json({ error: 'Pricing tier not found' });
    
    run(
      `UPDATE subscriptions SET tier_key = ?, updated_at = datetime('now') WHERE client_id = ?`,
      [tier_key, req.params.id]
    );
    
    // If not setup fee paid, or switching up, generate setup fee invoice
    const sub = query('SELECT * FROM subscriptions WHERE client_id = ?', [req.params.id]);
    if (sub.length > 0 && !sub[0].setup_fee_paid && tier[0].setup_fee_zar > 0) {
      const invNum = generateInvoiceNumber();
      run(
        'INSERT INTO invoices (client_id, subscription_id, invoice_number, amount_zar, description, status, due_date, line_items) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          parseInt(req.params.id),
          sub[0].id,
          invNum,
          tier[0].setup_fee_zar,
          `Setup fee: ${tier[0].name} plan`,
          'pending',
          new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
          JSON.stringify([{ description: `Setup Fee (${tier[0].name})`, amount: tier[0].setup_fee_zar }]),
        ]
      );
    }
    
    saveDb();
    
    const updatedSub = query('SELECT * FROM subscriptions WHERE client_id = ?', [req.params.id]);
    res.json({
      ...updatedSub[0],
      tier: { ...tier[0], features: JSON.parse(tier[0].features) },
      message: `Switched to ${tier[0].name} plan`,
    });
  });

  // POST /api/clients/:id/subscription/cancel — cancel subscription
  app.post('/api/clients/:id/subscription/cancel', (req, res) => {
    run(
      "UPDATE subscriptions SET status = 'canceled', canceled_at = datetime('now'), auto_renew = 0, updated_at = datetime('now') WHERE client_id = ?",
      [req.params.id]
    );
    saveDb();
    
    // Also cancel Stripe subscription if exists
    const s = initStripe();
    const sub = query('SELECT * FROM subscriptions WHERE client_id = ?', [req.params.id]);
    if (s && sub[0]?.stripe_subscription_id) {
      s.subscriptions.update(sub[0].stripe_subscription_id, { cancel_at_period_end: true }).catch(e => {
        console.error('[Billing] Stripe cancel error:', e.message);
      });
    }
    
    res.json({ success: true, message: 'Subscription canceled' });
  });

  // POST /api/clients/:id/subscription/reactivate — reactivate
  app.post('/api/clients/:id/subscription/reactivate', (req, res) => {
    run(
      "UPDATE subscriptions SET status = 'active', canceled_at = NULL, auto_renew = 1, updated_at = datetime('now') WHERE client_id = ?",
      [req.params.id]
    );
    saveDb();
    res.json({ success: true, message: 'Subscription reactivated' });
  });

  // ════════════════════════════════════════════════
  //  INVOICES
  // ════════════════════════════════════════════════

  // GET /api/clients/:id/invoices — list invoices for a client
  app.get('/api/clients/:id/invoices', (req, res) => {
    const invoices = query(
      'SELECT * FROM invoices WHERE client_id = ? ORDER BY created_at DESC',
      [req.params.id]
    );
    res.json(invoices.map(inv => ({
      ...inv,
      line_items: JSON.parse(inv.line_items || '[]'),
    })));
  });

  // GET /api/invoices — all invoices (overlord only)
  app.get('/api/invoices', (req, res) => {
    const invoices = query(
      `SELECT i.*, c.name as client_name 
       FROM invoices i 
       LEFT JOIN clients c ON c.id = i.client_id 
       ORDER BY i.created_at DESC`
    );
    res.json(invoices.map(inv => ({
      ...inv,
      line_items: JSON.parse(inv.line_items || '[]'),
    })));
  });

  // POST /api/clients/:id/invoices/generate — generate a new invoice
  app.post('/api/clients/:id/invoices/generate', (req, res) => {
    const { amount_zar, description, line_items } = req.body;
    if (!amount_zar) return res.status(400).json({ error: 'amount_zar is required' });
    
    const sub = query('SELECT * FROM subscriptions WHERE client_id = ?', [req.params.id]);
    const invNum = generateInvoiceNumber();
    
    run(
      'INSERT INTO invoices (client_id, subscription_id, invoice_number, amount_zar, description, status, due_date, line_items) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        parseInt(req.params.id),
        sub[0]?.id || null,
        invNum,
        amount_zar,
        description || 'Service charge',
        'pending',
        new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
        JSON.stringify(line_items || [{ description: description || 'Service charge', amount: amount_zar }]),
      ]
    );
    saveDb();
    
    const inv = query('SELECT * FROM invoices ORDER BY id DESC LIMIT 1')[0];
    res.status(201).json({ ...inv, line_items: JSON.parse(inv.line_items || '[]') });
  });

  // PUT /api/invoices/:id — update invoice status (mark paid)
  app.put('/api/invoices/:id', (req, res) => {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'status is required' });
    
    const updates = ["status = ?"];
    const values = [status];
    
    if (status === 'paid') {
      updates.push("paid_at = datetime('now')");
    }
    
    values.push(req.params.id);
    run('UPDATE invoices SET ' + updates.join(', ') + ' WHERE id = ?', values);
    saveDb();
    
    const inv = query('SELECT * FROM invoices WHERE id = ?', [req.params.id]);
    if (inv.length === 0) return res.status(404).json({ error: 'Invoice not found' });
    res.json({ ...inv[0], line_items: JSON.parse(inv[0].line_items || '[]') });
  });

  // ════════════════════════════════════════════════
  //  USAGE METERING
  // ════════════════════════════════════════════════

  // GET /api/clients/:id/usage — get usage breakdown
  app.get('/api/clients/:id/usage', (req, res) => {
    const clientId = parseInt(req.params.id);
    const usage = getMonthlyUsage(clientId);
    
    const sub = query('SELECT * FROM subscriptions WHERE client_id = ?', [clientId]);
    const tier = sub.length > 0 
      ? query('SELECT * FROM pricing_tiers WHERE key = ?', [sub[0].tier_key])[0]
      : null;
    
    const limits = {
      messages: tier?.max_messages || 0,
      products: tier?.max_products || 1,
    };
    
    // Get daily breakdown for chart
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const startStr = monthStart.toISOString().slice(0, 10);
    
    const dailyUsage = query(
      `SELECT recorded_date, SUM(value) as total 
       FROM billing_usage 
       WHERE client_id = ? AND recorded_date >= ? AND metric IN ('messages_received', 'messages_sent')
       GROUP BY recorded_date 
       ORDER BY recorded_date ASC`,
      [clientId, startStr]
    );
    
    res.json({
      current: usage,
      limits,
      usage_percent: limits.messages > 0 ? Math.round((usage.total / limits.messages) * 100) : 0,
      daily: dailyUsage,
    });
  });

  // GET /api/billing/usage/all — all clients usage (overlord)
  app.get('/api/billing/usage/all', (req, res) => {
    const clients = query("SELECT id, name FROM clients WHERE status = 'active'");
    const results = clients.map(c => ({
      client_id: c.id,
      client_name: c.name,
      usage: getMonthlyUsage(c.id),
      sub: query('SELECT tier_key, status FROM subscriptions WHERE client_id = ?', [c.id])[0] || null,
    }));
    res.json(results);
  });

  // ════════════════════════════════════════════════
  //  STRIPE INTEGRATION (optional, requires API keys)
  // ════════════════════════════════════════════════

  // POST /api/billing/create-checkout — create Stripe Checkout session
  app.post('/api/billing/create-checkout', async (req, res) => {
    const s = initStripe();
    if (!s) {
      return res.status(503).json({ 
        error: 'Stripe not configured', 
        message: 'Add STRIPE_SECRET_KEY to .env to enable online payments',
        offline_mode: true,
      });
    }
    
    const { client_id, tier_key, success_url, cancel_url } = req.body;
    if (!client_id || !tier_key) return res.status(400).json({ error: 'client_id and tier_key required' });
    
    try {
      const client = query('SELECT * FROM clients WHERE id = ?', [client_id])[0];
      if (!client) return res.status(404).json({ error: 'Client not found' });
      
      // Find or create Stripe customer
      let sub = query('SELECT * FROM subscriptions WHERE client_id = ?', [client_id])[0];
      let stripeCustomerId = sub?.stripe_customer_id || '';
      
      if (!stripeCustomerId) {
        const customer = await s.customers.create({
          email: client.email || undefined,
          name: client.name,
          metadata: { client_id: String(client_id) },
        });
        stripeCustomerId = customer.id;
        
        if (sub) {
          run('UPDATE subscriptions SET stripe_customer_id = ? WHERE client_id = ?', [stripeCustomerId, client_id]);
          saveDb();
        }
      }
      
      // Get tier
      const tier = query('SELECT * FROM pricing_tiers WHERE key = ? AND active = 1', [tier_key])[0];
      if (!tier) return res.status(404).json({ error: 'Tier not found' });
      
      // Create Stripe price if needed or use metadata approach
      const session = await s.checkout.sessions.create({
        customer: stripeCustomerId,
        mode: 'subscription',
        line_items: [
          {
            price_data: {
              currency: 'zar',
              product_data: {
                name: `${tier.name} Plan`,
                description: `AutoEffortless ${tier.name} — R${tier.monthly_price_zar}/month`,
              },
              unit_amount: Math.round(tier.monthly_price_zar * 100), // cents
              recurring: { interval: 'month' },
            },
            quantity: 1,
          },
        ],
        metadata: {
          client_id: String(client_id),
          tier_key: tier_key,
        },
        success_url: success_url || `${req.headers.origin || 'https://app.autoeffortless.com'}/billing?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancel_url || `${req.headers.origin || 'https://app.autoeffortless.com'}/billing`,
      });
      
      res.json({ url: session.url, session_id: session.id });
    } catch (e) {
      console.error('[Billing] Checkout error:', e.message);
      res.status(500).json({ error: 'Failed to create checkout session' });
    }
  });

  // POST /api/billing/create-portal — create Stripe Customer Portal session
  app.post('/api/billing/create-portal', async (req, res) => {
    const s = initStripe();
    if (!s) return res.status(503).json({ error: 'Stripe not configured' });
    
    const { client_id, return_url } = req.body;
    if (!client_id) return res.status(400).json({ error: 'client_id required' });
    
    try {
      const sub = query('SELECT * FROM subscriptions WHERE client_id = ?', [client_id])[0];
      if (!sub?.stripe_customer_id) return res.status(404).json({ error: 'No Stripe customer found' });
      
      const session = await s.billingPortal.sessions.create({
        customer: sub.stripe_customer_id,
        return_url: return_url || `${req.headers.origin || 'https://app.autoeffortless.com'}/billing`,
      });
      
      res.json({ url: session.url });
    } catch (e) {
      console.error('[Billing] Portal error:', e.message);
      res.status(500).json({ error: 'Failed to create portal session' });
    }
  });

  // POST /api/billing/webhook — Stripe webhook
  app.post('/api/billing/webhook', async (req, res) => {
    const s = initStripe();
    if (!s) {
      return res.status(200).json({ received: true, note: 'Stripe not configured — ignoring webhook' });
    }
    
    let event;
    const sig = req.headers['stripe-signature'];
    
    if (process.env.STRIPE_WEBHOOK_SECRET && sig) {
      try {
        event = s.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
      } catch (e) {
        console.error('[Billing] Webhook signature verification failed:', e.message);
        return res.status(400).json({ error: 'Invalid signature' });
      }
    } else {
      // Without webhook secret, parse body directly
      event = req.body;
    }
    
    // Handle events
    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object;
          const clientId = parseInt(session.metadata?.client_id);
          const tierKey = session.metadata?.tier_key;
          
          if (clientId && tierKey) {
            const subscriptionId = session.subscription;
            const customerId = session.customer;
            
            run(
              `UPDATE subscriptions SET 
                stripe_subscription_id = ?, 
                stripe_customer_id = ?,
                status = 'active',
                current_period_start = datetime('now'),
                current_period_end = datetime('now', '+1 month'),
                setup_fee_paid = 1,
                updated_at = datetime('now')
              WHERE client_id = ?`,
              [subscriptionId, customerId, clientId]
            );
            saveDb();
            console.log(`[Billing] Subscription activated for client ${clientId} (${tierKey})`);
          }
          break;
        }
        
        case 'invoice.paid': {
          const invoice = event.data.object;
          const clientId = parseInt(invoice.metadata?.client_id || invoice.subscription_details?.metadata?.client_id || '0');
          
          if (clientId) {
            // Record invoice as paid
            const existing = query('SELECT id FROM invoices WHERE stripe_invoice_id = ?', [invoice.id]);
            if (existing.length === 0 && invoice.amount_paid > 0) {
              const sub = query('SELECT * FROM subscriptions WHERE client_id = ?', [clientId]);
              const invNum = generateInvoiceNumber();
              run(
                'INSERT INTO invoices (client_id, subscription_id, stripe_invoice_id, invoice_number, amount_zar, description, status, paid_at, invoice_url) VALUES (?, ?, ?, ?, ?, ?, "paid", datetime("now"), ?)',
                [
                  clientId,
                  sub[0]?.id || null,
                  invoice.id,
                  invNum,
                  invoice.amount_paid / 100,
                  `Monthly subscription`,
                  invoice.hosted_invoice_url || '',
                ]
              );
              saveDb();
            }
          }
          break;
        }
        
        case 'customer.subscription.deleted': {
          const subscription = event.data.object;
          const customerId = subscription.customer;
          
          if (customerId) {
            const subs = query('SELECT id, client_id FROM subscriptions WHERE stripe_customer_id = ?', [customerId]);
            if (subs.length > 0) {
              run(
                "UPDATE subscriptions SET status = 'canceled', auto_renew = 0, updated_at = datetime('now') WHERE stripe_customer_id = ?",
                [customerId]
              );
              saveDb();
              console.log(`[Billing] Subscription canceled for client ${subs[0].client_id}`);
            }
          }
          break;
        }
        
        default:
          // Unhandled event types silently ignored
          break;
      }
    } catch (e) {
      console.error('[Billing] Webhook handler error:', e.message);
    }
    
    res.json({ received: true });
  });

  // ════════════════════════════════════════════════
  //  OVERLORD: Billing Dashboard
  // ════════════════════════════════════════════════

  // GET /api/billing/summary — billing KPIs for overlord
  app.get('/api/billing/summary', (req, res) => {
    const totalMonthly = query(
      `SELECT COALESCE(SUM(pt.monthly_price_zar), 0) as total
       FROM subscriptions s
       JOIN pricing_tiers pt ON pt.key = s.tier_key
       WHERE s.status IN ('active', 'trialing')`
    )[0].total;
    
    const byTier = query(
      `SELECT s.tier_key, pt.name as tier_name, pt.monthly_price_zar, COUNT(*) as count
       FROM subscriptions s
       JOIN pricing_tiers pt ON pt.key = s.tier_key
       WHERE s.status IN ('active', 'trialing')
       GROUP BY s.tier_key`
    );
    
    const pendingInvoices = query(
      "SELECT COUNT(*) as count, COALESCE(SUM(amount_zar), 0) as total FROM invoices WHERE status = 'pending'"
    )[0];
    
    const revenueCollected = query(
      "SELECT COALESCE(SUM(amount_zar), 0) as total FROM invoices WHERE status = 'paid'"
    )[0].total;
    
    res.json({
      total_monthly_recurring: totalMonthly,
      annual_run_rate: totalMonthly * 12,
      by_tier: byTier,
      pending_invoices: pendingInvoices.count,
      pending_revenue: pendingInvoices.total,
      revenue_collected: revenueCollected,
      client_count: query("SELECT COUNT(*) as c FROM subscriptions WHERE status IN ('active', 'trialing')")[0].c,
    });
  });

  console.log('[Billing] Routes loaded');
}
