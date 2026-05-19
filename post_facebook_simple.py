#!/usr/bin/env python3
"""Post image to Facebook."""
import json, sys, os, asyncio
from playwright.async_api import async_playwright

BASE = os.path.dirname(os.path.abspath(__file__))
STATE_FILE = os.path.join(BASE, "ig_playwright_state.json")
PROFILE_DIR = os.path.join(BASE, "ig_profile")
IMAGE_PATH = "/Users/deonvandenberg/.openclaw/media/inbound/69063E8E-C722-4ACA-9BC2-7837C8C864F6---5b06c330-a604-4137-b693-f22589a332b6.png"
CAPTION = "🎒 Enrolments open for 2026 & 2027!\n\nGive your little one a bright start at Ting-A-Ling Pre-Primary. Safe, nurturing, play-based learning in Meerensee.\n\n📍 70 Krewelkring, Meerensee, Richards Bay\n📞 061 527 4429 | 072 456 1282\n📧 tingalingpreprimaryschool@gmail.com\n\nDaycare • Aftercare • Nursery\n\n#TingALingPrePrimary #RichardsBay #Meerensee #PrePrimary #Daycare #Aftercare #Nursery #Enrolments2026 #Enrolments2027"

async def main():
    async with async_playwright() as p:
        context = await p.chromium.launch_persistent_context(
            PROFILE_DIR, headless=True,
            viewport={'width': 1280, 'height': 900}
        )
        with open(STATE_FILE) as f:
            state = json.load(f)
        await context.add_cookies(state['cookies'])

        page = await context.new_page()

        # Check login
        await page.goto("https://www.facebook.com/", timeout=20000, wait_until="domcontentloaded")
        await page.wait_for_timeout(3000)
        print(f"URL: {page.url}")

        if "login" in page.url.lower() or "checkpoint" in page.url.lower():
            print("❌ Login required")
            await context.close()
            return False

        # Try posting via /photos page - simpler flow
        await page.goto("https://www.facebook.com/photo/", timeout=15000)
        await page.wait_for_timeout(2000)
        print(f"Photo page URL: {page.url}")

        # Upload file
        fi = await page.query_selector('input[type="file"]')
        if not fi:
            print("No file input, waiting...")
            await page.wait_for_timeout(3000)
            fi = await page.query_selector('input[type="file"]')
        
        if fi:
            await fi.set_input_files([IMAGE_PATH])
            print("✅ Image uploaded")
            await page.wait_for_timeout(4000)
        else:
            print("❌ No file input found")
            await page.screenshot(path=os.path.join(BASE, "fb_no_upload.png"))
            # Try alternative: go to newsfeed and try posting there
            await page.goto("https://www.facebook.com/", timeout=15000)
            await page.wait_for_timeout(3000)
            # Take a snapshot of the page to see what's on it
            snap = await page.content()
            # Save page content for debugging
            with open(os.path.join(BASE, "fb_page.html"), "w") as f:
                f.write(snap[:5000])
            print("Saved page snapshot to fb_page.html")
            
            # Try clicking to open composer
            try:
                # Try clicking on the status box
                el = await page.query_selector('[role="button"]:has-text("on your mind")')
                if not el:
                    el = await page.query_selector('[aria-label*="mind"]')
                if el:
                    await el.click()
                    print("Clicked status box")
                    await page.wait_for_timeout(3000)
                    fi = await page.query_selector('input[type="file"]')
                    if fi:
                        await fi.set_input_files([IMAGE_PATH])
                        print("✅ Image uploaded")
                        await page.wait_for_timeout(4000)
            except Exception as e:
                print(f"Composer click failed: {e}")

        if not fi:
            await context.close()
            return False

        # Fill caption
        caption_area = await page.query_selector('[contenteditable="true"]')
        if not caption_area:
            caption_area = await page.query_selector('[contenteditable]')
        if caption_area:
            await caption_area.click()
            await page.wait_for_timeout(300)
            await caption_area.fill("")
            await page.wait_for_timeout(200)
            await caption_area.type(CAPTION, delay=3)
            print("✅ Caption filled")
        else:
            print("⚠ No caption area found")
            await page.screenshot(path=os.path.join(BASE, "fb_no_caption.png"))

        # Look for Post/Share button
        await page.wait_for_timeout(2000)
        for text in ["Post", "Share", "Share Now", "Post Now"]:
            for btn in await page.query_selector_all(f'//span[text()="{text}"]'):
                try:
                    await btn.click()
                    print(f"✅ Posted to Facebook!")
                    await page.wait_for_timeout(3000)
                    await context.close()
                    return True
                except:
                    continue
            for btn in await page.query_selector_all(f'[aria-label="{text}"]'):
                try:
                    await btn.click()
                    print(f"✅ Posted to Facebook!")
                    await page.wait_for_timeout(3000)
                    await context.close()
                    return True
                except:
                    continue
            for btn in await page.query_selector_all(f'button:has-text("{text}")'):
                try:
                    await btn.click()
                    print(f"✅ Posted to Facebook!")
                    await page.wait_for_timeout(3000)
                    await context.close()
                    return True
                except:
                    continue

        print("⚠ Could not find Post button")
        await page.screenshot(path=os.path.join(BASE, "fb_no_postbtn.png"))
        await context.close()
        return False

if __name__ == "__main__":
    ok = asyncio.run(main())
    sys.exit(0 if ok else 1)
