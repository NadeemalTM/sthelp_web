import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { apiError, apiRouteError, logApiError } from "@/lib/api";
import { createClientPin, hashClientPin } from "@/lib/security";
import { getServiceSupabase } from "@/lib/supabase-server";
import { isRateLimited } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    if (isRateLimited(request, "public-assignment", 8, 15 * 60 * 1000)) return apiError("Too many requests. Please try again in a few minutes.", 429);
    const body = await request.json();
    // A hidden field catches ordinary form bots without affecting real visitors.
    if (String(body.website || "").trim()) return apiError("Unable to start this request.");

    const db = getServiceSupabase();
    const token = crypto.randomUUID();
    const pin = createClientPin();
    const clientId = `STH-${crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase()}`;
    const { data, error } = await db.from("client_links").insert({
      token,
      client_id: clientId,
      access_pin_hash: hashClientPin(pin),
      status: "created"
    }).select("token").single();

    if (error || !data) throw error || new Error("Unable to create a private request link.");
    return NextResponse.json({ token: data.token });
  } catch (error) {
    logApiError(error);
    return apiRouteError(error, "Unable to start your request. Please try again.", true);
  }
}
