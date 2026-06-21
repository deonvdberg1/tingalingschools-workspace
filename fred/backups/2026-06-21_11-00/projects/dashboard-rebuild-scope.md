# Dashboard Rebuild — Full Scope Document

**Prepared:** 2026-05-18  
**Current state:** Single embedded HTML page in `server.js` — no auth, no database, no real-time, no analytics  
**Target state:** Professional, multi-feature dashboard product

---

## 🏗 Architecture

### Current (Problematic)
```
server.js
├── Express API (webhooks, send, status)
└── Dashboard HTML (400+ lines inline, no separation)
    └── conversations.json (file-based DB)
```

### Target
```
whatsapp-server/
├── server.js                 → API + webhook handler (lighter)
├── package.json              → updated deps
├── .env                      → credentials
│
├── frontend/                 → Proper SPA (separate project)
│   ├── src/
│   │   ├── App.jsx
│   │   ├── pages/            → Dashboard, Conversations, Contacts, Broadcast, Settings
│   │   ├── components/       → Sidebar, ChatView, MessageBubble, StatsCard, etc.
│   │   ├── hooks/            → useSocket, useAuth, useConversations
│   │   ├── context/          → AuthContext, SocketContext
│   │   └── styles/           → Tailwind config, global CSS
│   ├── public/
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── db/
│   ├── schema.sql            → Tables for contacts, messages, templates, broadcasts
│   └── database.js           → SQLite/Postgres connection
│
└── routes/
    ├── auth.js               → Login/logout/session
    ├── conversations.js      → GET/POST conversations, messages
    ├── contacts.js           → Contact CRUD
    ├── analytics.js          → Stats + time-series data
    ├── broadcast.js          → Create/send broadcasts
    ├── templates.js          → Message template CRUD
    └── socket.js             → WebSocket events for real-time
```

### Tech Stack

| Layer | Choice | Why |
|:------|:-------|:----|
| **Frontend** | React 18 + Vite | Industry standard, vast ecosystem, Tailwind integration |
| **Styling** | Tailwind CSS | Fast to build, consistent design, utility-first |
| **UI Components** | shadcn/ui | Beautiful, accessible, copy-paste components built on Radix |
| **Charts** | Recharts | Clean, React-native charting for analytics |
| **Real-time** | Socket.io | Mature, auto-reconnect, room support |
| **State** | React Context + useReducer | Simple enough for this scale, no Redux overhead |
| **Backend** | Node.js + Express | Already have it, no migration needed |
| **Database** | SQLite (better-sqlite3) | Zero setup, file-based, fast enough for school volumes |
| **Auth** | JWT (httpOnly cookies) | Simple, secure, no external dependency |
| **Build** | Vite | Fast HMR, easy deployment |

---

## 🎨 Design System

This is critical — the current dashboard has no design identity.

### Brand & Visual Language
- **Primary palette:** Teal/emerald (current `#0d9488` is decent — keep as starting point)
  - Refined: `#0b7a6e` (dark) → `#14b8a6` (light) with proper shades
- **Secondary:** Warm amber for "needs attention" states
- **Typography:** Inter (clean, modern, works at all sizes)
- **Icon set:** Lucide (consistent, open-source, React-native)
- **Spacing:** 4px grid system
- **Border radius:** 8px default, 12px cards
- **Shadows:** Subtle layering for depth

### Layout Structure
```
┌──────────────────────────────────────────────────────┐
│  Top Nav: Logo | Search | Status | Notifications | 👤 │
├─────────────┬────────────────────────────────────────┤
│             │                                        │
│  Sidebar    │  Main Content Area                     │
│  250px      │  (routing-based: Dashboard,            │
│  Navigation │   Conversations, Contacts,             │
│  +          │   Broadcast, Analytics, Settings)      │
│  Stats      │                                        │
│  Widgets    │                                        │
│             │                                        │
└─────────────┴────────────────────────────────────────┘
```

### Page Designs (Concept)

