# 🛡️ POPIA Compliance Checklist
## AutoEffortless (Pty) Ltd — 28 May 2026

### ✅ Done (On Our Side — Fully Automated)

| Item | File / Location | What It Does |
|------|----------------|--------------|
| **Privacy Policy** | `fred/privacy-policy.html` | POPIA-compliant policy covering all processing activities |
| **Data Processing Agreement** | `fred/dpa-template.md` | Contract template for clients (processor/controller relationship) |
| **WhatsApp Data Deletion** | Server handles "DELETE MY DATA" | Users can text to erase their data immediately |
| **Data Deletion API** | `POST /api/delete-data` | Programmatic deletion endpoint |
| **Data Export API** | `POST /api/export-data` | Users can request their conversation data |
| **Auto-Expiry (90 days)** | Runs every 6 hours | Old conversations automatically purged |
| **Rate Limiting** | 20 req/s on webhook | Prevents abuse and data scraping |
| **Log Rotation** | Auto-trims at 1MB | Prevents unlimited log accumulation |

### 📋 Needs Mr D (Estimated: 30 minutes total)

| # | Item | What To Do | Est. Time |
|---|------|------------|:---------:|
| 1 | **Sign appointment letter** | Print or sign `information-officer-appointment.md` | 2 min |
| 2 | **Register Information Officer** | Go to https://justice.gov.za/inforeg → click "Register as Information Officer" → fill form with company details + your name/ID/email | 15 min |
| 3 | **Register AutoEffortless as a Data Processor** | Same portal, after registering the IO, register the company. Needs: company reg number, business type, description of data processing activities | 10 min |
| 4 | **Add CIPC number to documents** | Fill in the [CIPC Number] blanks in the DPA template and appointment letter | 2 min |

### 📋 Optional But Recommended

| Item | Why |
|------|-----|
| **POPIA manual** | A document explaining how people can exercise their data rights. Our privacy policy covers this. Not legally required but good practice |
| **Data processing register** | A simple spreadsheet listing: what data you process, where it's stored, who has access, retention period. I can build this if you want |

### What the Regulator Portal Asks

For **Information Officer Registration:**
- Company name: AutoEffortless (Pty) Ltd
- CIPC registration number: [fill in]
- IO name: [your name]
- IO ID number: [your SA ID]
- IO contact email: info@autoeffortless.com
- IO phone: [your number]

For **Company Registration:**
- Same company details
- Description of processing: *"Providing AI-powered WhatsApp and social media communication services to businesses. We process customer names, phone numbers, and message content on behalf of our clients."*
- Number of data subjects: *"Fewer than 100 (currently)"*

---

**TL;DR:** 30 minutes of form-filling on your side, then we're fully POPIA compliant. Everything technical is already in place.
