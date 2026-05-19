#!/usr/bin/env python3
"""Get links to latest posts on each platform."""
import json, os, asyncio
from playwright.async_api import async_playwright

BASE = os.path.dirname(os.path.abspath(__file__))
STATE_FILE = os.path.join(BASE, "ig_playwright_state.json")

async def main():
    with open(STATE_FILE) as f:
        state = json.load(f)
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={'width': 1280, 'height': 900})
        await context.add_cookies(state['cookies'])
        
        links = {}
        
        # === INSTAGRAM ===
        print("🔍 Instagram...")
        page = await context.new_page()
        try:
            await page.goto("https://www.instagram.com/tingalingpreprimary/", timeout=20000, wait_until="load")
            await page.wait_for_timeout(3000)
            links['instagram'] = page.url
            print(f"  {page.url}")
        except Exception as e:
            print(f"  Error: {e}")
            links['instagram'] = "https://www.instagram.com/tingalingpreprimary/"
        await page.close()
        
        # === FACEBOOK ===
        print("🔍 Facebook...")
        page = await context.new_page()
        try:
            await page.goto("https://www.facebook.com/tingalingpreprimaryschool/", timeout=20000, wait_until="load")
            await page.wait_for_timeout(3000)
            links['facebook'] = page.url
            print(f"  {page.url}")
        except Exception as e:
            print(f"  Error: {e}")
            links['facebook'] = "https://www.facebook.com/tingalingpreprimaryschool/"
        await page.close()
        
        # === TIKTOK ===
        print("🔍 TikTok...")
        page = await context.new_page()
        try:
            await page.goto("https://www.tiktok.com/@tingalingpreprimary", timeout=20000, wait_until="load")
            await page.wait_for_timeout(3000)
            links['tiktok'] = page.url
            print(f"  {page.url}")
        except Exception as e:
            print(f"  Error: {e}")
            links['tiktok'] = "https://www.tiktok.com/@tingalingpreprimary"
        await page.close()
        
        await browser.close()
        
        print("\n" + "=" * 50)
        print("POST LINKS:")
        for platform, url in links.items():
            print(f"  {platform.capitalize()}: {url}")
        
        # Save to file
        with open(os.path.join(BASE, "post_links.json"), "w") as f:
            json.dump(links, f, indent=2)
        print("\nSaved to post_links.json")

asyncio.run(main())
