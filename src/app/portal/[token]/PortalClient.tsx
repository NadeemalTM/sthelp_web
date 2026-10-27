"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  Clock3,
  CreditCard,
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
  Zap,
  X
} from "lucide-react";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { FIVE_MB } from "@/lib/constants";
import { formatDate, formatMoney, statusLabel } from "@/lib/format";
import { uploadPrivateFile } from "@/lib/upload-client";

type PortalData = any;

export function PortalClient({ token }: { token: string }) {
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [payHereReturnState, setPayHereReturnState] = useState<"returned" | "cancelled" | null>(null);

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
  useEffect(() => {
    const url = new URL(window.location.href);
    const payment = url.searchParams.get("payment");
    let confirmationPoll: number | undefined;
    if (payment === "returned") {
      setPayHereReturnState("returned");
      setNotice({ type: "info", text: "You returned from PayHere. Payment is confirmed only after PayHere sends its secure verification; this page will update automatically." });
      void load(true);
      let checks = 0;
      confirmationPoll = window.setInterval(() => {
        checks += 1;
        void load(true);
        if (checks >= 10 && confirmationPoll) window.clearInterval(confirmationPoll);
      }, 3_000);
    } else if (payment === "cancelled") {
      setPayHereReturnState("cancelled");
      setNotice({ type: "info", text: "You closed the PayHere page. The portal will still use PayHere’s signed server status; contact StHelp if you need to switch to bank transfer immediately." });
      void load(true);
    }
    if (payment) {
      url.searchParams.delete("payment");
      window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    }
    return () => { if (confirmationPoll) window.clearInterval(confirmationPoll); };
  }, [load]);
  useEffect(() => {
    if (payHereReturnState && data?.assignment?.payment_status === "verified") {
      setNotice({ type: "success", text: "Payment confirmed securely through PayHere." });
      setPayHereReturnState(null);
    }
  }, [data?.assignment?.payment_status, payHereReturnState]);

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

  if (loading) return <main className="portal-loading-page"><div className="portal-loading-card"><Image src="/sthelp-mark.png" alt="" width={64} height={64}/><span className="portal-loading-spinner"><Loader2 className="spinner" size={22}/></span><div><strong>Opening your workspace</strong><p>Loading the latest assignment, quotation and payment details…</p></div></div></main>;
  if (!data) return <main className="portal-error-page"><div className="portal-error-card"><span><AlertCircle size={27}/></span><div><small>Private portal</small><h1>Workspace unavailable</h1><p>{notice?.text || "Please request a new link from StHelp."}</p><a className="btn btn-dark" href="/access">Return to portal access</a></div></div></main>;

  return (
    <main className="page-shell client-portal-page">
      <header className="portal-header"><div className="container portal-header-inner"><a className="brand" href="/"><Image className="brand-logo" src="/sthelp-mark.png" alt="" width={48} height={48}/><span className="brand-copy">StHelp<small>Client workspace</small></span></a><div className="portal-header-tools"><div className="portal-client-identity"><span><i/> Private workspace</span><strong>{data.link.client_id}</strong><small>{lastSynced ? `Updated ${lastSynced.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Connecting…"}</small></div><button className="portal-refresh" type="button" onClick={() => void load(true)} disabled={busy} title="Refresh assignment updates" aria-label="Refresh assignment updates"><RefreshCw className={busy ? "spinner" : ""} size={17}/></button></div></div></header>
      <div className="container portal-main">
        {notice ? <div className={`notice notice-${notice.type}`} role={notice.type === "error" ? "alert" : "status"} aria-live="polite">{notice.text}</div> : null}
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
  const pricingServices = Array.isArray(data.pricingServices) ? data.pricingServices : [];

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
          pricingServiceSlug: form.get("pricingServiceSlug"),
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

  return <div className="stack submission-flow">
    <section className="panel submission-intro"><div><span className="eyebrow">Welcome to StHelp</span><h1>Tell us exactly what support you need.</h1><p className="lead">This private link becomes your live workspace after submission. You can return here for quotes, progress, revisions, payments and final files.</p></div><div className="submission-intro-steps"><span><strong>01</strong> Submit brief</span><span><strong>02</strong> Approve quote</span><span><strong>03</strong> Track delivery</span></div></section>

    <section className="submission-portfolio"><div className="section-title"><span className="eyebrow">Previous work</span><h2 style={{fontSize:"1.9rem"}}>Examples of supported work</h2></div><div className="portfolio-grid">{data.portfolio.map((item: any) => <article className="card portfolio-card" key={item.id}><div className="portfolio-visual">{item.image_url ? <img src={item.image_url} alt=""/> : <FileText size={44}/>}</div><span className="tag">{item.category}</span><h3>{item.title}</h3><p className="muted">{item.description}</p></article>)}</div></section>

    <section className="submission-feedback"><div className="section-title"><span className="eyebrow">Client feedback</span><h2 style={{fontSize:"1.9rem"}}>Recent experiences</h2></div><div className="testimonial-grid">{data.testimonials.slice(0,3).map((item:any) => <article className="card testimonial-card" key={item.id}><div className="stars">{"★".repeat(item.rating)}</div><p>“{item.feedback}”</p><div className="customer"><strong>{item.customer_name}</strong>{item.university ? ` · ${item.university}` : ""}</div></article>)}</div></section>

    <form className="form-card submission-form" onSubmit={submit}>
      <div className="section-title"><span className="eyebrow">Assignment request</span><h2 style={{fontSize:"2rem"}}>Your details and requirements</h2><p className="muted">Fields marked with * are required. Add as much detail as possible to avoid delays.</p></div>
      {!pricingServices.length ? <div className="notice notice-error" role="alert">Online ordering is temporarily unavailable because no services are published. Please contact StHelp and try again shortly.</div> : null}
      <div className="form-grid">
        <div className="field"><label>Full name *</label><input className="input" name="studentName" defaultValue={data.link.client_name || ""} required /></div>
        <div className="field"><label>Contact number *</label><input className="input" name="contactNumber" defaultValue={data.link.phone || data.link.client_id || ""} required /></div>
        <div className="field"><label>Email</label><input className="input" type="email" name="email" /></div>
        <div className="field"><label>University / institute *</label><input className="input" name="university" required /></div>
        <div className="field"><label>Degree / programme</label><input className="input" name="programme" /></div>
        <div className="field"><label>Module / subject</label><input className="input" name="moduleName" /></div>
        <div className="field full"><label>Assignment / project title *</label><input className="input" name="assignmentTitle" required /></div>
        <div className="field"><label>Type of support *</label><select className="select" name="pricingServiceSlug" disabled={!pricingServices.length} required><option value="">Select</option>{pricingServices.map((service:any) => <option value={service.slug} key={service.slug}>{service.name}{Number(service.starting_price)>0?` — from ${formatMoney(service.starting_price,service.currency||"LKR")}`:" — custom quote"}</option>)}</select></div>
        <div className="field"><label>Academic level</label><select className="select" name="academicLevel"><option value="">Select</option><option>Foundation</option><option>Diploma</option><option>Undergraduate</option><option>Postgraduate</option><option>Other</option></select></div>
        <div className="field"><label>Deadline *</label><input className="input" name="deadline" type="datetime-local" required /></div>
        <div className="field"><label>Group assignment?</label><select className="select" value={isGroup ? "yes" : "no"} onChange={(e)=>setIsGroup(e.target.value === "yes")}><option value="no">No</option><option value="yes">Yes</option></select></div>
        {isGroup ? <div className="field"><label>Number of group members *</label><input className="input" name="groupMembers" type="number" min="2" max="100" required /></div> : null}
        <div className="field full"><label>Task description and requirements *</label><textarea className="textarea" name="description" placeholder="Explain the task, required sections, technologies, word count, marking criteria and expected output." required /></div>
        <div className="field full"><label>Special instructions</label><textarea className="textarea" name="specialInstructions" placeholder="Referencing style, formatting rules, lecturer instructions, preferred software, etc." /></div>
        <div className="field full"><label>Support / guidance documents (optional, up to 5 MB each)</label><input className="input" type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.txt,.csv,.jpg,.jpeg,.png,.webp" onChange={(e)=>setSupportFiles(Array.from(e.target.files || []))} /><span className="help">You can upload one or more files, or skip this entirely. Accepted: documents, spreadsheets, slides, ZIP, text and images.</span></div>
        <label className="checkbox-row field full"><input type="checkbox" required/><span>I confirm that the details are correct and that I am responsible for following my university’s academic-integrity and submission rules.</span></label>
      </div>
      <div style={{marginTop:22}}><button className="btn btn-primary" disabled={busy || !pricingServices.length}>{busy ? <><Loader2 className="spinner" size={18}/> Submitting…</> : <><UploadCloud size={18}/> Submit requirements</>}</button></div>
    </form>
  </div>;
}

function DashboardView({ token, data, busy, setBusy, post, reload, setNotice }: any) {
  const assignment = data.assignment;
  const quoteAccepted = assignment.status !== "cancelled" && assignment.quote_status === "accepted" && Number(assignment.quoted_amount) > 0;
  const currentPayHere = data.payHerePayment?.current;
  const latestPayHere = data.payHerePayment?.latest;
  const payHerePending = currentPayHere?.status === "pending"
    || (currentPayHere?.status === "initiated" && new Date(currentPayHere.expiresAt).getTime() > Date.now());
  const payHerePaidReview = currentPayHere?.status === "paid" && assignment.payment_status !== "verified";
  const payHereChargeback = currentPayHere?.status === "charged_back";
  const payHereRefunded = !payHerePending
    && !payHerePaidReview
    && !payHereChargeback
    && latestPayHere?.status === "refunded";
  const payHereFailed = !payHerePending
    && !payHerePaidReview
    && !payHereChargeback
    && ["cancelled", "failed"].includes(String(latestPayHere?.status));
  const payHereDisplayState: PortalPayHereState = payHerePaidReview
    ? "review"
    : payHereChargeback
      ? "chargeback"
      : payHerePending
        ? "pending"
        : payHereRefunded
          ? "refunded"
          : null;
  const bankPaymentPending = assignment.payment_status === "submitted" && Boolean(assignment.payment_reference);
  const reviewPreviewAvailable = ["client_review", "revision", "completed", "delivered"].includes(assignment.status);
  const canDownloadFinals = assignment.payment_status === "verified" && assignment.download_unlocked;
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
  const [billingAddress, setBillingAddress] = useState("");
  const [billingCity, setBillingCity] = useState("");
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState(5);
  const [editingDetails, setEditingDetails] = useState(false);
  const hasSecondAccount = [
    data.settings.bank_name_2,
    data.settings.account_name_2,
    data.settings.account_number_2,
    data.settings.bank_branch_2
  ].some(Boolean);
  const whatsapp = normalizeWhatsAppNumber(data.settings.whatsapp_number);
  const urgentMessage = [
    "Hello StHelp 👋",
    "",
    "I need quick action for an urgent assignment request.",
    `Client ID: ${data.link.client_id}`,
    `Assignment: ${assignment.assignment_title}`,
    `Deadline: ${formatDate(assignment.deadline)}`,
    "",
    "Please review my portal requirements and respond when possible. Thank you."
  ].join("\n");
  const urgentWhatsAppHref = whatsapp
    ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(urgentMessage)}`
    : null;
  const showUrgentWhatsApp = Boolean(urgentWhatsAppHref)
    && assignment.quote_status !== "accepted"
    && assignment.status !== "cancelled";
  const progressValue = Math.min(100, Math.max(0, Number(assignment.progress) || 0));

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
    if (!proof) {
      setNotice({type:"error", text:"Upload the bank payment slip before submitting for verification."});
      return;
    }
    await run(async()=>{
      const proofFile = await uploadPrivateFile({file:proof, scope:"client-payment", token});
      await post("payment", {reference:paymentRef, note:paymentNote, proofFile});
    }, "Payment reference submitted for verification.");
  }

  async function sendFeedback(e:React.FormEvent) {
    e.preventDefault();
    if (await run(()=>post("feedback", {rating, feedback}), "Thank you. Your feedback was submitted for review.")) setFeedback("");
  }

  async function startPayHere(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNotice(null);
    try {
      const response = await fetch(`/api/client/${token}/payhere`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: billingAddress, city: billingCity })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to start PayHere checkout.");

      const form = document.createElement("form");
      form.method = "POST";
      form.action = payload.checkoutUrl;
      form.acceptCharset = "UTF-8";
      for (const [name, value] of Object.entries(payload.fields as Record<string, string>)) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = String(value);
        form.append(input);
      }
      try {
        window.sessionStorage.setItem("sthelp-payhere-return-path", window.location.pathname);
      } catch {
        // The return page provides a safe portal-access fallback if browser
        // storage is unavailable or the payment opens in another tab.
      }
      document.body.append(form);
      form.submit();
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Unable to start PayHere checkout." });
      setBusy(false);
    }
  }

  async function respondToQuote(accepted:boolean) {
    await run(()=>post("quoteResponse", {accepted, quoteSentAt:assignment.quote_sent_at}), accepted ? "Quote accepted. StHelp will begin the next stage." : "Quote declined. You can leave a comment if you would like to discuss it.");
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

  return <>
    {showUrgentWhatsApp ? <section className="portal-urgent-contact" aria-label="Urgent WhatsApp contact">
      <span className="portal-urgent-symbol"><Zap size={20} /></span>
      <div><span className="eyebrow">Quick action · urgent work</span><strong>Is your deadline very close?</strong><p>Use WhatsApp only when you need a faster response for urgent work. Keep normal updates, files and revision requests inside this portal.</p></div>
      <a className="btn portal-urgent-button" href={urgentWhatsAppHref!} target="_blank" rel="noreferrer"><WhatsAppIcon size={20} /> Message urgent request</a>
    </section> : null}
    <PortalSnapshot assignment={assignment} previewCount={previews.length} finalCount={finals.length} payHereState={payHereDisplayState} />
    <PortalSectionNav hasQuote={Boolean((assignment.quote_status === "draft" && assignment.starting_price_snapshot) || assignment.quote_status === "sent")} quoteAccepted={quoteAccepted} hasFiles={Boolean(previews.length || finals.length)} />
    <div className="portal-grid">
    <div className="stack">
      <section className="client-command-card" id="portal-overview">
        <div className="client-command-top"><div><span className="eyebrow">Your workspace</span><h1>{assignment.assignment_title}</h1><p>{assignment.module_name || assignment.service_type} · Due {formatDate(assignment.deadline)}</p></div><span className={`status-badge ${assignment.status === "delivered" ? "success" : ""}`}><Clock3 size={14}/>{statusLabel(assignment.status)}</span></div>
        <div className="client-command-body"><div className="client-next-step"><span>Your next step</span><strong>{nextStep(assignment,payHereDisplayState)}</strong><p>The workspace refreshes automatically when StHelp posts an update.</p></div><div className="client-progress-dial" style={{background:`conic-gradient(#d0f4c5 ${progressValue}%, rgba(255,255,255,.14) 0)`}} role="progressbar" aria-label="Assignment progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressValue}><span><strong>{progressValue}%</strong><small>complete</small></span></div></div>
        <div className="client-progress-line"><div className="progress-head"><span>Overall assignment progress</span><strong>{progressValue}%</strong></div><div className="progress-track"><div className="progress-fill" style={{width:`${progressValue}%`}}/></div></div>
        <StageRail assignment={assignment}/>
        {assignment.quote_status === "draft" ? <div className="notice notice-info">Your request is safely received. StHelp is reviewing the requirements and will send the final quotation here before any payment is due.</div> : null}
      </section>

      {assignment.quote_status === "draft" && assignment.starting_price_snapshot ? <section className="panel quote-panel" id="portal-quote"><div className="panel-title"><div><span className="eyebrow">Starting estimate</span><h3 style={{marginTop:6}}>Final quotation under review</h3></div><Clock3/></div><div className="quote-amount">From {formatMoney(assignment.starting_price_snapshot, assignment.starting_currency_snapshot || assignment.currency || data.settings.currency)}</div><p className="muted small">This is the public starting price saved when you ordered. StHelp will review the scope and send the final amount for your approval before payment.</p></section> : null}
      {assignment.quote_status === "sent" && assignment.status !== "cancelled" ? <section className="panel quote-panel" id="portal-quote"><div className="panel-title"><div><span className="eyebrow">Quote ready</span><h3 style={{marginTop:6}}>Review your support quote</h3></div><Banknote/></div><div className="quote-amount">{formatMoney(assignment.quoted_amount, assignment.currency || data.settings.currency)}</div>{assignment.quote_note ? <p className="muted" style={{whiteSpace:"pre-wrap"}}>{assignment.quote_note}</p> : <p className="muted small">Please review the quote and confirm whether you would like StHelp to proceed.</p>}<div className="quote-actions"><button className="btn btn-primary" disabled={busy} onClick={()=>respondToQuote(true)}><CheckCircle2 size={17}/> Accept quote</button><button className="btn btn-soft" disabled={busy} onClick={()=>respondToQuote(false)}>Decline</button></div></section> : null}
      {assignment.status === "cancelled" ? <div className="notice notice-info">This assignment request was cancelled. No new quotation or payment can be submitted for it.</div> : assignment.quote_status === "declined" ? <div className="notice notice-info">You declined the latest quote. Send StHelp a message if you would like to discuss the scope or receive a revised quotation.</div> : null}

      <section className="panel portal-section-card portal-progress-card" id="portal-progress"><div className="panel-title"><h3>Progress updates</h3><RefreshCw size={18}/></div>{data.progress.length ? <div className="timeline">{data.progress.map((item:any)=><div className="timeline-item" key={item.id}><span className="timeline-dot"/><div><strong>{item.title}</strong><p className="muted small">{item.details}</p><span className="tiny muted">{item.progress}% · {formatDate(item.created_at)}</span></div></div>)}</div> : <div className="lock-box"><Clock3/><h3>Waiting for the first update</h3><p className="muted small">Updates will be added here as the work progresses.</p></div>}</section>

      {quoteAccepted && ((reviewPreviewAvailable && previews.length) || finals.length) ? <section className="panel portal-section-card portal-files-card" id="portal-files"><div className="panel-title"><div><h3>Revision preview and final files</h3><p className="muted small">The preview is permanently watermarked and provided only for checking and revision requests.</p></div><FileLock2/></div>
        {reviewPreviewAvailable ? previews.map((file:any)=><Preview key={file.id} file={file} token={token}/>) : null}
        {reviewPreviewAvailable && !previews.length && finals.length && !canDownloadFinals ? <div className="lock-box"><LockKeyhole size={30}/><h3>Final output is ready</h3><p className="muted">A revision preview has not been uploaded. Ask StHelp to provide a protected preview.</p></div> : null}
        <div style={{marginTop:18}}>{finals.map((file:any)=><div className="file-row" key={file.id}><div className="file-name"><strong>{file.original_name}</strong><span className="tiny muted">Final deliverable</span></div>{canDownloadFinals ? <a className="btn btn-blue btn-sm" href={`/api/client/${token}/download/${file.id}`}><Download size={15}/> Download</a> : <span className="status-badge warning"><LockKeyhole size={14}/> Payment required</span>}</div>)}</div>
        {!canDownloadFinals && finals.length ? <div className="notice notice-info"><ShieldCheck size={16} style={{verticalAlign:"middle", marginRight:6}}/>Final documents remain private until payment is verified and StHelp unlocks them.</div> : null}
      </section> : null}

      <section className="panel portal-section-card portal-comments-card" id="portal-comments"><div className="panel-title"><h3>Comments and revision requests</h3><MessageSquareText/></div><div className="comment-list">{data.comments.length ? data.comments.map((item:any)=><div className={`comment ${item.author === "admin" ? "admin" : ""}`} key={item.id}>{item.message}<time>{item.author === "admin" ? "StHelp" : "You"} · {formatDate(item.created_at)}</time></div>) : <p className="muted small">No comments yet.</p>}</div><form className="form-inline" onSubmit={sendComment}><label className="sr-only" htmlFor="client-comment">Comment or revision request</label><input id="client-comment" className="input" value={comment} maxLength={1000} onChange={(e)=>setComment(e.target.value)} placeholder="Write a short comment or revision request…"/><button className="btn btn-blue" disabled={busy || !comment.trim()} aria-label="Send"><Send size={18}/></button></form></section>

      {canDownloadFinals && !assignment.feedback_submitted ? <section className="panel portal-section-card portal-feedback-card"><div className="panel-title"><div><h3>Share your feedback</h3><p className="muted small">Your feedback will appear publicly only after admin approval.</p></div><Star/></div><form className="stack" onSubmit={sendFeedback}><div className="field"><label>Rating</label><select className="select" value={rating} onChange={(e)=>setRating(Number(e.target.value))}>{[5,4,3,2,1].map(n=><option key={n} value={n}>{n} star{n>1?"s":""}</option>)}</select></div><div className="field"><label>Feedback</label><textarea className="textarea" value={feedback} onChange={(e)=>setFeedback(e.target.value)} required maxLength={1500}/></div><button className="btn btn-primary" disabled={busy}>Submit feedback</button></form></section> : null}
    </div>

    <aside className="stack portal-control-rail">
      <section className="panel client-details-panel portal-section-card" id="portal-details">
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

      {quoteAccepted && payHerePaidReview ? <section className="panel portal-payment-state" id="portal-payment"><div className="lock-box"><Clock3 size={32}/><h3>Payment received — review in progress</h3><p className="muted small">PayHere reported a successful payment that needs StHelp to reconcile. Do not pay again. We will update this portal after checking the transaction.</p></div></section> : null}
      {quoteAccepted && assignment.payment_status !== "verified" && !payHerePaidReview && !payHereChargeback ? (
        <section className="payment-card" id="portal-payment">
          <div className="payment-card-header">
            <div><span className="eyebrow">Payment</span><h3>Choose how to pay</h3></div>
            <span className="payment-card-icon"><Banknote size={19}/></span>
          </div>
          <div className="payment-total">
            <span>Amount to pay</span>
            <strong>{formatMoney(assignment.quoted_amount, assignment.currency || data.settings.currency)}</strong>
          </div>
          {payHerePending ? (
            <div className="payhere-option"><div className="payhere-option-heading"><span className="payhere-option-icon"><Clock3 size={19}/></span><div><strong>PayHere confirmation in progress</strong><span>{currentPayHere?.status === "pending" ? "PayHere is processing this transaction. Do not start another payment." : "Your checkout is reserved briefly. Complete it in the PayHere window or contact StHelp to change methods."}</span></div></div></div>
          ) : data.paymentOptions?.payHere && assignment.payment_status !== "verified" && !bankPaymentPending ? (
            <div className="payhere-option">
              <div className="payhere-option-heading">
                <span className="payhere-option-icon"><CreditCard size={19}/></span>
                <div><strong>Pay online securely with PayHere</strong><span>Use Visa, Mastercard or another method enabled in PayHere. Card details are never stored by StHelp.</span></div>
              </div>
              {assignment.email ? (
                <form className="payhere-form" onSubmit={startPayHere}>
                  <div className="field"><label htmlFor="payhere-address">Billing address *</label><input id="payhere-address" className="input" value={billingAddress} onChange={(event)=>setBillingAddress(event.target.value)} maxLength={300} autoComplete="street-address" required/></div>
                  <div className="field"><label htmlFor="payhere-city">City *</label><input id="payhere-city" className="input" value={billingCity} onChange={(event)=>setBillingCity(event.target.value)} maxLength={100} autoComplete="address-level2" required/></div>
                  <button className="btn payhere-button" disabled={busy}><CreditCard size={17}/>{busy ? "Opening PayHere…" : "Continue to PayHere"}</button>
                  <p className="help">By continuing, you agree to the <a href="/terms-and-conditions" target="_blank" rel="noreferrer">Terms</a>, <a href="/privacy-policy" target="_blank" rel="noreferrer">Privacy Policy</a> and <a href="/refund-policy" target="_blank" rel="noreferrer">Refund Policy</a>.</p>
                </form>
              ) : <div className="notice notice-info">Add your email address in Assignment details before using PayHere.</div>}
            </div>
          ) : null}
          {!payHerePending ? <>
          <div className="payment-method-divider"><span>Bank transfer</span></div>
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
          </> : null}
        </section>
      ) : null}

      {quoteAccepted && assignment.payment_status !== "verified" && !payHerePending && !payHerePaidReview && !payHereChargeback ? <section className="panel portal-payment-verification portal-section-card"><div className="panel-title"><div><h3>Bank transfer verification</h3><p className="muted small">Use this after paying to one of the bank accounts above.</p></div><FileCheck2/></div>{assignment.payment_status === "rejected" ? <div className="notice notice-error" role="alert">The previous payment could not be verified. Check the latest StHelp message, then submit the corrected reference and slip below.</div> : null}<form className="stack" onSubmit={sendPayment}><div className="field"><label htmlFor="bank-reference">Reference / transaction ID *</label><input id="bank-reference" className="input" value={paymentRef} onChange={(e)=>setPaymentRef(e.target.value)} required/></div><div className="field"><label htmlFor="bank-payment-note">Note</label><textarea id="bank-payment-note" className="textarea" value={paymentNote} onChange={(e)=>setPaymentNote(e.target.value)} placeholder="Payment date, sender name or anything admin should know."/></div><div className="field"><label htmlFor="bank-payment-slip">Bank payment slip * (maximum 5 MB)</label><input id="bank-payment-slip" className="input" type="file" required accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={(e)=>setProof(e.target.files?.[0] || null)}/></div><button className="btn btn-primary" disabled={busy}>{busy ? "Submitting…" : "Send slip for verification"}</button></form>{bankPaymentPending ? <div className="notice notice-info" role="status">Your payment reference and slip are awaiting verification. You may resubmit corrected details.</div> : null}</section> : null}
      {quoteAccepted && payHerePending && assignment.payment_status !== "verified" ? <div className="notice notice-info portal-payment-state" role="status">{data.paymentOptions?.payHere ? "PayHere checkout is awaiting a signed payment result. Do not make a second payment; contact StHelp if you need to change methods." : "An existing PayHere checkout is awaiting confirmation. Online checkout is temporarily unavailable, so contact StHelp before using bank transfer."}</div> : null}
      {quoteAccepted && payHereFailed && !bankPaymentPending && assignment.payment_status !== "verified" ? <div className="notice notice-error portal-payment-state" role="status">The latest PayHere checkout was not completed. You can retry online payment above or use bank transfer.</div> : null}
      {quoteAccepted && payHereRefunded && !bankPaymentPending && assignment.payment_status !== "verified" ? <div className="notice notice-info portal-payment-state" role="status">The previous PayHere payment was refunded. You may now choose a new payment method, or contact StHelp if you have questions.</div> : null}
      {quoteAccepted && payHereChargeback && assignment.payment_status !== "verified" ? <div className="notice notice-error portal-payment-state" role="alert">PayHere reported a chargeback for the online payment. Final files are locked; contact StHelp before making another payment.</div> : null}

      {assignment.payment_status === "verified" ? <section className="panel payment-verified-panel" id="portal-payment"><div className="lock-box" style={{background:"#ebf8f2"}}><CheckCircle2 color="#15805d" size={34}/><h3>Payment verified</h3><p className="muted small">Final downloads are {assignment.download_unlocked ? "unlocked" : "waiting for admin release"}.</p></div></section> : null}
    </aside>
    </div>
  </>;
}

