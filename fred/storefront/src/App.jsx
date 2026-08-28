import React, { useState } from 'react'
import { Routes, Route, Link, useParams } from 'react-router-dom'
import { PRODUCTS, PACKAGES, CATEGORIES, getProduct, getCategory, productsByCategory, SINGLE_USE_PRICES } from './data/products.js'
import ProductCard from './components/ProductCard.jsx'
import PackageCard from './components/PackageCard.jsx'
import CheckoutModal from './components/CheckoutModal.jsx'
import { AeSprite, AppIcon } from './components/BrandIcon.jsx'

function Header() {
  return (
    <header className="sf-header">
      <div className="container sf-header-inner">
        <a href="/" className="brand">
          <span className="brand-name">Auto<span>Effortless</span></span>
        </a>
        <nav className="sf-nav">
          <a href="/#services">Services</a>
          <a href="/apps" className="active">Apps</a>
          <a href="/#pricing">Pricing</a>
          <a href="/#faq">FAQ</a>
          <a href="https://app.autoeffortless.com/signin" className="btn-nav">Sign In</a>
        </nav>
      </div>
    </header>
  )
}

function Hero() {
  return (
    <section className="sf-hero">
      <div className="container">
        <span className="eyebrow">✦ Self-serve apps</span>
        <h1 className="sf-hero-title">15 affordable apps for your business</h1>
        <p className="sf-hero-sub">
          AI tools, invoicing, CRM, bookings and more — buy in seconds, use in your browser,
          on any phone or computer. Works alongside our managed services.
        </p>
        <div className="sf-hero-actions">
          <a href="#tiers" className="btn btn-gold">Browse the apps</a>
          <a href="#bundles" className="btn btn-ghost">See bundles</a>
        </div>
      </div>
    </section>
  )
}

function CategoriesSection() {
  return (
    <section id="tiers" className="section">
      <div className="container">
        <h2 className="section-title">Find apps for your life</h2>
        <p className="section-sub">Every app works in your browser — no downloads, no app stores. Apps that fit more than one audience appear in each.</p>
        {CATEGORIES.map((cat) => (
          <div key={cat.id} className="tier-block">
            <div className="tier-head">
              <h3 className="tier-name"><AppIcon name={cat.icon || 'box'} size={18} box={34} /> {cat.name}</h3>
              <p className="tier-blurb muted">{cat.blurb}</p>
            </div>
            <div className="grid">
              {productsByCategory(cat.id).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function PackagesSection({ onBuy }) {
  return (
    <section id="bundles" className="section section-alt">
      <div className="container">
        <h2 className="section-title">Packages — buy a whole set at once</h2>
        <p className="section-sub">Every package starts with a 7-day free trial. Or buy any app on its own.</p>
        <div className="bundle-grid">
          {PACKAGES.map((p) => (
            <PackageCard key={p.id} pkg={p} onBuy={onBuy} />
          ))}
        </div>
      </div>
    </section>
  )
}

function StoreHome({ onBuy }) {
  return (
    <>
      <Hero />
      <CategoriesSection />
      <PackagesSection onBuy={onBuy} />
    </>
  )
}

function ProductPage({ onBuy }) {
  const { slug } = useParams()
  const product = getProduct(slug)
  if (!product) return <div className="container section"><h2>App not found</h2><Link to="/">← Back to all apps</Link></div>

  const cats = (product.categories || []).map(getCategory).filter(Boolean)
  return (
    <section className="section">
      <div className="container product-page">
        <Link to="/" className="back-link">← All apps</Link>
        <div className="product-hero">
          <AppIcon name={product.icon || 'box'} size={30} box={72} />
          <div>
            <span className="chip">{cats.map((c) => c.name.replace('For ', '')).join(' · ')}</span>
            <h1 className="product-name">{product.name}</h1>
            <p className="product-tagline">{product.tagline}</p>
          </div>
        </div>
        <p className="product-desc">{product.description}</p>
        <ul className="feature-list">
          {product.features.map((f) => (
            <li key={f}>✓ {f}</li>
          ))}
        </ul>
        <div className="buy-options">
          <div className="buy-option buy-option-trial">
            <h4>Try it free</h4>
            <p className="muted small">Full access for 7 days, no card needed. Cancel anytime.</p>
            <button className="btn btn-gold btn-block" onClick={() => onBuy({ product: product.slug, mode: 'trial', label: `Try ${product.name} free for 7 days` })}>Start free trial</button>
          </div>
          <div className="buy-option">
            <h4>Subscribe</h4>
            <p className="price">{product.price}<span className="muted">/mo</span></p>
            <button className="btn btn-gold btn-block" onClick={() => onBuy({ product: product.slug, mode: 'subscribe', label: `Subscribe to ${product.name}` })}>Subscribe</button>
          </div>
          <div className="buy-option">
            <h4>Single use</h4>
            <p className="price">{SINGLE_USE_PRICES[product.slug] || product.price}<span className="muted"> once</span></p>
            <button className="btn btn-ghost btn-block" onClick={() => onBuy({ product: product.slug, mode: 'single', label: `Buy ${product.name} — single use` })}>Buy once</button>
          </div>
        </div>
        <p className="muted small">No downloads. Works in any browser. Add to home screen for the app feel.</p>
      </div>
    </section>
  )
}

function NotFound() {
  return (
    <section className="section">
      <div className="container product-page">
        <h1 className="product-name">Page not found</h1>
        <p className="product-tagline">That link doesn't point anywhere.</p>
        <div className="buy-row">
          <Link to="/" className="btn btn-gold">← Back to all apps</Link>
        </div>
      </div>
    </section>
  )
}

function ThanksPage() {
  return (
    <section className="section">
      <div className="container product-page">
        <div className="product-hero">
          <AppIcon name="check-circle" size={30} box={72} />
          <div>
            <h1 className="product-name">Payment received!</h1>
            <p className="product-tagline">Check your inbox — your login details are on their way.</p>
          </div>
        </div>
        <p className="product-desc">
          Your account is being activated right now. Open the email from <strong>info@autoeffortless.com</strong> for your
          login details, then sign in at <a href="https://app.autoeffortless.com/signin">app.autoeffortless.com</a>.
        </p>
        <div className="buy-row">
          <a href="/apps" className="btn btn-ghost">← Back to apps</a>
          <a href="https://app.autoeffortless.com/signin" className="btn btn-gold">Go to login</a>
        </div>
      </div>
    </section>
  )
}

export default function App() {
  const [intent, setIntent] = useState(null)

  return (
    <div className="sf-page">
      <AeSprite />
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<StoreHome onBuy={setIntent} />} />
          <Route path="/thanks" element={<ThanksPage />} />
          <Route path="/:slug" element={<ProductPage onBuy={setIntent} />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <footer className="sf-footer">
        <div className="container sf-footer-inner">
          <div>
            <strong>Auto<span>Effortless</span></strong>
            <p className="muted">Effortless business communication & tools.</p>
          </div>
          <div className="sf-footer-links">
            <a href="/">Back to main site</a>
            <a href="mailto:info@autoeffortless.com">info@autoeffortless.com</a>
          </div>
        </div>
      </footer>
      {intent && <CheckoutModal intent={intent} onClose={() => setIntent(null)} />}
    </div>
  )
}
