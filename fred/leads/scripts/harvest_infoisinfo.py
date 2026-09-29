#!/usr/bin/env python3
"""Harvest Richards Bay business listings from infoisinfo.co.za.

Outputs: leads/raw/infoisinfo_businesses.tsv
Fields: name, category, address, phone, email, website, social, card_url, lat, lon, desc
"""
import re, json, time, html, os, sys, urllib.parse
import ssl, urllib.request

_CTX = ssl.create_default_context()
try:
    import certifi
    _CTX.load_verify_locations(certifi.where())
except Exception:
    pass

BASE = "https://richards-bay.infoisinfo.co.za"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "raw")
os.makedirs(OUT, exist_ok=True)
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"

SEED_SLUGS = """plumber electrician builders building-construction construction building-maintenance cleaning cleaning-service
contractors engineering engineers maintenance maintenance-service security-services security shop automobile car
car-repair panelbeating car-wash tyres towing transport logistics courier removal storage estate-agency estate
finance financial-services investment-services investments business-consulting consulting management accommodation-services
hotel holiday catering restaurant food restaurant-equipment coffee-shop bakery butcher guest-house hotel
hairdresser hair beauty salon barber nail spa massage dentist doctor physiotherapy pharmacy optician veterinary
fitness gym travel printing marketing advertising it-services computer software web-design photography wedding
events driving-school child-care school church retail furniture hardware clothing pet garden landscaping painter
painting tiling roofing carpentry welding aluminium air-conditioning cooling-equipment heating gas plumbing
paving solar electrical power tools laundry dry-cleaning clothing-manufacturers accountant accounting bookkeeping
attorneys legal insurance brokers real-estate property let estate boilermaking steel fabrication signage
upholstery glazier glass mirrors locksmith pest-control fumigation pool shop-fitting""".split()

EXT_CAT = re.compile(r'richards-bay\.infoisinfo\.co\.za/search/([a-z0-9\-]+)')
CARD = re.compile(r'href="(https://richards-bay\.infoisinfo\.co\.za/card/[a-z0-9\-]+/\d+)"')


def get(url, tries=3):
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "en-ZA,en"})
            with urllib.request.urlopen(req, timeout=25, context=_CTX) as r:
                return r.read().decode("utf-8", "ignore")
        except Exception as e:
            if i == tries - 1:
                sys.stderr.write(f"FAIL {url}: {e}\n")
                return ""
            time.sleep(1.5)


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
    name = ""
    addr = ""
    desc = ""
    website = ""
    for b in ld:
        if isinstance(b, dict) and b.get("@type") in ("LocalBusiness", "Organization", "Store", "Restaurant", "ProfessionalService"):
            name = name or (b.get("name") or "")
            desc = desc or (b.get("description") or "")
            if isinstance(b.get("address"), dict):
                a = b["address"]
                addr = addr or ", ".join(str(a.get(k)) for k in ("streetAddress", "addressLocality", "addressRegion", "postalCode") if a.get(k))
            elif isinstance(b.get("address"), str):
                addr = addr or b["address"]
            website = website or (b.get("url") or "") or (b.get("sameAs") or "")
    if not name:
        m = re.search(r'(?is)<h1[^>]*>(.*?)</h1>', h)
        name = html.unescape(re.sub(r'<[^>]+>', ' ', m.group(1))).strip() if m else ""
    txt = plain(h)
    if not addr:
        m = re.search(r'Address\s+(.{5,160}?)\s*(?:Show map|Map not available|Comments)', txt)
        if m:
            addr = m.group(1).strip()
    # phone
    phones = []
    m = re.search(r'Remember you found this company at Infoisinfo\s*([0-9 +\-]{6,20})', txt)
    if m:
        phones.append(m.group(1).strip())
    for p in re.findall(r'\b0\d{2}[\s\-]?\d{3}[\s\-]?\d{4}\b', txt + " " + desc):
        if p not in phones:
            phones.append(p)
    for p in re.findall(r'\b0\d{9}\b', txt + " " + desc):
        if p not in phones:
            phones.append(p)
    # email
    emails = sorted(set(re.findall(r'[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}', txt)))
    emails = [e for e in emails if "infoisinfo" not in e.lower()]
    # external links (website candidates)
    sites = []
    for m in re.finditer(r'href="(https?://[^"]+)"', h):
        u = m.group(1)
        low = u.lower()
        if any(x in low for x in ["infoisinfo", "cloudfront", "google.com/maps", "youtube", "gstatic",
                                   "w3.org", "schema.org", "google-analytics", "googletagmanager",
                                   "facebook.com/sharer", "twitter.com/intent", "linkedin.com/share",
                                   "whatsapp.com/send", "apple.com", "goo.gl/maps", "maps.google"]):
            continue
        sites.append(u)
    social = [u for u in sites if any(x in u.lower() for x in ["facebook.com", "instagram.com", "twitter.com", "tiktok.com", "linkedin.com"]) and "share" not in u.lower()]
    site = [u for u in sites if u not in social]
    lat = lon = ""
    m = re.search(r'google\.com/maps/search/\?api=1&query=(-?\d+\.\d+),(-?\d+\.\d+)', h)
    if m:
        lat, lon = m.group(1), m.group(2)
    return {
        "name": name.strip(),
        "category": cat,
        "address": addr.strip(),
        "phone": "; ".join(phones[:3]),
        "email": "; ".join(emails[:2]),
        "website": site[0] if site else "",
        "social": social[0] if social else "",
        "card_url": url,
        "lat": lat, "lon": lon,
        "desc": desc.strip()[:300],
    }


def main():
    cards = {}   # url -> cat
    cats = set(SEED_SLUGS)
    # discover categories from seed pages
    for c in sorted(cats):
        h = get(f"{BASE}/search/{c}")
        for m in EXT_CAT.finditer(h):
            cats.add(m.group(1))
        time.sleep(0.25)
    sys.stderr.write(f"categories discovered: {len(cats)}\n")
    for c in sorted(cats):
        seen = set()
        for page in range(1, 4):
            url = f"{BASE}/search/{c}" + (f"/{page}" if page > 1 else "")
            h = get(url)
            if not h:
                break
            found = CARD.findall(h)
            new = [u for u in found if u not in seen]
            for u in new:
                seen.add(u)
                cards.setdefault(u, c)
            if not new or 'rel="next"' not in h:
                break
            time.sleep(0.25)
        sys.stderr.write(f"cat {c}: total cards so far {len(cards)}\n")
    sys.stderr.write(f"TOTAL cards: {len(cards)}\n")
    rows = []
    for i, (u, c) in enumerate(cards.items(), 1):
        r = parse_card(u, c)
        if r:
            rows.append(r)
        if i % 25 == 0:
            sys.stderr.write(f"parsed {i}/{len(cards)}\n")
        time.sleep(0.3)
    cols = ["name", "category", "address", "phone", "email", "website", "social", "card_url", "lat", "lon", "desc"]
    with open(os.path.join(OUT, "infoisinfo_businesses.tsv"), "w", encoding="utf-8") as f:
        f.write("\t".join(cols) + "\n")
        for r in rows:
            f.write("\t".join(str(r.get(k, "")).replace("\t", " ").replace("\n", " ") for k in cols) + "\n")
    with open(os.path.join(OUT, "infoisinfo_businesses.json"), "w", encoding="utf-8") as f:
        json.dump(rows, f, indent=1, ensure_ascii=False)
    sys.stderr.write(f"WROTE {len(rows)} rows\n")


if __name__ == "__main__":
    main()
