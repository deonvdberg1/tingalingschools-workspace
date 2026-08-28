// Checkout helper — talks to the AutoEffortless API (Paystack)
const API = 'https://app.autoeffortless.com/api'

export async function startCheckout({ product, pkg, mode, email, name }) {
  const res = await fetch(`${API}/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ product, pkg, mode, email, name })
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Checkout failed (${res.status})`)
  return data
}
