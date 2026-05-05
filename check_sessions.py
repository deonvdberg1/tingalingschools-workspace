#!/usr/bin/env python3
"""
Session Health Check — run daily to verify all 3 platforms are still logged in.
Auto-refreshes sessions. Reports any issues.
"""
import json, os, asyncio, sys
from datetime import datetime

BASE = os.path.dirname(os.path.abspath(__file__))
STATE_FILE = os.path.join(BASE, "ig_playwright_state.json")
PROFILE_DIR = os.path.join(BASE, "ig_profile")

async def check_platform(url, name, timeout=15000):
    """Check if a platform is logged in. Returns (ok, detail)"""
    from playwright.async_api import async_playwright
    
    async with async_playwright() as p:
        context = await p.chromium.launch_persistent_context(
            PROFILE_DIR, headless=True, viewport={'width': 1280, 'height': 900}
        )
        if os.path.exists(STATE_FILE):
            with open(STATE_FILE) as f:
                state = json.load(f)
            await context.add_cookies(state['cookies'])
        
        page = await context.new_page()
        await page.goto(url, timeout=timeout, wait_until='domcontentloaded')
        await page.wait_for_timeout(2000)
        
        url_lower = page.url.lower()
        logged_in = 'login' not in url_lower and 'challenge' not in url_lower and 'checkpoint' not in url_lower
        
        if logged_in:
            detail = f"✅ {name} — OK"
        else:
            detail = f"❌ {name} — LOGIN REQUIRED ({page.url[:80]})"
        
        await context.close()
        return logged_in, detail

async def main():
    results = {}
    
    # Check all platforms
    results['instagram'] = await check_platform('https://www.instagram.com/', 'Instagram')
    results['facebook'] = await check_platform('https://www.facebook.com/tingalingpreprimaryschool', 'Facebook')
    results['tiktok'] = await check_platform('https://www.tiktok.com/@tingalingpreprimary', 'TikTok')
    
    # Print results
    print(f"\n{'='*40}")
    print(f"SOCIAL MEDIA HEALTH CHECK — {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print(f"{'='*40}")
    
    all_ok = True
    for platform, (ok, detail) in results.items():
        print(f"  {detail}")
        if not ok:
            all_ok = False
    
    # Save summary
    status = 'ALL_OK' if all_ok else 'ISSUES_FOUND'
    with open(os.path.join(BASE, '.session_health.json'), 'w') as f:
        json.dump({
            'timestamp': datetime.now().isoformat(),
            'status': status,
            'results': {k: {'ok': v[0], 'detail': v[1]} for k, v in results.items()}
        }, f, indent=2)
    
    print(f"{'='*40}")
    print(f"Status: {status}")
    print(f"{'='*40}\n")
    
    return 0 if all_ok else 1

if __name__ == "__main__":
    asyncio.run(main())
