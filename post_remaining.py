#!/usr/bin/env python3
"""Post to Facebook and TikTok using temporary browser context."""
import json, sys, os, asyncio
from playwright.async_api import async_playwright

BASE = os.path.dirname(os.path.abspath(__file__))
STATE_FILE = os.path.join(BASE, "ig_playwright_state.json")
IMAGE_PATH = "/Users/deonvandenberg/.openclaw/media/inbound/69063E8E-C722-4ACA-9BC2-7837C8C864F6---5b06c330-a604-4137-b693-f22589a332b6.png"
VIDEO_PATH = os.path.join(BASE, "temp_ad_video.mp4")
CAPTION = "🎒 Enrolments open for 2026 & 2027!\n\nGive your little one a bright start at Ting-A-Ling Pre-Primary. Safe, nurturing, play-based learning in Meerensee.\n\n📍 70 Krewelkring, Meerensee, Richards Bay\n📞 061 527 4429 | 072 456 1282\n📧 tingalingpreprimaryschool@gmail.com\n\nDaycare • Aftercare • Nursery\n\n#TingALingPrePrimary #RichardsBay #Meerensee #PrePrimary #Daycare #Aftercare #Nursery #Enrolments2026 #Enrolments2027"

async def main():
    print("Starting...")
    
    with open(STATE_FILE) as f:
        state = json.load(f)
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={'width': 1280, 'height': 900}
        )
        await context.add_cookies(state['cookies'])
        print("✅ Browser started, cookies loaded")

        # === FACEBOOK ===
        print("\n📘 Facebook...")
        page = await context.new_page()
        try:
            await page.goto("https://mbasic.facebook.com/", timeout=30000, wait_until="domcontentloaded")
            await page.wait_for_timeout(3000)
            print(f"  URL: {page.url[:80]}")
            
            if "login" in page.url.lower():
                print("  ❌ Login required")
            else:
                # mbasic.facebook.com has a simpler upload interface
                await page.goto("https://mbasic.facebook.com/photo/upload/", timeout=20000)
                await page.wait_for_timeout(2000)
                print(f"  Upload URL: {page.url[:80]}")
                
                # On mbasic, upload is via a simple file input
                fi = await page.query_selector('input[type="file"]')
                if fi:
                    await fi.set_input_files([IMAGE_PATH])
                    print("  ✅ Image uploaded")
                    await page.wait_for_timeout(3000)
                    
                    # Fill caption on mbasic
                    textarea = await page.query_selector('textarea')
                    if textarea:
                        await textarea.fill(CAPTION)
                        print("  ✅ Caption filled")
                    
                    # Click upload/submit
                    submit = await page.query_selector('input[type="submit"], button[type="submit"]')
                    if submit:
                        await submit.click()
                        print("  ✅ Posted to Facebook!")
                        await page.wait_for_timeout(3000)
                    else:
                        print("  ⚠ Submit button not found")
                else:
                    print("  ⚠ No file input on mbasic")
                    
        except Exception as e:
            print(f"  ❌ Facebook error: {e}")
        await page.close()

        # === TIKTOK ===
        print("\n🎵 TikTok...")
        page = await context.new_page()
        try:
            await page.goto("https://www.tiktok.com/tiktokstudio/upload", timeout=30000, wait_until="domcontentloaded")
            await page.wait_for_timeout(3000)
            print(f"  URL: {page.url[:80]}")
            
            if "login" in page.url.lower() or "auth" in page.url.lower():
                print("  ❌ Login required")
            else:
                fi = await page.query_selector('input[type="file"]')
                if fi:
                    await fi.set_input_files([VIDEO_PATH])
                    print("  ✅ Video uploaded")
                    await page.wait_for_timeout(15000)
                    
                    # Caption
                    ce = await page.query_selector('[contenteditable="true"]')
                    if ce:
                        await ce.click(force=True)
                        await page.wait_for_timeout(300)
                        await ce.fill("")
                        await page.wait_for_timeout(200)
                        await ce.type(CAPTION, delay=5)
                        print("  ✅ Caption filled")
                    
                    await page.wait_for_timeout(5000)
                    
                    # Post button
                    result = await page.evaluate("""() => {
                        for (const btn of document.querySelectorAll('button')) {
                            const t = btn.textContent.trim().toLowerCase();
                            if (t === 'post' || t === 'publish') {
                                btn.click();
                                return 'clicked';
                            }
                        }
                        return 'not found';
                    }""")
                    print(f"  Post button: {result}")
                    if result == 'clicked':
                        print("  ✅ Posted to TikTok!")
                        await page.wait_for_timeout(3000)
                else:
                    print("  ⚠ No file input")
        except Exception as e:
            print(f"  ❌ TikTok error: {e}")
        await page.close()

        # Save state
        new_state = await context.storage_state()
        with open(STATE_FILE, 'w') as f:
            json.dump(new_state, f, indent=2)
        
        await browser.close()
    print("\n✅ Done")

if __name__ == "__main__":
    asyncio.run(main())
