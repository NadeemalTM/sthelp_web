"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  RefreshCw,
  Send,
  ShieldCheck,
  Star,
  UploadCloud
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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/client/${token}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "This client link is unavailable.");
      setData(payload);
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Unable to load the portal." });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void load(); }, [load]);

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
      <header className="portal-header"><div className="container portal-header-inner"><a className="brand" href="/"><span className="brand-mark">St</span><span className="brand-copy">StHelp<small>Private client portal</small></span></a><div className="small">Client ID: <strong>{data.link.client_id}</strong></div></div></header>
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
  const [supportFile, setSupportFile] = useState<File | null>(null);
  const [isGroup, setIsGroup] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (supportFile && supportFile.size > FIVE_MB) {
      setNotice({ type: "error", text: "The support document must be 5 MB or smaller." });
      return;
    }

    setBusy(true);
    setNotice(null);
    try {
      let supportFileMeta = null;
      if (supportFile) {
        supportFileMeta = await uploadPrivateFile({ file: supportFile, scope: "client-support", token });
      }
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
          deadline: form.get("deadline"),
          isGroup,
          groupMembers: isGroup ? Number(form.get("groupMembers")) : null,
          description: form.get("description"),
          specialInstructions: form.get("specialInstructions"),
          supportFile: supportFileMeta
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
        <div className="field full"><label>Support / guidance document (one file, maximum 5 MB)</label><input className="input" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.txt,.csv,.jpg,.jpeg,.png,.webp" onChange={(e)=>setSupportFile(e.target.files?.[0] || null)} /><span className="help">The file is uploaded directly to private storage. Accepted: documents, spreadsheets, slides, ZIP, text and images.</span></div>
        <label className="checkbox-row field full"><input type="checkbox" required/><span>I confirm that the details are correct and that I am responsible for following my university’s academic-integrity and submission rules.</span></label>
      </div>
      <div style={{marginTop:22}}><button className="btn btn-primary" disabled={busy}>{busy ? <><Loader2 className="spinner" size={18}/> Submitting…</> : <><UploadCloud size={18}/> Submit requirements</>}</button></div>
    </form>
  </div>;
}

