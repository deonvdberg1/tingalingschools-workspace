#!/usr/bin/env python3
"""Analyse harvested Richards Bay listings: flag who has no website.

Input:  leads/raw/infoisinfo_businesses.tsv
Outputs: leads/out/all_businesses.csv
         leads/out/no_website_candidates.csv
         leads/out/priority_prospects.csv
Also runs DNS checks on generated domain guesses for no-website candidates.
"""
import csv, os, re, socket, sys, concurrent.futures as cf

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, "..", "raw")
OUT = os.path.join(HERE, "..", "out")
os.makedirs(OUT, exist_ok=True)

# national chains / franchises that DO have corporate websites - not prospects
CHAIN = set("""mcdonald mcdonalds kfc nandos debonairs steers roman pizza wimpy spur burger king
pick n pay picknpay shoprite checkers spar superspar woolworths woolies clicks dis-chem dischem
pep ackermans mr price mrp truworths foschini edcon jet pepcell lewis ok furniture russells
buco builders warehouse cashbuild mica ctmetros ctm italtile tile africa hi fi corp incredible
game makro masscash boxer jumbo cash crusaders cash converters nashua vodacom mtn telkom cell c
eskom toyota ford vw volkswagen hyundai nissan isuzu mazda honda kia suzuki gwm haval renault
bmw mercedes audi opel datsun chevrolet engen shell bp total sasol caltex astron sappi mondi
absa fnb nedbank standard bank capitec african bank tyme iemas old mutual sanlam momentum discovery
medicare bonitas fedhealth hollard santam mutual outsurance ackermans postnet pepkor leatherman
galitos chicken licken pedros hungry lion roco mama rocomamas fishaways milky lane starbucks
vida e vida caffè caffe boots crabtree sorbet hookers""".split())

PLACEHOLDER = {"", "n/a", "na", "none", "-", "not available", "no website", "null"}


def slug_domains(name):
    """Two most likely domain guesses from a business name."""
    n = name.lower()
    n = re.sub(r"\(pty\)\s*ltd|pty\.?\s*ltd|cc\b|\(pty\)|inc\b|ltd\b|\bt\.a\.\b|\bt\/a\b", " ", n)
    n = re.sub(r"[^a-z0-9\s]", " ", n)
    words = [w for w in n.split() if w and w not in {"the", "and", "of", "en", "die", "by"}]
    if not words:
        return []
    base = "".join(words)
    hyph = "-".join(words)
    cands = set()
    for b in {base, hyph}:
        if 3 <= len(b) <= 40:
            cands.add(b + ".co.za")
            cands.add(b + ".com")
    return sorted(cands)


def resolves(domainrep):
    dom, label = domainrep
    try:
        socket.getaddrinfo(dom, None)
        return (dom, label, True)
    except Exception:
        return (dom, label, False)


def main():
    src = os.path.join(RAW, "infoisinfo_businesses.tsv")
    if not os.path.exists(src):
        sys.exit("no harvest file yet")
    rows = list(csv.DictReader(open(src, encoding="utf-8"), delimiter="\t"))
    for r in rows:
        r["has_listed_website"] = "no" if r.get("website", "").strip().lower() in PLACEHOLDER else "yes"
        r["has_social"] = "yes" if r.get("social", "").strip() else "no"
        nm = r.get("name", "").lower()
        toks = set(re.findall(r"[a-z]{3,}", re.sub(r"[^a-z0-9 ]", " ", nm)))
        r["likely_chain"] = "yes" if (toks & CHAIN) else "no"
        r["phone_clean"] = re.sub(r"[^0-9+]", "", r.get("phone", ""))[:15]

    # CSV master
    cols = ["name", "category", "address", "phone_clean", "email", "website", "social",
            "has_listed_website", "has_social", "likely_chain", "lat", "lon", "card_url"]
    with open(os.path.join(OUT, "all_businesses.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=cols, extrasaction="ignore")
        w.writeheader()
        for r in sorted(rows, key=lambda x: (x["category"], x["name"])):
            w.writerow(r)

    cands = [r for r in rows if r["has_listed_website"] == "no"]
    # DNS-check only the priority pool: no website, not a chain, has a phone
    pool = [r for r in cands if r["likely_chain"] == "no" and r["phone_clean"]]
    pairs = []
    for r in pool:
        for d in slug_domains(r["name"]):
            pairs.append((d, r["name"]))
    sys.stderr.write(f"candidates: {len(cands)}; dns pool: {len(pool)}; probes: {len(pairs)}\n")
    hits = {}
    socket.setdefaulttimeout(1.5)
    with cf.ThreadPoolExecutor(max_workers=80) as ex:
        for dom, label, ok in ex.map(resolves, pairs):
            if ok:
                hits.setdefault(label, []).append(dom)
    import json as _json
    _json.dump({k: sorted(set(v)) for k, v in hits.items()},
               open(os.path.join(OUT, "dns_hits.json"), "w"), indent=1)
    for r in cands:
        h = hits.get(r["name"], [])
        r["dns_domain_hits"] = "; ".join(sorted(set(h))[:3])
        r["dns_verdict"] = "possible site exists" if h else "no site found"

    ccols = cols + ["dns_domain_hits", "dns_verdict"]
    with open(os.path.join(OUT, "no_website_candidates.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=ccols, extrasaction="ignore")
        w.writeheader()
        for r in sorted(cands, key=lambda x: (x["category"], x["name"])):
            w.writerow(r)

    # priority: no listed website, not a chain, has a phone, no dns site found
    pri = [r for r in cands if r["likely_chain"] == "no" and r["phone_clean"] and not r["dns_domain_hits"]]
    pri.sort(key=lambda x: (x["category"], x["name"]))
    with open(os.path.join(OUT, "priority_prospects.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=ccols, extrasaction="ignore")
        w.writeheader()
        for r in pri:
            w.writerow(r)

    sys.stderr.write(f"total={len(rows)} no_website={len(cands)} priority={len(pri)}\n")
    print(f"total={len(rows)} no_website={len(cands)} priority={len(pri)}")


if __name__ == "__main__":
    main()
