#!/usr/bin/env python3
"""AutoEffortless — Website Building Service: single source of truth.

Prices/wording live here ONLY. The pricing spreadsheet AND the pricing PDF are
both generated from this file, so they can never drift apart.

MODEL (Mr D, 2026-09-29 15:25):
  BASIC  = the complete content-rich website ("all the bells and whistles"):
           all pages, product & price catalogue, gallery, reviews, team,
           map/location, WhatsApp button, contact form + hosting/care.
  ADD-ONS = anything that plugs into the site and does work:
           once-off build fee + 12% of that fee per month (maintenance:
           monitoring, updates, support, fixes). No other monthly charges.
  USAGE   = AI-credit-heavy and WhatsApp/Meta-API items: 12% + actual monthly
           usage, tracked and quoted separately.
  Content extras (pages, copy, catalogue items, design) are absorbed into the
  Basic build — kept here marked inactive for reference.

Fields per service:
  cat, name, wording, once, monthly (None = auto 12% of once), usage (bool),
  active (bool -> shown in the PDF and in the live price list), status
"""

CURRENCY = "ZAR"
REVISION = "LOCKED · 29 September 2026"
RATE = 0.12          # maintenance fee on add-ons

# --------------------------------------------------------------------- basic
BASIC = {
    "setup": 1500,
    "monthly": 200,
    "yearly_range": "R200–R300",
    "status": "confirmed",
    "headline": "The Basic Website — R1 500 once-off",
    "summary": ("A complete, content-rich website: up to 8 pages, your full product "
                "and price list, photo gallery, reviews, team, map location, WhatsApp "
                "contact button and a contact form. Live within 5 working days."),
    "includes": [
        "Up to 8 pages — Home, About, Services, Products, Gallery, Team, Reviews, Contact",
        "Your full product &amp; service catalogue with prices (up to 30 items)",
        "Menu or price-list page",
        "Photo gallery (up to 50 images)",
        "Customer reviews &amp; testimonials straight from Google",
        "Team / staff profiles with photos",
        "Store location map, tap-for-directions &amp; trading hours",
        "Floating WhatsApp contact button on every page",
        "Contact form with email + WhatsApp alerts to you",
        "Your social links, business details and banking/EFT details",
        "Mobile-first design, fast loading and SSL security",
        "Basic SEO, sitemap and Google indexing",
        "Live within 5 working days",
    ],
}

# ------------------------------------------------------------------ services
# every item in this file is LOCKED (Mr D approved 2026-09-29 15:45)
def S(cat, name, wording, once=None, monthly=None, usage=False, active=True, status="confirmed"):
    return {"cat": cat, "name": name, "wording": wording, "once": once,
            "monthly": monthly, "usage": usage, "active": active, "status": status}


