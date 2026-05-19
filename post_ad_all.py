#!/usr/bin/env python3
"""Post the enrollment ad image to Instagram, Facebook, and TikTok."""
import json, sys, os, asyncio
from playwright.async_api import async_playwright

BASE = os.path.dirname(os.path.abspath(__file__))
STATE_FILE = os.path.join(BASE, "ig_playwright_state.json")
PROFILE_DIR = os.path.join(BASE, "ig_profile")
IMAGE_PATH = "/Users/deonvandenberg/.openclaw/media/inbound/69063E8E-C722-4ACA-9BC2-7837C8C864F6---5b06c330-a604-4137-b693-f22589a332b6.png"
CAPTION = (
    "🎒 Enrolments open for 2026 & 2027!\n\n"
    "Give your little one a bright start at Ting-A-Ling Pre-Primary.\n"
    "Safe, nurturing, play-based learning in Meerensee.\n\n"
    "📍 70 Krewelkring, Meerensee, Richards Bay\n"
    "📞 061 527 4429 | 072 456 1282\n"
    "📧 tingalingpreprimaryschool@gmail.com\n\n"
    "Daycare • Aftercare • Nursery\n\n"
    "Come see why Ting-A-Ling is the right choice for your child! 💛\n\n"
    "#TingALingPrePrimary #RichardsBay #Meerensee #PrePrimary #Daycare #Aftercare #Nursery #EarlyChildhoodEducation #Enrolments2026 #Enrolments2027"
)

async def post_instagram(context):
    """Post to Instagram feed."""
    print("\n📸 Instagram...")
    page = await context.new_page()
    try:
        await page.goto("https://www.instagram.com/", timeout=20000, wait_until="domcontentloaded")
        await page.wait_for_timeout(3000)

        if "login" in page.url.lower():
            print("  ❌ Login required for Instagram")
            return False

        # Go to create post
        await page.goto("https://www.instagram.com/", timeout=15000)
        await page.wait_for_timeout(2000)

        # Click Create (+ button) - try multiple selectors
        created = False
        selectors = [
            'svg[aria-label="New post"]',
            '//span[text()="Create"]',
            'a[href="/create"]',
            '//div[contains(@role,"menuitem")]',
        ]
        for sel in selectors:
            try:
                el = await page.query_selector(sel)
                if el:
                    await el.click()
                    await page.wait_for_timeout(1000)
                    created = True
                    break
            except:
                continue

        if not created:
            print("  ⚠ Could not find Create button, trying direct URL")
            await page.goto("https://www.instagram.com/create", timeout=15000)
            await page.wait_for_timeout(3000)

        # Click "Post" option if a dialog appears
        try:
            post_opt = await page.query_selector('//span[text()="Post"]')
            if post_opt:
                await post_opt.click()
                await page.wait_for_timeout(1000)
        except:
            pass

        # Upload image via file input
        fi = await page.query_selector('input[type="file"]')
        if not fi:
            print("  ⚠ No file input found, trying to navigate")
            # Try direct create URL
            await page.goto("https://www.instagram.com/create", timeout=15000)
            await page.wait_for_timeout(3000)
            fi = await page.query_selector('input[type="file"]')

        if not fi:
            print("  ❌ Could not find file upload input")
            await page.screenshot(path=os.path.join(BASE, "debug_ig.png"))
            await page.close()
            return False

        await fi.set_input_files([IMAGE_PATH])
        print("  ✅ Image uploaded")
        await page.wait_for_timeout(3000)

        # Click Next/Forward
        for _ in range(2):
            try:
                next_btn = await page.query_selector('//div[text()="Next"]')
                if not next_btn:
                    next_btn = await page.query_selector('//span[text()="Next"]')
                if not next_btn:
                    next_btn = await page.query_selector('button:has-text("Next")')
                if next_btn:
                    await next_btn.click()
                    await page.wait_for_timeout(1500)
            except:
                await page.wait_for_timeout(500)

        # Fill caption
        await page.wait_for_timeout(2000)
        caption_area = await page.query_selector('[contenteditable="true"]')
        if not caption_area:
            caption_area = await page.query_selector('//div[@role="textbox"]')
        if caption_area:
            await caption_area.click()
            await page.wait_for_timeout(500)
            await caption_area.fill("")
            await page.wait_for_timeout(200)
            for part in CAPTION.split("\n"):
                await caption_area.type(part, delay=5)
                await caption_area.type("\n", delay=5)
                await page.wait_for_timeout(30)
            print("  ✅ Caption filled")

        # Click Share
        await page.wait_for_timeout(1000)
        share_btns = await page.query_selector_all('//div[text()="Share"]')
        if not share_btns:
            share_btns = await page.query_selector_all('//span[text()="Share"]')
        if not share_btns:
            share_btns = await page.query_selector_all('button:has-text("Share")')
        if share_btns:
            await share_btns[0].click()
            print("  ✅ Posted to Instagram!")
            await page.wait_for_timeout(3000)
            await page.close()
            return True
        else:
            print("  ⚠ Share button not found")
            await page.screenshot(path=os.path.join(BASE, "debug_ig_share.png"))
            await page.close()
            return False

    except Exception as e:
        print(f"  ❌ Instagram error: {e}")
        await page.screenshot(path=os.path.join(BASE, "debug_ig_error.png"))
        await page.close()
        return False