**Dashboard Home**
```
┌──────────────────────────────────────────────────┐
│ 📊 Dashboard                                      │
├──────────┬──────────┬──────────┬──────────────────┤
│  Chats   │ Msgs     │ Auto     │ Avg Response     │
│  Today   │ Today    │ Reply %  │ Time             │
│    12    │   47     │   83%    │    2m 14s        │
├──────────┴──────────┴──────────┴──────────────────┤
│ 📈 Message Volume (7 days)          ┌──────────┐ │
│  ██▄█▅▇█  bar chart                 │ Top      │ │
│                                      │ Contacts │ │
│ 📋 Recent Conversations              │ 1. Sandi │ │
│  • Deon — "School fees?"       2m   │ 2. Thabo │ │
│  • Sandi — "Hi"               15m   │ 3. Zane  │ │
│  • Thabo — "Absent today"     1h    └──────────┘ │
└──────────────────────────────────────────────────┘
```

**Conversations View** (primary daily driver)
```
┌──────────────┬─────────────────────────────────────────┐
│ 💬 Chats (14)│  Sandi                                   │
├──────────────┤ 📞 +27 72 456 1282                       │
│ Search...    │ 🏷️ Parent · Last seen: 2h ago            │
│              │                                          │
│ 📌 Deon      │  ┌──────────────────────────────┐        │
│   2m ago     │  │ Sandi: Hi                     │        │
│   "Thanks"   │  └──────────────────────────────┘        │
│              │  ┌──────────────────────────────┐        │
│ Sandi  ⭐    │  │ Auto: Welcome to Ting-A-...  │        │
│   15m ago    │  └──────────────────────────────┘        │
│   "Hi"       │                                          │
│              │  ┌──────────────────────────────┐        │
│ Thabo        │  │ Sandi: How much for fees?    │        │
│   1h ago     │  └──────────────────────────────┘        │
│   "Absent"   │  ┌──────────────────────────────┐        │
│              │  │ You: Our fees start at...    │        │
│              │  └──────────────────────────────┘        │
│              │                                          │
│              │ ┌──────────────────────────────────┐     │
│              │ │ Type a message...          ➤    │     │
│              │ └──────────────────────────────────┘     │
└──────────────┴─────────────────────────────────────────┘
```

**Analytics View**
```
┌─────────────────────────────────────────────────────────┐
│ 📊 Analytics                                            │
├─────────────────────────────────────────────────────────┤
│ 📅 Last 7 days  ▼                                       │
│                                                         │
│ Messages Over Time                    Auto-Reply Rate    │
│   40 ┤ ░░░░░░░░░░░░░░░░░░               ████████░ 83%   │
│   30 ┤ ░░░█░░░░░░░░█░░░░░                                  │
│   20 ┤ ░░██░░░░░░░██░░░░░░                                │
│   10 ┤ ░███░░░█░░███░░░░░                                  │
│    0 ┤ ████░██░░████░░███                                  │
│      └──Mon──Tue──Wed──Thu──Fri                           │
│                                                         │
│ Response Time (avg)         Busiest Hour                 │
│     ⚡ 2m 14s                 08:00 - 09:00              │
│                                                         │
│ Top Questions Asked         Unhandled Chats              │
│   • Fees (34%)               📋 3 need human reply       │
│   • Hours (22%)                                          │
│   • Absentee (18%)                                       │
└─────────────────────────────────────────────────────────┘
```

---

## 📋 Feature Scope — Phased

### Phase 1 — Core Dashboard Replacement (Essential)
| # | Feature | Why |
|:-:|:--------|:----|
| 1 | **Authentication** — Login page, JWT session, logout | Current has zero security |
| 2 | **SPA foundation** — React + Vite + Tailwind + Router | Proper build tooling |
| 3 | **Design system** — Colors, typography, spacing, components | Professional look |
| 4 | **Real-time conversations** — Socket.io, instant updates | No more 12s polling + reload |
| 5 | **Conversation sidebar** — Searchable list with unread badges | Clean navigation |
| 6 | **Chat view** — Message history, send reply, auto/bot labels | Core workflow |
| 7 | **Dashboard stats cards** — Today's chats, messages, auto rate, response time | At-a-glance overview |
| 8 | **SQLite database** — Replace conversations.json | Queryable, reliable, scalable |
| 9 | **Responsive layout** — Works on phone + desktop | Mr D uses it on the go |
| 10 | **New conversation compose** — Send to any number | Replace current form |

