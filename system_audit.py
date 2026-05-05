#!/usr/bin/env python3
"""
Ting-A-Ling System Audit — verifies every component is accessible.
Run this to check the health of the entire infrastructure.
"""
import json, asyncio, os, sys, subprocess
from datetime import datetime
from playwright.async_api import async_playwright

BASE = os.path.dirname(os.path.abspath(__file__))
STATE_FILE = os.path.join(BASE, "ig_playwright_state.json")
RESULTS = {}

def log(name, ok, detail=""):
    status = "✅" if ok else "❌"
    print(f"  {status} {name} — {detail}")
    RESULTS[name] = {'ok': ok, 'detail': detail}

async def verify_github():
    """Check GitHub repo is accessible"""
    try:
        result = subprocess.run(
            ['git', 'ls-remote', 'origin', 'HEAD'],
            capture_output=True, text=True, timeout=10, cwd=BASE
        )
        log("GitHub Repo", result.returncode == 0,
            f"origin: {result.returncode == 0}")
    except Exception as e:
        log("GitHub Repo", False, str(e))

async def verify_social_platforms():
    """Check all social media platforms are logged in"""
    async with async_playwright() as p:
        context = await p.chromium.launch_persistent_context(
            os.path.join(BASE, 'ig_profile'), headless=True,
            viewport={'width': 1280, 'height': 900}
        )
        if os.path.exists(STATE_FILE):
            with open(STATE_FILE) as f:
                state = json.load(f)
            await context.add_cookies(state['cookies'])
        
        await check_url(context, "Instagram", "https://www.instagram.com/")
        await check_url(context, "Facebook", "https://www.facebook.com/")
        await check_url(context, "TikTok", "https://www.tiktok.com/upload/")
        
        await context.close()

async def check_url(context, name, url):
    page = await context.new_page()
    try:
        await page.goto(url, timeout=15000, wait_until='domcontentloaded')
        await page.wait_for_timeout(3000)
        lower_url = page.url.lower()
        is_login = any(w in lower_url for w in ['login', 'checkpoint', 'challenge'])
        log(name, not is_login, f"{'Logged in' if not is_login else 'Login page'} ({page.url[:50]})")
    except Exception as e:
        log(name, False, str(e)[:60])
    await page.close()

async def verify_credentials():
    """Check credentials file exists and has all accounts"""
    try:
        with open(os.path.join(BASE, 'credentials.json')) as f:
            creds = json.load(f)
        expected = ['instagram', 'tiktok', 'facebook', 'gemini', 'email']
        present = [k for k in expected if k in creds]
        missing = [k for k in expected if k not in creds]
        log("Credentials File", len(missing) == 0,
            f"Have: {', '.join(present)}" + (f" | Missing: {', '.join(missing)}" if missing else ""))
    except Exception as e:
        log("Credentials File", False, str(e))

def verify_local_files():
    """Check all critical files exist"""
    files = {
        'Session State': STATE_FILE,
        'Session Backup': os.path.join(BASE, '.session_tokens_fallback.json'),
        'GitHub Backup': os.path.join(BASE, '.session_backup_github.enc'),
        'Browser Profile': os.path.join(BASE, 'ig_profile'),
        'Recover Script': os.path.join(BASE, 'recover_sessions.py'),
        'GitHub Recover': os.path.join(BASE, 'recover_from_github.py'),
        'Session Procedure': os.path.join(BASE, 'SESSION_PROCEDURE.md'),
        'System Reference': os.path.join(BASE, 'SYSTEM_REFERENCE.md'),
    }
    for name, path in files.items():
        exists = os.path.exists(path)
        size = os.path.getsize(path) if exists else 0
        log(f"File: {name}", exists, f"{size/1024:.0f} KB" if exists else "Missing")

def verify_keepawake():
    """Check keep-awake service is running"""
    result = subprocess.run(
        ['launchctl', 'list', 'com.openclaw.keepawake'],
        capture_output=True, text=True, timeout=5
    )
    log("Keep-Awake Service", result.returncode == 0,
        "Running" if result.returncode == 0 else "Not loaded")

async def main():
    print("=" * 55)
    print("📋 TING-A-LING SYSTEM AUDIT")
    print(f"   {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print("=" * 55)
    
    print("\n🔐 Credentials:")
    await verify_credentials()
    
    print("\n📁 Local Files:")
    verify_local_files()
    
    print("\n🌐 Social Media:")
    await verify_social_platforms()
    
    print("\n☁️ GitHub:")
    await verify_github()
    
    print("\n⚡ System Services:")
    verify_keepawake()
    
    # Summary
    total = len(RESULTS)
    passed = sum(1 for r in RESULTS.values() if r['ok'])
    failed = total - passed
    
    print(f"\n{'='*55}")
    print(f"📊 AUDIT RESULT: {passed}/{total} passed")
    if failed == 0:
        print("✅ ALL SYSTEMS OPERATIONAL")
    else:
        print(f"⚠️  {failed} issue(s) found — see above")
    print(f"{'='*55}\n")
    
    return 0 if failed == 0 else 1

if __name__ == "__main__":
    asyncio.run(main())
