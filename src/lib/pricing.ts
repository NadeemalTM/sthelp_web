import { getServiceSupabase, isSupabaseConfigured } from "@/lib/supabase-server";

export type PricingService = {
  id: string | null;
  slug: string;
  name: string;
  short_description: string;
  starting_price: number | null;
  currency: string;
  features: string[];
  is_custom: boolean;
  is_featured: boolean;
  is_published: boolean;
  sort_order: number;
};

export const defaultPricingServices: PricingService[] = [
  {
    id: null,
    slug: "web-development",
    name: "Web development",
    short_description: "Websites and browser-based application support tailored to the submitted brief.",
    starting_price: 5000,
    currency: "LKR",
    features: ["Responsive interface", "Project guidance", "Scope-based final quote"],
    is_custom: false,
    is_featured: true,
    is_published: true,
    sort_order: 10
  },
  {
    id: null,
    slug: "mobile-app",
    name: "Mobile app development",
    short_description: "Mobile application support for Android, iOS and cross-platform coursework projects.",
    starting_price: 5000,
    currency: "LKR",
    features: ["App planning", "Interface support", "Scope-based final quote"],
    is_custom: false,
    is_featured: false,
    is_published: true,
    sort_order: 20
  },
  {
    id: null,
    slug: "research",
    name: "Research support",
    short_description: "Structured research guidance, planning, sources, methodology and academic presentation support.",
    starting_price: 5000,
    currency: "LKR",
    features: ["Research planning", "Methodology guidance", "Referencing support"],
    is_custom: false,
    is_featured: true,
    is_published: true,
    sort_order: 30
  },
  {
    id: null,
    slug: "report-writing",
    name: "Report writing support",
    short_description: "Report structure, editing, analysis and presentation support based on your requirements.",
    starting_price: 2000,
    currency: "LKR",
    features: ["Clear structure", "Editing support", "Referencing guidance"],
    is_custom: false,
    is_featured: false,
    is_published: true,
    sort_order: 40
  },
  {
    id: null,
    slug: "presentation",
    name: "Presentation support",
    short_description: "Clear, modern slide design and presentation guidance for academic or project work.",
    starting_price: 1000,
    currency: "LKR",
    features: ["Slide structure", "Visual consistency", "Presentation guidance"],
    is_custom: false,
    is_featured: false,
    is_published: true,
    sort_order: 50
  },
  {
    id: null,
    slug: "data-analysis",
    name: "Data analysis",
    short_description: "Spreadsheet, statistical and data-interpretation support with clear explanations.",
    starting_price: 4000,
    currency: "LKR",
    features: ["Data preparation", "Charts and findings", "Interpretation guidance"],
    is_custom: false,
    is_featured: true,
    is_published: true,
    sort_order: 60
  },
  {
    id: null,
    slug: "custom",
    name: "Other / custom order",
    short_description: "Tell us what you need and we will provide a tailored quotation after reviewing the brief.",
    starting_price: null,
    currency: "LKR",
    features: ["Any supported subject area", "Requirements review", "Tailored quotation"],
    is_custom: true,
    is_featured: false,
    is_published: true,
    sort_order: 70
  }
];

function isMissingPricingTable(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const record = error as { code?: unknown; message?: unknown; details?: unknown; hint?: unknown };
  const code = String(record.code || "");
  const text = `${String(record.message || "")} ${String(record.details || "")} ${String(record.hint || "")}`.toLowerCase();
  return ["42P01", "PGRST205"].includes(code) && text.includes("pricing_services");
}

function normalizePricingService(row: Record<string, unknown>): PricingService {
  const price = row.starting_price === null || row.starting_price === undefined
    ? null
    : Number(row.starting_price);
  return {
    id: row.id ? String(row.id) : null,
    slug: String(row.slug || ""),
    name: String(row.name || ""),
    short_description: String(row.short_description || ""),
    starting_price: Number.isFinite(price) ? price : null,
    currency: String(row.currency || "LKR").toUpperCase(),
    features: Array.isArray(row.features) ? row.features.map(String).filter(Boolean) : [],
    is_custom: Boolean(row.is_custom),
    is_featured: Boolean(row.is_featured),
    is_published: row.is_published !== false,
    sort_order: Number(row.sort_order) || 0
  };
}

export async function getPublicPricingServices(): Promise<PricingService[]> {
  if (!isSupabaseConfigured()) return defaultPricingServices;

  const db = getServiceSupabase();
  const { data, error } = await db
    .from("pricing_services")
    .select("id, slug, name, short_description, starting_price, currency, features, is_custom, is_featured, is_published, sort_order")
    .eq("is_published", true)
    .eq("is_deleted", false)
    .order("sort_order")
    .order("created_at");

  if (error) {
    console.error("Unable to load pricing services:", error.message);
    return isMissingPricingTable(error) ? defaultPricingServices : [];
  }

  return (data || []).map((row) => normalizePricingService(row as Record<string, unknown>));
}

export function findDefaultPricingService(slug: string) {
  return defaultPricingServices.find((service) => service.slug === slug) || null;
}
