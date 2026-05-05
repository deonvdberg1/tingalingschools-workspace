import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, CheckCircle, Clock, Archive, FileText, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-slate-100 text-slate-700', icon: Clock },
  signed: { label: 'Signed', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  approved: { label: 'Approved', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  archived: { label: 'Archived', color: 'bg-gray-100 text-gray-700', icon: Archive }
};

export default function MyContracts() {
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ['myContracts', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const allContracts = await base44.entities.ParentContract.list('-created_date');
      return allContracts.filter(c => 
        c.parent1_email === user.email || c.parent2_email === user.email
      );
    },
    enabled: !!user?.email,
    staleTime: 0,
    cacheTime: 0
  });

  const handleDownload = async (contract) => {
    try {
      if (contract.signed_pdf_url) {
        window.open(contract.signed_pdf_url, '_blank');
        toast.success('PDF opened in new tab');
        return;
      }

      const response = await base44.functions.invoke('getContractPdf', {
        contractId: contract.id
      });

      if (response.data.success && response.data.pdfUrl) {
        window.open(response.data.pdfUrl, '_blank');
        toast.success('PDF opened in new tab');
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download PDF. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-5xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">My Enrollment Contracts</CardTitle>
              <Link to={createPageUrl('ParentContract')}>
                <Button className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 gap-2">
                  <Plus className="w-4 h-4" />
                  Add Child
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12 text-slate-600">Loading contracts...</div>
            ) : contracts.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 text-lg mb-2">No contracts found</p>
                <p className="text-slate-500 text-sm">You haven't submitted any enrollment contracts yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {contracts.map((contract) => {
                  const StatusIcon = statusConfig[contract.status]?.icon || Clock;
                  return (
                    <Card key={contract.id} className="border-2">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-semibold text-slate-800">
                                {contract.student_first_name} {contract.student_last_name}
                              </h3>
                              <Badge className={statusConfig[contract.status]?.color}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {statusConfig[contract.status]?.label}
                              </Badge>
                            </div>
                            <div className="space-y-1 text-sm text-slate-600">
                              <p><strong>School Location:</strong> {contract.school_location}</p>
                              <p><strong>Contract Date:</strong> {contract.contract_date 
                                ? format(new Date(contract.contract_date), 'dd MMM yyyy')
                                : '-'}</p>
                              <p><strong>Parent:</strong> {contract.parent1_full_name}</p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            onClick={() => handleDownload(contract)}
                            className="gap-2"
                          >
                            <Download className="w-4 h-4" />
                            Download PDF
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}