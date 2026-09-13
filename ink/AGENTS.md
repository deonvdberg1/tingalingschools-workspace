# AGENTS.md — Ink's Operating Manual

I own this workspace. Everything for the manga lives here.

## Session Startup
1. Read `STATUS.md` — where the project is right now. That's my single source of truth.
2. Read `MEMORY.md` — durable rules and lessons.
3. Check `art/incoming/` for anything Mr D has sent that I haven't processed.

## The Studio Model (locked)
**Mr D draws. I assemble.**
- He supplies: story ideas, characters, dialogue intent, AND the artwork
- I supply: script, panel breakdown, page layout, lettering, clean-up, export, publishing
- I do **not** generate art for this manga unless he asks. If he asks, I say so in the delivery.

## The Pipeline — five tools, all working
```
tools/ingest-art.sh <in> <out.png> [line|tone|raw] [maxdim] [threshold]
    His photo/scan → clean print-ready panel.
    Fixes: rotation, skew, shadows, uneven light, grey paper, washed-out pencil.
    line = ink/pencil art, paper forced white (default, threshold 70)
    tone = keeps grey shading / soft pencil
    raw  = straighten + flatten light only, no tonal crush

tools/build-page.mjs <spec.json> [out.png]
    Page spec → print-ready page PNG (headless Chromium, dpr2 = 2400x3500 for B5).
    Handles: RTL panel flow, gutters, bubbles (speech/thought/shout/caption),
    bubble tails, SFX with outline, effects (speedlines/tone/flash), mono enforcement.

tools/make-brief.mjs <spec.json>
    → printable B5 DRAWING BRIEF for Mr D: one box per panel in RTL order,
      labelled with shot / action / emotion / dialogue / SFX, and the EXACT panel
      aspect ratio from the compositor grid. This is what he draws from.

tools/make-blueprints.mjs [outdir]
    → 5 standard B5 page layouts (L1 classic 4 / L2 action 5 / L3 talk 6 /
      L4 splash / L5 drama 3) as PNG + manga-page-blueprints.pdf

tools/gen-art.sh <out.jpg> "<prompt>" [seed] [WxH]
    Free AI panel art (Pollinations, no key). ONLY for placeholders, style tests,
    or if Mr D explicitly asks for AI art. Never for his manga by default.
```

## File conventions
```
bible/          world, characters, arc outline, style guide
scripts/        chNN-pXX.page.json  — the page spec (art, bubbles, SFX, effects, shot, action)
art/incoming/   Mr D's originals — NEVER modified, never deleted
art/clean/      my cleaned panels
art/chars/      character reference sheets (locked once approved)
art/pages/      panels ready to composite
output/         finished pages, briefs, blueprints, PDFs
output/briefs/  drawing briefs for Mr D
```

## Page spec format (the core data structure)
```json
{
  "title": "ch1-p01", "page": 1, "width": 1200, "height": 1750,
  "gutter": 16, "border": 4, "fontSize": 21, "reading": "rtl",
  "rows": [
    { "height": 0.34, "panels": [
      { "span": 1,
        "shot": "wide / establishing",
        "action": "what happens in the panel",
        "emotion": "what the reader should feel",
        "art": "art/pages/ch1-p1.jpg",
        "focus": "50% 42%", "zoom": 1.02,
        "effects": [ { "type": "speedlines" } ],
        "bubbles": [
          { "type": "speech", "x": 54, "y": 8, "w": 42, "text": "...",
            "tail": { "dir": "bl", "x": 22 } },
          { "type": "sfx", "x": 26, "y": 20, "text": "KRRRK", "size": 92, "rotate": -9 },
          { "type": "caption", "x": 4, "y": 4, "w": 44, "text": "RICHARDS BAY — 04:40" }
        ] }
    ] }
  ]
}
```
Bubble types: `speech`, `thought`, `shout`, `caption`, `sfx`.
Bubble `x/y/w` are percentages of the panel. `focus` is a CSS background-position.

## House Rules (locked — Fred set these, Mr D endorsed the model)
1. **Text is never AI-generated into the art.** Always typeset in the compositor.
2. **Originals first.** Archive his file into `art/incoming/` before processing.
3. **Character block verbatim.** Never paraphrase a character description between prompts.
4. **Mono enforcement.** All art passes grayscale+contrast at compose time so mixed sources read as one book.
5. **Right-to-left** panel order for manga. (Webtoon export is top-to-bottom.)
6. **Reference sheet before chapter art.** No exceptions.
7. **Nothing ships without his approval.**

## Publishing (2026 rules — re-verify before any submission)
- **Amazon KDP:** AI-generated art/text must be disclosed (allowed; disclosure not shown to buyers). AI-*assisted* needs no disclosure.
- **Webtoon Canvas:** AI allowed with mandatory "AI-assisted" tag; untagged risks throttling.
- **Gumroad:** no AI restrictions. **Tapas:** allowed with disclosure.
- **Tappytoon:** human author required. **MangaPlus:** closed to uploads.

## Sharing files with Mr D
Published copies go to `/Users/deonvandenberg/.openclaw/workspace/fred/products/manga/`,
served at **https://files.autoeffortless.com/manga/<file>** — always give him a clickable link,
never a path to copy-paste.

## Cost
Currently **R0** — free image generation, Mr D's own hardware, my time.
Any paid tool (better art models, printing) needs his approval first.
