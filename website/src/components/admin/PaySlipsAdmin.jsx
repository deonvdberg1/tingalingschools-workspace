import React, { useState, useEffect } from 'react';
import { db } from '@/supabase/client';
import { auth } from '@/supabase/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { Plus, Trash2, Eye } from 'lucide-react';
import PaySlipBuilder, { PaySlipPreview } from './PaySlipBuilder';

const SCHOOL_INFO = { name: 'Ting-A-Ling Schools', address1: '74 Krewilkring, Meerensee', email: 'info@tingaling.co.za' };

export default function PaySlipsAdmin() {
  const [payslips, setPayslips] = useState([]);
  const [staff, setStaff] = useState([]);
  const [showBuilder, setShowBuilder] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [viewSlip, setViewSlip] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [ps, sf] = await Promise.all([
      db.paySlips.list('-pay_date', 200),
      db.staff.list('-created_date', 100)
    ]);
    setPayslips(ps);
    setStaff(sf);
  };

  const del = async (id) => {
    await db.paySlips.delete(id);
    toast.success('Deleted');
    loadData();
  };

  const openBuilder = (member) => {
    setSelectedStaff(member);
    setShowBuilder(true);
  };

  // Group payslips by staff
  const grouped = payslips.reduce((acc, ps) => {
    const key = ps.staff_email;
    if (!acc[key]) acc[key] = { name: ps.staff_name, email: ps.staff_email, slips: [] };
    acc[key].slips.push(ps);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* Staff picker to create new */}
      <Card>
        <CardContent className="pt-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Create New Pay Slip</p>
          {staff.length === 0 ? (
            <p className="text-sm text-slate-400">Add staff members first in the Staff section.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {staff.filter(s => s.is_active !== false).map(s => (
                <Button key={s.id} variant="outline" size="sm" className="gap-1.5" onClick={() => openBuilder(s)}>
                  <Plus className="w-3 h-3" />
                  {s.full_name}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pay slips grouped by staff */}
      {Object.values(grouped).length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-8">No pay slips created yet.</p>
      ) : (
        Object.values(grouped).map(group => (
          <Card key={group.email}>
            <CardContent className="pt-4">
              <p className="font-semibold text-sm text-slate-700 mb-3">{group.name} <span className="text-slate-400 font-normal text-xs">— {group.email}</span></p>
              <div className="space-y-2">
                {group.slips.map(s => (
                  <div key={s.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div>
                      <p className="text-sm font-medium">{s.pay_period}</p>
                      <p className="text-xs text-slate-400">
                        {s.pay_date ? format(parseISO(s.pay_date), 'dd MMM yyyy') : ''}
                        {s.gross_salary ? ` · Gross: R${parseFloat(s.gross_salary).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}` : ''}
                        {s.net_salary ? ` · Net: R${parseFloat(s.net_salary).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}` : ''}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => setViewSlip(s)}>
                        <Eye className="w-3 h-3" /> View
                      </Button>
                      {s.document_url && (
                        <Button variant="ghost" size="sm" className="text-xs" onClick={() => window.open(s.document_url, '_blank')}>File</Button>
                      )}
                      <Button variant="ghost" size="icon" className="text-red-400" onClick={() => del(s.id)}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {/* Builder Dialog */}
      <Dialog open={showBuilder} onOpenChange={setShowBuilder}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
          <div className="pt-2">
            <PaySlipBuilder
              staffMember={selectedStaff}
              onSaved={() => { setShowBuilder(false); loadData(); }}
              onCancel={() => setShowBuilder(false)}
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