#!/usr/bin/env bash
# style-test.sh — converge on the JJK art register before rendering a chapter.
set -uo pipefail
cd "$(dirname "$0")/.."
OUT=art/style-test; mkdir -p "$OUT"

AYA='AYA, a 16-year-old girl, sharp black bob with a blunt fringe, dark school blazer over a white shirt with a loose red tie, narrow amber eyes'
GOOSE='GOOSE, a tall jujutsu sorcerer in his thirties, messy white hair, black wraparound sunglasses, long charcoal coat, bandaged right hand'

# JJK-register style: force 2D hand-drawn shonen manga, kill all realism.
STYLE='hand-drawn Japanese manga panel, black and white, shonen battle manga in the style of modern dark supernatural manga, clean crisp ink linework with bold varied weight, sharp angular stylized character design, large expressive anime eyes, simplified stylized nose and mouth, flat cel-shaded gray screentone, solid pure black fills, high contrast, strictly 2D pen-and-ink illustration'
NEG='photorealistic, photograph, photo, 3d render, cgi, octane render, unreal engine, hyperrealistic, realistic skin texture, skin pores, subsurface scattering, depth of field, bokeh, blurry, soft rendering, gradient shading, airbrush, color, colorized, letters, text, watermark, signature, extra fingers, deformed hands, mutated'

gen(){ local name="$1" seed="$2" body="$3" out="$OUT/$1.jpg" t=0 w=5
  while :; do t=$((t+1))
    tools/gen-art.sh "$out" "$body $STYLE" "$seed" "1024x1024" "$NEG" >/dev/null 2>&1 || true
    if [ -s "$out" ] && [ "$(wc -c < "$out" | tr -d ' ')" -gt 8000 ] && magick identify "$out" >/dev/null 2>&1; then
      printf 'OK   %-12s %s\n' "$name" "$(magick identify -format '%wx%h' "$out")"; return 0; fi
    [ "$t" -ge 6 ] && { printf 'FAIL %-12s\n' "$name"; return 1; }
    sleep "$w"; w=$((w*2)); [ "$w" -gt 45 ] && w=45; done; }

gen test-1-aya-face   951 "extreme close-up anime portrait of $AYA, angry determined expression, teeth clenched"
sleep 5
gen test-2-goose      952 "medium anime shot of $GOOSE, easy confident grin, hands in coat pockets, night city background"
sleep 5
gen test-3-aya-action 953 "dynamic action anime panel of $AYA mid-leap through rain, cursed energy crackling around both hands, speed lines, dramatic dutch angle"
echo "--- done ---"; ls -la "$OUT"
