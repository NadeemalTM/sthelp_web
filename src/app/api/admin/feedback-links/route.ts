import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { apiError, apiRouteError, logApiError, optionalText } from "@/lib/api";
import { requireAdminApi } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase-server";

export async function GET() {
  const session = await requireAdminApi();
  if (!session) return apiError("Admin login required.", 401);
  try {
    const db = getServiceSupabase();
    const { data, error } = await db
      .from("feedback_links")
      .select("id, token, customer_name, university, expires_at, submitted_at, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    return NextResponse.json({ links: data || [] });
  } catch (error) {
    logApiError(error);
    return apiRouteError(error, "Unable to load feedback links.", true);
  }
}

export async function POST(request: NextRequest) {
  const session = await requireAdminApi();
  if (!session) return apiError("Admin login required.", 401);
  try {
    const body = await request.json();
    const db = getServiceSupabase();
    const token = crypto.randomUUID();
    const { data, error } = await db.from("feedback_links").insert({
      token,
      customer_name: optionalText(body.customerName, 150),
      university: optionalText(body.university, 250)
    }).select("id, token").single();
    if (error || !data) throw error || new Error("Unable to create feedback link.");
    const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
    return NextResponse.json({ url: `${origin.replace(/\/$/, "")}/feedback/${data.token}` });
  } catch (error) {
    logApiError(error);
    return apiRouteError(error, "Unable to create feedback link.", true);
  }
}
