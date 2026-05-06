import React, { useState, useEffect } from 'react';
import { db } from '@/supabase/client';
import { auth } from '@/supabase/auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { CheckCircle, XCircle, Pencil, Trash2, Plus, Users, CalendarDays, ShoppingCart, FileText, Megaphone, Calendar } from 'lucide-react';

const STATUS_BADGE = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  ordered: 'bg-blue-100 text-blue-700',
  received: 'bg-teal-100 text-teal-700'
};

// ─── Reusable status action row ─────────────────────────────────────────────
function StatusRow({ label, currentStatus, onApprove, onReject, extra }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge className={`text-xs ${STATUS_BADGE[currentStatus]}`}>{currentStatus}</Badge>
      {currentStatus === 'pending' && (
        <>
          <Button size="sm" variant="outline" className="gap-1 text-green-600 border-green-200 hover:bg-green-50" onClick={onApprove}><CheckCircle className="w-3 h-3" />Approve</Button>
          <Button size="sm" variant="outline" className="gap-1 text-red-600 border-red-200 hover:bg-red-50" onClick={onReject}><XCircle className="w-3 h-3" />Reject</Button>
        </>
      )}
      {extra}
    </div>
  );
}

// ─── Leave Management ────────────────────────────────────────────────────────
function LeaveAdmin({ leaveRequests, leaveBalances, onRefresh }) {
  const [editBalance, setEditBalance] = useState(null);
  const [balanceForm, setBalanceForm] = useState({});
  const [adminNote, setAdminNote] = useState('');
  const [noteTarget, setNoteTarget] = useState(null);

  const updateStatus = async (id, status) => {
    await db.leaveRequests.update(id, { status, admin_notes: adminNote });
    toast.success(`Leave request ${status}`);
    setNoteTarget(null);
    setAdminNote('');
    onRefresh();
  };

  const saveBalance = async () => {
    if (editBalance.id) {
      await db.leaveBalances.update(editBalance.id, balanceForm);
    } else {
      await db.leaveBalances.create({ ...balanceForm, staff_email: editBalance.staff_email, staff_name: editBalance.staff_name, leave_year: new Date().getFullYear() });
    }
    toast.success('Leave balance updated');
    setEditBalance(null);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Leave Requests */}
      <Card>
        <CardHeader><CardTitle className="text-base">Leave Requests</CardTitle></CardHeader>
        <CardContent>
          {leaveRequests.length === 0 ? <p className="text-sm text-slate-400">No leave requests.</p> : (
            <div className="space-y-4">
              {leaveRequests.map(lr => (
                <div key={lr.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="font-semibold text-sm">{lr.staff_name} <span className="text-slate-400 font-normal">— {lr.leave_type}</span></p>
                      <p className="text-xs text-slate-400">
                        {lr.is_half_day
                          ? `${format(parseISO(lr.start_date), 'dd MMM yyyy')} · ${lr.half_day_period} half day`
                          : `${format(parseISO(lr.start_date), 'dd MMM')}${lr.start_time ? ` ${lr.start_time}` : ''} – ${format(parseISO(lr.end_date), 'dd MMM yyyy')}${lr.end_time ? ` ${lr.end_time}` : ''} · ${lr.days_requested} days`
                        }
                      </p>
                      <p className="text-xs text-slate-500 mt-1">{lr.reason}</p>
                      {lr.supporting_document_url && <a href={lr.supporting_document_url} target="_blank" rel="noreferrer" className="text-xs text-teal-600 underline">View document</a>}
                    </div>
                    <StatusRow
                      currentStatus={lr.status}
                      onApprove={() => updateStatus(lr.id, 'approved')}
                      onReject={() => updateStatus(lr.id, 'rejected')}
                    />
                  </div>
                  {noteTarget === lr.id ? (
                    <div className="flex gap-2 mt-2">
                      <Input placeholder="Admin note (optional)" value={adminNote} onChange={e => setAdminNote(e.target.value)} className="text-xs" />
                      <Button size="sm" onClick={() => updateStatus(lr.id, 'approved')} className="bg-green-600 hover:bg-green-700 shrink-0">Approve</Button>
                      <Button size="sm" variant="destructive" onClick={() => updateStatus(lr.id, 'rejected')} className="shrink-0">Reject</Button>
                    </div>
                  ) : (
                    lr.status === 'pending' && (
                      <Button variant="ghost" size="sm" className="text-xs text-slate-400 mt-1" onClick={() => setNoteTarget(lr.id)}>+ Add note before deciding</Button>
                    )
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Leave Balances */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Staff Leave Balances</CardTitle>
            <Button size="sm" className="bg-teal-600 hover:bg-teal-700 gap-1" onClick={() => { setEditBalance({ staff_email: '', staff_name: '' }); setBalanceForm({ annual_leave_total: 15, annual_leave_used: 0, sick_leave_total: 30, sick_leave_used: 0, family_leave_total: 3, family_leave_used: 0 }); }}>
              <Plus className="w-3 h-3" /> Add Balance
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {leaveBalances.length === 0 ? <p className="text-sm text-slate-400">No balances set yet.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs text-slate-400 border-b">
                  <th className="pb-2 pr-4">Staff Member</th>
                  <th className="pb-2 pr-4">Annual</th>
                  <th className="pb-2 pr-4">Sick</th>
                  <th className="pb-2 pr-4">Family</th>
                  <th className="pb-2"></th>
                </tr></thead>
                <tbody>
                  {leaveBalances.map(b => (
                    <tr key={b.id} className="border-b border-slate-50">
                      <td className="py-2 pr-4 font-medium">{b.staff_name}</td>
                      <td className="py-2 pr-4 text-slate-500">{(b.annual_leave_total || 15) - (b.annual_leave_used || 0)}/{b.annual_leave_total || 15}</td>
                      <td className="py-2 pr-4 text-slate-500">{(b.sick_leave_total || 30) - (b.sick_leave_used || 0)}/{b.sick_leave_total || 30}</td>
                      <td className="py-2 pr-4 text-slate-500">{(b.family_leave_total || 3) - (b.family_leave_used || 0)}/{b.family_leave_total || 3}</td>
                      <td className="py-2">
                        <Button variant="ghost" size="icon" onClick={() => { setEditBalance(b); setBalanceForm({ annual_leave_total: b.annual_leave_total, annual_leave_used: b.annual_leave_used, sick_leave_total: b.sick_leave_total, sick_leave_used: b.sick_leave_used, family_leave_total: b.family_leave_total, family_leave_used: b.family_leave_used, notes: b.notes }); }}>
                          <Pencil className="w-3 h-3" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editBalance} onOpenChange={() => setEditBalance(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editBalance?.id ? 'Edit' : 'Add'} Leave Balance</DialogTitle></DialogHeader>
          {editBalance && !editBalance.id && (
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Staff Name</Label><Input value={editBalance.staff_name} onChange={e => setEditBalance(p => ({ ...p, staff_name: e.target.value }))} /></div>
              <div><Label>Staff Email</Label><Input value={editBalance.staff_email} onChange={e => setEditBalance(p => ({ ...p, staff_email: e.target.value }))} /></div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            {[['Annual Total', 'annual_leave_total'], ['Annual Used', 'annual_leave_used'], ['Sick Total', 'sick_leave_total'], ['Sick Used', 'sick_leave_used'], ['Family Total', 'family_leave_total'], ['Family Used', 'family_leave_used']].map(([label, key]) => (
              <div key={key}><Label>{label}</Label><Input type="number" min="0" value={balanceForm[key] ?? ''} onChange={e => setBalanceForm(p => ({ ...p, [key]: parseFloat(e.target.value) || 0 }))} /></div>
            ))}
          </div>
          <div><Label>Notes</Label><Textarea value={balanceForm.notes || ''} onChange={e => setBalanceForm(p => ({ ...p, notes: e.target.value }))} /></div>
          <Button onClick={saveBalance} className="w-full bg-teal-600 hover:bg-teal-700">Save Balance</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Purchase Requests Admin ─────────────────────────────────────────────────
function PurchaseAdmin({ requests, onRefresh }) {
  const [editId, setEditId] = useState(null);
  const [note, setNote] = useState('');
  const [newStatus, setNewStatus] = useState('');

  const update = async (id, status, admin_notes) => {
    await db.purchaseRequests.update(id, { status, admin_notes });
    toast.success('Updated');
    setEditId(null);
    setNote('');
    onRefresh();
  };

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Purchase Requests</CardTitle></CardHeader>
      <CardContent>
        {requests.length === 0 ? <p className="text-sm text-slate-400">No purchase requests.</p> : (
          <div className="space-y-4">
            {requests.map(pr => (
              <div key={pr.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{pr.staff_name} — <span className="font-normal">{pr.item_description}</span></p>
                    <p className="text-xs text-slate-400">Qty: {pr.quantity} · R{parseFloat(pr.estimated_cost || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}{pr.supplier ? ` · ${pr.supplier}` : ''}</p>
                    <p className="text-xs text-slate-500 mt-1">{pr.reason}</p>
                    {pr.admin_notes && <p className="text-xs text-blue-600 mt-1 italic">Note: {pr.admin_notes}</p>}
                  </div>
                  <Badge className={`text-xs ${STATUS_BADGE[pr.status]}`}>{pr.status}</Badge>
                </div>
                {editId === pr.id ? (
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Input placeholder="Admin note" value={note} onChange={e => setNote(e.target.value)} className="text-xs flex-1" />
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger className="w-32 text-xs"><SelectValue placeholder="Status..." /></SelectTrigger>
                      <SelectContent>
                        {['approved', 'rejected', 'ordered', 'received'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button size="sm" disabled={!newStatus} onClick={() => update(pr.id, newStatus, note)}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditId(null)}>Cancel</Button>
                  </div>
                ) : (
                  <Button variant="ghost" size="sm" className="text-xs text-teal-600 mt-1" onClick={() => { setEditId(pr.id); setNote(pr.admin_notes || ''); setNewStatus(pr.status); }}>
                    <Pencil className="w-3 h-3 mr-1" /> Update Status
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Calendar Admin ──────────────────────────────────────────────────────────
function CalendarAdmin({ events, onRefresh }) {
  const [form, setForm] = useState({ title: '', description: '', start_date: '', end_date: '', event_type: 'School Event', is_staff_only: false });
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const save = async () => {
    if (editId) {
      await db.events.update(editId, form);
    } else {
      await db.events.create(form);
    }
    toast.success('Event saved');
    setShowForm(false);
    setEditId(null);
    setForm({ title: '', description: '', start_date: '', end_date: '', event_type: 'School Event', is_staff_only: false });
    onRefresh();
  };

  const del = async (id) => {
    await db.events.delete(id);
    toast.success('Event deleted');
    onRefresh();
  };

  const startEdit = (e) => {
    setEditId(e.id);
    setForm({ title: e.title, description: e.description || '', start_date: e.start_date, end_date: e.end_date || '', event_type: e.event_type, is_staff_only: e.is_staff_only || false });
    setShowForm(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" className="bg-teal-600 hover:bg-teal-700 gap-1" onClick={() => { setEditId(null); setForm({ title: '', description: '', start_date: '', end_date: '', event_type: 'School Event', is_staff_only: false }); setShowForm(true); }}>
          <Plus className="w-3 h-3" /> Add Event
        </Button>
      </div>
      <Card>
        <CardContent className="pt-4">
          {events.length === 0 ? <p className="text-sm text-slate-400">No events.</p> : (
            <div className="space-y-2">
              {events.sort((a, b) => parseISO(a.start_date) - parseISO(b.start_date)).map(e => (
                <div key={e.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div>
                    <span className="font-medium text-sm">{e.title}</span>
                    <span className="text-xs text-slate-400 ml-2">{format(parseISO(e.start_date), 'dd MMM yyyy')}{e.end_date ? ` – ${format(parseISO(e.end_date), 'dd MMM yyyy')}` : ''}</span>
                    <Badge className="ml-2 text-[10px] bg-slate-100 text-slate-600">{e.event_type}</Badge>
                    {e.is_staff_only && <Badge className="ml-1 text-[10px] bg-blue-100 text-blue-600">Staff only</Badge>}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => startEdit(e)}><Pencil className="w-3 h-3" /></Button>
                    <Button variant="ghost" size="icon" className="text-red-500" onClick={() => del(e.id)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? 'Edit' : 'Add'} Event</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Start Date *</Label><Input type="date" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} /></div>
              <div><Label>End Date</Label><Input type="date" value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} /></div>
            </div>
            <div>
              <Label>Type</Label>
              <Select value={form.event_type} onValueChange={v => setForm(p => ({ ...p, event_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Public Holiday', 'School Holiday', 'Staff Meeting', 'School Event', 'Important Date', 'Training', 'Other'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.is_staff_only} onChange={e => setForm(p => ({ ...p, is_staff_only: e.target.checked }))} />
              Staff only (not shown to parents)
            </label>
            <Button className="w-full bg-teal-600 hover:bg-teal-700" onClick={save} disabled={!form.title || !form.start_date}>Save Event</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Pay Slips Admin ─────────────────────────────────────────────────────────
function PaySlipsAdmin({ payslips, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ staff_email: '', staff_name: '', pay_period: '', pay_date: '', gross_salary: '', net_salary: '', notes: '' });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const save = async () => {
    setLoading(true);
    let document_url = '';
    if (file) {
      const result = await db.upload({ file, bucket: 'contract_pdfs', path: 'documents' });
      const file_url = result.file_url;
      document_url = file_url;
    }
    await db.paySlips.create({ ...form, gross_salary: parseFloat(form.gross_salary) || 0, net_salary: parseFloat(form.net_salary) || 0, document_url });
    toast.success('Pay slip uploaded');
    setShowForm(false);
    setForm({ staff_email: '', staff_name: '', pay_period: '', pay_date: '', gross_salary: '', net_salary: '', notes: '' });
    setFile(null);
    setLoading(false);
    onRefresh();
  };

  const del = async (id) => {
    await db.paySlips.delete(id);
    toast.success('Deleted');
    onRefresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" className="bg-teal-600 hover:bg-teal-700 gap-1" onClick={() => setShowForm(true)}>
          <Plus className="w-3 h-3" /> Upload Pay Slip
        </Button>
      </div>
      <Card>
        <CardContent className="pt-4">
          {payslips.length === 0 ? <p className="text-sm text-slate-400">No pay slips uploaded yet.</p> : (
            <div className="space-y-2">
              {payslips.map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div>
                    <p className="font-medium text-sm">{s.staff_name} — {s.pay_period}</p>
                    <p className="text-xs text-slate-400">{s.pay_date ? format(parseISO(s.pay_date), 'dd MMM yyyy') : ''} · Net: R{parseFloat(s.net_salary || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="flex gap-1">
                    {s.document_url && <Button variant="ghost" size="sm" className="text-xs" onClick={() => window.open(s.document_url, '_blank')}>View</Button>}
                    <Button variant="ghost" size="icon" className="text-red-500" onClick={() => del(s.id)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Upload Pay Slip</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Staff Name *</Label><Input value={form.staff_name} onChange={e => setForm(p => ({ ...p, staff_name: e.target.value }))} /></div>
              <div><Label>Staff Email *</Label><Input value={form.staff_email} onChange={e => setForm(p => ({ ...p, staff_email: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Pay Period *</Label><Input placeholder="e.g. January 2026" value={form.pay_period} onChange={e => setForm(p => ({ ...p, pay_period: e.target.value }))} /></div>
              <div><Label>Pay Date *</Label><Input type="date" value={form.pay_date} onChange={e => setForm(p => ({ ...p, pay_date: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Gross Salary (R)</Label><Input type="number" value={form.gross_salary} onChange={e => setForm(p => ({ ...p, gross_salary: e.target.value }))} /></div>
              <div><Label>Net Salary (R)</Label><Input type="number" value={form.net_salary} onChange={e => setForm(p => ({ ...p, net_salary: e.target.value }))} /></div>
            </div>
            <div><Label>Pay Slip Document (PDF/image)</Label><Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setFile(e.target.files[0])} /></div>
            <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></div>
            <Button className="w-full bg-teal-600 hover:bg-teal-700" onClick={save} disabled={loading || !form.staff_name || !form.staff_email || !form.pay_period || !form.pay_date}>
              {loading ? 'Uploading...' : 'Save Pay Slip'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Announcements Admin ─────────────────────────────────────────────────────
function AnnouncementsAdmin({ announcements, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ title: '', content: '', priority: 'Normal', is_active: true, expiry_date: '' });

  const save = async () => {
    if (editId) {
      await db.announcements.update(editId, form);
    } else {
      await db.announcements.create(form);
    }
    toast.success('Announcement saved');
    setShowForm(false);
    setEditId(null);
    setForm({ title: '', content: '', priority: 'Normal', is_active: true, expiry_date: '' });
    onRefresh();
  };

  const del = async (id) => {
    await db.announcements.delete(id);
    toast.success('Deleted');
    onRefresh();
  };

  const startEdit = (a) => {
    setEditId(a.id);
    setForm({ title: a.title, content: a.content, priority: a.priority, is_active: a.is_active, expiry_date: a.expiry_date || '' });
    setShowForm(true);
  };

  const PRIORITY_BADGE = { Urgent: 'bg-red-100 text-red-700', High: 'bg-orange-100 text-orange-700', Normal: 'bg-blue-100 text-blue-700', Low: 'bg-slate-100 text-slate-600' };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" className="bg-teal-600 hover:bg-teal-700 gap-1" onClick={() => { setEditId(null); setForm({ title: '', content: '', priority: 'Normal', is_active: true, expiry_date: '' }); setShowForm(true); }}>
          <Plus className="w-3 h-3" /> New Announcement
        </Button>
      </div>
      <Card>
        <CardContent className="pt-4">
          {announcements.length === 0 ? <p className="text-sm text-slate-400">No announcements yet.</p> : (
            <div className="space-y-3">
              {announcements.map(a => (
                <div key={a.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">{a.title}</p>
                        <Badge className={`text-[10px] ${PRIORITY_BADGE[a.priority]}`}>{a.priority}</Badge>
                        {!a.is_active && <Badge className="text-[10px] bg-slate-200 text-slate-500">Inactive</Badge>}
                      </div>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{a.content}</p>
                      {a.expiry_date && <p className="text-xs text-slate-400 mt-0.5">Expires: {format(parseISO(a.expiry_date), 'dd MMM yyyy')}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => startEdit(a)}><Pencil className="w-3 h-3" /></Button>
                      <Button variant="ghost" size="icon" className="text-red-500" onClick={() => del(a.id)}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? 'Edit' : 'New'} Announcement</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} /></div>
            <div><Label>Content *</Label><Textarea rows={4} value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={v => setForm(p => ({ ...p, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{['Low', 'Normal', 'High', 'Urgent'].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Expiry Date <span className="text-slate-400">(optional)</span></Label><Input type="date" value={form.expiry_date} onChange={e => setForm(p => ({ ...p, expiry_date: e.target.value }))} /></div>
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} />
              Active (visible to staff)
            </label>
            <Button className="w-full bg-teal-600 hover:bg-teal-700" onClick={save} disabled={!form.title || !form.content}>Save Announcement</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Main Admin Staff Portal ─────────────────────────────────────────────────
export default function AdminStaffPortal() {
  const [user, setUser] = useState(null);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveBalances, setLeaveBalances] = useState([]);
  const [purchaseRequests, setPurchaseRequests] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    const u = await auth.me();
    setUser(u);
    const [lr, lb, pr, ps, ev, an] = await Promise.all([
      db.leaveRequests.list('-created_date', 50),
      db.leaveBalances.list('-updated_date', 50),
      db.purchaseRequests.list('-created_date', 50),
      db.paySlips.list('-pay_date', 100),
      db.events.list('-start_date', 100),
      db.announcements.list('-created_date', 50)
    ]);
    setLeaveRequests(lr);
    setLeaveBalances(lb);
    setPurchaseRequests(pr);
    setPayslips(ps);
    setEvents(ev);
    setAnnouncements(an);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" /></div>;

  if (user?.role !== 'admin') {
    return <div className="max-w-lg mx-auto mt-20 text-center p-8"><XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" /><h2 className="text-xl font-semibold">Admin only</h2></div>;
  }

  const pendingLeave = leaveRequests.filter(r => r.status === 'pending').length;
  const pendingPurchases = purchaseRequests.filter(r => r.status === 'pending').length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Staff Portal Admin</h1>
        <p className="text-slate-500 text-sm mt-1">Manage leave, purchases, calendar, pay slips and announcements</p>
      </div>

      {(pendingLeave > 0 || pendingPurchases > 0) && (
        <div className="flex flex-wrap gap-3 mb-6">
          {pendingLeave > 0 && <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm px-4 py-2 rounded-lg">{pendingLeave} leave request{pendingLeave !== 1 ? 's' : ''} awaiting approval</div>}
          {pendingPurchases > 0 && <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm px-4 py-2 rounded-lg">{pendingPurchases} purchase request{pendingPurchases !== 1 ? 's' : ''} awaiting approval</div>}
        </div>
      )}

      <Tabs defaultValue="leave">
        <TabsList className="flex flex-wrap gap-1 h-auto mb-6">
          <TabsTrigger value="leave" className="gap-1"><CalendarDays className="w-4 h-4" />Leave {pendingLeave > 0 && <Badge className="ml-1 bg-yellow-200 text-yellow-800 text-[10px] px-1">{pendingLeave}</Badge>}</TabsTrigger>
          <TabsTrigger value="purchases" className="gap-1"><ShoppingCart className="w-4 h-4" />Purchases {pendingPurchases > 0 && <Badge className="ml-1 bg-yellow-200 text-yellow-800 text-[10px] px-1">{pendingPurchases}</Badge>}</TabsTrigger>
          <TabsTrigger value="calendar" className="gap-2"><Calendar className="w-4 h-4" />Calendar</TabsTrigger>
          <TabsTrigger value="payslips" className="gap-2"><FileText className="w-4 h-4" />Pay Slips</TabsTrigger>
          <TabsTrigger value="announcements" className="gap-2"><Megaphone className="w-4 h-4" />Announcements</TabsTrigger>
        </TabsList>

        <TabsContent value="leave"><LeaveAdmin leaveRequests={leaveRequests} leaveBalances={leaveBalances} onRefresh={loadData} /></TabsContent>
        <TabsContent value="purchases"><PurchaseAdmin requests={purchaseRequests} onRefresh={loadData} /></TabsContent>
        <TabsContent value="calendar"><CalendarAdmin events={events} onRefresh={loadData} /></TabsContent>
        <TabsContent value="payslips"><PaySlipsAdmin payslips={payslips} onRefresh={loadData} /></TabsContent>
        <TabsContent value="announcements"><AnnouncementsAdmin announcements={announcements} onRefresh={loadData} /></TabsContent>
      </Tabs>
    </div>
  );
}