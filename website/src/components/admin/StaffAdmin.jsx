import React, { useState, useEffect } from 'react';
import { db } from '@/supabase/client';
import { supabase } from '@/supabase/client';
import { auth } from '@/supabase/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { Plus, Pencil, Trash2, ChevronRight, User, CalendarDays, Banknote, Eye } from 'lucide-react';
import PaySlipBuilder, { PaySlipPreview } from './PaySlipBuilder';

const SCHOOL_INFO = { name: 'Ting-A-Ling Schools', address1: '74 Krewilkring, Meerensee', email: 'info@tingaling.co.za' };

const BLANK_STAFF = { full_name: '', email: '', phone: '', id_number: '', job_title: '', school: 'PrePrimary', start_date: '', emergency_contact_name: '', emergency_contact_phone: '', notes: '', is_active: true };
const BLANK_BALANCE = { annual_leave_total: 15, annual_leave_used: 0, sick_leave_total: 30, sick_leave_used: 0, family_leave_total: 3, family_leave_used: 0, notes: '' };

const STATUS_BADGE = { pending: 'bg-yellow-100 text-yellow-700', approved: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700' };

export default function StaffAdmin() {
  const [staff, setStaff] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveBalances, setLeaveBalances] = useState([]);
  const [payslips, setPayslips] = useState([]);

  const [editStaff, setEditStaff] = useState(null); // null = closed, {} = new, {...} = editing
  const [staffForm, setStaffForm] = useState(BLANK_STAFF);

  const [selectedMember, setSelectedMember] = useState(null);
  const [showMemberDetail, setShowMemberDetail] = useState(false);

  // Leave balance edit
  const [editBalance, setEditBalance] = useState(null);
  const [balanceForm, setBalanceForm] = useState(BLANK_BALANCE);

  // Payslip
  const [showPayslipBuilder, setShowPayslipBuilder] = useState(false);
  const [viewSlip, setViewSlip] = useState(null);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    const [s, lr, lb, ps] = await Promise.all([
      db.staff.list('-created_date', 100),
      db.leaveRequests.list('-created_date', 200),
      db.leaveBalances.list('-updated_date', 100),
      db.paySlips.list('-pay_date', 200)
    ]);
    setStaff(s);
    setLeaveRequests(lr);
    setLeaveBalances(lb);
    setPayslips(ps);
  };

  // ---- Staff CRUD ----
  const saveStaff = async () => {
    if (editStaff?.id) {
      await db.staff.update(editStaff.id, staffForm);
      toast.success('Staff member updated');
    } else {
      await db.staff.create(staffForm);
      toast.success('Staff member added');
    }
    setEditStaff(null);
    loadAll();
  };

  const deleteStaff = async (id) => {
    await db.staff.delete(id);
    toast.success('Removed');
    setSelectedMember(null);
    setShowMemberDetail(false);
    loadAll();
  };

  const createLogin = async (email, fullName, role) => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const { data: { session } } = await import('@/supabase/client').then(m => 
        m.supabase.auth.getSession()
      );
      const token = session?.access_token;
      
      const res = await fetch(supabaseUrl + '/functions/v1/create-auth-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({
          email,
          password: 'Tingaling2026!',
          full_name: fullName,
          role
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Login created! Password: Tingaling2026!');
      } else {
        toast.error(data.error || 'Failed to create login');
      }
    } catch (err) {
      toast.error('Error: ' + err.message);
    }
  };

  const openMember = (member) => {
    setSelectedMember(member);
    setShowMemberDetail(true);
  };

  // ---- Leave Balance ----
  const memberBalance = (email) => leaveBalances.find(b => b.staff_email === email);
  const memberLeave = (email) => leaveRequests.filter(lr => lr.staff_email === email);
  const memberPayslips = (email) => payslips.filter(p => p.staff_email === email).sort((a, b) => b.pay_date?.localeCompare(a.pay_date));

  const saveBalance = async () => {
    const existing = memberBalance(selectedMember.email);
    if (existing) {
      await db.leaveBalances.update(existing.id, balanceForm);
    } else {
      await db.leaveBalances.create({ ...balanceForm, staff_email: selectedMember.email, staff_name: selectedMember.full_name, leave_year: new Date().getFullYear() });
    }
    toast.success('Leave balance saved');
    setEditBalance(null);
    loadAll();
  };

  const deletePayslip = async (id) => {
    await db.paySlips.delete(id);
    toast.success('Deleted');
    loadAll();
  };

  const updateLeaveStatus = async (id, status) => {
    await db.leaveRequests.update(id, { status });
    toast.success(`Leave ${status}`);
    loadAll();
  };

  return (
    <div className="space-y-4">
      {/* Staff List */}
      <div className="flex justify-end">
        <Button size="sm" className="bg-teal-600 hover:bg-teal-700 gap-1" onClick={() => { setEditStaff({}); setStaffForm(BLANK_STAFF); }}>
          <Plus className="w-3 h-3" /> Add Staff Member
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {staff.map(member => {
          const balance = memberBalance(member.email);
          const annualRemaining = (balance?.annual_leave_total ?? 15) - (balance?.annual_leave_used ?? 0);
          return (
            <Card key={member.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => openMember(member)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-bold text-sm flex-shrink-0">
                      {member.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-slate-800">{member.full_name}</p>
                      <p className="text-xs text-slate-400">{member.job_title || member.school}</p>
                    </div>
                  </div>
                  {!member.is_active && <Badge className="text-[10px] bg-slate-100 text-slate-500">Inactive</Badge>}
                </div>
                <div className="mt-3 grid grid-cols-3 gap-1 text-center">
                  <div className="bg-slate-50 rounded p-1.5">
                    <p className="text-xs text-slate-400">Annual</p>
                    <p className="text-sm font-semibold text-slate-700">{annualRemaining}</p>
                  </div>
                  <div className="bg-slate-50 rounded p-1.5">
                    <p className="text-xs text-slate-400">Leave Req</p>
                    <p className="text-sm font-semibold text-slate-700">{memberLeave(member.email).filter(l => l.status === 'pending').length}</p>
                  </div>
                  <div className="bg-slate-50 rounded p-1.5">
                    <p className="text-xs text-slate-400">Payslips</p>
                    <p className="text-sm font-semibold text-slate-700">{memberPayslips(member.email).length}</p>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-end text-xs text-teal-600 gap-1">
                  Manage <ChevronRight className="w-3 h-3" />
                </div>
              </CardContent>
            </Card>
          );
        })}
        {staff.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-400 text-sm">No staff members yet. Add one to get started.</div>
        )}
      </div>

      {/* Add/Edit Staff Dialog */}
      <Dialog open={!!editStaff} onOpenChange={() => setEditStaff(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editStaff?.id ? 'Edit' : 'Add'} Staff Member</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><Label>Full Name *</Label><Input value={staffForm.full_name} onChange={e => setStaffForm(p => ({ ...p, full_name: e.target.value }))} /></div>
              <div><Label>Email *</Label><Input type="email" value={staffForm.email} onChange={e => setStaffForm(p => ({ ...p, email: e.target.value }))} /></div>
              <div><Label>Phone</Label><Input value={staffForm.phone} onChange={e => setStaffForm(p => ({ ...p, phone: e.target.value }))} /></div>
              <div><Label>ID Number</Label><Input value={staffForm.id_number} onChange={e => setStaffForm(p => ({ ...p, id_number: e.target.value }))} /></div>
              <div><Label>Job Title</Label><Input value={staffForm.job_title} onChange={e => setStaffForm(p => ({ ...p, job_title: e.target.value }))} /></div>
              <div>
                <Label>School</Label>
                <Select value={staffForm.school} onValueChange={v => setStaffForm(p => ({ ...p, school: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PrePrimary">Pre-Primary</SelectItem>
                    <SelectItem value="Special Needs">Special Needs</SelectItem>
                    <SelectItem value="Both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Start Date</Label><Input type="date" value={staffForm.start_date} onChange={e => setStaffForm(p => ({ ...p, start_date: e.target.value }))} /></div>
              <div><Label>Emergency Contact</Label><Input placeholder="Name" value={staffForm.emergency_contact_name} onChange={e => setStaffForm(p => ({ ...p, emergency_contact_name: e.target.value }))} /></div>
              <div><Label>Emergency Phone</Label><Input placeholder="Phone" value={staffForm.emergency_contact_phone} onChange={e => setStaffForm(p => ({ ...p, emergency_contact_phone: e.target.value }))} /></div>
            </div>
            <div><Label>Notes</Label><Textarea value={staffForm.notes} onChange={e => setStaffForm(p => ({ ...p, notes: e.target.value }))} rows={2} /></div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={staffForm.is_active} onChange={e => setStaffForm(p => ({ ...p, is_active: e.target.checked }))} className="accent-teal-600" />
              Currently active / employed
            </label>
            <Button className="w-full bg-teal-600 hover:bg-teal-700" onClick={saveStaff} disabled={!staffForm.full_name || !staffForm.email}>
              {editStaff?.id ? 'Save Changes' : 'Add Staff Member'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Member Detail Dialog */}
      <Dialog open={showMemberDetail} onOpenChange={setShowMemberDetail}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedMember && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-bold">
                      {selectedMember.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <DialogTitle className="text-lg">{selectedMember.full_name}</DialogTitle>
                      <p className="text-sm text-slate-400">{selectedMember.job_title} · {selectedMember.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 mr-6">
                    <Button variant="ghost" size="icon" onClick={() => { setEditStaff(selectedMember); setStaffForm({ full_name: selectedMember.full_name, email: selectedMember.email, phone: selectedMember.phone || '', id_number: selectedMember.id_number || '', job_title: selectedMember.job_title || '', school: selectedMember.school || 'PrePrimary', start_date: selectedMember.start_date || '', emergency_contact_name: selectedMember.emergency_contact_name || '', emergency_contact_phone: selectedMember.emergency_contact_phone || '', notes: selectedMember.notes || '', is_active: selectedMember.is_active !== false }); }}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-red-400" onClick={() => deleteStaff(selectedMember.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              </DialogHeader>

              <Tabs defaultValue="info" className="mt-4">
                <TabsList>
                  <TabsTrigger value="info" className="gap-1"><User className="w-3.5 h-3.5" />Info</TabsTrigger>
                  <TabsTrigger value="leave" className="gap-1"><CalendarDays className="w-3.5 h-3.5" />Leave</TabsTrigger>
                  <TabsTrigger value="payslips" className="gap-1"><Banknote className="w-3.5 h-3.5" />Pay Slips</TabsTrigger>
                </TabsList>

                {/* INFO TAB */}
                <TabsContent value="info" className="space-y-3 mt-4">
                  {[
                    ['Phone', selectedMember.phone],
                    ['ID Number', selectedMember.id_number],
                    ['School', selectedMember.school],
                    ['Start Date', selectedMember.start_date ? format(parseISO(selectedMember.start_date), 'dd MMM yyyy') : null],
                    ['Emergency Contact', selectedMember.emergency_contact_name],
                    ['Emergency Phone', selectedMember.emergency_contact_phone],
                  ].filter(([, v]) => v).map(([label, value]) => (
                    <div key={label} className="flex gap-4 text-sm border-b border-slate-50 pb-2">
                      <span className="text-slate-400 w-36 flex-shrink-0">{label}</span>
                      <span className="text-slate-700">{value}</span>
                    </div>
                  ))}
                  {selectedMember.notes && <p className="text-sm text-slate-500 italic">{selectedMember.notes}</p>}
                  
                  <div className="pt-4 border-t border-slate-200">
                    <p className="text-sm font-semibold text-slate-700 mb-2">Login Account</p>
                    <p className="text-xs text-slate-400 mb-2">Create a login so this staff member can access the portal.</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="text-xs" 
                        onClick={() => createLogin(selectedMember.email, selectedMember.full_name, 'staff')}>
                        Create Staff Login
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs text-purple-600 border-purple-200 hover:bg-purple-50"
                        onClick={() => createLogin(selectedMember.email, selectedMember.full_name, 'admin')}>
                        Create Admin Login
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                {/* LEAVE TAB */}
                <TabsContent value="leave" className="mt-4 space-y-4">
                  {/* Balance Card */}
                  {(() => {
                    const bal = memberBalance(selectedMember.email);
                    return (
                      <Card>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm">Leave Balance</CardTitle>
                            <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => { const b = bal || {}; setBalanceForm({ annual_leave_total: b.annual_leave_total ?? 15, annual_leave_used: b.annual_leave_used ?? 0, sick_leave_total: b.sick_leave_total ?? 30, sick_leave_used: b.sick_leave_used ?? 0, family_leave_total: b.family_leave_total ?? 3, family_leave_used: b.family_leave_used ?? 0, notes: b.notes ?? '' }); setEditBalance(true); }}>
                              <Pencil className="w-3 h-3" /> Edit
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-3 gap-3">
                            {[
                              { label: 'Annual', total: bal?.annual_leave_total ?? 15, used: bal?.annual_leave_used ?? 0 },
                              { label: 'Sick', total: bal?.sick_leave_total ?? 30, used: bal?.sick_leave_used ?? 0 },
                              { label: 'Family', total: bal?.family_leave_total ?? 3, used: bal?.family_leave_used ?? 0 },
                            ].map(({ label, total, used }) => (
                              <div key={label} className="text-center bg-slate-50 rounded-lg p-3">
                                <p className="text-xs text-slate-400 mb-1">{label}</p>
                                <p className="text-xl font-bold text-slate-700">{total - used}</p>
                                <p className="text-xs text-slate-400">of {total} days</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })()}

                  {/* Leave Requests */}
                  <div>
                    <p className="text-sm font-semibold text-slate-600 mb-2">Leave Requests</p>
                    {memberLeave(selectedMember.email).length === 0 ? (
                      <p className="text-xs text-slate-400">No leave requests.</p>
                    ) : (
                      <div className="space-y-2">
                        {memberLeave(selectedMember.email).map(lr => (
                          <div key={lr.id} className="flex items-start justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <div>
                              <p className="text-sm font-medium">{lr.leave_type}</p>
                              <p className="text-xs text-slate-400">
                                {lr.is_half_day
                                  ? `${format(parseISO(lr.start_date), 'dd MMM yyyy')} · ${lr.half_day_period || ''} half day`
                                  : `${format(parseISO(lr.start_date), 'dd MMM')} – ${format(parseISO(lr.end_date), 'dd MMM yyyy')} · ${lr.days_requested} day${lr.days_requested !== 1 ? 's' : ''}`}
                              </p>
                              <p className="text-xs text-slate-500">{lr.reason}</p>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Badge className={`text-[10px] ${STATUS_BADGE[lr.status]}`}>{lr.status}</Badge>
                              {lr.status === 'pending' && (
                                <>
                                  <Button size="sm" variant="ghost" className="text-green-600 text-xs h-6 px-2" onClick={() => updateLeaveStatus(lr.id, 'approved')}>✓</Button>
                                  <Button size="sm" variant="ghost" className="text-red-500 text-xs h-6 px-2" onClick={() => updateLeaveStatus(lr.id, 'rejected')}>✕</Button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* PAYSLIPS TAB */}
                <TabsContent value="payslips" className="mt-4 space-y-3">
                  <div className="flex justify-end">
                    <Button size="sm" className="bg-teal-600 hover:bg-teal-700 gap-1" onClick={() => setShowPayslipBuilder(true)}>
                      <Plus className="w-3 h-3" /> Build Pay Slip
                    </Button>
                  </div>
                  {memberPayslips(selectedMember.email).length === 0 ? (
                    <p className="text-xs text-slate-400">No pay slips yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {memberPayslips(selectedMember.email).map(s => (
                        <div key={s.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                          <div>
                            <p className="text-sm font-medium">{s.pay_period}</p>
                            <p className="text-xs text-slate-400">{s.pay_date ? format(parseISO(s.pay_date), 'dd MMM yyyy') : ''} · Net: R{parseFloat(s.net_salary || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</p>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => setViewSlip(s)}><Eye className="w-3 h-3" /> View</Button>
                            <Button variant="ghost" size="icon" className="text-red-400" onClick={() => deletePayslip(s.id)}><Trash2 className="w-3 h-3" /></Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Balance Dialog */}
      <Dialog open={!!editBalance} onOpenChange={() => setEditBalance(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Leave Balance — {selectedMember?.full_name}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            {[
              ['Annual Total', 'annual_leave_total'],
              ['Annual Used', 'annual_leave_used'],
              ['Sick Total', 'sick_leave_total'],
              ['Sick Used', 'sick_leave_used'],
              ['Family Total', 'family_leave_total'],
              ['Family Used', 'family_leave_used'],
            ].map(([label, key]) => (
              <div key={key}><Label>{label}</Label><Input type="number" min="0" value={balanceForm[key] ?? ''} onChange={e => setBalanceForm(p => ({ ...p, [key]: parseFloat(e.target.value) || 0 }))} /></div>
            ))}
          </div>
          <div className="mt-3"><Label>Notes</Label><Textarea value={balanceForm.notes || ''} onChange={e => setBalanceForm(p => ({ ...p, notes: e.target.value }))} /></div>
          <Button className="w-full mt-4 bg-teal-600 hover:bg-teal-700" onClick={saveBalance}>Save Balance</Button>
        </DialogContent>
      </Dialog>

      {/* Pay Slip Builder Dialog */}
      <Dialog open={showPayslipBuilder} onOpenChange={setShowPayslipBuilder}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
          <div className="pt-2">
            <PaySlipBuilder
              staffMember={selectedMember}
              onSaved={() => { setShowPayslipBuilder(false); loadAll(); }}
              onCancel={() => setShowPayslipBuilder(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* View Slip Dialog */}
      <Dialog open={!!viewSlip} onOpenChange={() => setViewSlip(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
          {viewSlip && (
            <PaySlipPreview
              form={viewSlip}
              gross={viewSlip.gross_salary || 0}
              totalDeductions={viewSlip.total_deductions || 0}
              net={viewSlip.net_salary || 0}
              schoolInfo={SCHOOL_INFO}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}