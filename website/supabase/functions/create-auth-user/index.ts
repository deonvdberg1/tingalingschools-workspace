import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req: Request) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { email, password, full_name, role } = await req.json();

    if (!email || !password || !full_name || !role) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
    }

    // Parent accounts can be created publicly
    // Admin/staff accounts require superadmin auth
    if (role !== 'parent') {
      const authHeader = req.headers.get("Authorization") || "";
      const token = authHeader.replace("Bearer ", "");
      const { data: { user: caller }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !caller) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
      }
      const { data: profile } = await supabase
        .from("profiles").select("role").eq("id", caller.id).single();
      if (!profile || profile.role !== "superadmin") {
        return new Response(JSON.stringify({ error: "Only superadmin can create admin/staff accounts" }), { status: 403 });
      }
    }

    if (!["admin", "staff", "parent"].includes(role)) {
      return new Response(JSON.stringify({ error: "Invalid role" }), { status: 400 });
    }

    // Create the auth user
    const { data: authUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role }
    });

    if (createError) throw createError;

    return new Response(JSON.stringify({
      success: true,
      user: { id: authUser.user.id, email: authUser.user.email, role }
    }), { headers: { "Content-Type": "application/json" } });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
