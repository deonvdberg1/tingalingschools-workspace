import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@2.5.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { contractId } = await req.json();
    
    if (!contractId) {
      return Response.json({ error: 'Contract ID is required' }, { status: 400 });
    }

    const contract = await base44.asServiceRole.entities.ParentContract.get(contractId);
    
    if (!contract) {
      return Response.json({ error: 'Contract not found' }, { status: 404 });
    }

    const doc = new jsPDF();
    let yPos = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const leftMargin = 20;
    const rightMargin = pageWidth - 20;
    const contentWidth = rightMargin - leftMargin;

    const addText = (text, size = 10, style = 'normal', align = 'left') => {
      doc.setFontSize(size);
      doc.setFont('helvetica', style);
      
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      
      if (align === 'center') {
        doc.text(text, pageWidth / 2, yPos, { align: 'center' });
      } else {
        const lines = doc.splitTextToSize(text, contentWidth);
        doc.text(lines, leftMargin, yPos);
        yPos += lines.length * (size * 0.4);
      }
      yPos += 5;
    };

    const addSection = (title) => {
      yPos += 5;
      doc.setFillColor(20, 184, 166);
      doc.rect(leftMargin, yPos - 5, contentWidth, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(title, leftMargin + 3, yPos);
      doc.setTextColor(0, 0, 0);
      yPos += 10;
    };

    // Header
    doc.setFillColor(20, 184, 166);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('TING-A-LING SCHOOL', pageWidth / 2, 18, { align: 'center' });
    doc.setFontSize(14);
    doc.text('Parent Enrollment Contract', pageWidth / 2, 30, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    yPos = 50;

    addText(`Contract Date: ${contract.contract_date || new Date().toISOString().split('T')[0]}`, 10, 'normal', 'left');
    addText(`Contract ID: ${contract.id}`, 9, 'italic', 'left');
    
    // Student Information
    addSection('STUDENT INFORMATION');
    addText(`Full Name: ${contract.student_first_name || ''} ${contract.student_last_name || ''}`, 11, 'bold');
    if (contract.student_date_of_birth) addText(`Date of Birth: ${contract.student_date_of_birth}`);
    if (contract.student_id) addText(`Student ID: ${contract.student_id}`);
    if (contract.school_location) addText(`School Location: ${contract.school_location}`);
    if (contract.special_needs_details) addText(`Special Needs: ${contract.special_needs_details}`);

    // Parent Information
    addSection('PRIMARY PARENT/GUARDIAN');
    addText(`Name: ${contract.parent1_full_name || 'N/A'}`, 11, 'bold');
    if (contract.parent1_id_number) addText(`ID Number: ${contract.parent1_id_number}`);
    if (contract.parent1_relationship) addText(`Relationship: ${contract.parent1_relationship}`);
    if (contract.parent1_email) addText(`Email: ${contract.parent1_email}`);
    if (contract.parent1_phone) addText(`Phone: ${contract.parent1_phone}`);
    if (contract.parent1_address) addText(`Address: ${contract.parent1_address}`);
    if (contract.parent1_employer) addText(`Employer: ${contract.parent1_employer}`);

    if (contract.parent2_full_name) {
      addSection('SECONDARY PARENT/GUARDIAN');
      addText(`Name: ${contract.parent2_full_name}`, 11, 'bold');
      if (contract.parent2_id_number) addText(`ID Number: ${contract.parent2_id_number}`);
      if (contract.parent2_relationship) addText(`Relationship: ${contract.parent2_relationship}`);
      if (contract.parent2_email) addText(`Email: ${contract.parent2_email}`);
      if (contract.parent2_phone) addText(`Phone: ${contract.parent2_phone}`);
      if (contract.parent2_employer) addText(`Employer: ${contract.parent2_employer}`);
    }

    // Emergency Contacts
    addSection('EMERGENCY CONTACTS');
    if (contract.emergency_contact1_name) {
      addText(`Contact 1: ${contract.emergency_contact1_name}`, 10, 'bold');
      if (contract.emergency_contact1_phone || contract.emergency_contact1_relationship) {
        addText(`Phone: ${contract.emergency_contact1_phone || 'N/A'}, Relationship: ${contract.emergency_contact1_relationship || 'N/A'}`);
      }
      if (contract.emergency_contact1_employer) addText(`Employer: ${contract.emergency_contact1_employer}`);
    }
    if (contract.emergency_contact2_name) {
      addText(`Contact 2: ${contract.emergency_contact2_name}`, 10, 'bold');
      if (contract.emergency_contact2_phone || contract.emergency_contact2_relationship) {
        addText(`Phone: ${contract.emergency_contact2_phone || 'N/A'}, Relationship: ${contract.emergency_contact2_relationship || 'N/A'}`);
      }
      if (contract.emergency_contact2_employer) addText(`Employer: ${contract.emergency_contact2_employer}`);
    }

    // Medical Information
    addSection('MEDICAL INFORMATION');
    if (contract.medical_aid_provider) addText(`Medical Aid: ${contract.medical_aid_provider} (${contract.medical_aid_number || 'N/A'})`);
    if (contract.allergies) addText(`Allergies: ${contract.allergies}`);
    if (contract.medical_conditions) addText(`Medical Conditions: ${contract.medical_conditions}`);
    if (contract.medications) addText(`Medications: ${contract.medications}`);
    if (contract.doctor_name) addText(`Doctor: ${contract.doctor_name} (${contract.doctor_phone || 'N/A'})`);
    addText(`Emergency Medical Treatment Consent: ${contract.consent_medical_treatment ? 'YES' : 'NO'}`, 10, 'bold');

    // Authorized Pickup
    if (contract.authorized_pickup_persons && contract.authorized_pickup_persons.length > 0) {
      addSection('AUTHORIZED PICKUP PERSONS');
      contract.authorized_pickup_persons.forEach((person, index) => {
        addText(`${index + 1}. ${person.name} - Phone: ${person.phone}`);
      });
    }

    // Fee Agreement
    addSection('FEE AGREEMENT');
    if (contract.fee_monthly_amount) addText(`Monthly Fee: R${contract.fee_monthly_amount}`, 11, 'bold');
    if (contract.fee_payment_method) addText(`Payment Method: ${contract.fee_payment_method}`);
    if (contract.pickup_time) addText(`Daily Pickup Time: ${contract.pickup_time}`);
    addText(`Payment Schedule: School fees are due on the 2nd of each month, for 11 months (January - November)`);
    addText(`Late Payment Interest: 5% monthly interest on overdue fees`, 10, 'bold');
    addText(`Legal Charges: Legal charges will be billed to parents for collection of overdue fees`, 10, 'bold');
    addText(`Registration Fee Paid: ${contract.registration_fee_paid ? 'YES' : 'NO'}`);

    // Consents
    addSection('CONSENTS & PERMISSIONS');
    addText(`Photos/Videos for School Use: ${contract.consent_photos_videos ? 'YES' : 'NO'}`);
    addText(`Social Media Posting: ${contract.consent_social_media ? 'YES' : 'NO'}`);
    addText(`Field Trips: ${contract.consent_field_trips ? 'YES' : 'NO'}`);

    // Terms
    addSection('TERMS & CONDITIONS AGREEMENT');
    addText(`The undersigned parent(s)/guardian(s) acknowledge and agree to the following:`, 10, 'bold');
    yPos += 3;
    
    addText('CODE OF CONDUCT', 11, 'bold');
    addText('• Parents must ensure their child arrives on time and is collected on time.');
    addText('• Children must be dressed appropriately for school activities.');
    addText('• Parents must notify the school of any changes to contact information.');
    addText('• Respectful communication with staff and other parents is required at all times.');
    addText('• The school has zero tolerance for bullying, violence, or discrimination.');
    yPos += 3;
    
    addText('FEE POLICY', 11, 'bold');
    addText('• School fees are due on the 2nd of each month, for 11 months (January - November).', 10, 'bold');
    addText('• 5% interest monthly will be charged on overdue school fees.', 10, 'bold');
    addText('• Legal charges will be billed to parents for collection of overdue fees.', 10, 'bold');
    addText('• School fees will be revised annually.');
    addText('• Non-payment may result in the child being unable to attend school.');
    addText('• Registration fees are non-refundable.');
    addText('• One month\'s written notice is required for withdrawal.');
    yPos += 3;
    
    addText('ILLNESS & MEDICATION', 11, 'bold');
    addText('• Children who are unwell must stay at home.');
    addText('• Parents will be contacted if a child becomes ill during school hours.');
    addText('• Parents must provide written consent for any medication to be administered.');
    addText('• The school will follow all prescribed medication instructions.');
    yPos += 3;
    
    addText('DISCIPLINE POLICY', 11, 'bold');
    addText('• The school uses positive reinforcement and age-appropriate discipline.');
    addText('• Serious behavioral issues will be discussed with parents.');
    addText('• The school reserves the right to dismiss a child for serious misconduct.');
    yPos += 3;
    
    addText('LIABILITY', 11, 'bold');
    addText('• The school takes all reasonable precautions for child safety.');
    addText('• The school is not liable for loss or damage to personal belongings.');
    addText('• Parents are responsible for ensuring their child is collected by authorized persons only.');
    yPos += 3;
    
    addText('REQUIRED DOCUMENTS', 11, 'bold');
    addText('• Copies of all documents must be handed in or updated with the school\'s admin team: Parent ID, Birth Certificate, Clinic Cards, and Proof of Residence.');
    yPos += 5;
    
    addText(`Code of Conduct Agreement: ${contract.agree_code_of_conduct ? 'AGREED' : 'NOT AGREED'}`, 10, 'bold');
    addText(`Terms & Conditions Agreement: ${contract.agree_terms_conditions ? 'AGREED' : 'NOT AGREED'}`, 10, 'bold');

    // Signatures
    doc.addPage();
    yPos = 20;
    addSection('SIGNATURES');
    
    if (contract.parent1_signature_data) {
      addText(`Primary Parent/Guardian: ${contract.parent1_full_name}`, 11, 'bold');
      try {
        doc.addImage(contract.parent1_signature_data, 'PNG', leftMargin, yPos, 80, 30);
      } catch (e) {
        addText('[Signature Present]', 10, 'italic');
      }
      yPos += 35;
      addText(`Signed on: ${contract.parent1_signature_date ? new Date(contract.parent1_signature_date).toLocaleString() : 'N/A'}`, 9, 'italic');
    }

    if (contract.parent2_signature_data) {
      yPos += 15;
      addText(`Secondary Parent/Guardian: ${contract.parent2_full_name}`, 11, 'bold');
      try {
        doc.addImage(contract.parent2_signature_data, 'PNG', leftMargin, yPos, 80, 30);
      } catch (e) {
        addText('[Signature Present]', 10, 'italic');
      }
      yPos += 35;
      addText(`Signed on: ${contract.parent2_signature_date ? new Date(contract.parent2_signature_date).toLocaleString() : 'N/A'}`, 9, 'italic');
    }

    // Footer
    const totalPages = doc.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text(`Ting-A-Ling School - Confidential Document`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - 20, doc.internal.pageSize.getHeight() - 10, { align: 'right' });
    }

    const pdfBytes = doc.output('arraybuffer');
    
    const fileName = `contract_${contract.student_first_name}_${contract.student_last_name}_${Date.now()}.pdf`;
    
    // Create a proper File object for upload
    const file = new File([pdfBytes], fileName, { type: 'application/pdf' });
    
    const uploadResult = await base44.asServiceRole.integrations.Core.UploadFile({
      file: file
    });

    await base44.asServiceRole.entities.ParentContract.update(contractId, {
      signed_pdf_url: uploadResult.file_url
    });

    // Try to send email, but don't fail if parent isn't registered
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: contract.parent1_email,
        subject: `Ting-A-Ling School - Enrollment Contract for ${contract.student_first_name}`,
        body: `
          <h2>Dear ${contract.parent1_full_name},</h2>
          
          <p>Thank you for completing the enrollment contract for <strong>${contract.student_first_name} ${contract.student_last_name}</strong>.</p>
          
          <p>Your signed contract has been successfully processed. You can download a copy using the link below:</p>
          
          <p><a href="${uploadResult.file_url}" style="background-color: #14b8a6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Download Signed Contract</a></p>
          
          <p>We look forward to welcoming your child to Ting-A-Ling School!</p>
          
          <p>Should you have any questions, please don't hesitate to contact us at tingalingpreprimaryschool@gmail.com.</p>
          
          <p>Best regards,<br>
          <strong>Ting-A-Ling School Team</strong></p>
        `
      });
    } catch (emailError) {
      console.log('Could not send email to parent1:', emailError.message);
    }

    if (contract.parent2_email && contract.parent2_signature_data) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: contract.parent2_email,
          subject: `Ting-A-Ling School - Enrollment Contract for ${contract.student_first_name}`,
          body: `
            <h2>Dear ${contract.parent2_full_name},</h2>
            
            <p>Thank you for co-signing the enrollment contract for <strong>${contract.student_first_name} ${contract.student_last_name}</strong>.</p>
            
            <p>You can download a copy of the signed contract using the link below:</p>
            
            <p><a href="${uploadResult.file_url}" style="background-color: #14b8a6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Download Signed Contract</a></p>
            
            <p>Best regards,<br>
            <strong>Ting-A-Ling School Team</strong></p>
          `
        });
      } catch (emailError) {
        console.log('Could not send email to parent2:', emailError.message);
      }
    }

    return Response.json({
      success: true,
      pdfUrl: uploadResult.file_url,
      message: 'Contract PDF generated and emailed successfully'
    });

  } catch (error) {
    console.error('Error generating contract PDF:', error);
    return Response.json(
      { error: error.message || 'Failed to generate PDF' },
      { status: 500 }
    );
  }
});