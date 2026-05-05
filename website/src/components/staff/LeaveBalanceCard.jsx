import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

const LeaveTypeRow = ({ label, used, total, color }) => {
  const remaining = Math.max(0, total - used);
  const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className={`font-semibold ${remaining === 0 ? 'text-red-500' : 'text-slate-600'}`}>
          {remaining} / {total} days left
        </span>
      </div>
      <Progress value={pct} className={`h-2 ${color}`} />
      <p className="text-xs text-slate-400">{used} used</p>
    </div>
  );
};

export default function LeaveBalanceCard({ balance }) {
  if (!balance) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">My Leave Balances</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500">No leave balance record found. Contact your administrator.</p>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">My Leave Balances</CardTitle>
        <p className="text-xs text-slate-400">Based on South African BCEA</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <LeaveTypeRow
          label="Annual Leave"
          used={balance.annual_leave_used || 0}
          total={balance.annual_leave_total || 15}
          color=""
        />
        <LeaveTypeRow
          label="Sick Leave"
          used={balance.sick_leave_used || 0}
          total={balance.sick_leave_total || 30}
          color=""
        />
        <LeaveTypeRow
          label="Family Responsibility"
          used={balance.family_leave_used || 0}
          total={balance.family_leave_total || 3}
          color=""
        />
      </CardContent>
    </Card>
  );
}