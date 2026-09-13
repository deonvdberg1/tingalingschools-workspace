# MANGA STUDIO — Operating Manual
**Owner:** Mr D · **Operator:** Fred · **Started:** 2026-09-13
**Status:** pipeline proven end-to-end (demo page rendered 2026-09-13 17:12)

---

## 1. What this is
A local, ownable manga production pipeline. No subscription platform, no per-page fees,
nothing we can't rebuild. We keep the *system*; any tool can be swapped.

## 2. Division of labour
| Stage | Who | Notes |
|---|---|---|
| Premise, world, arc, characters | Mr D (vision) + Fred (drafts, options) | Fred produces 3 pitches to choose from |
| Chapter script (panel-by-panel) | Fred | Structured JSON, editable by Mr D in plain language |
| Character reference sheets | Fred generates → Mr D approves | Locked once approved; never re-drawn ad hoc |
| Panel art | AI, prompt-locked | Style block + character block, fixed seeds |
| Page layout, gutters, panel flow | Fred (`build-page.mjs`) | Layout is code, so it's consistent & reusable |
| Lettering, bubbles, SFX, screentones | Fred (compositor) | AI never draws text — it's always typeset |
| Creative QC | Mr D | Eyes on every page before it ships |
| Export & publishing | Fred | Print (PDF) + webtoon (vertical) + digital store |

## 3. Pipeline (the five commands)
```
1. SCRIPT      scripts/chNN-pXX.page.json      ← panel spec: art, bubbles, SFX, effects
2. ART         tools/gen-art.sh               ← prompt + seed → art/pages/*.jpg
3. COMPOSE     node tools/build-page.mjs <spec.json>   ← renders print-ready PNG
4. CHAPTER     tools/build-chapter.mjs        ← page PNGs → A5 print PDF + webtoon strip
5. PUBLISH     KDP / Webtoon Canvas / Gumroad / own store
```
All assets live in the workspace and are backed up hourly to git.

## 4. House rules
- **Text is never AI-generated into the art.** Bubbles/SFX are typeset in the compositor. Non-negotiable — it's the #1 tell of AI comics.
- **Character block is copied verbatim.** Never paraphrase a character description between prompts.
- **Fixed seed per character per chapter.** Change seed only for new pose/angle.
- **Mono enforcement:** all art passes through a grayscale+contrast filter at compose time, so mixed sources still read as one book.
- **Reference sheet before chapter art.** No exceptions.
- **Right-to-left** panel order for manga format (webtoon export is top-to-bottom).

## 5. Art sources (ranked, we start free)
1. **Free / no key** — Pollinations (`image.pollinations.ai`) ✅ *currently wired, proven, 768px*
2. **Best free quality** — Google AI Studio key → Gemini image models (Google API key in `dashboard-api/.env` is NOT a Generative Language key — needs a fresh AI Studio key)
3. **Best consistency** — local ComfyUI + SDXL/Flux on the M4 + a **LoRA trained on our character sheet** (~10GB download, one-time setup, fully free after)
4. **Paid, if we want print quality fast** — Midjourney/Niji (~US$10/mo) or an anime-specific service

**Known limitation:** character drift is the #1 failure mode of AI manga. Options 3 (LoRA) is the real fix. Until then: reference sheets + seeds + editorial eye, and expect to re-roll panels.

## 6. Publishing reality check (2026 policies — verify before publishing)
- **Amazon KDP:** must disclose AI-generated art/text. Disclosure ≠ blocked. AI-*assisted* needs no disclosure.
- **Webtoon Canvas:** AI allowed but requires the "AI-assisted" tag; untagged content risks throttling. Tagged series are not down-ranked.
- **Gumroad:** no AI restrictions — sell direct.
- **Tapas:** revenue share, AI allowed with disclosure. · **Tappytoon:** human author required. · **MangaPlus:** closed to uploads.
- Japanese print publishing = contests (e.g. publisher newcomer awards) — realistic long-game, not a first step.

## 7. Cost model
- Free path: R0 (own hardware, free image gen, free tooling)
- Consistency upgrade: R0 + ~10GB download + training time
- Print-quality shortcut: ~R180/month if we ever want a paid image model

## 8. Open decisions (Mr D)
1. **Genre + premise** — Fred drafts 3 pitches once direction is set
2. **Format** — manga (RTL, B5 print) vs webtoon (vertical scroll) vs both
3. **Art role** — full AI art, or Mr D draws and Fred does script/layout/lettering/export
4. **Publishing target** — KDP / Webtoon / Gumroad / own audience first
5. **Language** — English, Afrikaans, or both
