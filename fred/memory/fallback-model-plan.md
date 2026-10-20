# Fallback model plan — prepared 2026-10-19 03:36, NOT APPLIED

## Why
OpenClaw is configured with **one** provider (`models.providers.deepseek`, primary `deepseek/deepseek-v4-flash`, no `fallbacks`). Balance CNY 4.16 at 03:34 with ~CNY 0.60–0.82/h burn ⇒ dry ~09:00–10:30 on 2026-10-19. At zero, every agent dies silently (repeat of the 2026-10-10→15 `402` outage).
Correction to earlier notes: **`gemini` CLI is NOT a usable stopgap — no auth method configured** (`~/.gemini/settings.json` has no auth; no `GEMINI_API_KEY`). Local ollama is up on :11434 but only has `llama3.2:3b` / `moondream:latest` / `qwen3-embedding:0.6b`.

## Options (cheapest → best)
1. **Top up DeepSeek CNY 200** (unchanged ask). ~10 days of runway at current burn. Zero config risk.
2. **Local ollama fallback** (`llama3.2:3b`) — free, offline, but weak: 3 B params, no reliable tool calling, slow on long context. Only good enough to keep heartbeats/reports alive.
   - Needs: `models.providers.ollama = { baseUrl: "http://127.0.0.1:11434/v1", api: "openai-completions", models: [{ id: "llama3.2:3b", … }] }` + a fallback entry on `agents.defaults.model`.
   - ⚠️ Do **not** hand-edit `openclaw.json` blind: verify the fallback key name via gateway `config.schema.lookup` first, then `config.patch` (merge, backup copy taken), then `restart`.
3. **Second cloud provider** (Gemini API key or OpenRouter) — proper redundancy with tool calling. Requires a key from Mr D.
4. **Gemini CLI auth** — set `GEMINI_API_KEY` in `~/.gemini/settings.json`; kept as a manual escape hatch only (not wired into the gateway).

## Recommendation
Top up now; then let me wire #3 (a real second provider) during a daytime window, with #2 as the last-resort safety net. #1 alone leaves the same single point of failure next time.

## Status
Prepared only. No config changes made. Needs Mr D's approval.
