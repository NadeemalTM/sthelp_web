"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  AlertCircle,
  Banknote,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  FileCheck2,
  FileLock2,
  FileText,
  Loader2,
  LockKeyhole,
  MessageSquareText,
  Pencil,
  RefreshCw,
  Save,
  Send,
  ShieldCheck,
  Star,
  UploadCloud,
  X
} from "lucide-react";
import { SERVICE_TYPES, FIVE_MB } from "@/lib/constants";
import { formatDate, formatMoney, statusLabel } from "@/lib/format";
import { uploadPrivateFile } from "@/lib/upload-client";

type PortalData = any;

export function PortalClient({ token }: { token: string }) {
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const response = await fetch(`/api/client/${token}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "This client link is unavailable.");
      setData(payload);
      setLastSynced(new Date());
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Unable to load the portal." });
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [token]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    const refresh = window.setInterval(() => { void load(true); }, 45_000);
    return () => window.clearInterval(refresh);
  }, [load]);

  async function post(action: string, body: Record<string, unknown>) {
    const response = await fetch(`/api/client/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...body })
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Request failed.");
    return payload;
  }

  if (loading) return <main className="loading"><div className="stack" style={{justifyItems:"center"}}><div className="spinner"/><span>Opening your private portal…</span></div></main>;
  if (!data) return <main className="access-page"><div className="access-card"><AlertCircle/><h2>Portal unavailable</h2><p className="muted">{notice?.text || "Please request a new link from StHelp."}</p></div></main>;

  return (
    <main className="page-shell">
      <header className="portal-header"><div className="container portal-header-inner"><a className="brand" href="/"><Image className="brand-logo" src="/sthelp-mark.png" alt="" width={48} height={48}/><span className="brand-copy">StHelp<small>Private client portal</small></span></a><div className="portal-sync"><span><i/> Live workspace</span><button type="button" onClick={() => void load(true)} disabled={busy} title="Refresh assignment updates"><RefreshCw size={15}/></button><small>Client ID: <strong>{data.link.client_id}</strong>{lastSynced ? ` · updated ${lastSynced.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}</small></div></div></header>
      <div className="container portal-main">
        {notice ? <div className={`notice notice-${notice.type}`}>{notice.text}</div> : null}
        {!data.assignment ? (
          <SubmissionView token={token} data={data} setBusy={setBusy} busy={busy} onDone={async () => { setNotice({type:"success", text:"Your requirements were submitted successfully."}); await load(); }} setNotice={setNotice}/>
        ) : (
          <DashboardView token={token} data={data} busy={busy} setBusy={setBusy} post={post} reload={load} setNotice={setNotice}/>
        )}
      </div>
    </main>
  );
}

function SubmissionView({ token, data, busy, setBusy, onDone, setNotice }: any) {
  const [supportFiles, setSupportFiles] = useState<File[]>([]);
  const [isGroup, setIsGroup] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const oversizedFile = supportFiles.find((file) => file.size > FIVE_MB);
    if (oversizedFile) {
      setNotice({ type: "error", text: "Each support document must be 5 MB or smaller." });
      return;
    }

    setBusy(true);
    setNotice(null);
    try {
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
          serviceType: form.get("serviceType"),
          academicLevel: form.get("academicLevel"),
          deadline: new Date(String(form.get("deadline"))).toISOString(),
          isGroup,
          groupMembers: isGroup ? Number(form.get("groupMembers")) : null,
          description: form.get("description"),
          specialInstructions: form.get("specialInstructions"),
          supportFiles: supportFilesMeta
        })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to submit your requirements.");
      await onDone();
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Submission failed." });
    } finally {
      setBusy(false);
    }
  }

  return <div className="stack">
    <section className="panel" style={{background:"linear-gradient(135deg,#0b1f3a,#174b75)", color:"white"}}><span className="eyebrow" style={{color:"#ffc95d"}}>Welcome to StHelp</span><h1 style={{fontSize:"clamp(2rem,6vw,3.8rem)", marginTop:8}}>Tell us exactly what support you need.</h1><p className="lead">This private link will become your progress dashboard after submission. You can return to it at any time.</p></section>

    <section><div className="section-title"><span className="eyebrow">Previous work</span><h2 style={{fontSize:"1.9rem"}}>Examples of supported work</h2></div><div className="portfolio-grid">{data.portfolio.map((item: any) => <article className="card portfolio-card" key={item.id}><div className="portfolio-visual">{item.image_url ? <img src={item.image_url} alt=""/> : <FileText size={44}/>}</div><span className="tag">{item.category}</span><h3>{item.title}</h3><p className="muted">{item.description}</p></article>)}</div></section>

    <section><div className="section-title"><span className="eyebrow">Client feedback</span><h2 style={{fontSize:"1.9rem"}}>Recent experiences</h2></div><div className="testimonial-grid">{data.testimonials.slice(0,3).map((item:any) => <article className="card testimonial-card" key={item.id}><div className="stars">{"★".repeat(item.rating)}</div><p>“{item.feedback}”</p><div className="customer"><strong>{item.customer_name}</strong>{item.university ? ` · ${item.university}` : ""}</div></article>)}</div></section>

    <form className="form-card" onSubmit={submit}>
      <div className="section-title"><span className="eyebrow">Assignment request</span><h2 style={{fontSize:"2rem"}}>Your details and requirements</h2><p className="muted">Fields marked with * are required. Add as much detail as possible to avoid delays.</p></div>
      <div className="form-grid">
        <div className="field"><label>Full name *</label><input className="input" name="studentName" defaultValue={data.link.client_name || ""} required /></div>
        <div className="field"><label>Contact number *</label><input className="input" name="contactNumber" defaultValue={data.link.phone || data.link.client_id || ""} required /></div>
        <div className="field"><label>Email</label><input className="input" type="email" name="email" /></div>
        <div className="field"><label>University / institute *</label><input className="input" name="university" required /></div>
        <div className="field"><label>Degree / programme</label><input className="input" name="programme" /></div>
        <div className="field"><label>Module / subject</label><input className="input" name="moduleName" /></div>
        <div className="field full"><label>Assignment / project title *</label><input className="input" name="assignmentTitle" required /></div>
        <div className="field"><label>Type of support *</label><select className="select" name="serviceType" required><option value="">Select</option>{SERVICE_TYPES.map((type) => <option key={type}>{type}</option>)}</select></div>
        <div className="field"><label>Academic level</label><select className="select" name="academicLevel"><option value="">Select</option><option>Foundation</option><option>Diploma</option><option>Undergraduate</option><option>Postgraduate</option><option>Other</option></select></div>
        <div className="field"><label>Deadline *</label><input className="input" name="deadline" type="datetime-local" required /></div>
        <div className="field"><label>Group assignment?</label><select className="select" value={isGroup ? "yes" : "no"} onChange={(e)=>setIsGroup(e.target.value === "yes")}><option value="no">No</option><option value="yes">Yes</option></select></div>
        {isGroup ? <div className="field"><label>Number of group members *</label><input className="input" name="groupMembers" type="number" min="2" max="100" required /></div> : null}
        <div className="field full"><label>Task description and requirements *</label><textarea className="textarea" name="description" placeholder="Explain the task, required sections, technologies, word count, marking criteria and expected output." required /></div>
        <div className="field full"><label>Special instructions</label><textarea className="textarea" name="specialInstructions" placeholder="Referencing style, formatting rules, lecturer instructions, preferred software, etc." /></div>
        <div className="field full"><label>Support / guidance documents (optional, up to 5 MB each)</label><input className="input" type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.txt,.csv,.jpg,.jpeg,.png,.webp" onChange={(e)=>setSupportFiles(Array.from(e.target.files || []))} /><span className="help">You can upload one or more files, or skip this entirely. Accepted: documents, spreadsheets, slides, ZIP, text and images.</span></div>
        <label className="checkbox-row field full"><input type="checkbox" required/><span>I confirm that the details are correct and that I am responsible for following my university’s academic-integrity and submission rules.</span></label>
      </div>
      <div style={{marginTop:22}}><button className="btn btn-primary" disabled={busy}>{busy ? <><Loader2 className="spinner" size={18}/> Submitting…</> : <><UploadCloud size={18}/> Submit requirements</>}</button></div>
    </form>
  </div>;
}

function DashboardView({ token, data, busy, setBusy, post, reload, setNotice }: any) {
  const assignment = data.assignment;
  const accepted = !["submitted", "cancelled"].includes(assignment.status);
  const canEditDetails = !["completed", "delivered", "cancelled"].includes(assignment.status);
  const previews = data.files.filter((f:any)=>f.kind === "preview");
  const finals = data.files.filter((f:any)=>f.kind === "final");
  const support = data.files.filter((f:any)=>f.kind === "support");
  const paymentProofs = data.files.filter((f:any)=>f.kind === "payment_proof");
  const submittedDocuments = [...support, ...paymentProofs];
  const [comment, setComment] = useState("");
  const [paymentRef, setPaymentRef] = useState(assignment.payment_reference || "");
  const [paymentNote, setPaymentNote] = useState("");
  const [proof, setProof] = useState<File | null>(null);
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState(5);
  const [editingDetails, setEditingDetails] = useState(false);
  const hasSecondAccount = [
    data.settings.bank_name_2,
    data.settings.account_name_2,
    data.settings.account_number_2,
    data.settings.bank_branch_2
  ].some(Boolean);

  async function run(task: () => Promise<any>, success: string) {
    setBusy(true); setNotice(null);
    try { await task(); setNotice({type:"success", text:success}); await reload(); return true; }
    catch (error) { setNotice({type:"error", text:error instanceof Error ? error.message : "Request failed."}); return false; }
    finally { setBusy(false); }
  }

  async function sendComment(e:React.FormEvent) {
    e.preventDefault(); if (!comment.trim()) return;
    if (await run(()=>post("comment", {message:comment}), "Comment sent.")) setComment("");
  }

  async function sendPayment(e:React.FormEvent) {
    e.preventDefault();
    await run(async()=>{
      let proofFile = null;
      if (proof) proofFile = await uploadPrivateFile({file:proof, scope:"client-payment", token});
      await post("payment", {reference:paymentRef, note:paymentNote, proofFile});
    }, "Payment reference submitted for verification.");
  }

  async function sendFeedback(e:React.FormEvent) {
    e.preventDefault();
    if (await run(()=>post("feedback", {rating, feedback}), "Thank you. Your feedback was submitted for review.")) setFeedback("");
  }

  async function respondToQuote(accepted:boolean) {
    await run(()=>post("quoteResponse", {accepted}), accepted ? "Quote accepted. StHelp will begin the next stage." : "Quote declined. You can leave a comment if you would like to discuss it.");
  }

  async function updateDetails(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const saved = await run(() => post("updateDetails", {
      studentName: form.get("studentName"),
      contactNumber: form.get("contactNumber"),
      email: form.get("email"),
      university: form.get("university"),
      programme: form.get("programme"),
      moduleName: form.get("moduleName"),
      assignmentTitle: form.get("assignmentTitle"),
      deadline: new Date(String(form.get("deadline"))).toISOString(),
      description: form.get("description"),
      specialInstructions: form.get("specialInstructions")
    }), "Your assignment details were updated.");
    if (saved) setEditingDetails(false);
  }

  return <div className="portal-grid">
    <div className="stack">
      <section className="client-command-card">
        <div className="client-command-top"><div><span className="eyebrow">Your workspace</span><h1>{assignment.assignment_title}</h1><p>{assignment.module_name || assignment.service_type} · Due {formatDate(assignment.deadline)}</p></div><span className={`status-badge ${assignment.status === "delivered" ? "success" : ""}`}><Clock3 size={14}/>{statusLabel(assignment.status)}</span></div>
        <div className="client-progress-row"><div><div className="progress-head"><span>Assignment progress</span><strong>{assignment.progress}%</strong></div><div className="progress-track"><div className="progress-fill" style={{width:`${assignment.progress}%`}}/></div></div><div className="client-next-step"><span>What happens next</span><strong>{nextStep(assignment)}</strong></div></div>
        <StageRail assignment={assignment}/>
        {!accepted ? <div className="notice notice-info">Your request is safely received. Your quote, progress and payment details will appear as soon as the task is accepted.</div> : null}
      </section>

      {assignment.quote_status === "sent" ? <section className="panel quote-panel"><div className="panel-title"><div><span className="eyebrow">Quote ready</span><h3 style={{marginTop:6}}>Review your support quote</h3></div><Banknote/></div><div className="quote-amount">{formatMoney(assignment.quoted_amount, assignment.currency || data.settings.currency)}</div>{assignment.quote_note ? <p className="muted" style={{whiteSpace:"pre-wrap"}}>{assignment.quote_note}</p> : <p className="muted small">Please review the quote and confirm whether you would like StHelp to proceed.</p>}<div className="quote-actions"><button className="btn btn-primary" disabled={busy} onClick={()=>respondToQuote(true)}><CheckCircle2 size={17}/> Accept quote</button><button className="btn btn-soft" disabled={busy} onClick={()=>respondToQuote(false)}>Decline</button></div></section> : null}

      <section className="panel"><div className="panel-title"><h3>Progress updates</h3><RefreshCw size={18}/></div>{data.progress.length ? <div className="timeline">{data.progress.map((item:any)=><div className="timeline-item" key={item.id}><span className="timeline-dot"/><div><strong>{item.title}</strong><p className="muted small">{item.details}</p><span className="tiny muted">{item.progress}% · {formatDate(item.created_at)}</span></div></div>)}</div> : <div className="lock-box"><Clock3/><h3>Waiting for the first update</h3><p className="muted small">Updates will be added here as the work progresses.</p></div>}</section>

      {accepted && (previews.length || finals.length) ? <section className="panel"><div className="panel-title"><div><h3>Output preview and files</h3><p className="muted small">The protected preview is for checking and revision comments.</p></div><FileLock2/></div>
        {previews.map((file:any)=><Preview key={file.id} file={file} token={token}/>) }
        {!previews.length && finals.length && !assignment.download_unlocked ? <div className="lock-box"><LockKeyhole size={30}/><h3>Final output is ready</h3><p className="muted">A separate preview has not been uploaded. Ask admin to add a watermarked PDF or image preview.</p></div> : null}
        <div style={{marginTop:18}}>{finals.map((file:any)=><div className="file-row" key={file.id}><div className="file-name"><strong>{file.original_name}</strong><span className="tiny muted">Final deliverable</span></div>{assignment.download_unlocked ? <a className="btn btn-blue btn-sm" href={`/api/client/${token}/download/${file.id}`}><Download size={15}/> Download</a> : <span className="status-badge warning"><LockKeyhole size={14}/> Locked</span>}</div>)}</div>
        {!assignment.download_unlocked && finals.length ? <div className="notice notice-info"><ShieldCheck size={16} style={{verticalAlign:"middle", marginRight:6}}/>Downloads become available only after payment is verified by admin.</div> : null}
      </section> : null}

      <section className="panel"><div className="panel-title"><h3>Comments and revision requests</h3><MessageSquareText/></div><div className="comment-list">{data.comments.length ? data.comments.map((item:any)=><div className={`comment ${item.author === "admin" ? "admin" : ""}`} key={item.id}>{item.message}<time>{item.author === "admin" ? "StHelp" : "You"} · {formatDate(item.created_at)}</time></div>) : <p className="muted small">No comments yet.</p>}</div><form className="form-inline" onSubmit={sendComment}><input className="input" value={comment} maxLength={1000} onChange={(e)=>setComment(e.target.value)} placeholder="Write a short comment or revision request…"/><button className="btn btn-blue" disabled={busy || !comment.trim()} aria-label="Send"><Send size={18}/></button></form></section>

      <section className="panel client-history">
        <div className="panel-title"><div><h3>Activity history</h3><p className="muted small">A complete record of your actions and assignment updates.</p></div><Clock3 size={19}/></div>
        {data.activity?.length ? <div className="client-history-list">{data.activity.map((item:any)=><article className="client-history-item" key={item.id}><span className="client-history-marker"/><div><div className="client-history-meta"><span className={`activity-actor ${item.actor || "system"}`}>{activityActor(item.actor)}</span><time>{formatDate(item.created_at)}</time></div><p>{activitySummary(item)}</p></div></article>)}</div> : <div className="lock-box"><Clock3/><h3>No activity yet</h3><p className="muted small">Your portal actions and StHelp updates will be recorded here.</p></div>}
      </section>

      {assignment.download_unlocked && !assignment.feedback_submitted ? <section className="panel"><div className="panel-title"><div><h3>Share your feedback</h3><p className="muted small">Your feedback will appear publicly only after admin approval.</p></div><Star/></div><form className="stack" onSubmit={sendFeedback}><div className="field"><label>Rating</label><select className="select" value={rating} onChange={(e)=>setRating(Number(e.target.value))}>{[5,4,3,2,1].map(n=><option key={n} value={n}>{n} star{n>1?"s":""}</option>)}</select></div><div className="field"><label>Feedback</label><textarea className="textarea" value={feedback} onChange={(e)=>setFeedback(e.target.value)} required maxLength={1500}/></div><button className="btn btn-primary" disabled={busy}>Submit feedback</button></form></section> : null}
    </div>

    <aside className="stack">
      <section className="panel client-details-panel">
        <div className="panel-title"><div><h3>Assignment details</h3><p className="muted small">Keep your contact and requirement details accurate.</p></div>{canEditDetails && !editingDetails ? <button type="button" className="btn btn-soft btn-sm" onClick={()=>setEditingDetails(true)}><Pencil size={14}/> Edit</button> : <FileText/>}</div>
        {editingDetails ? <form className="client-edit-form" onSubmit={updateDetails}>
          <div className="field"><label>Full name *</label><input className="input" name="studentName" defaultValue={assignment.student_name || ""} required/></div>
          <div className="field"><label>Contact number *</label><input className="input" name="contactNumber" defaultValue={assignment.contact_number || ""} required/></div>
          <div className="field"><label>Email</label><input className="input" name="email" type="email" defaultValue={assignment.email || ""}/></div>
          <div className="field"><label>University / institute *</label><input className="input" name="university" defaultValue={assignment.university || ""} required/></div>
          <div className="field"><label>Degree / programme</label><input className="input" name="programme" defaultValue={assignment.programme || ""}/></div>
          <div className="field"><label>Module / subject</label><input className="input" name="moduleName" defaultValue={assignment.module_name || ""}/></div>
          <div className="field"><label>Assignment / project title *</label><input className="input" name="assignmentTitle" defaultValue={assignment.assignment_title || ""} required/></div>
          <div className="field"><label>Deadline *</label><input className="input" name="deadline" type="datetime-local" defaultValue={dateTimeLocalValue(assignment.deadline)} required/></div>
          <div className="field"><label>Task description *</label><textarea className="textarea" name="description" defaultValue={assignment.description || ""} required/></div>
          <div className="field"><label>Special instructions</label><textarea className="textarea" name="specialInstructions" defaultValue={assignment.special_instructions || ""}/></div>
          <div className="client-edit-actions"><button className="btn btn-primary btn-sm" disabled={busy}><Save size={15}/> Save details</button><button type="button" className="btn btn-soft btn-sm" disabled={busy} onClick={()=>setEditingDetails(false)}><X size={15}/> Cancel</button></div>
        </form> : <div className="detail-list"><div className="detail-row"><span>Student</span><strong>{assignment.student_name}</strong></div><div className="detail-row"><span>Contact</span><strong>{assignment.contact_number}</strong></div><div className="detail-row"><span>Email</span><strong>{assignment.email || "—"}</strong></div><div className="detail-row"><span>University</span><strong>{assignment.university}</strong></div><div className="detail-row"><span>Programme</span><strong>{assignment.programme || "—"}</strong></div><div className="detail-row"><span>Module</span><strong>{assignment.module_name || "—"}</strong></div><div className="detail-row"><span>Deadline</span><strong>{formatDate(assignment.deadline)}</strong></div><div className="detail-row"><span>Group</span><strong>{assignment.is_group ? `Yes · ${assignment.group_members} members` : "No"}</strong></div><div className="detail-row"><span>Submitted</span><strong>{formatDate(assignment.created_at)}</strong></div></div>}

        {submittedDocuments.length ? <div className="submitted-documents"><div className="submitted-documents-heading"><strong>Your submitted documents</strong><span>You can download a copy at any time.</span></div>{submittedDocuments.map((file:any)=><div className="submitted-document" key={file.id}><div className="file-name"><strong>{file.original_name}</strong><span className="tiny muted">{file.kind === "payment_proof" ? "Payment proof" : "Support document"} · {formatFileSize(file.size_bytes)}</span></div><a className="btn btn-soft btn-sm" href={`/api/client/${token}/download/${file.id}`}><Download size={14}/> Download</a></div>)}</div> : null}
      </section>

      {accepted ? (
        <section className="payment-card">
          <div className="payment-card-header">
            <div><span className="eyebrow">Payment</span><h3>Bank transfer details</h3></div>
            <span className="payment-card-icon"><Banknote size={19}/></span>
          </div>
          <div className="payment-total">
            <span>Amount to pay</span>
            <strong>{formatMoney(assignment.quoted_amount, assignment.currency || data.settings.currency)}</strong>
          </div>
          <div className="payment-choice">
            <CheckCircle2 size={20}/>
            <div>
              <strong>{hasSecondAccount ? "Choose either account" : "Use the account below"}</strong>
              <span>{hasSecondAccount ? "You can pay the full amount to any one of the accounts below." : "Transfer the full amount using the account details below."}</span>
            </div>
          </div>
          <div className="payment-accounts">
            <PaymentAccount
              option="Account option 1"
              bank={data.settings.bank_name}
              accountName={data.settings.account_name}
              accountNumber={data.settings.account_number}
              branch={data.settings.bank_branch}
            />
            {hasSecondAccount ? (
              <PaymentAccount
                option="Account option 2"
                bank={data.settings.bank_name_2}
                accountName={data.settings.account_name_2}
                accountNumber={data.settings.account_number_2}
                branch={data.settings.bank_branch_2}
              />
            ) : null}
          </div>
          {data.settings.payment_note ? (
            <div className="payment-note">
              <strong>Payment note</strong>
              <p>{data.settings.payment_note}</p>
            </div>
          ) : null}
        </section>
      ) : null}

      {accepted && assignment.payment_status !== "verified" ? <section className="panel"><div className="panel-title"><h3>Submit payment reference</h3><FileCheck2/></div><form className="stack" onSubmit={sendPayment}><div className="field"><label>Reference / transaction ID *</label><input className="input" value={paymentRef} onChange={(e)=>setPaymentRef(e.target.value)} required/></div><div className="field"><label>Note</label><textarea className="textarea" value={paymentNote} onChange={(e)=>setPaymentNote(e.target.value)} placeholder="Payment date, sender name or anything admin should know."/></div><div className="field"><label>Payment proof (optional, maximum 5 MB)</label><input className="input" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={(e)=>setProof(e.target.files?.[0] || null)}/></div><button className="btn btn-primary" disabled={busy}>{busy ? "Submitting…" : "Send for verification"}</button></form>{assignment.payment_status === "submitted" ? <div className="notice notice-info">A payment reference is already awaiting verification. You may resubmit corrected details.</div> : null}</section> : null}

      {assignment.payment_status === "verified" ? <section className="panel"><div className="lock-box" style={{background:"#ebf8f2"}}><CheckCircle2 color="#15805d" size={34}/><h3>Payment verified</h3><p className="muted small">Final downloads are {assignment.download_unlocked ? "unlocked" : "waiting for admin release"}.</p></div></section> : null}
    </aside>
  </div>;
}

function PaymentAccount({
  option,
  bank,
  accountName,
  accountNumber,
  branch
}: {
  option: string;
  bank: string;
  accountName: string;
  accountNumber: string;
  branch: string;
}) {
  return (
    <article className="payment-account">
      <div className="payment-account-heading">
        <span>{option}</span>
        <strong>{bank || "Bank account"}</strong>
      </div>
      <dl>
        <div className="payment-account-number">
          <dt>Account number</dt>
          <dd>{accountNumber || "—"}</dd>
        </div>
        <div>
          <dt>Account name</dt>
          <dd>{accountName || "—"}</dd>
        </div>
        <div>
          <dt>Branch</dt>
          <dd>{branch || "—"}</dd>
        </div>
      </dl>
    </article>
  );
}

function dateTimeLocalValue(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function formatFileSize(value: number | string | null) {
  const bytes = Number(value || 0);
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function activityActor(actor: string) {
  if (actor === "client") return "You";
  if (actor === "admin") return "StHelp";
  return "System";
}

function activitySummary(item: any) {
  const clientLabels: Record<string, string> = {
    request_submitted: "You submitted the assignment requirements.",
    client_message: "You sent a message to StHelp.",
    payment_submitted: "You submitted payment details for verification.",
    quote_accepted: "You accepted the quote.",
    quote_declined: "You declined the quote.",
    feedback_submitted: "You submitted feedback for review."
  };
  if (item.actor === "client" && clientLabels[item.event_type]) return clientLabels[item.event_type];
  if (item.actor === "client" && String(item.summary).startsWith("The client ")) {
    return `You ${String(item.summary).slice("The client ".length)}`;
  }
  return item.summary;
}

function nextStep(assignment: any) {
  if (assignment.quote_status === "sent") return "Review your quote";
  if (assignment.status === "submitted") return "We are reviewing your request";
  if (assignment.payment_status === "submitted") return "We are verifying your payment";
  if (assignment.payment_status !== "verified" && assignment.quoted_amount) return "Send your payment reference";
  if (assignment.status === "client_review" || assignment.status === "revision") return "Review the update and leave comments";
  if (assignment.status === "delivered") return assignment.download_unlocked ? "Your final files are ready" : "Final files are being released";
  return "Check the latest project update";
}

function StageRail({ assignment }: { assignment: any }) {
  const stages = [
    { label: "Request", done: true },
    { label: "Quote", done: assignment.quote_status === "accepted" || assignment.status !== "submitted", current: assignment.quote_status === "sent" },
    { label: "In progress", done: ["client_review", "revision", "completed", "delivered"].includes(assignment.status), current: ["accepted", "in_progress"].includes(assignment.status) },
    { label: "Review", done: ["completed", "delivered"].includes(assignment.status), current: ["client_review", "revision"].includes(assignment.status) },
    { label: "Delivered", done: assignment.status === "delivered", current: assignment.status === "completed" }
  ];
  return <div className="stage-rail" aria-label="Assignment workflow">{stages.map((stage, index) => <div className={`stage ${stage.done ? "done" : ""} ${stage.current ? "current" : ""}`} key={stage.label}><span>{stage.done ? <CheckCircle2 size={14}/> : index + 1}</span><small>{stage.label}</small></div>)}</div>;
}

function Preview({ file, token }: { file:any; token:string }) {
  const source = `/api/client/${token}/preview/${file.id}`;
  const isImage = String(file.mime_type).startsWith("image/");
  const isPdf = file.mime_type === "application/pdf";
  return <div style={{marginBottom:18}}><div className="file-row"><div className="file-name"><strong>{file.original_name}</strong><span className="tiny muted">Protected preview</span></div><span className="status-badge warning"><ShieldCheck size={14}/> Watermarked</span></div>{isImage || isPdf ? <div className="preview-shell" onContextMenu={(e)=>e.preventDefault()}>{isImage ? <img src={source} alt="Assignment preview" draggable={false}/> : <iframe src={`${source}#toolbar=0&navpanes=0&scrollbar=1`} title={file.original_name}/>}<div className="preview-watermark"/></div> : <div className="notice notice-info">This preview format cannot be displayed inside the browser. Ask admin to upload a PDF or image preview.</div>}<p className="help" style={{marginTop:8}}>Copy controls are restricted and the preview is watermarked. No web system can completely prevent screenshots or advanced browser capture.</p></div>;
}
