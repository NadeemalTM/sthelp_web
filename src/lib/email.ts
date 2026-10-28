import nodemailer from "nodemailer";
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

// Returns SMTP configuration with environment variable support and fallback
function getSmtpConfig() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || (host === "smtp.gmail.com" ? 465 : 587));
  const user = (process.env.SMTP_USER || process.env.GMAIL_USER || "assignment.sthelp@gmail.com").trim();
  const rawPass = (process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || "lzvlslxrzlmgspth").trim();
  const pass = host === "smtp.gmail.com" ? rawPass.replace(/\s+/g, "") : rawPass;
  const secure = process.env.SMTP_SECURE === "true" || port === 465;
  const senderName = process.env.SMTP_NAME || "StHelp";
  const from = `"${senderName}" <${user}>`;

  if (!host || !user || !pass) {
    return null;
  }

  return { host, port, secure, user, pass, from };
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
  replyTo
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}): Promise<boolean> {
  const targetEmail = to.trim();
  if (!targetEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(targetEmail)) {
    console.warn(`[Email Notification] Invalid recipient email: "${to}"`);
    return false;
  }

  const smtp = getSmtpConfig();
  if (!smtp) {
    console.error("[Email Notification] SMTP configuration missing.");
    return false;
  }

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

    const info = await transporter.sendMail({
      from: smtp.from,
      to: targetEmail,
      replyTo: replyTo || smtp.user,
      subject,
      html,
      text,
      headers: {
        "X-Entity-Ref-ID": `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      }
    });

    console.log(`[Email Notification] Email sent successfully to ${targetEmail} (Message ID: ${info.messageId})`);
    return true;
  } catch (error) {
    console.error(`[Email Notification] SMTP send error to ${targetEmail}:`, error);
    return false;
  }
}

function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>StHelp Notification</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background-color: #f1f5f9; padding: 24px 0;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; margin: 0 16px;">
          <tr>
            <td style="background-color: #15805d; padding: 24px 28px; text-align: left;">
              <h1 style="margin: 0; font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: -0.01em;">StHelp Academic Support</h1>
              <p style="margin: 4px 0 0 0; font-size: 13px; color: #dcfce7;">Order Confirmation &amp; Workspace Access</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 28px 28px 24px 28px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 28px; text-align: center; font-size: 12px; color: #64748b; line-height: 1.6;">
              <p style="margin: 0 0 4px 0; font-weight: 600; color: #334155;">StHelp Academic Support Services</p>
              <p style="margin: 0 0 4px 0;">Colombo, Sri Lanka · WhatsApp: +94 78 206 7550</p>
              <p style="margin: 0;"><a href="https://www.sthelp.edu.lk" style="color: #15805d; text-decoration: none;">www.sthelp.edu.lk</a> · Support: assignment.sthelp@gmail.com</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendAssignmentNotifications(params: AssignmentNotificationParams): Promise<{ customerSent: boolean; adminSent: boolean }> {
  // Always use HTTPS production domain for links in emails (never localhost, which triggers spam filters)
  const configured = process.env.NEXT_PUBLIC_APP_URL || "https://www.sthelp.edu.lk";
  const baseUrl = configured.includes("localhost") ? "https://www.sthelp.edu.lk" : configured;

  const portalUrl = `${baseUrl}/portal/${params.token}`;
  const adminUrl = `${baseUrl}/admin/assignments/${params.assignmentId}`;
  const currency = params.currency || "LKR";
  const cleanWa = (params.whatsappNumber || "94782067550").replace(/\D/g, "");

  const priceText = params.priceRange || (params.quotedAmount ? formatMoney(params.quotedAmount, currency) : "Quotation under review");

  const results = { customerSent: false, adminSent: false };
  const sendJobs: Promise<void>[] = [];

  // 1. Send confirmation email to Customer (if email was provided)
  if (params.studentEmail && params.studentEmail.trim()) {
    const customerHtmlContent = `
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #0f172a;">Hello <strong>${escapeHtml(params.studentName)}</strong>,</p>
      <p style="margin: 0 0 16px 0; color: #475569; font-size: 14px; line-height: 1.6;">
        Thank you for submitting your assignment request to <strong>StHelp Academic Support</strong>. We have registered your request and created your private workspace portal.
      </p>

      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px 18px; margin: 18px 0;">
        <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #166534; letter-spacing: 0.05em; margin-bottom: 4px;">Estimated Quotation Range</div>
        <div style="font-size: 20px; font-weight: 800; color: #15805d;">${escapeHtml(priceText)}</div>
        <div style="font-size: 12px; color: #475569; margin-top: 4px;">
          Our academic team is reviewing your requirements and will confirm final details directly in your portal.
        </div>
      </div>

      <table width="100%" cellpadding="6" cellspacing="0" border="0" role="presentation" style="font-size: 14px; margin: 18px 0; border-collapse: collapse;">
        <tr><td style="color: #64748b; width: 38%; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">Client Reference</td><td style="color: #0f172a; font-weight: 600; width: 62%; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">${escapeHtml(params.clientId)}</td></tr>
        <tr><td style="color: #64748b; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">Assignment Title</td><td style="color: #0f172a; font-weight: 600; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">${escapeHtml(params.assignmentTitle)}</td></tr>
        ${params.moduleName ? `<tr><td style="color: #64748b; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">Module / Subject</td><td style="color: #0f172a; font-weight: 600; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">${escapeHtml(params.moduleName)}</td></tr>` : ""}
        <tr><td style="color: #64748b; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">University / Institute</td><td style="color: #0f172a; font-weight: 600; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">${escapeHtml(params.university)}</td></tr>
        ${params.academicLevel ? `<tr><td style="color: #64748b; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">Academic Level</td><td style="color: #0f172a; font-weight: 600; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">${escapeHtml(params.academicLevel)}</td></tr>` : ""}
        <tr><td style="color: #64748b; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">Required Deadline</td><td style="color: #0f172a; font-weight: 600; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">${escapeHtml(formatDate(params.deadline))}</td></tr>
        <tr><td style="color: #64748b; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">Service Type</td><td style="color: #0f172a; font-weight: 600; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">${escapeHtml(params.serviceType)}</td></tr>
      </table>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin: 18px 0;">
        <strong style="color: #0f172a; font-size: 13px; text-transform: uppercase; letter-spacing: 0.04em;">Your Assignment Brief:</strong>
        <p style="white-space: pre-wrap; font-size: 13px; color: #475569; margin: 6px 0 0 0;">${escapeHtml(params.description)}</p>
        ${params.specialInstructions ? `<p style="font-size: 12px; color: #64748b; margin: 8px 0 0 0;"><strong>Special Instructions:</strong> ${escapeHtml(params.specialInstructions)}</p>` : ""}
      </div>

      <div style="text-align: center; margin: 26px 0 18px 0;">
        <a href="${portalUrl}" style="display: inline-block; background-color: #15805d; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 24px; border-radius: 6px;" target="_blank">
          View Your Client Portal
        </a>
      </div>

      <p style="font-size: 12px; color: #64748b; text-align: center; margin: 10px 0 16px 0;">
        Portal Link: <a href="${portalUrl}" style="color: #15805d;">${portalUrl}</a>
      </p>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin: 16px 0; text-align: center;">
        <p style="margin: 0; font-size: 13px; color: #334155;">
          Direct WhatsApp Support: <strong>+${cleanWa}</strong> · Email: <a href="mailto:assignment.sthelp@gmail.com" style="color: #15805d; text-decoration: none;">assignment.sthelp@gmail.com</a>
        </p>
      </div>
    `;

    const customerHtml = emailWrapper(customerHtmlContent);
    const customerText = `Hello ${params.studentName},\n\n` +
      `Thank you for submitting your assignment request to StHelp Academic Support.\n\n` +
      `Request Summary:\n` +
      `• Reference ID: ${params.clientId}\n` +
      `• Assignment: ${params.assignmentTitle}\n` +
      `• Deadline: ${formatDate(params.deadline)}\n` +
      `• Estimated Range: ${priceText}\n\n` +
      `Your Assignment Brief:\n${params.description}\n\n` +
      `Access your private client portal:\n${portalUrl}\n\n` +
      `Direct Support:\nWhatsApp: +${cleanWa}\nEmail: assignment.sthelp@gmail.com\n\n` +
      `StHelp Academic Support Services\nColombo, Sri Lanka\nwww.sthelp.edu.lk`;

    sendJobs.push(
      sendEmail({
        to: params.studentEmail,
        subject: `StHelp Assignment Confirmation: ${params.assignmentTitle} [Ref: ${params.clientId}]`,
        html: customerHtml,
        text: customerText
      }).then((ok) => {
        results.customerSent = ok;
      }).catch((err) => {
        console.error("[Email Notification] Failed to send customer email:", err);
      })
    );
  }

  // 2. Send notification email to Admin ("To me")
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || "gayanthanadeemal@gmail.com";
  if (adminEmail) {
    const calcDetailsBlock = params.calcDetails ? `
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin: 14px 0; font-size: 13px;">
        <strong style="color: #15805d;">Calculator Estimate:</strong><br>
        • Area: ${escapeHtml(params.calcDetails.categoryLabel || params.calcDetails.category || "—")}<br>
        • Scope: ${escapeHtml(params.calcDetails.scope || "—")}<br>
        • Level: ${escapeHtml(params.calcDetails.level || "—")}<br>
        • Turnaround: ${escapeHtml(params.calcDetails.turnaround || "—")}<br>
        • Add-ons: ${escapeHtml(params.calcDetails.addons || "None")}<br>
        • Estimate: <strong>${escapeHtml(params.calcDetails.estimateRange || priceText)}</strong>
      </div>
    ` : "";

    const adminHtmlContent = `
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #0f172a;">New assignment order submitted by <strong>${escapeHtml(params.studentName)}</strong>.</p>

      <div style="background-color: #fef3c7; border: 1px solid #fde68a; border-radius: 8px; padding: 14px 18px; margin: 18px 0;">
        <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #92400e; letter-spacing: 0.05em; margin-bottom: 4px;">Quoted / Estimated Range</div>
        <div style="font-size: 20px; font-weight: 800; color: #b45309;">${escapeHtml(priceText)}</div>
      </div>

      <table width="100%" cellpadding="6" cellspacing="0" border="0" role="presentation" style="font-size: 14px; margin: 18px 0; border-collapse: collapse;">
        <tr><td style="color: #64748b; width: 38%; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">Client Reference</td><td style="color: #0f172a; font-weight: 600; width: 62%; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">${escapeHtml(params.clientId)}</td></tr>
        <tr><td style="color: #64748b; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">Student Name</td><td style="color: #0f172a; font-weight: 600; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">${escapeHtml(params.studentName)}</td></tr>
        <tr><td style="color: #64748b; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">Contact Number</td><td style="color: #0f172a; font-weight: 600; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">${escapeHtml(params.contactNumber)}</td></tr>
        <tr><td style="color: #64748b; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">Student Email</td><td style="color: #0f172a; font-weight: 600; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">${params.studentEmail ? `<a href="mailto:${escapeHtml(params.studentEmail)}" style="color: #15805d;">${escapeHtml(params.studentEmail)}</a>` : "Not provided"}</td></tr>
        <tr><td style="color: #64748b; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">University</td><td style="color: #0f172a; font-weight: 600; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">${escapeHtml(params.university)}</td></tr>
        ${params.programme ? `<tr><td style="color: #64748b; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">Programme</td><td style="color: #0f172a; font-weight: 600; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">${escapeHtml(params.programme)}</td></tr>` : ""}
        ${params.moduleName ? `<tr><td style="color: #64748b; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">Module</td><td style="color: #0f172a; font-weight: 600; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">${escapeHtml(params.moduleName)}</td></tr>` : ""}
        <tr><td style="color: #64748b; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">Assignment Title</td><td style="color: #0f172a; font-weight: 600; padding: 8px 0; border-bottom: 1px solid #f1f5f9;"><strong>${escapeHtml(params.assignmentTitle)}</strong></td></tr>
        <tr><td style="color: #64748b; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">Deadline</td><td style="color: #0f172a; font-weight: 600; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">${escapeHtml(formatDate(params.deadline))}</td></tr>
        <tr><td style="color: #64748b; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">Group Work</td><td style="color: #0f172a; font-weight: 600; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">${params.isGroup ? `Yes (${params.groupMembers} members)` : "No"}</td></tr>
      </table>

      ${calcDetailsBlock}

      <div style="margin: 18px 0; font-size: 13px;">
        <strong style="color: #0f172a;">Task Description:</strong>
        <p style="white-space: pre-wrap; background-color: #f8fafc; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0; margin: 4px 0 12px 0;">${escapeHtml(params.description)}</p>
        ${params.specialInstructions ? `
          <strong style="color: #0f172a;">Special Instructions:</strong>
          <p style="white-space: pre-wrap; background-color: #f8fafc; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0; margin: 4px 0;">${escapeHtml(params.specialInstructions)}</p>
        ` : ""}
      </div>

      <div style="text-align: center; margin: 26px 0 18px 0;">
        <a href="${adminUrl}" style="display: inline-block; background-color: #15805d; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 24px; border-radius: 6px; margin-right: 8px;" target="_blank">
          Open in Admin Dashboard
        </a>
        <a href="${portalUrl}" style="display: inline-block; background-color: #f1f5f9; color: #334155 !important; text-decoration: none; font-weight: 600; font-size: 14px; padding: 12px 20px; border-radius: 6px;" target="_blank">
          Client Portal View
        </a>
      </div>
    `;

    const adminHtml = emailWrapper(adminHtmlContent);
    const adminText = `[New Assignment Order]\n\n` +
      `Client ID: ${params.clientId}\n` +
      `Student: ${params.studentName} (${params.contactNumber})\n` +
      `Email: ${params.studentEmail || "Not provided"}\n` +
      `University: ${params.university}\n` +
      `Assignment: ${params.assignmentTitle}\n` +
      `Deadline: ${formatDate(params.deadline)}\n` +
      `Estimated Range: ${priceText}\n\n` +
      `Task Description:\n${params.description}\n\n` +
      `Admin Dashboard: ${adminUrl}\n` +
      `Client Portal: ${portalUrl}`;

    sendJobs.push(
      sendEmail({
        to: adminEmail,
        subject: `New Assignment Order: ${params.studentName} - ${params.assignmentTitle} [Ref: ${params.clientId}]`,
        html: adminHtml,
        text: adminText
      }).then((ok) => {
        results.adminSent = ok;
      }).catch((err) => {
        console.error("[Email Notification] Failed to send admin email:", err);
      })
    );
  }

  // Wait for both emails to finish sending
  await Promise.allSettled(sendJobs);

  return results;
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
