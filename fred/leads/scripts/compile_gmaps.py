#!/usr/bin/env python3
"""Compile Google Maps scrape results into the answer set: Richards Bay area
businesses with NO website."""
import json, csv, os, re, sys, collections

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, "..", "raw")
OUT = os.path.join(HERE, "..", "out")
os.makedirs(OUT, exist_ok=True)

# Richards Bay + Meerensee + Arboretum + Empangeni + surrounds
BBOX = (-29.10, -28.55, 31.75, 32.35)  # S, N, W, E
AREAS = re.compile(r"richards\s*bay|meerensee|meer en see|arboretum|empangeni|brackenham|veldrift|birdswood|"
                   r"alton|aqh|umhlathuze|kwambonambi|nseleni|engele|felixton|port shepstone|john ross|"
                   r"mandini|mtunzini|grootvlei|vulindlela|esikhawini|kwa\s*madlanga|river view", re.I)


def main():
    rows = []
    p = os.path.join(RAW, "gmaps_out.jsonl")
    # also fold in the earlier test file if present
    for f in (p, os.path.join(RAW, "test_out.jsonl")):
        if not os.path.exists(f):
            continue
        for line in open(f, encoding="utf-8", errors="ignore"):
            line = line.strip()
            if not line:
                continue
            try:
                rows.append(json.loads(line))
            except Exception:
                pass
    seen = {}
    for r in rows:
        key = r.get("place_url") or (r.get("name", "") + r.get("phone", ""))
        if key in seen:
            if not seen[key].get("website") and r.get("website"):
                seen[key] = r
            continue
        seen[key] = r
    rows = list(seen.values())

    def in_area(r):
        try:
            la, lo = float(r.get("lat") or 0), float(r.get("lon") or 0)
        except Exception:
            la = lo = 0
        if la and lo and BBOX[0] <= la <= BBOX[1] and BBOX[2] <= lo <= BBOX[3]:
            return True
        return bool(AREAS.search(r.get("address", "") + " " + r.get("query", "")))

    rows = [r for r in rows if in_area(r) and not r.get("permanently")]
    for r in rows:
        r["has_website"] = "yes" if r.get("website", "").strip() else "no"
        r["phone"] = r.get("phone", "").strip()
        r["status"] = "permanently closed" if r.get("permanently") else ("temporarily closed" if r.get("temporarily") else "open")

    cols = ["name", "category", "address", "phone", "has_website", "website", "rating", "reviews",
            "status", "lat", "lon", "query", "place_url"]
    with open(os.path.join(OUT, "gmaps_all_businesses.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=cols, extrasaction="ignore")
        w.writeheader()
        for r in sorted(rows, key=lambda x: (x.get("category", ""), x.get("name", ""))):
            w.writerow(r)

    noweb = [r for r in rows if r["has_website"] == "no"]
    with open(os.path.join(OUT, "gmaps_no_website.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=cols, extrasaction="ignore")
        w.writeheader()
        for r in sorted(noweb, key=lambda x: (x.get("category", ""), x.get("name", ""))):
            w.writerow(r)

    withphone = [r for r in noweb if r["phone"]]
    with open(os.path.join(OUT, "gmaps_no_website_contactable.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=cols, extrasaction="ignore")
        w.writeheader()
        for r in sorted(withphone, key=lambda x: (x.get("category", ""), x.get("name", ""))):
            w.writerow(r)

    print(f"raw={len(rows)} with_website={len(rows)-len(noweb)} NO_website={len(noweb)} no_web_with_phone={len(withphone)}")
    print("\nNo-website businesses by category:")
    for c, n in collections.Counter(r["category"] for r in noweb).most_common(40):
        print(f"  {c:38} {n}")


if __name__ == "__main__":
    main()
