import fs from "node:fs";
import path from "node:path";
import { getServiceSupabase, isSupabaseConfigured } from "@/lib/supabase-server";
import type { HumanizerIntensity, HumanizerMode, HumanizerTier } from "@/lib/humanizer-engine";

export interface HumanizerPlanConfig {
  tier: HumanizerTier;
  name: string;
  badge: string;
  tagline: string;
  priceLkr: string;
  priceNumeric: number;
  billingPeriod: string;
  singlePassLkr: string;
  dailyCredits: number;
  maxWordsPerRun: number;
  monthlyWordsLabel: string;
  features: string[];
  ctaLabel: string;
  isFeatured: boolean;
  allowedModes: HumanizerMode[];
  allowedIntensities: HumanizerIntensity[];
  allowFreezeKeywords: boolean;
  allowSentenceAlternatives: boolean;
  allowReportDownload: boolean;
}

export type SubscriberStatus = "active" | "paused" | "expired" | "revoked";

export interface HumanizerSubscriber {
  id: string;
  customerName: string;
  customerEmail: string;
  customerWhatsapp: string;
  university: string;
  tier: "pro" | "ultra";
  accessCode: string;
  status: SubscriberStatus;
  dailyCredits: number;
  maxWordsPerRun: number;
  creditsUsedToday: number;
  lastUsageDate: string;
  totalRuns: number;
  totalWordsProcessed: number;
  lastUsedAt: string | null;
  amountPaidLkr: number;
  paymentReference: string;
  startsAt: string;
  expiresAt: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_HUMANIZER_PLANS: Record<HumanizerTier, HumanizerPlanConfig> = {
  free: {
    tier: "free",
    name: "Starter Free",
    badge: "Limited Free Credits",
    tagline: "Essential academic humanization for quick paragraph checks and short abstracts.",
    priceLkr: "Free",
    priceNumeric: 0,
    billingPeriod: "forever",
    singlePassLkr: "LKR 0",
    dailyCredits: 3,
    maxWordsPerRun: 400,
    monthlyWordsLabel: "3 Free Credits / Day (400 words/run)",
    features: [
      "3 free humanization runs every day",
      "Up to 400 words per single run",
      "Academic & Concise writing modes",
      "Balanced rewrite intensity",
      "APA / Harvard / IEEE citation shield",
      "Live AI risk & burstiness meter"
    ],
    ctaLabel: "Use Free Plan Above",
    isFeatured: false,
    allowedModes: ["academic", "concise"],
    allowedIntensities: ["balanced"],
    allowFreezeKeywords: false,
    allowSentenceAlternatives: false,
    allowReportDownload: false
  },
  pro: {
    tier: "pro",
    name: "Academic Pro",
    badge: "Most Popular · Advanced #1",
    tagline: "Deep Turnitin & GPTZero humanization for university essays, coursework & lab reports.",
    priceLkr: "LKR 1,900",
    priceNumeric: 1900,
    billingPeriod: "/ month",
    singlePassLkr: "LKR 1,200 / assignment",
    dailyCredits: 50,
    maxWordsPerRun: 2500,
    monthlyWordsLabel: "50 Priority Credits / Mo (2,500 words/run)",
    features: [
      "50 priority humanization runs per day",
      "Up to 2,500 words per single run",
      "All 6 discipline modes (Postgrad, Lit Review, Methodology, MBA)",
      "Enhanced & Deep Stealth intensity unlocked",
      "Interactive click-to-swap sentence alternatives",
      "Downloadable Integrity & Originality Certificate"
    ],
    ctaLabel: "Get Academic Pro Key",
    isFeatured: true,
    allowedModes: ["academic", "postgrad", "lit_review", "methodology", "business", "concise"],
    allowedIntensities: ["balanced", "enhanced", "stealth"],
    allowFreezeKeywords: false,
    allowSentenceAlternatives: true,
    allowReportDownload: true
  },
  ultra: {
    tier: "ultra",
    name: "Dissertation Ultra",
    badge: "Research Suite · Advanced #2",
    tagline: "Maximum neural rhythm restructuring, custom term locking & full-chapter capacity for FYPs & theses.",
    priceLkr: "LKR 4,500",
    priceNumeric: 4500,
    billingPeriod: "/ month",
    singlePassLkr: "LKR 3,500 / dissertation",
    dailyCredits: 200,
    maxWordsPerRun: 10000,
    monthlyWordsLabel: "200 Ultra Credits / Mo (10,000 words/run)",
    features: [
      "200 ultra-priority runs per day",
      "Up to 10,000 words per run (full thesis chapters)",
      "Custom Keyword Freeze Lock (up to 25 technical terms)",
      "Deep Stealth multi-pass burstiness engine",
      "All 6 academic & postgraduate discipline modes",
      "Priority WhatsApp human editor review support"
    ],
    ctaLabel: "Get Dissertation Ultra Key",
    isFeatured: false,
    allowedModes: ["academic", "postgrad", "lit_review", "methodology", "business", "concise"],
    allowedIntensities: ["balanced", "enhanced", "stealth"],
    allowFreezeKeywords: true,
    allowSentenceAlternatives: true,
    allowReportDownload: true
  }
};

const todayStr = () => new Date().toISOString().slice(0, 10);

export const DEFAULT_SUBSCRIBERS: HumanizerSubscriber[] = [
  {
    id: "sub-pro-default-1",
    customerName: "StHelp Academic Pro Demo",
    customerEmail: "pro@sthelp.lk",
    customerWhatsapp: "94782067550",
    university: "University of Colombo",
    tier: "pro",
    accessCode: "STHELP-PRO-2026",
    status: "active",
    dailyCredits: 50,
    maxWordsPerRun: 2500,
    creditsUsedToday: 0,
    lastUsageDate: todayStr(),
    totalRuns: 14,
    totalWordsProcessed: 18450,
    lastUsedAt: null,
    amountPaidLkr: 1900,
    paymentReference: "ADMIN-SEED-PRO",
    startsAt: "2026-01-01T00:00:00.000Z",
    expiresAt: null,
    notes: "Built-in Academic Pro master key",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z"
  },
  {
    id: "sub-pro-default-2",
    customerName: "Pro Scholar Access",
    customerEmail: "scholar@sthelp.lk",
    customerWhatsapp: "94782067550",
    university: "SLIIT / NSBM",
    tier: "pro",
    accessCode: "PRO-SCHOLAR",
    status: "active",
    dailyCredits: 50,
    maxWordsPerRun: 2500,
    creditsUsedToday: 0,
    lastUsageDate: todayStr(),
    totalRuns: 6,
    totalWordsProcessed: 7200,
    lastUsedAt: null,
    amountPaidLkr: 1900,
    paymentReference: "ADMIN-SEED-PRO-2",
    startsAt: "2026-01-01T00:00:00.000Z",
    expiresAt: null,
    notes: "Secondary Academic Pro key",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z"
  },
  {
    id: "sub-ultra-default-1",
    customerName: "StHelp Dissertation Ultra Demo",
    customerEmail: "ultra@sthelp.lk",
    customerWhatsapp: "94782067550",
    university: "University of Moratuwa",
    tier: "ultra",
    accessCode: "STHELP-ULTRA-2026",
    status: "active",
    dailyCredits: 200,
    maxWordsPerRun: 10000,
    creditsUsedToday: 0,
    lastUsageDate: todayStr(),
    totalRuns: 29,
    totalWordsProcessed: 94200,
    lastUsedAt: null,
    amountPaidLkr: 4500,
    paymentReference: "ADMIN-SEED-ULTRA",
    startsAt: "2026-01-01T00:00:00.000Z",
    expiresAt: null,
    notes: "Built-in Dissertation Ultra master key",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z"
  },
  {
    id: "sub-ultra-default-2",
    customerName: "Ultra Thesis Access",
    customerEmail: "thesis@sthelp.lk",
    customerWhatsapp: "94782067550",
    university: "Postgraduate Research",
    tier: "ultra",
    accessCode: "ULTRA-THESIS",
    status: "active",
    dailyCredits: 200,
    maxWordsPerRun: 10000,
    creditsUsedToday: 0,
    lastUsageDate: todayStr(),
    totalRuns: 11,
    totalWordsProcessed: 41300,
    lastUsedAt: null,
    amountPaidLkr: 4500,
    paymentReference: "ADMIN-SEED-ULTRA-2",
    startsAt: "2026-01-01T00:00:00.000Z",
    expiresAt: null,
    notes: "Secondary Dissertation Ultra key",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z"
  }
];

interface LocalStoreState {
  plans: Record<HumanizerTier, HumanizerPlanConfig>;
  subscribers: HumanizerSubscriber[];
}

const DATA_FILE_PATH = path.join(process.cwd(), "data", "humanizer-admin.json");

let memoryStore: LocalStoreState | null = null;

function readLocalStore(): LocalStoreState {
  if (memoryStore) return memoryStore;
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const raw = fs.readFileSync(DATA_FILE_PATH, "utf8");
      const parsed = JSON.parse(raw) as Partial<LocalStoreState>;
      memoryStore = {
        plans: {
          free: { ...DEFAULT_HUMANIZER_PLANS.free, ...(parsed.plans?.free || {}) },
          pro: { ...DEFAULT_HUMANIZER_PLANS.pro, ...(parsed.plans?.pro || {}) },
          ultra: { ...DEFAULT_HUMANIZER_PLANS.ultra, ...(parsed.plans?.ultra || {}) }
        },
        subscribers: Array.isArray(parsed.subscribers) ? parsed.subscribers : [...DEFAULT_SUBSCRIBERS]
      };
      return memoryStore;
    }
  } catch {
    // Fallback to in-memory defaults if file read fails
  }
  memoryStore = {
    plans: {
      free: { ...DEFAULT_HUMANIZER_PLANS.free },
      pro: { ...DEFAULT_HUMANIZER_PLANS.pro },
      ultra: { ...DEFAULT_HUMANIZER_PLANS.ultra }
    },
    subscribers: [...DEFAULT_SUBSCRIBERS]
  };
  return memoryStore;
}

