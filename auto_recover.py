#!/usr/bin/env python3
"""
Auto-Recovery System — detects and fixes breakage after macOS updates.
Runs this on every heartbeat. If things broke, this fixes them autonomously.

What it checks:
- Playwright browsers still work
- Python dependencies intact
- Session files still accessible  
- Social media still logged in

What it fixes:
- Re-installs Playwright browsers if missing
- Re-installs Python packages if broken
- Recovers sessions from GitHub backup if state file corrupt
"""
import json, os, sys, subprocess, asyncio, time
from datetime import datetime

BASE = os.path.dirname(os.path.abspath(__file__))
STATE_FILE = os.path.join(BASE, "ig_playwright_state.json")
RECOVERY_FILE = os.path.join(BASE, "recover_sessions.py")
GITHUB_RECOVERY = os.path.join(BASE, "recover_from_github.py")

ISSUES = []
FIXES = []

def log(msg, level="INFO"):
    print(f"  [{level}] {msg}")

def check(cmd, timeout=15):
    """Run a command and return (ok, output)"""
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        return result.returncode == 0, result.stdout.strip()
    except subprocess.TimeoutExpired:
        return False, "TIMEOUT"
    except FileNotFoundError:
        return False, "NOT_FOUND"

async def check_social_platform(name, url):
    """Quick check if a social platform is accessible"""
    try:
        from playwright.async_api import async_playwright
        async with async_playwright() as p:
            context = await p.chromium.launch_persistent_context(
                os.path.join(BASE, 'ig_profile'), headless=True,
                viewport={'width': 1280, 'height': 900}
            )
            if os.path.exists(STATE_FILE):
                with open(STATE_FILE) as f:
                    state = json.load(f)
                # Normalize cookies: Playwright exports secure/httpOnly as int, needs bool
                cookies = state['cookies']
                for c in cookies:
                    if 'secure' in c and not isinstance(c['secure'], bool):
                        c['secure'] = bool(c['secure'])
                    if 'httpOnly' in c and not isinstance(c['httpOnly'], bool):
                        c['httpOnly'] = bool(c['httpOnly'])
                await context.add_cookies(cookies)
            
            page = await context.new_page()
            await page.goto(url, timeout=10000, wait_until='domcontentloaded')
            await page.wait_for_timeout(2000)
            
            lower_url = page.url.lower()
            is_login = any(w in lower_url for w in ['login', 'checkpoint', 'challenge'])
            
            if is_login:
                ISSUES.append(f"{name} — redirected to login")
                return False
            return True
    except Exception as e:
        ISSUES.append(f"{name} — {str(e)[:50]}")
        return False

def fix_playwright():
    """Re-install Playwright browsers"""
    log("Attempting Playwright fix...", "FIX")
    ok, _ = check(['playwright', 'install', 'chromium'], timeout=60)
    if ok:
        FIXES.append("Re-installed Playwright Chromium")
        log("Playwright re-installed", "OK")
    else:
        log("Could not install Playwright", "FAIL")
    return ok

def fix_python_packages():
    """Re-install critical Python packages"""
    log("Re-installing Python packages...", "FIX")
    packages = ['playwright', 'cryptography', 'browser-cookie3']
    for pkg in packages:
        ok, _ = check(['pip3', 'install', '--upgrade', pkg], timeout=30)
        if ok:
            FIXES.append(f"Updated {pkg}")
            log(f"{pkg} updated", "OK")
        else:
            log(f"{pkg} failed", "FAIL")

def fix_sessions():
    """Try to recover sessions"""
    log("Attempting session recovery...", "FIX")
    
    # Method 1: Recover from fallback
    if os.path.exists(RECOVERY_FILE):
        ok, out = check(['python3', RECOVERY_FILE], timeout=15)
        if ok:
            FIXES.append("Sessions recovered from fallback tokens")
            log("Sessions recovered from fallback", "OK")
            return True
    
    # Method 2: Recover from GitHub backup
    if os.path.exists(GITHUB_RECOVERY):
        ok, out = check(['python3', GITHUB_RECOVERY], timeout=15)
        if ok or "✅" in out:
            FIXES.append("Sessions recovered from GitHub backup")
            log("Sessions recovered from GitHub", "OK")
            return True
    
    log("Session recovery failed", "FAIL")
    return False

