# AutoEffortless Brand — Source of Truth

> **Rule (Mr D, 2026-08-27):** EVERYTHING AutoEffortless must share the same design and look as **autoeffortless.com**. One brand, one palette, everywhere. No exceptions.

This file is the reference for all current and future builds (portal, storefront, apps like DocChat, PWAs, super-app, emails, PDFs). If a surface doesn't match this, it's wrong.

## Palette (hex)

| Token | Hex | Use |
|---|---|---|
| `--gold` | `#c8a34e` | Primary brand colour — buttons, highlights |
| `--gold-deep` | `#a8863a` | Hover, links, active states, emphasis text |
| `--gold-light` | `#e9d9ae` | Borders, tints, secondary accents |
| `--gold-soft` | `#fbf6ea` | Pill/eyebrow backgrounds, soft fills |
| `--cream` | `#faf8f3` | Page/section background |
| `--white` | `#ffffff` | Cards, surfaces on cream |
| `--ink` | `#14142a` | Headings / primary text |
| `--ink-2` | `#35354f` | Secondary text |
| `--muted` | `#6b6b82` | Muted / captions |
| `--line` | `#ece9df` | Hairlines, dividers, borders |

## Buttons

- **Primary (btn-gold):** `linear-gradient(135deg, #c8a34e, #a8863a)`, white text, soft gold shadow `0 10px 26px rgba(168,134,58,0.32)`; hover: lift 2px + stronger shadow.
- **Ghost:** 1px `#c8a34e` border, `#a8863a` text on hover, lift 2px.

## Typography

- **Outfit** (Google Fonts) — used by storefront & portal.
- Eyebrow labels: 0.76rem, 700 weight, uppercase, 0.12em letter-spacing, gold-deep text on gold-soft pill with `rgba(200,163,78,0.25)` border.

## Logo & Icons (LOCKED 2026-08-27, Mr D)

- **LOGO (official):** `branding/logo-current.png` (full-colour wordmark, Mr D-approved 2026-08-27). Wordmark files on the site: `website/logo-main.png`, `website/logo-white.png`.
- **ICON MARK (official):** `website/logo-icon.svg` / `favicon.svg` — dark ink rounded badge (#14142a→#232345), gold #c8a34e orbit ring + gold-light #e9d9ae dot + bold gold "AE". Portal component: `components/common/LogoMark.tsx`.
- **RULE: NEVER use old-school/outdated icons or text-only "AE" badges.** Every AutoEffortless surface uses the official mark + the autoeffortless.com icon style. No emoji-as-brand-icon, no gradient "AE" boxes.
- Portal favicon = favicon.svg (was old favicon.png). Portal logo badges (sidebar/header/auth/signin) all swapped to LogoMark 2026-08-27.

## Usage rules

1. Portal `brand-*` scale = gold palette (mapped in `dashboard-temp/src/index.css`). Never teal/cyan.
2. Page backgrounds = cream (`#faf8f3`); cards = white.
3. Links & emphasis = gold-deep (`#a8863a`), not default blue.
4. Dark mode: keep the same gold accents (use brand-* with dark: variants).
5. Logos: "Auto**Effortless**" wordmark — gold-deep on the second word. Icon block: gold gradient.
6. Emails, PDFs, docs: same palette + Outfit where possible.

## Surface inventory (current state)

| Surface | Status |
|---|---|
| autoeffortless.com marketing site | ✅ Gold/cream |
| /apps storefront (storefront/) | ✅ Gold/cream |
| Portal (app.autoeffortless.com, dashboard-temp/) | ✅ Re-themed 2026-08-27 (was teal) |
| WhatsApp auto-replies / client comms | Brand voice, no colour |
| Future apps (DocChat etc.) | ⚠️ MUST use this palette from day one |
