import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { apiError, optionalText, requiredText } from "@/lib/api";
import { createClientPin, hashClientPin } from "@/lib/security";
import { getServiceSupabase } from "@/lib/supabase-server";

export async function GET() {
  const session = await requireAdminApi();
  if (!session) return apiError("Admin login required.", 401);
  try {
    const db = getServiceSupabase();
    const { data, error } = await db.from("client_links").select("id, token, client_id, client_name, phone, status, expires_at, created_at").order("created_at", { ascending: false }).limit(100);
    if (error) throw error;
    return NextResponse.json({ links: data || [] });
  } catch (error) {
    console.error(error);
    return apiError("Unable to load client links.", 500);
  }
}

export async function POST(request: NextRequest) {
  const session = await requireAdminApi();
  if (!session) return apiError("Admin login required.", 401);
  try {
    const body = await request.json();
    const clientId = requiredText(body.clientId, "Client ID", 100);
    const pin = createClientPin();
    const token = crypto.randomUUID();
    const db = getServiceSupabase();
    const { data, error } = await db.from("client_links").insert({
      token,
      client_id: clientId,
      access_pin_hash: hashClientPin(pin),
      client_name: optionalText(body.clientName, 150),
      phone: optionalText(body.phone, 50),
      status: "created"
    }).select("id, token, client_id").single();
    if (error || !data) {
      if (error?.code === "23505") return apiError("A link with that client ID and PIN already exists. Please try again.", 409);
      throw error || new Error("Unable to create link.");
    }
    const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
    return NextResponse.json({ clientId: data.client_id, pin, url: `${origin.replace(/\/$/, "")}/portal/${data.token}` });
  } catch (error) {
    console.error(error);
    return apiError(error instanceof Error ? error.message : "Unable to create client link.", 500);
  }
}
