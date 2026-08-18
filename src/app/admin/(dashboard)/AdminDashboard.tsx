"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  Check,
  ChevronDown,
  Clipboard,
  Clock3,
  ExternalLink,
  Link2,
  MessageSquareQuote,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UsersRound,
  Zap
} from "lucide-react";
import { formatDate, formatMoney, statusLabel } from "@/lib/format";

export function AdminDashboard({ supabaseConfigured }: { supabaseConfigured: boolean }) {
  const [links, setLinks] = useState<any[]>([]);
  const [feedbackLinks, setFeedbackLinks] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<any>(null);
  const [feedbackCreated, setFeedbackCreated] = useState<any>(null);
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    if (!supabaseConfigured) {
      setLoading(false);
      setNotice("Connect Supabase in Vercel to enable client links and assignments.");
      return;
    }

    setLoading(true);
    try {
      const [linkRes, assignmentRes, feedbackLinkRes] = await Promise.all([
        fetch("/api/admin/links", { cache: "no-store" }),
        fetch("/api/admin/assignments", { cache: "no-store" }),
        fetch("/api/admin/feedback-links", { cache: "no-store" })
      ]);
      const [linkData, assignmentData, feedbackLinkData] = await Promise.all([
        linkRes.json(),
        assignmentRes.json(),
        feedbackLinkRes.json()
      ]);
      if (!linkRes.ok) throw new Error(linkData.error);
      if (!assignmentRes.ok) throw new Error(assignmentData.error);
      if (!feedbackLinkRes.ok) throw new Error(feedbackLinkData.error);
      setLinks(linkData.links || []);
      setAssignments(assignmentData.assignments || []);
      setFeedbackLinks(feedbackLinkData.links || []);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to load dashboard.");
    } finally {
      setLoading(false);
    }
  }, [supabaseConfigured]);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(() => {
    const now = Date.now();
    const soon = now + 3 * 24 * 60 * 60 * 1000;
    return {
      total: assignments.length,
      pending: assignments.filter((item) => item.status === "submitted").length,
      active: assignments.filter((item) =>
        ["accepted", "in_progress", "client_review", "revision"].includes(item.status)
      ).length,
      dueSoon: assignments.filter((item) => {
        const deadline = new Date(item.deadline).getTime();
        return deadline >= now && deadline <= soon && !["delivered", "cancelled"].includes(item.status);
      }).length
    };
  }, [assignments]);

  const filteredAssignments = useMemo(
    () =>
      assignments.filter((item) => {
        const matchesStatus = statusFilter === "all" || item.status === statusFilter;
        const query = search.trim().toLowerCase();
        const matchesSearch =
          !query ||
          [item.student_name, item.assignment_title, item.university, item.assigned_to, item.contact_number]
            .some((value) => String(value || "").toLowerCase().includes(query));
        return matchesStatus && matchesSearch;
      }),
    [assignments, search, statusFilter]
  );

  const attention = useMemo(
    () =>
      assignments
        .filter(
          (item) =>
            item.status === "submitted" ||
            (item.deadline &&
              new Date(item.deadline).getTime() < Date.now() + 3 * 24 * 60 * 60 * 1000 &&
              !["delivered", "cancelled"].includes(item.status))
        )
        .slice(0, 4),
    [assignments]
  );

  async function createLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabaseConfigured) {
      setNotice("Connect Supabase in Vercel before creating client links.");
      return;
    }
    setBusy(true);
    setNotice("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      const response = await fetch("/api/admin/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: form.get("clientId"),
          phone: form.get("phone"),
          clientName: form.get("clientName")
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to create link.");
      setCreated(data);
      formElement.reset();
      await load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to create link.");
    } finally {
      setBusy(false);
    }
  }

  async function createFeedbackLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabaseConfigured) {
      setNotice("Connect Supabase in Vercel before creating feedback links.");
      return;
    }
    setBusy(true);
    setNotice("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      const response = await fetch("/api/admin/feedback-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: form.get("customerName"),
          university: form.get("university")
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to create feedback link.");
      setFeedbackCreated(data);
      formElement.reset();
      await load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to create feedback link.");
    } finally {
      setBusy(false);
    }
  }

  async function clearAssignments(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabaseConfigured) {
      setNotice("Connect Supabase in Vercel before using cleanup tools.");
      return;
    }
    setBusy(true);
    setNotice("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      const response = await fetch("/api/admin/assignments/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled: form.get("enabled") === "on",
          confirmPhrase: String(form.get("confirmPhrase") || "")
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to clear assignment data.");
      setNotice(
        `Cleared ${data.deletedAssignments} assignments, ${data.deletedFiles} files, and ${data.deletedClientLinks} client links.`
      );
      formElement.reset();
      await load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to clear assignment data.");
    } finally {
      setBusy(false);
    }
  }

  async function copy(text: string) {
    await navigator.clipboard.writeText(text);
    setNotice("Copied to clipboard.");
  }

  return (
    <main className="admin-content admin-dashboard stack">
      <section className="admin-page-header">
        <div>
          <span className="eyebrow">Today&apos;s workspace</span>
          <h1>Dashboard</h1>
          <p>Review new requests, update active work and create client access.</p>
        </div>
        <div className="admin-page-actions">
          <span className="live-indicator"><i /> Live data</span>
          <button className="btn btn-soft btn-sm" onClick={() => load()} disabled={!supabaseConfigured || loading}>
            <RefreshCw size={15} className={loading ? "spin" : undefined} />
            Refresh
          </button>
        </div>
      </section>

      {notice ? <div className="notice notice-info" role="status">{notice}</div> : null}

      <section className="admin-stats" aria-label="Assignment summary">
        <article className="admin-metric">
          <span className="metric-icon"><UsersRound size={17} /></span>
          <div><strong>{stats.total}</strong><span>Total assignments</span></div>
        </article>
        <article className="admin-metric metric-pending">
          <span className="metric-icon"><Zap size={17} /></span>
          <div><strong>{stats.pending}</strong><span>New requests</span></div>
        </article>
        <article className="admin-metric metric-active">
          <span className="metric-icon"><ArrowUpRight size={17} /></span>
          <div><strong>{stats.active}</strong><span>In progress</span></div>
        </article>
        <article className="admin-metric metric-due">
          <span className="metric-icon"><Clock3 size={17} /></span>
          <div><strong>{stats.dueSoon}</strong><span>Due in 3 days</span></div>
        </article>
      </section>

      <div className="admin-workspace">
        <div className="admin-workspace-main stack">
          <section className="panel attention-panel">
            <div className="panel-title compact">
              <div>
                <span className="eyebrow">Priority</span>
                <h2>Needs attention</h2>
              </div>
            </div>
            {attention.length ? (
              <div className="attention-list">
                {attention.map((item) => (
                  <Link href={`/admin/assignments/${item.id}`} className="attention-row" key={item.id}>
                    <span className={`attention-dot ${item.priority === "urgent" ? "danger" : ""}`} />
                    <div>
                      <strong>{item.assignment_title}</strong>
                      <small>{item.student_name} · {item.university}</small>
                    </div>
                    <span className={`status-badge ${item.priority === "urgent" ? "danger" : "warning"}`}>
                      {item.status === "submitted" ? "New" : formatDate(item.deadline)}
                    </span>
                    <ArrowUpRight size={17} />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="attention-empty"><Check size={18} /> All caught up — nothing urgent right now.</div>
            )}
          </section>

          <section className="panel assignments-panel" id="assignments">
            <div className="panel-title assignments-heading">
              <div>
                <span className="eyebrow">All work</span>
                <h2>Assignments</h2>
                <p className="muted small">Search and open a record to manage its complete workflow.</p>
              </div>
              <span className="record-count">{filteredAssignments.length} records</span>
            </div>
            <div className="admin-filters">
              <label className="search-field">
                <Search size={17} />
                <span className="sr-only">Search assignments</span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search client, task or owner"
                />
              </label>
              <select className="select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter by status">
                <option value="all">All statuses</option>
                <option value="submitted">Submitted</option>
                <option value="accepted">Accepted</option>
                <option value="in_progress">In progress</option>
                <option value="client_review">Client review</option>
                <option value="revision">Revision</option>
                <option value="completed">Completed</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="table-wrap">
              <table className="admin-table">
                <thead>
                  <tr><th>Client</th><th>Assignment</th><th>Deadline</th><th>Status</th><th>Progress</th><th>Amount</th><th><span className="sr-only">Action</span></th></tr>
                </thead>
                <tbody>
                  {filteredAssignments.map((item) => (
                    <tr key={item.id}>
                      <td data-label="Client"><strong>{item.student_name}</strong><br /><span className="tiny muted">{item.contact_number}</span></td>
                      <td data-label="Assignment"><strong>{item.assignment_title}</strong><br /><span className="tiny muted">{item.university}{item.assigned_to ? ` · ${item.assigned_to}` : ""}</span></td>
                      <td data-label="Deadline">{formatDate(item.deadline)}<br /><span className={`priority-text ${item.priority === "urgent" ? "danger" : ""}`}>{statusLabel(item.priority || "normal")}</span></td>
                      <td data-label="Status"><span className="status-badge">{statusLabel(item.status)}</span><br /><span className="tiny muted">Payment: {statusLabel(item.payment_status)}</span></td>
                      <td data-label="Progress"><div className="table-progress"><span style={{ width: `${item.progress}%` }} /></div><small>{item.progress}%</small></td>
                      <td data-label="Amount">{formatMoney(item.quoted_amount, item.currency)}</td>
                      <td data-label="Action"><Link className="btn btn-blue btn-sm" href={`/admin/assignments/${item.id}`}>Open</Link></td>
                    </tr>
                  ))}
                  {!filteredAssignments.length && !loading ? (
                    <tr><td colSpan={7}>{assignments.length ? "No assignments match these filters." : supabaseConfigured ? "No assignment submissions yet." : "Waiting for Supabase configuration."}</td></tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <aside className="admin-tools stack" aria-label="Quick actions">
          <section className="panel quick-action-card">
            <div className="panel-title compact">
              <div><span className="eyebrow">Quick action</span><h2>Create client access</h2></div>
              <span className="panel-icon"><Link2 size={18} /></span>
            </div>
            <p className="muted small">Generate a secure portal link and 6-digit PIN.</p>
            <form className="stack compact-stack" onSubmit={createLink}>
              <div className="field"><label htmlFor="new-client-id">Client ID *</label><input id="new-client-id" className="input" name="clientId" autoComplete="off" placeholder="0782067550" required /></div>
              <div className="field"><label htmlFor="new-client-name">Client name</label><input id="new-client-name" className="input" name="clientName" autoComplete="name" placeholder="Optional" /></div>
              <div className="field"><label htmlFor="new-client-phone">Phone number</label><input id="new-client-phone" className="input" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="Optional" /></div>
              <button className="btn btn-primary btn-block" disabled={busy || !supabaseConfigured}><Plus size={17} />{busy ? "Creating…" : "Create private link"}</button>
            </form>
            {created ? (
              <div className="created-link">
                <div className="created-link-head"><Check size={16} /><strong>Link ready</strong></div>
                <div className="code-box">{created.url}</div>
                <div className="created-credentials"><span>Client ID <strong>{created.clientId}</strong></span><span>PIN <strong>{created.pin}</strong></span></div>
                <button className="btn btn-soft btn-sm btn-block" type="button" onClick={() => copy(created.url)}><Clipboard size={14} /> Copy link</button>
              </div>
            ) : null}
          </section>

          <details className="admin-disclosure">
            <summary><span className="summary-icon"><MessageSquareQuote size={17} /></span><span><strong>Create feedback link</strong><small>One-time public review URL</small></span><ChevronDown size={17} /></summary>
            <div className="disclosure-body">
              <form className="stack compact-stack" onSubmit={createFeedbackLink}>
                <div className="field"><label htmlFor="feedback-customer-name">Customer name</label><input id="feedback-customer-name" className="input" name="customerName" autoComplete="name" placeholder="Optional" /></div>
                <div className="field"><label htmlFor="feedback-university">University / institute</label><input id="feedback-university" className="input" name="university" placeholder="Optional" /></div>
                <button className="btn btn-blue btn-block" disabled={busy || !supabaseConfigured}><Plus size={17} /> Create feedback link</button>
              </form>
              {feedbackCreated ? <div className="created-link"><div className="created-link-head"><Check size={16} /><strong>Feedback link ready</strong></div><div className="code-box">{feedbackCreated.url}</div><button className="btn btn-soft btn-sm btn-block" type="button" onClick={() => copy(feedbackCreated.url)}><Clipboard size={14} /> Copy link</button></div> : null}
            </div>
          </details>

          <details className="admin-disclosure">
            <summary><span className="summary-icon"><Clock3 size={17} /></span><span><strong>Recent links</strong><small>Client and feedback access</small></span><ChevronDown size={17} /></summary>
            <div className="disclosure-body link-history">
              <strong className="section-label">Client portals</strong>
              {loading ? <div className="loading compact-loading"><div className="spinner" /></div> : links.slice(0, 5).map((link) => (
                <div className="compact-link-row" key={link.id}><span><strong>{link.client_name || link.client_id}</strong><small>{link.client_id} · {statusLabel(link.status)}</small></span><a href={`/portal/${link.token}`} target="_blank" title="Open client portal"><ExternalLink size={15} /></a></div>
              ))}
              {!loading && !links.length ? <p className="muted small">No client links yet.</p> : null}
              <strong className="section-label">Feedback links</strong>
              {feedbackLinks.slice(0, 5).map((link) => (
                <div className="compact-link-row" key={link.id}><span><strong>{link.customer_name || "Unnamed customer"}</strong><small>{link.submitted_at ? "Submitted" : "Not used"}</small></span><a href={`/feedback/${link.token}`} target="_blank" title="Open feedback link"><ExternalLink size={15} /></a></div>
              ))}
              {!loading && !feedbackLinks.length ? <p className="muted small">No feedback links yet.</p> : null}
            </div>
          </details>

          <details className="admin-disclosure danger-disclosure">
            <summary><span className="summary-icon"><Trash2 size={17} /></span><span><strong>Data cleanup</strong><small>Permanent assignment deletion</small></span><ChevronDown size={17} /></summary>
            <div className="disclosure-body">
              <div className="notice notice-error small"><AlertTriangle size={16} /> This permanently removes all assignments, files, comments and client links.</div>
              <form className="stack compact-stack" onSubmit={clearAssignments}>
                <label className="checkbox-row"><input type="checkbox" name="enabled" required /><span>Enable one-time purge</span></label>
                <div className="field"><label htmlFor="assignment-clear-confirm">Type DELETE ALL ASSIGNMENTS</label><input id="assignment-clear-confirm" className="input" name="confirmPhrase" autoComplete="off" required /></div>
                <button className="btn btn-danger btn-block" disabled={busy || !supabaseConfigured}><Trash2 size={17} /> Clear assignment data</button>
              </form>
            </div>
          </details>
        </aside>
      </div>
    </main>
  );
}
