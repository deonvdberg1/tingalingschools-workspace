#!/usr/bin/env python3
"""Add an Email column to the live Google Sheet lead tabs.

Sources: website crawl (raw/emails_by_website.jsonl), the infoisinfo directory
harvest (raw/infoisinfo_businesses.tsv) and emails that came with the Google
listing export. Matches by name (normalised) then by phone (digits).
"""
import csv, json, os, re, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
SHEET = "1uqB9KJISKqfX-89czCZPGpVQOEDN-DCm_usjr2Yzqoc"
PL = os.path.join(HERE, "..", "..", "products", "leads")
RAW = os.path.join(HERE, "..", "raw")
EMAIL_RE = re.compile(r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}")

TABS = [
    ("No website + phone (660)", "gmaps_no_website_contactable.csv"),
    ("No website (711)", "gmaps_no_website.csv"),
    ("All scanned (1409)", "gmaps_all_businesses.csv"),
]


def norm_name(s):
    s = (s or "").lower()
    s = re.sub(r"\(pty\)|pty|ltd|cc|\binc\b|&\s*sons", " ", s)
    s = re.sub(r"[^a-z0-9]+", " ", s)
    return " ".join(s.split())


def norm_phone(p):
    d = re.sub(r"\D", "", p or "")
    return d[-9:] if len(d) >= 9 else ""


crawl = {}
if os.path.exists(f"{RAW}/emails_by_website.jsonl"):
    for line in open(f"{RAW}/emails_by_website.jsonl", encoding="utf-8"):
        try:
            r = json.loads(line)
        except Exception:
            continue
        if r.get("emails"):
            crawl[norm_name(r["name"])] = (r["emails"], "website")

dir_by_name, dir_by_phone = {}, {}
if os.path.exists(f"{RAW}/infoisinfo_businesses.tsv"):
    with open(f"{RAW}/infoisinfo_businesses.tsv", encoding="utf-8") as fh:
        for row in csv.DictReader(fh, delimiter="\t"):
            mails = EMAIL_RE.findall(row.get("email", "") or "")
            if not mails:
                continue
            dir_by_name.setdefault(norm_name(row.get("name")), (mails, "directory"))
            ph = norm_phone(row.get("phone"))
            if ph:
                dir_by_phone.setdefault(ph, (mails, "directory"))

print(f"crawl: {len(crawl)} businesses with email · directory: {len(dir_by_name)} names / {len(dir_by_phone)} phones")

results, summary = {}, {}
for tab, csv_name in TABS:
    rows = list(csv.DictReader(open(os.path.join(PL, csv_name), encoding="utf-8")))
    col = [["Email"]]
    hits = 0
    for r in rows:
        mails, src = [], ""
        key = norm_name(r.get("name"))
        if key in crawl:
            mails, src = crawl[key]
        elif key in dir_by_name:
            mails, src = dir_by_name[key]
        elif norm_phone(r.get("phone")) in dir_by_phone:
            mails, src = dir_by_phone[norm_phone(r["phone"])]
        elif EMAIL_RE.search(r.get("email", "") or ""):
            mails, src = EMAIL_RE.findall(r["email"]), "listing"
        val = "; ".join(dict.fromkeys(mails)) if mails else ""
        if val:
            hits += 1
        col.append([val])
    results[tab] = col
    summary[tab] = (len(rows), hits)
    print(f"  {tab}: {hits}/{len(rows)} with email ({hits/len(rows)*100:.0f}%)")

if "--write" in sys.argv:
    for tab, col in results.items():
        out = subprocess.run(["gog", "sheets", "update", SHEET, f"'{tab}'!K1:K{len(col)}",
                              "--values-json", json.dumps(col), "--input", "USER_ENTERED",
                              "--account", "info@autoeffortless.com", "--no-input", "--json"],
                             capture_output=True, text=True)
        ok = out.returncode == 0
        print(("ok  " if ok else "ERR ") + tab, (out.stdout or out.stderr).strip()[:110])
else:
    print("(dry run — pass --write to update the sheet)")
