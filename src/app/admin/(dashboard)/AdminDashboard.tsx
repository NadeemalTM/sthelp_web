"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, Clipboard, ExternalLink, Link2, Plus, RefreshCw } from "lucide-react";
import { formatDate, formatMoney, statusLabel } from "@/lib/format";

export function AdminDashboard() {
  const [links, setLinks] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<any>(null);
  const [notice, setNotice] = useState("");

  const load = useCallback(async()=>{
    setLoading(true);
    try {
      const [linkRes, assignmentRes] = await Promise.all([fetch("/api/admin/links",{cache:"no-store"}),fetch("/api/admin/assignments",{cache:"no-store"})]);
      const [linkData, assignmentData] = await Promise.all([linkRes.json(), assignmentRes.json()]);
      if (!linkRes.ok) throw new Error(linkData.error);
      if (!assignmentRes.ok) throw new Error(assignmentData.error);
      setLinks(linkData.links || []); setAssignments(assignmentData.assignments || []);
    } catch(e){ setNotice(e instanceof Error ? e.message : "Unable to load dashboard."); }
    finally{ setLoading(false); }
  },[]);
  useEffect(()=>{void load();},[load]);

  const stats = useMemo(()=>({total:assignments.length,pending:assignments.filter(a=>a.status==="submitted").length,active:assignments.filter(a=>["accepted","in_progress","client_review","revision"].includes(a.status)).length,unpaid:assignments.filter(a=>a.payment_status!=="verified" && !["submitted","cancelled"].includes(a.status)).length}),[assignments]);

  async function createLink(event:React.FormEvent<HTMLFormElement>){event.preventDefault();setBusy(true);setNotice("");const form=new FormData(event.currentTarget);try{const response=await fetch("/api/admin/links",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({clientId:form.get("clientId"),phone:form.get("phone"),clientName:form.get("clientName")})});const data=await response.json();if(!response.ok)throw new Error(data.error||"Unable to create link.");setCreated(data);event.currentTarget.reset();await load();}catch(e){setNotice(e instanceof Error?e.message:"Unable to create link.");}finally{setBusy(false);}}
  async function copy(text:string){await navigator.clipboard.writeText(text);setNotice("Copied to clipboard.");}

  return <main className="admin-content stack"><div className="panel-title"><div><span className="eyebrow">Overview</span><h2 style={{marginTop:6}}>Admin dashboard</h2></div><button className="btn btn-soft btn-sm" onClick={()=>load()}><RefreshCw size={15}/> Refresh</button></div>{notice?<div className="notice notice-info">{notice}</div>:null}
    <section className="stats-grid"><div className="card stat-card"><div className="number">{stats.total}</div><div className="label">Total assignments</div></div><div className="card stat-card"><div className="number">{stats.pending}</div><div className="label">Waiting acceptance</div></div><div className="card stat-card"><div className="number">{stats.active}</div><div className="label">Active work</div></div><div className="card stat-card"><div className="number">{stats.unpaid}</div><div className="label">Payment pending</div></div></section>
    <section className="admin-grid"><div className="panel"><div className="panel-title"><div><h3>Create client link</h3><p className="muted small">Client ID can be the client’s phone number. A secure link and 6-digit PIN are generated.</p></div><Link2/></div><form className="form-grid" onSubmit={createLink}><div className="field"><label>Client ID *</label><input className="input" name="clientId" placeholder="0782067550" required/></div><div className="field"><label>Phone number</label><input className="input" name="phone" placeholder="0782067550"/></div><div className="field full"><label>Client name</label><input className="input" name="clientName" placeholder="Optional before submission"/></div><div className="field full"><button className="btn btn-primary" disabled={busy}><Plus size={17}/>{busy?"Creating…":"Create private link"}</button></div></form>{created?<div className="stack" style={{marginTop:18}}><div className="notice notice-success"><Check size={16}/> Link created. Send the direct URL or client ID + PIN through WhatsApp.</div><div><strong>Direct link</strong><div className="code-box">{created.url}</div><button className="btn btn-soft btn-sm" onClick={()=>copy(created.url)} style={{marginTop:8}}><Clipboard size={14}/> Copy link</button></div><div className="form-grid"><div><strong>Client ID</strong><div className="code-box">{created.clientId}</div></div><div><strong>PIN</strong><div className="code-box">{created.pin}</div></div></div></div>:null}</div>
      <div className="panel"><div className="panel-title"><div><h3>Recent client links</h3><p className="muted small">Links can be used before and after assignment submission.</p></div></div>{loading?<div className="loading"><div className="spinner"/></div>:<div className="stack">{links.slice(0,8).map(link=><div className="file-row" key={link.id}><div className="file-name"><strong>{link.client_name||link.client_id}</strong><span className="tiny muted">{link.client_id} · {statusLabel(link.status)}</span></div><a className="btn btn-soft btn-sm" href={`/portal/${link.token}`} target="_blank"><ExternalLink size={14}/></a></div>)}{!links.length?<p className="muted">No client links yet.</p>:null}</div>}</div></section>
    <section className="panel" id="assignments"><div className="panel-title"><div><h3>Assignments</h3><p className="muted small">Open a record to accept it, update progress, review payment and upload files.</p></div></div><div className="table-wrap"><table><thead><tr><th>Client</th><th>Assignment</th><th>Deadline</th><th>Status</th><th>Progress</th><th>Payment</th><th>Amount</th><th></th></tr></thead><tbody>{assignments.map(item=><tr key={item.id}><td><strong>{item.student_name}</strong><br/><span className="tiny muted">{item.contact_number}</span></td><td>{item.assignment_title}<br/><span className="tiny muted">{item.university}</span></td><td>{formatDate(item.deadline)}</td><td><span className="status-badge">{statusLabel(item.status)}</span></td><td>{item.progress}%</td><td>{statusLabel(item.payment_status)}</td><td>{formatMoney(item.quoted_amount,item.currency)}</td><td><Link className="btn btn-blue btn-sm" href={`/admin/assignments/${item.id}`}>Manage</Link></td></tr>)}{!assignments.length&&!loading?<tr><td colSpan={8}>No assignment submissions yet.</td></tr>:null}</tbody></table></div></section>
  </main>;
}