function writeLocalStore(state: LocalStoreState) {
  memoryStore = state;
  try {
    const dir = path.dirname(DATA_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(state, null, 2), "utf8");
  } catch {
    // On read-only serverless filesystems, memoryStore + Supabase handle persistence
  }
}

function normalizePlanRow(row: Record<string, unknown>, fallback: HumanizerPlanConfig): HumanizerPlanConfig {
  return {
    tier: (row.tier as HumanizerTier) || fallback.tier,
    name: String(row.name || fallback.name),
    badge: String(row.badge || fallback.badge),
    tagline: String(row.tagline || fallback.tagline),
    priceLkr: String(row.price_lkr ?? row.priceLkr ?? fallback.priceLkr),
    priceNumeric: Number.isFinite(Number(row.price_numeric ?? row.priceNumeric))
      ? Number(row.price_numeric ?? row.priceNumeric)
      : fallback.priceNumeric,
    billingPeriod: String(row.billing_period ?? row.billingPeriod ?? fallback.billingPeriod),
    singlePassLkr: String(row.single_pass_lkr ?? row.singlePassLkr ?? fallback.singlePassLkr),
    dailyCredits: Number.isFinite(Number(row.daily_credits ?? row.dailyCredits))
      ? Math.max(1, Math.trunc(Number(row.daily_credits ?? row.dailyCredits)))
      : fallback.dailyCredits,
    maxWordsPerRun: Number.isFinite(Number(row.max_words_per_run ?? row.maxWordsPerRun))
      ? Math.max(50, Math.trunc(Number(row.max_words_per_run ?? row.maxWordsPerRun)))
      : fallback.maxWordsPerRun,
    monthlyWordsLabel: String(row.monthly_words_label ?? row.monthlyWordsLabel ?? fallback.monthlyWordsLabel),
    features: Array.isArray(row.features) && row.features.length > 0
      ? row.features.map(String).filter(Boolean)
      : fallback.features,
    ctaLabel: String(row.cta_label ?? row.ctaLabel ?? fallback.ctaLabel),
    isFeatured: row.is_featured !== undefined ? Boolean(row.is_featured) : Boolean(row.isFeatured ?? fallback.isFeatured),
    allowedModes: Array.isArray(row.allowed_modes ?? row.allowedModes)
      ? ((row.allowed_modes ?? row.allowedModes) as HumanizerMode[])
      : fallback.allowedModes,
    allowedIntensities: Array.isArray(row.allowed_intensities ?? row.allowedIntensities)
      ? ((row.allowed_intensities ?? row.allowedIntensities) as HumanizerIntensity[])
      : fallback.allowedIntensities,
    allowFreezeKeywords:
      row.allow_freeze_keywords !== undefined
        ? Boolean(row.allow_freeze_keywords)
        : Boolean(row.allowFreezeKeywords ?? fallback.allowFreezeKeywords),
    allowSentenceAlternatives:
      row.allow_sentence_alternatives !== undefined
        ? Boolean(row.allow_sentence_alternatives)
        : Boolean(row.allowSentenceAlternatives ?? fallback.allowSentenceAlternatives),
    allowReportDownload:
      row.allow_report_download !== undefined
        ? Boolean(row.allow_report_download)
        : Boolean(row.allowReportDownload ?? fallback.allowReportDownload)
  };
}

