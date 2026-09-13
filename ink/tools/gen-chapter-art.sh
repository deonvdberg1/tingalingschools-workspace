#!/usr/bin/env bash
# gen-chapter-art.sh — SALT & STATIC ch1 PLACEHOLDER art (Pollinations)
# These are AI placeholders for a studio test run ONLY. Not the manga's real art.
# Mr D draws the real thing. Character blocks below are pasted verbatim (house rule).
set -uo pipefail
cd "$(dirname "$0")/.."
GEN=tools/gen-art.sh
OUTDIR=art/pages
SLEEP=6      # gentle: anonymous Pollinations rate-limits fast bursts

# ---- locked character blocks (verbatim from bible/02-cast.md) ----
NANDI='NANDI, a 17-year-old South African girl, deep brown skin, short natural coils poking out from a red knit beanie, oversized charcoal hoodie with a peeling band logo, headset resting around her neck, tired amber-brown eyes, a small gap between her front teeth'
GOGGA='GOGGA, a wiry South African man in his sixties, grizzled grey stubble, faded navy harbour overalls over a cream cable-knit jersey, round spectacles taped at the bridge, ink-stained fingers, a brass whistle on a cord around his neck'
# ---- global style suffix (verbatim from bible/03-style-guide.md) ----
STYLE='black and white manga panel, coastal noir, crisp clean ink linework, varied line weight, heavy blacks, rain and salt-wet texture, screentone gradients for night, high contrast, cinematic framing, no text, no letters, no speech bubble, no caption box, no watermark, no signature'

ok() { # file must be a real image > 8KB
  [ -s "$1" ] || return 1
  sz=$(wc -c < "$1" | tr -d ' ')
  [ "$sz" -gt 8000 ] || return 1
  magick identify "$1" >/dev/null 2>&1
}

gen() { # name seed prompt
  local name="$1" seed="$2" prompt="$3" out="$OUTDIR/$1.jpg" tries=0 wait=5
  while :; do
    tries=$((tries+1))
    "$GEN" "$out" "$prompt $STYLE" "$seed" "1024x1024" >/dev/null 2>&1 || true
    if ok "$out"; then printf 'OK   %-18s %s\n' "$name" "$(magick identify -format '%wx%h %b' "$out")"; return 0; fi
    if [ "$tries" -ge 7 ]; then printf 'FAIL %-18s after %d tries\n' "$name" "$tries"; return 1; fi
    printf 'wait %-18s retry %d (sleep %ds)\n' "$name" "$tries" "$wait"
    sleep "$wait"; wait=$((wait*2)); [ "$wait" -gt 60 ] && wait=60
  done
}

rm -f "$OUTDIR"/ch1-*.jpg
gen ch1-cover   900 "wide dramatic manga splash illustration of a rain-lashed South African coastline at night, a lonely radio mast with a red light and a distant lighthouse on a storm headland, an empty wet coastal road, vast moody negative space in the sky, salt and mist"
sleep "$SLEEP"
gen ch1-p01-a1  101 "extreme wide establishing shot of a small coastal South African town at night in heavy rain, a single tall radio mast with a red aircraft light blinking above a rusted harbour warehouse, empty flooded streets, ships anchored on a black sea, 4am, desolate"; sleep "$SLEEP"
gen ch1-p01-a2  102 "medium shot of $NANDI alone in a cramped analogue radio studio at night, seated at a mixing desk leaning toward a condenser microphone, glowing VU meters, a wall of pinned request notes behind her, rain on the window, quiet loneliness"; sleep "$SLEEP"
gen ch1-p01-a3  103 "extreme close-up of a vintage condenser microphone, a small red ON-AIR tally light glowing, dust and condensation on the metal grille, shallow depth of field, dark studio bokeh behind"; sleep "$SLEEP"
gen ch1-p02-b1  201 "medium shot of $GOGGA setting down two enamel mugs of tea on a radio studio desk while $NANDI half-turns in her chair, cramped warm booth, desk lamp glow, rain outside the window"; sleep "$SLEEP"
gen ch1-p02-b2  202 "close-up of $GOGGA peering over his taped round spectacles with a knowing reluctant expression, dark radio booth behind him, single warm light source"; sleep "$SLEEP"
gen ch1-p02-b3  203 "insert shot of an old framed black-and-white photograph on a studio wall, four lighthouse keepers in oilskins standing before a stone lighthouse, one face scratched out, dust and faded print, glass reflecting the dark room"; sleep "$SLEEP"
gen ch1-p03-c1  301 "extreme close-up of an old analog wall clock in a radio studio reading ten to five at dawn, cracked glass face, dust, seconds hand caught mid-tick, harsh side light"; sleep "$SLEEP"
gen ch1-p03-c2  302 "dramatic low-key close-up of a black bakelite telephone on a studio desk ringing, handset lifted off its cradle, a second frayed cable trailing unplugged, a teenager's hand hovering above it, speed lines, tension"; sleep "$SLEEP"
gen ch1-p04-d1  303 "extreme close-up of $NANDI eyes going wide with shock, headset pressed to her ear, cold console glow on her face, reflected rain on her skin, fear and disbelief"; sleep "$SLEEP"
gen ch1-p04-d2  304 "abstract extreme close-up of a heavy headphone earpiece beside a small CRT monitor, a waveform of pure static on the screen forming a faint human silhouette, eerie, cold light"; sleep "$SLEEP"
gen ch1-p05-e1  305 "wide shot from inside a dark radio studio, $NANDI seen from behind standing at a rain-streaked window, looking out across a black bay toward a distant headland, a faint light beginning to glow on the horizon, silhouette, rain"; sleep "$SLEEP"
gen ch1-p05-e2  306 "low angle heroic shot of a lone stone lighthouse on a storm-battered headland at night, its lantern room blazing, a beam sweeping over black water, thirty years dark and now awake, awe, scale, deluge"; sleep "$SLEEP"
gen ch1-p06-f1  307 "an empty dark room with a single old telephone off the hook lying on the floor, a wash of television static light spilling from off-frame, unsettling, abstract, no people"; sleep "$SLEEP"
gen ch1-p06-f2  308 "medium shot of $GOGGA standing frozen in a radio studio doorway, face pale, lit from below by console light, one hand gripping the door frame, dread"; sleep "$SLEEP"
gen ch1-p06-f3  309 "close-up of $NANDI from slightly below, lit by cold static glow, a tear or rain on her cheek, staring past camera, caught between wonder and terror"

echo "--- done ---"; ls -la "$OUTDIR" | grep 'ch1-' | grep -v 'ch1-p[1-4]\.jpg'
