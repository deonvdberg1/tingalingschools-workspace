import React, { useState, useRef } from 'react';
import { db } from '@/supabase/client';
import { auth } from '@/supabase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Plus, Trash2, Printer } from 'lucide-react';

const fmt = (n) => `R ${parseFloat(n || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const SCHOOL_INFO = {
  name: 'Ting-A-Ling Schools',
  address1: '74 Krewilkring, Meerensee',
  address2: '18 Elweboog, Meerensee',
  email: 'info@tingalingschools.com',
  reg: '',
};

const DEFAULT_DEDUCTIONS = [
  { description: 'PAYE', amount: '' },
  { description: 'UIF (Employee)', amount: '' },
];

export default function PaySlipBuilder({ staffMember, onSaved, onCancel }) {
  const printRef = useRef(null);

  const [form, setForm] = useState({
    staff_name: staffMember?.full_name || '',
    staff_email: staffMember?.email || '',
    staff_id_number: staffMember?.id_number || '',
    job_title: staffMember?.job_title || '',
    pay_period: '',
    pay_date: '',
    basic_salary: '',
    earnings: [],
    deductions: DEFAULT_DEDUCTIONS.map(d => ({ ...d })),
    leave_days_taken: '',
    leave_days_balance: '',
    notes: '',
  });

  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [errors, setErrors] = useState({});

  // Computed totals
  const basic = parseFloat(form.basic_salary) || 0;
  const totalEarnings = form.earnings.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
  const gross = basic + totalEarnings;
  const totalDeductions = form.deductions.reduce((s, d) => s + (parseFloat(d.amount) || 0), 0);
  const net = gross - totalDeductions;

  const addEarning = () => setForm(p => ({ ...p, earnings: [...p.earnings, { description: '', amount: '' }] }));
  const removeEarning = (i) => setForm(p => ({ ...p, earnings: p.earnings.filter((_, idx) => idx !== i) }));
  const updateEarning = (i, field, val) => setForm(p => { const e = [...p.earnings]; e[i] = { ...e[i], [field]: val }; return { ...p, earnings: e }; });

  const addDeduction = () => setForm(p => ({ ...p, deductions: [...p.deductions, { description: '', amount: '' }] }));
  const removeDeduction = (i) => setForm(p => ({ ...p, deductions: p.deductions.filter((_, idx) => idx !== i) }));
  const updateDeduction = (i, field, val) => setForm(p => { const d = [...p.deductions]; d[i] = { ...d[i], [field]: val }; return { ...p, deductions: d }; });

  const handlePrint = () => {
    if (!printRef.current) {
      setPreview(true);
      setTimeout(() => {
        if (printRef.current) doPrint(printRef.current.innerHTML);
      }, 100);
      return;
    }
    doPrint(printRef.current.innerHTML);
  };

  const doPrint = (content) => {
    const win = window.open('', '_blank', 'width=800,height=900');
    win.document.write(`
      <html><head><title>Pay Slip - ${form.staff_name} - ${form.pay_period}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 24px; color: #1e293b; font-size: 13px; }
        table { width: 100%; border-collapse: collapse; }
        td, th { padding: 6px 10px; }
        .border-b { border-bottom: 1px solid #e2e8f0; }
        .bg-slate-800 { background: #1e293b; color: #fff; }
        .bg-slate-50 { background: #f8fafc; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .text-xs { font-size: 11px; }
        .text-slate-400 { color: #94a3b8; }
        .text-green-700 { color: #15803d; }
        .text-red-600 { color: #dc2626; }
        .text-teal-700 { color: #0f766e; }
        @media print { body { padding: 0; } }
      </style></head>
      <body>${content}</body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 500);
  };


  const handleSave = async () => {
    const newErrors = {};
    if (!form.staff_name) newErrors.staff_name = 'Required';
    if (!form.pay_period) newErrors.pay_period = 'Required';
    if (!form.pay_date) newErrors.pay_date = 'Required';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setSaving(true);
    await db.paySlips.create({
      ...form,
      basic_salary: basic,
      gross_salary: gross,
      total_deductions: totalDeductions,
      net_salary: net,
      leave_days_taken: parseFloat(form.leave_days_taken) || undefined,
      leave_days_balance: parseFloat(form.leave_days_balance) || undefined,
      earnings: form.earnings.map(e => ({ description: e.description, amount: parseFloat(e.amount) || 0 })),
      deductions: form.deductions.map(d => ({ description: d.description, amount: parseFloat(d.amount) || 0 })),
    });
    toast.success('Pay slip saved');
    setSaving(false);
    onSaved && onSaved();
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-base font-semibold text-slate-700">Build Pay Slip — {form.staff_name}</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setPreview(p => !p)} className="gap-1">
            {preview ? 'Edit' : 'Preview'}
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1" disabled={!form.pay_period}>
            <Printer className="w-4 h-4" /> Print / PDF
          </Button>
          <Button size="sm" className="bg-teal-600 hover:bg-teal-700" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Pay Slip'}
          </Button>
          {onCancel && <Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>}
        </div>
      </div>

      {!preview ? (
        /* ---- EDITOR ---- */
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left col */}
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-lg space-y-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pay Period</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Pay Period *</Label>
                  <Input placeholder="e.g. March 2026" value={form.pay_period} onChange={e => { setForm(p => ({ ...p, pay_period: e.target.value })); setErrors(p => ({ ...p, pay_period: '' })); }} className={errors.pay_period ? 'border-red-500' : ''} />
                  {errors.pay_period && <p className="text-xs text-red-500 mt-1">Pay period is required</p>}
                </div>
                <div>
                  <Label className="text-xs">Pay Date *</Label>
                  <Input type="date" value={form.pay_date} onChange={e => { setForm(p => ({ ...p, pay_date: e.target.value })); setErrors(p => ({ ...p, pay_date: '' })); }} className={errors.pay_date ? 'border-red-500' : ''} />
                  {errors.pay_date && <p className="text-xs text-red-500 mt-1">Pay date is required</p>}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg space-y-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Staff Details</p>
              <div>
                <Label className="text-xs">Full Name *</Label>
                <Input value={form.staff_name} onChange={e => { setForm(p => ({ ...p, staff_name: e.target.value })); setErrors(p => ({ ...p, staff_name: '' })); }} className={errors.staff_name ? 'border-red-500' : ''} />
                {errors.staff_name && <p className="text-xs text-red-500 mt-1">Staff name is required</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">ID Number</Label><Input value={form.staff_id_number} onChange={e => setForm(p => ({ ...p, staff_id_number: e.target.value }))} /></div>
                <div><Label className="text-xs">Job Title</Label><Input value={form.job_title} onChange={e => setForm(p => ({ ...p, job_title: e.target.value }))} /></div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg space-y-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Leave</p>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Days Taken</Label><Input type="number" min="0" value={form.leave_days_taken} onChange={e => setForm(p => ({ ...p, leave_days_taken: e.target.value }))} /></div>
                <div><Label className="text-xs">Balance Remaining</Label><Input type="number" min="0" value={form.leave_days_balance} onChange={e => setForm(p => ({ ...p, leave_days_balance: e.target.value }))} /></div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg space-y-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Notes</p>
              <Textarea rows={2} placeholder="Any additional notes..." value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
            </div>
          </div>

          {/* Right col — earnings & deductions */}
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Earnings</p>
                <Button variant="ghost" size="sm" className="text-xs gap-1 h-6 text-teal-600" onClick={addEarning}><Plus className="w-3 h-3" /> Add</Button>
              </div>
              <div className="space-y-2">
                <div className="flex gap-2 items-center">
                  <div className="flex-1"><Label className="text-xs">Basic Salary</Label><Input type="number" min="0" placeholder="0.00" value={form.basic_salary} onChange={e => setForm(p => ({ ...p, basic_salary: e.target.value }))} /></div>
                  <div className="w-28 mt-5 text-sm font-medium text-slate-600 text-right">{fmt(form.basic_salary)}</div>
                </div>
                {form.earnings.map((e, i) => (
                  <div key={i} className="flex gap-2 items-end">
                    <div className="flex-1"><Input placeholder="Description (e.g. Bonus)" value={e.description} onChange={ev => updateEarning(i, 'description', ev.target.value)} className="text-xs" /></div>
                    <div className="w-28"><Input type="number" min="0" placeholder="0.00" value={e.amount} onChange={ev => updateEarning(i, 'amount', ev.target.value)} className="text-xs" /></div>
                    <Button variant="ghost" size="icon" className="text-red-400 h-8 w-8" onClick={() => removeEarning(i)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                ))}
                <div className="flex justify-between pt-1 border-t border-slate-200 text-sm font-semibold text-slate-700">
                  <span>Gross Salary</span>
                  <span className="text-green-700">{fmt(gross)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Deductions</p>
                <Button variant="ghost" size="sm" className="text-xs gap-1 h-6 text-red-500" onClick={addDeduction}><Plus className="w-3 h-3" /> Add</Button>
              </div>
              <div className="space-y-2">
                {form.deductions.map((d, i) => (
                  <div key={i} className="flex gap-2 items-end">
                    <div className="flex-1"><Input placeholder="Description (e.g. PAYE)" value={d.description} onChange={e => updateDeduction(i, 'description', e.target.value)} className="text-xs" /></div>
                    <div className="w-28"><Input type="number" min="0" placeholder="0.00" value={d.amount} onChange={e => updateDeduction(i, 'amount', e.target.value)} className="text-xs" /></div>
                    <Button variant="ghost" size="icon" className="text-red-400 h-8 w-8" onClick={() => removeDeduction(i)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                ))}
                <div className="flex justify-between pt-1 border-t border-slate-200 text-sm font-semibold text-slate-700">
                  <span>Total Deductions</span>
                  <span className="text-red-600">{fmt(totalDeductions)}</span>
                </div>
              </div>
            </div>

            {/* Net Pay summary */}
            <div className="p-4 bg-teal-900 text-white rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-teal-300 uppercase tracking-wider">Net Pay</p>
                  <p className="text-3xl font-bold mt-1">{fmt(net)}</p>
                </div>
                <div className="text-right text-xs text-teal-300 space-y-1">
                  <p>Gross: {fmt(gross)}</p>
                  <p>Deductions: −{fmt(totalDeductions)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ---- PRINT PREVIEW ---- */
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div ref={printRef}>
            <PaySlipPreview
              form={form}
              gross={gross}
              totalDeductions={totalDeductions}
              net={net}
              schoolInfo={SCHOOL_INFO}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function PaySlipPreview({ form, gross, totalDeductions, net, schoolInfo }) {
  const fmt2 = (n) => `R ${parseFloat(n || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', color: '#1e293b', fontSize: 13 }}>
      {/* Header */}
      <div style={{ background: '#1e293b', color: '#fff', padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 4 }}>{schoolInfo.name}</div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>{schoolInfo.address1}</div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>{schoolInfo.email}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 22, fontWeight: 'bold', color: '#99f6e4', letterSpacing: 1 }}>PAY SLIP</div>
          <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>{form.pay_period}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>Pay Date: {form.pay_date}</div>
        </div>
      </div>

      {/* Employee Details */}
      <div style={{ background: '#f8fafc', padding: '16px 32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, borderBottom: '1px solid #e2e8f0' }}>
        {[
          ['Employee', form.staff_name],
          ['Job Title', form.job_title],
          ['ID Number', form.staff_id_number],
          ['Email', form.staff_email],
        ].map(([label, value]) => value ? (
          <div key={label} style={{ display: 'flex', gap: 8 }}>
            <span style={{ color: '#64748b', minWidth: 80 }}>{label}:</span>
            <span style={{ fontWeight: 600 }}>{value}</span>
          </div>
        ) : null)}
      </div>

      {/* Earnings & Deductions side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
        {/* Earnings */}
        <div style={{ padding: '16px 24px 16px 32px', borderRight: '1px solid #e2e8f0' }}>
          <div style={{ fontWeight: 'bold', fontSize: 12, color: '#0f766e', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Earnings</div>
          <table style={{ width: '100%' }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '5px 0', color: '#475569' }}>Basic Salary</td>
                <td style={{ padding: '5px 0', textAlign: 'right', fontWeight: 600 }}>{fmt2(form.basic_salary)}</td>
              </tr>
              {(form.earnings || []).filter(e => parseFloat(e.amount)).map((e, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '5px 0', color: '#475569' }}>{e.description}</td>
                  <td style={{ padding: '5px 0', textAlign: 'right', fontWeight: 600 }}>{fmt2(e.amount)}</td>
                </tr>
              ))}
              <tr style={{ background: '#f0fdf4' }}>
                <td style={{ padding: '8px 4px', fontWeight: 'bold' }}>Gross Salary</td>
                <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 'bold', color: '#15803d' }}>{fmt2(gross)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Deductions */}
        <div style={{ padding: '16px 32px 16px 24px' }}>
          <div style={{ fontWeight: 'bold', fontSize: 12, color: '#dc2626', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Deductions</div>
          <table style={{ width: '100%' }}>
            <tbody>
              {(form.deductions || []).map((d, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '5px 0', color: '#475569' }}>{d.description}</td>
                  <td style={{ padding: '5px 0', textAlign: 'right', fontWeight: 600 }}>{fmt2(d.amount)}</td>
                </tr>
              ))}
              <tr style={{ background: '#fff1f2' }}>
                <td style={{ padding: '8px 4px', fontWeight: 'bold' }}>Total Deductions</td>
                <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 'bold', color: '#dc2626' }}>{fmt2(totalDeductions)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Leave info */}
      {(form.leave_days_taken || form.leave_days_balance) && (
        <div style={{ padding: '10px 32px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', gap: 32, fontSize: 12 }}>
          {form.leave_days_taken && <span><span style={{ color: '#64748b' }}>Leave Taken: </span><strong>{form.leave_days_taken} days</strong></span>}
          {form.leave_days_balance && <span><span style={{ color: '#64748b' }}>Leave Balance: </span><strong>{form.leave_days_balance} days</strong></span>}
        </div>
      )}

      {/* Net Pay */}
      <div style={{ background: '#0f766e', color: '#fff', padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 11, color: '#99f6e4', textTransform: 'uppercase', letterSpacing: 1 }}>NET PAY</div>
          <div style={{ fontSize: 28, fontWeight: 'bold', marginTop: 4 }}>{fmt2(net)}</div>
        </div>
        <div style={{ textAlign: 'right', fontSize: 12, color: '#99f6e4' }}>
          <div>Gross: {fmt2(gross)}</div>
          <div>Deductions: −{fmt2(totalDeductions)}</div>
        </div>
      </div>

      {/* Notes */}
      {form.notes && (
        <div style={{ padding: '12px 32px', borderTop: '1px solid #e2e8f0', fontSize: 11, color: '#64748b' }}>
          <span style={{ fontWeight: 600 }}>Notes: </span>{form.notes}
        </div>
      )}

      {/* Footer */}
      <div style={{ padding: '10px 32px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', fontSize: 10, color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
        <span>{schoolInfo.name} · {schoolInfo.email}</span>
        <span>This is a computer generated pay slip</span>
      </div>
    </div>
  );
}