import nodemailer from "nodemailer";
import { publicSiteUrl } from "@/lib/site-url";
import { formatDate, formatMoney } from "@/lib/format";

export type AssignmentNotificationParams = {
  assignmentId: string;
  clientId: string;
  token: string;
  studentName: string;
  studentEmail?: string | null;
  contactNumber: string;
  university: string;
  programme?: string | null;
  moduleName?: string | null;
  assignmentTitle: string;
  serviceType: string;
  academicLevel?: string | null;
  deadline: string;
  isGroup: boolean;
  groupMembers?: number | null;
  description: string;
  specialInstructions?: string | null;
  priceRange?: string | null;
  quotedAmount?: number | null;
  currency?: string;
  calcDetails?: any;
  businessEmail?: string | null;
  whatsappNumber?: string | null;
};

function getSmtpConfig() {
  const host = process.env.SMTP_HOST || (process.env.GMAIL_USER ? "smtp.gmail.com" : "");
  const port = Number(process.env.SMTP_PORT || (host === "smtp.gmail.com" ? 465 : 587));
  const user = (process.env.SMTP_USER || process.env.GMAIL_USER || "").trim();
  const rawPass = (process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || "").trim();
  const pass = host === "smtp.gmail.com" ? rawPass.replace(/\s+/g, "") : rawPass;
  const secure = process.env.SMTP_SECURE === "true" || port === 465;
  const senderName = process.env.SMTP_NAME || "StHelp";
  const from = process.env.SMTP_FROM || (user ? `"${senderName}" <${user}>` : "");

  if (!host || !user || !pass) {
    return null;
  }

  return { host, port, secure, user, pass, from };
}

async function sendViaResend(to: string, subject: string, html: string, text: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  const from = process.env.RESEND_FROM || process.env.SMTP_FROM || "StHelp <onboarding@resend.dev>";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
      text
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[Email Notification] Resend API error:", response.status, errorText);
    return false;
  }

  return true;
}

export async function sendEmail({
  to,
  subject,
  html,
  text
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<boolean> {
  const targetEmail = to.trim();
  if (!targetEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(targetEmail)) {
    console.warn(`[Email Notification] Invalid recipient email: "${to}"`);
    return false;
  }

  // 1. Try Resend if configured
  if (process.env.RESEND_API_KEY) {
    try {
      const sent = await sendViaResend(targetEmail, subject, html, text);
      if (sent) return true;
    } catch (error) {
      console.error("[Email Notification] Resend sending failed:", error);
    }
  }

  // 2. Try SMTP / Free Gmail
  const smtp = getSmtpConfig();
  if (smtp) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtp.host,
        port: smtp.port,
        secure: smtp.secure,
        auth: {
          user: smtp.user,
          pass: smtp.pass
        }
      });

      await transporter.sendMail({
        from: smtp.from,
        to: targetEmail,
        subject,
        html,
        text
      });

      return true;
    } catch (error) {
      console.error("[Email Notification] SMTP sending failed:", error);
      return false;
    }
  }

  console.warn(
    `[Email Notification] Email not sent to ${targetEmail} — No free SMTP or Resend credentials configured. ` +
    `Add SMTP_USER & SMTP_PASS (or GMAIL_USER & GMAIL_APP_PASSWORD) in your environment to enable automatic emails.`
  );
  return false;
}

