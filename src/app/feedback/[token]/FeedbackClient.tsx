"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { CheckCircle2, Loader2, Star } from "lucide-react";

export function FeedbackClient({ token }: { token: string }) {
  const [link, setLink] = useState<{ customerName: string | null; university: string | null } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [rating, setRating] = useState(5);

  const load = useCallback(async () => {
    try {
      const response = await fetch(`/api/feedback/${token}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "This feedback link is unavailable.");
      setLink(payload);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to open feedback link.");
    }
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/feedback/${token}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rating, customerName: form.get("customerName"), university: form.get("university"), feedback: form.get("feedback") }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to submit feedback.");
      setSubmitted(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to submit feedback.");
    } finally { setBusy(false); }
  }

  return <main className="access-page"><div className="access-wrap"><div className="access-logo"><Image src="/sthelp-logo.png" alt="StHelp" width={260} height={80} priority /></div><section className="access-card">{submitted ? <div className="stack" style={{ textAlign: "center" }}><CheckCircle2 size={42} color="#15805d" style={{ margin: "0 auto" }}/><h2>Thank you for your feedback!</h2><p className="muted">Your review has been received and will be shown publicly after approval.</p></div> : error && !link ? <div className="stack" style={{ textAlign: "center" }}><h2>Feedback link unavailable</h2><p className="muted">{error}</p></div> : !link ? <div className="loading"><div className="spinner"/></div> : <><div className="section-title"><span className="eyebrow">StHelp feedback</span><h2>How was your experience?</h2><p className="muted">Your review helps other customers and is published only after approval.</p></div>{error ? <div className="notice notice-error">{error}</div> : null}<form className="stack" onSubmit={submit}><div className="field"><label>Your name</label><input className="input" name="customerName" defaultValue={link.customerName || ""} placeholder="Your name" /></div><div className="field"><label>University / institute (optional)</label><input className="input" name="university" defaultValue={link.university || ""} placeholder="University or institute" /></div><div className="field"><label>Rating</label><select className="select" value={rating} onChange={(event) => setRating(Number(event.target.value))}>{[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} star{value === 1 ? "" : "s"}</option>)}</select></div><div className="field"><label>Your feedback *</label><textarea className="textarea" name="feedback" maxLength={1500} required placeholder="Tell us about your experience…" /></div><button className="btn btn-primary" disabled={busy}>{busy ? <><Loader2 className="spinner" size={18}/> Sending…</> : <><Star size={18}/> Submit feedback</>}</button></form></>}</section></div></main>;
}
