"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  KeyRound,
  PauseCircle,
  Pencil,
  PlayCircle,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Sparkles,
  Trash2,
  Users,
  X
} from "lucide-react";
import type {
  HumanizerPlanConfig,
  HumanizerSubscriber,
  SubscriberStatus
} from "@/lib/humanizer-admin-store";
import type {
  HumanizerIntensity,
  HumanizerMode,
  HumanizerTier
} from "@/lib/humanizer-engine";

type Notice = { type: "success" | "error" | "info"; text: string };

const ALL_MODES: { id: HumanizerMode; label: string }[] = [
  { id: "academic", label: "Standard Academic" },
  { id: "postgrad", label: "Level 7 Postgraduate" },
  { id: "lit_review", label: "Literature Review" },
  { id: "methodology", label: "Methodology & Lab" },
  { id: "business", label: "MBA & Case Study" },
  { id: "concise", label: "Executive Concise" }
];

const ALL_INTENSITIES: { id: HumanizerIntensity; label: string }[] = [
  { id: "balanced", label: "Balanced" },
  { id: "enhanced", label: "Enhanced" },
  { id: "stealth", label: "Deep Stealth" }
];

function generateAccessKey(tier: "pro" | "ultra"): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `STHELP-${tier.toUpperCase()}-${code}`;
}

