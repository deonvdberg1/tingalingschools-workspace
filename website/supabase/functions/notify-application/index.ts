import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req: Request) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { school, parent_name, parent_email, parent_phone, child_name, child_age, grade, previous_school, special_needs } = body;
    const notifyEmail = Deno.env.get("NOTIFY_EMAIL") || "info@tingalingschools.com";

    // Save to contact_submissions (admin dashboard fallback)
    await supabase.from("contact_submissions").insert({
      name: parent_name || "Unknown",
      email: parent_email || "",
      phone: parent_phone || "",
      subject: `Application: ${school || "Unknown"} – ${child_name || ""}`,
      message: [
        `School: ${school}`,
        `Parent: ${parent_name}`,
        `Email: ${parent_email}`,
        `Phone: ${parent_phone}`,
        `Child: ${child_name}`,
        `Age: ${child_age}`,
        grade ? `Grade: ${grade}` : null,
        previous_school ? `Previous: ${previous_school}` : null,
        special_needs ? `Special Needs: ${special_needs}` : null,
        ``,
        `Submitted: ${new Date().toISOString()}`,
      ].filter(Boolean).join("\n"),
    });

    // Send email via SMTP
    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpUser = Deno.env.get("SMTP_USER");
    const smtpPass = Deno.env.get("SMTP_PASS");

    if (smtpHost && smtpUser && smtpPass) {
      try {
        const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "587");

        const htmlRows = [
          `<tr><td style="padding:8px 12px;border:1px solid #ddd;font-weight:bold;background:#f9f9f9;">Parent</td><td style="padding:8px 12px;border:1px solid #ddd;">${parent_name || ""}</td></tr>`,
          `<tr><td style="padding:8px 12px;border:1px solid #ddd;font-weight:bold;background:#f9f9f9;">Email</td><td style="padding:8px 12px;border:1px solid #ddd;">${parent_email || ""}</td></tr>`,
          `<tr><td style="padding:8px 12px;border:1px solid #ddd;font-weight:bold;background:#f9f9f9;">Phone</td><td style="padding:8px 12px;border:1px solid #ddd;">${parent_phone || ""}</td></tr>`,
          `<tr><td style="padding:8px 12px;border:1px solid #ddd;font-weight:bold;background:#f9f9f9;">Child</td><td style="padding:8px 12px;border:1px solid #ddd;">${child_name || ""}</td></tr>`,
          `<tr><td style="padding:8px 12px;border:1px solid #ddd;font-weight:bold;background:#f9f9f9;">Age</td><td style="padding:8px 12px;border:1px solid #ddd;">${child_age || ""}</td></tr>`,
        ];
        if (grade) htmlRows.push(`<tr><td style="padding:8px 12px;border:1px solid #ddd;font-weight:bold;background:#f9f9f9;">Grade</td><td style="padding:8px 12px;border:1px solid #ddd;">${grade}</td></tr>`);
        if (previous_school) htmlRows.push(`<tr><td style="padding:8px 12px;border:1px solid #ddd;font-weight:bold;background:#f9f9f9;">Previous School</td><td style="padding:8px 12px;border:1px solid #ddd;">${previous_school}</td></tr>`);
        if (special_needs) htmlRows.push(`<tr><td style="padding:8px 12px;border:1px solid #ddd;font-weight:bold;background:#f9f9f9;">Special Needs</td><td style="padding:8px 12px;border:1px solid #ddd;">${special_needs}</td></tr>`);

        const htmlBody = `
<html><body style="font-family:sans-serif;padding:20px;">
<h2 style="color:#0f766e;">New Application — ${school}</h2>
<table style="border-collapse:collapse;width:100%;max-width:500px;">${htmlRows.join("\n")}</table>
<p style="color:#888;font-size:12px;margin-top:20px;">Submitted: ${new Date().toISOString()}</p>
</body></html>`;

        const raw = [
          `From: "Ting-A-Ling Schools" <${smtpUser}>`,
          `To: ${notifyEmail}`,
          `Subject: New Application: ${school} – ${child_name || parent_name}`,
          `MIME-Version: 1.0`,
          `Content-Type: text/html; charset="utf-8"`,
          `Content-Transfer-Encoding: 7bit`,
          ``,
          htmlBody,
        ].join("\r\n");

        // SMTP via Deno TCP
        const conn = await Deno.connectTls({ hostname: smtpHost, port: smtpPort });
        const w = conn.writable.getWriter();
        const r = conn.readable.getReader();
        const enc = new TextEncoder();
        const dec = new TextDecoder();
        const rd = async () => { const { value } = await r.read(); return dec.decode(value || new Uint8Array()); };
        const wr = async (s: string) => { await w.write(enc.encode(s + "\r\n")); };

        await rd();
        await wr(`EHLO tingalingschools.com`);
        // Drain EHLO
        for (let i = 0; i < 15; i++) { const l = await rd(); if (l.includes("250 ") && !l.startsWith("250-")) break; }
        await wr(`AUTH LOGIN`);
        await rd();
        await wr(btoa(smtpUser));
        await rd();
        await wr(btoa(smtpPass));
        await rd();
        await wr(`MAIL FROM:<${smtpUser}>`);
        await rd();
        await wr(`RCPT TO:<${notifyEmail}>`);
        await rd();
        await wr(`DATA`);
        await rd();
        // Send raw message line by line to avoid Deno content parsing issues
        for (const line of raw.split("\r\n")) {
          await w.write(enc.encode(line + "\r\n"));
        }
        await wr(``);
        await wr(`.`);
        await rd();
        await wr(`QUIT`);

        w.releaseLock();
        r.releaseLock();
        conn.close();
      } catch (_e) {
        // SMTP failed — data is already saved in contact_submissions
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
});
