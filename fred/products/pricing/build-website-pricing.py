#!/usr/bin/env python3
"""Build the AutoEffortless Website Building Service pricing PDF.

All prices and wording come from pricing_data.py (single source of truth —
the pricing spreadsheet is generated from the same file).

MODEL: BASIC = complete content-rich website. ADD-ONS = once-off build fee +
12% per month maintenance. AI / WhatsApp-Meta items = 12% + tracked usage.

Brand-locked per branding/BRAND.md. One Chrome A4 PDF per section, each
asserted to be a single page (so nothing is silently clipped), merged with
pdfunite.

Usage: python3 build-website-pricing.py
"""
import os
import re
import subprocess
import tempfile

import pricing_data as D

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PDFINFO = "/opt/homebrew/bin/pdfinfo"
PDFUNITE = "/opt/homebrew/bin/pdfunite"
PDFTOTEXT = "/opt/homebrew/bin/pdftotext"

HERE = os.path.dirname(os.path.abspath(__file__))
LOGO = os.path.join(HERE, "assets", "logo-print.png")
OUT = os.path.join(HERE, "AutoEffortless-Website-Pricing.pdf")

# which categories share a page (active items only)
ADDON_PAGES = [
    ("Systems that earn you money", ["Sales & payments", "Bookings & scheduling", "Lead capture & CRM"]),
    ("Integrations, AI & extras", ["Integrations", "AI features", "WhatsApp AI agent", "Growth & marketing"]),
]

CSS = """
@page{size:A4;margin:0}
*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
html,body{margin:0;padding:0}
body{font-family:Outfit,system-ui,-apple-system,"Segoe UI",sans-serif;color:#14142a;background:#faf8f3;font-size:10.5pt;line-height:1.5}
.page{width:210mm;height:297mm;padding:13mm 14mm 18mm;background:#faf8f3;position:relative;overflow:hidden}
.head{display:flex;align-items:center;justify-content:space-between;padding-bottom:8px;border-bottom:2px solid #e9d9ae;margin-bottom:14px}
.head img{height:32px}
.head .tag{font-size:8.5pt;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#a8863a}
.hero{background:linear-gradient(135deg,#c8a34e,#a8863a);color:#fff;border-radius:16px;padding:20px 22px;margin-bottom:16px}
.hero h1{margin:0 0 6px;font-size:25pt;line-height:1.1;font-weight:800;letter-spacing:-.01em}
.hero p{margin:0;font-size:11pt;opacity:.95}
.eyebrow{display:inline-block;font-size:8pt;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#a8863a;background:#fbf6ea;border:1px solid rgba(200,163,78,.25);border-radius:999px;padding:3px 10px;margin-bottom:8px}
h2{font-size:13pt;margin:0 0 8px;letter-spacing:-.01em}
h2 .n{color:#a8863a}
h3{margin:10px 0 5px;color:#a8863a;text-transform:uppercase;letter-spacing:.08em;font-size:8.5pt}
.card{background:#fff;border:1px solid #ece9df;border-radius:14px;padding:13px 16px;margin-bottom:10px}
.card.gold{border:1.5px solid #c8a34e;box-shadow:0 8px 24px rgba(168,134,58,.12)}
.price-row{display:flex;align-items:baseline;gap:10px;margin:2px 0 9px}
.price{font-size:29pt;font-weight:800;color:#a8863a;line-height:1}
.price small{font-size:11pt;font-weight:600;color:#35354f}
ul.check{list-style:none;margin:0;padding:0;columns:2;column-gap:22px}
ul.check li{position:relative;padding-left:16px;margin-bottom:3px;font-size:9.5pt;break-inside:avoid}
ul.check li:before{content:"\\2713";position:absolute;left:0;top:0;color:#c8a34e;font-weight:800}
table{width:100%;border-collapse:collapse;background:#fff;border:1px solid #ece9df;border-radius:12px;overflow:hidden;margin-bottom:10px}
th{background:#f3ecd9;text-align:left;padding:5px 10px;font-size:8pt;letter-spacing:.06em;text-transform:uppercase;color:#35354f}
th.r,td.r{text-align:right;white-space:nowrap}
td{padding:4.5px 10px;border-top:1px solid #f0e8d6;font-size:9.5pt;vertical-align:top}
td .p{font-weight:700;color:#a8863a}
td .u{color:#a8863a;font-weight:600}
.two{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.note{font-size:8.5pt;color:#6b6b82;margin:8px 0 0}
.cta{background:linear-gradient(135deg,#c8a34e,#a8863a);color:#fff;border-radius:16px;padding:18px 20px;margin-top:12px}
.cta h2{margin:0 0 6px;color:#fff}
.steps{counter-reset:s;list-style:none;margin:0;padding:0}
.steps li{position:relative;padding:0 0 8px 30px;font-size:10pt}
.steps li:before{counter-increment:s;content:counter(s);position:absolute;left:0;top:1px;width:20px;height:20px;border-radius:50%;background:#c8a34e;color:#fff;font-weight:700;font-size:9pt;text-align:center;line-height:20px}
.foot{position:absolute;left:14mm;right:14mm;bottom:8mm;border-top:1px solid #ece9df;padding-top:6px;font-size:8pt;color:#6b6b82;display:flex;justify-content:space-between}
.glance{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px}
.glance .g{background:#fff;border:1px solid #ece9df;border-radius:12px;padding:12px}
.glance .g b{display:block;font-size:16pt;color:#a8863a;font-weight:800}
.glance .g span{font-size:8.5pt;text-transform:uppercase;letter-spacing:.06em;color:#6b6b82}
"""

