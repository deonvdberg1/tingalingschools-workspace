import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsPDF } from "npm:jspdf@2.5.1";

serve(async (req: Request) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const formData = await req.json();
    
    // Validate required fields
    if (!formData.student_first_name || !formData.student_last_name || 
        !formData.parent1_full_name || !formData.parent1_email || !formData.parent1_phone) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Set defaults
    formData.status = "signed";
    formData.contract_date = formData.contract_date || new Date().toISOString().split("T")[0];

    // Save contract
    const { data: contract, error: insertError } = await supabase
      .from("parent_contracts")
      .insert(formData)
      .select()
      .single();

    if (insertError) throw insertError;

    // Generate PDF
    try {
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

      addText("STUDENT", 12, "bold");
      addText(`${contract.student_first_name} ${contract.student_last_name}`);
      if (contract.student_dob) addText(`DOB: ${new Date(contract.student_dob).toLocaleDateString("en-ZA")}`);
      yPos += 5;

      addText("PARENT/GUARDIAN", 12, "bold");
      addText(`Name: ${contract.parent1_full_name}`);
      addText(`Email: ${contract.parent1_email}`);
      addText(`Phone: ${contract.parent1_phone}`);
      yPos += 5;

      addText("EMERGENCY CONTACT", 12, "bold");
      addText(`${contract.emergency_contact1_name} — ${contract.emergency_contact1_phone} (${contract.emergency_contact1_relationship})`);
      
      addText("School: " + (contract.school_location || "Not specified"), 10);
      
      if (contract.signature_date) {
        yPos += 5;
        addText("SIGNED", 12, "bold");
        addText(`Date: ${new Date(contract.signature_date).toLocaleString("en-ZA")}`);
      }

      const pdfBuffer = doc.output("arraybuffer");
      const fileName = `contract-${contract.id}.pdf`;

      const { error: uploadError } = await supabase.storage
        .from("contract_pdfs")
        .upload(fileName, new Uint8Array(pdfBuffer), { contentType: "application/pdf", upsert: true });
      
      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from("contract_pdfs").getPublicUrl(fileName);
        await supabase.from("parent_contracts").update({ signed_pdf_url: publicUrl }).eq("id", contract.id);
        
        return new Response(JSON.stringify({ success: true, pdfUrl: publicUrl, contractId: contract.id }), {
          headers: { "Content-Type": "application/json" }
        });
      }
    } catch (pdfErr) {
      console.error("PDF generation failed:", pdfErr);
    }

    return new Response(JSON.stringify({ success: true, contractId: contract.id }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
