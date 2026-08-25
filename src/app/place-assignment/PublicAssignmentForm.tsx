"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, CheckCircle2, Loader2, LockKeyhole, ShieldCheck, UploadCloud } from "lucide-react";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { FIVE_MB } from "@/lib/constants";
import { formatDate, formatMoney } from "@/lib/format";
import type { PricingService } from "@/lib/pricing";
import { uploadPrivateFile } from "@/lib/upload-client";

type SubmittedOrder = {
  reference: string;
  studentName: string;
  university: string;
  assignmentTitle: string;
  serviceName: string;
  deadline: string;
  startingPrice: number | null;
  currency: string;
  token: string;
};

function normalizeWhatsAppNumber(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.startsWith("0") ? `94${digits.slice(1)}` : digits;
}

function createWhatsAppMessage(order: SubmittedOrder) {
  const price = order.startingPrice !== null
    ? `${formatMoney(order.startingPrice, order.currency)} starting estimate`
    : "Custom quotation requested";

  return [
    "Hello StHelp 👋",
    "",
    "I have submitted a new assignment support request through your website.",
    "",
    `Order reference: ${order.reference}`,
    `Name: ${order.studentName}`,
    `University: ${order.university}`,
    `Service: ${order.serviceName}`,
    `Assignment: ${order.assignmentTitle}`,
    `Deadline: ${formatDate(order.deadline)}`,
    `Price: ${price}`,
    "",
    "Please review my requirements and confirm the final quotation. Thank you."
  ].join("\n");
}

