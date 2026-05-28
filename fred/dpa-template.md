# Data Processing Agreement (DPA)
## Between AutoEffortless (Pty) Ltd and [Client Name]

**Effective Date:** ____________

**Parties:**
1. **AutoEffortless (Pty) Ltd** ("Processor") — Registration No: [CIPC Number]
2. **[Client Name]** ("Controller") — Registration No: [CIPC Number / ID]

---

### 1. Definitions

- **Personal Information:** Any information relating to an identifiable, living, natural person as defined in POPIA.
- **Processing:** Any operation or activity concerning personal information, including collection, storage, use, and deletion.
- **Data Subject:** The person to whom the personal information relates.
- **POPIA:** The Protection of Personal Information Act, Act 4 of 2013 (South Africa).
- **Services:** The AI-powered communication services provided by the Processor to the Controller under their separate Service Agreement.

### 2. Purpose and Scope

The Processor provides AI-powered WhatsApp and social media communication services to the Controller. In doing so, the Processor processes personal information of the Controller's customers (data subjects) on behalf of the Controller.

The Controller determines the purposes and means of processing. The Processor acts only on the documented instructions of the Controller.

### 3. Categories of Data Subjects

- Customers, clients, or service users of the Controller
- Parents, guardians, or next-of-kin (where applicable)
- Employees or representatives of the Controller

### 4. Categories of Personal Information

- Names, phone numbers, and messaging profile information
- Message content and communication history
- Any other information voluntarily provided by data subjects in the course of communication

### 5. Processing Instructions

The Processor shall process personal information only for the following purposes:
- Responding to enquiries on behalf of the Controller
- Operating and maintaining the AI communication system
- Improving service quality (using anonymised/aggregated data only)
- Complying with legal obligations

### 6. Duration of Processing

The Processor will process personal information for the duration of the Service Agreement between the parties. After termination, all personal information will be deleted within 90 days unless otherwise required by law.

### 7. Technical and Organisational Security Measures

The Processor shall implement and maintain the following security measures:

- **Encryption in transit:** All data transmitted using HTTPS and secure tunnels
- **Access control:** Restricted to authorised personnel only
- **Server security:** Dedicated server with no public remote access
- **Rate limiting:** Protects against abuse and denial-of-service attacks
- **Regular backups:** Hourly backups to encrypted storage
- **Log rotation:** Automatic log management to prevent data accumulation

### 8. Sub-Processors

The Controller authorises the Processor to engage the following sub-processors:

| Sub-Processor | Service | Location |
|--------------|---------|----------|
| Meta (WhatsApp Business Platform) | Message transmission | Global |
| Cloudflare | Secure tunnel, DNS | Global |
| DeepSeek | AI model inference | Global |
| GitHub | Code repository, backups | Global |

The Processor shall notify the Controller of any changes to sub-processors at least 14 days in advance.

### 9. Data Subject Rights

The Processor shall assist the Controller in responding to data subject requests under POPIA, including:
- Requests for access to personal information
- Requests for correction or deletion
- Requests to object to processing

The Processor makes available the following self-service mechanisms:
- **WhatsApp:** Data subjects can text "DELETE MY DATA" to request deletion
- **API:** POST /api/delete-data and /api/export-data endpoints
- **Auto-expiry:** Conversations automatically deleted after 90 days

### 10. Data Breach Notification

In the event of a data breach involving personal information processed under this agreement:

1. The Processor shall notify the Controller within 48 hours of becoming aware of the breach
2. The Processor shall provide:
   - Description of the nature of the breach
   - Categories and approximate number of data subjects affected
   - Contact details for further information
   - Description of measures taken or proposed
3. The Controller is responsible for notifying the Information Regulator and affected data subjects as required by POPIA

### 11. Deletion and Return of Data

Upon termination of the Service Agreement:
- The Processor shall delete all personal information within 90 days
- The Controller may request export of their data before deletion
- The Processor shall provide written confirmation of deletion

### 12. Audit Rights

The Controller may audit the Processor's compliance with this agreement once per year, upon reasonable notice (minimum 14 days), at the Controller's cost.

### 13. Liability

The Processor's liability arising from this DPA shall be limited to the fees paid by the Controller in the 12 months preceding the incident. Nothing in this clause excludes liability for:
- Gross negligence or wilful misconduct
- Breach of confidentiality obligations
- Breach of POPIA caused by the Processor's actions

### 14. Governing Law

This agreement shall be governed by and construed in accordance with the laws of the Republic of South Africa.

### 15. Signatures

**Signed on behalf of AutoEffortless (Pty) Ltd (Processor):**

Signature: ________________________

Name: ____________________________

Date: ____________________________

**Signed on behalf of [Client Name] (Controller):**

Signature: ________________________

Name: ____________________________

Date: ____________________________

---

*This DPA forms part of the Service Agreement between the parties. In the event of any conflict, this DPA shall prevail regarding data protection matters.*
