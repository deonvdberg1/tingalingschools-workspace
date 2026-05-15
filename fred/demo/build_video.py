#!/usr/bin/env python3
"""Build polished Ting-A-Ling WhatsApp demo video"""
from PIL import Image, ImageDraw, ImageFont
import os

OUT = "/Users/deonvandenberg/.openclaw/workspace/fred/demo/v2"
os.makedirs(OUT, exist_ok=True)

# School brand colors
TEAL = (13, 148, 136)
TEAL_DARK = (5, 75, 67)
TEAL_LIGHT = (20, 184, 166)
WHATSAPP_BG = (229, 221, 213)
WHITE = (255, 255, 255)
GREEN_BUBBLE = (220, 248, 198)
DARK = (15, 23, 42)
SLATE = (30, 41, 59)
GRAY = (100, 116, 139)
LG = (232, 232, 232)

FW, FH = 1080, 1920  # 9:16 video

# Fonts
try:
    f_title = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 58)
    f_sub = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 34)
    f_body = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 28)
    f_small = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 22)
    f_logo = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 42)
except:
    f_title = f_sub = f_body = f_small = f_logo = ImageFont.load_default()

# Load school logo
logo = Image.open("/Users/deonvandenberg/.openclaw/workspace/fred/demo/phone-frames/tingaling-logo.png").convert("RGBA")
# Resize logo to fit nicely
logo_ratio = min(300 / logo.width, 300 / logo.height)
logo_w = int(logo.width * logo_ratio)
logo_h = int(logo.height * logo_ratio)
logo_sm = logo.resize((logo_w, logo_h), Image.LANCZOS)

def draw_rounded_rect(draw, xy, radius, fill):
    x1, y1, x2, y2 = xy
    draw.rounded_rectangle(xy, radius=radius, fill=fill)

