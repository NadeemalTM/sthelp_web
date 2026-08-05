"use client";

import { useState } from "react";
import { LogIn } from "lucide-react";

export function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/login", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({username:form.get("username"),password:form.get("password")}) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to sign in.");
      window.location.href = "/admin";
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to sign in."); }
    finally { setLoading(false); }
  }

  return <form className="stack" onSubmit={submit}><div className="field"><label>Username</label><input className="input" type="text" name="username" autoComplete="username" required/></div><div className="field"><label>Password</label><input className="input" type="password" name="password" autoComplete="current-password" required/></div>{error ? <div className="notice notice-error">{error}</div> : null}<button className="btn btn-blue btn-block" disabled={loading}><LogIn size={18}/>{loading ? "Signing in…" : "Sign in"}</button></form>;
}
