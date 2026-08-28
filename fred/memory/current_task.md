# Current Task — RESUME POINT (2026-08-28 13:59 SAST, pre-power-off)

## Status: ALL SHIPPED & LIVE ✅ — nothing mid-flight

Everything below is deployed and verified. Power was turned off by Mr D after this — pick up here.

## DocChat v4.2 — live on app.autoeffortless.com (bundle index-rzgHpwfZ.js)
1. ✅ PDF viewer crash fixed (pdfjs 4.8.69 — was v6 Safari incompatibility)
2. ✅ Full-viewport layout (h-screen, compact header, no wasted space)
3. ✅ Sidebar hide/show toggle (portal-wide, localStorage)
4. ✅ Cover thumbnails for ALL file types (server qlmanage; startup backfill + lazy regen + client retry)
5. ✅ All file types: PDF/DOCX/XLSX/PPTX/CSV/TXT/MD/RTF/ODT (officeparser)
6. ✅ Highlight → note annotations (select → button → modal → mark → popup; persist; notebook "Highlights" section with jump-to + ✕ delete)
7. ✅ Multi-select docs + chat across selection only (docIds[] in /chat)
8. ✅ OCR for scanned PDFs (poppler pdftoppm + tesseract, absolute paths in code)
9. ✅ Resizable column dividers (drag, persisted)
10. ✅ Notebook free notes (Enter to save, ✕ delete) + search notes across all docs
11. ✅ Search all documents (cross-doc RAG + citations + Open →)

## Verified E2E (puppeteer, real login) on all of the above. Test data cleaned (4 purchases / 8 users are legit).

## Infrastructure (all LaunchAgents auto-start on boot)
- API: com.autoeffortless.api → port 3001 (dashboard-api/)
- Portal: dashboard-temp/dist served by whatsapp-server (port 3000) via main tunnel
- Storefront: com.autoeffortless.storefront (8092) — store.autoeffortless.com
- Files: com.autoeffortless.fileserver (8099) + cloudflared-files tunnel
- Main tunnel: com.autoeffortless.cloudflared-main (remote config — don't edit config.yml)
- OCR deps: poppler + tesseract installed via Homebrew (/opt/homebrew/bin) — reinstall if Mac reset
- dashboard-api/.env: Paystack sk_test key, docchat agent via gateway :18789

## On restart, check
1. `curl localhost:3001/api/health` → 200
2. `curl https://app.autoeffortless.com` → new bundle
3. Ollama running (port 11434) for embeddings — `ollama list` (qwen3-embedding:0.6b)
4. Tunnels up (whatsapp, files, storefront)

## Next up (when Mr D says go)
- Chat history library per doc
- Markdown rendering of AI answers
- Export notebook/highlights to PDF
- Folders/tags for docs
- Then the other 14 apps (DocChat is the flagship done)