def make_intro():
    """Opening frame: School name + logo on teal gradient"""
    img = Image.new('RGB', (FW, FH), TEAL)
    draw = ImageDraw.Draw(img)
    
    # Subtle pattern overlay
    for i in range(0, FH, 40):
        draw.rectangle([(0, i), (FW, i+1)], fill=(8, 100, 90, 60))
    
    # School logo
    logo_x = (FW - logo_sm.width) // 2
    logo_y = 350
    img.paste(logo_sm, (logo_x, logo_y), logo_sm)
    
    # School name
    draw.text((FW//2, logo_y + logo_h + 50), "Ting-A-Ling Schools", fill=WHITE, font=f_title, anchor="mt")
    draw.text((FW//2, logo_y + logo_h + 120), "Richards Bay", fill=(200, 240, 235), font=f_sub, anchor="mt")
    
    # Tagline
    draw.text((FW//2, 700), "WhatsApp Communication", fill=WHITE, font=f_title, anchor="mt")
    
    # Feature badges
    features = ["📞 Instant Replies", "🤖 24/7 Availability", "👨‍👩‍👧 Parent Self-Service"]
    y = 900
    for feat in features:
        draw_rounded_rect(draw, (320, y, FW-320, y+50), 25, fill=(255, 255, 255, 30))
        draw.text((FW//2, y+25), feat, fill=WHITE, font=f_sub, anchor="mt")
        y += 70
    
    return img

def make_scene_desc(scene_num, icon, title, desc_lines, accent=TEAL):
    """Description frame between scenes"""
    img = Image.new('RGB', (FW, FH), DARK)
    draw = ImageDraw.Draw(img)
    
    draw.text((60, 250), f"Scene {scene_num}", fill=GRAY, font=f_body)
    
    draw.text((60, 320), f"{icon} {title}", fill=WHITE, font=f_title)
    
    # Teal accent line
    draw_rounded_rect(draw, (60, 400, 200, 404), 2, fill=TEAL_LIGHT)
    
    y = 500
    for line in desc_lines:
        draw.text((60, y), line, fill=(200, 200, 210), font=f_sub)
        y += 50
    
    # Phone icon metaphor
    draw_rounded_rect(draw, (FW//2-80, 900, FW//2+80, 900+160), 30, fill=TEAL)
    draw.text((FW//2, 980), "📱", fill=WHITE, font=f_logo, anchor="mt")
    
    return img

def make_stats():
    """Results frame"""
    img = Image.new('RGB', (FW, FH), DARK)
    draw = ImageDraw.Draw(img)
    
    draw.text((FW//2, 200), "📊 Demo Results", fill=WHITE, font=f_title, anchor="mt")
    draw_rounded_rect(draw, (FW//2-100, 270, FW//2+100, 274), 2, fill=TEAL_LIGHT)
    
    # Big numbers
    stats = [
        ("4", "Questions Answered"),
        ("< 2s", "Avg Response Time"),
        ("0", "Human Interventions"),
        ("24/7", "Availability"),
    ]
    
    y = 450
    for val, label in stats:
        draw.text((FW//2, y), val, fill=TEAL_LIGHT, font=ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 80), anchor="mt")
        draw.text((FW//2, y+100), label, fill=GRAY, font=f_sub, anchor="mt")
        y += 200
    
    return img

def make_outro():
    """Closing frame with school logo + powered by"""
    img = Image.new('RGB', (FW, FH), TEAL)
    draw = ImageDraw.Draw(img)
    
    # Logo
    logo_x = (FW - logo_sm.width) // 2
    img.paste(logo_sm, (logo_x, 350), logo_sm)
    
    draw.text((FW//2, logo_y := 350 + logo_h + 50), "Ting-A-Ling Schools", fill=WHITE, font=f_title, anchor="mt")
    
    draw.text((FW//2, 900), "Questions? Message us on WhatsApp", fill=(200, 240, 235), font=f_sub, anchor="mt")
    
    # Small "Powered by" 
    draw_rounded_rect(draw, (FW//2-140, FH-200, FW//2+140, FH-160), 20, fill=(255, 255, 255, 25))
    draw.text((FW//2, FH-180), "⚡ Powered by AutoEffortless", fill=(200, 240, 235), font=f_small, anchor="mt")
    
    return img

# ── Generate all frames ──
print("Generating frames...")

intro = make_intro()
intro.save(f"{OUT}/01_intro.png")
print("  ✅ 01_intro.png")

# Scene descriptions
scenes = [
    ("1", "💰", "Fee Enquiry", [
        "Parent asks about school fees.",
        "AI instantly responds with fee",
        "structure and contact details.",
    ]),
    ("2", "⏰", "School Hours", [
        "Parent asks about operating times.",
        "AI provides school day, office hours",
        "and aftercare information.",
    ]),
    ("3", "👔", "Uniform Enquiry", [
        "Parent asks where to buy uniform.",
        "AI provides supplier details and",
        "shop hours immediately.",
    ]),
    ("4", "📋", "Absentee Report", [
        "Parent reports child sick.",
        "AI logs the absence and provides",
        "next steps — no waiting for office.",
    ]),
]

for snum, icon, title, lines in scenes:
    desc = make_scene_desc(snum, icon, title, lines)
    desc.save(f"{OUT}/02_desc{snum}.png")
    print(f"  ✅ 02_desc{snum}.png")

stats = make_stats()
stats.save(f"{OUT}/03_stats.png")
print("  ✅ 03_stats.png")

outro = make_outro()
outro.save(f"{OUT}/04_outro.png")
print("  ✅ 04_outro.png")

# Now copy the phone frames from earlier build
import shutil
phone_dir = "/Users/deonvandenberg/.openclaw/workspace/fred/demo/phone-frames"
for i in range(1, 5):
    src = f"{phone_dir}/full-scene{i}.png"
    dst = f"{OUT}/phone_scene{i}.png"
    if os.path.exists(src):
        # Load, resize to fit 1080x1920 with padding
        phone_img = Image.open(src).convert("RGBA")
        
        # Scale to fit width with padding
        target_w = FW - 160
        ratio = target_w / phone_img.width
        new_w = int(phone_img.width * ratio)
        new_h = int(phone_img.height * ratio)
        
        phone_scaled = phone_img.resize((new_w, new_h), Image.LANCZOS)
        
        # Create canvas and paste centered
        canvas = Image.new('RGB', (FW, FH), SLATE)
        paste_x = (FW - new_w) // 2
        paste_y = 120
        canvas.paste(phone_scaled, (paste_x, paste_y), phone_scaled)
        
        # Add scene label at top
        draw = ImageDraw.Draw(canvas)
        scene_labels = [
            "🏫 Fee Enquiry — Parent asks, AI replies",
            "⏰ School Hours — Instant answer",
            "👔 Uniform Info — AI knows it all",
            "📋 Absentee — Logged in seconds",
        ]
        draw.text((FW//2, 50), scene_labels[i-1], fill=WHITE, font=f_body, anchor="mt")
        
        canvas.save(dst)
        print(f"  ✅ phone_scene{i}.png ({canvas.size})")

print("\n✅ All frames generated!")
