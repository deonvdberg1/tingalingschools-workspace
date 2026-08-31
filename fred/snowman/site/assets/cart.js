// ── Snowman Store — cart engine (shared by index + shop) ──
(function () {
  const KEY = "snowman_cart";
  const API = "https://app.autoeffortless.com";
  let cart = [];
  try { cart = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (e) {}

  const ICON = {
    cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>',
    wa: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
    truck: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>',
    store: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l1-5h16l1 5"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/><path d="M5 13v8h14v-8"/></svg>'
  };

  function save() {
    localStorage.setItem(KEY, JSON.stringify(cart));
    updateBadges();
  }
  function count() { return cart.reduce((n, i) => n + i.qty, 0); }
  function total() { return cart.reduce((n, i) => n + i.qty * i.price, 0); }
  function money(c) { return "R" + (c / 100).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

  function updateBadges() {
    document.querySelectorAll("[data-cart-count]").forEach((el) => {
      const n = count();
      el.textContent = n;
      el.style.display = n ? "flex" : "none";
    });
  }

  window.SnowmanCart = {
    add(name, priceCents, img) {
      const item = cart.find((i) => i.name === name);
      if (item) item.qty += 1; else cart.push({ name, price: priceCents, qty: 1, img });
      save();
      openDrawer();
    },
    open: openDrawer,
    count,
  };

  function openDrawer() {
    let el = document.getElementById("snowman-cart");
    if (!el) {
      el = document.createElement("div");
      el.id = "snowman-cart";
      document.body.appendChild(el);
    }
    el.innerHTML = `
      <div class="sc-overlay" onclick="SnowmanCart.close()"></div>
      <div class="sc-drawer">
        <div class="sc-head">
          <div><b>Your Order</b><small>${count()} item${count() === 1 ? "" : "s"} in cart</small></div>
          <button class="sc-x" onclick="SnowmanCart.close()">${ICON.close}</button>
        </div>
        <div class="sc-items" id="scItems"></div>
        <div class="sc-foot">
          <div class="sc-total"><span>Total</span><b id="scTotal">${money(total())}</b></div>
          ${cart.length ? `<button class="sc-checkout" onclick="SnowmanCart.goCheckout()">${ICON.lock} Checkout Securely</button>
          <a class="sc-wa" href="https://wa.me/27832368368?text=${encodeURIComponent("Hi Snowman! I'd like to order via WhatsApp: " + cart.map(i => i.name + " x" + i.qty).join(", "))}" target="_blank" rel="noopener">${ICON.wa} Or order on WhatsApp</a>` : `<p class="sc-empty">Your cart is empty — add products from the shop.</p>`}
        </div>
      </div>`;
    renderItems();
    el.style.display = "block";
    document.body.style.overflow = "hidden";
  }

  function renderItems() {
    const box = document.getElementById("scItems");
    if (!box) return;
    box.innerHTML = cart.map((i, idx) => `
      <div class="sc-item">
        <img src="${i.img}" alt="${i.name}" />
        <div class="sc-i-info"><b>${i.name}</b><span>${money(i.price)}</span>
          <div class="sc-qty">
            <button onclick="SnowmanCart.qty(${idx},-1)">−</button><span>${i.qty}</span><button onclick="SnowmanCart.qty(${idx},1)">+</button>
          </div>
        </div>
        <div class="sc-i-right"><b>${money(i.price * i.qty)}</b><button class="sc-del" onclick="SnowmanCart.qty(${idx},-999)">${ICON.trash}</button></div>
      </div>`).join("") || `<p class="sc-empty">Your cart is empty.</p>`;
    const t = document.getElementById("scTotal");
    if (t) t.textContent = money(total());
  }

  window.SnowmanCart.qty = function (idx, d) {
    cart[idx].qty += d;
    if (cart[idx].qty <= 0) cart.splice(idx, 1);
    save();
    renderItems();
    if (!cart.length) document.getElementById("scTotal").textContent = money(0);
  };
  window.SnowmanCart.close = function () {
    const el = document.getElementById("snowman-cart");
    if (el) el.style.display = "none";
    document.body.style.overflow = "";
  };
  window.SnowmanCart.goCheckout = function () {
    const el = document.getElementById("scItems");
    el.insertAdjacentHTML("afterend", `
      <div class="sc-form" id="scForm">
        <h4>Your details</h4>
        <input id="scName" placeholder="Full name" required />
        <input id="scPhone" placeholder="Phone / WhatsApp number" type="tel" required />
        <input id="scEmail" placeholder="Email" type="email" required />
        <div class="sc-deliv">
          <label><input type="radio" name="scDeliv" value="pickup" checked onchange="SnowmanCart.toggleDeliv()" /> Pickup</label>
          <label><input type="radio" name="scDeliv" value="delivery" onchange="SnowmanCart.toggleDeliv()" /> Delivery</label>
        </div>
        <div id="scDelivBox" style="display:none">
          <div class="sc-field">
            <label>Delivery address *</label>
            <input id="scAddr" placeholder="Start typing your address…" autocomplete="off" />
            <div class="sc-sugg" id="scSugg"></div>
          </div>
          <div class="sc-field">
            <label>Delivery details (optional but helps us find you)</label>
            <div class="sc-details">
              <input id="scDetailBldg" placeholder="Building / Estate / Complex" />
              <input id="scDetailFloor" placeholder="Floor / Block / Section" />
              <input id="scDetailUnit" placeholder="Unit / Suite / House no." />
              <input id="scDetailLand" placeholder="Landmark / Gate code / Instructions" />
            </div>
          </div>
        </div>
        <button class="sc-checkout" id="scPayBtn" onclick="SnowmanCart.pay()">${ICON.lock} Pay with card — ${money(total())}</button>
        <p class="sc-secure">${ICON.lock} Secure payment via Paystack</p>
      </div>`);
    const foot = document.getElementById("scFoot");
    if (foot) foot.style.display = "none";
    document.getElementById("scAddr").addEventListener("input", debounce(onAddrInput, 350));
    document.addEventListener("click", function handler(e) {
      if (!e.target.closest(".sc-field")) document.getElementById("scSugg").style.display = "none";
    });
  };

  window.SnowmanCart.toggleDeliv = function () {
    const box = document.getElementById("scDelivBox");
    box.style.display = (document.querySelector('input[name="scDeliv"]:checked') || {}).value === "delivery" ? "block" : "none";
  };

  let addrTimer = null;
  function debounce(fn, ms) { return function () { clearTimeout(addrTimer); addrTimer = setTimeout(fn, ms); }; }
  async function onAddrInput() {
    const q = document.getElementById("scAddr").value.trim();
    const box = document.getElementById("scSugg");
    if (q.length < 4) { box.style.display = "none"; return; }
    try {
      const r = await fetch(API + "/api/address-autocomplete?q=" + encodeURIComponent(q));
      const d = await r.json();
      const sug = d.suggestions || [];
      box.innerHTML = sug.map((s) => `<div class="sc-sugg-item" onclick="SnowmanCart.pickAddr('${s.text.replace(/'/g, "\\'")}')">${ICON.store} <span>${s.text}</span></div>`).join("");
      box.style.display = sug.length ? "block" : "none";
    } catch (e) { box.style.display = "none"; }
  }
  window.SnowmanCart.pickAddr = function (text) {
    document.getElementById("scAddr").value = text;
    document.getElementById("scSugg").style.display = "none";
  };

  window.SnowmanCart.pay = async function () {
    const name = document.getElementById("scName").value.trim();
    const phone = document.getElementById("scPhone").value.trim();
    const email = document.getElementById("scEmail").value.trim();
    const delivery = (document.querySelector('input[name="scDeliv"]:checked') || {}).value || "pickup";
    const address = document.getElementById("scAddr").value.trim();
    if (!name || !phone || !email) { alert("Please fill in your name, phone and email."); return; }
    if (delivery === "delivery" && !address) {
      document.getElementById("scAddr").style.borderColor = "#dc2626";
      document.getElementById("scAddr").focus();
      alert("Please enter your delivery address.");
      return;
    }
    const delivery_details = [
      document.getElementById("scDetailBldg").value.trim(),
      document.getElementById("scDetailFloor").value.trim(),
      document.getElementById("scDetailUnit").value.trim(),
      document.getElementById("scDetailLand").value.trim(),
    ].filter(Boolean).join(" · ");
    const btn = document.getElementById("scPayBtn");
    btn.disabled = true; btn.textContent = "Contacting payment gateway…";
    try {
      const res = await fetch(API + "/api/snowman/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email, name, phone, delivery, address, delivery_details,
          amount_cents: total(),
          items: cart.map((i) => ({ name: i.name, qty: i.qty, price: i.price / 100 })),
        }),
      });
      const data = await res.json();
      if (!data.authorization_url) throw new Error(data.error || "Checkout failed");
      localStorage.setItem("snowman_pending_order", JSON.stringify({ name, phone, email, delivery, address, delivery_details, items: cart, total: total() }));
      location.href = data.authorization_url;
    } catch (e) {
      alert("Could not start payment: " + e.message);
      btn.disabled = false; btn.textContent = "Pay with card";
    }
  };

  // Cart button injection (nav)
  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-cart-btn]").forEach((btn) => {
      btn.innerHTML = `${ICON.cart}<span class="cart-badge" data-cart-count>0</span>`;
      btn.onclick = (e) => { e.preventDefault(); SnowmanCart.open(); };
    });
    updateBadges();
  });
})();
