import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Megaphone, AlertTriangle, Info } from 'lucide-react';
import { parseISO } from 'date-fns';

const PRIORITY_STYLES = {
  Urgent: { cls: 'border-red-300 bg-red-50', badge: 'bg-red-100 text-red-700', Icon: AlertTriangle },
  High: { cls: 'border-orange-300 bg-orange-50', badge: 'bg-orange-100 text-orange-700', Icon: Megaphone },
  Normal: { cls: 'border-blue-200 bg-blue-50', badge: 'bg-blue-100 text-blue-700', Icon: Info },
  Low: { cls: 'border-slate-200 bg-slate-50', badge: 'bg-slate-100 text-slate-600', Icon: Info }
};

export default function AnnouncementsBanner({ announcements }) {
  const active = (announcements || []).filter(a => {
    if (!a.is_active) return false;
    if (a.expiry_date && parseISO(a.expiry_date) < new Date()) return false;
    return true;
  }).sort((a, b) => {
    const order = { Urgent: 0, High: 1, Normal: 2, Low: 3 };
    return (order[a.priority] ?? 2) - (order[b.priority] ?? 2);
  });

  if (active.length === 0) return null;

  return (
    <div className="space-y-2">
      {active.map(a => {
        const { cls, badge, Icon: AIcon } = PRIORITY_STYLES[a.priority] || PRIORITY_STYLES.Normal;
        return (
          <Card key={a.id} className={`border ${cls}`}>
            <CardContent className="p-4 flex gap-3 items-start">
              <AIcon className="w-5 h-5 mt-0.5 flex-shrink-0 text-slate-600" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm text-slate-800">{a.title}</span>
                  <Badge className={`text-[10px] ${badge}`}>{a.priority}</Badge>
                </div>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{a.content}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}