import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { db } from '@/supabase/client';
import { auth } from '@/supabase/auth';
import { toast } from 'sonner';
import { differenceInBusinessDays, parseISO } from 'date-fns';

const LEAVE_TYPES = ['Annual Leave', 'Sick Leave', 'Family Responsibility', 'Maternity Leave', 'Parental Leave', 'Unpaid Leave'];

export default function LeaveRequestForm({ user, onSuccess }) {
  const [form, setForm] = useState({
    leave_type: '',
    start_date: '',
    start_time: '',
    end_date: '',
    end_time: '',
    is_half_day: false,
    half_day_period: 'Morning',
    reason: ''
  });
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);

  const calcDays = () => {
    if (form.is_half_day) return 0.5;
    if (!form.start_date || !form.end_date) return 0;
    return Math.max(1, differenceInBusinessDays(parseISO(form.end_date), parseISO(form.start_date)) + 1);
  };

  const handleHalfDayToggle = (checked) => {
    setForm(p => ({
      ...p,
      is_half_day: checked,
      end_date: checked ? p.start_date : p.end_date,
      start_time: checked ? '11:00' : p.start_time,
      end_time: checked ? '15:00' : p.end_time,
    }));
  };

  const handleStartDateChange = (val) => {
    setForm(p => ({
      ...p,
      start_date: val,
      end_date: p.is_half_day ? val : p.end_date
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    let doc_url = '';
    if (file) {
      const result = await db.upload({ file, bucket: 'contract_pdfs', path: 'leave-documents' });
      doc_url = result.file_url;
    }
    await db.leaveRequests.create({
      staff_email: user.email,
      staff_name: user.full_name,
      leave_type: form.leave_type,
      start_date: form.start_date,
      start_time: form.start_time || undefined,
      end_date: form.end_date,
      end_time: form.end_time || undefined,
      is_half_day: form.is_half_day,
      half_day_period: form.is_half_day ? form.half_day_period : undefined,
      days_requested: calcDays(),
      reason: form.reason,
      status: 'pending',
      supporting_document_url: doc_url
    });
    toast.success('Leave request submitted!');
    setForm({ leave_type: '', start_date: '', start_time: '', end_date: '', end_time: '', is_half_day: false, half_day_period: 'Morning', reason: '' });
    setFile(null);
    setLoading(false);
    onSuccess?.();
  };

  const days = calcDays();

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Leave Type *</Label>
        <Select value={form.leave_type} onValueChange={v => setForm(p => ({ ...p, leave_type: v }))}>
          <SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger>
          <SelectContent>
            {LEAVE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Half day toggle */}
      <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
        <input
          type="checkbox"
          checked={form.is_half_day}
          onChange={e => handleHalfDayToggle(e.target.checked)}
          className="w-4 h-4 accent-teal-600"
        />
        <span className="font-medium text-slate-700">Half day</span>
      </label>

      {form.is_half_day && (
        <p className="text-sm text-slate-500">Half day: 11:00 – 15:00</p>
      )}

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>{form.is_half_day ? 'Date *' : 'Start Date *'}</Label>
          <Input type="date" value={form.start_date} onChange={e => handleStartDateChange(e.target.value)} required />
        </div>
        {!form.is_half_day && (
          <div>
            <Label>End Date *</Label>
            <Input type="date" value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} required min={form.start_date} />
          </div>
        )}
      </div>

      {/* Times (shown for full-day requests too) */}
      {!form.is_half_day && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Start Time <span className="text-slate-400">(optional)</span></Label>
            <Input type="time" value={form.start_time} onChange={e => setForm(p => ({ ...p, start_time: e.target.value }))} />
          </div>
          <div>
            <Label>End Time <span className="text-slate-400">(optional)</span></Label>
            <Input type="time" value={form.end_time} onChange={e => setForm(p => ({ ...p, end_time: e.target.value }))} />
          </div>
        </div>
      )}

      {days > 0 && (
        <p className="text-sm text-teal-600 font-medium">
          {form.is_half_day ? '½ day leave' : `Working days: ${days}`}
        </p>
      )}

      <div>
        <Label>Reason *</Label>
        <Textarea value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} placeholder="Briefly describe your reason..." required />
      </div>

      <div>
        <Label>Supporting Document <span className="text-slate-400">(optional — e.g. sick note)</span></Label>
        <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setFile(e.target.files[0])} />
      </div>

      <Button
        type="submit"
        disabled={loading || !form.leave_type || !form.start_date || (!form.is_half_day && !form.end_date) || !form.reason}
        className="w-full bg-teal-600 hover:bg-teal-700"
      >
        {loading ? 'Submitting...' : 'Submit Leave Request'}
      </Button>
    </form>
  );
}