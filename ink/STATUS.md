# STATUS.md — Where the Manga Project Is Right Now

**Last updated:** 2026-09-13 18:20 SAST · **By:** Ink 🖋️

---

## In one line
Pipeline proven, and now **there is a chapter**: a full original test chapter — *SALT & STATIC* —
written, laid out, lettered, AI-placeholder-art, exported to print PDF + webtoon + brief.
**Awaiting Mr D's verdict.** His real story still replaces mine the moment he sends one.

## What exists and works

| Asset | State |
|---|---|
| Page compositor (`tools/build-page.mjs`) | ✅ + **embedded fonts** + **title-page overlays** |
| Chapter export (`tools/build-chapter.sh`) | ✅ **NEW** — print PDF, webtoon strip, contact sheet, publish |
| Art clean-up (`tools/ingest-art.sh`) | ✅ Working |
| Drawing brief sheets (`tools/make-brief.mjs`) | ✅ Working |
| Page blueprints (`tools/make-blueprints.mjs`) | ✅ Working |
| Free art generation (`tools/gen-art.sh`) | ✅ Working (Pollinations now **rate-limits** — see below) |
| Lettering fonts (`assets/fonts/`) | ✅ **NEW** — Comic Neue, Bangers, Outfit (OFL), base64-inlined |
| Story bible (`bible/`) | 🟢 Drafted for *SALT & STATIC* (proposal, not canon) |
| Chapter scripts (`scripts/ch1-p01..p06`) | 🟢 Drafted — proposal |
| Character sheets (`art/chars/`) | ⬜ still empty |
| Mr D's drawings (`art/incoming/`) | ⬜ Nothing received |

## SALT & STATIC — Ch1 "The 04:40" (test build)
A coastal supernatural one-shot: a teen board-operator answers a call on the station's
dead second line, and the lighthouse that went dark 30 years ago turns back on.
- 6 pages + cover · RTL · B5 · 2400×3500px renders
- **Panel art is AI PLACEHOLDER** (Pollinations/flux) — proof of machinery, *not* the book's art.
  It is declared as such on the cover itself. Mr D draws the real pages.

## Shareable links (Mr D sees these)
- **Print PDF (7 pages):** https://files.autoeffortless.com/manga/SALT-AND-STATIC-ch1-print.pdf
- Webtoon strip (scroll): https://files.autoeffortless.com/manga/SALT-AND-STATIC-ch1-webtoon.jpg
- Contact sheet (all pages at a glance): https://files.autoeffortless.com/manga/SALT-AND-STATIC-ch1-contact-sheet.jpg
- Page 1: https://files.autoeffortless.com/manga/SALT-AND-STATIC-ch1-p01.png
- Page 5 (the lighthouse): https://files.autoeffortless.com/manga/SALT-AND-STATIC-ch1-p05.png
- Drawing brief, page 1: https://files.autoeffortless.com/manga/SALT-AND-STATIC-ch1-p01-drawing-brief.png
- Chapter script (readable): https://files.autoeffortless.com/manga/SALT-AND-STATIC-ch1-script.md

## Decisions locked by Mr D
1. **Manga** — RTL, B5 print. 2. **English.** 3. **He draws, we assemble.** 4. Story TBD by him.

## Open questions for Mr D (ask naturally, don't nag)
1. Paper or digital drawing? 2. Blueprint mode or free mode? 3. Publishing target?
4. Does he want a chapter × art style like this, or a different register entirely?

## Immediate next actions
1. **On his verdict on SALT & STATIC:** keep / change / scrap. Any of the three is a fine answer.
2. **On any drawing arriving:** archive → `ingest-art.sh` → letter a real page. Fastest proof.
3. **On any story material arriving:** bible first, then page scripts, then briefs.

## Environment / gotchas (new this session)
- **Pollinations rate-limits anonymous bursts hard** (HTTP 429). Generate **sequentially** with
  sleep + retry; expect ~1 in 3 requests to fail. ~768px output regardless of requested size —
  upscale (`-filter Lanczos -resize 1536x -unsharp`) before composing.
- **Chromium blocks `file://` @font-face.** Fonts must be inlined as **base64 data URIs**
  (`tools/build-page.mjs` now does this). Verified with a width/difference test.
- Cost to date: **R0**. All local. Hourly git backups cover the studio.
