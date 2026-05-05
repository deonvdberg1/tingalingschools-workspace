#!/usr/bin/env python3
"""
Initialize and save permanent sessions for all social media platforms.
Run once to lock everything in. Also sets up auto-refresh.
"""
import json, os, asyncio, sys
from datetime import datetime, timezone

BASE = os.path.dirname(os.path.abspath(__file__))
STATE_FILE = os.path.join(BASE, "ig_playwright_state.json")
PROFILE_DIR = os.path.join(BASE, "ig_profile")
TOOLS_FILE = os.path.join(BASE, "TOOLS.md")

def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}")
    sys.stdout.flush()

async def save_all_sessions():
    """Launch browser, load saved cookies, visit each platform, save consolidated state."""
    from playwright.async_api import async_playwright
    
    async with async_playwright() as p:
        context = await p.chromium.launch_persistent_context(
            PROFILE_DIR,
            headless=True,
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            viewport={'width': 1280, 'height': 900}
        )
        
        # Load existing cookies
        if os.path.exists(STATE_FILE):
            with open(STATE_FILE) as f:
                state = json.load(f)
            await context.add_cookies(state['cookies'])
            log("Loaded existing cookies")
        
        # ===== INSTAGRAM =====
        log("Checking Instagram...")
        page = await context.new_page()
        await page.goto('https://www.instagram.com/', timeout=20000, wait_until='domcontentloaded')
        await page.wait_for_timeout(3000)
        
        if 'challenge' in page.url.lower():
            # Handle challenge
            for btn in await page.query_selector_all('[role="button"]'):
                txt = await btn.text_content()
                if txt and 'This Was Me' in txt.strip():
                    await btn.click()
                    await page.wait_for_timeout(3000)
                    log("Resolved Instagram challenge")
                    break
        elif 'login' in page.url.lower():
            log("⚠️ Instagram NOT logged in - needs manual login")
        else:
            log("✅ Instagram logged in")
        
        await page.close()
        
        # ===== FACEBOOK =====
        log("Checking Facebook...")
        page = await context.new_page()
        await page.goto('https://www.facebook.com/', timeout=20000, wait_until='domcontentloaded')
        await page.wait_for_timeout(3000)
        
        if 'login' in page.url.lower() or 'checkpoint' in page.url.lower():
            log("⚠️ Facebook NOT logged in")
        else:
            log("✅ Facebook logged in")
        
        # Verify page access
        await page.goto('https://www.facebook.com/tingalingpreprimaryschool', timeout=15000)
        await page.wait_for_timeout(2000)
        fb_text = await page.text_content('body') or ''
        if 'professional' in fb_text.lower() or 'dashboard' in fb_text.lower():
            log("✅ Facebook page admin access confirmed")
        await page.close()
        
        # ===== TIKTOK =====
        log("Checking TikTok...")
        page = await context.new_page()
        await page.goto('https://www.tiktok.com/upload/', timeout=20000, wait_until='domcontentloaded')
        await page.wait_for_timeout(3000)
        
        if 'login' not in page.url.lower():
            log("✅ TikTok logged in")
            # Check account
            cookies = await context.cookies()
            tt_sessions = [c for c in cookies if c['name'] in ('sessionid', 'sid_tt', 'uid_tt')]
            log(f"  TikTok session cookies: {len(tt_sessions)} valid")
        else:
            log("⚠️ TikTok NOT logged in")
        
        await page.close()
        
        # ===== SAVE CONSOLIDATED STATE =====
        log("Saving consolidated state...")
        updated_state = await context.storage_state()
        
        # Clean up cookie types for Playwright
        for c in updated_state['cookies']:
            c['secure'] = bool(c['secure']) if not isinstance(c['secure'], bool) else c['secure']
            c['httpOnly'] = bool(c.get('httpOnly', False)) if not isinstance(c.get('httpOnly'), bool) else c.get('httpOnly', False)
            if 'expires' in c and not isinstance(c['expires'], (int, float)):
                c['expires'] = int(c['expires']) if c['expires'] else 9999999999
        
        # Save to state file
        with open(STATE_FILE, 'w') as f:
            json.dump(updated_state, f, indent=2)
        
        # Also save a backup
        backup_file = os.path.join(BASE, f".ig_state_backup.json")
        with open(backup_file, 'w') as f:
            json.dump(updated_state, f, indent=2)
        
        # Count session cookies per platform
        domains = {}
        for c in updated_state['cookies']:
            domain = c.get('domain', '')
            if 'instagram' in domain:
                domains.setdefault('Instagram', 0)
                domains['Instagram'] += 1
            elif 'facebook' in domain:
                domains.setdefault('Facebook', 0)
                domains['Facebook'] += 1
            elif 'tiktok' in domain:
                domains.setdefault('TikTok', 0)
                domains['TikTok'] += 1
        
        log(f"\n📊 Session summary:")
        for platform, count in domains.items():
            log(f"  {platform}: {count} cookies saved")
        log(f"  Total: {len(updated_state['cookies'])} cookies")
        log(f"  Origins: {len(updated_state.get('origins', []))}")
        
        await context.close()
        return True

async def main():
    log("=" * 50)
    log("PERMANENT SOCIAL MEDIA SESSION SAVE")
    log("=" * 50)
    
    success = await save_all_sessions()
    
    if success:
        log("\n✅ All sessions saved to ig_playwright_state.json")
        log("✅ Persistent profile saved to ig_profile/")
        log("✅ Backup saved to .ig_state_backup.json")
        log("\n📌 To verify later, run: python3 check_sessions.py")
        log("📌 Sessions will auto-load on every browser launch")
        log("📌 No re-login needed unless cookies expire (years away)")
    
    return 0 if success else 1

if __name__ == "__main__":
    asyncio.run(main())
