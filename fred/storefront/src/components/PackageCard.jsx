import React from 'react'
import { AppIcon } from './BrandIcon.jsx'

export default function PackageCard({ pkg, onBuy }) {
  return (
    <div className={`card bundle-card ${pkg.highlight ? 'bundle-highlight' : ''}`}>
      {pkg.highlight && <span className="chip chip-pop">Best value</span>}
      <AppIcon name={pkg.icon || 'box'} size={24} box={52} />
      <h3 className="card-title">{pkg.name}</h3>
      <p className="muted">{pkg.tagline}</p>
      <div className="price price-lg">R{pkg.price}<span className="muted"> /mo</span></div>
      <p className="chip">{pkg.apps}</p>
      <ul className="feature-list small">
        {pkg.features.map((f) => (
          <li key={f}>✓ {f}</li>
        ))}
      </ul>
      <button
        className="btn btn-gold btn-block"
        onClick={() => onBuy({ pkg: pkg.id, mode: 'subscribe', label: `${pkg.name} — 7-day free trial` })}
      >
        Start 7-day free trial
      </button>
    </div>
  )
}
