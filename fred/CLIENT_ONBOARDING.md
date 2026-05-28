# 🚀 Client Onboarding Process
## AutoEffortless — Step by Step

---

### Prerequisites

Before starting, make sure:
- [ ] Client has agreed to terms (DPA signed)
- [ ] Payment method agreed (Stripe/PayFast)
- [ ] Their WhatsApp business number is registered (Meta approved)
- [ ] Client has their knowledge base content ready

---

### Step 1: Create the Client in the Dashboard API

Run this curl command:

```bash
curl -X POST http://localhost:3001/api/clients \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [OVERLORD_TOKEN]" \
  -d '{
    "name": "Client Business Name",
    "phone": "+27 XX XXX XXXX",
    "email": "info@clientbusiness.com",
    "whatsapp_number": "+27 XX XXX XXXX",
    "client_type": "school",
    "ai_enabled": true,
    "status": "active"
  }'
```

Note the `id` returned — this is the CLIENT_ID.

---

### Step 2: Create the User Account

```bash
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@clientbusiness.com",
    "password": "ClientPassword2026!",
    "name": "Client Admin Name"
  }'
```

Then link them to the client:

```bash
curl -X PUT http://localhost:3001/api/users/[USER_ID] \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [OVERLORD_TOKEN]" \
  -d '{"client_id": [CLIENT_ID]}'
```

---

### Step 3: Upload Knowledge Base

Via Dashboard → Knowledge Base page, or API:

```bash
curl -X PUT http://localhost:3001/api/clients/[CLIENT_ID]/knowledge \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [TOKEN]" \
  -d '{
    "knowledge_base": "Full markdown knowledge base content here..."
  }'
```

This auto-syncs to the agent workspace.

---

### Step 4: Create Templates (Fallback)

Create at minimum a "General Greeting" template:

```bash
curl -X POST http://localhost:3001/api/templates \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": [CLIENT_ID],
    "name": "General Greeting",
    "category": "general",
    "trigger_keyword": "",
    "content": "👋 Welcome to [Client Name]!\n\nContact us at:\n📞 [Phone Number]\n📧 [Email]\n\nHow can I help you today?",
    "active": 1
  }'
```

---

### Step 5: Register OpenClaw Agent

In `/Users/deonvandenberg/.openclaw/openclaw.json`, add a new agent entry in the `agents.list` array:

```json
{
  "id": "agent-clientname",
  "default": false,
  "name": "Agent Display Name",
  "workspace": "/Users/deonvandenberg/.openclaw/workspace/agent-clientname",
  "agentDir": "/Users/deonvandenberg/.openclaw/agents/agent-clientname/agent",
  "model": {
    "primary": "deepseek/deepseek-v4-flash"
  },
  "identity": {
    "name": "Display Name",
    "theme": "Client description",
    "emoji": "🤖"
  }
}
```

---

### Step 6: Create Agent Workspace

```bash
mkdir -p /Users/deonvandenberg/.openclaw/workspace/agent-clientname
```

Create the agent identity files:
- `SOUL.md` — who the agent is, its tone, rules
- `AGENTS.md` — how it operates
- `USER.md` — client context
- Copy the knowledge base into the workspace

---

### Step 7: Set Agent ID in Database

```bash
sqlite3 /Users/deonvandenberg/.openclaw/workspace/fred/dashboard-api/data/autoeffortless.db \
  "UPDATE clients SET agent_id = 'agent-clientname' WHERE id = [CLIENT_ID];"
```

---

### Step 8: Restart Gateway

```bash
# Restart OpenClaw gateway to pick up new agent
launchctl kickstart gui/501/ai.openclaw.gateway
```

---

### Step 9: Test

- [ ] Send "Hi" to the client's WhatsApp number
- [ ] Verify the agent responds naturally
- [ ] Test a fee/pricing question
- [ ] Test something not in KB (should fall back to contact info)
- [ ] Test sending a photo (should get "text only" hint)
- [ ] Verify handoff notification reaches admin

---

### Step 10: Go Live

- [ ] Tell client their bot is live
- [ ] Share the onboarding wizard link
- [ ] Give them their dashboard login
- [ ] Set expectations: 250 msg/day limit, no SLA, best-effort uptime