export function HumanizerAdminManager() {
  const [plans, setPlans] = useState<Record<HumanizerTier, HumanizerPlanConfig> | null>(null);
  const [subscribers, setSubscribers] = useState<HumanizerSubscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  // Plan editor state
  const [selectedPlanTier, setSelectedPlanTier] = useState<HumanizerTier>("pro");
  const [planForm, setPlanForm] = useState<HumanizerPlanConfig | null>(null);
  const [planFeaturesText, setPlanFeaturesText] = useState("");

  // Subscriber editor state
  const [editingSub, setEditingSub] = useState<HumanizerSubscriber | null>(null);
  const [subTier, setSubTier] = useState<"pro" | "ultra">("pro");
  const [subCode, setSubCode] = useState(() => generateAccessKey("pro"));
  const [subStatus, setSubStatus] = useState<SubscriberStatus>("active");
  const [subDailyCredits, setSubDailyCredits] = useState<number>(50);
  const [subMaxWords, setSubMaxWords] = useState<number>(2500);
  const [subAmountPaid, setSubAmountPaid] = useState<number>(1900);
  const [subExpiresAt, setSubExpiresAt] = useState<string>("");

  // Search & filter
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/humanizer", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to load Humanizer settings.");
      setPlans(data.plans);
      setSubscribers(data.subscribers || []);
      const activePlan = data.plans?.[selectedPlanTier];
      if (activePlan) {
        setPlanForm(activePlan);
        setPlanFeaturesText((activePlan.features || []).join("\n"));
      }
    } catch (err) {
      setNotice({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to load Humanizer admin data."
      });
    } finally {
      setLoading(false);
    }
  }, [selectedPlanTier]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  function selectPlanForEdit(tier: HumanizerTier) {
    setSelectedPlanTier(tier);
    if (plans && plans[tier]) {
      setPlanForm({ ...plans[tier] });
      setPlanFeaturesText((plans[tier].features || []).join("\n"));
    }
  }

  function handleTierChangeForNewSub(nextTier: "pro" | "ultra") {
    setSubTier(nextTier);
    if (!editingSub) {
      setSubCode(generateAccessKey(nextTier));
      const p = plans?.[nextTier];
      setSubDailyCredits(p?.dailyCredits || (nextTier === "ultra" ? 200 : 50));
      setSubMaxWords(p?.maxWordsPerRun || (nextTier === "ultra" ? 10000 : 2500));
      setSubAmountPaid(p?.priceNumeric || (nextTier === "ultra" ? 4500 : 1900));
    }
  }

  function startEditSubscriber(sub: HumanizerSubscriber) {
    setEditingSub(sub);
    setSubTier(sub.tier);
    setSubCode(sub.accessCode);
    setSubStatus(sub.status);
    setSubDailyCredits(sub.dailyCredits);
    setSubMaxWords(sub.maxWordsPerRun);
    setSubAmountPaid(sub.amountPaidLkr);
    setSubExpiresAt(sub.expiresAt ? sub.expiresAt.slice(0, 10) : "");
    document.getElementById("subscriber-editor")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function clearSubscriberEditor() {
    setEditingSub(null);
    setSubTier("pro");
    setSubCode(generateAccessKey("pro"));
    setSubStatus("active");
    setSubDailyCredits(plans?.pro?.dailyCredits || 50);
    setSubMaxWords(plans?.pro?.maxWordsPerRun || 2500);
    setSubAmountPaid(plans?.pro?.priceNumeric || 1900);
    setSubExpiresAt("");
  }

  function addDaysToExpiry(days: number | null) {
    if (days === null) {
      setSubExpiresAt("");
      return;
    }
    const d = new Date();
    d.setDate(d.getDate() + days);
    setSubExpiresAt(d.toISOString().slice(0, 10));
  }

  async function savePlan(e: React.FormEvent) {
    e.preventDefault();
    if (!planForm) return;
    setBusy(true);
    setNotice(null);
    try {
      const features = planFeaturesText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      const res = await fetch("/api/admin/humanizer", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "plan",
          ...planForm,
          features
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to save plan.");
      await loadData();
      setNotice({
        type: "success",
        text: `${planForm.name} pricing, limits, and features updated live on /humanizer.`
      });
    } catch (err) {
      setNotice({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to update plan."
      });
    } finally {
      setBusy(false);
    }
  }

  async function saveSubscriber(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const form = new FormData(formEl);

    setBusy(true);
    setNotice(null);
    try {
      const payload = {
        type: "subscriber",
        id: editingSub?.id,
        customerName: String(form.get("customerName") || "").trim(),
        customerEmail: String(form.get("customerEmail") || "").trim(),
        customerWhatsapp: String(form.get("customerWhatsapp") || "").trim(),
        university: String(form.get("university") || "").trim(),
        tier: subTier,
        accessCode: subCode.trim().toUpperCase(),
        status: subStatus,
        dailyCredits: subDailyCredits,
        maxWordsPerRun: subMaxWords,
        amountPaidLkr: subAmountPaid,
        paymentReference: String(form.get("paymentReference") || "").trim(),
        expiresAt: subExpiresAt ? new Date(`${subExpiresAt}T23:59:59.000Z`).toISOString() : null,
        notes: String(form.get("notes") || "").trim()
      };

      const res = await fetch("/api/admin/humanizer", {
        method: editingSub ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to save subscriber.");
      await loadData();
      setNotice({
        type: "success",
        text: editingSub
          ? `Subscriber ${payload.customerName} (${payload.accessCode}) updated.`
          : `Subscriber ${payload.customerName} created with key ${payload.accessCode}.`
      });
      formEl.reset();
      clearSubscriberEditor();
    } catch (err) {
      setNotice({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to save subscriber."
      });
    } finally {
      setBusy(false);
    }
  }

  async function toggleSubscriberStatus(sub: HumanizerSubscriber) {
    const nextStatus: SubscriberStatus = sub.status === "active" ? "paused" : "active";
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/humanizer", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "subscriber",
          id: sub.id,
          customerName: sub.customerName,
          tier: sub.tier,
          accessCode: sub.accessCode,
          status: nextStatus
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to update status.");
      await loadData();
      setNotice({
        type: "success",
        text: `${sub.customerName}'s key (${sub.accessCode}) is now ${nextStatus}.`
      });
    } catch (err) {
      setNotice({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to update status."
      });
    } finally {
      setBusy(false);
    }
  }

  async function resetSubscriberDailyCredits(sub: HumanizerSubscriber) {
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/humanizer", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "subscriber",
          id: sub.id,
          customerName: sub.customerName,
          tier: sub.tier,
          accessCode: sub.accessCode,
          status: sub.status,
          creditsUsedToday: 0
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to reset credits.");
      await loadData();
      setNotice({
        type: "success",
        text: `Reset daily credits for ${sub.customerName} (${sub.accessCode}).`
      });
    } catch (err) {
      setNotice({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to reset credits."
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteSubscriber(sub: HumanizerSubscriber) {
    if (!window.confirm(`Delete subscriber "${sub.customerName}" and revoke key "${sub.accessCode}"?`)) {
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/humanizer", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: sub.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to delete subscriber.");
      await loadData();
      if (editingSub?.id === sub.id) clearSubscriberEditor();
      setNotice({ type: "success", text: `Subscriber ${sub.customerName} removed.` });
    } catch (err) {
      setNotice({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to delete subscriber."
      });
    } finally {
      setBusy(false);
    }
  }

  function copySubscriberInvite(sub: HumanizerSubscriber) {
    const planName = plans?.[sub.tier]?.name || (sub.tier === "ultra" ? "Dissertation Ultra" : "Academic Pro");
    const msg = `Hi ${sub.customerName}, your StHelp VerbaFlow™ (${planName}) access key is ready!\n\n🔑 Access Code: ${sub.accessCode}\n⚡ Daily Credits: ${sub.dailyCredits} runs/day\n📝 Word Limit: ${sub.maxWordsPerRun.toLocaleString()} words/run\n\nOpen https://sthelp.lk/humanizer, click "Unlock Pro / Ultra Key", and paste your code to start humanizing.`;
    navigator.clipboard.writeText(msg);
    setCopiedId(sub.id);
    setTimeout(() => setCopiedId(null), 2200);
  }

  const filteredSubscribers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return subscribers.filter((sub) => {
      if (statusFilter !== "all" && sub.status !== statusFilter && sub.tier !== statusFilter) {
        return false;
      }
      if (!q) return true;
      return `${sub.customerName} ${sub.accessCode} ${sub.customerEmail} ${sub.customerWhatsapp} ${sub.university} ${sub.paymentReference}`
        .toLowerCase()
        .includes(q);
    });
  }, [subscribers, search, statusFilter]);

  const stats = useMemo(() => {
    const activeCount = subscribers.filter((s) => s.status === "active").length;
    const totalRevenue = subscribers.reduce((sum, s) => sum + (Number(s.amountPaidLkr) || 0), 0);
    const totalRuns = subscribers.reduce((sum, s) => sum + (Number(s.totalRuns) || 0), 0);
    const totalWords = subscribers.reduce((sum, s) => sum + (Number(s.totalWordsProcessed) || 0), 0);
    return { activeCount, totalRevenue, totalRuns, totalWords };
  }, [subscribers]);

  if (loading && !plans) {
    return (
      <main className="admin-content admin-settings-page admin-pricing-page loading">
        <div className="spinner" />
      </main>
    );
  }

  return (
    <main className="admin-content admin-settings-page admin-pricing-page stack">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <span className="eyebrow">StHelp VerbaFlow™ Studio</span>
          <h2 style={{ marginTop: 7 }}>AI Humanizer — Plans, Features & Subscribed Users</h2>
          <p className="muted">
            Edit prices, credit limits, and included features for all 3 Humanizer tiers, and manage paid student access keys.
          </p>
        </div>
        <Link className="btn btn-soft btn-sm" href="/humanizer" target="_blank">
          <ExternalLink size={15} /> Open Live Humanizer Page
        </Link>
      </div>

      {notice ? (
        <div className={`notice notice-${notice.type}`} role="status">
          {notice.text}
        </div>
      ) : null}

      {/* Summary KPI Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 14
        }}
      >
        <div className="panel" style={{ padding: "16px 18px" }}>
          <span className="eyebrow">Active Subscribers</span>
          <div style={{ fontSize: "1.65rem", fontWeight: 800, marginTop: 4 }}>
            {stats.activeCount} <span className="muted small">/ {subscribers.length} total</span>
          </div>
        </div>
        <div className="panel" style={{ padding: "16px 18px" }}>
          <span className="eyebrow">Subscription Revenue</span>
          <div style={{ fontSize: "1.65rem", fontWeight: 800, marginTop: 4, color: "#0d6b58" }}>
            LKR {stats.totalRevenue.toLocaleString()}
          </div>
        </div>
        <div className="panel" style={{ padding: "16px 18px" }}>
          <span className="eyebrow">Total Subscriber Runs</span>
          <div style={{ fontSize: "1.65rem", fontWeight: 800, marginTop: 4 }}>
            {stats.totalRuns.toLocaleString()}
          </div>
        </div>
        <div className="panel" style={{ padding: "16px 18px" }}>
          <span className="eyebrow">Words Humanized</span>
          <div style={{ fontSize: "1.65rem", fontWeight: 800, marginTop: 4 }}>
            {stats.totalWords.toLocaleString()}
          </div>
        </div>
      </div>

      {/* SECTION 1: PLANS, PRICES & FEATURES EDITOR */}
      <section className="panel resource-admin-panel pricing-catalog-panel">
        <div className="panel-title">
          <div>
            <span className="eyebrow">Tier Configuration</span>
            <h3>Humanizer Plans, Prices & Features</h3>
            <p className="muted small">
              Select any of the 3 tiers below to customize its price, daily credit limit, word limit per run, and feature checklist.
            </p>
          </div>
        </div>

        {/* Tier Selector Cards */}
        {plans && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 14,
              marginBottom: 20
            }}
          >
            {(["free", "pro", "ultra"] as HumanizerTier[]).map((t) => {
              const p = plans[t];
              const isSelected = selectedPlanTier === t;
              return (
                <div
                  key={t}
                  onClick={() => selectPlanForEdit(t)}
                  style={{
                    cursor: "pointer",
                    border: isSelected ? "2px solid #0d6b58" : "1px solid rgba(15, 23, 42, 0.12)",
                    borderRadius: 14,
                    padding: 16,
                    background: isSelected ? "rgba(13, 107, 88, 0.05)" : "#fff",
                    transition: "all 0.15s ease"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <span className="eyebrow">{p.badge}</span>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 99,
                        background: isSelected ? "#0d6b58" : "#f1f5f9",
                        color: isSelected ? "#fff" : "#334155"
                      }}
                    >
                      {isSelected ? "Editing" : "Click to Edit"}
                    </span>
                  </div>
                  <h4 style={{ margin: "6px 0 4px", fontSize: "1.15rem" }}>{p.name}</h4>
                  <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "#0d6b58" }}>
                    {p.priceLkr}{" "}
                    <span className="muted small" style={{ fontWeight: 500 }}>
                      {p.billingPeriod}
                    </span>
                  </div>
                  <p className="muted small" style={{ marginTop: 6 }}>
                    {p.dailyCredits} credits/day · {p.maxWordsPerRun.toLocaleString()} words/run · {p.features.length} features
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* Active Plan Editor Form */}
        {planForm && (
          <form className="stack resource-editor pricing-editor" onSubmit={savePlan}>
            <div className="resource-editor-heading">
              <div>
                <strong>
                  <Sparkles size={16} style={{ verticalAlign: "middle", marginRight: 6 }} />
                  Editing Tier: {planForm.name} ({planForm.tier.toUpperCase()})
                </strong>
                <span>Changes immediately update the /humanizer studio and pricing cards.</span>
              </div>
            </div>

            <div className="form-grid">
              <div className="field">
                <label>Plan Name</label>
                <input
                  className="input"
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="field">
                <label>Badge Label</label>
                <input
                  className="input"
                  value={planForm.badge}
                  onChange={(e) => setPlanForm({ ...planForm, badge: e.target.value })}
                  required
                />
              </div>

              <div className="field">
                <label>Displayed Price Text (e.g. Free or LKR 1,900)</label>
                <input
                  className="input"
                  value={planForm.priceLkr}
                  onChange={(e) => setPlanForm({ ...planForm, priceLkr: e.target.value })}
                  required
                />
              </div>

              <div className="field">
                <label>Numeric Price (LKR)</label>
                <input
                  className="input"
                  type="number"
                  min={0}
                  step={50}
                  value={planForm.priceNumeric}
                  onChange={(e) => setPlanForm({ ...planForm, priceNumeric: Number(e.target.value) })}
                  required
                />
              </div>

              <div className="field">
                <label>Billing Period Label</label>
                <input
                  className="input"
                  value={planForm.billingPeriod}
                  onChange={(e) => setPlanForm({ ...planForm, billingPeriod: e.target.value })}
                  placeholder="/ month"
                />
              </div>

              <div className="field">
                <label>Single-Assignment Price Label</label>
                <input
                  className="input"
                  value={planForm.singlePassLkr}
                  onChange={(e) => setPlanForm({ ...planForm, singlePassLkr: e.target.value })}
                  placeholder="LKR 1,200 / assignment"
                />
              </div>

              <div className="field">
                <label>Daily Credits (Runs per Day)</label>
                <input
                  className="input"
                  type="number"
                  min={1}
                  max={10000}
                  value={planForm.dailyCredits}
                  onChange={(e) => setPlanForm({ ...planForm, dailyCredits: Number(e.target.value) })}
                  required
                />
              </div>

              <div className="field">
                <label>Max Words per Single Run</label>
                <input
                  className="input"
                  type="number"
                  min={50}
                  max={50000}
                  step={50}
                  value={planForm.maxWordsPerRun}
                  onChange={(e) => setPlanForm({ ...planForm, maxWordsPerRun: Number(e.target.value) })}
                  required
                />
              </div>

              <div className="field">
                <label>Capacity Summary Label</label>
                <input
                  className="input"
                  value={planForm.monthlyWordsLabel}
                  onChange={(e) => setPlanForm({ ...planForm, monthlyWordsLabel: e.target.value })}
                />
              </div>

              <div className="field">
                <label>CTA Button Label</label>
                <input
                  className="input"
                  value={planForm.ctaLabel}
                  onChange={(e) => setPlanForm({ ...planForm, ctaLabel: e.target.value })}
                />
              </div>

              <div className="field full">
                <label>Plan Tagline / Description</label>
                <input
                  className="input"
                  value={planForm.tagline}
                  onChange={(e) => setPlanForm({ ...planForm, tagline: e.target.value })}
                  required
                />
              </div>

              <div className="field full">
                <label>Included Plan Features (One feature per line)</label>
                <textarea
                  className="textarea"
                  rows={5}
                  value={planFeaturesText}
                  onChange={(e) => setPlanFeaturesText(e.target.value)}
                  placeholder="One feature per line"
                />
              </div>

              <div className="field full">
                <label>Allowed Writing Modes for {planForm.name}</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 6 }}>
                  {ALL_MODES.map((m) => {
                    const checked = planForm.allowedModes.includes(m.id);
                    return (
                      <label key={m.id} className="checkbox-row" style={{ margin: 0 }}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            const next = e.target.checked
                              ? [...planForm.allowedModes, m.id]
                              : planForm.allowedModes.filter((x) => x !== m.id);
                            if (next.length > 0) {
                              setPlanForm({ ...planForm, allowedModes: next });
                            }
                          }}
                        />
                        <span>{m.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="field full">
                <label>Allowed Rewrite Intensities for {planForm.name}</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 6 }}>
                  {ALL_INTENSITIES.map((item) => {
                    const checked = planForm.allowedIntensities.includes(item.id);
                    return (
                      <label key={item.id} className="checkbox-row" style={{ margin: 0 }}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            const next = e.target.checked
                              ? [...planForm.allowedIntensities, item.id]
                              : planForm.allowedIntensities.filter((x) => x !== item.id);
                            if (next.length > 0) {
                              setPlanForm({ ...planForm, allowedIntensities: next });
                            }
                          }}
                        />
                        <span>{item.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <label className="checkbox-row field">
                <input
                  type="checkbox"
                  checked={planForm.allowFreezeKeywords}
                  onChange={(e) => setPlanForm({ ...planForm, allowFreezeKeywords: e.target.checked })}
                />
                <span>Allow Custom Keyword Freeze Lock</span>
              </label>

              <label className="checkbox-row field">
                <input
                  type="checkbox"
                  checked={planForm.allowSentenceAlternatives}
                  onChange={(e) => setPlanForm({ ...planForm, allowSentenceAlternatives: e.target.checked })}
                />
                <span>Allow Click-to-Swap Sentence Alternatives</span>
              </label>

              <label className="checkbox-row field">
                <input
                  type="checkbox"
                  checked={planForm.allowReportDownload}
                  onChange={(e) => setPlanForm({ ...planForm, allowReportDownload: e.target.checked })}
                />
                <span>Allow Originality Certificate Download</span>
              </label>

              <label className="checkbox-row field">
                <input
                  type="checkbox"
                  checked={planForm.isFeatured}
                  onChange={(e) => setPlanForm({ ...planForm, isFeatured: e.target.checked })}
                />
                <span>Highlight as Most Popular / Featured Plan</span>
              </label>
            </div>

            <button className="btn btn-primary" type="submit" disabled={busy}>
              <Save size={17} /> Save {planForm.name} Configuration
            </button>
          </form>
        )}
      </section>

      {/* SECTION 2: SUBSCRIBED / PAID USERS MANAGEMENT */}
      <section className="panel resource-admin-panel pricing-catalog-panel">
        <div className="panel-title">
          <div>
            <span className="eyebrow">Access Keys & Subscriptions</span>
            <h3>Subscribed & Paid Users</h3>
            <p className="muted small">
              Issue Academic Pro or Dissertation Ultra access keys for paid students, monitor their daily credit usage, pause/extend subscriptions, or copy their WhatsApp welcome message.
            </p>
          </div>
        </div>

        <div className="resource-admin-grid">
          {/* Subscriber Form */}
          <form
            className="stack resource-editor pricing-editor"
            id="subscriber-editor"
            key={editingSub?.id || "new-subscriber"}
            onSubmit={saveSubscriber}
          >
            <div className="resource-editor-heading">
              <div>
                <strong>{editingSub ? `Edit ${editingSub.customerName}` : "Add Subscribed / Paid User"}</strong>
                <span>
                  {editingSub
                    ? "Update student subscription details, limits, or status."
                    : "Generate an instant Pro or Ultra key for a paid student."}
                </span>
              </div>
              {editingSub ? (
                <button type="button" className="btn btn-soft btn-sm" onClick={clearSubscriberEditor}>
                  <X size={14} /> Cancel
                </button>
              ) : (
                <Plus size={18} />
              )}
            </div>

            <div className="form-grid">
              <div className="field">
                <label>Student / Customer Name</label>
                <input
                  className="input"
                  name="customerName"
                  defaultValue={editingSub?.customerName || ""}
                  placeholder="e.g. Kavindu Perera"
                  required
                />
              </div>

              <div className="field">
                <label>Subscription Plan Tier</label>
                <select
                  className="input"
                  value={subTier}
                  onChange={(e) => handleTierChangeForNewSub(e.target.value as "pro" | "ultra")}
                >
                  <option value="pro">{plans?.pro?.name || "Academic Pro"}</option>
                  <option value="ultra">{plans?.ultra?.name || "Dissertation Ultra"}</option>
                </select>
              </div>

              <div className="field full">
                <label>Access Key (Entered by Student on /humanizer)</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    className="input"
                    value={subCode}
                    onChange={(e) => setSubCode(e.target.value.toUpperCase())}
                    placeholder="STHELP-PRO-XXXXXX"
                    required
                  />
                  <button
                    type="button"
                    className="btn btn-soft btn-sm"
                    onClick={() => setSubCode(generateAccessKey(subTier))}
                    title="Generate random access code"
                  >
                    <RefreshCw size={14} /> Generate
                  </button>
                </div>
              </div>

              <div className="field">
                <label>WhatsApp Number</label>
                <input
                  className="input"
                  name="customerWhatsapp"
                  defaultValue={editingSub?.customerWhatsapp || ""}
                  placeholder="94771234567"
                />
              </div>

              <div className="field">
                <label>Email Address</label>
                <input
                  className="input"
                  name="customerEmail"
                  type="email"
                  defaultValue={editingSub?.customerEmail || ""}
                  placeholder="student@university.edu.lk"
                />
              </div>

              <div className="field">
                <label>University / Institute</label>
                <input
                  className="input"
                  name="university"
                  defaultValue={editingSub?.university || ""}
                  placeholder="SLIIT / UoM / UoC"
                />
              </div>

              <div className="field">
                <label>Subscription Status</label>
                <select
                  className="input"
                  value={subStatus}
                  onChange={(e) => setSubStatus(e.target.value as SubscriberStatus)}
                >
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="expired">Expired</option>
                  <option value="revoked">Revoked</option>
                </select>
              </div>

              <div className="field">
                <label>Daily Credits Limit</label>
                <input
                  className="input"
                  type="number"
                  min={1}
                  max={10000}
                  value={subDailyCredits}
                  onChange={(e) => setSubDailyCredits(Number(e.target.value))}
                  required
                />
              </div>

              <div className="field">
                <label>Max Words per Run</label>
                <input
                  className="input"
                  type="number"
                  min={100}
                  max={50000}
                  step={100}
                  value={subMaxWords}
                  onChange={(e) => setSubMaxWords(Number(e.target.value))}
                  required
                />
              </div>

              <div className="field">
                <label>Amount Paid (LKR)</label>
                <input
                  className="input"
                  type="number"
                  min={0}
                  step={50}
                  value={subAmountPaid}
                  onChange={(e) => setSubAmountPaid(Number(e.target.value))}
                />
              </div>

              <div className="field">
                <label>Payment Ref / Receipt</label>
                <input
                  className="input"
                  name="paymentReference"
                  defaultValue={editingSub?.paymentReference || ""}
                  placeholder="Bank slip / PayHere ID"
                />
              </div>

              <div className="field full">
                <label>Expiry Date (Leave blank for no expiry)</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                  <input
                    className="input"
                    type="date"
                    style={{ flex: "1 1 160px" }}
                    value={subExpiresAt}
                    onChange={(e) => setSubExpiresAt(e.target.value)}
                  />
                  <button type="button" className="btn btn-soft btn-sm" onClick={() => addDaysToExpiry(30)}>
                    +30 Days
                  </button>
                  <button type="button" className="btn btn-soft btn-sm" onClick={() => addDaysToExpiry(90)}>
                    +90 Days
                  </button>
                  <button type="button" className="btn btn-soft btn-sm" onClick={() => addDaysToExpiry(365)}>
                    +1 Year
                  </button>
                  <button type="button" className="btn btn-soft btn-sm" onClick={() => addDaysToExpiry(null)}>
                    Lifetime
                  </button>
                </div>
              </div>

              <div className="field full">
                <label>Admin Notes</label>
                <input
                  className="input"
                  name="notes"
                  defaultValue={editingSub?.notes || ""}
                  placeholder="Optional note about payment or student package"
                />
              </div>
            </div>

            <button className="btn btn-primary" type="submit" disabled={busy}>
              {editingSub ? (
                <>
                  <Save size={17} /> Save Subscriber Changes
                </>
              ) : (
                <>
                  <Plus size={17} /> Create Subscriber & Activate Key
                </>
              )}
            </button>
          </form>

          {/* Subscribers List */}
          <div className="resource-admin-library pricing-library">
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <label className="search-field" style={{ flex: "1 1 220px" }}>
                <Search size={17} />
                <span className="sr-only">Search subscribers</span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, access key, WhatsApp, university..."
                />
              </label>
              <select
                className="input"
                style={{ width: "auto", minWidth: 140 }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Subscribers ({subscribers.length})</option>
                <option value="active">Active Only</option>
                <option value="pro">Academic Pro</option>
                <option value="ultra">Dissertation Ultra</option>
                <option value="paused">Paused</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            <div className="resource-admin-count">
              <strong>{filteredSubscribers.length}</strong> of {subscribers.length} subscribed users
            </div>

            <div className="resource-admin-list">
              {filteredSubscribers.map((sub) => {
                const statusColor =
                  sub.status === "active"
                    ? "#0d6b58"
                    : sub.status === "paused"
                      ? "#b45309"
                      : "#dc2626";
                return (
                  <article
                    className={`resource-admin-row ${editingSub?.id === sub.id ? "is-editing" : ""}`}
                    key={sub.id}
                  >
                    <div className="resource-admin-thumb">
                      <KeyRound size={20} />
                    </div>
                    <div className="resource-admin-copy">
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <strong>{sub.customerName}</strong>
                        <code
                          style={{
                            padding: "2px 8px",
                            borderRadius: 6,
                            background: "#f1f5f9",
                            fontWeight: 700,
                            fontSize: "0.8rem",
                            color: "#0f172a"
                          }}
                        >
                          {sub.accessCode}
                        </code>
                        <span
                          style={{
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            padding: "2px 8px",
                            borderRadius: 99,
                            background: sub.tier === "ultra" ? "#ede9fe" : "#e0f2fe",
                            color: sub.tier === "ultra" ? "#6d28d9" : "#0369a1"
                          }}
                        >
                          {sub.tier === "ultra" ? "Ultra" : "Pro"}
                        </span>
                        <span
                          style={{
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            color: statusColor
                          }}
                        >
                          ● {sub.status}
                        </span>
                      </div>
                      <span>
                        Today: <strong>{sub.creditsUsedToday}</strong>/{sub.dailyCredits} credits · Limit:{" "}
                        {sub.maxWordsPerRun.toLocaleString()} words/run · Total runs: {sub.totalRuns} (
                        {sub.totalWordsProcessed.toLocaleString()} words) · Paid: LKR{" "}
                        {sub.amountPaidLkr.toLocaleString()}
                        {sub.expiresAt ? ` · Expires: ${sub.expiresAt.slice(0, 10)}` : " · No expiry"}
                      </span>
                    </div>

                    <div className="resource-admin-actions">
                      <button
                        className="btn btn-soft btn-sm"
                        type="button"
                        title="Copy WhatsApp welcome message & key"
                        onClick={() => copySubscriberInvite(sub)}
                      >
                        {copiedId === sub.id ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                      <button
                        className="btn btn-soft btn-sm"
                        type="button"
                        title="Reset today's used credits to 0"
                        disabled={busy || sub.creditsUsedToday === 0}
                        onClick={() => resetSubscriberDailyCredits(sub)}
                      >
                        <RotateCcw size={14} />
                      </button>
                      <button
                        className="btn btn-soft btn-sm"
                        type="button"
                        title={sub.status === "active" ? "Pause key" : "Activate key"}
                        disabled={busy}
                        onClick={() => toggleSubscriberStatus(sub)}
                      >
                        {sub.status === "active" ? <PauseCircle size={14} /> : <PlayCircle size={14} />}
                      </button>
                      <button
                        className="btn btn-soft btn-sm"
                        type="button"
                        title="Edit subscriber"
                        disabled={busy}
                        onClick={() => startEditSubscriber(sub)}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        type="button"
                        title="Delete subscriber"
                        disabled={busy}
                        onClick={() => handleDeleteSubscriber(sub)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </article>
                );
              })}

              {!filteredSubscribers.length ? (
                <p className="muted small">
                  <Users size={15} style={{ verticalAlign: "middle", marginRight: 6 }} />
                  No subscribed users match your current filter.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

