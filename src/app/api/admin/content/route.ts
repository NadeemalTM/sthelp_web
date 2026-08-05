import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { apiError, apiRouteError, logApiError, optionalText, requiredText } from "@/lib/api";
import { getServiceSupabase } from "@/lib/supabase-server";

export async function GET() {
  const session = await requireAdminApi();
  if (!session) return apiError("Admin login required.", 401);
  try {
    const db = getServiceSupabase();
    const [{ data: portfolio, error: pError }, { data: testimonials, error: tError }] = await Promise.all([
      db.from("portfolio_items").select("*").order("sort_order").order("created_at", { ascending: false }),
      db.from("testimonials").select("*").order("created_at", { ascending: false })
    ]);
    if (pError || tError) throw pError || tError;
    return NextResponse.json({ portfolio: portfolio || [], testimonials: testimonials || [] });
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
