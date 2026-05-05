import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, CheckCircle, Clock, Archive, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-slate-100 text-slate-700', icon: Clock },
  signed: { label: 'Signed', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  approved: { label: 'Approved', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  archived: { label: 'Archived', color: 'bg-gray-100 text-gray-700', icon: Archive }
};

export default function ContractsAdmin() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => base44.entities.ParentContract.list('-created_date')
  });

  const filtered = contracts.filter(c => {
    const matchesSearch =
      c.student_first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.student_last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.parent1_full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.parent1_email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDownload = async (contract) => {
    if (contract.signed_pdf_url) {
      window.open(contract.signed_pdf_url, '_blank');
      return;
    }
    const response = await base44.functions.invoke('getContractPdf', { contractId: contract.id });
    if (response.data?.success && response.data?.pdfUrl) {
      window.open(response.data.pdfUrl, '_blank');
      toast.success('PDF opened');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <CardTitle className="text-xl">Parent Contracts</CardTitle>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="w-4 h-4 mr-2" /><SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="signed">Signed</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-12 text-slate-500">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500">No contracts found</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead>School</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(contract => {
                  const StatusIcon = statusConfig[contract.status]?.icon || Clock;
                  return (
                    <TableRow key={contract.id}>
                      <TableCell><p className="font-medium">{contract.student_first_name} {contract.student_last_name}</p></TableCell>
                      <TableCell>
                        <p className="font-medium">{contract.parent1_full_name}</p>
                        <p className="text-xs text-slate-400">{contract.parent1_email}</p>
                      </TableCell>
                      <TableCell><p className="text-sm text-slate-600">{contract.school_location}</p></TableCell>
                      <TableCell><p className="text-sm">{contract.contract_date ? format(new Date(contract.contract_date), 'dd MMM yyyy') : '-'}</p></TableCell>
                      <TableCell>
                        <Badge className={statusConfig[contract.status]?.color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig[contract.status]?.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => handleDownload(contract)} className="gap-1">
                          <Download className="w-3 h-3" /> PDF
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}