function normalizeSubscriberRow(row: Record<string, unknown>): HumanizerSubscriber {
  const tier = row.tier === "ultra" ? "ultra" : "pro";
  const defaultPlan = DEFAULT_HUMANIZER_PLANS[tier];
  const rawLastDate = String(row.last_usage_date ?? row.lastUsageDate ?? "");
  const isToday = rawLastDate === todayStr();
  const rawUsedToday = Number(row.credits_used_today ?? row.creditsUsedToday ?? 0) || 0;

  // Auto-check expiration
  const expiresAt = row.expires_at ? String(row.expires_at) : row.expiresAt ? String(row.expiresAt) : null;
  let status = (String(row.status || "active") as SubscriberStatus);
  if (status === "active" && expiresAt && new Date(expiresAt).getTime() < Date.now()) {
    status = "expired";
  }

  return {
    id: String(row.id || crypto.randomUUID()),
    customerName: String(row.customer_name ?? row.customerName ?? "Subscribed Student"),
    customerEmail: String(row.customer_email ?? row.customerEmail ?? ""),
    customerWhatsapp: String(row.customer_whatsapp ?? row.customerWhatsapp ?? ""),
    university: String(row.university ?? ""),
    tier,
    accessCode: String(row.access_code ?? row.accessCode ?? "").trim().toUpperCase(),
    status,
    dailyCredits: Number(row.daily_credits ?? row.dailyCredits ?? defaultPlan.dailyCredits) || defaultPlan.dailyCredits,
    maxWordsPerRun: Number(row.max_words_per_run ?? row.maxWordsPerRun ?? defaultPlan.maxWordsPerRun) || defaultPlan.maxWordsPerRun,
    creditsUsedToday: isToday ? rawUsedToday : 0,
    lastUsageDate: isToday ? rawLastDate : todayStr(),
    totalRuns: Number(row.total_runs ?? row.totalRuns ?? 0) || 0,
    totalWordsProcessed: Number(row.total_words_processed ?? row.totalWordsProcessed ?? 0) || 0,
    lastUsedAt: row.last_used_at ? String(row.last_used_at) : row.lastUsedAt ? String(row.lastUsedAt) : null,
    amountPaidLkr: Number(row.amount_paid_lkr ?? row.amountPaidLkr ?? defaultPlan.priceNumeric) || 0,
    paymentReference: String(row.payment_reference ?? row.paymentReference ?? ""),
    startsAt: String(row.starts_at ?? row.startsAt ?? new Date().toISOString()),
    expiresAt,
    notes: String(row.notes ?? ""),
    createdAt: String(row.created_at ?? row.createdAt ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? row.updatedAt ?? new Date().toISOString())
  };
}

