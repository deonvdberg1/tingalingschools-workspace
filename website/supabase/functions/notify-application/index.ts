import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * notify-application Edge Function
 *
 * Called after a parent submits an application form.
 * 1. Sends an email notification to the school (via SMTP env vars if configured)
 * 2. Also saves a copy to contact_submissions as a backup
 *
 * Required env vars (set in Supabase dashboard):
 *   SMTP_HOST       – e.g. smtp.gmail.com
 *   SMTP_PORT       – e.g. 587
 *   SMTP_USER       – SMTP login username
 *   SMTP_PASS       – SMTP login password
 *   NOTIFY_EMAIL    – where to send notifications (default: info@tingalingschools.com)
 *
 * If SMTP is not configured, the function still saves to contact_submissions
 * so the application is visible in the admin dashboard.
 */

serve(async (req: Request) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const {
      school,
      parent_name,
      parent_email,
      parent_phone,
      child_name,
      child_age,
      grade,
      previous_school,
      special_needs,
    } = await req.json();

    const notifyEmail = Deno.env.get("NOTIFY_EMAIL") || "info@tingalingschools.com";

    // Build message
    const specialNeedsLine = special_needs ? `\nSpecial Needs: ${special_needs}` : '';
    const gradeLine = grade ? `\nGrade: ${grade}` : '';
    const prevSchoolLine = previous_school ? `\nPrevious School: ${previous_school}` : '';

    const subject = `New Application: ${school}`;
    const textBody = [
      `NEW APPLICATION — ${school}`,
      ``,
      `Parent:  ${parent_name}`,
      `Email:   ${parent_email}`,
      `Phone:   ${parent_phone}`,
      `Child:   ${child_name}`,
      `Age:     ${child_age}`,
      gradeLine,
      prevSchoolLine,
      specialNeedsLine,
      ``,
      `---`,
      `Submitted: ${new Date().toISOString()}`,
    ].join("\n");

    // 1. Save to contact_submissions as fallback
    await supabase.from("contact_submissions").insert({
      name: parent_name,
      email: parent_email,
      phone: parent_phone,
      subject: `Application: ${school} – ${child_name}`,
      message: textBody,
    }).select().single();

    // 2. Try to send email via SMTP (if configured)
    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpUser = Deno.env.get("SMTP_USER");
    const smtpPass = Deno.env.get("SMTP_PASS");

    if (smtpHost && smtpUser && smtpPass) {
      try {
        const smtpPort = Deno.env.get("SMTP_PORT") || "587";
        const htmlBody = `
<h2>New Application — ${school}</h2>
<table style="border-collapse:collapse;width:100%;max-width:600px;font-family:sans-serif;">
  <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Parent</td><td style="padding:8px;border:1px solid #ddd;">${parent_name}</td></tr>
  <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Email</td><td style="padding:8px;border:1px solid #ddd;">${parent_email}</td></tr>
  <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Phone</td><td style="padding:8px;border:1px solid #ddd;">${parent_phone}</td></tr>
  <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Child</td><td style="padding:8px;border:1px solid #ddd;">${child_name}</td></tr>
  <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Age</td><td style="padding:8px;border:1px solid #ddd;">${child_age}</td></tr>
  ${grade ? `<tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Grade</td><td style="padding:8px;border:1px solid #ddd;">${grade}</td></tr>` : ''}
  ${previous_school ? `<tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Previous School</td><td style="padding:8px;border:1px solid #ddd;">${previous_school}</td></tr>` : ''}
  ${special_needs ? `<tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Special Needs</td><td style="padding:8px;border:1px solid #ddd;">${special_needs}</td></tr>` : ''}
</table>
<p style="color:#888;font-size:12px;">Submitted: ${new Date().toISOString()}</p>
`;

        const msg = [
          `From: Ting-A-Ling Schools <${smtpUser}>`,
          `To: ${notifyEmail}`,
          `Subject: ${subject}`,
          "MIME-Version: 1.0",
          "Content-Type: text/html; charset=utf-8",
          "",
          htmlBody,
        ].join("\r\n");

        const conn = await Deno.connectTls({
          hostname: smtpHost,
          port: parseInt(smtpPort),
        });

        const writer = conn.writable.getWriter();
        const reader = conn.readable.getReader();
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();

        const write = async (s: string) => {
          await writer.write(encoder.encode(s + "\r\n"));
        };
        const readOnce = async (): Promise<string> => {
          const { value } = await reader.read();
          return decoder.decode(value);
        };

        await readOnce();
        await write(`EHLO tingalingschools.com`);
        // Drain EHLO banner
        for (let i = 0; i < 12; i++) {
          const line = await readOnce();
          if (line.includes("250 ") && !line.startsWith("250-")) break;
        }

        await write("AUTH LOGIN");
        await readOnce();
        await write(btoa(smtpUser));
        await readOnce();
        await write(btoa(smtpPass));
        await readOnce();

        await write(`MAIL FROM:<${smtpUser}>`);
        await readOnce();
        await write(`RCPT TO:<${notifyEmail}>`);
        await readOnce();
        await write("DATA");
        await readOnce();
        await write(msg);
        await write(".");
        await readOnce();
        await write("QUIT");

        writer.releaseLock();
        reader.releaseLock();
        conn.close();

        console.log(`Email sent to ${notifyEmail}`);
      } catch (smtpErr) {
        console.error("SMTP failed (data saved to contact_submissions):", smtpErr.message);
      }
    } else {
      console.log("SMTP not configured. Application saved to contact_submissions.");
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("notify-application error:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }
});
