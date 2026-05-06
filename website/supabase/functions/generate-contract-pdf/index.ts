import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsPDF } from "npm:jspdf@2.5.1";

serve(async (req: Request) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    // Auto-generate for parent submissions — no admin check needed
    // The service role key handles authorization on the database side

    const { contractId } = await req.json();
    if (!contractId) {
      return new Response(JSON.stringify({ error: "Contract ID required" }), { status: 400 });
    }

    const { data: contract } = await supabase
      .from("parent_contracts").select("*").eq("id", contractId).single();
    if (!contract) {
      return new Response(JSON.stringify({ error: "Contract not found" }), { status: 404 });
    }

    // Generate PDF
    const doc = new jsPDF();
    let yPos = 20;
    const leftMargin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const rightMargin = pageWidth - 20;

    const addText = (text: string, size = 10, style: "normal" | "bold" = "normal", center = false) => {
      doc.setFontSize(size);
      doc.setFont("helvetica", style);
      doc.text(text, center ? pageWidth / 2 : leftMargin, yPos, { align: center ? "center" : "left" });
      yPos += size * 0.4;
    };

    addText("TING-A-LING SCHOOLS", 16, "bold", true);
    addText("Parent Contract", 14, "bold", true);
    addText(`Date: ${new Date(contract.contract_date).toLocaleDateString("en-ZA")}`, 10);
    yPos += 10;
    doc.line(leftMargin, yPos, rightMargin, yPos);
    yPos += 10;

    addText("STUDENT INFORMATION", 12, "bold");
    addText(`Name: ${contract.student_first_name} ${contract.student_last_name}`);
    if (contract.student_dob) addText(`DOB: ${new Date(contract.student_dob).toLocaleDateString("en-ZA")}`);
    if (contract.child_grade) addText(`Grade: ${contract.child_grade}`);
    yPos += 5;

    addText("PARENT/GUARDIAN 1", 12, "bold");
    addText(`Name: ${contract.parent1_full_name}`);
    addText(`Email: ${contract.parent1_email}`);
    addText(`Phone: ${contract.parent1_phone}`);
    if (contract.parent1_address) addText(`Address: ${contract.parent1_address}`);
    if (contract.parent1_id_number) addText(`ID: ${contract.parent1_id_number}`);
    yPos += 5;

    if (contract.parent2_full_name) {
      addText("PARENT/GUARDIAN 2", 12, "bold");
      addText(`Name: ${contract.parent2_full_name}`);
      addText(`Email: ${contract.parent2_email}`);
      addText(`Phone: ${contract.parent2_phone}`);
      yPos += 5;
    }

    addText("EMERGENCY CONTACTS", 12, "bold");
    addText(`1: ${contract.emergency_contact1_name} — ${contract.emergency_contact1_phone} (${contract.emergency_contact1_relationship})`);
    if (contract.emergency_contact2_name) {
      addText(`2: ${contract.emergency_contact2_name} — ${contract.emergency_contact2_phone} (${contract.emergency_contact2_relationship})`);
    }
    yPos += 5;

    addText("School Location: " + (contract.school_location || "Not specified"));
    yPos += 5;

    if (contract.consent_medical_treatment) {
      addText("MEDICAL CONSENT: Given", 12, "bold");
      if (contract.medical_conditions) addText(`Conditions: ${contract.medical_conditions}`);
      if (contract.allergies) addText(`Allergies: ${contract.allergies}`);
      if (contract.doctor_name) addText(`Doctor: ${contract.doctor_name} — ${contract.doctor_phone}`);
      yPos += 5;
    }

    if (contract.signature_date) {
      addText("SIGNED", 12, "bold");
      addText(`Date: ${new Date(contract.signature_date).toLocaleString("en-ZA")}`);
      if (contract.signature_image) {
        try { doc.addImage(contract.signature_image, "PNG", leftMargin, yPos, 60, 20); yPos += 25; } catch {}
      }
    }

    const pdfBuffer = doc.output("arraybuffer");
    const fileName = `contract-${contract.id}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from("contract_pdfs")
      .upload(fileName, new Uint8Array(pdfBuffer), { contentType: "application/pdf", upsert: true });
    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage.from("contract_pdfs").getPublicUrl(fileName);

    await supabase.from("parent_contracts").update({ signed_pdf_url: publicUrl }).eq("id", contractId);

    return new Response(JSON.stringify({ success: true, pdfUrl: publicUrl, contractId }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
