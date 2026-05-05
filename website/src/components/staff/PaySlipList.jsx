import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { FileText, Eye, Download } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { PaySlipPreview } from '../admin/PaySlipBuilder';

const SCHOOL_INFO = { name: 'Ting-A-Ling Schools', address1: '74 Krewilkring, Meerensee', email: 'info@tingaling.co.za' };

const fmt = (n) => `R ${parseFloat(n || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`;

export default function PaySlipList({ payslips }) {
  const [viewSlip, setViewSlip] = useState(null);

  const handlePrint = (slip) => {
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    const gross = slip.gross_salary || 0;
    const totalDeductions = slip.total_deductions || 0;
    const net = slip.net_salary || 0;

    const rows = (items) => (items || []).map(e =>
      `<tr style="border-bottom:1px solid #f1f5f9"><td style="padding:5px 0;color:#475569">${e.description}</td><td style="padding:5px 0;text-align:right;font-weight:600">R ${parseFloat(e.amount || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td></tr>`
    ).join('');

    printWindow.document.write(`
      <html><head><title>Pay Slip - ${slip.pay_period}</title>
      <style>body{font-family:Arial,sans-serif;margin:0;color:#1e293b;font-size:13px}</style></head>
      <body>
        <div style="background:#1e293b;color:#fff;padding:24px 32px;display:flex;justify-content:space-between">
          <div><div style="font-size:20px;font-weight:bold">Ting-A-Ling Schools</div><div style="font-size:11px;color:#94a3b8">info@tingaling.co.za</div></div>
          <div style="text-align:right"><div style="font-size:22px;font-weight:bold;color:#99f6e4">PAY SLIP</div><div style="color:#94a3b8">${slip.pay_period}</div><div style="color:#64748b;font-size:12px">Pay Date: ${slip.pay_date}</div></div>
        </div>
        <div style="background:#f8fafc;padding:16px 32px;display:grid;grid-template-columns:1fr 1fr;gap:8px;border-bottom:1px solid #e2e8f0">
          <div><span style="color:#64748b">Employee: </span><strong>${slip.staff_name}</strong></div>
          <div><span style="color:#64748b">Job Title: </span><strong>${slip.job_title || ''}</strong></div>
          <div><span style="color:#64748b">ID Number: </span><strong>${slip.staff_id_number || ''}</strong></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0">
          <div style="padding:16px 24px 16px 32px;border-right:1px solid #e2e8f0">
            <div style="font-weight:bold;font-size:12px;color:#0f766e;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px">Earnings</div>
            <table style="width:100%"><tbody>
              <tr style="border-bottom:1px solid #f1f5f9"><td style="padding:5px 0;color:#475569">Basic Salary</td><td style="padding:5px 0;text-align:right;font-weight:600">R ${parseFloat(slip.basic_salary || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td></tr>
              ${rows(slip.earnings)}
              <tr style="background:#f0fdf4"><td style="padding:8px 4px;font-weight:bold">Gross Salary</td><td style="padding:8px 4px;text-align:right;font-weight:bold;color:#15803d">R ${parseFloat(gross).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td></tr>
            </tbody></table>
          </div>
          <div style="padding:16px 32px 16px 24px">
            <div style="font-weight:bold;font-size:12px;color:#dc2626;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px">Deductions</div>
            <table style="width:100%"><tbody>
              ${rows(slip.deductions)}
              <tr style="background:#fff1f2"><td style="padding:8px 4px;font-weight:bold">Total Deductions</td><td style="padding:8px 4px;text-align:right;font-weight:bold;color:#dc2626">R ${parseFloat(totalDeductions).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td></tr>
            </tbody></table>
          </div>
        </div>
        ${(slip.leave_days_taken || slip.leave_days_balance) ? `<div style="padding:10px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:12px">${slip.leave_days_taken ? `<span><span style="color:#64748b">Leave Taken: </span><strong>${slip.leave_days_taken} days</strong></span>` : ''}${slip.leave_days_balance ? `&nbsp;&nbsp;<span><span style="color:#64748b">Leave Balance: </span><strong>${slip.leave_days_balance} days</strong></span>` : ''}</div>` : ''}
        <div style="background:#0f766e;color:#fff;padding:20px 32px;display:flex;justify-content:space-between;align-items:center">
          <div><div style="font-size:11px;color:#99f6e4;text-transform:uppercase;letter-spacing:1px">NET PAY</div><div style="font-size:28px;font-weight:bold">R ${parseFloat(net).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</div></div>
          <div style="text-align:right;font-size:12px;color:#99f6e4"><div>Gross: R ${parseFloat(gross).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</div><div>Deductions: −R ${parseFloat(totalDeductions).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</div></div>
        </div>
        ${slip.notes ? `<div style="padding:12px 32px;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b"><strong>Notes:</strong> ${slip.notes}</div>` : ''}
        <div style="padding:10px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:10px;color:#94a3b8;display:flex;justify-content:space-between"><span>Ting-A-Ling Schools · info@tingaling.co.za</span><span>Computer generated pay slip</span></div>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
  };

  if (!payslips || payslips.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">My Pay Slips</CardTitle></CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-400">
            <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No pay slips uploaded yet.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const sorted = [...payslips].sort((a, b) => (b.pay_date || '').localeCompare(a.pay_date || ''));

  return (
    <>
      <Card>
        <CardHeader><CardTitle className="text-base">My Pay Slips</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sorted.map(slip => (
              <div key={slip.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-800">{slip.pay_period}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{slip.pay_date ? format(parseISO(slip.pay_date), 'dd MMM yyyy') : ''}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-700">{fmt(slip.net_salary)}</p>
                    <p className="text-xs text-slate-400">net pay</p>
                  </div>
                </div>

                {/* Summary row */}
                {(slip.gross_salary || slip.total_deductions) && (
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div className="bg-green-50 rounded-lg p-2">
                      <p className="text-xs text-slate-400">Gross</p>
                      <p className="text-sm font-semibold text-green-700">{fmt(slip.gross_salary)}</p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-2">
                      <p className="text-xs text-slate-400">Deductions</p>
                      <p className="text-sm font-semibold text-red-600">{fmt(slip.total_deductions)}</p>
                    </div>
                    <div className="bg-teal-50 rounded-lg p-2">
                      <p className="text-xs text-slate-400">Net Pay</p>
                      <p className="text-sm font-semibold text-teal-700">{fmt(slip.net_salary)}</p>
                    </div>
                  </div>
                )}

                {/* Leave info */}
                {(slip.leave_days_taken || slip.leave_days_balance) && (
                  <div className="mt-2 flex gap-4 text-xs text-slate-500">
                    {slip.leave_days_taken && <span>Leave taken: <strong>{slip.leave_days_taken} days</strong></span>}
                    {slip.leave_days_balance && <span>Balance: <strong>{slip.leave_days_balance} days</strong></span>}
                  </div>
                )}

                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => setViewSlip(slip)}>
                    <Eye className="w-3 h-3" /> View
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => handlePrint(slip)}>
                    <Download className="w-3 h-3" /> Print / Save
                  </Button>
                  {slip.document_url && (
                    <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => window.open(slip.document_url, '_blank')}>
                      <FileText className="w-3 h-3" /> Attachment
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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
    </>
  );
}