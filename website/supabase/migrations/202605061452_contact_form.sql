CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can submit contact form" ON contact_submissions;
CREATE POLICY "Anyone can submit contact form"
  ON contact_submissions FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can read contact submissions" ON contact_submissions;
CREATE POLICY "Admins can read contact submissions"
  ON contact_submissions FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
