import { NextRequest, NextResponse } from "next/server";
import { apiError, apiRouteError, logApiError, requiredText } from "@/lib/api";
import { requireAdminApi } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase-server";

const SETUP_MESSAGE =
  "Run supabase/migrations/20260825_add_pricing_services.sql in the Supabase SQL Editor before managing prices.";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

class PricingInputError extends Error {}

type PricingRecord = {
  slug: string;
  name: string;
  short_description: string;
  starting_price: number | null;
  currency: string;
  features: string[];
  is_custom: boolean;
  is_featured: boolean;
  is_published: boolean;
  is_deleted: boolean;
  sort_order: number;
};

function errorDetails(error: unknown) {
  if (!error || typeof error !== "object") return { code: "", text: "" };
  const details = error as { code?: unknown; message?: unknown; details?: unknown; hint?: unknown };
  return {
    code: String(details.code || ""),
    text: `${String(details.message || "")} ${String(details.details || "")} ${String(details.hint || "")}`.toLowerCase()
  };
}

function isMissingPricingTable(error: unknown) {
  const { code, text } = errorDetails(error);
  return code === "42P01" || code === "PGRST205" || (code === "PGRST204" && text.includes("pricing_services"));
}

function isDuplicateSlug(error: unknown) {
  const { code, text } = errorDetails(error);
  return code === "23505" && (text.includes("slug") || text.includes("pricing_services"));
}

function inputText(value: unknown, label: string, max: number) {
  try {
    return requiredText(value, label, max);
  } catch (error) {
    throw new PricingInputError(error instanceof Error ? error.message : `${label} is invalid.`);
  }
}

function inputBoolean(value: unknown, label: string, fallback: boolean) {
  if (value === undefined) return fallback;
  if (typeof value !== "boolean") throw new PricingInputError(`${label} must be true or false.`);
  return value;
}

function inputFeatures(value: unknown) {
  if (!Array.isArray(value)) throw new PricingInputError("Features must be provided as a list.");
  if (value.length > 12) throw new PricingInputError("Add no more than 12 features.");

  const unique = new Map<string, string>();
  for (const item of value) {
    const feature = inputText(item, "Feature", 120);
    unique.set(feature.toLowerCase(), feature);
  }
  return Array.from(unique.values());
}

function inputSortOrder(value: unknown) {
  const sortOrder = Number(value);
  if (!Number.isInteger(sortOrder) || sortOrder < -10_000 || sortOrder > 10_000) {
    throw new PricingInputError("Sort order must be a whole number between -10000 and 10000.");
  }
  return sortOrder;
}

function inputPrice(value: unknown, isCustom: boolean) {
  const empty = value === null || value === undefined || value === "";
  if (isCustom) {
    if (!empty) throw new PricingInputError("Custom-quote services cannot have a starting price.");
    return null;
  }
  if (empty) throw new PricingInputError("Starting price is required unless this is a custom-quote service.");

  const price = Number(value);
  const cents = price * 100;
  if (!Number.isFinite(price) || price <= 0 || price > 9_999_999_999.99) {
    throw new PricingInputError("Enter a valid starting price greater than zero.");
  }
  if (Math.abs(cents - Math.round(cents)) > 0.000001) {
    throw new PricingInputError("Starting price can have no more than two decimal places.");
  }
  return price;
}

function pricingRecord(input: Record<string, unknown>): PricingRecord {
  const slug = inputText(input.slug, "Slug", 80).toLowerCase();
  if (!SLUG_PATTERN.test(slug)) {
    throw new PricingInputError("Slug can contain lowercase letters, numbers and single hyphens only.");
  }

  const currency = inputText(input.currency, "Currency", 3).toUpperCase();
  if (currency !== "LKR") throw new PricingInputError("Public starting prices must use LKR.");

  const isCustom = inputBoolean(input.isCustom, "Custom quote", false);
  return {
    slug,
    name: inputText(input.name, "Service name", 120),
    short_description: inputText(input.shortDescription, "Short description", 1000),
    starting_price: inputPrice(input.startingPrice, isCustom),
    currency,
    features: inputFeatures(input.features),
    is_custom: isCustom,
    is_featured: inputBoolean(input.isFeatured, "Featured", false),
    is_published: inputBoolean(input.isPublished, "Published", true),
    is_deleted: false,
    sort_order: inputSortOrder(input.sortOrder)
  };
}

function inputId(value: unknown) {
  const id = inputText(value, "Service ID", 50);
  if (!UUID_PATTERN.test(id)) throw new PricingInputError("Invalid service ID.");
  return id;
}

function pricingBodyFromExisting(existing: Record<string, unknown>, body: Record<string, unknown>) {
  return {
    slug: body.slug === undefined ? existing.slug : body.slug,
    name: body.name === undefined ? existing.name : body.name,
    shortDescription: body.shortDescription === undefined ? existing.short_description : body.shortDescription,
    startingPrice: body.startingPrice === undefined ? existing.starting_price : body.startingPrice,
    currency: body.currency === undefined ? existing.currency : body.currency,
    features: body.features === undefined ? existing.features : body.features,
    isCustom: body.isCustom === undefined ? existing.is_custom : body.isCustom,
    isFeatured: body.isFeatured === undefined ? existing.is_featured : body.isFeatured,
    isPublished: body.isPublished === undefined ? existing.is_published : body.isPublished,
    sortOrder: body.sortOrder === undefined ? existing.sort_order : body.sortOrder
  };
}