export async function getHumanizerPlans(): Promise<Record<HumanizerTier, HumanizerPlanConfig>> {
  const local = readLocalStore();

  if (isSupabaseConfigured()) {
    try {
      const db = getServiceSupabase();
      const { data, error } = await db.from("humanizer_plans").select("*");
      if (!error && Array.isArray(data) && data.length > 0) {
        const merged: Record<HumanizerTier, HumanizerPlanConfig> = {
          free: { ...local.plans.free },
          pro: { ...local.plans.pro },
          ultra: { ...local.plans.ultra }
        };
        for (const row of data) {
          const r = row as Record<string, unknown>;
          const t = String(r.tier || "") as HumanizerTier;
          if (t === "free" || t === "pro" || t === "ultra") {
            merged[t] = normalizePlanRow(r, merged[t]);
          }
        }
        return merged;
      }
    } catch {
      // Fallback to local store
    }
  }

  return local.plans;
}

export async function updateHumanizerPlan(
  tier: HumanizerTier,
  input: Partial<HumanizerPlanConfig>
): Promise<HumanizerPlanConfig> {
  const currentPlans = await getHumanizerPlans();
  const existing = currentPlans[tier] || DEFAULT_HUMANIZER_PLANS[tier];

  const updated: HumanizerPlanConfig = {
    ...existing,
    ...input,
    tier,
    name: String(input.name ?? existing.name).trim() || existing.name,
    badge: String(input.badge ?? existing.badge).trim() || existing.badge,
    tagline: String(input.tagline ?? existing.tagline).trim() || existing.tagline,
    priceLkr: String(input.priceLkr ?? existing.priceLkr).trim() || existing.priceLkr,
    priceNumeric: Number.isFinite(Number(input.priceNumeric)) ? Number(input.priceNumeric) : existing.priceNumeric,
    billingPeriod: String(input.billingPeriod ?? existing.billingPeriod).trim(),
    singlePassLkr: String(input.singlePassLkr ?? existing.singlePassLkr).trim(),
    dailyCredits: Math.max(1, Math.trunc(Number(input.dailyCredits ?? existing.dailyCredits) || existing.dailyCredits)),
    maxWordsPerRun: Math.max(50, Math.trunc(Number(input.maxWordsPerRun ?? existing.maxWordsPerRun) || existing.maxWordsPerRun)),
    monthlyWordsLabel: String(input.monthlyWordsLabel ?? existing.monthlyWordsLabel).trim() || existing.monthlyWordsLabel,
    features: Array.isArray(input.features)
      ? input.features.map((f) => String(f).trim()).filter(Boolean)
      : existing.features,
    ctaLabel: String(input.ctaLabel ?? existing.ctaLabel).trim() || existing.ctaLabel,
    isFeatured: input.isFeatured !== undefined ? Boolean(input.isFeatured) : existing.isFeatured,
    allowedModes: Array.isArray(input.allowedModes) && input.allowedModes.length > 0
      ? input.allowedModes
      : existing.allowedModes,
    allowedIntensities: Array.isArray(input.allowedIntensities) && input.allowedIntensities.length > 0
      ? input.allowedIntensities
      : existing.allowedIntensities,
    allowFreezeKeywords:
      input.allowFreezeKeywords !== undefined ? Boolean(input.allowFreezeKeywords) : existing.allowFreezeKeywords,
    allowSentenceAlternatives:
      input.allowSentenceAlternatives !== undefined
        ? Boolean(input.allowSentenceAlternatives)
        : existing.allowSentenceAlternatives,
    allowReportDownload:
      input.allowReportDownload !== undefined ? Boolean(input.allowReportDownload) : existing.allowReportDownload
  };

  const local = readLocalStore();
  local.plans[tier] = updated;
  writeLocalStore(local);

  if (isSupabaseConfigured()) {
    try {
      const db = getServiceSupabase();
      await db.from("humanizer_plans").upsert(
        {
          tier: updated.tier,
          name: updated.name,
          badge: updated.badge,
          tagline: updated.tagline,
          price_lkr: updated.priceLkr,
          price_numeric: updated.priceNumeric,
          billing_period: updated.billingPeriod,
          single_pass_lkr: updated.singlePassLkr,
          daily_credits: updated.dailyCredits,
          max_words_per_run: updated.maxWordsPerRun,
          monthly_words_label: updated.monthlyWordsLabel,
          features: updated.features,
          cta_label: updated.ctaLabel,
          is_featured: updated.isFeatured,
          allowed_modes: updated.allowedModes,
          allowed_intensities: updated.allowedIntensities,
          allow_freeze_keywords: updated.allowFreezeKeywords,
          allow_sentence_alternatives: updated.allowSentenceAlternatives,
          allow_report_download: updated.allowReportDownload,
          updated_at: new Date().toISOString()
        },
        { onConflict: "tier" }
      );
    } catch {
      // Local store already updated
    }
  }

  return updated;
}

