# WORKFLOW.md — How Mr D and Fred make a manga together

**Roles:** Mr D = author, artist, art director. Fred = script, layout, lettering, clean-up, export, publishing.

---

## The loop (one page at a time)

```
   Mr D: idea / story beat
      ↓
   Fred: page script + drawing brief  →  PDF/PNG you print or view
      ↓
   Mr D: draws the panels (paper or digital)
      ↓
   Mr D: sends me photos/scans (+ any notes, changes, new ideas)
      ↓
   Fred: cleans the art, fits it to the page, letters it, shows you the page
      ↓
   Mr D: says yes / "redo panel 3" / "make her angrier here"
      ↓
   Fred: fixes and re-renders in minutes
```

Nothing is locked until you approve it. Re-rendering a page costs me minutes, not days.

## Sending me your drawings

**Photo (easiest):** just send it in chat.
- Flat surface, phone directly above (not at an angle)
- Even light — daylight is best; avoid your own shadow across the page
- Fill the frame with the paper
- Don't worry about grey paper, shadows, or slight tilt — my `ingest-art.sh` fixes all of that

**Scan:** even better. 300dpi greyscale if you can.

**Digital (iPad/Procreate/Clip Studio):** upload or export as PNG/PSD. I can pull layers if you export them.

### Naming (helps but I'll cope if you don't)
```
ch01-p03-p2.jpg        → chapter 1, page 3, panel 2
ch01-p03-full.jpg      → you drew the whole page as one piece
```
If you don't name them, I'll ask once and then assume.

## Two ways we can work
- **Blueprint mode (tighter):** I give you a layout, you draw into those boxes → art fits perfectly, fastest turnaround
- **Free mode (looser):** you draw whatever you want in whatever shape → I adapt the page layout to your art. Slower, but 100% your instinct. Tell me which you prefer per page.

## What I do to your drawing on arrival
1. Straighten + auto-crop
2. Flatten uneven lighting and shadow (software scanner)
3. Convert to clean mono line art — paper to pure white, ink to pure black
4. Despeckle, resize to print resolution
5. Fit into the panel, apply screentones/speed lines where the script asks
6. Letter it (bubbles, tails, SFX) — **never** AI-generated text
7. Export: print PNG/PDF + webtoon strip

Your original is always kept untouched in `art/incoming/`.

## House rules
- **Dialogue is mine, art is yours.** I don't generate art without your say-so, and I don't change your drawing.
- **Text is typeset, never drawn by AI.** Bubbles and SFX come from the compositor.
- **Everything is versioned.** Every page render is saved; nothing overwritten.
- **You approve every page.** No page ships without your yes.

## Folder map
```
manga/
  bible/        world, characters, arc outlines
  scripts/      page scripts (JSON) + chapter text
  art/incoming/ your photos & scans, originals kept safe
  art/clean/    my cleaned-up versions
  art/chars/    character reference sheets
  art/pages/    panel art ready for composition
  output/       finished pages, briefs, blueprints, PDFs
  tools/        the pipeline (ingest-art, build-page, make-brief, make-blueprints)
```