TOTAL_PAGES = 2 + len(ADDON_PAGES)        # basic + add-on pages + how-it-works


def head(tag):
    return f"""  <div class="head">
    <img src="file://{LOGO}" alt="AutoEffortless">
    <span class="tag">{tag}</span>
  </div>"""


def foot(n):
    return (f'  <div class="foot"><span>AutoEffortless · Effortless Business Communication'
            f'</span><span>autoeffortless.com · Page {n} of {TOTAL_PAGES}</span></div>')


def price_html(item):
    """Once-off in bold gold, then the maintenance/monthly line."""
    once, monthly = item.get("once"), D.monthly_fee(item)
    if once and monthly:
        html = (f"<span class='p'>{D.money(once)}</span> once-off<br>"
                f"+ {D.money(monthly)}/mo")
    elif once:
        html = f"<span class='p'>{D.money(once)}</span> once-off"
    elif monthly:
        html = f"<span class='p'>{D.money(monthly)}</span>/mo"
    else:
        html = item.get("yearly_range", "")
    if item.get("usage"):
        html += "<br><span class='u'>+ usage (quoted separately)</span>"
    return html


def service_table(categories):
    rows = ['  <table>',
            '    <tr><th>System / service</th><th class="r">Once-off</th>'
            '<th class="r">Maintenance / month</th></tr>']
    for cat in categories:
        for s in D.by_cat(cat):
            once = s.get("once")
            once_html = f"<span class='p'>{D.money(once)}</span>" if once else "—"
            m_html = D.maint_display(s) or "—"
            if s.get("usage"):
                m_html += "<br><span class='u'>+ AI / Meta usage</span>"
            rows.append(f'    <tr><td>{s["name"]}</td><td class="r">{once_html}</td>'
                        f'<td class="r">{m_html}</td></tr>')
    rows.append('  </table>')
    return "\n".join(rows)


PAGES = []

