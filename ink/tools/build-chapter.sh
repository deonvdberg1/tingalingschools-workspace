#!/usr/bin/env bash
# build-chapter.sh — render a whole chapter and export every deliverable.
#
#   tools/build-chapter.sh [ch1] [--publish]
#
# Steps: render cover + pages (compositor) -> print PDF (B5, 300dpi) ->
#        webtoon strip (top-to-bottom) -> contact sheet -> copy to the share folder.
set -euo pipefail
cd "$(dirname "$0")/.."
CH="${1:-ch1}"; PUBLISH="${2:-}"; SLUG="${3:-$CH}"
OUT="output/$CH"; mkdir -p "$OUT" output/briefs
FONT=/System/Library/Fonts/Supplemental/Arial.ttf

shopt -s nullglob
specs=(scripts/$CH-p*.json)
[ ${#specs[@]} -gt 0 ] || { echo "no specs matching scripts/$CH-p*.json"; exit 1; }

pages=()
for f in "${specs[@]}"; do
  base=$(basename "$f" .json); base=${base%.page}; base=${base%.cover}
  out="$OUT/$base.png"
  node tools/build-page.mjs "$f" "$out"
  pages+=("$out")
done
echo "rendered ${#pages[@]} page(s)"

# print PDF — one page per sheet, B5-ish at 300dpi
magick -density 300 -units PixelsPerInch "${pages[@]}" -compress JPEG -quality 90 \
  "$OUT/$SLUG-print.pdf"

# webtoon strip — 800px wide, top to bottom
magick "${pages[@]}" -resize 800x -background white -append -compress JPEG -quality 86 \
  "$OUT/$SLUG-webtoon.jpg"

# contact sheet
magick montage -font "$FONT" -tile 3x -geometry 560x+10+10 -background '#ffffff' \
  -label '%f' "${pages[@]}" "$OUT/$CH-contact-sheet.jpg"
magick "${pages[@]}" -resize 1200x -background '#ffffff' -append -compress JPEG -quality 88 \
  "$OUT/$CH-pages-stack.jpg"

echo "→ $OUT/$SLUG-print.pdf"
echo "→ $OUT/$SLUG-webtoon.jpg"
echo "→ $OUT/$CH-contact-sheet.jpg"

if [ "$PUBLISH" = "--publish" ]; then
  DEST=/Users/deonvandenberg/.openclaw/workspace/fred/products/manga
  mkdir -p "$DEST"
  cp "$OUT/$SLUG-print.pdf"   "$DEST/$CH-print.pdf"
  cp "$OUT/$CH-contact-sheet.jpg"           "$DEST/$CH-contact-sheet.jpg"
  cp "$OUT/$SLUG-webtoon.jpg" "$DEST/$CH-webtoon.jpg"
  cp output/briefs/$CH-p01-01-brief.png     "$DEST/$CH-p01-drawing-brief.png" 2>/dev/null || true
  echo "published to $DEST"
fi
