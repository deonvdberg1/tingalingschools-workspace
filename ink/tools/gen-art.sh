#!/usr/bin/env bash
# gen-art.sh — generate one manga panel from a prompt
# usage: tools/gen-art.sh <out.jpg> "<character block>. <action>. <style suffix>" [seed] [WxH] [negative]
set -euo pipefail
OUT="$1"; PROMPT="$2"; SEED="${3:-1}"; SIZE="${4:-1024x1024}"; NEG="${5:-}"
W="${SIZE%x*}"; H="${SIZE#*x}"
ENC=$(python3 -c "import urllib.parse,sys;print(urllib.parse.quote(sys.argv[1]))" "$PROMPT")
URL="https://image.pollinations.ai/prompt/${ENC}?width=${W}&height=${H}&nologo=true&seed=${SEED}&model=flux"
if [ -n "$NEG" ]; then
  ENCNEG=$(python3 -c "import urllib.parse,sys;print(urllib.parse.quote(sys.argv[1]))" "$NEG")
  URL="${URL}&negative_prompt=${ENCNEG}"
fi
mkdir -p "$(dirname "$OUT")"
curl -sS --max-time 180 -o "$OUT" "$URL" -w "→ ${OUT}  http:%{http_code}  bytes:%{size_download}\n"
magick identify -format "   %wx%h %b\n" "$OUT" 2>/dev/null || true