export async function getHumanizerSubscribers(): Promise<HumanizerSubscriber[]> {
  const local = readLocalStore();

  if (isSupabaseConfigured()) {
    try {
      const db = getServiceSupabase();
      const { data, error } = await db
        .from("humanizer_subscribers")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && Array.isArray(data) && data.length > 0) {
        return data.map((row) => normalizeSubscriberRow(row as Record<string, unknown>));
      }
    } catch {
      // Fallback to local store
    }
  }

  return local.subscribers.map((s) => normalizeSubscriberRow(s as unknown as Record<string, unknown>));
}

export async function upsertHumanizerSubscriber(
  input: Partial<HumanizerSubscriber> & { customerName: string; tier: "pro" | "ultra"; accessCode: string }
): Promise<HumanizerSubscriber> {
  const subscribers = await getHumanizerSubscribers();
  const plans = await getHumanizerPlans();
  const tierPlan = plans[input.tier];
  const normalizedCode = input.accessCode.trim().toUpperCase();

  const existingById = input.id ? subscribers.find((s) => s.id === input.id) : undefined;
  const duplicateCode = subscribers.find(
    (s) => s.accessCode === normalizedCode && (!existingById || s.id !== existingById.id)
  );
  if (duplicateCode) {
    throw new Error(`Access code "${normalizedCode}" is already assigned to ${duplicateCode.customerName}.`);
  }

  const nowIso = new Date().toISOString();
  const record: HumanizerSubscriber = {
    id: existingById?.id || input.id || crypto.randomUUID(),
    customerName: input.customerName.trim(),
    customerEmail: (input.customerEmail ?? existingById?.customerEmail ?? "").trim(),
    customerWhatsapp: (input.customerWhatsapp ?? existingById?.customerWhatsapp ?? "").replace(/[^0-9+]/g, ""),
    university: (input.university ?? existingById?.university ?? "").trim(),
    tier: input.tier,
    accessCode: normalizedCode,
    status: (input.status ?? existingById?.status ?? "active") as SubscriberStatus,
    dailyCredits: Math.max(
      1,
      Math.trunc(Number(input.dailyCredits ?? existingById?.dailyCredits ?? tierPlan.dailyCredits))
    ),
    maxWordsPerRun: Math.max(
      100,
      Math.trunc(Number(input.maxWordsPerRun ?? existingById?.maxWordsPerRun ?? tierPlan.maxWordsPerRun))
    ),
    creditsUsedToday:
      input.creditsUsedToday !== undefined
        ? Math.max(0, Math.trunc(Number(input.creditsUsedToday)))
        : existingById?.creditsUsedToday ?? 0,
    lastUsageDate: existingById?.lastUsageDate || todayStr(),
    totalRuns: existingById?.totalRuns ?? 0,
    totalWordsProcessed: existingById?.totalWordsProcessed ?? 0,
    lastUsedAt: existingById?.lastUsedAt ?? null,
    amountPaidLkr:
      input.amountPaidLkr !== undefined
        ? Number(input.amountPaidLkr) || 0
        : existingById?.amountPaidLkr ?? tierPlan.priceNumeric,
    paymentReference: (input.paymentReference ?? existingById?.paymentReference ?? "").trim(),
    startsAt: input.startsAt || existingById?.startsAt || nowIso,
    expiresAt: input.expiresAt !== undefined ? input.expiresAt : existingById?.expiresAt ?? null,
    notes: (input.notes ?? existingById?.notes ?? "").trim(),
    createdAt: existingById?.createdAt || nowIso,
    updatedAt: nowIso
  };

  const local = readLocalStore();
  const idx = local.subscribers.findIndex((s) => s.id === record.id);
  if (idx >= 0) {
    local.subscribers[idx] = record;
  } else {
    local.subscribers.unshift(record);
  }
  writeLocalStore(local);

  if (isSupabaseConfigured()) {
    try {
      const db = getServiceSupabase();
      await db.from("humanizer_subscribers").upsert(
        {
          id: /^sub-/.test(record.id) ? undefined : record.id,
          customer_name: record.customerName,
          customer_email: record.customerEmail,
          customer_whatsapp: record.customerWhatsapp,
          university: record.university,
          tier: record.tier,
          access_code: record.accessCode,
          status: record.status,
          daily_credits: record.dailyCredits,
          max_words_per_run: record.maxWordsPerRun,
          credits_used_today: record.creditsUsedToday,
          last_usage_date: record.lastUsageDate,
          total_runs: record.totalRuns,
          total_words_processed: record.totalWordsProcessed,
          last_used_at: record.lastUsedAt,
          amount_paid_lkr: record.amountPaidLkr,
          payment_reference: record.paymentReference,
          starts_at: record.startsAt,
          expires_at: record.expiresAt,
          notes: record.notes,
          updated_at: record.updatedAt
        },
        { onConflict: "access_code" }
      );
    } catch {
      // Local store already updated
    }
  }

  return record;
}

