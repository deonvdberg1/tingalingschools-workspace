# Current Task — 2026-08-30 22:45 SAST

## Status: ATTENDANCE APP SHIPPED ✅ + STAFF ACCESS LOCKED ✅ + EXCEL IMPORT LIVE ✅ (all 2026-08-30)

## 🕔 Attendance & Time Tracking — LIVE
- **Portal app:** `/app/attendance` (app.autoeffortless.com) — bundle index-N__yoO2J.js (latest build w/ Excel import)
- **Backend:** `dashboard-api/attendance-routes.js` (mounted in server.js)
- **Tables:** attendance_staff, attendance_records (auto-created)
- **Entitlement:** active 'attendance' purchase OR overlord OR client product 'attendance' (Ting-A-Ling pilot seeded: client_products id 5)
- **Features:** staff CRUD + unique 6-char code, printable QR per staff, Clock Station (camera scan + manual code + tap grid), live "on shift now", timesheets, per-staff summary, corrections, CSV export
- **Store:** product live (16th app, Tier 2 Business, R149/mo) — autoeffortless.com/apps/attendance
- **Paystack plan:** PLN_i3b1v777n5f032q

## 🔒 Staff Access Model — LOCKED 2026-08-30 (Mr D)
- **Staff see/access ONLY apps the client admin shares.** Server-side enforced: `GET /api/staff-directory/my-apps` returns ONLY granted apps (unselected = no code path, can never appear).
- **Staff home** routes to clock only if Attendance granted, else Apps page ("No apps enabled yet").
- **Client portal = admin portal for clients** (one portal, full admin — locked rule).
- **Directory ⇄ account sync:** createMemberAccount reconciles existing accounts (staff → staff/client NULL; admin → client_admin+client_id; overlord never touched). DELETE restores prev_role/prev_client_id (no lingering access). Columns prev_role/prev_client_id in staff_directory.
- **Admin UI:** per-person rows show ONLY granted apps as gold chips (+ revoke) + "+ Add app…" select. Staff Directory (`/staff`) is single source of truth.
- **Registry:** `STAFF_APPS` in attendance-routes.js — new staff-capable apps added there.
- Fixed 22:24 leak: deonvdberg1 was a BUYER account (client_admin/NULL, 5 purchases) not staff — added to Ting-A-Ling directory (member 10, staff role, 3 shared apps: attendance/contract-generator/docchat). Buyer purchases hidden while role=staff, restore-on-delete.

## 📥 Staff Directory — bulk rows + EXCEL IMPORT (22:33)
- Add form = dynamic bulk rows (name/email/phone/position/role) + "Add another" + shared app chips → one POST.
- **Import Excel** (.xlsx/.xls/.csv) via SheetJS (client-side parse, xlsx npm added) → auto-maps headers → PREVIEW modal (valid + skipped w/ reasons) → bulk add.
- **Template** button (staff-template.xlsx) + instructions panel. Verified E2E, test data cleaned.

## DocChat v4.2 — live (bundle index-rzgHpwfZ.js) — all features shipped & verified

## Infrastructure (all LaunchAgents auto-start on boot) — verified healthy 22:42
- API: com.autoeffortless.api → port 3001, /api/health 200, db connected
- Portal: dashboard-temp/dist served by whatsapp-server (port 3000) via main tunnel
- Unified site: com.autoeffortless.website (8092) — autoeffortless.com + store + /apps
- Files: com.autoeffortless.fileserver (8099) + cloudflared-files tunnel
- Ollama up (port 11434, qwen3-embedding:0.6b) for DocChat embeddings
- Main tunnel: com.autoeffortless.cloudflared-main (remote config — don't edit config.yml)

## Next up (when Mr D says go)
- ⏳ **WiFi login for Ting-A-Ling** — BLOCKED on hardware decision: rain Loop can't do captive portal/auth. Options: (a) business AP (Unifi ~R2-3.5k) for real login + DNS logs + staff AUP, or (b) degraded password-app. Mr D deciding.
- ⏳ **Activity monitoring module** (Android-only usage tracking) — Capacitor wrapper, premium add-on. iOS impossible.
- ⏳ DocChat: chat history library, markdown answers, export, folders/tags
- ⏳ Mr D: test Attendance buyer flow (buy → /my-apps → Open app) + staff Excel import
