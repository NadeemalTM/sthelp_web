"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BadgeDollarSign,
  ExternalLink,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Save,
  Search,
  Trash2,
  X
} from "lucide-react";
import { formatMoney } from "@/lib/format";

type Notice = { type: "success" | "error" | "info"; text: string };

type PricingService = {
  id: string;
  slug: string;
  name: string;
  short_description: string;
  starting_price: number | string | null;
  currency: string;
  features: string[];
  is_custom: boolean;
  is_featured: boolean;
  is_published: boolean;
  sort_order: number;
};

async function responseJson(response: Response) {
  const data = await response.json().catch(() => ({ error: "The server returned an invalid response." }));
  if (!response.ok) throw new Error(data.error || "The request failed.");
  return data;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function featureLines(features: string[]) {
  return Array.isArray(features) ? features.join("\n") : "";
}

export function PricingManager({ supabaseConfigured }: { supabaseConfigured: boolean }) {
  const [services, setServices] = useState<PricingService[]>([]);
  const [editing, setEditing] = useState<PricingService | null>(null);
  const [isCustom, setIsCustom] = useState(false);
  const [loading, setLoading] = useState(supabaseConfigured);
  const [busy, setBusy] = useState(false);
  const [setupRequired, setSetupRequired] = useState(false);
  const [setupMessage, setSetupMessage] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [search, setSearch] = useState("");

  const filteredServices = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return services;
    return services.filter((service) =>
      `${service.name} ${service.slug} ${service.short_description}`.toLowerCase().includes(query)
    );
  }, [search, services]);

  const load = useCallback(async () => {
    if (!supabaseConfigured) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/admin/pricing", { cache: "no-store" });
      const data = await responseJson(response);
      setServices(data.services || []);
      setSetupRequired(Boolean(data.setupRequired));
      setSetupMessage(String(data.message || ""));
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Unable to load pricing." });
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

  function editService(service: PricingService) {
    setEditing(service);
    setIsCustom(Boolean(service.is_custom));
    document.getElementById("pricing-editor")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function clearEditor() {
    setEditing(null);
    setIsCustom(false);
  }

  async function saveService(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const features = String(form.get("features") || "")
      .split(/\r?\n/)
      .map((feature) => feature.trim())
      .filter(Boolean);

    const saved = await run(async () => {
      const response = await fetch("/api/admin/pricing", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editing?.id,
          slug: form.get("slug"),
          name: form.get("name"),
          shortDescription: form.get("shortDescription"),
          startingPrice: isCustom ? null : form.get("startingPrice"),
          currency: form.get("currency"),
          features,
          isCustom,
          isFeatured: form.get("isFeatured") === "on",
          isPublished: form.get("isPublished") === "on",
          sortOrder: Number(form.get("sortOrder"))
        })
      });
      await responseJson(response);
    }, editing ? "Pricing service updated." : "Pricing service added.");

    if (saved) {
      formElement.reset();
      clearEditor();
    }
  }

  async function setPublished(service: PricingService) {
    await run(async () => {
      const response = await fetch("/api/admin/pricing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: service.id, isPublished: !service.is_published })
      });
      await responseJson(response);
    }, service.is_published ? "Pricing service hidden." : "Pricing service published.");
  }

  async function deleteService(service: PricingService) {
    if (!window.confirm(`Archive ${service.name}? It will disappear from the public page, while existing assignments keep their saved service and quote details.`)) return;
    const deleted = await run(async () => {
      const response = await fetch("/api/admin/pricing", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: service.id })
      });
      await responseJson(response);
    }, "Pricing service archived.");
    if (deleted && editing?.id === service.id) clearEditor();
  }

  if (loading) {
    return <main className="admin-content loading"><div className="spinner"/></main>;
  }

  if (!supabaseConfigured) {
    return <main className="admin-content admin-settings-page stack">
      <div><span className="eyebrow">Service catalogue</span><h2 style={{ marginTop: 7 }}>Pricing</h2><p className="muted">Manage the starting prices shown to website visitors.</p></div>
      <div className="notice notice-info">Connect Supabase in Vercel before managing pricing services.</div>
    </main>;
  }

  return <main className="admin-content admin-settings-page stack">
    <div><span className="eyebrow">Service catalogue</span><h2 style={{ marginTop: 7 }}>Pricing</h2><p className="muted">Manage public starting prices. Each client receives a final quote after their requirements are reviewed.</p></div>

    {notice ? <div className={`notice notice-${notice.type}`} role="status">{notice.text}</div> : null}
    {setupRequired ? <div className="notice notice-info"><strong>Database setup required.</strong> {setupMessage}</div> : null}

    <section className="panel resource-admin-panel">
      <div className="panel-title">
        <div><span className="eyebrow">Public pricing page</span><h3>Services and starting prices</h3><p className="muted small">Add, edit, order, feature or hide the services displayed to customers.</p></div>
        <Link className="btn btn-soft btn-sm" href="/pricing" target="_blank"><ExternalLink size={15}/> View page</Link>
      </div>

      <div className="resource-admin-grid">
        <form className="stack resource-editor" id="pricing-editor" key={editing?.id || "new-pricing-service"} onSubmit={saveService}>
          <div className="resource-editor-heading">
            <div><strong>{editing ? "Edit pricing service" : "Add a pricing service"}</strong><span>{editing ? "Update the selected service and save your changes." : "Create a service for the public pricing page."}</span></div>
            {editing ? <button type="button" className="btn btn-soft btn-sm" onClick={clearEditor}><X size={14}/> Cancel</button> : <Plus size={18}/>} 
          </div>

          <div className="form-grid">
            <div className="field"><label htmlFor="pricing-name">Service name</label><input id="pricing-name" className="input" name="name" defaultValue={editing?.name || ""} onBlur={(event) => {
              if (editing) return;
              const slugInput = event.currentTarget.form?.elements.namedItem("slug");
              if (slugInput instanceof HTMLInputElement && !slugInput.value.trim()) slugInput.value = slugify(event.currentTarget.value);
            }} maxLength={120} required/></div>
            <div className="field"><label htmlFor="pricing-slug">Slug</label><input id="pricing-slug" className="input" name="slug" defaultValue={editing?.slug || ""} pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={80} placeholder="report-writing" required/><span className="help">Lowercase letters, numbers and hyphens.</span></div>
            <div className="field full"><label htmlFor="pricing-description">Short description</label><textarea id="pricing-description" className="textarea" name="shortDescription" defaultValue={editing?.short_description || ""} maxLength={1000} required/></div>
            <div className="field"><label htmlFor="pricing-price">Starting price</label><input id="pricing-price" className="input" name="startingPrice" type="number" min="0.01" max="9999999999.99" step="0.01" defaultValue={editing?.starting_price ?? ""} disabled={isCustom} required={!isCustom}/><span className="help">The final assignment quote can be changed later.</span></div>
            <div className="field"><label htmlFor="pricing-currency">Currency</label><input id="pricing-currency" className="input" name="currency" value="LKR" readOnly required/><span className="help">Public starting prices are listed in Sri Lankan rupees.</span></div>
            <div className="field full"><label htmlFor="pricing-features">Included features</label><textarea id="pricing-features" className="textarea" name="features" defaultValue={featureLines(editing?.features || [])} placeholder={"One feature per line\nRequirements review\nScope-based final quote"} maxLength={1500}/><span className="help">One feature per line, with up to 12 features.</span></div>
            <div className="field"><label htmlFor="pricing-order">Sort order</label><input id="pricing-order" className="input" name="sortOrder" type="number" min="-10000" max="10000" step="1" defaultValue={editing?.sort_order ?? 0} required/></div>
            <label className="checkbox-row field"><input type="checkbox" checked={isCustom} onChange={(event) => setIsCustom(event.target.checked)}/><span>Custom quote without a starting price</span></label>
            <label className="checkbox-row field"><input type="checkbox" name="isFeatured" defaultChecked={Boolean(editing?.is_featured)}/><span>Feature this service</span></label>
            <label className="checkbox-row field"><input type="checkbox" name="isPublished" defaultChecked={editing ? Boolean(editing.is_published) : true}/><span>Publish this service</span></label>
          </div>

          <button className="btn btn-primary" disabled={busy || setupRequired}>{editing ? <><Save size={17}/> Save service</> : <><Plus size={17}/> Add service</>}</button>
        </form>

        <div className="resource-admin-library">
          <label className="search-field"><Search size={17}/><span className="sr-only">Search pricing services</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search services"/></label>
          <div className="resource-admin-count"><strong>{filteredServices.length}</strong> of {services.length} services</div>
          <div className="resource-admin-list">
            {filteredServices.map((service) => <article className="resource-admin-row" key={service.id}>
              <div className="resource-admin-thumb"><BadgeDollarSign size={21}/></div>
              <div className="resource-admin-copy"><strong>{service.name}</strong><span>{service.is_custom ? "Custom quote" : `${formatMoney(service.starting_price, service.currency)} and up`} · {service.is_published ? "Published" : "Hidden"}{service.is_featured ? " · Featured" : ""}</span></div>
              <div className="resource-admin-actions">
                <button className="btn btn-soft btn-sm" type="button" title="Edit service" aria-label={`Edit ${service.name}`} disabled={busy || setupRequired} onClick={() => editService(service)}><Pencil size={14}/></button>
                <Link className="btn btn-soft btn-sm" href={`/pricing#service-${encodeURIComponent(service.slug)}`} target="_blank" title="View pricing page" aria-label={`View ${service.name} on the pricing page`}><ExternalLink size={14}/></Link>
                <button className="btn btn-soft btn-sm" type="button" title={service.is_published ? "Hide service" : "Publish service"} aria-label={`${service.is_published ? "Hide" : "Publish"} ${service.name}`} disabled={busy || setupRequired} onClick={() => setPublished(service)}>{service.is_published ? <EyeOff size={14}/> : <Eye size={14}/>}</button>
                <button className="btn btn-danger btn-sm" type="button" title="Archive service" aria-label={`Archive ${service.name}`} disabled={busy || setupRequired} onClick={() => deleteService(service)}><Trash2 size={14}/></button>
              </div>
            </article>)}
            {!filteredServices.length ? <p className="muted small">{setupRequired ? "Run the pricing migration to load services." : "No pricing services match this search."}</p> : null}
          </div>
        </div>
      </div>
    </section>
  </main>;
}