# ---------------------------------------------------------------- page 1 --
basic = D.BASIC
PAGES.append(("p1", f"""<div class="page">
{head("Website Building · Pricing 2026")}
  <div class="hero">
    <h1>{D.w('hero_headline')}</h1>
    <p>{D.w('hero_sub')}</p>
  </div>
  <div class="glance">
    <div class="g"><b>{D.money(basic['setup'])}</b><span>once-off build</span></div>
    <div class="g"><b>{D.money(basic['monthly'])}</b><span>per month care</span></div>
    <div class="g"><b>{basic['yearly_range']}</b><span>per year hosting + domain</span></div>
  </div>
  <span class="eyebrow">{basic['headline']}</span>
  <div class="card gold">
    <div class="price-row"><span class="price">{D.money(basic['setup'])}</span><small>once-off build fee — everything below included</small></div>
    <ul class="check">
      {''.join(f'<li>{i}</li>' for i in basic['includes'])}
    </ul>
  </div>
  <div class="two">
    <div class="card" style="margin-bottom:8px">
      <span class="eyebrow">Care plan</span>
      <div class="price-row"><span class="price">{D.money(basic['monthly'])}</span><small>per month</small></div>
      <p style="margin:0;font-size:9pt">{D.by_cat('Basic site care')[0]['wording']}</p>
    </div>
    <div class="card" style="margin-bottom:8px">
      <span class="eyebrow">Hosting + domain</span>
      <div class="price-row"><span class="price">{basic['yearly_range']}</span><small>per year</small></div>
      <p style="margin:0;font-size:9pt">{D.by_cat('Basic site care')[1]['wording']}</p>
    </div>
  </div>
  <div class="card" style="background:#fbf6ea;border-color:#e9d9ae;margin-bottom:0">
    <strong>How add-on pricing works.</strong>
    <span style="font-size:9.5pt">{D.w('addon_model')} {D.w('usage_rule')}</span>
    <p class="note">Minimum 12-month care plan on new builds. All prices in South African Rand (ZAR).</p>
  </div>
{foot(1)}
</div>"""))

# ------------------------------------------------------- add-on pages ----
page_no = 1
for idx, (title, cats) in enumerate(ADDON_PAGES):
    page_no += 1
    blocks = []
    for cat in cats:
        if not D.by_cat(cat):
            continue
        blocks.append(f"  <h3>{cat}</h3>")
        blocks.append(service_table([cat]))
    body = "\n".join(blocks)
    intro = ("  <p style=\"margin:0 0 8px;font-size:9.5pt;color:#35354f\">Everything below is optional "
             "and can be switched on at any time. Once-off build fee, then "
             "<strong>12% of that fee per month</strong> for maintenance — no other monthly charges.</p>"
             if idx == 0 else "")
    card = ""
    if idx == len(ADDON_PAGES) - 1:
        card = ("\n  <div class=\"card\" style=\"background:#fbf6ea;border-color:#e9d9ae\">"
                "<strong>AI &amp; WhatsApp usage.</strong> "
                f"<span style=\"font-size:9.5pt\">{D.w('usage_rule')}</span></div>")
    PAGES.append((f"addon{idx + 1}", f"""<div class="page">
{head(title)}
  <h2><span class="n">0{idx + 1}.</span> {title}</h2>
{intro}
{body}{card}
{foot(page_no)}
</div>"""))

# ------------------------------------------------------- how it works ---
steps = "\n".join(
    f'        <li><strong>{D.w(f"step{i}").split(" — ")[0]}</strong> — '
    f'{" — ".join(D.w(f"step{i}").split(" — ")[1:])}</li>' for i in range(1, 6))