### Phase 2 — Professional Features (Should Have)
| # | Feature | Why |
|:-:|:--------|:----|
| 11 | **Broadcast messages** — Send to all/filtered contacts | Send announcements to parents |
| 12 | **Message templates** — Save & reuse common replies | Speed up responses |
| 13 | **Analytics dashboard** — Charts, trends, top questions, response times | Data-driven decisions |
| 14 | **Contact management** — Names, notes, tags, conversation history | CRM for parents |
| 15 | **Media sending** — Send images, PDFs, documents | Statements, notices |
| 16 | **Conversation history export** — CSV/PDF per contact | Records for school files |
| 17 | **Message search** — Search across all conversations | Find past discussions |

### Phase 3 — AutoEffortless Product Features (Nice to Have)
| # | Feature | Why |
|:-:|:--------|:----|
| 18 | **Multi-agent/team** — Assign conversations, role-based access | For schools with admin staff |
| 19 | **Internal notes** — Team-only notes on conversations | Staff collaboration |
| 20 | **Quick replies** — Shortcut keys for common responses | Speed for power users |
| 21 | **Scheduled messages** — Send at specific times | After-hours broadcasts |
| 22 | **Opt-in/out tracking dashboard** — See who's opted out | Compliance visibility |
| 23 | **Parent self-service portal** — Limited view for parents to see their own messages | Future product growth |
| 24 | **Integrations** — Google Sheets export, Zapier webhook | Business tooling |

---

## 📐 Data Model (SQLite)

```sql
-- Core
contacts (id, phone, name, tags, notes, opt_in, first_seen, last_seen)
messages (id, contact_id, direction, type, content, status, timestamp, auto_replied)
conversations (id, contact_id, assigned_to, status, last_message, unread_count)

-- Productivity
templates (id, name, content, category, created_at)
broadcasts (id, name, status, template_id, recipient_filter, scheduled_at, sent_at)
broadcast_recipients (id, broadcast_id, contact_id, status, delivered_at)

-- Analytics (pre-computed for performance)
daily_stats (id, date, total_messages, auto_messages, human_messages, unique_contacts)
hourly_stats (id, hour, message_count)

-- Auth
users (id, username, password_hash, role, created_at)
sessions (id, user_id, token, expires_at)
```

---

## 📅 Effort Estimate

| Phase | Tasks | Est. Time | Dependency |
|:------|:------|:---------:|:----------|
| **P1 Setup** | Scaffold frontend project, Tailwind config, design system, auth | 2-3 days | None |
| **P1 Core** | Conversations page, real-time socket, chat view, reply | 3-4 days | Setup |
| **P1 Polish** | Dashboard stats, responsive design, testing, deployment | 2-3 days | Core |
| **P1 Total** | **~7-10 days** | | |

| **P2 Pro** | Analytics, broadcast, templates, contacts, media | 5-7 days | P1 done |
| **P3 Scale** | Multi-agent, scheduled, quick replies, portal | 5-7 days | P2 done |

**Full scope (P1+P2):** ~12-17 days  
**Full scope (P1+P2+P3):** ~17-24 days

---

## 🚀 Deployment

- **Frontend build:** `vite build` → static files served from Express
- **Single deploy:** One `npm run build` command, no separate hosting
- **Zero infrastructure change:** Still runs on the Mac mini, same port 3000
- **Database:** SQLite file lives alongside the server, auto-backup via existing scripts

## 💰 Cost

- **Software:** $0 (React, Vite, Tailwind, SQLite, Socket.io — all free/open-source)
- **Time:** My development effort
- **Ongoing:** $0 — no Meta markup, no monthly platform fees

---

## ⚠️ Risks

| Risk | Mitigation |
|:-----|:-----------|
| Scope creep — keep adding features | Phased delivery, ship P1 first |
| Design takes too long | Use shadcn/ui components as base, customize minimally |
| React learning curve for maintenance | Well-documented code, standard patterns only |
| Data migration from conversations.json | Script to import existing data into SQLite |
| Display name block delays testing | Can build and test the dashboard independently of Meta API |

---

**Bottom line for me, Mr D:** This turns our scrappy demo into a proper product that we own. It becomes a key part of the AutoEffortless offering — not just a backend with a boring UI, but something you can demo to clients and they'll say "that looks professional."

Want me to start on Phase 1 once the Meta display name is sorted, or do you want to prioritise anything differently?
