#!/usr/bin/env python3
"""Threaded Richards Bay harvester (infoisinfo). Rebuilds card list from category
slugs found in the first pass log, then fetches all cards concurrently and streams
results to TSV so progress is never lost."""
import re, json, time, html, os, sys, csv, ssl
import urllib.request
import concurrent.futures as cf

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, "..", "raw")
os.makedirs(RAW, exist_ok=True)
BASE = "https://richards-bay.infoisinfo.co.za"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
CTX = ssl.create_default_context()
try:
    import certifi
    CTX.load_verify_locations(certifi.where())
except Exception:
    pass

CARD = re.compile(r'href="(https://richards-bay\.infoisinfo\.co\.za/card/[a-z0-9\-]+/\d+)"')


def get(url, tries=3):
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "en-ZA,en"})
            with urllib.request.urlopen(req, timeout=30, context=CTX) as r:
                return r.read().decode("utf-8", "ignore")
        except Exception:
            if i == tries - 1:
                return ""
            time.sleep(1.0)
    return ""


def lljson(h):
    out = []
    for m in re.finditer(r'(?is)<script[^>]*application/ld\+json[^>]*>(.*?)</script>', h):
        try:
            out.append(json.loads(m.group(1)))
        except Exception:
            pass
    return out


def plain(h):
    h = re.sub(r'(?is)<(script|style|noscript).*?</\1>', ' ', h)
    t = re.sub(r'(?s)<[^>]+>', ' ', h)
    return html.unescape(re.sub(r'\s+', ' ', t))


def parse_card(url, cat):
    h = get(url)
    if not h:
        return None
    ld = lljson(h)
    name = addr = desc = website = ""
    for b in ld:
        if isinstance(b, dict) and b.get("@type") in ("LocalBusiness", "Organization", "Store", "Restaurant", "ProfessionalService", "FoodEstablishment"):
            name = name or (b.get("name") or "")
            desc = desc or (b.get("description") or "")
            a = b.get("address")
            if isinstance(a, dict):
                addr = addr or ", ".join(str(a.get(k)) for k in ("streetAddress", "addressLocality", "addressRegion", "postalCode") if a.get(k))
            elif isinstance(a, str):
                addr = addr or a
            website = website or (b.get("url") or "")
    if not name:
        m = re.search(r'(?is)<h1[^>]*>(.*?)</h1>', h)
        name = html.unescape(re.sub(r'<[^>]+>', ' ', m.group(1))).strip() if m else ""
    txt = plain(h)
    if not addr:
        m = re.search(r'Address\s+(.{4,160}?)\s*(?:Show map|Map not available|Comments)', txt)
        if m:
            addr = m.group(1).strip()
    phones = []
    m = re.search(r'Remember you found this company at Infoisinfo\s*([0-9 +\-]{6,20})', txt)
    if m:
        phones.append(m.group(1).strip())
    for p in re.findall(r'\b0\d{2}[\s\-]?\d{3}[\s\-]?\d{4}\b', txt + " " + desc):
        if p not in phones:
            phones.append(p)
    emails = sorted({e for e in re.findall(r'[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}', txt) if "infoisinfo" not in e.lower()})
    sites = []
    for m in re.finditer(r'href="(https?://[^"]+)"', h):
        low = m.group(1).lower()
        if any(x in low for x in ["infoisinfo", "cloudfront", "google.com/maps", "youtube", "gstatic", "w3.org",
                                   "schema.org", "google-analytics", "googletagmanager", "facebook.com/sharer",
                                   "twitter.com/intent", "linkedin.com/share", "whatsapp.com/send", "apple.com",
                                   "goo.gl/maps", "maps.google"]):
            continue
        sites.append(m.group(1))
    social = [u for u in sites if any(x in u.lower() for x in ["facebook.com", "instagram.com", "tiktok.com", "twitter.com", "linkedin.com"]) and "share" not in u.lower()]
    site = [u for u in sites if u not in social]
    m = re.search(r'google\.com/maps/search/\?api=1&query=(-?\d+\.\d+),(-?\d+\.\d+)', h)
    lat, lon = (m.group(1), m.group(2)) if m else ("", "")
    return {"name": name.strip(), "category": cat, "address": addr.strip(),
            "phone": "; ".join(phones[:3]), "email": "; ".join(emails[:2]),
            "website": website or (site[0] if site else ""), "social": social[0] if social else "",
            "card_url": url, "lat": lat, "lon": lon, "desc": desc.strip()[:300]}


def main():
    # category slugs from first-pass log + seeds
    slugs = set()
    logp = os.path.join(RAW, "harvest.log")
    if os.path.exists(logp):
        for line in open(logp, encoding="utf-8", errors="ignore"):
            m = re.match(r'cat ([a-z0-9\-]+):', line)
            if m:
                slugs.add(m.group(1))
    seeds = open(os.path.join(HERE, "seed_cats.txt"), encoding="utf-8").read().split()
    slugs |= set(seeds)
    sys.stderr.write(f"categories: {len(slugs)}\n")

    cards = {}
    def crawl(c):
        out = []
        for page in range(1, 4):
            url = f"{BASE}/search/{c}" + (f"/{page}" if page > 1 else "")
            h = get(url)
            if not h:
                break
            found = CARD.findall(h)
            out += [(u, c) for u in found]
            if 'rel="next"' not in h:
                break
        return out

    with cf.ThreadPoolExecutor(max_workers=16) as ex:
        for res in ex.map(crawl, sorted(slugs)):
            for u, c in res:
                cards.setdefault(u, c)
    sys.stderr.write(f"cards discovered: {len(cards)}\n")

    cols = ["name", "category", "address", "phone", "email", "website", "social", "card_url", "lat", "lon", "desc"]
    tsv = os.path.join(RAW, "infoisinfo_businesses.tsv")
    with open(tsv, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=cols, delimiter="\t", extrasaction="ignore")
        w.writeheader()
        done = 0
        with cf.ThreadPoolExecutor(max_workers=16) as ex:
            futs = {ex.submit(parse_card, u, c): u for u, c in cards.items()}
            for fut in cf.as_completed(futs):
                try:
                    r = fut.result()
                except Exception:
                    r = None
                if r:
                    w.writerow(r)
                    f.flush()
                done += 1
                if done % 100 == 0:
                    sys.stderr.write(f"parsed {done}/{len(cards)}\n")
    sys.stderr.write("DONE\n")


if __name__ == "__main__":
    main()
