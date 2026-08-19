import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { apiError, apiRouteError, logApiError, optionalText, requiredText } from "@/lib/api";
import { getServiceSupabase } from "@/lib/supabase-server";
import { defaultStudentResources, mergeStudentResources, RESOURCE_ACCESS_TYPES } from "@/lib/student-resources";

function externalUrl(value: unknown, label: string, optional = false) {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text && optional) return null;
  if (!text) throw new Error(`${label} is required.`);
  if (text.length > 1500) throw new Error(`${label} is too long.`);
  const url = new URL(text);
  if (url.protocol !== "https:") throw new Error(`${label} must use https://.`);
  return url.toString();
}

function resourceRecord(body: any, resourceKey: string) {
  const accessType = String(body.accessType || "free");
  if (!RESOURCE_ACCESS_TYPES.includes(accessType as (typeof RESOURCE_ACCESS_TYPES)[number])) throw new Error("Invalid access type.");
  const sortOrder = Number(body.sortOrder);
  return {
    resource_key: resourceKey,
    title: requiredText(body.title, "Resource title", 200),
    category: requiredText(body.category, "Resource category", 100),
    description: requiredText(body.description, "Resource description", 2000),
    url: externalUrl(body.url, "Resource URL"),
    thumbnail_url: externalUrl(body.thumbnailUrl, "Thumbnail URL", true),
    access_type: accessType,
    is_featured: Boolean(body.isFeatured),
    is_published: body.isPublished !== false,
    is_deleted: false,
    sort_order: Number.isFinite(sortOrder) ? Math.trunc(sortOrder) : 0
  };
}

function resourceBase(item: any) {
  return {
    resource_key: String(item.resource_key || item.id),
    title: item.title,
    category: item.category,
    description: item.description,
    url: item.url,
    thumbnail_url: item.thumbnail_url || null,
    access_type: item.access_type,
    is_featured: Boolean(item.is_featured),
    is_published: Boolean(item.is_published),
    is_deleted: Boolean(item.is_deleted),
    sort_order: Number(item.sort_order) || 0
  };
}

function throwResourceDatabaseError(error: any) {
  if (!error) return;
  const message = String(error.message || "Unable to save the student resource.");
  if (["42P01", "PGRST205"].includes(String(error.code)) || message.includes("student_resources")) {
    throw new Error("Run the 20260819_add_student_resources.sql migration in Supabase before editing resources.");
  }
  throw new Error(message);
}

export async function GET() {
  const session = await requireAdminApi();
  if (!session) return apiError("Admin login required.", 401);
  try {
    const db = getServiceSupabase();
    const [{ data: portfolio, error: pError }, { data: testimonials, error: tError }, { data: resourceRows, error: rError }] = await Promise.all([
      db.from("portfolio_items").select("*").order("sort_order").order("created_at", { ascending: false }),
      db.from("testimonials").select("*").order("created_at", { ascending: false }),
      db.from("student_resources").select("*").order("sort_order")
    ]);
    if (pError || tError) throw pError || tError;
    if (rError) {
      logApiError(rError);
      return NextResponse.json({ portfolio: portfolio || [], testimonials: testimonials || [], resources: mergeStudentResources(), resourceSetupRequired: true });
    }
    return NextResponse.json({ portfolio: portfolio || [], testimonials: testimonials || [], resources: mergeStudentResources(resourceRows || []), resourceSetupRequired: false });
  } catch (error) {
    logApiError(error);
    return apiRouteError(error, "Unable to load website content.", true);
  }
}

export async function POST(request: NextRequest) {
  const session = await requireAdminApi();
  if (!session) return apiError("Admin login required.", 401);
  try {
    const body = await request.json();
    const action = String(body.action || "");
    const type = String(body.type || "");
    const db = getServiceSupabase();

    if (type === "resource" && action === "create") {
      const record = resourceRecord(body, crypto.randomUUID());
      const { error } = await db.from("student_resources").insert(record);
      throwResourceDatabaseError(error);
      return NextResponse.json({ ok: true });
    }

    if (type === "resource" && action === "update") {
      const id = requiredText(body.id, "Resource ID", 200);
      const { error } = await db.from("student_resources").upsert(resourceRecord(body, id), { onConflict: "resource_key" });
      throwResourceDatabaseError(error);
      return NextResponse.json({ ok: true });
    }

    if (type === "resource" && ["toggle", "delete"].includes(action)) {
      const id = requiredText(body.id, "Resource ID", 200);
      const { data: stored, error: findError } = await db.from("student_resources").select("*").eq("resource_key", id).maybeSingle();
      throwResourceDatabaseError(findError);
      const base = stored || defaultStudentResources.find((item) => item.id === id);
      if (!base) return apiError("Resource not found.", 404);
      const record = resourceBase(base);
      const { error } = await db.from("student_resources").upsert({
        ...record,
        is_published: action === "toggle" ? Boolean(body.isPublished) : record.is_published,
        is_deleted: action === "delete"
      }, { onConflict: "resource_key" });
      throwResourceDatabaseError(error);
      return NextResponse.json({ ok: true });
    }

    if (type === "portfolio" && action === "create") {
      const { error } = await db.from("portfolio_items").insert({
        title: requiredText(body.title, "Title", 200),
        category: requiredText(body.category, "Category", 100),
        description: requiredText(body.description, "Description", 2000),
        image_url: optionalText(body.imageUrl, 1000),
        sort_order: Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0,
        is_published: body.isPublished !== false
      });
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    if (type === "testimonial" && action === "create") {
      const rating = Number(body.rating);
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) return apiError("Rating must be from 1 to 5.");
      const { error } = await db.from("testimonials").insert({
        customer_name: requiredText(body.customerName, "Customer name", 150),
        university: optionalText(body.university, 250),
        rating,
        feedback: requiredText(body.feedback, "Feedback", 1500),
        is_published: body.isPublished === true
      });
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    if (action === "toggle" && ["portfolio", "testimonial"].includes(type)) {
      const table = type === "portfolio" ? "portfolio_items" : "testimonials";
      const { error } = await db.from(table).update({ is_published: Boolean(body.isPublished) }).eq("id", requiredText(body.id, "ID", 100));
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    if (action === "delete" && ["portfolio", "testimonial"].includes(type)) {
      const table = type === "portfolio" ? "portfolio_items" : "testimonials";
      const { error } = await db.from(table).delete().eq("id", requiredText(body.id, "ID", 100));
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    return apiError("Unknown content action.");
  } catch (error) {
    logApiError(error);
    return apiRouteError(error, "Unable to update content.", true);
  }
}
