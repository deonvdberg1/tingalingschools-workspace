# Data Model — Ting-A-Ling Schools Parent Portal

## Entities (extracted from source code)

### 1. `parent_contracts` — Enrollment contracts submitted by parents

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID | auto | Primary key |
| contract_date | DATE | ✓ | Default today |
| status | TEXT | ✓ | 'draft', 'signed', 'approved', 'archived' |
| student_first_name | TEXT | ✓ | |
| student_last_name | TEXT | ✓ | |
| student_dob | DATE | | |
| child_grade | TEXT | | |
| parent1_full_name | TEXT | ✓ | |
| parent1_email | TEXT | ✓ | |
| parent1_phone | TEXT | ✓ | |
| parent1_address | TEXT | | |
| parent1_relationship | TEXT | | |
| parent1_id_number | TEXT | | |
| parent2_full_name | TEXT | | Optional second parent |
| parent2_email | TEXT | | |
| parent2_phone | TEXT | | |
| parent2_address | TEXT | | |
| parent2_relationship | TEXT | | |
| parent2_id_number | TEXT | | |
| emergency_contact1_name | TEXT | ✓ | |
| emergency_contact1_phone | TEXT | ✓ | |
| emergency_contact1_relationship | TEXT | ✓ | |
| emergency_contact2_name | TEXT | | Optional |
| emergency_contact2_phone | TEXT | | |
| emergency_contact2_relationship | TEXT | | |
| medical_conditions | TEXT | | |
| medications | TEXT | | |
| allergies | TEXT | | |
| dietary_requirements | TEXT | | |
| doctor_name | TEXT | | |
| doctor_phone | TEXT | | |
| consent_medical_treatment | BOOLEAN | | Default false |
| pickup_authorizations | JSONB | | Array of {name, phone, relationship} |
| school_location | TEXT | | e.g. 'PrePrimary - 74 Krewilkring Meerensee' |
| discount_type | TEXT | | |
| discount_value | NUMERIC | | |
| signature_image | TEXT | | Base64 encoded PNG |
| signature_date | TIMESTAMPTZ | | |
| contract_terms_accepted | BOOLEAN | | Default false |
| signed_pdf_url | TEXT | | URL to generated PDF |
| created_at | TIMESTAMPTZ | auto | |
| updated_at | TIMESTAMPTZ | auto | |

### 2. `staff_members` — Staff directory

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID | auto | Primary key |
| full_name | TEXT | ✓ | |
| email | TEXT | ✓ | Unique |
| phone | TEXT | | |
| id_number | TEXT | | SA ID number |
| job_title | TEXT | | |
| school | TEXT | | 'PrePrimary' or 'SpecialNeeds' |
| start_date | DATE | | |
| emergency_contact_name | TEXT | | |
| emergency_contact_phone | TEXT | | |
| notes | TEXT | | |
| is_active | BOOLEAN | | Default true |
| created_at | TIMESTAMPTZ | auto | |
| updated_at | TIMESTAMPTZ | auto | |

### 3. `staff_leave_balances` — Per-staff leave tracking

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID | auto | Primary key |
| staff_email | TEXT | ✓ | Unique per year |
| leave_year | INTEGER | | Default current year |
| annual_leave_total | NUMERIC(5,1) | | Default 15 |
| annual_leave_used | NUMERIC(5,1) | | Default 0 |
| sick_leave_total | NUMERIC(5,1) | | Default 30 |
| sick_leave_used | NUMERIC(5,1) | | Default 0 |
| family_leave_total | NUMERIC(5,1) | | Default 3 |
| family_leave_used | NUMERIC(5,1) | | Default 0 |
| notes | TEXT | | |
| created_at | TIMESTAMPTZ | auto | |
| updated_at | TIMESTAMPTZ | auto | |

### 4. `leave_requests` — Staff leave requests

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID | auto | Primary key |
| staff_email | TEXT | ✓ | |
| staff_name | TEXT | | |
| status | TEXT | | 'pending', 'approved', 'rejected' |
| leave_type | TEXT | ✓ | 'annual', 'sick', 'family', 'other' |
| start_date | DATE | ✓ | |
| end_date | DATE | ✓ | |
| start_time | TIME | | |
| is_half_day | BOOLEAN | | Default false |
| half_day_period | TEXT | | 'morning' or 'afternoon' |
| days_count | NUMERIC(4,1) | | |
| reason | TEXT | | |
| notes | TEXT | | |
| admin_notes | TEXT | | |
| reviewed_by | TEXT | | |
| created_at | TIMESTAMPTZ | auto | |
| updated_at | TIMESTAMPTZ | auto | |