function PortalSectionNav({ hasQuote, quoteAccepted, hasFiles }: { hasQuote: boolean; quoteAccepted: boolean; hasFiles: boolean }) {
  return <nav className="portal-section-nav" aria-label="Workspace sections">
    <a href="#portal-overview"><Clock3 size={16}/><span>Overview</span></a>
    {hasQuote ? <a href="#portal-quote"><Banknote size={16}/><span>Quotation</span></a> : null}
    {quoteAccepted ? <a href="#portal-payment"><CreditCard size={16}/><span>Payment</span></a> : null}
    {hasFiles ? <a href="#portal-files"><FileLock2 size={16}/><span>Files</span></a> : null}
    <a href="#portal-progress"><RefreshCw size={16}/><span>Updates</span></a>
    <a href="#portal-comments"><MessageSquareText size={16}/><span>Messages</span></a>
    <a href="#portal-details"><FileText size={16}/><span>Details</span></a>
  </nav>;
}

type PortalPayHereState = "pending" | "review" | "chargeback" | "refunded" | null;

function PortalSnapshot({ assignment, previewCount, finalCount, payHereState }: { assignment: any; previewCount: number; finalCount: number; payHereState: PortalPayHereState }) {
  const quoteLabels: Record<string, string> = {
    draft: "Under review",
    sent: "Ready to review",
    accepted: "Accepted",
    declined: "Declined"
  };
  const quoteLabel = assignment.status === "cancelled" ? "Closed" : quoteLabels[assignment.quote_status] || "Pending";
  const quoteTone = assignment.quote_status === "accepted" ? "success" : assignment.quote_status === "sent" ? "attention" : "neutral";
  const paymentLabel = assignment.payment_status === "verified"
    ? "Verified"
    : payHereState === "review"
      ? "Payment under review"
      : payHereState === "chargeback"
        ? "Chargeback review"
        : payHereState === "pending"
          ? "PayHere processing"
          : payHereState === "refunded"
            ? "Refunded"
    : assignment.payment_status === "submitted"
      ? "Under verification"
      : assignment.payment_status === "rejected"
        ? "Action required"
        : assignment.quote_status === "accepted"
          ? "Ready to pay"
          : "After quote approval";
  const paymentTone = assignment.payment_status === "verified"
    ? "success"
    : payHereState === "pending" || payHereState === "review"
      ? "attention"
    : payHereState === "chargeback"
      ? "danger"
    : assignment.payment_status === "rejected"
      ? "danger"
      : assignment.quote_status === "accepted"
        ? "attention"
        : "neutral";
  const documentLabel = finalCount
    ? `${finalCount} final file${finalCount === 1 ? "" : "s"}`
    : previewCount
      ? `${previewCount} preview${previewCount === 1 ? "" : "s"} ready`
      : "Waiting for upload";

  return <section className="portal-snapshot" aria-label="Assignment status overview">
    <div className={`portal-snapshot-item ${quoteTone}`}><span className="portal-snapshot-icon"><Banknote size={18}/></span><div><small>Quotation</small><strong>{quoteLabel}</strong></div></div>
    <div className={`portal-snapshot-item ${paymentTone}`}><span className="portal-snapshot-icon"><CreditCard size={18}/></span><div><small>Payment</small><strong>{paymentLabel}</strong></div></div>
    <div className={`portal-snapshot-item ${finalCount || previewCount ? "success" : "neutral"}`}><span className="portal-snapshot-icon"><FileText size={18}/></span><div><small>Documents</small><strong>{documentLabel}</strong></div></div>
    <div className="portal-snapshot-item next"><span className="portal-snapshot-icon"><Clock3 size={18}/></span><div><small>Next action</small><strong>{nextStep(assignment,payHereState)}</strong></div></div>
  </section>;
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

function normalizeWhatsAppNumber(value: unknown) {
  const digits = String(value || "").replace(/\D/g, "");
  return digits.startsWith("0") ? `94${digits.slice(1)}` : digits;
}

function formatFileSize(value: number | string | null) {
  const bytes = Number(value || 0);
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function nextStep(assignment: any, payHereState: PortalPayHereState = null) {
  if (assignment.status === "cancelled") return "This request is closed";
  if (assignment.quote_status === "sent") return "Review your quote";
  if (assignment.quote_status === "draft") return "We are reviewing your final quote";
  if (assignment.quote_status === "declined") return "Contact StHelp to discuss the quote";
  if (assignment.status === "submitted") return "We are reviewing your request";
  if (assignment.payment_status === "submitted") return "We are verifying your payment";
  if (payHereState === "review") return "Do not pay again — StHelp is reviewing it";
  if (payHereState === "chargeback") return "Contact StHelp about the chargeback";
  if (payHereState === "pending") return "Wait for PayHere confirmation";
  if (payHereState === "refunded") return "Choose a new payment method if required";
  if (assignment.quote_status === "accepted" && assignment.payment_status !== "verified") return "Choose a payment method";
  if (assignment.status === "client_review" || assignment.status === "revision") return "Review the update and leave comments";
  if (assignment.status === "delivered") return assignment.payment_status === "verified" && assignment.download_unlocked ? "Your final files are ready" : "Final files are locked until verified payment";
  return "Check the latest project update";
}

function StageRail({ assignment }: { assignment: any }) {
  const stages = [
    { label: "Request", done: true },
    { label: "Quote", done: assignment.quote_status === "accepted", current: assignment.quote_status === "sent" || assignment.quote_status === "draft" },
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
  return <div style={{marginBottom:18}}><div className="file-row"><div className="file-name"><strong>{file.original_name}</strong><span className="tiny muted">Revision viewing only · no original-file download</span></div><span className="status-badge warning"><ShieldCheck size={14}/> Permanently watermarked</span></div>{isImage || isPdf ? <div className={`preview-shell ${isPdf ? "pdf-preview" : "image-preview"}`} onContextMenu={(e)=>e.preventDefault()}>{isImage ? <img src={source} alt="Protected assignment preview" draggable={false}/> : <PdfCanvasPreview source={source} title={file.original_name}/>}<div className="preview-watermark"/></div> : <div className="notice notice-info">This preview format cannot be displayed inside the browser. Ask admin to upload a PDF or image preview.</div>}<p className="help" style={{marginTop:8}}>Use this preview only to request revisions. The watermark is embedded into every page; final downloadable files are released only after verified payment.</p></div>;
}

function PdfCanvasPreview({ source, title }: { source: string; title: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [renderedPages, setRenderedPages] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [viewerWidth, setViewerWidth] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setViewerWidth(Math.floor(container.getBoundingClientRect().width)));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let loadingTask: any = null;
    let document: any = null;

    async function renderDocument() {
      const container = containerRef.current;
      if (!container || viewerWidth <= 0) return;
      setState("loading");
      setRenderedPages(0);
      container.replaceChildren();

      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.mjs?v=${pdfjs.version}`;
        loadingTask = pdfjs.getDocument({ url: source });
        document = await loadingTask.promise;
        if (cancelled) return;
        setTotalPages(document.numPages);

        for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
          if (cancelled) return;
          const page = await document.getPage(pageNumber);
          const initialViewport = page.getViewport({ scale: 1 });
          const availableWidth = Math.max(1, Math.min(viewerWidth - 16, 980));
          const cssScale = availableWidth / initialViewport.width;
          const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.6);
          const viewport = page.getViewport({ scale: cssScale * pixelRatio });
          const canvas = window.document.createElement("canvas");
          const pageElement = window.document.createElement("div");
          const pageLabel = window.document.createElement("span");
          const context = canvas.getContext("2d", { alpha: false });
          if (!context) throw new Error("Canvas rendering is not available.");

          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          canvas.style.width = `${Math.floor(viewport.width / pixelRatio)}px`;
          canvas.style.height = `${Math.floor(viewport.height / pixelRatio)}px`;
          canvas.setAttribute("aria-label", `${title}, page ${pageNumber}`);
          canvas.setAttribute("draggable", "false");
          pageElement.className = "pdf-preview-page";
          pageLabel.className = "pdf-preview-page-number";
          pageLabel.textContent = `Page ${pageNumber} of ${document.numPages}`;
          pageElement.append(canvas, pageLabel);
          container.append(pageElement);
          await page.render({ canvas, canvasContext: context, viewport }).promise;
          page.cleanup();
          if (!cancelled) setRenderedPages(pageNumber);
        }
        if (!cancelled) setState("ready");
      } catch (error) {
        console.error(error);
        if (!cancelled) setState("error");
      }
    }

    void renderDocument();
    return () => {
      cancelled = true;
      containerRef.current?.replaceChildren();
      void loadingTask?.destroy?.();
      void document?.destroy?.();
    };
  }, [source, title, retryCount, viewerWidth]);

  return <div className="pdf-canvas-viewer" aria-label={`Protected PDF preview: ${title}`}>
    {state === "loading" ? <div className="pdf-preview-status"><Loader2 className="spinner" size={22}/><span>Preparing protected pages… {totalPages ? `${renderedPages}/${totalPages}` : ""}</span></div> : null}
    {state === "error" ? <div className="pdf-preview-error"><div className="notice notice-error">This preview could not be displayed. Please try loading it again.</div><button type="button" className="btn btn-soft btn-sm" onClick={()=>setRetryCount((count)=>count+1)}><RefreshCw size={15}/> Retry preview</button></div> : null}
    <div className="pdf-preview-pages" ref={containerRef}/>
  </div>;
}
