#!/usr/bin/env python3
"""Look up Richards Bay leads in CIPC company records (via the OpenCorporates
mirror of CIPC, since CIPC e-services itself needs a logged-in account).

Usage: python3 cipc_lookup.py [N]     # N = how many leads to sample (default 25)
Output: raw/cipc_lookup.jsonl
"""
import csv, json, os, random, re, subprocess, sys, time, urllib.parse

HERE = os.path.dirname(os.path.abspath(__file__))
CSV = os.path.join(HERE, "..", "..", "products", "leads", "gmaps_no_website_contactable.csv")
OUT = os.path.join(HERE, "..", "raw", "cipc_lookup.jsonl")
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/121 Safari/537.36"


def curl(url, timeout=25):
    r = subprocess.run(["curl", "-s", "-L", "--max-time", str(timeout), "-A", UA, url],
                       capture_output=True, text=True)
    return r.stdout or ""


def search(name):
    url = "https://opencorporates.com/companies/za?q=" + urllib.parse.quote(name)
    html = curl(url)
    hits = re.findall(r'href="(/companies/za/[^"]+)"[^>]*>\s*([^<]{3,90})\s*</a>', html)
    want = set(re.findall(r"[a-z0-9]+", name.lower()))
    best = None
    for href, label in hits:
        lab = set(re.findall(r"[a-z0-9]+", label.lower()))
        score = len(want & lab) / max(1, len(want))
        if score >= 0.6 and (best is None or score > best[0]):
            best = (score, label.strip(), href)
    if not best:
        return None
    _, label, href = best
    page = curl("https://opencorporates.com" + href)
    txt = re.sub(r"<[^>]+>", " ", re.sub(r"<script.*?</script>", " ", page, flags=re.S))
    txt = " ".join(txt.split())
    num = re.search(r"Company Number ([\w\-\/]+)", txt)
    status = re.search(r"Status ([A-Za-z/ ]{3,40}?)(?: Incorporation| Company Type| Jurisdiction)", txt)
    addr = re.search(r"Registered Address (.{10,160}?)(?: South Africa| Data source| Last update)", txt)
    return {"match": label, "number": num.group(1) if num else "",
            "status": status.group(1).strip() if status else "",
            "address": addr.group(1).strip() if addr else "", "url": "https://opencorporates.com" + href}


def main():
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 25
    rows = list(csv.DictReader(open(CSV, encoding="utf-8")))
    random.seed(42)
    sample = random.sample(rows, min(n, len(rows)))
    found = 0
    with open(OUT, "w", encoding="utf-8") as fh:
        for i, r in enumerate(sample, 1):
            res = search(r["name"])
            rec = {"lead": r["name"], "phone": r["phone"], "category": r["category"], "cipc": res}
            fh.write(json.dumps(rec, ensure_ascii=False) + "\n")
            if res:
                found += 1
                print(f"{i:3}/{len(sample)} ✓ {r['name'][:38]:38} → {res['match'][:34]:34} {res['number']:16} {res['status'][:22]}")
            else:
                print(f"{i:3}/{len(sample)} · {r['name'][:38]:38} → no company match", flush=True)
            time.sleep(2.5)
    print(f"\nCIPC match rate: {found}/{len(sample)} = {found/len(sample)*100:.0f}%")


if __name__ == "__main__":
    main()
