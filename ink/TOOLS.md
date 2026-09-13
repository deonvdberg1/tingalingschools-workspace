# TOOLS.md — Ink's Toolchain

Everything below is installed and verified working on this machine (Mac mini M4, macOS).

## Core
| Tool | Path / version | Used for |
|---|---|---|
| ImageMagick | `/opt/homebrew/bin/magick` | clean-up, compositing, PDF, montage, metrics |
| ImageMagick legacy | `/opt/homebrew/bin/convert` | present, prefer `magick` |
| Node | v22.22.2 | all pipeline scripts |
| Playwright + Chromium | global npm (`/opt/homebrew/lib/node_modules`), chromium-1217 | HTML → PNG rendering (the compositor) |
| Python 3 | `/Library/Frameworks/Python.framework/Versions/3.13/bin/python3` | helper/QC scripts |
| ffmpeg | `/opt/homebrew/bin/ffmpeg` | future: animatics, timelapse of pages |
| Ollama | `http://127.0.0.1:11434` | local models |

## Node scripts and global modules
Scripts import Playwright via:
```js
import { createRequire } from 'node:module';
const require = createRequire('/opt/homebrew/lib/node_modules/');
const { chromium } = require('playwright');
```
This trick is why the scripts work without a local `node_modules`. Keep it if you write new ones.

## Local AI / QC
- **`moondream:latest`** (Ollama) — a small vision model. Use it to sanity-check a render when
  Mr D can't eyeball it: "how many panels", "is the background white", "is there text in the boxes".
  Rough but useful. Do NOT trust it to read small text.
- **`qwen3-embedding:0.6b`** (Ollama) — embeddings (memory search).
- `llama3.2:3b` — small text model, rarely needed (the agent model is better).

## Free AI art (only for placeholders / style tests / when Mr D asks)
- **Pollinations**: `https://image.pollinations.ai/prompt/<urlencoded>?width=1024&height=1024&nologo=true&seed=<n>&model=flux`
  - No API key. Returns ~768px regardless of requested size — upscale if needed.
  - Wrapped by `tools/gen-art.sh`.
- **No image-gen model is installed locally** (no ComfyUI / diffusers / mflux). If character
  consistency ever needs to be much better, that is the upgrade path: local ComfyUI + a LoRA
  trained on Mr D's own character sheet. Free, ~10GB download, needs his approval.

## Known gotchas (learned the hard way)
1. **ImageMagick `montage` fails with "unable to read font"** — always pass `-font /System/Library/Fonts/Supplemental/Arial.ttf`, or just use `+append` / `-append` instead.
2. **Lighting flattening must be followed by `-auto-level`.** Divide-by-blur alone leaves dark paper; without auto-level the threshold turns the whole page black. Order: `divide composite → -auto-level → threshold`.
3. **LaunchAgents have a minimal PATH** — if a script runs from cron/LaunchAgent, use absolute binary paths (`/opt/homebrew/bin/magick`).
4. **Playwright screenshots**: set `deviceScaleFactor: 2` for print resolution (B5 page CSS 1075×1518 → 2150×3035 px).

## Sharing with Mr D
- Copy finished artifacts to `/Users/deonvandenberg/.openclaw/workspace/fred/products/manga/`
- They are publicly served at **https://files.autoeffortless.com/manga/<filename>**
- Always hand him a **clickable link**.

## Gateway / other agents (optional)
- OpenClaw gateway on `127.0.0.1:18789`; auth token lives at
  `/Users/deonvandenberg/.openclaw/workspace/fred/secrets/OPENCLAW_GATEWAY_TOKEN.txt`
  (send as `Authorization: Bearer <token>`).
- Agent-to-agent chat: `openclaw/<agentId>` — e.g. `openclaw/fred` for the AutoEffortless CEO.
- Fred's public share of studio assets stays in his `products/manga/` folder — that is the handoff point, not his workspace.
