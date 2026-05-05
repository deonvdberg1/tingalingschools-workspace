import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, parseISO, isSameMonth, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const EVENT_COLORS = {
  'Public Holiday': 'bg-red-100 text-red-700 border-red-200',
  'School Holiday': 'bg-orange-100 text-orange-700 border-orange-200',
  'Staff Meeting': 'bg-blue-100 text-blue-700 border-blue-200',
  'School Event': 'bg-purple-100 text-purple-700 border-purple-200',
  'Important Date': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'Training': 'bg-green-100 text-green-700 border-green-200',
  'Other': 'bg-slate-100 text-slate-700 border-slate-200'
};

export default function StaffCalendar({ events }) {
  const [current, setCurrent] = useState(new Date());
  const monthStart = startOfMonth(current);
  const monthEnd = endOfMonth(current);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = getDay(monthStart);

  const getEventsForDay = (day) =>
    (events || []).filter(e => {
      const start = parseISO(e.start_date);
      const end = e.end_date ? parseISO(e.end_date) : start;
      return day >= start && day <= end;
    });

  const upcoming = (events || [])
    .filter(e => parseISO(e.start_date) >= new Date())
    .sort((a, b) => parseISO(a.start_date) - parseISO(b.start_date))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{format(current, 'MMMM yyyy')}</CardTitle>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => setCurrent(d => new Date(d.getFullYear(), d.getMonth() - 1))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setCurrent(d => new Date(d.getFullYear(), d.getMonth() + 1))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
              <div key={d} className="text-center text-xs font-medium text-slate-400 py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array(startPad).fill(null).map((_, i) => <div key={`pad-${i}`} />)}
            {days.map(day => {
              const dayEvents = getEventsForDay(day);
              const isToday = isSameDay(day, new Date());
              return (
                <div key={day.toISOString()} className={`min-h-[60px] rounded-lg p-1 text-xs border ${isToday ? 'bg-teal-50 border-teal-300' : 'bg-white border-slate-100'}`}>
                  <span className={`block text-center font-medium mb-1 ${isToday ? 'text-teal-700' : 'text-slate-600'}`}>{format(day, 'd')}</span>
                  {dayEvents.slice(0, 2).map((e, i) => (
                    <div key={i} className={`rounded px-1 py-0.5 mb-0.5 truncate text-[10px] border ${EVENT_COLORS[e.event_type] || EVENT_COLORS.Other}`}>{e.title}</div>
                  ))}
                  {dayEvents.length > 2 && <div className="text-[10px] text-slate-400 text-center">+{dayEvents.length - 2}</div>}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Upcoming Events</CardTitle></CardHeader>
        <CardContent>
          {upcoming.length === 0 ? (
            <p className="text-sm text-slate-400">No upcoming events.</p>
          ) : (
            <div className="space-y-3">
              {upcoming.map(e => (
                <div key={e.id} className="flex items-start gap-3">
                  <div className="text-center min-w-[44px] bg-slate-50 rounded-lg p-1">
                    <div className="text-xs text-slate-400">{format(parseISO(e.start_date), 'MMM')}</div>
                    <div className="text-lg font-bold text-slate-700 leading-none">{format(parseISO(e.start_date), 'd')}</div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700">{e.title}</p>
                    <Badge className={`text-[10px] mt-0.5 ${EVENT_COLORS[e.event_type]}`}>{e.event_type}</Badge>
                    {e.description && <p className="text-xs text-slate-400 mt-0.5">{e.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}