# STATUS.md — Where the Manga Project Is Right Now

**Last updated:** 2026-09-13 17:25 SAST · **Handover:** from Fred → Ink, same day

---

## In one line
The production studio is **built and proven end to end**. The **story does not exist yet** — Mr D is
writing it. Nothing is waiting on us except to be ready to catch his first idea.

## What exists and works

| Asset | State |
|---|---|
| Page compositor (`tools/build-page.mjs`) | ✅ Working — verified 2400×3500px RTL page |
| Art clean-up (`tools/ingest-art.sh`) | ✅ Working — 3 modes, tuned, stress-tested |
| Drawing brief sheets (`tools/make-brief.mjs`) | ✅ Working — labels + exact panel ratios |
| Page blueprints (`tools/make-blueprints.mjs`) | ✅ Working — 5 standard B5 layouts |
| Free art generation (`tools/gen-art.sh`) | ✅ Working — placeholders / style tests only |
| Story bible (`bible/`) | ⬜ Empty — waiting on Mr D's story |
| Chapter scripts (`scripts/`) | 🟡 One demo spec only (`ch1-p01.page.json`) |
| Character sheets (`art/chars/`) | ⬜ Empty |
| Mr D's drawings (`art/incoming/`) | ⬜ Nothing received yet |

## Proof artifacts (shareable links)
- Finished sample page (4 panels, lettered, print res): https://files.autoeffortless.com/manga/demo-page-sample.png
- Sample drawing brief: https://files.autoeffortless.com/manga/demo-style-test-01-brief.pdf
- Blueprint pack (5 layouts, printable): https://files.autoeffortless.com/manga/manga-page-blueprints.pdf

> ⚠️ The demo page uses **AI-generated placeholder art** purely to prove the machinery. It is *not*
> the manga's style, art, or story, and the character in it ("Thandi") is **not** a real character.
> Do not treat any of it as canon.

## Decisions locked by Mr D
1. **Manga** — RTL, B5 print. 2. **English.** 3. **He draws, we assemble.** 4. Story still in progress.

## Open questions for Mr D (ask naturally, don't nag)
1. Paper or digital drawing? (changes intake advice)
2. Blueprint mode or free mode for pages?
3. Publishing target once there's a story: Gumroad / KDP / Webtoon Canvas / print?

## Immediate next actions (in order of when they can happen)
1. **On any drawing arriving:** archive to `art/incoming/` → run `ingest-art.sh` → show him his own art
   cleaned, then place it on a real lettered page. Fastest way to prove the collaboration.
2. **On any story material arriving:** build the story bible (premise, world, cast, arc outline,
   tone/style guide), then chapter 1 page scripts, then brief sheets for him to draw from.
3. **Keep the demo as a smoke test** — re-run the pipeline after any tool change to confirm nothing broke.

## Environment notes
- Machine: Mac mini M4, macOS (Darwin 25.6.0)
- Everything runs locally. Cost to date: **R0**. No paid subscriptions, no external accounts.
- Hourly backups cover this workspace (git). Originals in `art/incoming/` are never modified.
- Sibling agents: `fred` (AutoEffortless CEO), `ngkerk`, `snowman`, `docchat`, `delivery`, `aesite`,
  `lifeos`, `side`, `the-river-whisperer`, `tingai`, `main`, `cool`. The manga studio is independent —
  no shared memory, no shared accounts.