export async function deleteHumanizerSubscriber(id: string): Promise<boolean> {
  const local = readLocalStore();
  const target = local.subscribers.find((s) => s.id === id);
  local.subscribers = local.subscribers.filter((s) => s.id !== id);
  writeLocalStore(local);

  if (isSupabaseConfigured()) {
    try {
      const db = getServiceSupabase();
      if (target) {
        await db.from("humanizer_subscribers").delete().eq("access_code", target.accessCode);
      } else {
        await db.from("humanizer_subscribers").delete().eq("id", id);
      }
    } catch {
      // Handled by local store
    }
  }

  return true;
}

export async function verifyAndResolveSubscriberKey(
  rawKey?: string
): Promise<{
  valid: boolean;
  subscriber?: HumanizerSubscriber;
  plan?: HumanizerPlanConfig;
  error?: string;
}> {
  if (!rawKey) return { valid: false, error: "No access code provided." };
  const normalized = rawKey.trim().toUpperCase();
  if (!normalized) return { valid: false, error: "No access code provided." };

  const [subscribers, plans] = await Promise.all([getHumanizerSubscribers(), getHumanizerPlans()]);
  const matched = subscribers.find((s) => s.accessCode === normalized);

  if (matched) {
    if (matched.status === "paused") {
      return {
        valid: false,
        error: "This subscription key is currently paused. Please contact StHelp support on WhatsApp."
      };
    }
    if (matched.status === "revoked") {
      return {
        valid: false,
        error: "This subscription key has been revoked. Please contact StHelp support on WhatsApp."
      };
    }
    if (matched.status === "expired" || (matched.expiresAt && new Date(matched.expiresAt).getTime() < Date.now())) {
      return {
        valid: false,
        error: "Your subscription key has expired. Please contact StHelp on WhatsApp to renew your plan."
      };
    }
    if (matched.creditsUsedToday >= matched.dailyCredits) {
      return {
        valid: false,
        error: `Daily credit limit (${matched.dailyCredits} runs/day) reached for this subscription key. Credits reset automatically tomorrow or contact admin.`
      };
    }
    return {
      valid: true,
      subscriber: matched,
      plan: plans[matched.tier]
    };
  }

  // Also check environment variable keys
  const envUltra = (process.env.HUMANIZER_ULTRA_KEYS || "")
    .split(",")
    .map((k) => k.trim().toUpperCase())
    .filter(Boolean);
  const envPro = (process.env.HUMANIZER_PRO_KEYS || "")
    .split(",")
    .map((k) => k.trim().toUpperCase())
    .filter(Boolean);

  if (envUltra.includes(normalized) || normalized === "STHELP-DISSERTATION-ULTRA") {
    return {
      valid: true,
      plan: plans.ultra
    };
  }
  if (envPro.includes(normalized) || normalized === "STHELP-ACADEMIC-PRO") {
    return {
      valid: true,
      plan: plans.pro
    };
  }

  return {
    valid: false,
    error: "Invalid access code. Contact StHelp on WhatsApp to receive your Academic Pro or Dissertation Ultra key."
  };
}

