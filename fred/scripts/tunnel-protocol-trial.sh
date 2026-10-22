#!/bin/bash
# tunnel-protocol-trial.sh — switch a cloudflared tunnel between quic and http2 safely.
# Created 2026-10-22 for the pending QUIC→http2 trial (QUIC idle-timeout flaps).
#
# Why: all 8 tunnels lost connections repeatedly 00:13–01:35 SAST on 2026-10-22 with
# error="timeout: no recent network activity" (suspected UDP path via router 192.168.31.1),
# while ICMP to 1.1.1.1 stayed 0% loss. http2 (TCP) is the candidate fix.
#
# Usage:
#   scripts/tunnel-protocol-trial.sh <tunnel|all> <quic|http2>
#   e.g. scripts/tunnel-protocol-trial.sh ngkerk http2
# Rollback: run again with "quic" (removes the protocol line => cloudflared default).
#
# Backs up the config, edits ONLY the protocol line, kickstarts the LaunchAgent, then
# verifies recent registrations + host HTTP status.
set -u
cd "$(dirname "$0")/.." || exit 1
ROOT="$(pwd)"
CFG_DIR="$HOME/.cloudflared"
STAMP="$(date +%Y%m%dT%H%M%S)"
ALL="main files fred enrol tracking tingaling ngkerk riverwhisperer"

cfg_of() { case "$1" in
  main) echo config.yml;; files) echo config-files.yml;; fred) echo config-fred.yml;;
  enrol) echo config-enrol.yml;; tracking) echo config-tracking.yml;;
  tingaling) echo config-tingaling.yml;; ngkerk) echo config-ngkerk.yml;;
  riverwhisperer) echo config-riverwhisperer.yml;; *) echo "";; esac; }
host_of() { case "$1" in
  main) echo autoeffortless.com;; files) echo files.autoeffortless.com;;
  fred) echo fred.autoeffortless.com;; enrol) echo enrol.autoeffortless.com;;
  tracking) echo tracking.autoeffortless.com;; tingaling) echo whatsapp.autoeffortless.com;;
  ngkerk) echo ngkerk.autoeffortless.com;; riverwhisperer) echo theriverwhisperer.co.za;; *) echo "";; esac; }
log_of() { case "$1" in
  main) echo logs/cloudflared-main.log;; files) echo logs/cloudflared-files.log;;
  fred) echo logs/cloudflared-fred.log;; enrol) echo logs/cloudflared-enrol.log;;
  tracking) echo logs/cloudflared-tracking.log;;
  tingaling) echo whatsapp-server/cloudflared-named.log;;
  ngkerk) echo ../ngkerk/cloudflared.log;; riverwhisperer) echo ../river-whisperer/cloudflared.log;;
  *) echo "";; esac; }

TARGET="${1:-}"; PROTO="${2:-}"
if [ -z "$TARGET" ] || [ -z "$PROTO" ]; then
  echo "usage: $0 <$ALL|all> <quic|http2>"; exit 2
fi
case "$PROTO" in quic|http2) ;; *) echo "protocol must be quic or http2"; exit 2;; esac

do_one() {
  n="$1"; cfg="$CFG_DIR/$(cfg_of "$n")"; f="$(log_of "$n")"; host="$(host_of "$n")"
  [ -n "$cfg" ] && [ -f "$cfg" ] || { echo "  [$n] MISSING config"; return 1; }
  cp -p "$cfg" "$cfg.bak-$STAMP"
  python3 - "$cfg" "$PROTO" <<'PY'
import sys, re
path, proto = sys.argv[1], sys.argv[2]
lines = open(path).read().splitlines()
lines = [l for l in lines if not re.match(r'^\s*protocol\s*:', l)]
if proto == 'http2':
    out, done = [], False
    for l in lines:
        out.append(l)
        if not done and re.match(r'^tunnel\s*:', l):
            out.append('protocol: http2'); done = True
    if not done:
        out.insert(0, 'protocol: http2')
    lines = out
open(path, 'w').write('\n'.join(lines) + '\n')
PY
  echo "  [$n] config -> protocol=${PROTO} (backup $(cfg_of "$n").bak-$STAMP)"
  launchctl kickstart -k "gui/$(id -u)/com.autoeffortless.cloudflared-$n" || { echo "  [$n] kickstart FAILED"; return 1; }
  sleep 12
  regs=$(grep -a 'Registered tunnel connection' "$f" 2>/dev/null | tail -8 | grep -ac "protocol=$PROTO")
  code=$(curl -s -o /dev/null -w '%{http_code}' -m 20 "https://$host/")
  printf "  [%s] last8 registrations with protocol=%s: %s | https=%s\n" "$n" "$PROTO" "$regs" "$code"
  case "$code" in 200|301) return 0;; *) return 1;; esac
}

RC=0
if [ "$TARGET" = "all" ]; then
  for n in $ALL; do do_one "$n" || RC=1; done
else
  [ -n "$(cfg_of "$TARGET")" ] || { echo "unknown tunnel '$TARGET'"; exit 2; }
  do_one "$TARGET" || RC=1
fi
echo "done (rc=$RC). Rollback: $0 $TARGET quic"
exit $RC
