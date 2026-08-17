"use client";

import { useState } from "react";
import { Loader2, ShieldCheck, UploadCloud } from "lucide-react";
import { FIVE_MB, SERVICE_TYPES } from "@/lib/constants";
import { uploadPrivateFile } from "@/lib/upload-client";

export function PublicAssignmentForm() {
  const [supportFiles, setSupportFiles] = useState<File[]>([]);
  const [isGroup, setIsGroup] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (supportFiles.some((file) => file.size > FIVE_MB)) {
      setNotice("Each support document must be 5 MB or smaller.");
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
          university: form.get("university"), programme: form.get("programme"), moduleName: form.get("moduleName"), assignmentTitle: form.get("assignmentTitle"), serviceType: form.get("serviceType"), academicLevel: form.get("academicLevel"),
          deadline: form.get("deadline"), isGroup, groupMembers: isGroup ? Number(form.get("groupMembers")) : null,
          description: form.get("description"), specialInstructions: form.get("specialInstructions"), supportFiles: supportFilesMeta
        })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to submit your requirements.");
      window.location.assign(`/portal/${token}`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to submit your request.");
    } finally { setBusy(false); }
  }

  return <form className="form-card request-form" onSubmit={submit}>
    <div className="section-title"><span className="eyebrow">Your request</span><h2>Assignment details</h2><p className="muted">Fields marked with * are required. More detail helps us assess the request faster.</p></div>
    {notice ? <div className="notice notice-error">{notice}</div> : null}
    <div className="form-grid">
      <div className="field"><label htmlFor="student-name">Full name *</label><input id="student-name" className="input" name="studentName" autoComplete="name" required /></div>
      <div className="field"><label htmlFor="contact-number">WhatsApp / contact number *</label><input id="contact-number" className="input" name="contactNumber" type="tel" autoComplete="tel" required /></div>
      <div className="field"><label htmlFor="email">Email address</label><input id="email" className="input" name="email" type="email" autoComplete="email" /></div>
      <div className="field"><label htmlFor="university">University / institute *</label><input id="university" className="input" name="university" required /></div>
      <div className="field"><label htmlFor="programme">Degree / programme</label><input id="programme" className="input" name="programme" /></div>
      <div className="field"><label htmlFor="module">Module / subject</label><input id="module" className="input" name="moduleName" /></div>
      <div className="field full"><label htmlFor="assignment-title">Assignment / project title *</label><input id="assignment-title" className="input" name="assignmentTitle" required /></div>
      <div className="field"><label htmlFor="service-type">Type of support *</label><select id="service-type" className="select" name="serviceType" required><option value="">Select</option>{SERVICE_TYPES.map((type) => <option key={type}>{type}</option>)}</select></div>
      <div className="field"><label htmlFor="academic-level">Academic level</label><select id="academic-level" className="select" name="academicLevel"><option value="">Select</option><option>Foundation</option><option>Diploma</option><option>Undergraduate</option><option>Postgraduate</option><option>Other</option></select></div>
      <div className="field"><label htmlFor="deadline">Deadline *</label><input id="deadline" className="input" name="deadline" type="datetime-local" required /></div>
      <div className="field"><label htmlFor="group">Group assignment?</label><select id="group" className="select" value={isGroup ? "yes" : "no"} onChange={(event) => setIsGroup(event.target.value === "yes")}><option value="no">No</option><option value="yes">Yes</option></select></div>
      {isGroup ? <div className="field"><label htmlFor="group-members">Number of group members *</label><input id="group-members" className="input" name="groupMembers" type="number" min="2" max="100" required /></div> : null}
      <div className="field full"><label htmlFor="description">Task description and requirements *</label><textarea id="description" className="textarea" name="description" placeholder="Explain the task, word count, marking criteria, preferred tools and expected output." required /></div>
      <div className="field full"><label htmlFor="instructions">Special instructions</label><textarea id="instructions" className="textarea" name="specialInstructions" placeholder="Referencing style, formatting rules, lecturer instructions or preferred software." /></div>
      <div className="field full"><label htmlFor="support-files">Brief or guidance documents (optional, up to 5 MB each)</label><input id="support-files" className="input" type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.txt,.csv,.jpg,.jpeg,.png,.webp" onChange={(event) => setSupportFiles(Array.from(event.target.files || []))} /><span className="help">Accepted: documents, spreadsheets, slides, ZIP, text and images.</span></div>
      <div className="website-field" aria-hidden="true"><label htmlFor="website">Website</label><input id="website" name="website" tabIndex={-1} autoComplete="off" /></div>
      <label className="checkbox-row field full"><input type="checkbox" required /><span>I confirm that these details are correct and that I will follow my institution’s academic-integrity and submission rules.</span></label>
    </div>
    <div className="request-submit"><button className="btn btn-primary" disabled={busy}>{busy ? <><Loader2 className="spinner" size={18} /> Creating your private portal…</> : <><UploadCloud size={18} /> Submit assignment request</>}</button><span className="help"><ShieldCheck size={15} /> Your details are sent to a private tracking portal.</span></div>
  </form>;
}
