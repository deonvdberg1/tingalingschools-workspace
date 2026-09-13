# MEMORY.md — Ink's Durable Memory

## Origin
- **2026-09-13:** Created by Fred (AutoEffortless CEO agent) after Mr D asked to hand the manga
  project to a dedicated agent. Fred built and proved the pipeline first, then moved it here and
  wrote this brief. The full play-by-play is in workspace `fred/memory/2026-09-13.md`.

## Locked decisions (Mr D, 2026-09-13)
1. **Format: manga** — right-to-left, B5 print proportions. Webtoon-style vertical is *not* the target.
2. **Language: English.**
3. **Collaborative model: Mr D draws, Ink assembles.** He supplies art + ideas; the studio supplies
   script, layout, lettering, clean-up, export, publishing.
4. **Story: still being written by Mr D.** Nothing locked yet — no genre, no title, no characters
   approved. Do not invent the story. Be ready with bible + script structure the moment he sends ideas.

## House rules (non-negotiable)
- **Never AI-generate art for his manga** unless he explicitly asks. His drawings are the art.
- **Text is always typeset**, never AI-drawn into an image. This is the studio's signature quality tell.
- **Originals are archived untouched** before any processing.
- **Nothing publishes without his yes.**
- Grayscale + contrast enforcement on all art at compose time, so mixed art sources read as one book.

## Pipeline state (verified 2026-09-13)
- `tools/build-page.mjs` — **verified**: rendered a 2400×3500px 4-panel RTL page with bubbles, SFX, effects. QC'd with moondream (4 panels, lettering present, consistent character).
- `tools/ingest-art.sh` — **verified** on a synthetic stress-test photo (tilted, dark, shadowed, grainy): output = clean bilevel line art, ink coverage ~9.5%, white paper.
- `tools/make-brief.mjs` — **verified**: produced a labelled B5 drawing brief with correct panel ratios.
- `tools/make-blueprints.mjs` — **verified**: 5 layouts → PNGs + `manga-page-blueprints.pdf`.
- `tools/gen-art.sh` — **verified**: free Pollinations art at ~768px.

## Technical lessons
- **Ingest order matters:** `divide composite` (lighting flatten) **then** `-auto-level` **then** threshold. Auto-level finds the paper white point per image. Skip it and the page goes black.
- Default ingest threshold **70%** gave the best line density on the test (~9.5% ink). Lower = sketchier, higher = heavier blacks.
- AI image models **cannot draw text**. All lettering is typeset — this is also why source art should be prompted "no text, no speech bubble" if AI art is ever used.
- Panel **aspect ratios must match** between brief and compositor grid, otherwise hand-drawn panels get cropped. `make-brief.mjs` computes them from the same grid on purpose.
- ImageMagick `montage` needs an explicit `-font`; `+append` needs none.

## Publishing rules (checked 2026-09-13, re-verify before submitting)
- **Amazon KDP:** AI-generated art/text → must disclose. AI-*assisted* → no disclosure. Disclosure is not shown to buyers and does not block publishing.
- **Webtoon Canvas:** AI allowed with a mandatory "AI-assisted" tag (since Feb 2026). Tagged series are not down-ranked; untagged risks throttling.
- **Gumroad:** unrestricted. **Tapas:** allowed with disclosure. **Tappytoon:** human author required. **MangaPlus:** closed to uploads.
- Japanese print publishing = newcomer contests; long game, not a first step.

## Character consistency (the known weak spot)
AI art drifts between panels. Current mitigations: verbatim character block, fixed seeds, reference
sheet first, editorial eye. The real fix, if/when needed: a **LoRA trained on Mr D's own character
sheet** run locally (free, ~10GB, needs his approval). For now it may not even matter — Mr D draws
the art himself, so consistency is *his* strength, not a model's problem. Don't over-engineer this.
