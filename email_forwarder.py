#!/usr/bin/env python3
"""
Check contact_submissions for new entries and forward them to the school email.
Runs via cron every 10 minutes.
"""
import os, json, sys
from datetime import datetime, timezone

SUPABASE_URL = os.environ.get("VITE_SUPABASE_URL", "https://uuisorsrhtiaqvvpgndp.supabase.co")
SUPABASE_ANON_KEY = os.environ.get("VITE_SUPABASE_ANON_KEY", "sb_publishable_Vinz0xatpOE86XApR_fh8A_4SI47Me3")
STATE_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".email_forwarder_state.json")
NOTIFY_EMAIL = "info@tingalingschools.com"

def get_last_run():
    try:
        with open(STATE_FILE) as f:
            return json.load(f).get("last_run", "")
    except:
        return ""

def save_last_run(ts):
    with open(STATE_FILE, "w") as f:
        json.dump({"last_run": ts}, f)

import urllib.request
import subprocess

def fetch_new_submissions(since):
    url = f"{SUPABASE_URL}/rest/v1/contact_submissions?select=*&created_at=gt.{since}&order=created_at.asc"
    req = urllib.request.Request(url, headers={
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
    })
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read())
            return data
    except Exception as e:
        print(f"Fetch error: {e}")
        return []

def send_email_via_gog(to, subject, body):
    """Use gog CLI to send email from the authenticated Gmail account."""
    try:
        proc = subprocess.run(
            ["gog", "gmail", "send", "--to", to, "--subject", subject, "--body-file", "-"],
            input=body.encode(),
            capture_output=True,
            timeout=30,
        )
        if proc.returncode == 0:
            print(f"Email sent to {to}: {subject}")
            return True
        else:
            print(f"gog error: {proc.stderr.decode()}")
            return False
    except Exception as e:
        print(f"send error: {e}")
        return False

def main():
    last_run = get_last_run()
    now = datetime.now(timezone.utc).isoformat()
    
    if not last_run:
        print("First run - skipping backfill")
        save_last_run(now)
        return
    
    submissions = fetch_new_submissions(last_run)
    
    if not submissions:
        print(f"No new submissions since {last_run}")
        save_last_run(now)
        return
    
    print(f"Found {len(submissions)} new submission(s)")
    
    for s in submissions:
        name = s.get("name", "Unknown")
        email = s.get("email", "")
        phone = s.get("phone", "")
        subject = s.get("subject", "No subject")
        message = s.get("message", "No message")
        created = s.get("created_at", "")
        
        body = f"""
New Contact / Application

Name:    {name}
Email:   {email}
Phone:   {phone}
Subject: {subject}

Message:
{message}

---
Submitted: {created}
        """.strip()
        
        ok = send_email_via_gog(NOTIFY_EMAIL, f"New: {subject}", body)
        if ok:
            print(f"Forwarded: {subject} from {name}")
    
    save_last_run(now)

if __name__ == "__main__":
    main()