page_no += 1
PAGES.append(("how", f"""<div class="page">
{head("How it works & questions")}
  <div class="two">
    <div class="card">
      <span class="eyebrow">How it works</span>
      <ol class="steps" style="margin-top:6px">
{steps}
      </ol>
    </div>
    <div class="card">
      <span class="eyebrow">Common questions</span>
      <p style="margin:0 0 8px;font-size:9.5pt"><strong>Do I own the site and domain?</strong> {D.w('ownership')}</p>
      <p style="margin:0 0 8px;font-size:9.5pt"><strong>Can I edit it myself?</strong> {D.w('editing')}</p>
      <p style="margin:0 0 8px;font-size:9.5pt"><strong>Why not build it myself on Wix?</strong> {D.w('why_not_diy')}</p>
      <p style="margin:0 0 8px;font-size:9.5pt"><strong>What does maintenance cover?</strong> Monitoring, updates, security, support and fixes for every system you've added — that's the 12%.</p>
      <p style="margin:0;font-size:9.5pt"><strong>Do I pay for anything else?</strong> Only AI and WhatsApp usage, which is tracked monthly and quoted separately.</p>
    </div>
  </div>
  <div class="cta">
    <h2>{D.w('cta_headline')}</h2>
    <p style="margin:0 0 8px;font-size:10.5pt">{D.w('cta_body')}</p>
    <p style="margin:0;font-size:10pt"><strong>{D.w('contact_line')}</strong></p>
  </div>
  <p class="note">{D.w('footnote')} {D.w('company_line')}.</p>
{foot(page_no)}
</div>"""))


def render(tmpdir):
    parts, ok = [], True
    for name, body in PAGES:
        html = (f'<!doctype html><html lang="en"><head><meta charset="utf-8">'
                f'<title>AutoEffortless — Website Building Service &amp; Pricing</title>'
                f'<link rel="preconnect" href="https://fonts.googleapis.com">'
                f'<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800&display=swap" rel="stylesheet">'
                f'<style>{CSS}</style></head><body>{body}</body></html>')
        hpath = os.path.join(tmpdir, f"{name}.html")
        ppath = os.path.join(tmpdir, f"{name}.pdf")
        with open(hpath, "w", encoding="utf-8") as fh:
            fh.write(html)
        subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--no-sandbox",
                        "--no-pdf-header-footer", "--virtual-time-budget=8000",
                        f"--print-to-pdf={ppath}", f"file://{hpath}"],
                       check=True, capture_output=True)
        info = subprocess.run([PDFINFO, ppath], capture_output=True, text=True).stdout
        pages = int([l for l in info.splitlines() if l.startswith("Pages:")][0].split()[-1])
        print(f"  [{'ok ' if pages == 1 else 'OVERFLOW'}] {name}: {pages} page(s)")
        ok = ok and pages == 1
        parts.append(ppath)
    subprocess.run([PDFUNITE, *parts, OUT], check=True)
    info = subprocess.run([PDFINFO, OUT], capture_output=True, text=True).stdout
    print("merged ->", OUT)
    print("  " + " | ".join(l.strip() for l in info.splitlines() if l.startswith(("Pages:", "Page size:"))))
    return ok


if __name__ == "__main__":
    with tempfile.TemporaryDirectory() as tmp:
        render(tmp)
    txt = subprocess.run([PDFTOTEXT, OUT, "-"], capture_output=True, text=True).stdout
    flat = " ".join(txt.split())          # line-wrap tolerant
    checks = [D.w("hero_headline"), "Cancel anytime", "Live within 5 working days",
              "AI Editor", "Full store with payment portal", "Venue reservations",
              "Simple CRM dashboard", "WhatsApp Business API setup", "Multi-language agent",
              "Campaign landing page", "AI & WhatsApp usage", "12%", "+ AI / Meta usage",
              D.w("cta_headline"), "Richards Bay, KwaZulu-Natal"]
    print("\ncontent check:")
    missing = [s for s in checks if " ".join(s.split()) not in flat]
    for s in checks:
        print(f"  [{'ok ' if ' '.join(s.split()) in flat else 'MISSING'}] {s}")

    # archived items must NOT appear
    gone = ["Gift cards", "Local Starter", "Care Pro", "Monthly SEO management",
            "Extra page", "Deposit-required bookings", "Quote-to-payment",
            "R999", "R300/mo", "R150/mo"]
    leaks = [s for s in gone if " ".join(s.split()) in flat]
    for s in gone:
        print(f"  [{'LEAK' if ' '.join(s.split()) in flat else 'ok (removed)'}] {s}")
    print("\nRESULT:", "PASS" if not missing and not leaks else f"missing={missing} leaks={leaks}")
