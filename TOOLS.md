# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## What Goes Here

Things like:

- Camera names and locations
- SSH hosts and aliases
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

## Examples

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

### Email

- **Tool:** gog (Google Workspace CLI) — NOT himalaya
- **Default account:** info@tingalingschools.com (Gmail OAuth)
- **Send:** `gog gmail send --to <addr> --subject "..." --body-file -`
- **List:** `gog gmail list <count>`
- **Read:** `gog gmail read <thread_id>`

### Telegram
- **Bot ID:** 8510041285
- **User ID:** 8248125738 (Mr D)
- **Config:** OpenClaw gateway channels.telegram
- **Pairing:** /Users/deonvandenberg/.openclaw/credentials/telegram-pairing.json
- **Status:** Active — paired via OpenClaw gateway
- **Recovery:** Re-pair via OpenClaw if needed

### Instagram
- **Handle:** @tingalingpreprimary
- **Email:** info@tingalingschools.com
- **Password:** Tingaling@2026
- **Full name:** Ting-A-Ling Schools
- **Status:** Active — new account set up 2026-05-04
- **Logo file:** /Users/deonvandenberg/.openclaw/media/inbound/35b41dbf-1767-4649-8e3b-2b1df0f996ed_4---a2dd6ca7-e609-4f62-9d90-588d64c8d9ed.jpg
- **Credentials:** workspace/credentials.json
- **Content strategy:** Pre-primary education tips, school activities, parenting advice for ages 2-6. Target: Richards Bay & surrounding areas.
- **Posting cadence:** Weekly, or ad hoc when Mr D requests. Always get approval before posting.

### Facebook
- **Email:** tingalingpreprimaryschool@gmail.com
- **Status:** 2FA resolved. Session saved permanently.
- **Credentials:** workspace/credentials.json

---

Add whatever helps you do your job. This is your cheat sheet.

## Related

- [Agent workspace](/concepts/agent-workspace)
