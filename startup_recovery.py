#!/usr/bin/env python3
"""
Startup Recovery — Runs on every boot.
Rebuilds session state from Chrome profile cookies, pushes encrypted backup to GitHub.
"""
import json, os, sys, base64, hashlib, subprocess
from datetime import datetime, timezone

BASE = os.path.dirname(os.path.abspath(__file__))
STATE_FILE = os.path.join(BASE, "ig_playwright_state.json")
LOG_FILE = os.path.join(BASE, ".startup_recovery.log")
KEYCHAIN_SERVICE = "com.tingaling.sessions"
KEYCHAIN_ACCOUNT = "backup-key"

CHROME_BASE = os.path.expanduser("~/Library/Application Support/Google/Chrome")
PLATFORM_DOMAINS = ['instagram', 'facebook', 'tiktok']

def log(msg):
    with open(LOG_FILE, "a") as f:
        f.write(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}\n")
    print(msg)

def get_keychain_key():
    try:
        result = subprocess.run(
            ["security", "find-generic-password", "-s", KEYCHAIN_SERVICE, "-a", KEYCHAIN_ACCOUNT, "-w"],
            capture_output=True, text=True, timeout=10
        )
        if result.returncode == 0 and result.stdout.strip():
            return result.stdout.strip()
    except:
        pass
    import secrets
    key = secrets.token_hex(32)
    subprocess.run(["security", "add-generic-password", "-s", KEYCHAIN_SERVICE, "-a", KEYCHAIN_ACCOUNT, "-w", key, "-U"],
                   capture_output=True, timeout=10)
    return key

def export_cookies():
    all_cookies = []
    seen = set()
    for profile in ['Default', 'Profile 1', 'Profile 3', 'Profile 4']:
        path = os.path.join(CHROME_BASE, profile, 'Cookies')
        if not os.path.exists(path):
            continue
        try:
            from browser_cookie3 import chrome
            for c in chrome(cookie_file=path):
                if not any(d in c.domain for d in PLATFORM_DOMAINS):
                    continue
                key = (c.name, c.domain, c.path)
                if key in seen:
                    continue
                seen.add(key)
                all_cookies.append({
                    'name': c.name, 'value': c.value, 'domain': c.domain, 'path': c.path or '/',
                    'expires': int(c.expires) if c.expires else 2147483647,
                    'httpOnly': bool(c.has_nonstandard_attr('httponly')) if c.has_nonstandard_attr else False,
                    'secure': bool(c.secure), 'sameSite': 'Lax'
                })
        except:
            pass
    return all_cookies

def save_state(cookies):
    state = {"cookies": cookies, "origins": [], "_meta": {"created": datetime.now(timezone.utc).isoformat(), "version": "2"}}
    with open(STATE_FILE, "w") as f:
        json.dump(state, f, indent=2)
    ig = sum(1 for c in cookies if 'instagram' in c['domain'])
    fb = sum(1 for c in cookies if 'facebook' in c['domain'])
    tt = sum(1 for c in cookies if 'tiktok' in c['domain'])
    log(f"Saved: IG={ig} FB={fb} TT={tt}")

def push_backup(cookies):
    key = get_keychain_key()
    if not key:
        return
    from cryptography.fernet import Fernet
    state = {"cookies": cookies, "origins": [], "_meta": {"created": datetime.now(timezone.utc).isoformat(), "version": "2"}}
    fernet_key = base64.urlsafe_b64encode(hashlib.sha256(key.encode()).digest())
    encrypted = Fernet(fernet_key).encrypt(json.dumps(state).encode())
    with open(os.path.join(BASE, ".session_backup_github.enc"), "wb") as f:
        f.write(encrypted)
    subprocess.run(["git", "-C", BASE, "add", ".session_backup_github.enc"], capture_output=True, timeout=15)
    subprocess.run(["git", "-C", BASE, "commit", "-m", f"auto: session backup", "--quiet"], capture_output=True, timeout=15)
    subprocess.run(["git", "-C", BASE, "push", "origin", "main", "--quiet"], capture_output=True, timeout=30)
    log("Backup pushed to GitHub")

def install_launchd():
    plist_path = os.path.expanduser("~/Library/LaunchAgents/com.openclaw.session-bootstrap.plist")
    plist = f'''<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
    <key>Label</key><string>com.openclaw.session-bootstrap</string>
    <key>ProgramArguments</key><array>
        <string>{sys.executable}</string>
        <string>{os.path.abspath(__file__)}</string>
    </array>
    <key>RunAtLoad</key><true/>
    <key>KeepAlive</key><false/>
    <key>StandardOutPath</key><string>{BASE}/.bootstrap_stdout.log</string>
    <key>StandardErrorPath</key><string>{BASE}/.bootstrap_stderr.log</string>
</dict></plist>'''
    with open(plist_path, "w") as f:
        f.write(plist)
    subprocess.run(["launchctl", "unload", plist_path], capture_output=True, timeout=10)
    subprocess.run(["launchctl", "load", plist_path], capture_output=True, timeout=10)
    log("Launchd plist installed")

def main():
    log("=" * 40)
    log(f"STARTUP — {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    cookies = export_cookies()
    if cookies:
        save_state(cookies)
        push_backup(cookies)
    else:
        log("No cookies exported - may need re-login")
    
    install_launchd()
    log("Done")
    log("=" * 40)

if __name__ == "__main__":
    if "--install" in sys.argv:
        install_launchd()
        print("✅ Launchd installed")
    else:
        main()