function DashboardView({ token, data, busy, setBusy, post, reload, setNotice }: any) {
  const assignment = data.assignment;
  const accepted = !["submitted", "cancelled"].includes(assignment.status);
  const previews = data.files.filter((f:any)=>f.kind === "preview");
  const finals = data.files.filter((f:any)=>f.kind === "final");
  const support = data.files.filter((f:any)=>f.kind === "support");
  const [comment, setComment] = useState("");
  const [paymentRef, setPaymentRef] = useState(assignment.payment_reference || "");
  const [paymentNote, setPaymentNote] = useState("");
  const [proof, setProof] = useState<File | null>(null);
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState(5);

  async function run(task: () => Promise<any>, success: string) {
    setBusy(true); setNotice(null);
    try { await task(); setNotice({type:"success", text:success}); await reload(); }
    catch (error) { setNotice({type:"error", text:error instanceof Error ? error.message : "Request failed."}); }
    finally { setBusy(false); }
  }

  async function sendComment(e:React.FormEvent) {
    e.preventDefault(); if (!comment.trim()) return;
    await run(()=>post("comment", {message:comment}), "Comment sent."); setComment("");
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
    await run(()=>post("feedback", {rating, feedback}), "Thank you. Your feedback was submitted for review.");
    setFeedback("");
  }

  return <div className="portal-grid">
    <div className="stack">
      <section className="panel">
        <div className="panel-title"><div><span className="eyebrow">{assignment.assignment_title}</span><h2 style={{fontSize:"1.85rem", marginTop:6}}>Assignment dashboard</h2></div><span className={`status-badge ${assignment.status === "delivered" ? "success" : ""}`}><Clock3 size={14}/>{statusLabel(assignment.status)}</span></div>
        <div className="progress-head"><span>Overall progress</span><span>{assignment.progress}%</span></div><div className="progress-track"><div className="progress-fill" style={{width:`${assignment.progress}%`}}/></div>
        {!accepted ? <div className="notice notice-info" style={{marginTop:18}}>Your request has been received. Progress and payment information will appear after admin accepts the task.</div> : null}
      </section>

      <section className="panel"><div className="panel-title"><h3>Progress updates</h3><RefreshCw size={18}/></div>{data.progress.length ? <div className="timeline">{data.progress.map((item:any)=><div className="timeline-item" key={item.id}><span className="timeline-dot"/><div><strong>{item.title}</strong><p className="muted small">{item.details}</p><span className="tiny muted">{item.progress}% · {formatDate(item.created_at)}</span></div></div>)}</div> : <div className="lock-box"><Clock3/><h3>Waiting for the first update</h3><p className="muted small">Updates will be added here as the work progresses.</p></div>}</section>

      {accepted && (previews.length || finals.length) ? <section className="panel"><div className="panel-title"><div><h3>Output preview and files</h3><p className="muted small">The protected preview is for checking and revision comments.</p></div><FileLock2/></div>
        {previews.map((file:any)=><Preview key={file.id} file={file} token={token}/>) }
        {!previews.length && finals.length && !assignment.download_unlocked ? <div className="lock-box"><LockKeyhole size={30}/><h3>Final output is ready</h3><p className="muted">A separate preview has not been uploaded. Ask admin to add a watermarked PDF or image preview.</p></div> : null}
        <div style={{marginTop:18}}>{finals.map((file:any)=><div className="file-row" key={file.id}><div className="file-name"><strong>{file.original_name}</strong><span className="tiny muted">Final deliverable</span></div>{assignment.download_unlocked ? <a className="btn btn-blue btn-sm" href={`/api/client/${token}/download/${file.id}`}><Download size={15}/> Download</a> : <span className="status-badge warning"><LockKeyhole size={14}/> Locked</span>}</div>)}</div>
        {!assignment.download_unlocked && finals.length ? <div className="notice notice-info"><ShieldCheck size={16} style={{verticalAlign:"middle", marginRight:6}}/>Downloads become available only after payment is verified by admin.</div> : null}
      </section> : null}

      <section className="panel"><div className="panel-title"><h3>Comments and revision requests</h3><MessageSquareText/></div><div className="comment-list">{data.comments.length ? data.comments.map((item:any)=><div className={`comment ${item.author === "admin" ? "admin" : ""}`} key={item.id}>{item.message}<time>{item.author === "admin" ? "StHelp" : "You"} · {formatDate(item.created_at)}</time></div>) : <p className="muted small">No comments yet.</p>}</div><form onSubmit={sendComment} style={{display:"flex", gap:10, marginTop:16}}><input className="input" value={comment} maxLength={1000} onChange={(e)=>setComment(e.target.value)} placeholder="Write a short comment or revision request…"/><button className="btn btn-blue" disabled={busy || !comment.trim()} aria-label="Send"><Send size={18}/></button></form></section>

      {assignment.download_unlocked && !assignment.feedback_submitted ? <section className="panel"><div className="panel-title"><div><h3>Share your feedback</h3><p className="muted small">Your feedback will appear publicly only after admin approval.</p></div><Star/></div><form className="stack" onSubmit={sendFeedback}><div className="field"><label>Rating</label><select className="select" value={rating} onChange={(e)=>setRating(Number(e.target.value))}>{[5,4,3,2,1].map(n=><option key={n} value={n}>{n} star{n>1?"s":""}</option>)}</select></div><div className="field"><label>Feedback</label><textarea className="textarea" value={feedback} onChange={(e)=>setFeedback(e.target.value)} required maxLength={1500}/></div><button className="btn btn-primary" disabled={busy}>Submit feedback</button></form></section> : null}
    </div>

    <aside className="stack">
      <section className="panel"><div className="panel-title"><h3>Assignment details</h3><FileText/></div><div className="detail-list"><div className="detail-row"><span>University</span><strong>{assignment.university}</strong></div><div className="detail-row"><span>Module</span><strong>{assignment.module_name || "—"}</strong></div><div className="detail-row"><span>Deadline</span><strong>{formatDate(assignment.deadline)}</strong></div><div className="detail-row"><span>Group</span><strong>{assignment.is_group ? `Yes · ${assignment.group_members} members` : "No"}</strong></div><div className="detail-row"><span>Submitted</span><strong>{formatDate(assignment.created_at)}</strong></div>{support.map((file:any)=><div className="detail-row" key={file.id}><span>Support file</span><strong>{file.original_name}</strong></div>)}</div></section>

      {accepted ? <section className="bank-box"><div className="panel-title"><h3>Payment details</h3><Banknote/></div><div className="amount">{formatMoney(assignment.quoted_amount, assignment.currency || data.settings.currency)}</div><div className="detail-list"><div className="detail-row"><span>Bank</span><strong>{data.settings.bank_name}</strong></div><div className="detail-row"><span>Account name</span><strong>{data.settings.account_name}</strong></div><div className="detail-row"><span>Account number</span><strong>{data.settings.account_number}</strong></div><div className="detail-row"><span>Branch</span><strong>{data.settings.bank_branch}</strong></div></div><p className="small" style={{color:"#c6d6e8", marginTop:14}}>{data.settings.payment_note}</p></section> : null}

      {accepted && assignment.payment_status !== "verified" ? <section className="panel"><div className="panel-title"><h3>Submit payment reference</h3><FileCheck2/></div><form className="stack" onSubmit={sendPayment}><div className="field"><label>Reference / transaction ID *</label><input className="input" value={paymentRef} onChange={(e)=>setPaymentRef(e.target.value)} required/></div><div className="field"><label>Note</label><textarea className="textarea" value={paymentNote} onChange={(e)=>setPaymentNote(e.target.value)} placeholder="Payment date, sender name or anything admin should know."/></div><div className="field"><label>Payment proof (optional, maximum 5 MB)</label><input className="input" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={(e)=>setProof(e.target.files?.[0] || null)}/></div><button className="btn btn-primary" disabled={busy}>{busy ? "Submitting…" : "Send for verification"}</button></form>{assignment.payment_status === "submitted" ? <div className="notice notice-info">A payment reference is already awaiting verification. You may resubmit corrected details.</div> : null}</section> : null}

      {assignment.payment_status === "verified" ? <section className="panel"><div className="lock-box" style={{background:"#ebf8f2"}}><CheckCircle2 color="#15805d" size={34}/><h3>Payment verified</h3><p className="muted small">Final downloads are {assignment.download_unlocked ? "unlocked" : "waiting for admin release"}.</p></div></section> : null}
    </aside>
  </div>;
}

function Preview({ file, token }: { file:any; token:string }) {
  const source = `/api/client/${token}/preview/${file.id}`;
  const isImage = String(file.mime_type).startsWith("image/");
  const isPdf = file.mime_type === "application/pdf";
  return <div style={{marginBottom:18}}><div className="file-row"><div className="file-name"><strong>{file.original_name}</strong><span className="tiny muted">Protected preview</span></div><span className="status-badge warning"><ShieldCheck size={14}/> Watermarked</span></div>{isImage || isPdf ? <div className="preview-shell" onContextMenu={(e)=>e.preventDefault()}>{isImage ? <img src={source} alt="Assignment preview" draggable={false}/> : <iframe src={`${source}#toolbar=0&navpanes=0&scrollbar=1`} title={file.original_name}/>}<div className="preview-watermark"/></div> : <div className="notice notice-info">This preview format cannot be displayed inside the browser. Ask admin to upload a PDF or image preview.</div>}<p className="help" style={{marginTop:8}}>Copy controls are restricted and the preview is watermarked. No web system can completely prevent screenshots or advanced browser capture.</p></div>;
}
