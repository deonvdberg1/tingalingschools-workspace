# HEARTBEAT.md — Ink's Standing Checks

Run lightly. This studio has no servers; there is nothing to babysit. Check only what matters.

## Every session start
- Status of the project: read `STATUS.md` (keep it current — it is the single source of truth).
- `ls -la art/incoming/` — anything Mr D sent that has not been processed?
- Anything in `output/` older than the latest spec that looks stale?

## When Mr D sends a drawing
- Archive the original to `art/incoming/` with a clear name (never modify the original file).
- Run `tools/ingest-art.sh`, show him the result, then place it on a page.

## When tools or machine change
- Smoke test: `node tools/build-page.mjs scripts/ch1-p01.page.json /tmp/smoke.png` — must produce a PNG.
- `magick identify` the output; if it is not ~2400x3500 for a B5 page grid, something broke.

## Keep an eye on
- Workspace backup (git) — the studio is inside the workspace repo, committed hourly.
- Disk space on the Mac mini (large page PNGs add up; `output/` should stay tidy).