### 5. `purchase_requests` — Staff purchase requests

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID | auto | Primary key |
| staff_email | TEXT | ✓ | |
| staff_name | TEXT | | |
| status | TEXT | | 'pending','approved','rejected','ordered','received' |
| item_description | TEXT | ✓ | |
| quantity | NUMERIC(10,2) | | Default 1 |
| estimated_cost | NUMERIC(10,2) | | |
| supplier | TEXT | | |
| reason | TEXT | | |
| priority | TEXT | | 'Normal', 'High', 'Urgent' |
| admin_notes | TEXT | | |
| created_at | TIMESTAMPTZ | auto | |
| updated_at | TIMESTAMPTZ | auto | |

### 6. `pay_slips` — Monthly payslips

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID | auto | Primary key |
| staff_name | TEXT | ✓ | |
| staff_email | TEXT | ✓ | |
| staff_id_number | TEXT | | |
| job_title | TEXT | | |
| pay_period | TEXT | ✓ | e.g. 'May 2026' |
| pay_date | DATE | ✓ | |
| basic_salary | NUMERIC(12,2) | | |
| earnings | JSONB | | Array of {description, amount} |
| deductions | JSONB | | Array of {description, amount} |
| gross | NUMERIC(12,2) | | |
| net | NUMERIC(12,2) | | |
| leave_days_taken | NUMERIC(4,1) | | |
| leave_days_balance | NUMERIC(4,1) | | |
| notes | TEXT | | |
| created_at | TIMESTAMPTZ | auto | |

### 7. `school_events` — Calendar events

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID | auto | Primary key |
| title | TEXT | ✓ | |
| description | TEXT | | |
| event_type | TEXT | | 'School Event', 'Holiday', 'Meeting', etc. |
| start_date | TIMESTAMPTZ | ✓ | |
| end_date | TIMESTAMPTZ | | |
| color | TEXT | | Hex color |
| is_staff_only | BOOLEAN | | Default false |
| created_at | TIMESTAMPTZ | auto | |

### 8. `event_templates` — Recurring event templates

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID | auto | Primary key |
| title | TEXT | ✓ | |
| description | TEXT | | |
| event_type | TEXT | | |
| color | TEXT | | |
| is_staff_only | BOOLEAN | | |
| created_at | TIMESTAMPTZ | auto | |

### 9. `staff_announcements` — Staff notifications

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID | auto | Primary key |
| title | TEXT | ✓ | |
| content | TEXT | ✓ | |
| priority | TEXT | | 'Urgent','High','Normal','Low' |
| is_active | BOOLEAN | | Default true |
| expiry_date | DATE | | |
| created_at | TIMESTAMPTZ | auto | |
| updated_at | TIMESTAMPTZ | auto | |

### 10. `profiles` — Extended user profiles (linked to auth.users)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID | auto | References auth.users.id |
| email | TEXT | ✓ | |
| full_name | TEXT | ✓ | |
| phone | TEXT | | |
| id_number | TEXT | | |
| role | TEXT | ✓ | 'admin' or 'staff' |
| avatar_url | TEXT | | |
| created_at | TIMESTAMPTZ | auto | |
| updated_at | TIMESTAMPTZ | auto | |

## Relationships

```
auth.users (1) ──→ profiles (1)
staff_members (1) ──→ staff_leave_balances (1 per year)
staff_members.email ──→ leave_requests.staff_email (1:N)
staff_members.email ──→ purchase_requests.staff_email (1:N)
staff_members.email ──→ pay_slips.staff_email (1:N)
```

## User Roles

- **admin** — Full access to all CRUD operations, contract management, staff admin
- **staff** — Can read own data, submit leave/purchase requests, view own payslips
- **public** — Can submit parent contracts (no auth required)

## API Endpoints (Base44 → Supabase migration)

