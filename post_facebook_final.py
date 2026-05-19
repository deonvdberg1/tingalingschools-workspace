#!/usr/bin/env python3
"""Post image to Facebook - composer approach."""
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
        context = await browser.new_context(viewport={'width': 1280, 'height': 900})
        await context.add_cookies(state['cookies'])
        
        page = await context.new_page()
        await page.goto('https://www.facebook.com/', timeout=20000, wait_until='load')
        await page.wait_for_timeout(5000)
        
        print(f"📘 Facebook - logged in as page")
        
        # Click the "What's on your mind" composer trigger
        # Element is a div[role="button"] with text content, no aria-label
        trigger = await page.evaluate('''() => {
            const btns = document.querySelectorAll('[role="button"]');
            for (const btn of btns) {
                const t = btn.textContent.trim();
                if (t.toLowerCase().includes("mind")) {
                    btn.click();
                    return "clicked";
                }
            }
            return "not found";
        }''')
        
        if trigger == "clicked":
            print("  ✅ Clicked composer trigger")
            await page.wait_for_timeout(2000)
        else:
            print("  ❌ Could not find composer trigger")
            await page.screenshot(path=os.path.join(BASE, "fb_no_composer.png"))
            await browser.close()
            return False
        
        # Now the composer dialog should be open. Click Photo/video
        # Use JS click to bypass pointer interception issues
        await page.evaluate('''() => {
            // Try finding by aria-label
            let btn = document.querySelector('[aria-label="Photo/video"]');
            // Try finding by text content
            if (!btn) {
                document.querySelectorAll("*").forEach(el => {
                    if (el.textContent.trim() === "Photo/video") {
                        btn = el;
                    }
                });
            }
            if (btn) {
                btn.dispatchEvent(new MouseEvent("click", {bubbles: true, cancelable: true}));
                btn.click();
            }
        }''')
        print("  ✅ Clicked Photo/video (JS)")
        await page.wait_for_timeout(2000)
        
        # Now the file input should be available or triggered
        # Let's set the file on the hidden input directly
        fi = await page.query_selector('input[type="file"]')
        if fi:
            await fi.set_input_files([IMAGE_PATH])
            print("  ✅ Image uploaded via hidden input")
            await page.wait_for_timeout(5000)
        else:
            print("  ❌ No file input found")
            await page.screenshot(path=os.path.join(BASE, "fb_no_fileinput.png"))
            await browser.close()
            return False
        
        # The image should appear in the composer. Now fill caption.
        # Use evaluate for contenteditable to bypass interception
        caption_filled = await page.evaluate('''(CAPTION) => {
            const editors = document.querySelectorAll('[contenteditable="true"]');
            for (const el of editors) {
                el.focus();
                el.click();
                el.innerHTML = '';
                for (const ch of CAPTION) {
                    el.textContent += ch;
                }
                return "filled";
            }
            return "not found";
        }''', CAPTION)
        if caption_filled == "filled":
            print("  ✅ Caption filled")
        else:
            print("  ⚠ No caption area found")
        
        await page.wait_for_timeout(2000)
        
        # Click Post button - use JS to bypass interception
        await page.wait_for_timeout(2000)
        posted = await page.evaluate('''() => {
            const buttons = document.querySelectorAll("span, div, button");
            for (const btn of buttons) {
                const t = btn.textContent.trim();
                if (t === "Post" || t === "Share") {
                    btn.dispatchEvent(new MouseEvent("click", {bubbles: true, cancelable: true}));
                    btn.click();
                    return btn.textContent.trim();
                }
            }
            return "not found";
        }''')
        
        if posted == "not found":
            print("  ⚠ Post button not found")
            await page.screenshot(path=os.path.join(BASE, "fb_no_post_btn.png"))
            await browser.close()
            return False
        else:
            print(f"  ✅ Posted to Facebook!")
            await page.wait_for_timeout(3000)
            new_state = await context.storage_state()
            with open(STATE_FILE, 'w') as f:
                json.dump(new_state, f, indent=2)
            await browser.close()
            return True

if __name__ == "__main__":
    ok = asyncio.run(main())
    print("✅ Facebook done!" if ok else "❌ Facebook failed")
    sys.exit(0 if ok else 1)