export async function recordSubscriberUsage(accessCode: string, wordCount: number): Promise<void> {
  const normalized = accessCode.trim().toUpperCase();
  if (!normalized) return;

  const local = readLocalStore();
  const idx = local.subscribers.findIndex((s) => s.accessCode === normalized);
  const today = todayStr();
  const nowIso = new Date().toISOString();

  if (idx >= 0) {
    const sub = local.subscribers[idx];
    const usedToday = sub.lastUsageDate === today ? sub.creditsUsedToday + 1 : 1;
    local.subscribers[idx] = {
      ...sub,
      creditsUsedToday: usedToday,
      lastUsageDate: today,
      totalRuns: (sub.totalRuns || 0) + 1,
      totalWordsProcessed: (sub.totalWordsProcessed || 0) + wordCount,
      lastUsedAt: nowIso,
      updatedAt: nowIso
    };
    writeLocalStore(local);

    if (isSupabaseConfigured()) {
      try {
        const db = getServiceSupabase();
        await db
          .from("humanizer_subscribers")
          .update({
            credits_used_today: usedToday,
            last_usage_date: today,
            total_runs: local.subscribers[idx].totalRuns,
            total_words_processed: local.subscribers[idx].totalWordsProcessed,
            last_used_at: nowIso,
            updated_at: nowIso
          })
          .eq("access_code", normalized);
      } catch {
        // Local store already updated
      }
    }
  }
}

