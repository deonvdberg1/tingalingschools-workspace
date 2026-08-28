import React from 'react'
import { Link } from 'react-router-dom'
import { AppIcon } from './BrandIcon.jsx'

export default function ProductCard({ product }) {
  return (
    <Link to={`/${product.slug}`} className="card product-card">
      <AppIcon name={product.icon || 'box'} size={24} box={52} />
      <h3 className="card-title">{product.name}</h3>
      <p className="card-tagline muted">{product.tagline}</p>
      <div className="card-foot">
        <span className="price">{product.price}</span>
        <span className="card-cta">View →</span>
      </div>
    </Link>
  )
}
