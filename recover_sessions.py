#!/usr/bin/env python3
"""
Session Recovery Tool — rebuilds Playwright state from fallback tokens.
Use this if ig_playwright_state.json ever gets corrupted.
Run: python3 recover_sessions.py
"""
import json, os, sys
from datetime import datetime, timezone, timedelta

BASE = os.path.dirname(os.path.abspath(__file__))
STATE_FILE = os.path.join(BASE, "ig_playwright_state.json")
FALLBACK_FILE = os.path.join(BASE, ".session_tokens_fallback.json")

def choose_expiry(days=365):
    """Default expiry 1 year from now"""
    return int((datetime.now(timezone.utc) + timedelta(days=days)).timestamp())

# Domain mappings for each platform
DOMAINS = {
    'instagram': {
        'domain': '.instagram.com',
        'cookies': {
            'sessionid': {'path': '/', 'httpOnly': True, 'expires': 365},
            'ds_user_id': {'path': '/', 'httpOnly': False, 'expires': 90},
            'csrftoken': {'path': '/', 'httpOnly': False, 'expires': 365},
            'ig_did': {'path': '/', 'httpOnly': True, 'expires': 365},
            'mid': {'path': '/', 'httpOnly': True, 'expires': 365},
            'datr': {'path': '/', 'httpOnly': True, 'expires': 365},
            'rur': {'path': '/', 'httpOnly': True, 'expires': 1},
            'dpr': {'path': '/', 'httpOnly': False, 'expires': 7},
            'wd': {'path': '/', 'httpOnly': False, 'expires': 7},
        }
    },
    'facebook': {
        'domain': '.facebook.com',
        'cookies': {
            'c_user': {'path': '/', 'httpOnly': False, 'expires': 365},
            'xs': {'path': '/', 'httpOnly': True, 'expires': 365},
            'fr': {'path': '/', 'httpOnly': True, 'expires': 90},
            'datr': {'path': '/', 'httpOnly': True, 'expires': 365},
            'sb': {'path': '/', 'httpOnly': True, 'expires': 365},
            'wd': {'path': '/', 'httpOnly': False, 'expires': 7},
            'dpr': {'path': '/', 'httpOnly': False, 'expires': 7},
        }
    },
    'tiktok': {
        'domain': '.tiktok.com',
        'cookies': {
            'sessionid': {'path': '/', 'httpOnly': True, 'expires': 180},
            'sid_tt': {'path': '/', 'httpOnly': True, 'expires': 180},
            'uid_tt': {'path': '/', 'httpOnly': False, 'expires': 180},
            'uid_tt_ss': {'path': '/', 'httpOnly': False, 'expires': 180},
            'ttwid': {'path': '/', 'httpOnly': False, 'expires': 365},
            'sid_guard': {'path': '/', 'httpOnly': True, 'expires': 180},
            'tt_csrf_token': {'path': '/', 'httpOnly': False, 'expires': 365},
            'msToken': {'path': '/', 'httpOnly': False, 'expires': 365},
            's_v_web_id': {'path': '/', 'httpOnly': False, 'expires': 365},
            'tt_chain_token': {'path': '/', 'httpOnly': False, 'expires': 365},
        }
    }
}

def rebuild():
    if not os.path.exists(FALLBACK_FILE):
        print(f"❌ No fallback file found at {FALLBACK_FILE}")
        print("   Run the session save process first.")
        return False
    
    with open(FALLBACK_FILE) as f:
        fallback = json.load(f)
    
    cookies = []
    
    for platform, tokens in fallback.get('platforms', {}).items():
        config = DOMAINS.get(platform)
        if not config:
            print(f"⚠️ Unknown platform: {platform}, skipping")
            continue
        
        domain = config['domain']
        cookie_config = config['cookies']
        
        for name, info in tokens.items():
            if name in cookie_config:
                cfg = cookie_config[name]
                cookies.append({
                    'name': name,
                    'value': info['value'],
                    'domain': domain if name != 'uid_tt_ss' else '.tiktok.com',
                    'path': cfg['path'],
                    'expires': choose_expiry(cfg['expires']),
                    'httpOnly': cfg['httpOnly'],
                    'secure': True,
                    'sameSite': 'Lax'
                })
                print(f"  ✅ {platform}: {name} restored")
            else:
                print(f"  ⚠️ {platform}: {name} has no config, adding anyway")
                cookies.append({
                    'name': name,
                    'value': info['value'],
                    'domain': info.get('domain', domain),
                    'path': '/',
                    'expires': choose_expiry(365),
                    'httpOnly': bool(info.get('httpOnly', False)),
                    'secure': True,
                    'sameSite': 'Lax'
                })
    
    state = {
        'cookies': cookies,
        'origins': []
    }
    
    with open(STATE_FILE, 'w') as f:
        json.dump(state, f, indent=2)
    
    print(f"\n✅ Rebuilt {STATE_FILE} with {len(cookies)} cookies")
    print(f"   Platforms: {', '.join(fallback.get('platforms', {}).keys())}")
    return True

if __name__ == "__main__":
    print("=" * 50)
    print("SESSION RECOVERY TOOL")
    print("=" * 50)
    ok = rebuild()
    sys.exit(0 if ok else 1)
