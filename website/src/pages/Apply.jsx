import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase, db } from '@/supabase/client';
import { auth } from '@/supabase/auth';
import { toast } from 'sonner';
import { CheckCircle, ArrowLeft, UserPlus } from 'lucide-react';

const SCHOOL_INFO = {
  PrePrimary: { name: 'Pre-Primary School', color: 'teal', address: '74 Krewilkring, Meerensee' },
  SpecialNeeds: { name: 'Special Needs School', color: 'purple', address: '18 Elweboog, Meerensee' },
};

const SPECIAL_NEEDS_OPTIONS = [
  'Autism Spectrum Disorder (ASD)', 'ADHD', 'Cerebral Palsy', 'Down Syndrome',
  'Dyslexia', 'Speech and Language Delay', 'Sensory Processing Disorder',
  'Intellectual Disability', 'Physical Disability', 'Hearing Impairment',
  'Visual Impairment', 'Emotional/Behavioral Disorder', 'Other', 'None',
];

const PREPRIMARY_GRADES = ['Grade RRR', 'Grade RR', 'Grade R'];

export default function Apply() {
  const [searchParams] = useSearchParams();
  const school = searchParams.get('school') || 'PrePrimary';
  const navigate = useNavigate();
  const info = SCHOOL_INFO[school];

  // Auth state
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Registration
  const [registering, setRegistering] = useState(false);
  const [regForm, setRegForm] = useState({ name: '', email: '', password: '', confirm: '' });

  // Application
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [parentPassword, setParentPassword] = useState('');
  const [form, setForm] = useState({
    parent_name: '', parent_email: '', parent_phone: '',
    child_name: '', child_age: '', previous_school: '', grade: '',
    special_needs: '',
  });

  useEffect(() => {
    auth.me().then(u => {
      setUser(u);
      if (u) {
        setForm(p => ({ ...p, parent_name: u.full_name || '', parent_email: u.email || '' }));
      }
      setCheckingAuth(false);
    }).catch(() => setCheckingAuth(false));
  }, []);

  if (!info) {
    return (
      <div className="max-w-lg mx-auto mt-20 text-center p-8">
        <h2 className="text-xl font-semibold mb-2">School not found</h2>
        <Link to="/"><Button variant="outline">Back to Home</Button></Link>
      </div>
    );
  }

  // Step 1: Register / Sign in
  if (!checkingAuth && !user && !registering) {
    return (
      <div className="min-h-[60vh] bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <UserPlus className="w-12 h-12 text-teal-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Create Your Account</h2>
          <p className="text-slate-500 text-sm mb-6">Sign up to apply to {info.name}. Your details will be saved for future applications.</p>
          <div className="space-y-3">
            <Button className="w-full bg-teal-600 hover:bg-teal-700" onClick={() => setRegistering(true)}>
              Create Account & Apply
            </Button>
            <p className="text-xs text-slate-400">
              Already have an account? <Link to="/Login" className="text-teal-600 hover:underline">Log in</Link>
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // Step 1b: Registration form
  if (!checkingAuth && !user && registering) {
    const handleRegister = async (e) => {
      e.preventDefault();
      if (regForm.password !== regForm.confirm) {
        toast.error('Passwords do not match');
        return;
      }
      setSending(true);
      try {
        const { data: fnData, error: fnError } = await supabase.functions.invoke('create-auth-user', {
          body: {
            email: regForm.email,
            password: regForm.password,
            full_name: regForm.name,
            role: 'parent'
          }
        });
        
        if (fnError) throw fnError;
        if (!fnData.success) {
          throw new Error(fnData.error || 'Account creation failed');
        }
        
        // Auto-login after account created
        await supabase.auth.signInWithPassword({
          email: regForm.email,
          password: regForm.password
        });
        
        toast.success('Account created! You can now fill in your application.');
        setSending(false);
        setUser({ email: regForm.email, full_name: regForm.name });
        setForm(p => ({ ...p, parent_name: regForm.name, parent_email: regForm.email }));
        setRegistering(false);
      } catch (err) {
        setSending(false);
        toast.error(err.message || 'Registration failed. Try again or contact us.');
      }
    };

    return (
      <div className="min-h-[60vh] bg-gradient-to-br from-slate-50 to-slate-100 py-10 px-4">
        <div className="max-w-md mx-auto">
          <button onClick={() => setRegistering(false)} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6">
            <ArrowLeft className="w-3 h-3" /> Back
          </button>
          <Card className="p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Create Account</h2>
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <Label>Full Name *</Label>
                <Input value={regForm.name} onChange={e => setRegForm(p => ({...p, name: e.target.value}))} required placeholder="Your name" />
              </div>
              <div>
                <Label>Email *</Label>
                <Input type="email" value={regForm.email} onChange={e => setRegForm(p => ({...p, email: e.target.value}))} required placeholder="you@email.com" />
              </div>
              <div>
                <Label>Password *</Label>
                <Input type="password" value={regForm.password} onChange={e => setRegForm(p => ({...p, password: e.target.value}))} required placeholder="Min 6 characters" minLength={6} />
              </div>
              <div>
                <Label>Confirm Password *</Label>
                <Input type="password" value={regForm.confirm} onChange={e => setRegForm(p => ({...p, confirm: e.target.value}))} required placeholder="Repeat password" minLength={6} />
              </div>
              <Button type="submit" disabled={sending} className={`w-full ${school === 'PrePrimary' ? 'bg-teal-600 hover:bg-teal-700' : 'bg-purple-600 hover:bg-purple-700'}`}>
                {sending ? 'Creating...' : 'Create Account'}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    );
  }

  // Step 2: Application form (user is logged in or just registered)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    const specialNeedsNote = school === 'SpecialNeeds' && form.special_needs
      ? `Special needs: ${form.special_needs}` : '';
    try {
      await db.contracts.create({
        status: 'application',
        student_first_name: form.child_name || 'To be confirmed',
        student_last_name: '.',
        parent1_full_name: form.parent_name,
        parent1_email: form.parent_email,
        parent1_phone: form.parent_phone,
        school_location: `${info.name} - ${info.address}`,
        parent1_relationship: 'Parent',
        child_grade: form.grade || form.child_age || '',
        medical_conditions: specialNeedsNote || (form.previous_school ? `Previous school: ${form.previous_school}` : ''),
        emergency_contact1_name: '.',
        emergency_contact1_phone: '.',
        emergency_contact1_relationship: '.',
      });
      setSubmitted(true);
    } catch (err) {
      toast.error('Could not submit. Please email us at info@tingaling.co.za');
    }
    setSending(false);
  };

  if (submitted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Application Submitted!</h2>
          <p className="text-slate-500 mb-4">Your application for {info.name} has been received.</p>
          <p className="text-xs text-slate-400 mb-6">You can track your application status in the Parent Portal.</p>
          <Link to="/ParentDashboard"><Button className="bg-teal-600 hover:bg-teal-700">Go to My Portal</Button></Link>
        </Card>
      </div>
    );
  }

  const btnClass = school === 'PrePrimary' ? 'bg-teal-600 hover:bg-teal-700' : 'bg-purple-600 hover:bg-purple-700';

  return (
    <div className="min-h-[60vh] bg-gradient-to-br from-slate-50 to-slate-100 py-10 px-4">
      <div className="max-w-lg mx-auto">
        <Link to="/#schools" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6">
          <ArrowLeft className="w-3 h-3" /> Back
        </Link>
        <Card className="p-6">
          <h1 className="text-xl font-bold text-slate-800 mb-1">Apply to {info.name}</h1>
          <p className="text-sm text-slate-500 mb-1">{info.address}</p>
          <p className="text-xs text-slate-400 mb-5">Logged in as <strong>{form.parent_email}</strong></p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Your Name *</Label>
                <Input value={form.parent_name} onChange={e => setForm(p => ({...p, parent_name: e.target.value}))} required placeholder="Full name" />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={form.parent_email} disabled className="bg-slate-100" />
              </div>
              <div>
                <Label>Phone *</Label>
                <Input value={form.parent_phone} onChange={e => setForm(p => ({...p, parent_phone: e.target.value}))} required placeholder="082 123 4567" />
              </div>
            </div>
            <div>
              <Label>Child's Name *</Label>
              <Input value={form.child_name} onChange={e => setForm(p => ({...p, child_name: e.target.value}))} required placeholder="Child's full name" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Child's Age *</Label>
                <Input value={form.child_age} onChange={e => setForm(p => ({...p, child_age: e.target.value}))} required placeholder="e.g. 4 years" />
              </div>
              {school === 'PrePrimary' && (
                <div>
                  <Label>Grade</Label>
                  <Select value={form.grade} onValueChange={v => setForm(p => ({...p, grade: v}))}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>{PREPRIMARY_GRADES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div>
              <Label>Previous School (if any)</Label>
              <Input value={form.previous_school} onChange={e => setForm(p => ({...p, previous_school: e.target.value}))} placeholder="Name of previous school" />
            </div>
            {school === 'SpecialNeeds' && (
              <div>
                <Label>Special Needs Condition *</Label>
                <Select value={form.special_needs} onValueChange={v => setForm(p => ({...p, special_needs: v}))}>
                  <SelectTrigger><SelectValue placeholder="Select condition..." /></SelectTrigger>
                  <SelectContent>{SPECIAL_NEEDS_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <Button type="submit" disabled={sending} className={`w-full ${btnClass} mt-2`}>
              {sending ? 'Submitting...' : 'Submit Application'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
