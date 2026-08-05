import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { apiError, requiredText } from "@/lib/api";
import { getServiceSupabase } from "@/lib/supabase-server";

export async function GET() {
  const session = await requireAdminApi();
  if (!session) return apiError("Admin login required.", 401);
  const db = getServiceSupabase();
  const { data, error } = await db.from("settings").select("*").eq("id", 1).maybeSingle();
  if (error) return apiError("Unable to load settings.", 500);
  return NextResponse.json({ settings: data });
}

export async function PATCH(request: NextRequest) {
  const session = await requireAdminApi();
  if (!session) return apiError("Admin login required.", 401);
  try {
    const body = await request.json();
    const update = {
      business_name: requiredText(body.businessName, "Business name", 150),
      whatsapp_number: requiredText(body.whatsappNumber, "WhatsApp number", 40).replace(/[^0-9+]/g, ""),
      bank_name: requiredText(body.bankName, "Bank name", 150),
      account_name: requiredText(body.accountName, "Account name", 150),
      account_number: requiredText(body.accountNumber, "Account number", 100),
      bank_branch: requiredText(body.bankBranch, "Bank branch", 150),
      payment_note: requiredText(body.paymentNote, "Payment note", 1000),
      currency: requiredText(body.currency, "Currency", 10).toUpperCase(),
      support_notice: requiredText(body.supportNotice, "Support notice", 2000)
    };
    const db = getServiceSupabase();
    const { data, error } = await db.from("settings").update(update).eq("id", 1).select("*").single();
    if (error) throw error;
    return NextResponse.json({ settings: data });
  } catch (error) {
    console.error(error);
    return apiError(error instanceof Error ? error.message : "Unable to save settings.", 500);
  }
}