async def post_facebook(context):
    """Post to Facebook page feed."""
    print("\n📘 Facebook...")
    page = await context.new_page()
    try:
        await page.goto("https://www.facebook.com/", timeout=20000, wait_until="domcontentloaded")
        await page.wait_for_timeout(3000)

        if "login" in page.url.lower() or "checkpoint" in page.url.lower():
            print("  ❌ Login required for Facebook")
            await page.close()
            return False

        # Go to the page
        await page.goto("https://www.facebook.com/tingalingpreprimaryschool/", timeout=20000)
        await page.wait_for_timeout(3000)

        # Try to find the "What's on your mind?" composer
        composer = await page.query_selector('//span[contains(text(), "on your mind")]')
        if not composer:
            composer = await page.query_selector('//span[contains(text(), "What")]')
        if not composer:
            composer = await page.query_selector('[role="button"]:has-text("on your mind")')
        if composer:
            await composer.click()
            await page.wait_for_timeout(2000)

        # Upload photo
        fi = await page.query_selector('input[type="file"][accept*="image"]')
        if not fi:
            # Look for photo/video button
            photo_btn = await page.query_selector('//span[text()="Photo/video"]')
            if not photo_btn:
                photo_btn = await page.query_selector('//div[contains(text(), "Photo")]')
            if photo_btn:
                await photo_btn.click()
                await page.wait_for_timeout(1000)
                fi = await page.query_selector('input[type="file"]')

        if fi:
            await fi.set_input_files([IMAGE_PATH])
            print("  ✅ Image uploaded")
            await page.wait_for_timeout(3000)
        else:
            print("  ⚠ Could not find file upload, trying direct post approach")
            # Try posting directly to the page
            await page.goto("https://www.facebook.com/tingalingpreprimaryschool/photos/", timeout=15000)
            await page.wait_for_timeout(2000)
            add_btn = await page.query_selector('//span[text()="Add Photos"]')
            if add_btn:
                await add_btn.click()
                await page.wait_for_timeout(1000)
                fi = await page.query_selector('input[type="file"]')
                if fi:
                    await fi.set_input_files([IMAGE_PATH])
                    print("  ✅ Image uploaded via Photos tab")
                    await page.wait_for_timeout(3000)

        # Fill caption
        caption_area = await page.query_selector('[contenteditable="true"]')
        if not caption_area:
            caption_area = await page.query_selector('//div[@role="textbox"]')
        if caption_area:
            await caption_area.click()
            await page.wait_for_timeout(500)
            await caption_area.fill("")
            await page.wait_for_timeout(200)
            await caption_area.type(CAPTION, delay=5)
            print("  ✅ Caption filled")

        # Click Post
        await page.wait_for_timeout(1000)
        post_btn = await page.query_selector('//span[text()="Post"]')
        if not post_btn:
            post_btn = await page.query_selector('//div[@aria-label="Post"]')
        if not post_btn:
            post_btn = await page.query_selector('button:has-text("Post")')
        if post_btn:
            await post_btn.click()
            print("  ✅ Posted to Facebook!")
            await page.wait_for_timeout(3000)
            await page.close()
            return True
        else:
            print("  ⚠ Post button not found")
            await page.screenshot(path=os.path.join(BASE, "debug_fb.png"))
            await page.close()
            return False

    except Exception as e:
        print(f"  ❌ Facebook error: {e}")
        await page.screenshot(path=os.path.join(BASE, "debug_fb_error.png"))
        await page.close()
        return False


