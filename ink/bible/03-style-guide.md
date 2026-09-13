# SALT & STATIC — Style Guide

Locked onto every page and every prompt. Change only on Mr D's sign-off.

## Art style (locked for the book)
```
black and white manga panel, coastal noir, crisp clean ink linework, varied line
weight, heavy blacks, rain and salt-wet texture, screentone gradients for night,
high contrast, cinematic framing, no text, no letters, no speech bubble,
no caption box, no watermark, no signature
```
**Why "no text":** AI lettering is garbage. All lettering is typeset in
`tools/build-page.mjs`. Non-negotiable (house rule 1).

## Palette
Mono only. Night is carried by **screentone gradients + heavy blacks**, not grey mud.
Rain is white negative space over black. The only "light" in the book is the
lighthouse beam and the ON-AIR tally — draw them as pure white.

## Lettering (typeset in the compositor)
| Role | Font | Notes |
|---|---|---|
| Dialogue / thought | Comic Neue Bold | 21px base, 1.28 line-height |
| Caption / narration | Comic Neue Bold (600) | boxed, square corners, lowercase-with-caps place names |
| SFX | Bangers | outlined white, rotated, never in a bubble |

- Bubbles read **right-to-left**; tail sits on the side the speaker is on.
- Max ~14 words per bubble. If it doesn't fit, split the bubble, don't shrink the type.
- Silence is allowed. A page with no bubble is a deliberate beat, not a mistake.

## Panel grammar
- Establishing shots: wide, empty, weather doing the acting.
- Tension: tighten the cuts (wide → medium → close → extreme close) across a row.
- The lighthouse gets one **hero low-angle** per chapter. Never repeat the angle.
- Do not put a bubble over a face in a close-up.

## Rain / static vocabulary
- **Rain:** white streaks, heavy blacks between them.
- **Static:** fine screentone at 32% opacity (the `tone` effect), never over lettering.
- **The dead frequency:** the one place we allow a **silhouette** instead of a figure.
