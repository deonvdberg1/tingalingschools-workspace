#!/bin/bash
# Finish the Richards Bay Google Maps scan (skips queries already done) and rebuild reports.
set -e
cd "$(dirname "$0")/.."
OUT=raw/gmaps_out.jsonl
node scripts/scrape_maps2.mjs raw/queries_kzn.txt "$OUT" 2 40 >> raw/scan.log 2>&1 || true
python3 scripts/compile_gmaps2.py
python3 scripts/gen_report.py
echo "SCAN COMPLETE"
