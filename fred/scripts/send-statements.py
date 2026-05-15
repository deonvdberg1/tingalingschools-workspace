#!/usr/bin/env python3
"""Send PDF fee statements to parents via WhatsApp"""
import os, sys, json, time
import requests

TOKEN = "EAAZALa2UgbOEBRfGmd0TdVlZAfW1ZB0dAtJWX0nUbpeH6fTUNB01KvrGsbWTTcZABycEHqzkkprJ6vzF6QiUFmrq9To8proavvtL7lUAqaFanUFjAlQkJ2FMHZBrt8ds2QF8IUUvAeTzbYxLMFNz0efZBNjmZBco8vRWw3V2J1H9ZCH5ZC7qosH41bSNjBXKFLYZCoNAZDZD"
PHONE_ID = "1046384845235600"
BASE_URL = f"https://graph.facebook.com/v21.0/{PHONE_ID}"

def upload_media(filepath):
    """Upload PDF to Meta and get media ID"""
    filename = os.path.basename(filepath)
    with open(filepath, 'rb') as f:
        resp = requests.post(
            f"{BASE_URL}/media",
            headers={"Authorization": f"Bearer {TOKEN}"},
            files={"file": (filename, f, "application/pdf")},
            data={"messaging_product": "whatsapp"}
        )
    if resp.status_code == 200:
        return resp.json().get("id")
    print(f"  ❌ Upload failed: {resp.text[:200]}")
    return None

def send_document(phone, media_id, filename):
    """Send PDF document to a WhatsApp number"""
    resp = requests.post(
        f"{BASE_URL}/messages",
        headers={
            "Authorization": f"Bearer {TOKEN}",
            "Content-Type": "application/json"
        },
        json={
            "messaging_product": "whatsapp",
            "to": phone,
            "type": "document",
            "document": {
                "id": media_id,
                "filename": filename,
                "caption": "📄 Your Ting-A-Ling fee statement for May 2026.\n\nPlease contact the office if you have any questions."
            }
        }
    )
    data = resp.json()
    if "messages" in data:
        return data["messages"][0]["id"]
    print(f"  ❌ Send failed: {data.get('error', {}).get('message', resp.text[:200])}")
    return None

def send_statements(folder_path, month_label="May 2026"):
    """Send all PDFs in folder as fee statements"""
    pdfs = [f for f in os.listdir(folder_path) if f.endswith(".pdf")]
    
    if not pdfs:
        print("No PDFs found!")
        return
    
    print(f"\n📋 Found {len(pdfs)} statement(s) for {month_label}")
    print("=" * 50)
    
    results = {"sent": 0, "failed": 0, "details": []}
    
    for pdf_name in sorted(pdfs):
        phone = pdf_name.replace(".pdf", "").strip()
        filepath = os.path.join(folder_path, pdf_name)
        
        # Validate phone number
        if not phone.isdigit() or len(phone) < 10:
            print(f"  ⚠️  {pdf_name}: Invalid phone number, skipping")
            results["failed"] += 1
            results["details"].append({"file": pdf_name, "status": "invalid_number"})
            continue
        
        print(f"\n📄 {pdf_name} → {phone}")
        
        # Upload
        print(f"  📤 Uploading...", end=" ")
        media_id = upload_media(filepath)
        if not media_id:
            results["failed"] += 1
            results["details"].append({"file": pdf_name, "status": "upload_failed"})
            continue
        print(f"✅ (ID: {media_id[:20]}...)")
        
        # Send
        print(f"  📨 Sending...", end=" ")
        msg_id = send_document(phone, media_id, pdf_name)
        if msg_id:
            print(f"✅ (Msg ID: {msg_id[:20]}...)")
            results["sent"] += 1
            results["details"].append({"file": pdf_name, "status": "sent"})
        else:
            results["failed"] += 1
            results["details"].append({"file": pdf_name, "status": "send_failed"})
        
        # Small delay to avoid rate limits
        time.sleep(1)
    
    print("\n" + "=" * 50)
    print(f"✅ Done! Sent: {results['sent']} | Failed: {results['failed']}")
    return results

if __name__ == "__main__":
    folder = "/Users/deonvandenberg/.openclaw/workspace/fred/fee-statements/05-2026"
    send_statements(folder)
