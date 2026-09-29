#!/usr/bin/env python3
"""Generate the deliverable report (markdown + HTML) from the Google Maps results."""
import csv, os, html, collections, datetime

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "out")
PUB = os.path.join(HERE, "..", "..", "products", "leads")


def read(name):
    p = os.path.join(OUT, name)
    return list(csv.DictReader(open(p, encoding="utf-8"))) if os.path.exists(p) else []


def main():
    allb = read("gmaps_all_businesses.csv")
    noweb = read("gmaps_no_website.csv")
    contact = read("gmaps_no_website_contactable.csv")
    today = datetime.date.today().isoformat()

    by_cat = collections.Counter(r["category"] or "Uncategorised" for r in contact)
    total = len(allb)
    nw = len(noweb)
    nc = len(contact)
    pct = (nw / total * 100) if total else 0

    def esc(x):
        return html.escape((x or "")).replace("\n", " ")

    # markdown
    md = [f"# Richards Bay businesses without a website — Google Maps scan",
          f"",
          f"**Generated:** {today} · **Source:** Google Maps business listings (Richards Bay & surrounds)",
          f"",
          f"## Headline numbers",
          f"",
          f"- Businesses scanned (Google Maps profiles): **{total}**",
          f"- With **no website** on their Google profile: **{nw}** ({pct:.0f}%)",
          f"- No website **and** a phone number (ready to contact): **{nc}**",
          f"",
          f"## No-website businesses by industry",
          f"",
          "| Industry | Businesses w/o website |",
          "|---|---|"]
    for c, n in by_cat.most_common(40):
        md.append(f"| {c} | {n} |")
    md += ["", "## Full list (no website + contactable)", "",
           "| # | Business | Industry | Phone | Address | Rating | Google Maps |", "|---|---|---|---|---|---|---|"]
    for i, r in enumerate(contact, 1):
        md.append(f"| {i} | {r['name']} | {r['category']} | {r['phone']} | {r['address']} | "
                  f"{r['rating']}{' (' + r['reviews_n'] + ')' if r['reviews_n'] else ''} | [map]({r['place_url']}) |")
    open(os.path.join(OUT, "Richards-Bay-businesses-without-websites.md"), "w", encoding="utf-8").write("\n".join(md))

    # html
    rows_html = []
    for i, r in enumerate(contact, 1):
        rows_html.append(
            "<tr><td>{i}</td><td><strong>{n}</strong></td><td>{c}</td>"
            "<td class=ph>{p}</td><td>{a}</td><td>{rt}</td>"
            "<td><a href=\"{u}\" target=_blank>map</a></td></tr>".format(
                i=i, n=esc(r["name"]), c=esc(r["category"]), p=esc(r["phone"]),
                a=esc(r["address"]), rt=esc(r["rating"] + (f" ({r['reviews_n']})" if r["reviews_n"] else "")),
                u=esc(r["place_url"])))
    cats_html = "".join(f"<div class=pill><span>{esc(c)}</span><b>{n}</b></div>" for c, n in by_cat.most_common(40))
    doc = f"""<!doctype html><html lang=en><head><meta charset=utf-8>
<meta name=viewport content="width=device-width,initial-scale=1">
<title>Richards Bay businesses without a website</title>
<style>
:root{{--gold:#c8a34e;--gold-deep:#a8863a;--cream:#faf8f3;--ink:#14142a}}
*{{box-sizing:border-box}}
body{{margin:0;font-family:Outfit,system-ui,-apple-system,Segoe UI,sans-serif;background:var(--cream);color:var(--ink)}}
header{{background:linear-gradient(135deg,var(--gold),var(--gold-deep));color:#fff;padding:28px 20px}}
header h1{{margin:0 0 6px;font-size:24px}}
header p{{margin:0;opacity:.95;font-size:14px}}
.wrap{{max-width:1100px;margin:0 auto;padding:18px}}
.cards{{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;margin:18px 0}}
.card{{background:#fff;border:1px solid #eadfc4;border-radius:14px;padding:14px}}
.card b{{display:block;font-size:26px;color:var(--gold-deep)}}
.card span{{font-size:12px;text-transform:uppercase;letter-spacing:.04em;opacity:.7}}
.pill{{display:inline-flex;gap:8px;align-items:center;background:#fff;border:1px solid #eadfc4;border-radius:999px;padding:6px 12px;margin:4px;font-size:13px}}
.pill b{{color:var(--gold-deep)}}
table{{width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;font-size:13px}}
th{{background:#f3ecd9;text-align:left;padding:10px;font-size:12px;text-transform:uppercase;letter-spacing:.03em}}
td{{padding:9px 10px;border-top:1px solid #f0e8d6;vertical-align:top}}
tr:hover td{{background:#fffdf7}}
td.ph{{white-space:nowrap;font-weight:600;color:var(--gold-deep)}}
a{{color:var(--gold-deep)}}
h2{{font-size:16px;margin:26px 0 10px;text-transform:uppercase;letter-spacing:.05em;opacity:.75}}
.tbl-scroll{{overflow-x:auto}}
</style></head><body>
<header><h1>Richards Bay — businesses with no website</h1>
<p>Google Maps scan · {today} · AutoEffortless research</p></header>
<div class=wrap>
<div class=cards>
<div class=card><b>{total}</b><span>businesses scanned</span></div>
<div class=card><b>{nw}</b><span>no website ({pct:.0f}%)</span></div>
<div class=card><b>{nc}</b><span>no website + phone</span></div>
<div class=card><b>{len(by_cat)}</b><span>industries</span></div>
</div>
<h2>By industry</h2><div>{cats_html}</div>
<h2>Full contactable list ({nc})</h2>
<div class=tbl-scroll><table>
<thead><tr><th>#</th><th>Business</th><th>Industry</th><th>Phone</th><th>Address</th><th>Rating</th><th>Maps</th></tr></thead>
<tbody>{''.join(rows_html)}</tbody></table></div>
<p style="font-size:12px;opacity:.6;margin-top:18px">Source: Google Maps business profiles for Richards Bay &amp; surrounds. "No website" = the business profile has no website link. Phone/address as published on Google.</p>
</div></body></html>"""
    os.makedirs(PUB, exist_ok=True)
    for target in (OUT, PUB):
        open(os.path.join(target, "richards-bay-no-website.html"), "w", encoding="utf-8").write(doc)
    # copy CSVs to publish dir
    import shutil
    for f in ("gmaps_no_website_contactable.csv", "gmaps_no_website.csv", "gmaps_all_businesses.csv"):
        if os.path.exists(os.path.join(OUT, f)):
            shutil.copy(os.path.join(OUT, f), os.path.join(PUB, f))
    shutil.copy(os.path.join(OUT, "Richards-Bay-businesses-without-websites.md"), PUB)
    print(f"report written: total={total} no_website={nw} contactable={nc}")
    print("published to", PUB)


if __name__ == "__main__":
    main()