SERVICES = [
    S("Sales & payments", "Online payments",
      "Take card and instant EFT payments on your site — deposits and invoices paid online.",
      500),
    S("Sales & payments", "Full store with payment portal",
      "A complete online shop: products, stock, delivery options and a proper checkout.",
      1000),
    S("Sales & payments", "Pay-by-WhatsApp payment links",
      "Send a payment link on WhatsApp — the customer pays before you deliver or book.",
      450),
    S("Sales & payments", "Recurring billing / subscriptions",
      "Charge monthly for a service or membership automatically.",
      200),
    S("Bookings & scheduling", "Booking & appointment system",
      "Customers book themselves in; you see the diary and get reminders.",
      500),
    S("Bookings & scheduling", "Bookings with staff allocation",
      "Choose the staff member or resource, with availability rules per person.",
      700),
    S("Bookings & scheduling", "Class / course scheduling",
      "Timetables with capacity limits, waitlists and class packs.",
      500),
    S("Bookings & scheduling", "Venue reservations",
      "Table, court or venue bookings with time slots and party sizes.",
      500),
    S("Lead capture & CRM", "Pro lead capture pack",
      "Multi-step forms that qualify the lead before it reaches you.",
      250),
    S("Lead capture & CRM", "Instant quote / estimate form",
      "Customer answers a few questions and immediately receives a PDF quote.",
      250),
    S("Lead capture & CRM", "Form-to-inbox automation",
      "Every enquiry lands in your email, a Google Sheet and/or your CRM automatically.",
      650),
    S("Lead capture & CRM", "WhatsApp lead alerts",
      "Instant WhatsApp notification the moment a lead comes in.",
      350),
    S("Lead capture & CRM", "Popup / exit-intent lead magnet",
      "Capture contact details with a special offer before visitors leave.",
      450),
    S("Lead capture & CRM", "Newsletter signup + monthly mailer",
      "Collect customer emails and send one branded newsletter a month.",
      300),
    S("Lead capture & CRM", "Live chat widget",
      "A chat box on your site, connected to your WhatsApp or our team.",
      200),
    S("Lead capture & CRM", "Simple CRM dashboard",
      "All your leads in one place with status, notes and follow-up reminders.",
      350),
    S("Integrations", "Google Calendar / Outlook sync",
      "Two-way sync so bookings land straight in the calendar you already use.",
      850),
    S("Integrations", "WhatsApp Business API setup",
      "Your own verified WhatsApp business number, ready for automations.",
      1500, usage=True),
    S("AI features", "AI Editor",
      "An AI editor built into your site — rewrite product descriptions, generate copy and keep your content fresh without a developer.",
      1000, usage=True),
    S("WhatsApp AI agent", "WhatsApp AI assistant",
      "Answers your customers 24/7 — quotes, bookings, FAQs — in your business voice.",
      2500, usage=True),
    S("WhatsApp AI agent", "Bookings & payments in WhatsApp",
      "The agent captures the booking and sends the payment link in the same chat.",
      1200, usage=True),
    S("WhatsApp AI agent", "Multi-language agent",
      "English, Afrikaans and isiZulu added to your WhatsApp agent.",
      650, usage=True),
    S("Growth & marketing", "Campaign landing page",
      "A focused page for a promotion or advert — built to convert.",
      250),
]

# --------------------------------------------------- basic site care lines
CARE = [
    S("Basic site care", "Care plan (with the Basic site)",
      "Hosting management, SSL, security updates, weekly backups, uptime monitoring and 30 minutes of content edits per month. Cancel anytime — you keep the site.",
      monthly=200, status="confirmed"),
    S("Basic site care", "Hosting + domain",
      "Annual cost, confirmed once your site name availability is checked. Registered in your name.",
      status="confirmed"),
]
CARE[1]["yearly_range"] = "R200–R300"
CARE[0]["maint_label"] = "R200/mo"
CARE[1]["maint_label"] = "R200–R300/yr"

# ------------------------------------------------------------------ bundles
BUNDLES = [

]