function pricingRouteError(error: unknown, fallback: string) {
  if (error instanceof PricingInputError) return apiError(error.message);
  if (error instanceof SyntaxError) return apiError("The request body must be valid JSON.");
  if (isMissingPricingTable(error)) {
    logApiError(error);
    return apiError(SETUP_MESSAGE, 503);
  }
  if (isDuplicateSlug(error)) return apiError("Another pricing service already uses that slug.", 409);
  logApiError(error);
  return apiRouteError(error, fallback, true);
}

export async function GET() {
  const session = await requireAdminApi();
  if (!session) return apiError("Admin login required.", 401);

  try {
    const db = getServiceSupabase();
    const { data, error } = await db
      .from("pricing_services")
      .select("*")
      .eq("is_deleted", false)
      .order("sort_order")
      .order("created_at");

    if (error && isMissingPricingTable(error)) {
      logApiError(error);
      return NextResponse.json({ services: [], setupRequired: true, message: SETUP_MESSAGE });
    }
    if (error) throw error;
    return NextResponse.json({ services: data || [], setupRequired: false, message: null });
  } catch (error) {
    return pricingRouteError(error, "Unable to load pricing services.");
  }
}

export async function POST(request: NextRequest) {
  const session = await requireAdminApi();
  if (!session) return apiError("Admin login required.", 401);

  try {
    const body = await request.json() as Record<string, unknown>;
    const db = getServiceSupabase();
    const record = pricingRecord(body);
    const { data: existing, error: findError } = await db
      .from("pricing_services")
      .select("id, is_deleted")
      .eq("slug", record.slug)
      .maybeSingle();
    if (findError) throw findError;
    if (existing && !existing.is_deleted) return apiError("Another pricing service already uses that slug.", 409);

    const query = existing
      ? db.from("pricing_services").update(record).eq("id", existing.id)
      : db.from("pricing_services").insert(record);
    const { data, error } = await query.select("*").single();
    if (error) throw error;
    return NextResponse.json({ service: data }, { status: 201 });
  } catch (error) {
    return pricingRouteError(error, "Unable to create pricing service.");
  }
}

export async function PATCH(request: NextRequest) {
  const session = await requireAdminApi();
  if (!session) return apiError("Admin login required.", 401);

  try {
    const body = await request.json() as Record<string, unknown>;
    const id = inputId(body.id);
    const db = getServiceSupabase();
    const { data: existing, error: findError } = await db
      .from("pricing_services")
      .select("*")
      .eq("id", id)
      .eq("is_deleted", false)
      .maybeSingle();
    if (findError) throw findError;
    if (!existing) return apiError("Pricing service not found.", 404);

    const record = pricingRecord(pricingBodyFromExisting(existing as Record<string, unknown>, body));
    if (existing.is_custom && (!record.is_custom || !record.is_published)) {
      const { data: replacement, error: replacementError } = await db
        .from("pricing_services")
        .select("id")
        .eq("is_custom", true)
        .eq("is_published", true)
        .eq("is_deleted", false)
        .neq("id", id)
        .limit(1)
        .maybeSingle();
      if (replacementError) throw replacementError;
      if (!replacement) return apiError("Keep at least one published custom-order service available.", 409);
    }
    const { data, error } = await db.from("pricing_services").update(record).eq("id", id).select("*").single();
    if (error) throw error;
    return NextResponse.json({ service: data });
  } catch (error) {
    return pricingRouteError(error, "Unable to update pricing service.");
  }
}

export async function DELETE(request: NextRequest) {
  const session = await requireAdminApi();
  if (!session) return apiError("Admin login required.", 401);

  try {
    const body = await request.json() as Record<string, unknown>;
    const id = inputId(body.id);
    const db = getServiceSupabase();
    const { data: existing, error: findError } = await db
      .from("pricing_services")
      .select("id, is_custom")
      .eq("id", id)
      .eq("is_deleted", false)
      .maybeSingle();
    if (findError) throw findError;
    if (!existing) return apiError("Pricing service not found.", 404);
    if (existing.is_custom) {
      const { data: replacement, error: replacementError } = await db
        .from("pricing_services")
        .select("id")
        .eq("is_custom", true)
        .eq("is_published", true)
        .eq("is_deleted", false)
        .neq("id", id)
        .limit(1)
        .maybeSingle();
      if (replacementError) throw replacementError;
      if (!replacement) return apiError("Keep at least one published custom-order service available.", 409);
    }
    const { data, error } = await db
      .from("pricing_services")
      .update({ is_deleted: true, is_published: false })
      .eq("id", id)
      .eq("is_deleted", false)
      .select("id")
      .maybeSingle();
    if (error) throw error;
    if (!data) return apiError("Pricing service not found.", 404);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return pricingRouteError(error, "Unable to delete pricing service.");
  }
}