async def post_tiktok(context):
    """Post to TikTok (photo/slideshow mode)."""
    print("\n🎵 TikTok...")
    page = await context.new_page()
    try:
        await page.goto("https://www.tiktok.com/tiktokstudio/upload", timeout=20000, wait_until="domcontentloaded")
        await page.wait_for_timeout(3000)

        if "login" in page.url.lower():
            print("  ❌ Login required for TikTok")
            await page.close()
            return False

        # Upload image
        fi = await page.query_selector('input[type="file"]')
        if fi:
            await fi.set_input_files([IMAGE_PATH])
            print("  ✅ Image uploaded")
            await page.wait_for_timeout(5000)
        else:
            print("  ❌ No file input found on TikTok")
            await page.close()
            return False

        # Fill caption
        caption_area = await page.query_selector('[contenteditable="true"]')
        if caption_area:
            await caption_area.click(force=True)
            await page.wait_for_timeout(300)
            await caption_area.fill("")
            await page.wait_for_timeout(200)
            for part in CAPTION.split("\n"):
                await caption_area.type(part, delay=5)
                await page.wait_for_timeout(30)
            print("  ✅ Caption filled")

        # Click Post
        await page.wait_for_timeout(1000)
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

        if result == 'clicked':
            print("  ✅ Posted to TikTok!")
            await page.wait_for_timeout(3000)
            await page.close()
            return True
        else:
            print("  ⚠ Post button not found on TikTok")
            await page.screenshot(path=os.path.join(BASE, "debug_tt.png"))
            await page.close()
            return False

    except Exception as e:
        print(f"  ❌ TikTok error: {e}")
        await page.screenshot(path=os.path.join(BASE, "debug_tt_error.png"))
        await page.close()
        return False


async def main():
    print("=" * 50)
    print("📢 Posting Enrollment Ad to All Platforms")
    print("=" * 50)

    if not os.path.exists(IMAGE_PATH):
        print(f"❌ Image not found: {IMAGE_PATH}")
        return False
    if not os.path.exists(STATE_FILE):
        print(f"❌ State file not found: {STATE_FILE}")
        return False

    async with async_playwright() as p:
        context = await p.chromium.launch_persistent_context(
            PROFILE_DIR, headless=True,
            viewport={'width': 1280, 'height': 900}
        )

        # Load saved cookies
        with open(STATE_FILE) as f:
            state = json.load(f)
        await context.add_cookies(state['cookies'])
        print("✅ Sessions loaded from state file")

        results = {}

        results['instagram'] = await post_instagram(context)
        results['facebook'] = await post_facebook(context)
        results['tiktok'] = await post_tiktok(context)

        # Save updated state
        new_state = await context.storage_state()
        with open(STATE_FILE, 'w') as f:
            json.dump(new_state, f, indent=2)

        await context.close()

    print("\n" + "=" * 50)
    print("RESULTS:")
    for platform, ok in results.items():
        status = "✅" if ok else "❌"
        print(f"  {status} {platform.capitalize()}")
    print("=" * 50)

    return all(results.values())


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
