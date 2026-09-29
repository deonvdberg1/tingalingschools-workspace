#!/usr/bin/env python3
"""Compile Google Maps results (both scrape formats) into the answer set."""
import json, csv, os, re, collections, glob

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, "..", "raw")
OUT = os.path.join(HERE, "..", "out")
EXTRA_DIRS = ["/tmp/gms"]
os.makedirs(OUT, exist_ok=True)

AREA = re.compile(r"richards\s*bay|meerensee|meer en see|arboretum|empangeni|brackenham|veldrift|birdswood|"
                  r"alton|umhlathuze|kwambonambi|nseleni|engele|felixton|john ross|mtunzini|esikhawini|"
                  r"riverside|wildenweide|aquhuba|mandlazini|meerensee|birdwood|kosibay|grootvlei", re.I)
BBOX = (-29.15, -28.50, 31.70, 32.40)


def load_all():
    rows = []
    pats = [os.path.join(RAW, "*.jsonl")] + [os.path.join(d, "*.jsonl") for d in EXTRA_DIRS]
    for pat in pats:
        for f in glob.glob(pat):
            for line in open(f, encoding="utf-8", errors="ignore"):
                line = line.strip()
                if not line:
                    continue
                try:
                    rows.append(json.loads(line))
                except Exception:
                    pass
    return rows


def main():
    rows = load_all()
    clean = {}
    for r in rows:
        name = (r.get("name") or "").strip()
        if not name:
            continue
        if re.search(r"^(sponsored|ads?)$", name, re.I):
            continue
        addr = (r.get("address") or "").strip()
        key = re.sub(r"[^a-z0-9]", "", name.lower())[:34]
        if key in clean:
            # prefer record that has a website (positive signal) or phone
            a, b = clean[key], r
            if not a.get("website") and b.get("website"):
                clean[key] = b
            elif not a.get("phone") and b.get("phone"):
                clean[key] = b
            continue
        r["name"] = name
        r["address"] = addr
        clean[key] = r
    rows = list(clean.values())

    def in_area(r):
        try:
            la, lo = float(r.get("lat") or 0), float(r.get("lon") or 0)
        except Exception:
            la = lo = 0
        if la and lo and BBOX[0] <= la <= BBOX[1] and BBOX[2] <= lo <= BBOX[3]:
            return True
        txt = (r.get("address", "") + " " + r.get("city", "") + " " + r.get("suburb", "") + " " + r.get("query", ""))
        return bool(AREA.search(txt))

    rows = [r for r in rows if in_area(r) and not r.get("permanently")]
    for r in rows:
        r["has_website"] = "yes" if (r.get("website") or "").strip() else "no"
        r["phone"] = (r.get("phone") or "").strip()
        r["reviews_n"] = re.sub(r"[^0-9]", "", str(r.get("reviews", "")))
        r["status"] = "temporarily closed" if r.get("temporarily") else "open"

    cols = ["name", "category", "address", "suburb", "city", "phone", "has_website", "website",
            "rating", "reviews_n", "status", "lat", "lon", "query", "place_url"]
    def dump(rows_, fn):
        with open(os.path.join(OUT, fn), "w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=cols, extrasaction="ignore")
            w.writeheader()
            for r in sorted(rows_, key=lambda x: (x.get("category", ""), x.get("name", ""))):
                w.writerow(r)

    dump(rows, "gmaps_all_businesses.csv")
    noweb = [r for r in rows if r["has_website"] == "no"]
    dump(noweb, "gmaps_no_website.csv")
    contact = [r for r in noweb if r["phone"]]
    dump(contact, "gmaps_no_website_contactable.csv")

    print(f"businesses={len(rows)} with_website={len(rows)-len(noweb)} NO_WEBSITE={len(noweb)} no_web_with_phone={len(contact)}")
    print("\n-- no-website by category --")
    for c, n in collections.Counter(r.get("category", "?") for r in noweb).most_common(60):
        print(f"  {c:34} {n}")


if __name__ == "__main__":
    main()
