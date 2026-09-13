#!/usr/bin/env bash
# gen-jjk-art.sh — "ASH & APPETITE" ch1 PLACEHOLDER art (Pollinations)
# JJK-register test chapter. AI placeholders only — Mr D draws the real pages.
set -uo pipefail
cd "$(dirname "$0")/.."
GEN=tools/gen-art.sh; OUTDIR=art/pages; SLEEP=5

AYA='AYA, a 16-year-old South African girl, dark brown skin, sharp black bob with a blunt fringe, a small silver ring in her left ear, dark school blazer over a white shirt with a loose red tie, narrow amber eyes, a chipped front tooth'
GOOSE='GOOSE, a tall South African jujutsu sorcerer in his thirties, messy white hair, black wraparound sunglasses worn indoors, long charcoal coat over a rumpled shirt, bandaged right hand, an easy grin'
COOK='THE COOK, a hulking cursed spirit wearing a stained chef apron and a cracked white porcelain mask painted with a smile, too many arms, steam rising from its shoulders'

STYLE='hand-drawn Japanese manga panel, black and white, shonen battle manga, dark supernatural action manga style, clean crisp ink linework with bold varied weight, sharp angular stylized character design, large expressive anime eyes, simplified stylized nose and mouth, flat cel-shaded gray screentone, solid pure black fills, heavy shadows, dynamic dutch angles, speed lines, high contrast, strictly 2D pen-and-ink illustration, no text, no letters, no speech bubble, no caption box, no watermark'
NEG='photorealistic, photograph, photo, 3d render, cgi, octane render, unreal engine, hyperrealistic, realistic skin texture, skin pores, subsurface scattering, depth of field, bokeh, blurry, soft rendering, gradient shading, airbrush, color, colorized, letters, text, watermark, signature, extra fingers, deformed hands, mutated'

ok(){ [ -s "$1" ] || return 1; [ "$(wc -c < "$1" | tr -d ' ')" -gt 8000 ] || return 1; magick identify "$1" >/dev/null 2>&1; }
gen(){ local name="$1" seed="$2" prompt="$3" out="$OUTDIR/$1.jpg" t=0 w=5
  while :; do t=$((t+1))
    "$GEN" "$out" "$prompt $STYLE" "$seed" "1024x1024" "$NEG" >/dev/null 2>&1 || true
    if ok "$out"; then printf 'OK   %-16s %s\n' "$name" "$(magick identify -format '%wx%h %b' "$out")"; return 0; fi
    [ "$t" -ge 8 ] && { printf 'FAIL %-16s\n' "$name"; return 1; }
    printf 'wait %-16s retry %d (%ds)\n' "$name" "$t" "$w"; sleep "$w"; w=$((w*2)); [ "$w" -gt 45 ] && w=45
  done; }

rm -f "$OUTDIR"/jjk-ch1-*.jpg
gen jjk-ch1-cover 700 "dramatic manga cover illustration, a lone teenage sorcerer in a school blazer standing before a rain-soaked city alley at night, a monstrous shadowy figure with too many arms looming behind, cursed energy crackling, extreme high contrast, rain" ; sleep $SLEEP
# P1 — cold open
gen jjk-ch1-p01-a1 701 "extreme wide shot of a narrow rain-soaked city alley at 2am, a single tiny ramen stall glowing against the dark, one hunched customer at the counter, steam and wet neon reflections, ominous" ; sleep $SLEEP
gen jjk-ch1-p01-a2 702 "medium shot of $COOK standing behind a ramen stall, ladling broth with several arms, porcelain mask smiling, steam pouring from its shoulders, warm lantern light against deep shadow, unsettling" ; sleep $SLEEP
gen jjk-ch1-p01-a3 703 "extreme close-up of a ramen bowl held in shadow, the broth crowded with black strands and small eyes floating in it, horror, shallow depth of field" ; sleep $SLEEP
# P2 — the school
gen jjk-ch1-p02-b1 704 "medium shot of $AYA standing in a dim jujutsu school classroom while $GOOSE leans back against a desk, chalkboard behind, moody shafts of light, urban supernatural atmosphere" ; sleep $SLEEP
gen jjk-ch1-p02-b2 705 "close-up of $GOOSE grinning, black wraparound sunglasses indoors, bandaged hand raised, chalkboard with a ranking chart blurred behind, confident menace" ; sleep $SLEEP
gen jjk-ch1-p02-b3 706 "extreme close-up of $AYA opening her hand to reveal a small wrapped cursed object, her narrow amber eyes lit from below, quiet tension" ; sleep $SLEEP
# P3 — the hunt
gen jjk-ch1-p03-c1 707 "wide shot from across a wet dark street, $AYA standing in shadow under a dripping awning watching a glowing ramen stall, rain, tense framing, high contrast night" ; sleep $SLEEP
gen jjk-ch1-p03-c2 708 "close-up of $COOK the cursed spirit, porcelain mask slowly turning to look over its shoulder toward camera, steam and shadow, dread, horror" ; sleep $SLEEP
# P4 — the fight
gen jjk-ch1-p04-d1 709 "dynamic action shot of $AYA mid-leap through rain, cursed energy erupting around her hands, dramatic dutch angle, speed lines, fierce expression" ; sleep $SLEEP
gen jjk-ch1-p04-d2 710 "extreme close-up of $AYA biting down on a small dark cursed object, her amber eyes flaring white with power, veins of cursed energy across her cheek, intense" ; sleep $SLEEP
gen jjk-ch1-p04-d3 711 "massive impact shot, a ramen stall exploding outward in a burst of broth shadow and debris, a monstrous shape thrown back, speed lines and radial burst, climax action" ; sleep $SLEEP
# P5 — the cost
gen jjk-ch1-p05-e1 712 "medium shot of the cursed spirit $COOK kneeling and dissolving, its porcelain mask cracking apart into steam, faintly peaceful, mournful, rain" ; sleep $SLEEP
gen jjk-ch1-p05-e2 713 "extreme close-up of $AYA crying silently but with empty confused eyes, rain on her face, unable to remember why she is crying, quiet devastation" ; sleep $SLEEP
# P6 — aftermath + hook
gen jjk-ch1-p06-f1 714 "medium shot of $GOOSE placing a hand on the head of $AYA in an empty rain-soaked street at dawn, both small under a vast grey sky, melancholy" ; sleep $SLEEP
gen jjk-ch1-p06-f2 715 "extreme close-up of a teenage girl's trembling hand held up to camera, something faintly moving beneath the skin, ominous, high contrast, hook image"

echo "--- done ---"; ls -la "$OUTDIR" | grep jjk