export function PublicAssignmentForm({
  pricingServices,
  initialServiceSlug,
  whatsappNumber
}: {
  pricingServices: PricingService[];
  initialServiceSlug?: string;
  whatsappNumber: string;
}) {
  const availableServices = pricingServices;
  const safeInitialService = initialServiceSlug && availableServices.some((service) => service.slug === initialServiceSlug)
    ? initialServiceSlug
    : "";
  const [supportFiles, setSupportFiles] = useState<File[]>([]);
  const [isGroup, setIsGroup] = useState(false);
  const [selectedServiceSlug, setSelectedServiceSlug] = useState(safeInitialService);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [submittedOrder, setSubmittedOrder] = useState<SubmittedOrder | null>(null);
  const selectedService = availableServices.find((service) => service.slug === selectedServiceSlug) || null;
  const whatsapp = normalizeWhatsAppNumber(whatsappNumber);

  if (submittedOrder) {
    const message = createWhatsAppMessage(submittedOrder);
    const whatsappHref = whatsapp ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}` : null;
    const priceLabel = submittedOrder.startingPrice !== null
      ? `From ${formatMoney(submittedOrder.startingPrice, submittedOrder.currency)}`
      : "Custom quotation";

    return <section id="order-success" className="form-card request-success-card" aria-live="polite">
      <div className="request-success-top">
        <span className="request-success-mark"><Check size={31} strokeWidth={3} /></span>
        <div><span className="eyebrow">Request received</span><h2>Your assignment is safely in.</h2><p>We saved your requirements and created a private workspace. Send the prepared WhatsApp message so StHelp can identify your request quickly.</p></div>
      </div>

      <div className="request-success-ticket">
        <div className="request-success-reference"><span>Order reference</span><strong>{submittedOrder.reference}</strong></div>
        <div className="request-success-summary">
          <div><span>Support type</span><strong>{submittedOrder.serviceName}</strong></div>
          <div><span>Deadline</span><strong>{formatDate(submittedOrder.deadline)}</strong></div>
          <div><span>Initial pricing</span><strong>{priceLabel}</strong></div>
        </div>
        <p><CheckCircle2 size={17} /> Your final quotation will be confirmed after StHelp reviews the full brief.</p>
      </div>

      <div className="request-whatsapp-panel">
        <div className="request-whatsapp-icon"><WhatsAppIcon size={29} /></div>
        <div><strong>One last tap</strong><p>WhatsApp opens with your order summary already written. Review it, then tap Send.</p></div>
      </div>

      <div className="request-success-actions">
        {whatsappHref ? <a className="btn request-whatsapp-btn" href={whatsappHref} target="_blank" rel="noreferrer"><WhatsAppIcon size={21} /> Send order on WhatsApp</a> : <div className="notice notice-info">WhatsApp is not configured right now. Your request is still saved—continue to your portal below.</div>}
        <Link className="btn request-portal-btn" href={`/portal/${submittedOrder.token}`}><LockKeyhole size={18} /> Open private portal <ArrowRight size={18} /></Link>
      </div>
      <p className="request-success-note">Your message is not sent automatically. WhatsApp lets you check it before sending.</p>
    </section>;
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (supportFiles.some((file) => file.size > FIVE_MB)) {
      setNotice("Each support document must be 5 MB or smaller.");
      return;
    }
    const deadline = new Date(String(form.get("deadline") || ""));
    if (Number.isNaN(deadline.getTime())) {
      setNotice("Enter a valid deadline.");
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      const start = await fetch("/api/public/assignment-link", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ website: form.get("website") }) });
      const startData = await start.json();
      if (!start.ok) throw new Error(startData.error || "Unable to start your request.");
      const token = String(startData.token || "");
      if (!token) throw new Error("Unable to create your private portal.");
      const supportFilesMeta = await Promise.all(supportFiles.map((file) => uploadPrivateFile({ file, scope: "client-support", token })));
      const response = await fetch(`/api/client/${token}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit", studentName: form.get("studentName"), contactNumber: form.get("contactNumber"), email: form.get("email"),
          university: form.get("university"), programme: form.get("programme"), moduleName: form.get("moduleName"), assignmentTitle: form.get("assignmentTitle"), pricingServiceSlug: form.get("pricingServiceSlug"), academicLevel: form.get("academicLevel"),
          deadline: deadline.toISOString(), isGroup, groupMembers: isGroup ? Number(form.get("groupMembers")) : null,
          description: form.get("description"), specialInstructions: form.get("specialInstructions"), supportFiles: supportFilesMeta
        })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to submit your requirements.");
      const order = payload.order;
      if (!order?.reference) throw new Error("Your request was saved, but its confirmation could not be displayed. Open your private portal and contact StHelp if needed.");
      setSubmittedOrder({
        reference: String(order.reference),
        studentName: String(order.studentName || form.get("studentName") || ""),
        university: String(order.university || form.get("university") || ""),
        assignmentTitle: String(order.assignmentTitle || form.get("assignmentTitle") || ""),
        serviceName: String(order.serviceName || selectedService?.name || "Assignment support"),
        deadline: String(order.deadline || deadline.toISOString()),
        startingPrice: order.startingPrice === null || order.startingPrice === undefined ? null : Number(order.startingPrice),
        currency: String(order.currency || selectedService?.currency || "LKR"),
        token
      });
      window.requestAnimationFrame(() => document.getElementById("order-success")?.scrollIntoView({ behavior: "smooth", block: "center" }));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to submit your request.");
    } finally { setBusy(false); }
  }

  return <form className="form-card request-form" onSubmit={submit}>
    <div className="section-title"><span className="eyebrow">Your request</span><h2>Assignment details</h2><p className="muted">Fields marked with * are required. More detail helps us assess the request faster.</p></div>
    {notice ? <div className="notice notice-error" role="alert" aria-live="polite">{notice}</div> : null}
    {!availableServices.length ? <div className="notice notice-error" role="alert">Online ordering is temporarily unavailable because no services are published. Please contact StHelp and try again shortly.</div> : null}
    <div className="form-grid">
      <div className="field"><label htmlFor="student-name">Full name *</label><input id="student-name" className="input" name="studentName" autoComplete="name" required /></div>
      <div className="field"><label htmlFor="contact-number">WhatsApp / contact number *</label><input id="contact-number" className="input" name="contactNumber" type="tel" autoComplete="tel" required /></div>
      <div className="field"><label htmlFor="email">Email address</label><input id="email" className="input" name="email" type="email" autoComplete="email" /><span className="help">Required if you plan to use PayHere online payment.</span></div>
      <div className="field"><label htmlFor="university">University / institute *</label><input id="university" className="input" name="university" required /></div>
      <div className="field"><label htmlFor="programme">Degree / programme</label><input id="programme" className="input" name="programme" /></div>
      <div className="field"><label htmlFor="module">Module / subject</label><input id="module" className="input" name="moduleName" /></div>
      <div className="field full"><label htmlFor="assignment-title">Assignment / project title *</label><input id="assignment-title" className="input" name="assignmentTitle" required /></div>
      <div className="field"><label htmlFor="service-type">Type of support *</label><select id="service-type" className="select" name="pricingServiceSlug" value={selectedServiceSlug} onChange={(event) => setSelectedServiceSlug(event.target.value)} disabled={!availableServices.length} required><option value="">Select a service</option>{availableServices.map((service) => <option value={service.slug} key={service.slug}>{service.name}{service.starting_price && service.starting_price > 0 ? ` — from ${formatMoney(service.starting_price, service.currency)}` : " — custom quote"}</option>)}</select></div>
      <div className="field"><label htmlFor="academic-level">Academic level</label><select id="academic-level" className="select" name="academicLevel"><option value="">Select</option><option>Foundation</option><option>Diploma</option><option>Undergraduate</option><option>Postgraduate</option><option>Other</option></select></div>
      {selectedService ? <div className="notice notice-info field full" aria-live="polite"><strong>{selectedService.name}</strong><p>{selectedService.short_description}</p><span className="small">{selectedService.starting_price && selectedService.starting_price > 0 ? `${formatMoney(selectedService.starting_price, selectedService.currency)} starting price. We review your requirements and confirm the final quotation in your client portal before payment.` : "This service needs a custom quotation. We will review your requirements and confirm the price in your client portal before payment."}</span></div> : null}
      <div className="field"><label htmlFor="deadline">Deadline *</label><input id="deadline" className="input" name="deadline" type="datetime-local" required /></div>
      <div className="field"><label htmlFor="group">Group assignment?</label><select id="group" className="select" value={isGroup ? "yes" : "no"} onChange={(event) => setIsGroup(event.target.value === "yes")}><option value="no">No</option><option value="yes">Yes</option></select></div>
      {isGroup ? <div className="field"><label htmlFor="group-members">Number of group members *</label><input id="group-members" className="input" name="groupMembers" type="number" min="2" max="100" required /></div> : null}
      <div className="field full"><label htmlFor="description">Task description and requirements *</label><textarea id="description" className="textarea" name="description" placeholder="Explain the task, word count, marking criteria, preferred tools and expected output." required /></div>
      <div className="field full"><label htmlFor="instructions">Special instructions</label><textarea id="instructions" className="textarea" name="specialInstructions" placeholder="Referencing style, formatting rules, lecturer instructions or preferred software." /></div>
      <div className="field full"><label htmlFor="support-files">Brief or guidance documents (optional, up to 5 MB each)</label><input id="support-files" className="input" type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.txt,.csv,.jpg,.jpeg,.png,.webp" onChange={(event) => setSupportFiles(Array.from(event.target.files || []))} /><span className="help">Accepted: documents, spreadsheets, slides, ZIP, text and images.</span></div>
      <div className="website-field" aria-hidden="true"><label htmlFor="website">Website</label><input id="website" name="website" tabIndex={-1} autoComplete="off" /></div>
      <label className="checkbox-row field full"><input type="checkbox" required /><span>I confirm that these details are correct and that I will follow my institution’s academic-integrity and submission rules.</span></label>
    </div>
    <div className="request-submit"><button className="btn btn-primary" disabled={busy || !availableServices.length}>{busy ? <><Loader2 className="spinner" size={18} /> Creating your private portal…</> : <><UploadCloud size={18} /> Submit assignment request</>}</button><span className="help"><ShieldCheck size={15} /> Your details are sent to a private tracking portal.</span></div>
  </form>;
}
