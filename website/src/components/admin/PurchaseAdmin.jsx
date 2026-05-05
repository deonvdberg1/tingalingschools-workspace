import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Pencil } from 'lucide-react';

const STATUS_BADGE = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  ordered: 'bg-blue-100 text-blue-700',
  received: 'bg-teal-100 text-teal-700'
};

export default function PurchaseAdmin() {
  const [requests, setRequests] = useState([]);
  const [editId, setEditId] = useState(null);
  const [note, setNote] = useState('');
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const pr = await base44.entities.PurchaseRequest.list('-created_date', 50);
    setRequests(pr);
  };

  const update = async (id, status, admin_notes) => {
    await base44.entities.PurchaseRequest.update(id, { status, admin_notes });
    toast.success('Updated');
    setEditId(null);
    setNote('');
    loadData();
  };

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Purchase Requests</CardTitle></CardHeader>
      <CardContent>
        {requests.length === 0 ? <p className="text-sm text-slate-400">No purchase requests.</p> : (
          <div className="space-y-4">
            {requests.map(pr => (
              <div key={pr.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm">{pr.staff_name}</p>
                      <span className="text-slate-400 text-sm">— {pr.item_description}</span>
                      <Badge className={`text-[10px] ${pr.priority === 'Urgent' ? 'bg-red-100 text-red-700' : pr.priority === 'High' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'}`}>{pr.priority}</Badge>
                    </div>
                    <p className="text-xs text-slate-400">Qty: {pr.quantity} · R{parseFloat(pr.estimated_cost || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}{pr.supplier ? ` · ${pr.supplier}` : ''}</p>
                    <p className="text-xs text-slate-500 mt-1">{pr.reason}</p>
                    {pr.admin_notes && <p className="text-xs text-blue-600 mt-1 italic">Note: {pr.admin_notes}</p>}
                  </div>
                  <Badge className={`text-xs ${STATUS_BADGE[pr.status]}`}>{pr.status}</Badge>
                </div>
                {editId === pr.id ? (
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Input placeholder="Admin note" value={note} onChange={e => setNote(e.target.value)} className="text-xs flex-1 min-w-[140px]" />
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger className="w-32 text-xs"><SelectValue placeholder="Status..." /></SelectTrigger>
                      <SelectContent>
                        {['approved', 'rejected', 'ordered', 'received'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button size="sm" disabled={!newStatus} onClick={() => update(pr.id, newStatus, note)}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditId(null)}>Cancel</Button>
                  </div>
                ) : (
                  <Button variant="ghost" size="sm" className="text-xs text-teal-600 mt-1 gap-1" onClick={() => { setEditId(pr.id); setNote(pr.admin_notes || ''); setNewStatus(pr.status); }}>
                    <Pencil className="w-3 h-3" /> Update Status
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}