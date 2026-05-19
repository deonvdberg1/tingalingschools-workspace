#!/usr/bin/env python3
"""
Simple webhook server that receives application notifications from Supabase
and forwards them via the gog CLI (Google OAuth).
"""
import json
import subprocess
from http.server import HTTPServer, BaseHTTPRequestHandler

NOTIFY_EMAIL = "info@tingalingschools.com"
HOST = "127.0.0.1"
PORT = 9187

def send_email(to, subject, body):
    try:
        proc = subprocess.run(
            ["gog", "gmail", "send", "--to", to, "--subject", subject, "--body-file", "-"],
            input=body.encode(),
            capture_output=True,
            timeout=30,
        )
        if proc.returncode == 0:
            print(f"✅ Email sent to {to}: {subject}")
            return True
        else:
            print(f"❌ gog error: {proc.stderr.decode()}")
            return False
    except Exception as e:
        print(f"❌ send error: {e}")
        return False

class WebhookHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({"status": "running"}).encode())
    
    def do_POST(self):
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length)
        
        try:
            data = json.loads(body.decode())
        except:
            data = {}
        
        school = data.get("school", "Ting-A-Ling Schools")
        parent_name = data.get("parent_name", "")
        parent_email = data.get("parent_email", "")
        parent_phone = data.get("parent_phone", "")
        child_name = data.get("child_name", "")
        child_age = data.get("child_age", "")
        grade = data.get("grade", "")
        previous_school = data.get("previous_school", "")
        special_needs = data.get("special_needs", "")
        
        body_text = f"""
NEW APPLICATION — {school}

Parent:  {parent_name}
Email:   {parent_email}
Phone:   {parent_phone}
Child:   {child_name}
Age:     {child_age}
Grade:   {grade}
Previous: {previous_school or 'N/A'}
Special: {special_needs or 'N/A'}

Submitted: {data.get('submitted_at', 'now')}
        """.strip()
        
        subject = f"New Application: {school} – {child_name}"
        success = send_email(NOTIFY_EMAIL, subject, body_text)
        
        self.send_response(200 if success else 500)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({
            "success": success,
            "email": NOTIFY_EMAIL,
            "subject": subject,
        }).encode())
    
    def log_message(self, format, *args):
        print(f"[webhook] {args[0]} {args[1]} {args[2]}")

if __name__ == "__main__":
    server = HTTPServer((HOST, PORT), WebhookHandler)
    print(f"📡 Webhook server listening on http://{HOST}:{PORT}")
    print(f"   Will forward to {NOTIFY_EMAIL}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down...")
        server.server_close()
