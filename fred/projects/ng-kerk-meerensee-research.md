# NG Kerk Meerensee — Website Research Brief
*Prepared by Fred for Mr D — 2026-08-05 (ahead of Tuesday client meeting)*

## The Client
- **NG Kerk Meerensee** (Nederduitse Gereformeerde Kerk), 11 Galjoengolf, Meerensee, Richards Bay
- Tagline: "Onverdiende Goedheid" (Undeserved Grace)
- Phone: +27 35 753 2332 · WhatsApp: 071 903 3791 · Office: Mon–Fri 08:00–13:00
- **Facebook (active asset):** "NG Meerensee" — 1,270 likes, ~5,000 check-ins, posting regularly

## Website: https://ngmeerensee.co.za

### Current State
| Item | Found | Verdict |
|---|---|---|
| Platform | **WordPress 6.2.9** | ⚠️ ~2.5 yrs / 7 major versions behind (current: 7.0) |
| PHP | **7.2.34** | 🔴 **End-of-life since Nov 2020** — no security patches, actively exploited |
| Hosting | Shared hosting, **nginx + Plesk** (PleskLin header) | Server IP 41.78.28.162 = **Imaginet IDC** (client thinks Afrihost — DNS also on Imaginet) |
| SSL | Let's Encrypt, valid, auto-renews (renewed today) | ✅ |
| Uptime / speed | 200 OK, ~0.45 s load | ✅ Healthy |
| Theme | Free "Church" theme (themehall.com) | Dated, default-widget look |
| Plugins | captcha, chapelworks-church-basic-features, wd-google-maps (WebDorado) | ⚠️ Old/unmaintained |

### Security Issues (in order of severity)
1. 🔴 **PHP 7.2 — end of life** — biggest risk; unpatched vulnerabilities
2. 🔴 **WordPress 6.2.9 — outdated** — missed multiple security releases
3. 🟡 **User enumeration open** — /wp-json/wp/v2/users exposes admin username ("annolien")
4. 🟡 **xmlrpc.php active** — brute-force / DDoS amplification vector; should be disabled
5. 🟡 **/readme.html exposed** — reveals exact version to attackers
6. 🟡 **No security headers** — missing X-Frame-Options, HSTS, X-Content-Type-Options, CSP

### Content State
- **9 pages:** Kalender 2026 (home), Eredienste (services), Vorms, Media, Omgeegroepe, Finansies, Gebed, Jeug, Kontak — all in Afrikaans
- 🔴 **Blog dead since March 2019** — 7+ years no posts
- Homepage = calendar download page; default WP sidebar widgets (Recent Posts / Archives / Meta / WordPress.org) — looks unmaintained
- Good bones: service times, forms, finances, contact all present

### What They Have Going For Them
- Active, engaged Facebook page (content exists, just not on the website)
- WhatsApp number in use (071 903 3791)
- Domain + SSL working, site is fast and stable

## Where We Can Help — Options

### Option A: Managed Security & Care (quick win, monthly retainer)
- Update WordPress 6.2.9 → 7.0 (staging + test first — old theme/plugins may break)
- Upgrade PHP 7.2 → 8.2/8.3 (hosting-dependent; Plesk usually supports it)
- Fix security: disable xmlrpc, remove readme.html, block user enumeration, add security headers
- Update/replace old plugins (WebDorado maps → free modern alternative)
- Ongoing: monthly updates, backups, monitoring (our site-monitor pattern), WhatsApp alerting
- **Fits our R3k–R5k/month tier**

### Option B: Modern Rebuild (like Ting-A-Ling)
- Rebuild on our stack (fast static site + our analytics + WhatsApp assistant) OR rebuild in WP with a modern theme
- Structure: home, services (eredienste), calendar/events, contact, finances/giving, media, youth
- Pull content from their Facebook feed automatically (fresh content without them lifting a finger)
- WhatsApp assistant on 071 903 3791 for enquiries (service times, directions, events)
- **Fits our R5k–R8k/month + setup tier** (largest value for them)

### Option C: Full Package (A + B)
- Rebuild + ongoing care + WhatsApp AI assistant + site analytics (proven with Ting-A-Ling)

## Recommended Approach for Tuesday
1. **Lead with the safety message:** "Your site runs on software that stopped receiving security patches 5+ years ago — it's a hack risk today." (True and compelling.)
2. **Show the modern rebuild** (Ting-A-Ling portal as live proof of what we do).
3. **Offer a staged path:** fix security first (fast, low-risk), then rebuild when ready.
4. **Access needed from client:** hosting login (Plesk/cPanel), WP admin access, domain access. ⚠️ Confirm actual host — IP says Imaginet, not Afrihost (they may be paying Afrihost for something else, or Afrihost resold Imaginet).

## Open Questions for Mr D
- Do they have a budget in mind? (Sets which option to push)
- Who is the decision-maker (pastor / church council / office "Annolien")?
- Do they want Afrikaans-only or bilingual site?
- Confirm hosting provider with client (Afrihost vs Imaginet)

---
*Research method: DNS/WHOIS, HTTP headers, WordPress fingerprinting (wp-json, readme, xmlrpc, generators), content audit via REST API + homepage scrape. No credentials used — all passive/public checks.*

## Re-check 2026-08-06 08:47 SAST — Site UP, Security Posture UNCHANGED

Mr D noted "they have things up and running again" — confirmed live, healthy, fast.

| Check | Result | vs 2026-08-05 |
|---|---|---|
| DNS | 41.78.28.162 (Imaginet IDC) | same |
| Uptime | HTTP 200 in 0.57s | ✅ same |
| WordPress | 6.2.9 (generator meta + readme) | ❌ unchanged — still 2.5 yrs behind |
| PHP | 7.2.34 (x-powered-by) | ❌ unchanged — still EOL since Nov 2020 |
| SSL | Let's Encrypt, valid | ✅ |
| User enumeration | /wp-json/wp/v2/users → 200, "Annolien Liebenberg" (id 5) exposed | ❌ still open |
| xmlrpc.php | GET 405 (normal), **POST fully active** — system.listMethods + pingback.ping respond | ❌ still active — DDoS vector |
| Security headers | None of 7 present | ❌ unchanged |
| Blog | Last post 2019-03-08 (Matteus 25-uitdaging Dag 7) | ❌ still dead 7+ yrs |
| Pages | 9, same slugs (Kalender 2026 home, Eredienste, Vorms, Media, Omgeegroepe, Finansies, Gebed, Jeug, Kontak) | same |
| Plugins | captcha, chapelworks-church-basic-features, wd-google-maps | same |

**Summary: Site being "up and running" was never the problem — it's fast and stable. Every security issue from the brief remains untouched. Perfect opening for the client conversation: the site works *today*, but it's one exploit away from being defaced or serving malware, because the underlying software (PHP 7.2, WP 6.2.9) stopped receiving security patches years ago.**

⚠️ Note for meeting: xmlrpc GET gives 405 but POST is live — a naive "is xmlrpc disabled?" check by GET alone gives a false "blocked" signal. Must test with POST.
