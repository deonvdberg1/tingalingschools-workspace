import React, { useState } from 'react'
import { startCheckout } from '../lib/checkout.js'

// Modal: collect email (account is auto-created from it) then start Paystack checkout
export default function CheckoutModal({ intent, onClose }) {
  // intent = { product?, pkg?, mode?, label }
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim()) return setError('Please enter your email address.')
    setBusy(true)
    setError('')
    try {
      const data = await startCheckout({ ...intent, email: email.trim(), name: name.trim() || undefined })
      window.location.href = data.authorization_url
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        <h3>{intent.label}</h3>
        <p className="muted small">
          Your account is created automatically from your email. No card is charged until you confirm on the secure payment page.
        </p>
        <form onSubmit={handleSubmit}>
          <label className="field-label">Email address</label>
          <input
            className="field-input"
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <label className="field-label">Name (optional)</label>
          <input
            className="field-input"
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          {error && <p className="field-error">{error}</p>}
          <button className="btn btn-gold btn-block" type="submit" disabled={busy}>
            {busy ? 'Taking you to payment…' : 'Continue to payment'}
          </button>
        </form>
      </div>
    </div>
  )
}