async def main():
    print(f"\n{'='*50}")
    print(f"🔧 AUTO-RECOVERY SCAN")
    print(f"   {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print(f"{'='*50}")
    
    # STEP 1: Basic system checks
    print(f"\n📋 System Checks:")
    
    ok, py_ver = check(['python3', '--version'])
    log(f"Python: {py_ver}" if ok else "Python: MISSING", "OK" if ok else "FAIL")
    if not ok:
        ISSUES.append("Python not found")
    
    ok, pw_ver = check(['playwright', '--version'])
    log(f"Playwright: {pw_ver}" if ok else "Playwright: MISSING", "OK" if ok else "FAIL")
    if not ok:
        ISSUES.append("Playwright CLI not found")
    
    # Check state file
    state_exists = os.path.exists(STATE_FILE)
    log(f"Session state: {'EXISTS' if state_exists else 'MISSING'}", "OK" if state_exists else "FAIL")
    if not state_exists:
        ISSUES.append("Session state file missing")
    
    # Check profile
    profile_exists = os.path.exists(os.path.join(BASE, 'ig_profile'))
    log(f"Browser profile: {'EXISTS' if profile_exists else 'MISSING'}", "OK" if profile_exists else "FAIL")
    if not profile_exists:
        ISSUES.append("Browser profile missing")
    
    # STEP 2: If issues found, auto-fix
    if ISSUES:
        print(f"\n🔧  Found {len(ISSUES)} issue(s):")
        for issue in ISSUES:
            print(f"   ❌ {issue}")
        
        print(f"\n🛠️  Auto-recovery in progress...")
        
        if not ok:  # Playwright missing
            fix_playwright()
        
        fix_python_packages()
        
        if not state_exists or not profile_exists:
            fix_sessions()
    
    # STEP 3: Quick social check (only if we can launch browser)
    if ok or os.path.exists(os.path.join(BASE, 'ig_profile')):
        print(f"\n🌐 Social Media Check:")
        try:
            ig_ok = await check_social_platform("Instagram", "https://www.instagram.com/")
            log(f"Instagram: {'OK' if ig_ok else 'LOGIN REQUIRED'}", "OK" if ig_ok else "FAIL")
            
            fb_ok = await check_social_platform("Facebook", "https://www.facebook.com/")
            log(f"Facebook: {'OK' if fb_ok else 'LOGIN REQUIRED'}", "OK" if fb_ok else "FAIL")
            
            tt_ok = await check_social_platform("TikTok", "https://www.tiktok.com/")
            log(f"TikTok: {'OK' if tt_ok else 'LOGIN REQUIRED'}", "OK" if tt_ok else "FAIL")
            
            if not all([ig_ok, fb_ok, tt_ok]):
                ISSUES.append("Some social platforms need re-login")
        except Exception as e:
            log(f"Social check failed: {e}", "FAIL")
            ISSUES.append(f"Social check error: {e}")
    
    # STEP 4: Summary
    print(f"\n{'='*50}")
    if FIXES:
        print(f"✅ Applied {len(FIXES)} fix(es):")
        for fix in FIXES:
            print(f"   🔧 {fix}")
    
    if not ISSUES and not FIXES:
        print(f"✅ All systems healthy — no issues found")
    elif not ISSUES and FIXES:
        print(f"✅ Issues resolved — all clean now")
    else:
        print(f"⚠️  {len(ISSUES)} issue(s) remain:")
        for issue in ISSUES:
            print(f"   ❌ {issue}")
    
    print(f"{'='*50}\n")
    
    # Save health report
    with open(os.path.join(BASE, '.auto_recovery_log.json'), 'w') as f:
        json.dump({
            'timestamp': datetime.now().isoformat(),
            'issues': ISSUES,
            'fixes': FIXES,
            'healthy': len(ISSUES) == 0
        }, f, indent=2)
    
    return 0 if len(ISSUES) == 0 else 1

if __name__ == "__main__":
    asyncio.run(main())
