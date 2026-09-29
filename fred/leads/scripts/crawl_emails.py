#!/usr/bin/env python3
"""Harvest public emails from the websites of scanned businesses.

Reads products/leads/gmaps_all_businesses.csv (name/website), fetches the site
(home, /contact, /about …), extracts mailto/public emails, writes JSONL:
  {"name":..., "website":..., "emails":[...]}
Resumable: skips names already in the output file.
"""
import csv, json, os, re, ssl, sys, time, urllib.parse, urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed

HERE = os.path.dirname(os.path.abspath(__file__))
CSV = os.path.join(HERE, "..", "..", "products", "leads", "gmaps_all_businesses.csv")
OUT = os.path.join(HERE, "..", "raw", "emails_by_website.jsonl")
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/121 Safari/537.36"
CTX = ssl.create_default_context(); CTX.check_hostname = False; CTX.verify_mode = ssl.CERT_NONE
EMAIL = re.compile(r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}")
BAD = re.compile(r"(sentry|wixpress|example\.|@example|\.png|\.jpg|\.jpeg|\.gif|\.webp|\.svg|@2x|domain\.com|"
                 r"yourdomain|your-?email|email\.com|sentry\.io|godaddy|cloudflare|w3\.org|\.js|\.css|"
                 r"schema\.org|sitemap@|wix\.com|squarespace)", re.I)
PATHS = ["", "/contact", "/contact-us", "/contact.html", "/about", "/about-us", "/kontak", "/kontak-ons"]


def fetch(url, timeout=12):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "text/html"})
        with urllib.request.urlopen(req, timeout=timeout, context=CTX) as r:
            if r.status != 200:
                return ""
            ct = r.headers.get("Content-Type", "")
            if "html" not in ct and "text" not in ct:
                return ""
            return r.read(400000).decode("utf-8", "ignore")
    except Exception:
        return ""


def emails_for(row):
    site = (row.get("website") or "").strip()
    if not site:
        return {"name": row["name"], "website": "", "emails": []}
    if not site.startswith("http"):
        site = "https://" + site
    base = "{0.scheme}://{0.netloc}".format(urllib.parse.urlparse(site))
    found = set()
    for p in PATHS:
        html = fetch(base + p)
        if not html:
            continue
        for m in EMAIL.findall(html):
            m = m.strip().strip(".")
            if not BAD.search(m) and 6 < len(m) < 60:
                found.add(m.lower())
    return {"name": row["name"], "website": site, "emails": sorted(found)}


def main():
    rows = [r for r in csv.DictReader(open(CSV, encoding="utf-8")) if (r.get("website") or "").strip()]
    done = set()
    if os.path.exists(OUT):
        for line in open(OUT, encoding="utf-8"):
            try:
                done.add(json.loads(line)["name"])
            except Exception:
                pass
    todo = [r for r in rows if r["name"] not in done]
    print(f"{len(rows)} with websites · {len(done)} done · {len(todo)} to go", flush=True)
    t0, hits = time.time(), 0
    with open(OUT, "a", encoding="utf-8") as fh, ThreadPoolExecutor(max_workers=12) as ex:
        futs = {ex.submit(emails_for, r): r for r in todo}
        for i, f in enumerate(as_completed(futs), 1):
            try:
                res = f.result()
            except Exception:
                continue
            if res["emails"]:
                hits += 1
            fh.write(json.dumps(res, ensure_ascii=False) + "\n")
            if i % 50 == 0:
                fh.flush()
                print(f"  {i}/{len(todo)} · {hits} with email · {time.time()-t0:.0f}s", flush=True)
    print(f"done: {hits} hits of {len(todo)} in {time.time()-t0:.0f}s", flush=True)


if __name__ == "__main__":
    main()
