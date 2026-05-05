#!/usr/bin/env python3
"""Post video to TikTok via TikTok Studio - automated"""
import json, sys, os, asyncio
from playwright.async_api import async_playwright

BASE = os.path.dirname(os.path.abspath(__file__))
STATE_FILE = os.path.join(BASE, "ig_playwright_state.json")
PROFILE_DIR = os.path.join(BASE, "ig_profile")

async def post_video(video_path, caption, public=True):
    """Post a video to TikTok. Returns True if successful."""
    async with async_playwright() as p:
        context = await p.chromium.launch_persistent_context(
            PROFILE_DIR, headless=True,
            viewport={'width': 1280, 'height': 900}
        )
        with open(STATE_FILE) as f:
            state = json.load(f)
        await context.add_cookies(state['cookies'])
        
        page = await context.new_page()
        await page.goto('https://www.tiktok.com/tiktokstudio/upload', timeout=20000, wait_until='domcontentloaded')
        await page.wait_for_timeout(3000)
        
        if 'login' in page.url.lower():
            print("❌ Not logged in")
            await context.close()
            return False
        
        # Upload video
        fi = await page.query_selector('input[type="file"]')
        await fi.set_input_files([video_path])
        await page.wait_for_timeout(15000)
        
        # Type caption
        ce = await page.query_selector('[contenteditable="true"]')
        if ce:
            await ce.click(force=True)
            await page.wait_for_timeout(300)
            await ce.fill('')
            await page.wait_for_timeout(200)
            for part in caption.split('\n'):
                await ce.type(part, delay=8)
                await page.wait_for_timeout(50)
        
        if not public:
            # Change privacy to "Only me" (already default)
            pass
        
        # Click Post via JavaScript for reliability
        result = await page.evaluate("""() => {
            const buttons = document.querySelectorAll('button');
            for (const btn of buttons) {
                if (btn.textContent.trim() === 'Post') {
                    btn.dispatchEvent(new MouseEvent('click', {bubbles: true, cancelable: true}));
                    btn.click();
                    return 'clicked';
                }
            }
            return 'not found';
        }""")
        
        await page.wait_for_timeout(5000)
        
        # Save state
        state = await context.storage_state()
        with open(STATE_FILE, 'w') as f:
            json.dump(state, f, indent=2)
        
        await context.close()
        return result == 'clicked'

async def main():
    video = sys.argv[1] if len(sys.argv) > 1 else 'tip_tuesday_slideshow.mp4'
    caption = sys.argv[2] if len(sys.argv) > 2 else "Is your little one ready for big school? Here are 3 signs to look for 👇 #ParentingTips #RichardsBay"
    
    ok = await post_video(video, caption)
    print("OK" if ok else "FAIL")
    sys.exit(0 if ok else 1)

if __name__ == "__main__":
    asyncio.run(main())
