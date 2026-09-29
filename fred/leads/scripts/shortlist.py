#!/usr/bin/env python3
"""Build a curated shortlist of high-value 'no website' prospects for verification."""
import csv, os, re, json

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "out")

HIGH = {
    "accommodation-services": 4, "catering": 4, "restaurant": 4, "food": 3,
    "builders": 4, "building-construction": 4, "construction": 3, "construction-services": 3,
    "plumber": 4, "plumbing": 4, "electrician": 4, "electrical": 4, "cleaning": 3, "cleaning-service": 3,
    "automobile": 3, "autos": 3, "car": 3, "car-repair": 4, "panelbeating": 4,
    "hairdresser": 4, "hair": 4, "beauty": 4, "salon": 4, "barber": 4,
    "dentist": 4, "doctor": 3, "physiotherapy": 4, "veterinary": 4, "pharmacy": 2,
    "engineering-services": 3, "engineers": 3, "accounting": 3, "bookkeeping": 3, "attorneys": 2,
    "estate": 2, "estate-agency": 3, "security-services": 4, "landscaping": 4, "garden": 3,
    "painting": 4, "painter": 4, "roofing": 4, "tiling": 4, "aluminium": 4, "air-conditioning": 4,
    "solar": 4, "welding": 3, "pest-control": 4, "locksmith": 4, "photography": 4, "printing": 3,
    "driving-school": 4, "child-care": 4, "creche": 4, "school": 3, "transport": 3, "courier": 3,
    "guest-house": 4, "hotel": 3, "travel": 3, "fitness": 3, "gym": 3, "spa": 4,
}

BAD_NAME = re.compile(r"(pty|ltd|\(pty\)|cc\b|enterprise|trading|projects|multi-?services|general services|investment|holdings|construction$|supplies$)", re.I)


def main():
    rows = list(csv.DictReader(open(os.path.join(OUT, "noonly.csv" if False else "no_website_candidates.csv"), encoding="utf-8")))
    dns = json.load(open(os.path.join(OUT, "dns_hits.json")))
    cands = []
    for r in rows:
        if r["likely_chain"] == "yes":
            continue
        if r["name"].strip() in dns:
            continue
        score = HIGH.get(r["category"], 0)
        if score == 0:
            continue
        s = score
        if re.search(r"\d", r.get("address", "")):
            s += 2
        if r.get("email"):
            s += 3
        if len(r.get("desc", "")) > 60:
            s += 2
        if BAD_NAME.search(r["name"]):
            s -= 4
        if len(r["name"]) > 45:
            s -= 2
        cands.append((s, r))
    cands.sort(key=lambda x: (-x[0], x[1]["category"], x[1]["name"]))
    seen = set()
    picked = []
    for s, r in cands:
        key = re.sub(r"[^a-z0-9]", "", r["name"].lower())
        if key in seen:
            continue
        seen.add(key)
        picked.append(r)
        if len(picked) >= 90:
            break
    with open(os.path.join(OUT, "shortlist.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(picked[0].keys()))
        w.writeheader()
        for r in picked:
            w.writerow(r)
    print(f"shortlist: {len(picked)}")
    for r in picked:
        print(f"  {r['category'][:20]:20} | {r['name'][:42]:42} | {r['phone_clean'][:12]}")


if __name__ == "__main__":
    main()
