#!/usr/bin/env python3
"""Retry Facebook and TikTok posting with fixes."""
import json, sys, os, asyncio, subprocess
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

def make_video_from_image():
    """Create a static video from the image for TikTok upload."""
    video_path = os.path.join(BASE, "temp_ad_video.mp4")
    if os.path.exists(video_path):
        os.remove(video_path)
    cmd = [
        "ffmpeg", "-y",
        "-loop", "1",
        "-i", IMAGE_PATH,
        "-c:v", "libx264",
        "-t", "5",
        "-pix_fmt", "yuv420p",
        "-vf", "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2",
        "-crf", "23",
        video_path
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"  ffmpeg error: {result.stderr[:200]}")
        return None
    print(f"  ✅ Video created: {video_path}")
    return video_path


async def post_facebook(context):
    """Post to Facebook - try via facebook.com directly (post to timeline + tag page)."""
    print("\n📘 Facebook...")
    page = await context.new_page()
    try:
        # First check if logged in
        await page.goto("https://www.facebook.com/", timeout=20000, wait_until="domcontentloaded")
        await page.wait_for_timeout(3000)

        if "login" in page.url.lower() or "checkpoint" in page.url.lower():
            print("  ❌ Login required")
            await page.close()
            return False

        # Try posting directly to the main composer on homepage
        await page.goto("https://www.facebook.com/", timeout=15000)
        await page.wait_for_timeout(2000)

        # Click on "What's on your mind" area
        composer_clicked = False
        for sel in [
            '[aria-label="What\'s on your mind?"]',
            '[aria-label="What\'s on your mind, Deon?"]',
            '[aria-label="Create a post"]',
            '//span[contains(text(), "on your mind")]',
            '[role="button"]:has-text("on your mind")',
        ]:
            try:
                el = await page.query_selector(sel)
                if el:
                    await el.click()
                    await page.wait_for_timeout(2000)
                    composer_clicked = True
                    break
            except:
                continue

        if not composer_clicked:
            # Try direct URL - create post
            await page.goto("https://www.facebook.com/photo", timeout=15000)
            await page.wait_for_timeout(3000)

        # Upload photo
        fi = await page.query_selector('input[type="file"][accept*="image"]')
        if not fi:
            fi = await page.query_selector('input[type="file"]')
        
        if fi:
            await fi.set_input_files([IMAGE_PATH])
            print("  ✅ Image uploaded")
            await page.wait_for_timeout(3000)
        else:
            print("  ⚠ No file input found")
            await page.screenshot(path=os.path.join(BASE, "debug_fb2.png"))
            await page.close()
            return False

        # Fill caption/description
        caption_area = await page.query_selector('[contenteditable="true"]')
        if caption_area:
            await caption_area.click()
            await page.wait_for_timeout(300)
            await caption_area.fill("")
            await page.wait_for_timeout(200)
            await caption_area.type(CAPTION, delay=3)
            print("  ✅ Caption filled")

        # Click Post
        await page.wait_for_timeout(1000)
        posted = False
        for sel_text in ["Post", "Share Now", "Share"]:
            btns = await page.query_selector_all(f'//span[text()="{sel_text}"]')
            if not btns:
                btns = await page.query_selector_all(f'//div[@aria-label="{sel_text}"]')
            if not btns:
                btns = await page.query_selector_all(f'button:has-text("{sel_text}")')
            for btn in btns:
                try:
                    await btn.click()
                    posted = True
                    print(f"  ✅ Posted to Facebook!")
                    break
                except:
                    continue
            if posted:
                break

        if not posted:
            print("  ⚠ Post button not found")
            await page.screenshot(path=os.path.join(BASE, "debug_fb2.png"))

        await page.wait_for_timeout(2000)
        await page.close()
        return posted

    except Exception as e:
        print(f"  ❌ Facebook error: {e}")
        await page.screenshot(path=os.path.join(BASE, "debug_fb_error2.png"))
        await page.close()
        return False


async def post_tiktok(context, video_path):
    """Post to TikTok via tiktokstudio with a video."""
    print("\n🎵 TikTok...")
    page = await context.new_page()
    try:
        await page.goto("https://www.tiktok.com/tiktokstudio/upload", timeout=20000, wait_until="domcontentloaded")
        await page.wait_for_timeout(3000)

        if "login" in page.url.lower():
            print("  ❌ Login required for TikTok")
            await page.close()
            return False

        # Upload video
        fi = await page.query_selector('input[type="file"]')
        if fi:
            await fi.set_input_files([video_path])
            print("  ✅ Video uploaded (from image)")
            await page.wait_for_timeout(15000)  # TikTok needs time to process
        else:
            print("  ❌ No file input found")
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

        # Wait for processing to finish
        await page.wait_for_timeout(5000)

        # Click Post - try multiple approaches
        posted = False
        for attempt in range(3):
            result = await page.evaluate("""() => {
                const buttons = document.querySelectorAll('button');
                let found = null;
                for (const btn of buttons) {
                    const t = btn.textContent.trim().toLowerCase();
                    if (t === 'post' || t === 'publish') {
                        found = btn;
                        break;
                    }
                }
                if (found) {
                    found.dispatchEvent(new MouseEvent('click', {bubbles: true, cancelable: true}));
                    found.click();
                    return 'clicked';
                }
                return 'not found';
            }""")
            if result == 'clicked':
                posted = True
                print("  ✅ Posted to TikTok!")
                break
            await page.wait_for_timeout(2000)
            print(f"  ⏳ Waiting... (attempt {attempt+1})")

        if not posted:
            print("  ⚠ Post button not found after retries")
            await page.screenshot(path=os.path.join(BASE, "debug_tt2.png"))

        await page.wait_for_timeout(2000)
        await page.close()
        return posted

    except Exception as e:
        print(f"  ❌ TikTok error: {e}")
        await page.screenshot(path=os.path.join(BASE, "debug_tt_error2.png"))
        await page.close()
        return False


async def main():
    print("=" * 50)
    print("📢 Retry: Facebook & TikTok")
    print("=" * 50)

    if not os.path.exists(IMAGE_PATH):
        print(f"❌ Image not found: {IMAGE_PATH}")
        return

    # Create video from image for TikTok
    print("\n🎬 Creating video from image for TikTok...")
    video_path = make_video_from_image()

    async with async_playwright() as p:
        context = await p.chromium.launch_persistent_context(
            PROFILE_DIR, headless=True,
            viewport={'width': 1280, 'height': 900}
        )

        with open(STATE_FILE) as f:
            state = json.load(f)
        await context.add_cookies(state['cookies'])
        print("✅ Sessions loaded")

        fb_ok = await post_facebook(context)
        tt_ok = await post_tiktok(context, video_path) if video_path else False

        # Save updated state
        new_state = await context.storage_state()
        with open(STATE_FILE, 'w') as f:
            json.dump(new_state, f, indent=2)

        await context.close()

    print("\n" + "=" * 50)
    print("RESULTS:")
    print(f"  {'✅' if fb_ok else '❌'} Facebook")
    print(f"  {'✅' if tt_ok else '❌'} TikTok")
    print("=" * 50)

    # Cleanup temp video
    if video_path and os.path.exists(video_path):
        os.remove(video_path)


if __name__ == "__main__":
    asyncio.run(main())
