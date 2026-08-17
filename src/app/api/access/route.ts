import { NextRequest, NextResponse } from "next/server";
import { apiError, apiRouteError, logApiError } from "@/lib/api";
import { hashClientPin } from "@/lib/security";
import { getServiceSupabase } from "@/lib/supabase-server";
import { isRateLimited } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    if (isRateLimited(request, "client-access", 10, 15 * 60 * 1000)) return apiError("Too many sign-in attempts. Please try again in a few minutes.", 429);
    const { clientId, pin } = await request.json();
    const id = String(clientId || "").trim();
    const enteredPin = String(pin || "").trim();
    if (!id || !/^\d{6}$/.test(enteredPin)) return apiError("Enter your client ID and 6-digit PIN.");

    const db = getServiceSupabase();
    const pinHash = hashClientPin(enteredPin);
    const { data: link, error } = await db.from("client_links").select("token, access_pin_hash, expires_at").eq("client_id", id).eq("access_pin_hash", pinHash).limit(1).maybeSingle();
    if (error) throw error;
    if (!link || link.access_pin_hash !== pinHash) return apiError("Client ID or PIN is incorrect.", 401);
    if (link.expires_at && new Date(link.expires_at) < new Date()) return apiError("This client link has expired. Contact StHelp for a new link.", 410);

    return NextResponse.json({ url: `/portal/${link.token}` });
  } catch (error) {
    logApiError(error);
    return apiRouteError(error, "Unable to verify access.", true);
  }
}