function emailWrapper(content: string, previewText: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>StHelp Notification</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; line-height: 1.6; }
    .wrapper { width: 100%; max-width: 620px; margin: 0 auto; padding: 24px 16px; box-sizing: border-box; }
    .card { background: #ffffff; border-radius: 14px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.04); }
    .header { background: #15805d; padding: 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.02em; }
    .header p { margin: 6px 0 0 0; font-size: 13px; opacity: 0.9; }
    .content { padding: 28px 24px; }
    .badge { display: inline-block; background: #dcfce7; color: #166534; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px; }
    .highlight-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 16px 20px; margin: 20px 0; }
    .highlight-title { font-size: 12px; font-weight: 700; text-transform: uppercase; color: #166534; letter-spacing: 0.05em; margin-bottom: 4px; }
    .highlight-value { font-size: 20px; font-weight: 800; color: #15805d; }
    .table-details { width: 100%; border-collapse: collapse; margin: 18px 0; font-size: 14px; }
    .table-details td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; }
    .table-details td.label { width: 38%; color: #64748b; font-weight: 500; }
    .table-details td.value { width: 62%; color: #0f172a; font-weight: 600; }
    .button-container { text-align: center; margin: 28px 0 16px; }
    .button { display: inline-block; background: #15805d; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 15px; padding: 14px 28px; border-radius: 8px; box-shadow: 0 4px 12px rgba(21, 128, 93, 0.25); }
    .button-secondary { display: inline-block; background: #f1f5f9; color: #334155 !important; text-decoration: none; font-weight: 600; font-size: 14px; padding: 10px 20px; border-radius: 6px; margin: 4px; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; }
    .footer a { color: #64748b; text-decoration: underline; }
  </style>
</head>
<body>
  <div style="display:none;font-size:1px;color:#333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${previewText}
  </div>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <h1>StHelp Academic Support</h1>
        <p>Private Academic Portal & Assignment Tracking</p>
      </div>
      <div class="content">
        ${content}
      </div>
    </div>
    <div class="footer">
      <p style="margin: 0 0 6px 0;">StHelp Academic Support Services · Sri Lanka</p>
      <p style="margin: 0;">Online academic research, software & coursework assistance</p>
    </div>
  </div>
</body>
</html>`;
}

export async function sendAssignmentNotifications(params: AssignmentNotificationParams) {
  const baseUrl = publicSiteUrl();
  const portalUrl = `${baseUrl}/portal/${params.token}`;
  const adminUrl = `${baseUrl}/admin/assignments/${params.assignmentId}`;
  const currency = params.currency || "LKR";

  const priceText = params.priceRange || (params.quotedAmount ? formatMoney(params.quotedAmount, currency) : "Quotation under review");

  // 1. Send confirmation email to Customer (if email was provided)
  if (params.studentEmail) {
    const preview = `Your assignment order (${params.clientId}) has been received. Track your quote & progress in your client portal.`;
    const customerHtmlContent = `
      <span class="badge">Order Confirmed</span>
      <h2 style="margin: 0 0 10px 0; font-size: 20px; color: #0f172a;">Hello, ${escapeHtml(params.studentName)}! 👋</h2>
      <p style="margin: 0 0 16px 0; color: #475569; font-size: 15px;">
        Thank you for submitting your assignment support request to <strong>StHelp</strong>. We have successfully registered your request and created your private client portal.
      </p>

      <div class="highlight-box">
        <div class="highlight-title">Estimated Price Range / Initial Value</div>
        <div class="highlight-value">${escapeHtml(priceText)}</div>
        <div style="font-size: 12px; color: #475569; margin-top: 4px;">
          Our academic team is reviewing your requirements. We will confirm the final quote directly in your portal before any payment is required.
        </div>
      </div>

      <table class="table-details">
        <tr><td class="label">Client ID</td><td class="value">${escapeHtml(params.clientId)}</td></tr>
        <tr><td class="label">Assignment Title</td><td class="value">${escapeHtml(params.assignmentTitle)}</td></tr>
        ${params.moduleName ? `<tr><td class="label">Module / Subject</td><td class="value">${escapeHtml(params.moduleName)}</td></tr>` : ""}
        <tr><td class="label">University / Institute</td><td class="value">${escapeHtml(params.university)}</td></tr>
        ${params.academicLevel ? `<tr><td class="label">Academic Level</td><td class="value">${escapeHtml(params.academicLevel)}</td></tr>` : ""}
        <tr><td class="label">Required Deadline</td><td class="value">${escapeHtml(formatDate(params.deadline))}</td></tr>
        <tr><td class="label">Support Type</td><td class="value">${escapeHtml(params.serviceType)}</td></tr>
      </table>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin: 18px 0;">
        <strong style="color: #0f172a; font-size: 13px; text-transform: uppercase; letter-spacing: 0.04em;">Your Submitted Assignment Brief:</strong>
        <p style="white-space: pre-wrap; font-size: 13px; color: #475569; margin: 6px 0 0 0;">${escapeHtml(params.description)}</p>
        ${params.specialInstructions ? `<p style="font-size: 12px; color: #64748b; margin: 8px 0 0 0;"><strong>Special Instructions:</strong> ${escapeHtml(params.specialInstructions)}</p>` : ""}
      </div>

      <div class="button-container">
        <a href="${portalUrl}" class="button" target="_blank">
          🚀 Open My Private Client Portal
        </a>
      </div>

      <p style="font-size: 13px; color: #64748b; text-align: center; margin: 12px 0 20px 0;">
        Bookmark your portal link to check status, review quotation, download files, and send feedback.
      </p>

      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 16px; margin: 20px 0; text-align: center;">
        <strong style="color: #166534; font-size: 14px; display: block; margin-bottom: 6px;">Need quick answers or want to discuss your brief?</strong>
        <p style="font-size: 13px; color: #334155; margin: 0 0 12px 0;">Our academic support team is available on WhatsApp:</p>
        <a href="https://wa.me/${(params.whatsappNumber || "94782067550").replace(/\D/g, "")}?text=${encodeURIComponent(`Hello StHelp Team, I just placed an assignment order. My Client ID is ${params.clientId}.`)}" style="display: inline-block; background: #25D366; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 22px; border-radius: 8px; box-shadow: 0 4px 10px rgba(37, 211, 102, 0.25);" target="_blank">
          💬 Chat on WhatsApp (+${(params.whatsappNumber || "94782067550").replace(/\D/g, "")})
        </a>
      </div>
    `;

    const customerHtml = emailWrapper(customerHtmlContent, preview);
    const customerText = `Hello ${params.studentName},\n\n` +
      `Thank you for placing your assignment request with StHelp.\n\n` +
      `Order Details:\n` +
      `• Client ID: ${params.clientId}\n` +
      `• Assignment: ${params.assignmentTitle}\n` +
      `• Deadline: ${formatDate(params.deadline)}\n` +
      `• Estimated Price: ${priceText}\n\n` +
      `Access your private client portal here:\n${portalUrl}\n\n` +
      `WhatsApp Support: +${(params.whatsappNumber || "94782067550").replace(/\D/g, "")}\n\n` +
      `Best regards,\nStHelp Academic Team`;

    sendEmail({
      to: params.studentEmail,
      subject: `Order Confirmation: ${params.assignmentTitle} [${params.clientId}] — StHelp`,
      html: customerHtml,
      text: customerText
    }).catch((err) => console.error("[Email Notification] Error sending to customer:", err));
  }

  // 2. Send notification email to Admin ("To me")
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || "gayanthanadeemal@gmail.com";
  if (adminEmail) {
    const adminPreview = `New order from ${params.studentName} (${params.clientId}): ${params.assignmentTitle}`;
    const calcDetailsBlock = params.calcDetails ? `
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin: 14px 0; font-size: 13px;">
        <strong style="color: #15805d;">Calculator Estimate Details:</strong><br>
        • Area: ${escapeHtml(params.calcDetails.categoryLabel || params.calcDetails.category || "—")}<br>
        • Scope: ${escapeHtml(params.calcDetails.scope || "—")}<br>
        • Level: ${escapeHtml(params.calcDetails.level || "—")}<br>
        • Turnaround: ${escapeHtml(params.calcDetails.turnaround || "—")}<br>
        • Add-ons: ${escapeHtml(params.calcDetails.addons || "None")}<br>
        • Range: <strong>${escapeHtml(params.calcDetails.estimateRange || priceText)}</strong>
      </div>
    ` : "";

    const adminHtmlContent = `
      <span class="badge" style="background:#fef3c7; color:#92400e;">New Assignment Request</span>
      <h2 style="margin: 0 0 10px 0; font-size: 20px; color: #0f172a;">New Order: ${escapeHtml(params.studentName)}</h2>
      <p style="margin: 0 0 16px 0; color: #475569; font-size: 14px;">
        A new assignment support request was just submitted online.
      </p>

      <div class="highlight-box">
        <div class="highlight-title">Quoted / Estimated Price</div>
        <div class="highlight-value">${escapeHtml(priceText)}</div>
      </div>

      <table class="table-details">
        <tr><td class="label">Client ID</td><td class="value">${escapeHtml(params.clientId)}</td></tr>
        <tr><td class="label">Student Name</td><td class="value">${escapeHtml(params.studentName)}</td></tr>
        <tr><td class="label">Phone / WhatsApp</td><td class="value"><a href="https://wa.me/${params.contactNumber.replace(/\D/g, "")}" style="color:#15805d;">${escapeHtml(params.contactNumber)}</a></td></tr>
        <tr><td class="label">Student Email</td><td class="value">${escapeHtml(params.studentEmail || "Not provided")}</td></tr>
        <tr><td class="label">University</td><td class="value">${escapeHtml(params.university)}</td></tr>
        ${params.programme ? `<tr><td class="label">Programme</td><td class="value">${escapeHtml(params.programme)}</td></tr>` : ""}
        ${params.moduleName ? `<tr><td class="label">Module</td><td class="value">${escapeHtml(params.moduleName)}</td></tr>` : ""}
        <tr><td class="label">Assignment Title</td><td class="value"><strong>${escapeHtml(params.assignmentTitle)}</strong></td></tr>
        <tr><td class="label">Deadline</td><td class="value">${escapeHtml(formatDate(params.deadline))}</td></tr>
        <tr><td class="label">Group Work</td><td class="value">${params.isGroup ? `Yes (${params.groupMembers} members)` : "No"}</td></tr>
      </table>

      ${calcDetailsBlock}

      <div style="margin: 18px 0; font-size: 13px;">
        <strong>Task Description:</strong>
        <p style="whiteSpace: pre-wrap; background: #f8fafc; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0; margin: 4px 0 12px 0;">${escapeHtml(params.description)}</p>
        ${params.specialInstructions ? `
          <strong>Special Instructions:</strong>
          <p style="whiteSpace: pre-wrap; background: #f8fafc; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0; margin: 4px 0;">${escapeHtml(params.specialInstructions)}</p>
        ` : ""}
      </div>

      <div class="button-container">
        <a href="${adminUrl}" class="button" target="_blank" style="margin-right: 8px;">
          🛠️ Open in Admin Dashboard
        </a>
        <a href="${portalUrl}" class="button-secondary" target="_blank">
          👁️ Client View
        </a>
      </div>
    `;

    const adminHtml = emailWrapper(adminHtmlContent, adminPreview);
    const adminText = `🚨 New Assignment Order Received!\n\n` +
      `Client ID: ${params.clientId}\n` +
      `Student: ${params.studentName} (${params.contactNumber})\n` +
      `Email: ${params.studentEmail || "None"}\n` +
      `University: ${params.university}\n` +
      `Assignment: ${params.assignmentTitle}\n` +
      `Deadline: ${formatDate(params.deadline)}\n` +
      `Estimated Price: ${priceText}\n\n` +
      `Admin Dashboard: ${adminUrl}\n` +
      `Client Portal: ${portalUrl}`;

    sendEmail({
      to: adminEmail,
      subject: `🚨 [New Order] ${params.studentName} — ${params.assignmentTitle} (${params.clientId})`,
      html: adminHtml,
      text: adminText
    }).catch((err) => console.error("[Email Notification] Error sending to admin:", err));
  }
}

function escapeHtml(str?: string | null): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
