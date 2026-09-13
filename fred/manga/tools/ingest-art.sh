#!/usr/bin/env bash
# ingest-art.sh — turn a photo/scan of Mr D's drawing into a clean manga panel
#
# usage: tools/ingest-art.sh <input> <output.png> [mode] [maxdim] [threshold]
#   mode: line  = ink/pencil line art, paper forced to pure white (default)
#         tone  = keeps grey shading, softer pencils, still print-ready
#         raw   = straighten + flatten lighting + mono only (no thresholding)
#   maxdim:     longest edge of output (default 2000)
#   threshold:  line mode only, % (default 70). lower = lighter/sketchier, higher = heavier blacks
#
# Fixes everything a phone photo does wrong:
#   rotation/skew · uneven lighting & shadows · grey/cream paper · washed-out pencil · borders
set -euo pipefail

IN="$1"; OUT="$2"; MODE="${3:-line}"; MAXDIM="${4:-2000}"; TH="${5:-70}"
[ -f "$IN" ] || { echo "no such file: $IN"; exit 1; }
mkdir -p "$(dirname "$OUT")"

TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT

# 1. orientation + mono + straighten
magick "$IN" -auto-orient -colorspace Gray "$TMP/a.png"
magick "$TMP/a.png" -deskew 40% "$TMP/b.png" 2>/dev/null || cp "$TMP/a.png" "$TMP/b.png"

# 2. flatten uneven lighting: divide by a heavily-blurred copy of itself (software scanner)
magick "$TMP/b.png" -blur 0x40 "$TMP/bg.png"
magick "$TMP/b.png" "$TMP/bg.png" -compose divide -composite -auto-level "$TMP/c.png"

case "$MODE" in
  raw)
    magick "$TMP/c.png" -resize "${MAXDIM}x${MAXDIM}>" -depth 8 "$OUT"
    ;;
  line)
    magick "$TMP/c.png" -despeckle -resize "${MAXDIM}x${MAXDIM}>" -threshold "${TH}%" -depth 8 "$OUT"
    ;;
  tone)
    magick "$TMP/c.png" \
      -sigmoidal-contrast 2.5,52% \
      -level 2%,92% \
      -despeckle \
      -resize "${MAXDIM}x${MAXDIM}>" -depth 8 "$OUT"
    ;;
  *) echo "unknown mode: $MODE (use line|tone|raw)"; exit 1 ;;
esac

magick identify -format "→ ${OUT}  %wx%h  mode=${MODE}  ink=%[fx:1-mean]  colors=%k\n" "$OUT"
