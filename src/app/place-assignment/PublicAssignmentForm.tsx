"use client";

import { useMemo, useState } from "react";
import { Loader2, ShieldCheck, Sparkles, UploadCloud } from "lucide-react";
import { FIVE_MB } from "@/lib/constants";
import type { PricingService } from "@/lib/pricing";
import { uploadPrivateFile } from "@/lib/upload-client";

export interface CalculatorEstimateData {
  fromCalc?: boolean;
  category?: string;
  categoryLabel?: string;
  title?: string;
  level?: string;
  urgency?: string;
  minPrice?: string;
  maxPrice?: string;
  turnaround?: string;
  addons?: string;
  rawMin?: string;
  rawMax?: string;
}

function getDefaultDeadline(urgencyTag?: string): string {
  const now = new Date();
  let daysToAdd = 4;
  if (urgencyTag) {
    const lower = urgencyTag.toLowerCase();
    if (lower.includes("24") || lower.includes("48") || lower.includes("express")) {
      daysToAdd = 2;
    } else if (lower.includes("week") || lower.includes("relaxed")) {
      daysToAdd = 10;
    }
  }
  const target = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
  const yyyy = target.getFullYear();
  const mm = String(target.getMonth() + 1).padStart(2, "0");
  const dd = String(target.getDate()).padStart(2, "0");
  const hh = String(target.getHours()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:00`;
}

export function PublicAssignmentForm({
  pricingServices,
  initialServiceSlug,
  calcEstimate
}: {
  pricingServices: PricingService[];
  initialServiceSlug?: string;
  calcEstimate?: CalculatorEstimateData;
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
  const selectedService = availableServices.find((service) => service.slug === selectedServiceSlug) || null;

  // Title, Description and Special Instructions are for customer inputs only.
  // We do not pre-fill them with calculator text so the customer enters their actual requirements.
  const defaultAssignmentTitle = "";

  const defaultAcademicLevel = useMemo(() => {
    if (!calcEstimate?.level) return "";
    const lvl = calcEstimate.level.toLowerCase();
    if (lvl.includes("postgrad") || lvl.includes("master") || lvl.includes("mba")) return "Postgraduate";
    if (lvl.includes("undergrad") || lvl.includes("degree")) return "Undergraduate";
    if (lvl.includes("diploma")) return "Diploma";
    if (lvl.includes("foundation")) return "Foundation";
    return "";
  }, [calcEstimate]);

  const defaultDeadline = useMemo(() => {
    return getDefaultDeadline(calcEstimate?.urgency || calcEstimate?.turnaround);
  }, [calcEstimate]);

  const defaultDescription = "";
  const defaultSpecialInstructions = "";

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
      const start = await fetch("/api/public/assignment-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ website: form.get("website") })
      });
      const startData = await start.json();
      if (!start.ok) throw new Error(startData.error || "Unable to start your request.");
      const token = String(startData.token || "");
      if (!token) throw new Error("Unable to create your private portal.");

      const supportFilesMeta = await Promise.all(
        supportFiles.map((file) => uploadPrivateFile({ file, scope: "client-support", token }))
      );

      const response = await fetch(`/api/client/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit",
          studentName: form.get("studentName"),
          contactNumber: form.get("contactNumber"),
          email: form.get("email"),
          university: form.get("university"),
          programme: form.get("programme"),
          moduleName: form.get("moduleName"),
          assignmentTitle: form.get("assignmentTitle"),
          pricingServiceSlug: form.get("pricingServiceSlug"),
          academicLevel: form.get("academicLevel"),
          deadline: deadline.toISOString(),
          isGroup,
          groupMembers: isGroup ? Number(form.get("groupMembers")) : null,
          description: form.get("description"),
          specialInstructions: form.get("specialInstructions"),
          supportFiles: supportFilesMeta,
          calculationDetails: calcEstimate?.fromCalc ? {
            fromCalc: true,
            category: calcEstimate.category || "",
            categoryLabel: calcEstimate.categoryLabel || "",
            scope: calcEstimate.title || "",
            level: calcEstimate.level || "",
            urgency: calcEstimate.urgency || "",
            turnaround: calcEstimate.turnaround || "",
            addons: calcEstimate.addons || "",
            minPrice: calcEstimate.minPrice || "",
            maxPrice: calcEstimate.maxPrice || "",
            rawMin: calcEstimate.rawMin || "",
            rawMax: calcEstimate.rawMax || "",
            estimateRange: `LKR ${calcEstimate.minPrice} – ${calcEstimate.maxPrice}`
          } : null
        })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to submit your requirements.");
      window.location.assign(`/portal/${token}`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to submit your request.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="form-card request-form" onSubmit={submit}>
      {calcEstimate?.fromCalc ? (
        <div className="calculator-estimate-banner" aria-live="polite">
          <div className="estimate-banner-header">
            <span className="estimate-badge">
              <Sparkles size={14} /> CALCULATOR ESTIMATE LOCKED
            </span>
            <strong className="estimate-price">
              LKR {calcEstimate.minPrice} – {calcEstimate.maxPrice}
            </strong>
          </div>
          <div className="estimate-banner-details">
            <p className="estimate-title">{calcEstimate.title}</p>
            <div className="estimate-meta-chips">
              <span>🎓 Level: {calcEstimate.level || "Undergraduate"}</span>
              <span>⏱️ {calcEstimate.turnaround || "Standard Pace"}</span>
              {calcEstimate.addons ? <span>➕ Add-on: {calcEstimate.addons}</span> : null}
            </div>
          </div>
          <p className="estimate-hint">
            ✓ Your calculated rate of LKR {calcEstimate.minPrice} – {calcEstimate.maxPrice} is locked. Enter your assignment title and description below to submit your request.
          </p>
        </div>
      ) : null}

      <div className="section-title">
        <span className="eyebrow">Your request</span>
        <h2>Assignment details</h2>
        <p className="muted">Fields marked with * are required. More detail helps us assess the request faster.</p>
      </div>

      {notice ? (
        <div className="notice notice-error" role="alert" aria-live="polite">
          {notice}
        </div>
      ) : null}

      {!availableServices.length ? (
        <div className="notice notice-error" role="alert">
          Online ordering is temporarily unavailable because no services are published. Please contact StHelp and try again shortly.
        </div>
      ) : null}

      <div className="form-grid">
        <div className="field">
          <label htmlFor="student-name">Full name *</label>
          <input id="student-name" className="input" name="studentName" autoComplete="name" required />
        </div>
        <div className="field">
          <label htmlFor="contact-number">WhatsApp / contact number *</label>
          <input id="contact-number" className="input" name="contactNumber" type="tel" autoComplete="tel" placeholder="e.g. 077 123 4567" required />
        </div>
        <div className="field">
          <label htmlFor="email">Email address</label>
          <input id="email" className="input" name="email" type="email" autoComplete="email" placeholder="e.g. name@student.ac.lk" />
          <span className="help">Required if you plan to use PayHere online payment.</span>
        </div>
        <div className="field">
          <label htmlFor="university">University / institute *</label>
          <input id="university" className="input" name="university" placeholder="e.g. Moratuwa, SLIIT, NSBM, Colombo" required />
        </div>
        <div className="field">
          <label htmlFor="programme">Degree / programme</label>
          <input id="programme" className="input" name="programme" placeholder="e.g. BSc (Hons) Software Engineering" />
        </div>
        <div className="field">
          <label htmlFor="module">Module / subject</label>
          <input id="module" className="input" name="moduleName" placeholder="e.g. Distributed Systems / Research Methods" />
        </div>
        <div className="field full">
          <label htmlFor="assignment-title">Assignment / project title *</label>
          <input
            id="assignment-title"
            className="input"
            name="assignmentTitle"
            defaultValue={defaultAssignmentTitle}
            placeholder="e.g. Final Year Web Portal Development / Strategic Business Report"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="service-type">Type of support *</label>
          <select
            id="service-type"
            className="select"
            name="pricingServiceSlug"
            value={selectedServiceSlug}
            onChange={(event) => setSelectedServiceSlug(event.target.value)}
            disabled={!availableServices.length}
            required
          >
            <option value="">Select a service</option>
            {availableServices.map((service) => (
              <option value={service.slug} key={service.slug}>
                {service.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="academic-level">Academic level</label>
          <select id="academic-level" className="select" name="academicLevel" defaultValue={defaultAcademicLevel}>
            <option value="">Select</option>
            <option value="Foundation">Foundation</option>
            <option value="Diploma">Diploma</option>
            <option value="Undergraduate">Undergraduate</option>
            <option value="Postgraduate">Postgraduate</option>
            <option value="Other">Other</option>
          </select>
        </div>
        {selectedService ? (
          <div className="notice notice-info field full" aria-live="polite">
            <strong>{selectedService.name}</strong>
            <p>{selectedService.short_description}</p>
            <span className="small">
              We review your requirements and confirm the final quotation in your client portal before payment.
            </span>
          </div>
        ) : null}
        <div className="field">
          <label htmlFor="deadline">Deadline *</label>
          <input id="deadline" className="input" name="deadline" type="datetime-local" defaultValue={defaultDeadline} required />
        </div>
        <div className="field">
          <label htmlFor="group">Group assignment?</label>
          <select id="group" className="select" value={isGroup ? "yes" : "no"} onChange={(event) => setIsGroup(event.target.value === "yes")}>
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </div>
        {isGroup ? (
          <div className="field">
            <label htmlFor="group-members">Number of group members *</label>
            <input id="group-members" className="input" name="groupMembers" type="number" min="2" max="100" required />
          </div>
        ) : null}
        <div className="field full">
          <label htmlFor="description">Task description and requirements *</label>
          <textarea
            id="description"
            className="textarea"
            name="description"
            defaultValue={defaultDescription}
            rows={7}
            placeholder="Explain the task, word count, marking criteria, preferred tools and expected output."
            required
          />
        </div>
        <div className="field full">
          <label htmlFor="instructions">Special instructions</label>
          <textarea
            id="instructions"
            className="textarea"
            name="specialInstructions"
            defaultValue={defaultSpecialInstructions}
            placeholder="Referencing style, formatting rules, lecturer instructions or preferred software."
          />
        </div>
        <div className="field full">
          <label htmlFor="support-files">Brief or guidance documents (optional, up to 5 MB each)</label>
          <input
            id="support-files"
            className="input"
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.txt,.csv,.jpg,.jpeg,.png,.webp"
            onChange={(event) => setSupportFiles(Array.from(event.target.files || []))}
          />
          <span className="help">Accepted: documents, spreadsheets, slides, ZIP, text and images.</span>
        </div>
        <div className="website-field" aria-hidden="true">
          <label htmlFor="website">Website</label>
          <input id="website" name="website" tabIndex={-1} autoComplete="off" />
        </div>
        <label className="checkbox-row field full">
          <input type="checkbox" required />
          <span>I confirm that these details are correct and that I will follow my institution’s academic-integrity and submission rules.</span>
        </label>
      </div>
      <div className="request-submit">
        <button className="btn btn-primary" disabled={busy || !availableServices.length}>
          {busy ? (
            <>
              <Loader2 className="spinner" size={18} /> Creating your private portal…
            </>
          ) : (
            <>
              <UploadCloud size={18} /> Submit assignment request
            </>
          )}
        </button>
        <span className="help">
          <ShieldCheck size={15} /> 100% Confidential · Free Turnitin AI & similarity check included · No payment required now
        </span>
      </div>
    </form>
  );
}
