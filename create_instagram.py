#!/usr/bin/env python3
"""Create Instagram account for Ting-A-Ling using instagrapi + gog email."""

import json, os, re, sys, time, subprocess
from pathlib import Path
from instagrapi import Client
from instagrapi.exceptions import EmailNotAvailableError

EMAIL = "info@tingalingschools.com"
PASSWORD = "Tingaling@2025"
USERNAME = "tingalingschools"
FULL_NAME = "Ting-A-Ling Schools"
EMAIL_POLL_SECONDS = 120
EMAIL_POLL_INTERVAL = 8

def check_gmail_for_code(timeout=EMAIL_POLL_SECONDS):
    """Poll gmail inbox for Instagram verification code."""
    code_pattern = re.compile(r'(\d{6})')
    instagram_pattern = re.compile(r'instagram', re.IGNORECASE)
    start = time.time()
    
    print(f"  📧 Polling {EMAIL} for verification code...")
    while time.time() - start < timeout:
        try:
            # List recent emails
            result = subprocess.run(
                ["gog", "gmail", "list", "5"],
                capture_output=True, text=True, timeout=10
            )
            if result.returncode != 0:
                print(f"  ⚠ gog list error: {result.stderr[:100]}")
                time.sleep(EMAIL_POLL_INTERVAL)
                continue
            
            lines = result.stdout.strip().split("\n")[1:]  # skip header
            for line in lines:
                parts = line.split()
                if len(parts) >= 4:
                    thread_id = parts[0]
                    subject = " ".join(parts[3:])
                    
                    if instagram_pattern.search(subject):
                        print(f"  📨 Instagram email found: {subject}")
                        # Read the full email
                        detail = subprocess.run(
                            ["gog", "gmail", "read", thread_id],
                            capture_output=True, text=True, timeout=10
                        )
                        if detail.returncode == 0:
                            match = code_pattern.search(detail.stdout)
                            if match:
                                code = match.group(1)
                                print(f"  ✅ Code found: {code}")
                                return code
                            print(f"  ⚠ No 6-digit code in email body yet")
        except subprocess.TimeoutExpired:
            print(f"  ⚠ gog timeout")
        except Exception as e:
            print(f"  ⚠ {e}")
        
        elapsed = int(time.time() - start)
        print(f"  ⏳ {elapsed}s elapsed...")
        time.sleep(EMAIL_POLL_INTERVAL)
    
    print(f"  ❌ No verification code found after {timeout}s")
    return ""

# Monkey-patch fix for instagrapi bug (check_age_eligibility .json() on dict)
import instagrapi.mixins.signup as signup_mod
orig_age_check = signup_mod.SignUpMixin.check_age_eligibility
def patched_age_check(self, year, month, day):
    result = self.private_request(
        "consent/check_age_eligibility/",
        data={"_csrftoken": self.token, "day": day, "year": year, "month": month},
        with_signature=False,
    )
    result = result if isinstance(result, dict) else result.json()
    if result.get('eligible_to_register') and not result.get('eligible'):
        result['eligible'] = True  # Fix: map eligible_to_register to eligible
    return result
signup_mod.SignUpMixin.check_age_eligibility = patched_age_check

# Initialize client
cl = Client()
cl.set_user_agent(
    'Instagram 269.0.0.18.75 Android (28/9; 420dpi; 1080x1920; '
    'OnePlus; ONEPLUS A6000; OnePlus6; qcom; en_ZA; 321094712)'
)
cl.set_country_code('27')
cl.set_locale('en_ZA')
cl.set_timezone_offset(7200)

# Set challenge_code_handler — this gets called by instagrapi when a code is needed
cl.challenge_code_handler = lambda username, choice: check_gmail_for_code()

print("=" * 50)
print(f"🚀 Creating Instagram account")
print(f"   Username: {USERNAME}")
print(f"   Email:    {EMAIL}")
print(f"   Password: {PASSWORD}")
print(f"   Name:     {FULL_NAME}")
print("=" * 50)

try:
    user = cl.signup(
        username=USERNAME,
        password=PASSWORD,
        email=EMAIL,
        phone_number="",
        full_name=FULL_NAME,
        year=2000, month=1, day=1
    )
    print(f"\n✅ Account created!")
    print(f"   User: {user}")
    print(f"   PK: {user.pk}")
    
    # Upload profile picture
    logo_path = Path(
        "/Users/deonvandenberg/.openclaw/media/inbound/"
        "35b41dbf-1767-4649-8e3b-2b1df0f996ed_4---a2dd6ca7-e609-4f62-9d90-588d64c8d9ed.jpg"
    )
    if logo_path.exists():
        print("\n📸 Uploading profile picture...")
        pic_result = cl.account_change_picture(str(logo_path))
        print(f"✅ Profile picture uploaded!")
    
    # Save credentials permanently
    creds = {
        "instagram": {
            "platform": "Instagram",
            "handle": USERNAME,
            "email": EMAIL,
            "password": PASSWORD,
            "full_name": FULL_NAME,
            "url": f"https://www.instagram.com/{USERNAME}/",
            "created": time.strftime("%Y-%m-%d %H:%M SAST"),
            "purpose": "Ting-A-Ling Nursery School official account"
        }
    }
    
    # Save to credentials.json
    creds_path = Path("/Users/deonvandenberg/.openclaw/workspace/credentials.json")
    existing = {}
    if creds_path.exists():
        with open(creds_path) as f:
            existing = json.load(f)
    existing["instagram"] = creds["instagram"]
    with open(creds_path, "w") as f:
        json.dump(existing, f, indent=2)
    print(f"✅ Credentials saved to credentials.json")
    
    # Also append to TOOLS.md
    tools_entry = f"""
### Instagram
- **Handle:** {USERNAME}
- **Email:** {EMAIL}
- **Password:** {PASSWORD}
- **URL:** https://www.instagram.com/{USERNAME}/
- **Purpose:** Ting-A-Ling Nursery School official account
- **Created:** {time.strftime('%Y-%m-%d %H:%M')}
"""
    tools_path = Path("/Users/deonvandenberg/.openclaw/workspace/TOOLS.md")
    with open(tools_path, "a") as f:
        f.write(tools_entry)
    print(f"✅ Credentials appended to TOOLS.md")
    
except EmailNotAvailableError:
    print("\n❌ Email already registered with Instagram (info@tingalingschools.com)")
except Exception as e:
    print(f"\n❌ Error: {str(e)[:600]}")
    import traceback
    traceback.print_exc()
