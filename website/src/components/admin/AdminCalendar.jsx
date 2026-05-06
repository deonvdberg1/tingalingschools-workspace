import React, { useState, useEffect } from 'react';
import { db } from '@/supabase/client';
import { auth } from '@/supabase/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Trash2, BookmarkPlus } from 'lucide-react';

const EVENT_TYPES = ['Public Holiday', 'School Holiday', 'Staff Meeting', 'School Event', 'Important Date', 'Training', 'Other'];

const COLORS = [
  { label: 'Red', value: '#ef4444' },
  { label: 'Orange', value: '#f97316' },
  { label: 'Amber', value: '#f59e0b' },
  { label: 'Green', value: '#22c55e' },
  { label: 'Teal', value: '#14b8a6' },
  { label: 'Blue', value: '#3b82f6' },
  { label: 'Indigo', value: '#6366f1' },
  { label: 'Purple', value: '#a855f7' },
  { label: 'Pink', value: '#ec4899' },
];

const DEFAULT_EVENT = { title: '', description: '', event_type: 'School Event', color: '#3b82f6', is_staff_only: false, end_date: '' };

export default function AdminCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [addingEvent, setAddingEvent] = useState(false);
  const [newEvent, setNewEvent] = useState(DEFAULT_EVENT);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [evts, tmps] = await Promise.all([
      db.events.list('-start_date', 300),
      db.eventTemplates.list('-created_date', 50)
    ]);
    setEvents(evts);
    setTemplates(tmps);
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = getDay(monthStart);

  const getEventsForDay = (day) => events.filter(e => {
    const start = parseISO(e.start_date);
    const end = e.end_date ? parseISO(e.end_date) : start;
    return day >= start && day <= end;
  });

  const handleDayClick = (day) => {
    setSelectedDay(day);
    setAddingEvent(false);
    setNewEvent(DEFAULT_EVENT);
    setShowDialog(true);
  };

  const handleTemplateSelect = (templateId) => {
    const t = templates.find(t => t.id === templateId);
    if (t) setNewEvent(p => ({ ...p, title: t.title, description: t.description || '', event_type: t.event_type, color: t.color || '#3b82f6', is_staff_only: t.is_staff_only || false }));
  };

  const saveEvent = async () => {
    if (!newEvent.title) return;
    setSaving(true);
    await db.events.create({
      ...newEvent,
      start_date: format(selectedDay, 'yyyy-MM-dd'),
      end_date: newEvent.end_date || undefined
    });
    toast.success('Event added');
    await loadData();
    setAddingEvent(false);
    setNewEvent(DEFAULT_EVENT);
    setSaving(false);
  };

  const saveAsTemplate = async () => {
    if (!newEvent.title) return;
    await db.eventTemplates.create({
      title: newEvent.title,
      description: newEvent.description,
      event_type: newEvent.event_type,
      color: newEvent.color,
      is_staff_only: newEvent.is_staff_only
    });
    toast.success('Saved as template!');
    loadData();
  };

  const deleteEvent = async (id) => {
    await db.events.delete(id);
    toast.success('Event removed');
    loadData();
  };

  const deleteTemplate = async (id) => {
    await db.eventTemplates.delete(id);
    loadData();
  };

  const dayEvents = selectedDay ? getEventsForDay(selectedDay) : [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{format(currentMonth, 'MMMM yyyy')}</CardTitle>
            <div className="flex gap-1 items-center">
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(m => subMonths(m, 1))}><ChevronLeft className="w-4 h-4" /></Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>Today</Button>
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(m => addMonths(m, 1))}><ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-center text-xs font-semibold text-slate-400 py-2">{d}</div>
            ))}
          </div>
          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-px bg-slate-200 border border-slate-200 rounded-lg overflow-hidden">
            {Array(startPad).fill(null).map((_, i) => (
              <div key={`pad-${i}`} className="bg-slate-50 min-h-[90px]" />
            ))}
            {days.map(day => {
              const dayEvts = getEventsForDay(day);
              const isToday = isSameDay(day, new Date());
              return (
                <div
                  key={day.toISOString()}
                  onClick={() => handleDayClick(day)}
                  className={`bg-white min-h-[90px] p-1.5 cursor-pointer hover:bg-teal-50 transition-colors group`}
                  style={isToday ? { boxShadow: 'inset 0 0 0 2px #14b8a6' } : {}}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-teal-500 text-white' : 'text-slate-600'}`}>
                      {format(day, 'd')}
                    </span>
                    <Plus className="w-3 h-3 text-slate-300 group-hover:text-teal-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="space-y-0.5">
                    {dayEvts.slice(0, 3).map(e => (
                      <div
                        key={e.id}
                        className="text-[10px] rounded px-1 py-0.5 truncate font-medium leading-tight"
                        style={{ backgroundColor: (e.color || '#3b82f6') + '22', color: e.color || '#3b82f6', borderLeft: `2px solid ${e.color || '#3b82f6'}` }}
                      >
                        {e.title}
                      </div>
                    ))}
                    {dayEvts.length > 3 && <div className="text-[10px] text-slate-400 pl-1">+{dayEvts.length - 3} more</div>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Color legend */}
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1">
            {COLORS.map(c => (
              <div key={c.value} className="flex items-center gap-1 text-xs text-slate-500">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.value }} />
                {c.label}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Templates */}
      {templates.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm text-slate-500">Saved Templates <span className="font-normal text-xs">(click a day to use them)</span></CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {templates.map(t => (
                <div key={t.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium" style={{ borderColor: t.color || '#3b82f6', color: t.color || '#3b82f6', backgroundColor: (t.color || '#3b82f6') + '11' }}>
                  <span>{t.title}</span>
                  <button onClick={() => deleteTemplate(t.id)} className="hover:opacity-60 ml-0.5"><Trash2 className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Day Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedDay && format(selectedDay, 'EEEE, dd MMMM yyyy')}</DialogTitle>
          </DialogHeader>

          {/* Existing events on this day */}
          {dayEvents.length > 0 && (
            <div className="space-y-2 mb-2">
              {dayEvents.map(e => (
                <div key={e.id} className="flex items-start justify-between p-2.5 rounded-lg border bg-slate-50" style={{ borderLeftColor: e.color || '#3b82f6', borderLeftWidth: 3 }}>
                  <div>
                    <p className="text-sm font-medium text-slate-700">{e.title}</p>
                    <p className="text-xs text-slate-400">{e.event_type}{e.is_staff_only ? ' · Staff only' : ''}</p>
                    {e.description && <p className="text-xs text-slate-500 mt-0.5">{e.description}</p>}
                    {e.end_date && e.end_date !== e.start_date && <p className="text-xs text-slate-400">Until {format(parseISO(e.end_date), 'dd MMM yyyy')}</p>}
                  </div>
                  <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-600 shrink-0" onClick={() => deleteEvent(e.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          {dayEvents.length === 0 && !addingEvent && (
            <p className="text-sm text-slate-400 mb-2">No events on this day.</p>
          )}

          {!addingEvent ? (
            <Button className="w-full bg-teal-600 hover:bg-teal-700 gap-2" onClick={() => setAddingEvent(true)}>
              <Plus className="w-4 h-4" /> Add Event
            </Button>
          ) : (
            <div className="space-y-3 border-t pt-4 mt-2">
              <p className="text-sm font-semibold text-slate-700">New Event</p>

              {/* Template dropdown */}
              {templates.length > 0 && (
                <div>
                  <Label className="text-xs">Use Template</Label>
                  <Select onValueChange={handleTemplateSelect}>
                    <SelectTrigger><SelectValue placeholder="Select a template..." /></SelectTrigger>
                    <SelectContent>
                      {templates.map(t => (
                        <SelectItem key={t.id} value={t.id}>
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color || '#3b82f6' }} />
                            {t.title}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label className="text-xs">Title *</Label>
                <Input value={newEvent.title} onChange={e => setNewEvent(p => ({ ...p, title: e.target.value }))} placeholder="Event title" />
              </div>

              <div>
                <Label className="text-xs">Type</Label>
                <Select value={newEvent.event_type} onValueChange={v => setNewEvent(p => ({ ...p, event_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{EVENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">End Date <span className="text-slate-400">(optional — for multi-day events)</span></Label>
                <Input type="date" value={newEvent.end_date} min={selectedDay ? format(selectedDay, 'yyyy-MM-dd') : ''} onChange={e => setNewEvent(p => ({ ...p, end_date: e.target.value }))} />
              </div>

              <div>
                <Label className="text-xs">Description <span className="text-slate-400">(optional)</span></Label>
                <Textarea value={newEvent.description} onChange={e => setNewEvent(p => ({ ...p, description: e.target.value }))} rows={2} />
              </div>

              {/* Color swatch picker */}
              <div>
                <Label className="text-xs">Color</Label>
                <div className="flex gap-2 mt-1.5 flex-wrap">
                  {COLORS.map(c => (
                    <button
                      key={c.value}
                      type="button"
                      title={c.label}
                      onClick={() => setNewEvent(p => ({ ...p, color: c.value }))}
                      className="w-7 h-7 rounded-full transition-transform hover:scale-110 focus:outline-none"
                      style={{
                        backgroundColor: c.value,
                        border: newEvent.color === c.value ? '3px solid #1e293b' : '3px solid transparent',
                        boxShadow: newEvent.color === c.value ? '0 0 0 1px #1e293b' : 'none'
                      }}
                    />
                  ))}
                </div>
                {newEvent.color && (
                  <p className="text-xs text-slate-400 mt-1">{COLORS.find(c => c.value === newEvent.color)?.label || ''}</p>
                )}
              </div>

              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={newEvent.is_staff_only} onChange={e => setNewEvent(p => ({ ...p, is_staff_only: e.target.checked }))} className="accent-teal-600" />
                Staff only
              </label>

              <div className="flex gap-2 pt-1">
                <Button className="flex-1 bg-teal-600 hover:bg-teal-700" onClick={saveEvent} disabled={!newEvent.title || saving}>
                  {saving ? 'Saving...' : 'Save Event'}
                </Button>
                <Button
                  variant="outline"
                  className="gap-1 shrink-0"
                  onClick={saveAsTemplate}
                  disabled={!newEvent.title}
                  title="Save as reusable template"
                >
                  <BookmarkPlus className="w-4 h-4" /> Template
                </Button>
                <Button variant="ghost" onClick={() => setAddingEvent(false)} className="shrink-0">Cancel</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}