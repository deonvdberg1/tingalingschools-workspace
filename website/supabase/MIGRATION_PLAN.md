# Supabase Migration — Ting-A-Ling Schools Parent Portal

## Complete Entity Schema & Migration Plan

---

## 1. Supabase Setup

### 1.1 Create Project
1. Go to [supabase.com](https://supabase.com) → New project
2. Name: `tingalingschools`
3. Database password: Generate and save securely
4. Region: `South Africa (Cape Town)` or `eu-west-1`
5. Wait for provisioning (~2 min)

### 1.2 Get API Keys (from Settings → API)
```
SUPABASE_URL = https://xxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY = eyJ...
SUPABASE_SERVICE_ROLE_KEY = eyJ...  (keep SECRET)
```

### 1.3 Update `.env` file
Create `website/.env.local`:
```
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

---

## 2. Database Schema (SQL to run in Supabase SQL Editor)

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- AUTH: Supabase built-in auth handles users
-- We add a profiles table for extra fields
-- ============================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  id_number TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'staff')) DEFAULT 'staff',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'staff')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- STAFF MEMBERS
-- ============================================
CREATE TABLE staff_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  id_number TEXT,
  job_title TEXT,
  school TEXT CHECK (school IN ('PrePrimary', 'SpecialNeeds')),
  start_date DATE,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- PARENT CONTRACTS
-- ============================================
CREATE TABLE parent_contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL CHECK (status IN ('draft', 'signed', 'approved', 'archived')) DEFAULT 'draft',

  -- Student Info
  student_first_name TEXT NOT NULL,
  student_last_name TEXT NOT NULL,
  student_dob DATE,
  child_grade TEXT,

  -- Parent 1
  parent1_full_name TEXT NOT NULL,
  parent1_email TEXT NOT NULL,
  parent1_phone TEXT NOT NULL,
  parent1_address TEXT,
  parent1_relationship TEXT,
  parent1_id_number TEXT,

  -- Parent 2 (optional)
  parent2_full_name TEXT,
  parent2_email TEXT,
  parent2_phone TEXT,
  parent2_address TEXT,
  parent2_relationship TEXT,
  parent2_id_number TEXT,

  -- Emergency Contacts
  emergency_contact1_name TEXT,
  emergency_contact1_phone TEXT,
  emergency_contact1_relationship TEXT,
  emergency_contact2_name TEXT,
  emergency_contact2_phone TEXT,
  emergency_contact2_relationship TEXT,

  -- Medical Info
  medical_conditions TEXT,
  medications TEXT,
  allergies TEXT,
  dietary_requirements TEXT,
  doctor_name TEXT,
  doctor_phone TEXT,
  consent_medical_treatment BOOLEAN DEFAULT false,

  -- Pickup Authorizations (JSON array)
  pickup_authorizations JSONB DEFAULT '[]'::jsonb,

  -- School & Fees
  school_location TEXT,
  discount_type TEXT,
  discount_value NUMERIC(10,2),

  -- Signature
  signature_image TEXT,
  signature_date TIMESTAMPTZ,
  contract_terms_accepted BOOLEAN DEFAULT false,

  -- PDF
  signed_pdf_url TEXT,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- STAFF LEAVE BALANCE
-- ============================================
CREATE TABLE staff_leave_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_email TEXT NOT NULL UNIQUE,
  leave_year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW()),
  annual_leave_total NUMERIC(5,1) DEFAULT 15,
  annual_leave_used NUMERIC(5,1) DEFAULT 0,
  sick_leave_total NUMERIC(5,1) DEFAULT 30,
  sick_leave_used NUMERIC(5,1) DEFAULT 0,
  family_leave_total NUMERIC(5,1) DEFAULT 3,
  family_leave_used NUMERIC(5,1) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- LEAVE REQUESTS
-- ============================================
CREATE TABLE leave_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_email TEXT NOT NULL,
  staff_name TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  leave_type TEXT NOT NULL CHECK (leave_type IN ('annual', 'sick', 'family', 'other')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME,
  is_half_day BOOLEAN DEFAULT false,
  half_day_period TEXT,
  days_count NUMERIC(4,1),
  reason TEXT,
  notes TEXT,
  admin_notes TEXT,
  reviewed_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- PURCHASE REQUESTS
-- ============================================
CREATE TABLE purchase_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_email TEXT NOT NULL,
  staff_name TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'ordered', 'received')) DEFAULT 'pending',
  item_description TEXT NOT NULL,
  quantity NUMERIC(10,2) DEFAULT 1,
  estimated_cost NUMERIC(10,2),
  supplier TEXT,
  reason TEXT,
  priority TEXT DEFAULT 'Normal',
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- PAY SLIPS
-- ============================================
CREATE TABLE pay_slips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_name TEXT NOT NULL,
  staff_email TEXT NOT NULL,
  staff_id_number TEXT,
  job_title TEXT,
  pay_period TEXT NOT NULL,
  pay_date DATE NOT NULL,
  basic_salary NUMERIC(12,2) DEFAULT 0,
  earnings JSONB DEFAULT '[]'::jsonb,
  deductions JSONB DEFAULT '[]'::jsonb,
  gross NUMERIC(12,2) DEFAULT 0,
  net NUMERIC(12,2) DEFAULT 0,
  leave_days_taken NUMERIC(4,1),
  leave_days_balance NUMERIC(4,1),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- SCHOOL EVENTS / CALENDAR
-- ============================================
CREATE TABLE school_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT DEFAULT 'School Event',
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  color TEXT DEFAULT '#3b82f6',
  is_staff_only BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- EVENT TEMPLATES (recurring event templates)
-- ============================================
CREATE TABLE event_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT DEFAULT 'School Event',
  color TEXT DEFAULT '#3b82f6',
  is_staff_only BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- STAFF ANNOUNCEMENTS
-- ============================================
CREATE TABLE staff_announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT CHECK (priority IN ('Urgent', 'High', 'Normal', 'Low')) DEFAULT 'Normal',
  is_active BOOLEAN DEFAULT true,
  expiry_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- STORAGE (PDF Contracts)
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('contract_pdfs', 'contract_pdfs', true);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Profiles: users can read own, admins can read all
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Staff Members: admins can CRUD, staff can read own
ALTER TABLE staff_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage staff"
  ON staff_members FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Staff can read own"
  ON staff_members FOR SELECT
  USING (email = (SELECT email FROM profiles WHERE id = auth.uid()));

-- Parent Contracts: admins can all, public can insert
ALTER TABLE parent_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit contract"
  ON parent_contracts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can manage contracts"
  ON parent_contracts FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Anyone can read own contract"
  ON parent_contracts FOR SELECT
  USING (parent1_email = (SELECT email FROM profiles WHERE id = auth.uid()) OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Leave: staff can read/write own, admins manage all
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can manage own leave"
  ON leave_requests FOR ALL
  USING (staff_email = (SELECT email FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Admins can manage all leave"
  ON leave_requests FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Purchase requests, leave balances, pay slips, events, announcements: similar pattern
ALTER TABLE purchase_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage own purchases"
  ON purchase_requests FOR ALL
  USING (staff_email = (SELECT email FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Admins manage all purchases"
  ON purchase_requests FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

ALTER TABLE staff_leave_balances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage balances"
  ON staff_leave_balances FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Staff read own balance"
  ON staff_leave_balances FOR SELECT
  USING (staff_email = (SELECT email FROM profiles WHERE id = auth.uid()));

ALTER TABLE pay_slips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage payslips"
  ON pay_slips FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Staff read own payslip"
  ON pay_slips FOR SELECT
  USING (staff_email = (SELECT email FROM profiles WHERE id = auth.uid()));

ALTER TABLE school_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage events"
  ON school_events FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Anyone can read events"
  ON school_events FOR SELECT
  USING (true);

ALTER TABLE event_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage templates"
  ON event_templates FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

ALTER TABLE staff_announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage announcements"
  ON staff_announcements FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Staff read announcements"
  ON staff_announcements FOR SELECT
  USING (true);

-- Storage bucket policy
CREATE POLICY "Anyone can read contract PDFs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'contract_pdfs');
CREATE POLICY "Admins can upload contract PDFs"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'contract_pdfs' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
```

---

## 3. Frontend API Replacement

### 3.1 Create `/Users/deonvandenberg/.openclaw/workspace/website/src/supabase/client.js`

```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Reusable data access layer (replaces base44.entities.*)
export const db = {
  // --- Parent Contracts ---
  contracts: {
    list: async (order = '-created_at') => {
      const { data, error } = await supabase
        .from('parent_contracts')
        .select('*')
        .order(order.replace('-', ''), { ascending: order.startsWith('-') ? false : true });
      if (error) throw error;
      return data;
    },
    get: async (id) => {
      const { data, error } = await supabase.from('parent_contracts').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
    create: async (values) => {
      const { data, error } = await supabase.from('parent_contracts').insert(values).select().single();
      if (error) throw error;
      return data;
    },
    update: async (id, values) => {
      const { data, error } = await supabase.from('parent_contracts').update(values).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    delete: async (id) => {
      const { error } = await supabase.from('parent_contracts').delete().eq('id', id);
      if (error) throw error;
    }
  },

  // --- Staff Members ---
  staff: {
    list: async (order = '-created_at') => {
      const { data, error } = await supabase.from('staff_members').select('*')
        .order(order.replace('-', ''), { ascending: order.startsWith('-') ? false : true });
      if (error) throw error;
      return data;
    },
    get: async (id) => {
      const { data, error } = await supabase.from('staff_members').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
    create: async (values) => {
      const { data, error } = await supabase.from('staff_members').insert(values).select().single();
      if (error) throw error;
      return data;
    },
    update: async (id, values) => {
      const { data, error } = await supabase.from('staff_members').update(values).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    delete: async (id) => {
      const { error } = await supabase.from('staff_members').delete().eq('id', id);
      if (error) throw error;
    }
  },

  // --- Leave Requests ---
  leaveRequests: {
    list: async (order = '-created_at') => {
      const { data, error } = await supabase.from('leave_requests').select('*')
        .order(order.replace('-', ''), { ascending: order.startsWith('-') ? false : true });
      if (error) throw error;
      return data;
    },
    filter: async (filters, order = '-created_at', limit = 20) => {
      let query = supabase.from('leave_requests').select('*');
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
      const { data, error } = await query
        .order(order.replace('-', ''), { ascending: order.startsWith('-') ? false : true })
        .limit(limit);
      if (error) throw error;
      return data;
    },
    create: async (values) => {
      const { data, error } = await supabase.from('leave_requests').insert(values).select().single();
      if (error) throw error;
      return data;
    },
    update: async (id, values) => {
      const { data, error } = await supabase.from('leave_requests').update(values).eq('id', id).select().single();
      if (error) throw error;
      return data;
    }
  },

  // --- Leave Balances ---
  leaveBalances: {
    list: async (order = '-updated_at') => {
      const { data, error } = await supabase.from('staff_leave_balances').select('*')
        .order(order.replace('-', ''), { ascending: order.startsWith('-') ? false : true });
      if (error) throw error;
      return data;
    },
    filter: async (filters) => {
      let query = supabase.from('staff_leave_balances').select('*');
      Object.entries(filters).forEach(([key, value]) => { query = query.eq(key, value); });
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    create: async (values) => {
      const { data, error } = await supabase.from('staff_leave_balances').insert(values).select().single();
      if (error) throw error;
      return data;
    },
    update: async (id, values) => {
      const { data, error } = await supabase.from('staff_leave_balances').update(values).eq('id', id).select().single();
      if (error) throw error;
      return data;
    }
  },

  // --- Purchase Requests ---
  purchaseRequests: {
    list: async (order = '-created_at') => {
      const { data, error } = await supabase.from('purchase_requests').select('*')
        .order(order.replace('-', ''), { ascending: order.startsWith('-') ? false : true });
      if (error) throw error;
      return data;
    },
    filter: async (filters) => {
      let query = supabase.from('purchase_requests').select('*');
      Object.entries(filters).forEach(([key, value]) => { query = query.eq(key, value); });
      const { data, error } = await query.order('-created_at', { ascending: false }).limit(20);
      if (error) throw error;
      return data;
    },
    create: async (values) => {
      const { data, error } = await supabase.from('purchase_requests').insert(values).select().single();
      if (error) throw error;
      return data;
    },
    update: async (id, values) => {
      const { data, error } = await supabase.from('purchase_requests').update(values).eq('id', id).select().single();
      if (error) throw error;
      return data;
    }
  },

  // --- Pay Slips ---
  paySlips: {
    list: async (order = '-pay_date') => {
      const { data, error } = await supabase.from('pay_slips').select('*')
        .order(order.replace('-', ''), { ascending: order.startsWith('-') ? false : true });
      if (error) throw error;
      return data;
    },
    filter: async (filters, order = '-pay_date', limit = 12) => {
      let query = supabase.from('pay_slips').select('*');
      Object.entries(filters).forEach(([key, value]) => { query = query.eq(key, value); });
      const { data, error } = await query
        .order(order.replace('-', ''), { ascending: order.startsWith('-') ? false : true })
        .limit(limit);
      if (error) throw error;
      return data;
    },
    create: async (values) => {
      const { data, error } = await supabase.from('pay_slips').insert(values).select().single();
      if (error) throw error;
      return data;
    }
  },

  // --- School Events ---
  events: {
    list: async (order = '-start_date', limit = 300) => {
      const { data, error } = await supabase.from('school_events').select('*')
        .order(order.replace('-', ''), { ascending: order.startsWith('-') ? false : true })
        .limit(limit);
      if (error) throw error;
      return data;
    },
    create: async (values) => {
      const { data, error } = await supabase.from('school_events').insert(values).select().single();
      if (error) throw error;
      return data;
    },
    update: async (id, values) => {
      const { data, error } = await supabase.from('school_events').update(values).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    delete: async (id) => {
      const { error } = await supabase.from('school_events').delete().eq('id', id);
      if (error) throw error;
    }
  },

  // --- Event Templates ---
  eventTemplates: {
    list: async () => {
      const { data, error } = await supabase.from('event_templates').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    create: async (values) => {
      const { data, error } = await supabase.from('event_templates').insert(values).select().single();
      if (error) throw error;
      return data;
    }
  },

  // --- Announcements ---
  announcements: {
    list: async (order = '-created_at', limit = 50) => {
      const { data, error } = await supabase.from('staff_announcements').select('*')
        .order(order.replace('-', ''), { ascending: order.startsWith('-') ? false : true })
        .limit(limit);
      if (error) throw error;
      return data;
    },
    filter: async (filters) => {
      let query = supabase.from('staff_announcements').select('*');
      Object.entries(filters).forEach(([key, value]) => { query = query.eq(key, value); });
      const { data, error } = await query.order('-created_at', { ascending: false }).limit(20);
      if (error) throw error;
      return data;
    },
    create: async (values) => {
      const { data, error } = await supabase.from('staff_announcements').insert(values).select().single();
      if (error) throw error;
      return data;
    },
    update: async (id, values) => {
      const { data, error } = await supabase.from('staff_announcements').update(values).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    delete: async (id) => {
      const { error } = await supabase.from('staff_announcements').delete().eq('id', id);
      if (error) throw error;
    }
  }
};
```

### 3.2 Create `/Users/deonvandenberg/.openclaw/workspace/website/src/supabase/auth.js`

```javascript
import { supabase } from './client';

// Wraps Supabase auth to match Base44's auth API
export const auth = {
  /**
   * Get current authenticated user with profile data
   * @returns {Promise<{id, email, role, full_name, phone} | null>}
   */
  me: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Get profile data
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) throw error;

    return {
      id: user.id,
      email: user.email,
      email_verified: user.email_confirmed_at != null,
      role: profile.role,
      full_name: profile.full_name,
      phone: profile.phone,
      ...profile
    };
  },

  /**
   * Sign in with email/password
   */
  signIn: async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  /**
   * Sign up new user (requires email confirmation)
   */
  signUp: async ({ email, password, full_name, role = 'staff' }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name, role }
      }
    });
    if (error) throw error;
    return data;
  },

  /**
   * Sign out
   */
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  /**
   * Listen to auth state changes
   */
  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange(callback);
  },

  /**
   * Get current session
   */
  session: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  }
};
```

---

## 4. Supabase Edge Function — PDF Generation

Create `/Users/deonvandenberg/.openclaw/workspace/website/supabase/functions/generate-contract-pdf/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import jsPDF from "npm:jspdf@2.5.1";

serve(async (req: Request) => {
  try {
    const authHeader = req.headers.get("Authorization")!;
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return new Response(JSON.stringify({ error: "Forbidden: Admin only" }), { status: 403 });
    }

    const { contractId } = await req.json();
    if (!contractId) {
      return new Response(JSON.stringify({ error: "Contract ID required" }), { status: 400 });
    }

    const { data: contract, error: contractError } = await supabase
      .from("parent_contracts")
      .select("*")
      .eq("id", contractId)
      .single();

    if (contractError || !contract) {
      return new Response(JSON.stringify({ error: "Contract not found" }), { status: 404 });
    }

    // Generate PDF using jsPDF
    const doc = new jsPDF();
    let yPos = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const leftMargin = 20;
    const rightMargin = pageWidth - 20;
    const contentWidth = rightMargin - leftMargin;

    const addText = (text: string, size = 10, style: 'normal' | 'bold' = 'normal', align: 'left' | 'center' = 'left') => {
      doc.setFontSize(size);
      doc.setFont('helvetica', style);
      doc.text(text, align === 'center' ? pageWidth / 2 : leftMargin, yPos, { align });
      yPos += size * 0.4;
    };

    // Title
    addText('TING-A-LING SCHOOLS', 16, 'bold', 'center');
    addText('Parent Contract', 14, 'bold', 'center');
    addText(`Date: ${new Date(contract.contract_date).toLocaleDateString('en-ZA')}`, 10);
    yPos += 10;

    // Line
    doc.setDrawColor(0, 0, 0);
    doc.line(leftMargin, yPos, rightMargin, yPos);
    yPos += 10;

    // Student Info
    addText('STUDENT INFORMATION', 12, 'bold');
    addText(`Name: ${contract.student_first_name} ${contract.student_last_name}`);
    if (contract.student_dob) {
      addText(`Date of Birth: ${new Date(contract.student_dob).toLocaleDateString('en-ZA')}`);
    }
    if (contract.child_grade) addText(`Grade: ${contract.child_grade}`);
    yPos += 5;

    // Parent 1
    addText('PARENT/GUARDIAN 1', 12, 'bold');
    addText(`Name: ${contract.parent1_full_name}`);
    addText(`Email: ${contract.parent1_email}`);
    addText(`Phone: ${contract.parent1_phone}`);
    if (contract.parent1_address) addText(`Address: ${contract.parent1_address}`);
    if (contract.parent1_id_number) addText(`ID Number: ${contract.parent1_id_number}`);
    yPos += 5;

    // Parent 2 (if exists)
    if (contract.parent2_full_name) {
      addText('PARENT/GUARDIAN 2', 12, 'bold');
      addText(`Name: ${contract.parent2_full_name}`);
      addText(`Email: ${contract.parent2_email}`);
      addText(`Phone: ${contract.parent2_phone}`);
      yPos += 5;
    }

    // Emergency Contacts
    addText('EMERGENCY CONTACTS', 12, 'bold');
    addText(`Contact 1: ${contract.emergency_contact1_name} — ${contract.emergency_contact1_phone} (${contract.emergency_contact1_relationship})`);
    if (contract.emergency_contact2_name) {
      addText(`Contact 2: ${contract.emergency_contact2_name} — ${contract.emergency_contact2_phone} (${contract.emergency_contact2_relationship})`);
    }
    yPos += 5;

    // Medical Info (if consent given)
    if (contract.consent_medical_treatment) {
      addText('MEDICAL INFORMATION', 12, 'bold');
      if (contract.medical_conditions) addText(`Conditions: ${contract.medical_conditions}`);
      if (contract.medications) addText(`Medications: ${contract.medications}`);
      if (contract.allergies) addText(`Allergies: ${contract.allergies}`);
      if (contract.dietary_requirements) addText(`Dietary: ${contract.dietary_requirements}`);
      if (contract.doctor_name) addText(`Doctor: ${contract.doctor_name} — ${contract.doctor_phone}`);
      addText('✓ Medical treatment consent given');
      yPos += 5;
    }

    // School location
    addText('School Location: ' + (contract.school_location || 'Not specified'));
    yPos += 10;

    // Signature info
    if (contract.signature_date) {
      addText('SIGNATURE', 12, 'bold');
      addText(`Signed on: ${new Date(contract.signature_date).toLocaleString('en-ZA')}`);
      if (contract.signature_image) {
        try {
          doc.addImage(contract.signature_image, 'PNG', leftMargin, yPos, 60, 20);
          yPos += 25;
        } catch { }
      }
    }

    const pdfBuffer = doc.output('arraybuffer');
    const fileName = `contract-${contract.id}.pdf`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('contract_pdfs')
      .upload(fileName, new Uint8Array(pdfBuffer), {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('contract_pdfs')
      .getPublicUrl(fileName);

    // Update contract with PDF URL
    await supabase
      .from('parent_contracts')
      .update({ signed_pdf_url: publicUrl })
      .eq('id', contractId);

    return new Response(JSON.stringify({
      success: true,
      pdfUrl: publicUrl,
      contractId
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
```

Create `/Users/deonvandenberg/.openclaw/workspace/website/supabase/functions/get-contract-pdf/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req: Request) => {
  try {
    const authHeader = req.headers.get("Authorization")!;
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }

    const { contractId } = await req.json();
    if (!contractId) {
      return new Response(JSON.stringify({ error: "Contract ID required" }), { status: 400 });
    }

    const { data: contract } = await supabase
      .from("parent_contracts")
      .select("signed_pdf_url")
      .eq("id", contractId)
      .single();

    if (!contract?.signed_pdf_url) {
      return new Response(JSON.stringify({
        success: false,
        error: "PDF not yet generated"
      }), { status: 404 });
    }

    return new Response(JSON.stringify({
      success: true,
      pdfUrl: contract.signed_pdf_url
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
```

---

## 5. Deployment Steps

### 5.1 Deploy Database Schema
```bash
# Option A: Run SQL directly in Supabase Dashboard SQL Editor
# Copy the full SQL from Section 2 and paste

# Option B: Use Supabase CLI
cd website
supabase link --project-ref xxxxxxxx
supabase db push
```

### 5.2 Deploy Edge Functions
```bash
cd website
supabase functions deploy generate-contract-pdf
supabase functions deploy get-contract-pdf
```

### 5.3 Set Edge Function Secrets
```bash
supabase secrets set SUPABASE_URL=https://xxxxxxxx.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 5.4 Upgrade Frontend
```bash
npm install @supabase/supabase-js@latest
```

Create `src/supabase/client.js` and `src/supabase/auth.js` (from Section 3).

Then globally replace imports across the app:
- `import { base44 } from '@/api/base44Client'` → `import { supabase, db } from '@/supabase/client'`
- `base44.auth.me()` → `auth.me()` (from `@/supabase/auth`)
- `base44.entities.ParentContract.list()` → `db.contracts.list()`
- `base44.entities.StaffMember.create({...})` → `db.staff.create({...})`
- etc.

### 5.5 Deploy Site
```bash
cd website
npm run build
# Copy dist/ to gh-pages branch
```

---

## 6. Summary

| Component | Old (Base44) | New (Supabase) |
|-----------|-------------|----------------|
| Auth | `@base44/sdk` auth | `@supabase/supabase-js` auth |
| Database | Base44 entities | PostgreSQL tables |
| File Storage | Base44 file storage | Supabase Storage (`contract_pdfs` bucket) |
| Server Functions | Base44 Deno functions | Supabase Edge Functions (Deno) |
| App Config | `app-params.js` | Environment variables |
| Public Settings | Base44 API | Supabase row or `public_settings` table |
| Cost | Base44 paid plan | Supabase free tier (50K MAU, 500MB DB, 1GB storage) |
