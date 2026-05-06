import React, { useState, useEffect } from 'react';
import { db } from '@/supabase/client';
import { auth } from '@/supabase/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const PRIORITY_BADGE = {
  Urgent: 'bg-red-100 text-red-700',
  High: 'bg-orange-100 text-orange-700',
  Normal: 'bg-blue-100 text-blue-700',
  Low: 'bg-slate-100 text-slate-600'
};

export default function AnnouncementsAdmin() {
  const [announcements, setAnnouncements] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ title: '', content: '', priority: 'Normal', is_active: true, expiry_date: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const an = await db.announcements.list('-created_date', 50);
    setAnnouncements(an);
  };

  const save = async () => {
    if (editId) {
      await db.announcements.update(editId, form);
    } else {
      await db.announcements.create(form);
    }
    toast.success('Saved');
    setShowForm(false);
    setEditId(null);
    setForm({ title: '', content: '', priority: 'Normal', is_active: true, expiry_date: '' });
    loadData();
  };

  const del = async (id) => {
    await db.announcements.delete(id);
    toast.success('Deleted');
    loadData();
  };

  const startEdit = (a) => {
    setEditId(a.id);
    setForm({ title: a.title, content: a.content, priority: a.priority, is_active: a.is_active, expiry_date: a.expiry_date || '' });
    setShowForm(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" className="bg-teal-600 hover:bg-teal-700 gap-1" onClick={() => { setEditId(null); setForm({ title: '', content: '', priority: 'Normal', is_active: true, expiry_date: '' }); setShowForm(true); }}>
          <Plus className="w-3 h-3" /> New Announcement
        </Button>
      </div>
      <Card>
        <CardContent className="pt-4">
          {announcements.length === 0 ? <p className="text-sm text-slate-400">No announcements.</p> : (
            <div className="space-y-3">
              {announcements.map(a => (
                <div key={a.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm">{a.title}</p>
                        <Badge className={`text-[10px] ${PRIORITY_BADGE[a.priority]}`}>{a.priority}</Badge>
                        {!a.is_active && <Badge className="text-[10px] bg-slate-200 text-slate-500">Inactive</Badge>}
                      </div>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{a.content}</p>
                      {a.expiry_date && <p className="text-xs text-slate-400 mt-0.5">Expires: {format(parseISO(a.expiry_date), 'dd MMM yyyy')}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => startEdit(a)}><Pencil className="w-3 h-3" /></Button>
                      <Button variant="ghost" size="icon" className="text-red-400" onClick={() => del(a.id)}><Trash2 className="w-3 h-3" /></Button>
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
              <div><Label>Expiry Date <span className="text-slate-400 text-xs">(optional)</span></Label><Input type="date" value={form.expiry_date} onChange={e => setForm(p => ({ ...p, expiry_date: e.target.value }))} /></div>
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} className="accent-teal-600" />
              Active (visible to staff)
            </label>
            <Button className="w-full bg-teal-600 hover:bg-teal-700" onClick={save} disabled={!form.title || !form.content}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}