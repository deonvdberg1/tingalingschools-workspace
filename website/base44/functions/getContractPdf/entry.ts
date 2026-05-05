import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }
    
    const { contractId } = await req.json();
    
    if (!contractId) {
      return Response.json({ error: 'Contract ID is required' }, { status: 400 });
    }

    const contract = await base44.asServiceRole.entities.ParentContract.get(contractId);
    
    if (!contract) {
      return Response.json({ error: 'Contract not found' }, { status: 404 });
    }

    // If PDF doesn't exist yet, return error asking to generate first
    if (!contract.signed_pdf_url) {
      return Response.json({ 
        error: 'PDF not yet generated. Please wait for contract submission to complete.' 
      }, { status: 404 });
    }

    return Response.json({ 
      success: true, 
      pdfUrl: contract.signed_pdf_url,
      fileName: `Contract_${contract.student_first_name}_${contract.student_last_name}.pdf`
    });
  } catch (error) {
    console.error('Error fetching contract PDF:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});