#!/usr/bin/env python3
"""Extract main content from NG Kerk Meerensee mirrored WordPress site."""
import re, os, html as htmlmod

BASE = os.path.join(os.path.dirname(__file__), 'site', 'ngmeerensee.co.za')
PAGES = ['', 'eredienste', 'finansies', 'gebed', 'jeug-splash', 'kontak',
         'omgeegroepe', 'media', 'vorms', 'matteus-25-uitdaging']

def extract(path):
    try:
        with open(path, encoding='utf-8', errors='replace') as f:
            raw = f.read()
    except FileNotFoundError:
        return None
    # WordPress "church" theme content area, with fallbacks
    m = re.search(r'<div[^>]*id=["\']content["\'][^>]*>(.*?)</div>\s*<!--\s*#content', raw, re.S)
    if not m:
        m = re.search(r'<article[^>]*>(.*?)</article>', raw, re.S)
    if not m:
        m = re.search(r'<div[^>]*class=["\'][^"\']*entry-content[^"\']*["\'][^>]*>(.*?)</div>', raw, re.S)
    if not m:
        return None
    txt = re.sub(r'<script.*?</script>|<style.*?</style>', '', m.group(1), flags=re.S)
    txt = re.sub(r'<br\s*/?>', '\n', txt, flags=re.I)
    txt = re.sub(r'</p>|</h[1-6]>|</li>|</div>', '\n', txt, flags=re.I)
    txt = re.sub(r'<[^>]+>', ' ', txt)
    txt = htmlmod.unescape(txt)
    lines = [re.sub(r'\s+', ' ', l).strip() for l in txt.split('\n')]
    lines = [l for l in lines if l]
    return '\n'.join(lines)

for p in PAGES:
    path = os.path.join(BASE, p, 'index.html') if p else os.path.join(BASE, 'index.html')
    content = extract(path)
    print(f'===== {p or "home"} =====')
    if content:
        print(content[:3000])
    else:
        print('(no content extracted)')
    print()
