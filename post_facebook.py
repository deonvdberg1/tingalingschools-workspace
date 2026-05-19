#!/usr/bin/env python3
"""Post image to Facebook - cookies are working."""
import json, sys, os, asyncio
from playwright.async_api import async_playwright

BASE = os.path.dirname(os.path.abspath(__file__))
STATE_FILE = os.path.join(BASE, "ig_playwright_state.json")
IMAGE_PATH = "/Users/deonvandenberg/.openclaw/media/inbound/69063E8E-C722-4ACA-9BC2-7837C8C864F6---5b06c330-a604-4137-b693-f22589a332b6.png"
CAPTION = "🎒 Enrolments open for 2026 & 2027!\n\nGive your little one a bright start at Ting-A-Ling Pre-Primary. Safe, nurturing, play-based learning in Meerensee.\n\n📍 70 Krewelkring, Meerensee, Richards Bay\n📞 061 527 4429 | 072 456 1282\n📧 tingalingpreprimaryschool@gmail.com\n\nDaycare • Aftercare • Nursery\n\n#TingALingPrePrimary #RichardsBay #Meerensee #PrePrimary #Daycare #Aftercare #Nursery #Enrolments2026 #Enrolments2027"

async def main():
    with open(STATE_FILE) as f:
        state = json.load(f)
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={'width': 1280, 'height': 900}
        )
        await context.add_cookies(state['cookies'])
        
        page = await context.new_page()
        
        print("📘 Facebook...")
        
        # Go to photo upload page
        await page.goto("https://www.facebook.com/photo/", timeout=30000, wait_until="load")
        await page.wait_for_timeout(3000)
        print(f"  URL: {page.url[:80]}")
        print(f"  Title: {await page.title()}")
        
        # Accept cookies if banner appears
        try:
            banner = await page.query_selector('[data-cookiebanner="accept_button"]')
            if banner:
                await banner.click()
                await page.wait_for_timeout(2000)
        except:
            pass
        
        # Check for file input
        fi = await page.query_selector('input[type="file"]')
        if not fi:
            print("  ⚠ No file input, taking screenshot")
            await page.screenshot(path=os.path.join(BASE, "fb_photo_page.png"))
            content = await page.content()
            with open(os.path.join(BASE, "fb_photo_page.html"), "w") as f:
                f.write(content[:15000])
            
            # Try navigating to a different approach - post to timeline
            await page.goto("https://www.facebook.com/", timeout=20000, wait_until="load")
            await page.wait_for_timeout(3000)
            
            # Look for the status composer
            # Facebook uses a div with role="button" and aria-label containing "on your mind"
            composer = await page.query_selector('[role="button"]')
            if composer:
                aria = await composer.get_attribute("aria-label")
                if aria and ("mind" in aria.lower() or "post" in aria.lower()):
                    await composer.click()
                    await page.wait_for_timeout(2000)
            
            # Try clicking directly on "What's on your mind" area
            for sel in [
                '[aria-label*="on your mind"]',
                '[aria-label="Create a post"]',
                '//span[contains(text(), "on your mind")]',
                '[role="button"]:has-text("on your mind")'
            ]:
                try:
                    el = await page.query_selector(sel)
                    if el:
                        await el.click()
                        await page.wait_for_timeout(2000)
                        print("  ✅ Clicked composer")
                        break
                except:
                    continue
            
            fi = await page.query_selector('input[type="file"]')
            if not fi:
                print("  ❌ Still no file input")
                await browser.close()
                return False
        
        if fi:
            await fi.set_input_files([IMAGE_PATH])
            print("  ✅ Image uploaded")
            await page.wait_for_timeout(5000)
            
            # Fill caption
            ce = await page.query_selector('[contenteditable="true"]')
            if ce:
                await ce.click()
                await page.wait_for_timeout(300)
                await ce.fill("")
                await page.wait_for_timeout(200)
                await ce.type(CAPTION, delay=3)
                print("  ✅ Caption filled")
            
            await page.wait_for_timeout(2000)
            
            # Click Post
            for text in ["Post", "Share"]:
                btns = await page.query_selector_all(f'//span[text()="{text}"]')
                btns += await page.query_selector_all(f'[aria-label="{text}"]')
                btns += await page.query_selector_all(f'button:has-text("{text}")')
                for btn in btns:
                    try:
                        await btn.click()
                        print(f"  ✅ Posted to Facebook!")
                        await page.wait_for_timeout(2000)
                        new_state = await context.storage_state()
                        with open(STATE_FILE, 'w') as f:
                            json.dump(new_state, f, indent=2)
                        await browser.close()
                        return True
                    except:
                        continue
            
            print("  ⚠ Post button not found")
            await page.screenshot(path=os.path.join(BASE, "fb_post_btn.png"))
        
        await browser.close()
        return False

if __name__ == "__main__":
    ok = asyncio.run(main())
    print("✅ Facebook posted!" if ok else "❌ Facebook failed")
    sys.exit(0 if ok else 1)
