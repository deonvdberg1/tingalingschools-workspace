#!/usr/bin/env python3
"""
Disaster Recovery — Restore everything if the Mac dies.
Run on a new machine with the GitHub repo cloned.

Usage: python3 recover_from_github.py

Requires: playwright, browser_cookie3, cryptography
"""
import json, os, sys, base64, hashlib
from cryptography.fernet import Fernet

BASE = os.path.dirname(os.path.abspath(__file__))

def decrypt_backup():
    """Decrypt the session backup from GitHub"""
    backup_file = os.path.join(BASE, '.session_backup_github.enc')
    key_file = os.path.join(BASE, '.backup_key.json')
    
    if not os.path.exists(backup_file):
        print("❌ No backup file found. Clone the repo first.")
        return None
    
    with open(key_file) as f:
        key_info = json.load(f)
    
    key_phrase = key_info['key_phrase']
    key = base64.urlsafe_b64encode(hashlib.sha256(key_phrase.encode()).digest())
    cipher = Fernet(key)
    
    with open(backup_file, 'rb') as f:
        encrypted = f.read()
    
    data = json.loads(cipher.decrypt(encrypted))
    return data

def restore_sessions(data):
    """Rebuild session files from backup"""
    if 'tokens_compact' in data:
        compact = data['tokens_compact']
        print(f"✅ Found tokens for: {', '.join(compact.keys())}")
        
        # Rebuild the main state file
        from recover_sessions import rebuild
        # First save the compact tokens as fallback
        fallback = {
            'backup_created': 'recovered',
            'note': 'Recovered from GitHub backup',
            'platforms': {}
        }
        for platform, tokens in compact.items():
            fallback['platforms'][platform] = {}
            for name, value in tokens.items():
                fallback['platforms'][platform][name] = {
                    'value': value,
                    'domain': f'.{platform}.com',
                    'httpOnly': False
                }
        
        fallback_file = os.path.join(BASE, '.session_tokens_fallback.json')
        with open(fallback_file, 'w') as f:
            json.dump(fallback, f, indent=2)
        print("✅ Fallback tokens restored")
        
        # Rebuild state from fallback
        sys.path.insert(0, BASE)
        import recover_sessions
        recover_sessions.rebuild()
    
    print("\n✅ Recovery complete!")
    print("   Run: python3 check_sessions.py")
    print("   To verify everything works.")

if __name__ == "__main__":
    print("=" * 50)
    print("🔧 GITHUB DISASTER RECOVERY")
    print("=" * 50)
    
    data = decrypt_backup()
    if data:
        restore_sessions(data)
