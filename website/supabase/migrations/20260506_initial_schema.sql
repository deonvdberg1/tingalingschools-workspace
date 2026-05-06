-- Ting-A-Ling Schools - Complete Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
-- Extension uuid-ossp already exists

-- Create profiles table (links to auth.users via trigger)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY,
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Staff Members
CREATE TABLE IF NOT EXISTS staff_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Parent Contracts
CREATE TABLE IF NOT EXISTS parent_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL CHECK (status IN ('draft', 'signed', 'approved', 'archived')) DEFAULT 'draft',
  student_first_name TEXT NOT NULL,
  student_last_name TEXT NOT NULL,
  student_dob DATE,
  child_grade TEXT,
  parent1_full_name TEXT NOT NULL,
  parent1_email TEXT NOT NULL,
  parent1_phone TEXT NOT NULL,
  parent1_address TEXT,
  parent1_relationship TEXT,
  parent1_id_number TEXT,
  parent2_full_name TEXT,
  parent2_email TEXT,
  parent2_phone TEXT,
  parent2_address TEXT,
  parent2_relationship TEXT,
  parent2_id_number TEXT,
  emergency_contact1_name TEXT,
  emergency_contact1_phone TEXT,
  emergency_contact1_relationship TEXT,
  emergency_contact2_name TEXT,
  emergency_contact2_phone TEXT,
  emergency_contact2_relationship TEXT,
  medical_conditions TEXT,
  medications TEXT,
  allergies TEXT,
  dietary_requirements TEXT,
  doctor_name TEXT,
  doctor_phone TEXT,
  consent_medical_treatment BOOLEAN DEFAULT false,
  pickup_authorizations JSONB DEFAULT '[]'::jsonb,
  school_location TEXT,
  discount_type TEXT,
  discount_value NUMERIC(10,2),
  signature_image TEXT,
  signature_date TIMESTAMPTZ,
  contract_terms_accepted BOOLEAN DEFAULT false,
  signed_pdf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Staff Leave Balance
CREATE TABLE IF NOT EXISTS staff_leave_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_email TEXT NOT NULL,
  leave_year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW()),
  annual_leave_total NUMERIC(5,1) DEFAULT 15,
  annual_leave_used NUMERIC(5,1) DEFAULT 0,
  sick_leave_total NUMERIC(5,1) DEFAULT 30,
  sick_leave_used NUMERIC(5,1) DEFAULT 0,
  family_leave_total NUMERIC(5,1) DEFAULT 3,
  family_leave_used NUMERIC(5,1) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(staff_email, leave_year)
);

-- Leave Requests
CREATE TABLE IF NOT EXISTS leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Purchase Requests
CREATE TABLE IF NOT EXISTS purchase_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Pay Slips
CREATE TABLE IF NOT EXISTS pay_slips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- School Events
CREATE TABLE IF NOT EXISTS school_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT DEFAULT 'School Event',
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  color TEXT DEFAULT '#3b82f6',
  is_staff_only BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Event Templates
CREATE TABLE IF NOT EXISTS event_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT DEFAULT 'School Event',
  color TEXT DEFAULT '#3b82f6',
  is_staff_only BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Staff Announcements
CREATE TABLE IF NOT EXISTS staff_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT CHECK (priority IN ('Urgent', 'High', 'Normal', 'Low')) DEFAULT 'Normal',
  is_active BOOLEAN DEFAULT true,
  expiry_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Storage bucket for contract PDFs
INSERT INTO storage.buckets (id, name, public) 
VALUES ('contract_pdfs', 'contract_pdfs', true)
ON CONFLICT (id) DO NOTHING;

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE pay_slips ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_announcements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Staff Members
DROP POLICY IF EXISTS "Admins can manage staff" ON staff_members;
CREATE POLICY "Admins can manage staff" ON staff_members FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS "Staff can read own" ON staff_members;
CREATE POLICY "Staff can read own" ON staff_members FOR SELECT USING (email = (SELECT email FROM profiles WHERE id = auth.uid()));

-- Parent Contracts
DROP POLICY IF EXISTS "Anyone can submit contract" ON parent_contracts;
CREATE POLICY "Anyone can submit contract" ON parent_contracts FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admins can manage contracts" ON parent_contracts;
CREATE POLICY "Admins can manage contracts" ON parent_contracts FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS "Anyone can read own contract" ON parent_contracts;
CREATE POLICY "Anyone can read own contract" ON parent_contracts FOR SELECT USING (parent1_email = (SELECT email FROM profiles WHERE id = auth.uid()) OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Leave Requests
DROP POLICY IF EXISTS "Staff can manage own leave" ON leave_requests;
CREATE POLICY "Staff can manage own leave" ON leave_requests FOR ALL USING (staff_email = (SELECT email FROM profiles WHERE id = auth.uid()));
DROP POLICY IF EXISTS "Admins can manage all leave" ON leave_requests;
CREATE POLICY "Admins can manage all leave" ON leave_requests FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Purchase Requests
DROP POLICY IF EXISTS "Staff manage own purchases" ON purchase_requests;
CREATE POLICY "Staff manage own purchases" ON purchase_requests FOR ALL USING (staff_email = (SELECT email FROM profiles WHERE id = auth.uid()));
DROP POLICY IF EXISTS "Admins manage all purchases" ON purchase_requests;
CREATE POLICY "Admins manage all purchases" ON purchase_requests FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Leave Balances
DROP POLICY IF EXISTS "Staff read own balance" ON staff_leave_balances;
CREATE POLICY "Staff read own balance" ON staff_leave_balances FOR SELECT USING (staff_email = (SELECT email FROM profiles WHERE id = auth.uid()));
DROP POLICY IF EXISTS "Admins manage balances" ON staff_leave_balances;
CREATE POLICY "Admins manage balances" ON staff_leave_balances FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Pay Slips
DROP POLICY IF EXISTS "Staff read own payslip" ON pay_slips;
CREATE POLICY "Staff read own payslip" ON pay_slips FOR SELECT USING (staff_email = (SELECT email FROM profiles WHERE id = auth.uid()));
DROP POLICY IF EXISTS "Admins manage payslips" ON pay_slips;
CREATE POLICY "Admins manage payslips" ON pay_slips FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- School Events
DROP POLICY IF EXISTS "Anyone can read events" ON school_events;
CREATE POLICY "Anyone can read events" ON school_events FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage events" ON school_events;
CREATE POLICY "Admins manage events" ON school_events FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Event Templates
DROP POLICY IF EXISTS "Admins manage templates" ON event_templates;
CREATE POLICY "Admins manage templates" ON event_templates FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Announcements
DROP POLICY IF EXISTS "Staff read announcements" ON staff_announcements;
CREATE POLICY "Staff read announcements" ON staff_announcements FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage announcements" ON staff_announcements;
CREATE POLICY "Admins manage announcements" ON staff_announcements FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Storage policies for contract PDFs
DROP POLICY IF EXISTS "Anyone can read contract PDFs" ON storage.objects;
CREATE POLICY "Anyone can read contract PDFs" ON storage.objects FOR SELECT USING (bucket_id = 'contract_pdfs');
DROP POLICY IF EXISTS "Admins can upload contract PDFs" ON storage.objects;
CREATE POLICY "Admins can upload contract PDFs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'contract_pdfs' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
