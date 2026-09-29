#!/usr/bin/env python3
"""Pilot: how many emails can we harvest from the scanned businesses that DO have websites?"""
import csv, re, ssl, sys, time, urllib.request, urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed

CSV = "../products/leads/gmaps_all_businesses.csv"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/121 Safari/537.36"
CTX = ssl.create_default_context(); CTX.check_hostname = False; CTX.verify_mode = ssl.CERT_NONE
EMAIL = re.compile(r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}")
BAD = re.compile(r"(sentry|wixpress|example\.|@example|\.png|\.jpg|\.jpeg|\.gif|\.webp|\.svg|@2x|domain\.com|yourdomain|email\.com|sentry\.io|godaddy|cloudflare|w3\.org)", re.I)
PATHS = ["", "/contact", "/contact-us", "/about", "/about-us", "/kontak"]

def fetch(url, timeout=12):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "text/html"})
        with urllib.request.urlopen(req, timeout=timeout, context=CTX) as r:
            if r.status != 200: return ""
            ct = r.headers.get("Content-Type", "")
            if "html" not in ct and "text" not in ct: return ""
            return r.read(300000).decode("utf-8", "ignore")
    except Exception:
        return ""

def emails_for(row):
    site = row["website"].strip()
    if not site: return row["name"], set()
    if not site.startswith("http"): site = "https://" + site
    base = "{0.scheme}://{0.netloc}".format(urllib.parse.urlparse(site))
    found = set()
    for p in PATHS:
        html = fetch(base + p)
        if not html: continue
        for m in EMAIL.findall(html):
            m = m.strip().strip(".")
            if not BAD.search(m) and len(m) < 60:
                found.add(m.lower())
        if found: break
    return row["name"], found

rows = [r for r in csv.DictReader(open(CSV, encoding="utf-8")) if r.get("website", "").strip()][:40]
print(f"pilot over {len(rows)} businesses with websites")
t0 = time.time(); hits = 0; allmail = {}
with ThreadPoolExecutor(max_workers=8) as ex:
    futs = [ex.submit(emails_for, r) for r in rows]
    for f in as_completed(futs):
        name, mails = f.result()
        if mails:
            hits += 1; allmail[name] = sorted(mails)
print(f"hit rate: {hits}/{len(rows)} = {hits/len(rows)*100:.0f}%  in {time.time()-t0:.0f}s")
for n, m in list(allmail.items())[:10]:
    print(f"  {n}: {', '.join(m[:2])}")
