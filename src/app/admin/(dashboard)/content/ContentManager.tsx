"use client";

import { useCallback, useEffect, useState } from "react";
import { Eye, EyeOff, Plus, Save, Trash2 } from "lucide-react";
import { uploadPublicImage } from "@/lib/upload-client";

type Notice = { type: "success" | "error" | "info"; text: string };

async function responseJson(response: Response) {
  const data = await response.json().catch(() => ({ error: "The server returned an invalid response." }));
  if (!response.ok) throw new Error(data.error || "The request failed.");
  return data;
}

export function ContentManager({ supabaseConfigured }: { supabaseConfigured: boolean }) {
  const [settings, setSettings] = useState<any>(null);
  const [content, setContent] = useState<any>({ portfolio: [], testimonials: [] });
  const [loading, setLoading] = useState(supabaseConfigured);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [portfolioImage, setPortfolioImage] = useState<File | null>(null);

  const load = useCallback(async () => {
    if (!supabaseConfigured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [settingsResponse, contentResponse] = await Promise.all([
        fetch("/api/admin/settings", { cache: "no-store" }),
        fetch("/api/admin/content", { cache: "no-store" })
      ]);
      const [settingsData, contentData] = await Promise.all([
        responseJson(settingsResponse),
        responseJson(contentResponse)
      ]);
      setSettings(settingsData.settings);
      setContent(contentData);
      setNotice(null);
    } catch (error) {
      setNotice({
        type: "error",
        text: error instanceof Error ? error.message : "Unable to load settings."
      });
    } finally {
      setLoading(false);
    }
  }, [supabaseConfigured]);

  useEffect(() => {
    void load();
  }, [load]);

  async function run(task: () => Promise<void>, message: string) {
    setBusy(true);
    setNotice(null);
    try {
      await task();
      await load();
      setNotice({ type: "success", text: message });
      return true;
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Action failed." });
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function saveSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await run(async () => {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: form.get("businessName"),
          whatsappNumber: form.get("whatsappNumber"),
          bankName: form.get("bankName"),
          accountName: form.get("accountName"),
          accountNumber: form.get("accountNumber"),
          bankBranch: form.get("bankBranch"),
          bankName2: form.get("bankName2"),
          accountName2: form.get("accountName2"),
          accountNumber2: form.get("accountNumber2"),
          bankBranch2: form.get("bankBranch2"),
          paymentNote: form.get("paymentNote"),
          currency: form.get("currency"),
          supportNotice: form.get("supportNotice")
        })
      });
      await responseJson(response);
    }, "Business and payment settings saved.");
  }

  async function createPortfolio(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const saved = await run(async () => {
      let imageUrl: string | null = null;
      if (portfolioImage) {
        const uploaded = await uploadPublicImage({ file: portfolioImage });
        imageUrl = uploaded.imageUrl;
      }
      const response = await fetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          type: "portfolio",
          title: form.get("title"),
          category: form.get("category"),
          description: form.get("description"),
          imageUrl,
          sortOrder: Number(form.get("sortOrder")),
          isPublished: true
        })
      });
      await responseJson(response);
    }, "Portfolio item added.");
    if (saved) {
      formElement.reset();
      setPortfolioImage(null);
    }
  }

  async function createTestimonial(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const saved = await run(async () => {
      const response = await fetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          type: "testimonial",
          customerName: form.get("customerName"),
          university: form.get("university"),
          rating: Number(form.get("rating")),
          feedback: form.get("feedback"),
          isPublished: true
        })
      });
      await responseJson(response);
    }, "Testimonial added.");
    if (saved) formElement.reset();
  }

  async function contentAction(body: Record<string, unknown>, message: string) {
    await run(async () => {
      const response = await fetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      await responseJson(response);
    }, message);
  }

  if (loading) {
    return <main className="admin-content loading"><div className="spinner"/></main>;
  }

  if (!supabaseConfigured) {
    return <main className="admin-content admin-settings-page stack">
      <div><span className="eyebrow">Website management</span><h2 style={{ marginTop: 7 }}>Content and settings</h2><p className="muted">Update WhatsApp, bank details, public work examples and customer feedback.</p></div>
      <div className="notice notice-info">Supabase setup is required before website content can be edited.</div>
      <section className="panel stack">
        <h3>Complete the database connection</h3>
        <p className="muted">Add these variables to the Production environment in Vercel, then redeploy:</p>
        <div className="code-box">NEXT_PUBLIC_SUPABASE_URL</div>
        <div className="code-box">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</div>
        <div className="code-box">SUPABASE_SECRET_KEY</div>
        <p className="muted small">Run <strong>supabase/schema.sql</strong> once in the Supabase SQL Editor before using this page.</p>
      </section>
    </main>;
  }

  return <main className="admin-content admin-settings-page stack">
    <div><span className="eyebrow">Website management</span><h2 style={{ marginTop: 7 }}>Content and settings</h2><p className="muted">Update WhatsApp, bank details, public work examples and customer feedback.</p></div>
    {notice ? <div className={`notice notice-${notice.type}`}>{notice.text}</div> : null}

    {settings ? <section className="panel">
      <div className="panel-title"><div><h3>Business and payment settings</h3><p className="muted small">These details appear on the public website and active client dashboards.</p></div><Save/></div>
      <form className="form-grid" onSubmit={saveSettings}>
        <div className="field"><label htmlFor="business-name">Business name</label><input id="business-name" className="input" name="businessName" autoComplete="organization" defaultValue={settings.business_name} required/></div>
        <div className="field"><label htmlFor="whatsapp-number">WhatsApp number</label><input id="whatsapp-number" className="input" name="whatsappNumber" type="tel" inputMode="tel" autoComplete="tel" defaultValue={settings.whatsapp_number} placeholder="94782067550" required/></div>
        <div className="field"><label htmlFor="bank-name">Bank name</label><input id="bank-name" className="input" name="bankName" autoComplete="off" defaultValue={settings.bank_name} required/></div>
        <div className="field"><label htmlFor="account-name">Account name</label><input id="account-name" className="input" name="accountName" autoComplete="name" defaultValue={settings.account_name} required/></div>
        <div className="field"><label htmlFor="account-number">Account number</label><input id="account-number" className="input" name="accountNumber" inputMode="numeric" autoComplete="off" defaultValue={settings.account_number} required/></div>
        <div className="field"><label htmlFor="bank-branch">Branch</label><input id="bank-branch" className="input" name="bankBranch" autoComplete="off" defaultValue={settings.bank_branch} required/></div>
        <div className="field"><label htmlFor="bank-name-2">Second bank name</label><input id="bank-name-2" className="input" name="bankName2" autoComplete="off" defaultValue={settings.bank_name_2 || ""} required/></div>
        <div className="field"><label htmlFor="account-name-2">Second account name</label><input id="account-name-2" className="input" name="accountName2" autoComplete="off" defaultValue={settings.account_name_2 || ""} required/></div>
        <div className="field"><label htmlFor="account-number-2">Second account number</label><input id="account-number-2" className="input" name="accountNumber2" inputMode="numeric" autoComplete="off" defaultValue={settings.account_number_2 || ""} required/></div>
        <div className="field"><label htmlFor="bank-branch-2">Second branch</label><input id="bank-branch-2" className="input" name="bankBranch2" autoComplete="off" defaultValue={settings.bank_branch_2 || ""} required/></div>
        <div className="field"><label htmlFor="currency">Currency</label><input id="currency" className="input" name="currency" autoComplete="off" defaultValue={settings.currency} required/></div>
        <div className="field full"><label htmlFor="payment-note">Payment note</label><textarea id="payment-note" className="textarea" name="paymentNote" defaultValue={settings.payment_note} required/></div>
        <div className="field full"><label htmlFor="support-notice">Academic support notice</label><textarea id="support-notice" className="textarea" name="supportNotice" defaultValue={settings.support_notice} required/></div>
        <div className="field full"><button className="btn btn-blue" disabled={busy}><Save size={17}/> Save settings</button></div>
      </form>
    </section> : <div className="notice notice-error">The settings record is missing. Run the latest Supabase schema and refresh this page.</div>}

    <section className="admin-grid">
      <div className="panel">
        <div className="panel-title"><div><h3>Add previous work</h3><p className="muted small">Upload an image file or leave it empty for the default visual.</p></div><Plus/></div>
        <form className="stack" onSubmit={createPortfolio}>
          <div className="form-grid">
            <div className="field"><label htmlFor="portfolio-title">Title</label><input id="portfolio-title" className="input" name="title" autoComplete="off" required/></div>
            <div className="field"><label htmlFor="portfolio-category">Category</label><input id="portfolio-category" className="input" name="category" autoComplete="off" required/></div>
            <div className="field full"><label htmlFor="portfolio-description">Description</label><textarea id="portfolio-description" className="textarea" name="description" required/></div>
            <div className="field full"><label htmlFor="portfolio-image">Upload image</label><input id="portfolio-image" className="input" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(e) => setPortfolioImage(e.target.files?.[0] || null)}/><span className="help">Accepted: JPG, PNG, WebP or GIF. The file is uploaded to public storage and linked automatically.</span></div>
            <div className="field"><label htmlFor="portfolio-order">Sort order</label><input id="portfolio-order" className="input" type="number" name="sortOrder" defaultValue="0"/></div>
          </div>
          <button className="btn btn-primary" disabled={busy}>Add work item</button>
        </form>
      </div>

      <div className="panel">
        <div className="panel-title"><div><h3>Add customer feedback</h3><p className="muted small">Client-submitted feedback also appears below for approval.</p></div><Plus/></div>
        <form className="stack" onSubmit={createTestimonial}>
          <div className="form-grid">
            <div className="field"><label htmlFor="testimonial-name">Customer name</label><input id="testimonial-name" className="input" name="customerName" autoComplete="name" required/></div>
            <div className="field"><label htmlFor="testimonial-university">University</label><input id="testimonial-university" className="input" name="university" autoComplete="organization"/></div>
            <div className="field"><label htmlFor="testimonial-rating">Rating</label><select id="testimonial-rating" className="select" name="rating" defaultValue="5">{[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} stars</option>)}</select></div>
            <div className="field full"><label htmlFor="testimonial-feedback">Feedback</label><textarea id="testimonial-feedback" className="textarea" name="feedback" required/></div>
          </div>
          <button className="btn btn-primary" disabled={busy}>Add testimonial</button>
        </form>
      </div>
    </section>

    <section className="panel">
      <div className="panel-title"><h3>Previous work items</h3></div>
      {content.portfolio.map((item: any) => <div className="file-row" key={item.id}><div className="file-name"><strong>{item.title}</strong><span className="tiny muted">{item.category} · {item.is_published ? "Published" : "Hidden"}</span></div><div style={{ display: "flex", gap: 8 }}><button className="btn btn-soft btn-sm" type="button" title={item.is_published ? "Hide item" : "Publish item"} onClick={() => contentAction({ action: "toggle", type: "portfolio", id: item.id, isPublished: !item.is_published }, item.is_published ? "Item hidden." : "Item published.")}>{item.is_published ? <EyeOff size={14}/> : <Eye size={14}/>}</button><button className="btn btn-danger btn-sm" type="button" title="Delete item" onClick={() => window.confirm("Delete this work item?") && contentAction({ action: "delete", type: "portfolio", id: item.id }, "Item deleted.")}><Trash2 size={14}/></button></div></div>)}
      {!content.portfolio.length ? <p className="muted">No work examples.</p> : null}
    </section>

    <section className="panel">
      <div className="panel-title"><h3>Testimonials and pending feedback</h3></div>
      {content.testimonials.map((item: any) => <div className="file-row" key={item.id}><div className="file-name"><strong>{item.customer_name} · {"★".repeat(item.rating)}</strong><span className="tiny muted">{item.feedback} · {item.is_published ? "Published" : "Waiting / hidden"}</span></div><div style={{ display: "flex", gap: 8 }}><button className="btn btn-soft btn-sm" type="button" title={item.is_published ? "Hide feedback" : "Publish feedback"} onClick={() => contentAction({ action: "toggle", type: "testimonial", id: item.id, isPublished: !item.is_published }, item.is_published ? "Feedback hidden." : "Feedback published.")}>{item.is_published ? <EyeOff size={14}/> : <Eye size={14}/>}</button><button className="btn btn-danger btn-sm" type="button" title="Delete testimonial" onClick={() => window.confirm("Delete this testimonial?") && contentAction({ action: "delete", type: "testimonial", id: item.id }, "Testimonial deleted.")}><Trash2 size={14}/></button></div></div>)}
      {!content.testimonials.length ? <p className="muted">No testimonials.</p> : null}
    </section>
  </main>;
}
