import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { apiError, apiRouteError, logApiError, requiredText } from "@/lib/api";
import { getServiceSupabase } from "@/lib/supabase-server";

export async function GET() {
  const session = await requireAdminApi();
  if (!session) return apiError("Admin login required.", 401);
  try {
    const db = getServiceSupabase();
    const { data, error } = await db.from("settings").select("*").eq("id", 1).maybeSingle();
    if (error) throw error;
    return NextResponse.json({ settings: data });
  } catch (error) {
    logApiError(error);
    return apiRouteError(error, "Unable to load settings.", true);
  }
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
      bank_name_2: requiredText(body.bankName2, "Second bank name", 150),
      account_name_2: requiredText(body.accountName2, "Second account name", 150),
      account_number_2: requiredText(body.accountNumber2, "Second account number", 100),
      bank_branch_2: requiredText(body.bankBranch2, "Second bank branch", 150),
      payment_note: requiredText(body.paymentNote, "Payment note", 1000),
      currency: requiredText(body.currency, "Currency", 10).toUpperCase(),
      support_notice: requiredText(body.supportNotice, "Support notice", 2000)
    };
    const db = getServiceSupabase();
    const { data, error } = await db.from("settings").update(update).eq("id", 1).select("*").single();
    if (error) throw error;
    return NextResponse.json({ settings: data });
  } catch (error) {
    logApiError(error);
    return apiRouteError(error, "Unable to save settings.", true);
  }
}
