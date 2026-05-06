import React, { useState, useEffect } from 'react';
import { db } from '@/supabase/client';
import { auth } from '@/supabase/auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarDays, ShoppingCart, FileText, Calendar, Megaphone, Plus, Clock, CheckCircle, XCircle } from 'lucide-react';
import LeaveBalanceCard from '../components/staff/LeaveBalanceCard';
import LeaveRequestForm from '../components/staff/LeaveRequestForm';
import PurchaseRequestForm from '../components/staff/PurchaseRequestForm';
import StaffCalendar from '../components/staff/StaffCalendar';
import PaySlipList from '../components/staff/PaySlipList';
import AnnouncementsBanner from '../components/staff/AnnouncementsBanner';
import { format, parseISO } from 'date-fns';

const STATUS_BADGE = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  ordered: 'bg-blue-100 text-blue-700',
  received: 'bg-teal-100 text-teal-700'
};

export default function StaffDashboard() {
  const [user, setUser] = useState(null);
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [purchaseRequests, setPurchaseRequests] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    const u = await auth.me();
    setUser(u);

    const [balances, leaves, purchases, slips, evts, anncts] = await Promise.all([
      db.leaveBalances.filter({ staff_email: u.email }),
      db.leaveRequests.filter({ staff_email: u.email }, '-created_date', 20),
      db.purchaseRequests.filter({ staff_email: u.email }, '-created_date', 20),
      db.paySlips.filter({ staff_email: u.email }, '-pay_date', 12),
      db.events.list('-start_date', 100),
      db.announcements.filter({ is_active: true }, '-created_date', 20)
    ]);

    setLeaveBalance(balances[0] || null);
    setLeaveRequests(leaves);
    setPurchaseRequests(purchases);
    setPayslips(slips);
    setEvents(evts);
    setAnnouncements(anncts);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" /></div>;
  }

  if (!user || (user.role !== 'staff' && user.role !== 'admin')) {
    return (
      <div className="max-w-lg mx-auto mt-20 text-center p-8">
        <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-slate-700 mb-2">Access Restricted</h2>
        <p className="text-slate-500">This area is for staff members only.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Staff Portal</h1>
        <p className="text-slate-500 text-sm mt-1">Welcome back, {user.full_name} 👋</p>
      </div>

      <AnnouncementsBanner announcements={announcements} />

      <div className="mt-6">
        <Tabs defaultValue="leave">
          <TabsList className="flex flex-wrap gap-1 h-auto mb-6">
            <TabsTrigger value="leave" className="gap-2"><CalendarDays className="w-4 h-4" />Leave</TabsTrigger>
            <TabsTrigger value="purchases" className="gap-2"><ShoppingCart className="w-4 h-4" />Purchase Requests</TabsTrigger>
            <TabsTrigger value="calendar" className="gap-2"><Calendar className="w-4 h-4" />Calendar</TabsTrigger>
            <TabsTrigger value="payslips" className="gap-2"><FileText className="w-4 h-4" />Pay Slips</TabsTrigger>
          </TabsList>

          {/* LEAVE TAB */}
          <TabsContent value="leave" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <LeaveBalanceCard balance={leaveBalance} />
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">My Leave Requests</CardTitle>
                    <Button size="sm" className="bg-teal-600 hover:bg-teal-700 gap-1" onClick={() => setShowLeaveForm(true)}>
                      <Plus className="w-3 h-3" /> New Request
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {leaveRequests.length === 0 ? (
                    <p className="text-sm text-slate-400 py-4 text-center">No leave requests yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {leaveRequests.map(lr => (
                        <div key={lr.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-medium text-sm text-slate-700">{lr.leave_type}</p>
                              <p className="text-xs text-slate-400">
                                {lr.is_half_day
                                  ? `${format(parseISO(lr.start_date), 'dd MMM yyyy')} · ${lr.half_day_period} half day`
                                  : `${format(parseISO(lr.start_date), 'dd MMM')}${lr.start_time ? ` ${lr.start_time}` : ''} – ${format(parseISO(lr.end_date), 'dd MMM yyyy')}${lr.end_time ? ` ${lr.end_time}` : ''} · ${lr.days_requested} day${lr.days_requested !== 1 ? 's' : ''}`
                                }
                              </p>
                            </div>
                            <Badge className={`text-xs shrink-0 ${STATUS_BADGE[lr.status]}`}>{lr.status}</Badge>
                          </div>
                          {lr.admin_notes && <p className="text-xs text-blue-600 mt-1 italic">Admin: {lr.admin_notes}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* PURCHASES TAB */}
          <TabsContent value="purchases" className="space-y-6">
            <div className="flex justify-end">
              <Button size="sm" className="bg-teal-600 hover:bg-teal-700 gap-1" onClick={() => setShowPurchaseForm(true)}>
                <Plus className="w-3 h-3" /> New Request
              </Button>
            </div>
            {purchaseRequests.length === 0 ? (
              <Card><CardContent className="py-10 text-center text-slate-400 text-sm">No purchase requests yet.</CardContent></Card>
            ) : (
              <div className="space-y-3">
                {purchaseRequests.map(pr => (
                  <Card key={pr.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm text-slate-700">{pr.item_description}</p>
                            <Badge className={`text-[10px] ${pr.priority === 'Urgent' ? 'bg-red-100 text-red-700' : pr.priority === 'High' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'}`}>{pr.priority}</Badge>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">Qty: {pr.quantity} · Est. R{parseFloat(pr.estimated_cost || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}{pr.supplier ? ` · ${pr.supplier}` : ''}</p>
                          <p className="text-xs text-slate-500 mt-1">{pr.reason}</p>
                          {pr.admin_notes && <p className="text-xs text-blue-600 mt-1 italic">Admin: {pr.admin_notes}</p>}
                        </div>
                        <Badge className={`text-xs shrink-0 ${STATUS_BADGE[pr.status]}`}>{pr.status}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* CALENDAR TAB */}
          <TabsContent value="calendar">
            <StaffCalendar events={events} />
          </TabsContent>

          {/* PAYSLIPS TAB */}
          <TabsContent value="payslips">
            <PaySlipList payslips={payslips} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Leave Form Dialog */}
      <Dialog open={showLeaveForm} onOpenChange={setShowLeaveForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Apply for Leave</DialogTitle></DialogHeader>
          <LeaveRequestForm user={user} onSuccess={() => { setShowLeaveForm(false); loadData(); }} />
        </DialogContent>
      </Dialog>

      {/* Purchase Form Dialog */}
      <Dialog open={showPurchaseForm} onOpenChange={setShowPurchaseForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>New Purchase Request</DialogTitle></DialogHeader>
          <PurchaseRequestForm user={user} onSuccess={() => { setShowPurchaseForm(false); loadData(); }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}