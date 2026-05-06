import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req: Request) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles").select("role").eq("id", user.id).single();
    if (!profile || profile.role !== "admin") {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }

    const { contractId } = await req.json();
    if (!contractId) {
      return new Response(JSON.stringify({ error: "Contract ID required" }), { status: 400 });
    }

    const { data: contract } = await supabase
      .from("parent_contracts").select("signed_pdf_url").eq("id", contractId).single();
    if (!contract?.signed_pdf_url) {
      return new Response(JSON.stringify({ success: false, error: "PDF not generated yet" }), { status: 404 });
    }

    return new Response(JSON.stringify({ success: true, pdfUrl: contract.signed_pdf_url }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