| Base44 Call | Supabase Replacement |
|-------------|---------------------|
| `base44.auth.me()` | `auth.me()` from `@/supabase/auth` |
| `base44.auth.signIn(...)` | `auth.signIn()` |
| `base44.entities.ParentContract.list(order)` | `db.contracts.list(order)` |
| `base44.entities.ParentContract.get(id)` | `db.contracts.get(id)` |
| `base44.entities.ParentContract.create(values)` | `db.contracts.create(values)` |
| `base44.entities.ParentContract.update(id, values)` | `db.contracts.update(id, values)` |
| `base44.entities.ParentContract.delete(id)` | `db.contracts.delete(id)` |
| `base44.entities.StaffMember.list(order, limit)` | `db.staff.list(order)` |
| `base44.entities.StaffMember.create(values)` | `db.staff.create(values)` |
| `base44.entities.StaffMember.update(id, values)` | `db.staff.update(id, values)` |
| `base44.entities.StaffMember.delete(id)` | `db.staff.delete(id)` |
| `base44.entities.LeaveRequest.list(order, limit)` | `db.leaveRequests.list(order)` |
| `base44.entities.LeaveRequest.filter(filters, order, limit)` | `db.leaveRequests.filter(filters, order, limit)` |
| `base44.entities.LeaveRequest.create(values)` | `db.leaveRequests.create(values)` |
| `base44.entities.LeaveRequest.update(id, values)` | `db.leaveRequests.update(id, values)` |
| `base44.entities.StaffLeaveBalance.list(order)` | `db.leaveBalances.list(order)` |
| `base44.entities.StaffLeaveBalance.filter(filters)` | `db.leaveBalances.filter(filters)` |
| `base44.entities.StaffLeaveBalance.create(values)` | `db.leaveBalances.create(values)` |
| `base44.entities.StaffLeaveBalance.update(id, values)` | `db.leaveBalances.update(id, values)` |
| `base44.entities.PurchaseRequest.list(order, limit)` | `db.purchaseRequests.list(order)` |
| `base44.entities.PurchaseRequest.filter(filters)` | `db.purchaseRequests.filter(filters)` |
| `base44.entities.PurchaseRequest.create(values)` | `db.purchaseRequests.create(values)` |
| `base44.entities.PurchaseRequest.update(id, values)` | `db.purchaseRequests.update(id, values)` |
| `base44.entities.PaySlip.list(order, limit)` | `db.paySlips.list(order)` |
| `base44.entities.PaySlip.filter(filters, order, limit)` | `db.paySlips.filter(filters, order, limit)` |
| `base44.entities.PaySlip.create(values)` | `db.paySlips.create(values)` |
| `base44.entities.SchoolEvent.list(order, limit)` | `db.events.list(order, limit)` |
| `base44.entities.SchoolEvent.create(values)` | `db.events.create(values)` |
| `base44.entities.SchoolEvent.update(id, values)` | `db.events.update(id, values)` |
| `base44.entities.SchoolEvent.delete(id)` | `db.events.delete(id)` |
| `base44.entities.EventTemplate.list(order)` | `db.eventTemplates.list()` |
| `base44.entities.EventTemplate.create(values)` | `db.eventTemplates.create(values)` |
| `base44.entities.StaffAnnouncement.list(order, limit)` | `db.announcements.list(order, limit)` |
| `base44.entities.StaffAnnouncement.filter(filters)` | `db.announcements.filter(filters)` |
| `base44.entities.StaffAnnouncement.create(values)` | `db.announcements.create(values)` |
| `base44.entities.StaffAnnouncement.update(id, values)` | `db.announcements.update(id, values)` |
| `base44.entities.StaffAnnouncement.delete(id)` | `db.announcements.delete(id)` |
| `base44.functions.invoke('generateContractPdf', {...})` | Supabase Edge Function or direct Storage |
| `base44.functions.invoke('getContractPdf', {...})` | Supabase Edge Function |

## File Storage

- **contract_pdfs** bucket — Stores signed contract PDFs
- Public access for viewing, admin-only for upload

## Server-side Logic

1. **generateContractPdf** — Given contract ID, generates a PDF using jsPDF with all contract data, uploads to storage, updates contract record with URL
2. **getContractPdf** — Given contract ID, returns the PDF URL from the contract record
