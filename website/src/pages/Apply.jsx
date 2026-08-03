import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';
import { CheckCircle, ArrowLeft, Send } from 'lucide-react';

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

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxNtZEplTFGRKz7NzvV0o2SBQHAufWvbV0MHMczAjodgp-gotFCToF7KU7yGqh-NsJLxw/exec';

export default function Apply() {
  const [searchParams] = useSearchParams();
  const school = searchParams.get('school') || 'PrePrimary';
  const info = SCHOOL_INFO[school];

  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({
    parent_name: '', parent_email: '', parent_phone: '',
    child_name: '', child_age: '', previous_school: '', grade: '',
    special_needs: '',
  });

  if (!info) {
    return (
      <div className="max-w-lg mx-auto mt-20 text-center p-8">
        <h2 className="text-xl font-semibold mb-2">School not found</h2>
        <Link to="/"><Button variant="outline">Back to Home</Button></Link>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      // Google Apps Script web app: spreadsheet row + school email + parent confirmation.
      // text/plain body avoids CORS preflight; Apps Script embeds the payload in its redirect.
      const res = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          school,
          parent_name: form.parent_name,
          parent_email: form.parent_email,
          parent_phone: form.parent_phone,
          child_name: form.child_name,
          child_age: form.child_age,
          grade: form.grade,
          previous_school: form.previous_school,
          special_needs: form.special_needs,
        }),
      });
      const result = await res.json().catch(() => ({}));
      if (!result.success) throw new Error(result.error || 'Submission failed');
      setSubmitted(true);
    } catch (err) {
      console.error('Application submission failed:', err);
      toast.error('Could not submit. Please email us at info@tingalingschools.com');
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
          <p className="text-xs text-slate-400 mb-6">We'll be in touch with you at <strong>{form.parent_email}</strong>.</p>
          <div className="flex flex-col gap-2">
            <Link to="/Login"><Button className="w-full bg-teal-600 hover:bg-teal-700">Go to My Portal</Button></Link>
            <Link to="/"><Button variant="outline" className="w-full">Back to Home</Button></Link>
          </div>
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
          <div className="flex items-center gap-3 mb-4">
            <Send className={`w-6 h-6 ${school === 'PrePrimary' ? 'text-teal-500' : 'text-purple-500'}`} />
            <div>
              <h1 className="text-xl font-bold text-slate-800">Apply to {info.name}</h1>
              <p className="text-sm text-slate-500">{info.address}</p>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Your Full Name *</Label>
                <Input value={form.parent_name} onChange={e => setForm(p => ({...p, parent_name: e.target.value}))} required placeholder="Full name" />
              </div>
              <div>
                <Label>Email *</Label>
                <Input type="email" value={form.parent_email} onChange={e => setForm(p => ({...p, parent_email: e.target.value}))} required placeholder="you@email.com" />
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
