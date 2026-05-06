import React, { useState, useEffect } from 'react';
import { db } from '@/supabase/client';
import { auth } from '@/supabase/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { CheckCircle, XCircle, Pencil, Plus } from 'lucide-react';

const STATUS_BADGE = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700'
};

export default function LeaveAdmin() {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveBalances, setLeaveBalances] = useState([]);
  const [editBalance, setEditBalance] = useState(null);
  const [balanceForm, setBalanceForm] = useState({});
  const [noteTarget, setNoteTarget] = useState(null);
  const [adminNote, setAdminNote] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [lr, lb] = await Promise.all([
      db.leaveRequests.list('-created_date', 50),
      db.leaveBalances.list('-updated_date', 50)
    ]);
    setLeaveRequests(lr);
    setLeaveBalances(lb);
  };

  const updateStatus = async (id, status) => {
    await db.leaveRequests.update(id, { status, admin_notes: adminNote });
    toast.success(`Leave request ${status}`);
    setNoteTarget(null);
    setAdminNote('');
    loadData();
  };

  const saveBalance = async () => {
    if (editBalance.id) {
      await db.leaveBalances.update(editBalance.id, balanceForm);
    } else {
      await db.leaveBalances.create({ ...balanceForm, staff_email: editBalance.staff_email, staff_name: editBalance.staff_name, leave_year: new Date().getFullYear() });
    }
    toast.success('Balance updated');
    setEditBalance(null);
    loadData();
  };

  const formatDateRange = (lr) => {
    if (lr.is_half_day) return `${format(parseISO(lr.start_date), 'dd MMM yyyy')} · ${lr.half_day_period || ''} half day`;
    const start = `${format(parseISO(lr.start_date), 'dd MMM')}${lr.start_time ? ` ${lr.start_time}` : ''}`;
    const end = `${format(parseISO(lr.end_date), 'dd MMM yyyy')}${lr.end_time ? ` ${lr.end_time}` : ''}`;
    return `${start} – ${end} · ${lr.days_requested} day${lr.days_requested !== 1 ? 's' : ''}`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-base">Leave Requests</CardTitle></CardHeader>
        <CardContent>
          {leaveRequests.length === 0 ? <p className="text-sm text-slate-400">No leave requests.</p> : (
            <div className="space-y-4">
              {leaveRequests.map(lr => (
                <div key={lr.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                    <div>
                      <p className="font-semibold text-sm">{lr.staff_name} <span className="text-slate-400 font-normal">— {lr.leave_type}</span></p>
                      <p className="text-xs text-slate-400">{formatDateRange(lr)}</p>
                      <p className="text-xs text-slate-500 mt-1">{lr.reason}</p>
                      {lr.supporting_document_url && <a href={lr.supporting_document_url} target="_blank" rel="noreferrer" className="text-xs text-teal-600 underline">View document</a>}
                    </div>
                    <Badge className={`text-xs ${STATUS_BADGE[lr.status]}`}>{lr.status}</Badge>
                  </div>
                  {lr.admin_notes && <p className="text-xs text-blue-600 mt-1 italic">Note: {lr.admin_notes}</p>}
                  {lr.status === 'pending' && (
                    noteTarget === lr.id ? (
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Input placeholder="Admin note (optional)" value={adminNote} onChange={e => setAdminNote(e.target.value)} className="text-xs flex-1 min-w-[150px]" />
                        <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => updateStatus(lr.id, 'approved')}>Approve</Button>
                        <Button size="sm" variant="destructive" onClick={() => updateStatus(lr.id, 'rejected')}>Reject</Button>
                        <Button size="sm" variant="ghost" onClick={() => setNoteTarget(null)}>Cancel</Button>
                      </div>
                    ) : (
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" variant="outline" className="gap-1 text-green-600 border-green-200 hover:bg-green-50" onClick={() => { setNoteTarget(lr.id); setAdminNote(''); }}>
                          <CheckCircle className="w-3 h-3" /> Approve / Reject
                        </Button>
                      </div>
                    )
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Staff Leave Balances</CardTitle>
            <Button size="sm" className="bg-teal-600 hover:bg-teal-700 gap-1" onClick={() => { setEditBalance({ staff_email: '', staff_name: '' }); setBalanceForm({ annual_leave_total: 15, annual_leave_used: 0, sick_leave_total: 30, sick_leave_used: 0, family_leave_total: 3, family_leave_used: 0 }); }}>
              <Plus className="w-3 h-3" /> Add
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
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div><Label>Staff Name</Label><Input value={editBalance.staff_name} onChange={e => setEditBalance(p => ({ ...p, staff_name: e.target.value }))} /></div>
              <div><Label>Staff Email</Label><Input value={editBalance.staff_email} onChange={e => setEditBalance(p => ({ ...p, staff_email: e.target.value }))} /></div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            {[['Annual Total', 'annual_leave_total'], ['Annual Used', 'annual_leave_used'], ['Sick Total', 'sick_leave_total'], ['Sick Used', 'sick_leave_used'], ['Family Total', 'family_leave_total'], ['Family Used', 'family_leave_used']].map(([label, key]) => (
              <div key={key}><Label>{label}</Label><Input type="number" min="0" value={balanceForm[key] ?? ''} onChange={e => setBalanceForm(p => ({ ...p, [key]: parseFloat(e.target.value) || 0 }))} /></div>
            ))}
          </div>
          <div className="mt-4"><Label>Notes</Label><Textarea value={balanceForm.notes || ''} onChange={e => setBalanceForm(p => ({ ...p, notes: e.target.value }))} /></div>
          <Button onClick={saveBalance} className="w-full mt-4 bg-teal-600 hover:bg-teal-700">Save Balance</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}