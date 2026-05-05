#!/usr/bin/env python3
"""Create Tip Tuesday carousel: 3 Signs Your Child is Ready for Pre-Primary"""

from PIL import Image, ImageDraw, ImageFont
import os

OUT = "/Users/deonvandenberg/.openclaw/workspace/tip_tuesday"
os.makedirs(OUT, exist_ok=True)

# Colors
BG = (255, 248, 235)     # warm cream
ACCENT = (255, 107, 53)  # warm orange - Tingaling vibes
DARK = (60, 40, 30)      # dark brown text
SECONDARY = (46, 134, 193)  # calm blue
GREEN = (39, 174, 96)    # fresh green
WHITE = (255, 255, 255)
LIGHT_ACCENT = (255, 230, 210)

W, H = 1080, 1080  # square Instagram post

# Try to load logo
logo_path = None
for fname in os.listdir("/Users/deonvandenberg/.openclaw/media/inbound/"):
    if fname.startswith("35b41dbf"):
        logo_path = os.path.join("/Users/deonvandenberg/.openclaw/media/inbound/", fname)
        break

logo = Image.open(logo_path).resize((200, 200), Image.LANCZOS) if logo_path else None

# Fonts
def load_font(size, bold=False):
    paths = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Supplemental/Helvetica.ttc",
        "/Library/Fonts/Arial Unicode.ttf",
    ]
    for p in paths:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except:
                continue
    return ImageFont.load_default()

font_title = load_font(72, bold=True)
font_subtitle = load_font(36)
font_body = load_font(42, bold=True)
font_body_small = load_font(34)
font_label = load_font(28, bold=True)
font_sign_num = load_font(64, bold=True)
font_brand = load_font(22)

# --- Card 1: Title Card ---
def draw_title_card():
    img = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img)
    
    # Accent stripe top
    draw.rectangle([(0, 0), (W, 20)], fill=ACCENT)
    
    # Decorative circle top-right
    draw.ellipse([(W-180, -60), (W+20, 140)], fill=LIGHT_ACCENT, outline=None)
    draw.ellipse([(W-140, -20), (W-20, 100)], fill=ACCENT, outline=None)
    
    # Small decorative elements
    draw.ellipse([(-40, 200), (40, 280)], fill=LIGHT_ACCENT, outline=None)
    draw.ellipse([(50, 250), (90, 290)], fill=SECONDARY, outline=None)
    
    # Logo
    if logo:
        img.paste(logo, (W//2 - 100, 140), logo if logo.mode == 'RGBA' else None)
    
    # Brand label
    draw.text((W//2, 360), "Ting-A-Ling Pre-Primary", fill=SECONDARY, font=font_label, anchor="mt")
    
    # Tip Tuesday badge
    badge_y = 430
    badge_w = 320
    draw.rounded_rectangle([(W//2 - badge_w//2, badge_y-20), (W//2 + badge_w//2, badge_y+35)], 
                           radius=20, fill=ACCENT)
    draw.text((W//2, badge_y+7), "✨ TIP TUESDAY ✨", fill=WHITE, font=font_label, anchor="mt")
    
    # Main headline
    draw.text((W//2, 540), "3 Signs Your", fill=DARK, font=font_title, anchor="mt")
    draw.text((W//2, 620), "Child is Ready for", fill=DARK, font=font_title, anchor="mt")
    draw.text((W//2, 700), "Pre-Primary School", fill=ACCENT, font=font_title, anchor="mt")
    
    # Subtitle
    draw.text((W//2, 800), "📍 Richards Bay | Ages 3-6", fill=SECONDARY, font=font_subtitle, anchor="mt")
    
    # Bottom stripe
    draw.rectangle([(0, H-20), (W, H)], fill=ACCENT)
    
    # Swipe hint
    draw.text((W//2, H-70), "👆 Swipe for the signs →", fill=(180, 160, 140), font=font_brand, anchor="mt")
    
    img.save(f"{OUT}/card_1_title.jpg", quality=92)
    print("✅ card_1_title.jpg")

# --- Card 2: Sign 1 - Independence ---
def draw_sign_card(num, title, desc, emoji, color, bg_photo=None):
    img = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img)
    
    # Top accent bar
    draw.rectangle([(0, 0), (W, 12)], fill=color)
    
    # Number badge
    badge_size = 100
    draw.ellipse([(W//2 - badge_size//2, 50), (W//2 + badge_size//2, 150)], fill=color)
    draw.text((W//2, 100), str(num), fill=WHITE, font=font_sign_num, anchor="mm")
    
    # Emoji big
    draw.text((W//2, 270), emoji, fill=DARK, font=load_font(120), anchor="mm")
    
    # Title
    draw.text((W//2, 430), title, fill=color, font=font_title, anchor="mt")
    
    # Description - multi-line
    lines = [
        desc[0],
        desc[1],
        desc[2],
    ]
    y = 530
    for line in lines:
        draw.text((W//2, y), line, fill=DARK, font=font_body_small, anchor="mt")
        y += 55
    
    # Bottom info
    draw.rectangle([(0, H-50), (W, H)], fill=color)
    draw.text((W//2, H-25), f"Ting-A-Ling Pre-Primary | Richards Bay", fill=WHITE, font=font_brand, anchor="mm")
    
    # Swipe indicator
    if num < 3:
        draw.text((W-60, H//2), "›", fill=(200, 190, 180), font=load_font(80), anchor="mm")
    
    img.save(f"{OUT}/card_{num+1}_sign{num}.jpg", quality=92)
    print(f"✅ card_{num+1}_sign{num}.jpg")

# --- Card 3: Sign 2 - Following Instructions ---
# --- Card 4: Sign 3 - Social Readiness ---

print("Creating Tip Tuesday carousel...")

draw_title_card()

draw_sign_card(
    1, "They Show Independence",
    ["Can they dress themselves? Pack away toys?", "Little signs of independence mean they're", "ready for the classroom routine. 🧸"],
    "🌟", ACCENT
)

draw_sign_card(
    2, "They Follow Instructions",
    ["Can your child follow simple 2-step", "instructions? 'Please put your bag away", "and sit down' — that's school ready! 🎒"],
    "👂", SECONDARY
)

draw_sign_card(
    3, "They're Socially Ready",
    ["Do they play with other children, share", "toys, and communicate their needs?", "Social skills = confidence at school. 🤝"],
    "🤗", GREEN
)

print(f"\n✅ All done! 4 images saved to {OUT}/")
print("Post draft ready for review:")
print("  Caption: Is your little one ready for big school? Here are 3 signs to look for 👇\n"
      "  Has your child shown any of these signs? Tell us in the comments! 💬\n"
      "  #TingALing #TipTuesday #RichardsBay #PrePrimary #SchoolReady")
