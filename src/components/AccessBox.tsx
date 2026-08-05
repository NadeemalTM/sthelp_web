"use client";

import { useState } from "react";
import { ArrowRight, KeyRound } from "lucide-react";

export function AccessBox({ compact = false }: { compact?: boolean }) {
  const [clientId, setClientId] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, pin })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Access details are incorrect.");
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to access your portal.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className={compact ? "stack" : "form-card stack"}>
      {!compact && <div><span className="eyebrow"><KeyRound size={16}/> Existing client</span><h2 style={{fontSize:"1.65rem", marginTop:8}}>Open your progress dashboard</h2><p className="muted">Use the client ID and 6-digit PIN sent to you through WhatsApp.</p></div>}
      <div className="field">
        <label htmlFor="client-id">Client ID</label>
        <input id="client-id" className="input" value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder="Usually your phone number" required />
      </div>
      <div className="field">
        <label htmlFor="client-pin">6-digit PIN</label>
        <input id="client-pin" className="input" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0,6))} inputMode="numeric" minLength={6} maxLength={6} placeholder="••••••" required />
      </div>
      {error ? <div className="notice notice-error">{error}</div> : null}
      <button className="btn btn-blue btn-block" disabled={loading}>{loading ? "Checking…" : <>Open dashboard <ArrowRight size={18}/></>}</button>
    </form>
  );
}
