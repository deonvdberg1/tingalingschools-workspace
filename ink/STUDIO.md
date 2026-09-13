# MANGA STUDIO — Operating Manual
**Owner:** Mr D · **Operator:** Ink (🖋️, agent `ink`) · **Started:** 2026-09-13
**Status:** pipeline proven end-to-end (demo page 2026-09-13 17:12) · **handed from Fred to Ink 17:25**

> ⚠️ **For current project state, read `STATUS.md`.** This file is the operating manual only.
> After the handover the model is locked: **Mr D draws, Ink assembles.** AI art is never used
> for this manga unless Mr D explicitly asks for it.

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
| Panel art | **Mr D draws** | Locked. Ink cleans it (`ingest-art.sh`) and fits it. No AI art for this manga unless Mr D asks. |
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

## 5. Art sources (only relevant if Mr D ever asks for AI art)
*This section is dormant under the locked model — Mr D draws. Kept for reference.*
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

## 8. Locked decisions (Mr D, 2026-09-13)
1. **Format:** manga — RTL, B5 print
2. **Language:** English
3. **Art:** **Mr D draws, Ink assembles** (script, layout, lettering, clean-up, export, publishing)
4. **Story:** Mr D is still developing it

Remaining open questions are tracked in `STATUS.md`, not here.