# ------------------------------------------------------------------- wording
WORDING = {
    "hero_headline": ("Brand", "Headline", "Websites that get your phone ringing."),
    "tagline": ("Brand", "Tagline", "Effortless Business Communication"),
    "hero_sub": ("Brand", "Hero sub-headline",
                 "Professional websites with the systems behind them — payments, bookings, "
                 "lead capture and a WhatsApp AI agent — built and looked after by AutoEffortless."),
    "one_price": ("Brand", "One-price line",
                  "One price, no surprises. R1 500 gets your complete website online. R200 a month "
                  "keeps it fast, secure and updated."),
    "basic_summary": ("Offer", "Basic site summary", BASIC["summary"]),
    "why_not_diy": ("Offer", "Why not DIY",
                    "Because it never gets finished, never gets found, and nobody updates it. "
                    "We deliver it done, then maintain it."),
    "ownership": ("Offer", "Ownership promise",
                  "You own your website and your domain. Both are registered in your name — "
                  "if you ever leave, you keep them."),
    "editing": ("Offer", "Editing promise",
                "You can edit the site yourself, or send us the changes and we do them in your "
                "monthly edit time."),
    "addon_model": ("Offer", "How add-on pricing works",
                    "Every system you add is a once-off build fee plus 12% of that fee per month "
                    "for maintenance — monitoring, updates, support and fixes. There are no other "
                    "monthly charges."),
    "usage_rule": ("Offer", "AI & WhatsApp usage rule",
                   "AI and WhatsApp (Meta) API usage is charged to the relevant areas: those items "
                   "are billed at the same 12% plus their tracked monthly usage, quoted separately — "
                   "you always see exactly what you used."),
    "step1": ("Process", "Step 1", "Day 1 — 30-minute call: we collect your details, photos, prices and services."),
    "step2": ("Process", "Step 2", "Day 2 — We check your site name, register the domain and start building."),
    "step3": ("Process", "Step 3", "Day 3–4 — You review a preview link; we make your changes."),
    "step4": ("Process", "Step 4", "Day 5 — Your site goes live and is submitted to Google."),
    "step5": ("Process", "Step 5", "Ongoing — we keep the site and every system running, and add new ones as you grow."),
    "cta_headline": ("CTA", "Call to action headline", "Ready to get found?"),
    "cta_body": ("CTA", "Call to action body",
                 "Book your free 30-minute consultation and we'll check your site name, your competitors, "
                 "and exactly which systems will bring you the most work."),
    "contact_line": ("CTA", "Contact line",
                     "WhatsApp: 061 527 4429 · Email: info@autoeffortless.com · Web: autoeffortless.com"),
    "footnote": ("Legal", "Pricing footnote",
                 "Pricing locked 29 September 2026. All prices in South African Rand (ZAR), valid until "
                 "31 October 2026. Add-ons are "
                 "billed as a once-off fee plus 12% per month maintenance. AI and WhatsApp/Meta API "
                 "usage is charged on top of the 12%, tracked monthly and quoted separately. "
                 "Third-party costs (ad spend, gateway fees, premium plugins) are billed at cost. "
                 "Care plan on new builds: minimum 12 months."),
    "company_line": ("Legal", "Company line",
                     "AutoEffortless · D&S Comp · Richards Bay, KwaZulu-Natal"),
}

# the 12% rate is per add-on; WhatsApp/AI items use their quoted monthly
CATEGORY_ORDER = ["Sales & payments", "Bookings & scheduling", "Lead capture & CRM",
                  "Integrations", "AI features", "WhatsApp AI agent", "Growth & marketing",
                  "Basic site care"]


def w(slug):
    return WORDING[slug][2]


def money(value):
    return "R" + f"{value:,}".replace(",", " ")


def monthly_fee(item):
    """Maintenance: explicit override, else 12% of the once-off fee."""
    if item.get("monthly"):
        return item["monthly"]
    if item.get("once"):
        return round(item["once"] * RATE)
    return None


def by_cat(cat, active_only=True):
    rows = [s for s in SERVICES + CARE + BUNDLES if s["cat"] == cat]
    return [s for s in rows if s["active"]] if active_only else rows


def active_systems():
    """Chargeable site systems only (excludes basic care + bundles)."""
    out = []
    for cat in CATEGORY_ORDER:
        if cat in ("Basic site care", "Bundles", "Content & design"):
            continue
        out += by_cat(cat)
    return out


def maint_display(item):
    """What goes in the 'maintenance / month' column."""
    if item.get("maint_label"):
        return item["maint_label"]
    if item.get("once"):
        return f"{int(RATE * 100)}%"
    return ""


def price_display(item):
    """e.g. 'R500 once-off + 12%/mo' / 'R1 500 once-off + 12%/mo + usage'."""
    once = item.get("once")
    if item.get("maint_label"):
        txt = f"{money(once)} once-off + {item['maint_label']}" if once else item["maint_label"]
    elif once:
        txt = f"{money(once)} once-off + {int(RATE * 100)}%/mo"
    else:
        txt = ""
    if item.get("usage"):
        txt += " + usage"
    return txt


if __name__ == "__main__":
    act = active_systems()
    inact = [s for s in SERVICES + CARE + BUNDLES if not s["active"]]
    print(f"{len(act)} ACTIVE chargeable items · {len(inact)} archived (kept for reference)")
    for cat in CATEGORY_ORDER:
        rows = by_cat(cat)
        if rows:
            print(f"\n  {cat}")
            for s in rows:
                print(f"    {s['name']:38} {price_display(s)}")
