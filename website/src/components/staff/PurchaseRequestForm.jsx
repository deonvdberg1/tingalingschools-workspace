import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { db } from '@/supabase/client';
import { auth } from '@/supabase/auth';
import { toast } from 'sonner';

export default function PurchaseRequestForm({ user, onSuccess }) {
  const [form, setForm] = useState({
    item_description: '', quantity: 1, estimated_cost: '', supplier: '', reason: '', priority: 'Medium'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await db.purchaseRequests.create({
      staff_email: user.email,
      staff_name: user.full_name,
      ...form,
      estimated_cost: parseFloat(form.estimated_cost),
      quantity: parseInt(form.quantity),
      status: 'pending'
    });
    toast.success('Purchase request submitted!');
    setForm({ item_description: '', quantity: 1, estimated_cost: '', supplier: '', reason: '', priority: 'Medium' });
    setLoading(false);
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Item / Service Description *</Label>
        <Input value={form.item_description} onChange={e => setForm(p => ({ ...p, item_description: e.target.value }))} placeholder="What do you need?" required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Quantity</Label>
          <Input type="number" min="1" value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))} />
        </div>
        <div>
          <Label>Estimated Cost (ZAR) *</Label>
          <Input type="number" step="0.01" value={form.estimated_cost} onChange={e => setForm(p => ({ ...p, estimated_cost: e.target.value }))} placeholder="0.00" required />
        </div>
      </div>
      <div>
        <Label>Preferred Supplier <span className="text-slate-400">(optional)</span></Label>
        <Input value={form.supplier} onChange={e => setForm(p => ({ ...p, supplier: e.target.value }))} placeholder="e.g. Makro, Takealot" />
      </div>
      <div>
        <Label>Priority</Label>
        <Select value={form.priority} onValueChange={v => setForm(p => ({ ...p, priority: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {['Low', 'Medium', 'High', 'Urgent'].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Reason / Justification *</Label>
        <Textarea value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} placeholder="Why is this needed?" required />
      </div>
      <Button type="submit" disabled={loading || !form.item_description || !form.estimated_cost || !form.reason} className="w-full bg-teal-600 hover:bg-teal-700">
        {loading ? 'Submitting...' : 'Submit Purchase Request'}
      </Button>
    </form>
  );
}