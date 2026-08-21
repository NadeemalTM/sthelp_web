import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { apiError, apiRouteError, logApiError, optionalText, requiredText } from "@/lib/api";
import { getServiceSupabase } from "@/lib/supabase-server";

function isMissingSecondBankColumns(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const details = error as { code?: unknown; message?: unknown; details?: unknown };
  const text = `${String(details.message || "")} ${String(details.details || "")}`.toLowerCase();
  return ["bank_name_2", "account_name_2", "account_number_2", "bank_branch_2"].some((column) => text.includes(column));
}

function isMissingBusinessContactColumns(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const details = error as { code?: unknown; message?: unknown; details?: unknown };
  const text = `${String(details.message || "")} ${String(details.details || "")}`.toLowerCase();
  return ["business_phone", "business_email", "business_address"].some((column) => text.includes(column));
}

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
      business_phone: requiredText(body.businessPhone, "Business phone", 40).replace(/[^0-9+ ()-]/g, ""),
      business_email: requiredText(body.businessEmail, "Business email", 200).toLowerCase(),
      business_address: requiredText(body.businessAddress, "Postal address", 500),
      bank_name: requiredText(body.bankName, "Bank name", 150),
      account_name: requiredText(body.accountName, "Account name", 150),
      account_number: requiredText(body.accountNumber, "Account number", 100),
      bank_branch: requiredText(body.bankBranch, "Bank branch", 150),
      bank_name_2: optionalText(body.bankName2, 150),
      account_name_2: optionalText(body.accountName2, 150),
      account_number_2: optionalText(body.accountNumber2, 100),
      bank_branch_2: optionalText(body.bankBranch2, 150),
      payment_note: requiredText(body.paymentNote, "Payment note", 1000),
      currency: requiredText(body.currency, "Currency", 10).toUpperCase(),
      support_notice: requiredText(body.supportNotice, "Support notice", 2000)
    };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(update.business_email)) {
      return apiError("Enter a valid business email address.");
    }
    const db = getServiceSupabase();
    const { data, error } = await db.from("settings").update(update).eq("id", 1).select("*").single();
    if (error && isMissingBusinessContactColumns(error)) {
      logApiError(error);
      return apiError(
        "The database needs the business-contact migration. Run supabase/migrations/20260821_add_business_contact_details.sql in the Supabase SQL Editor, then save again.",
        503
      );
    }
    if (error && isMissingSecondBankColumns(error)) {
      logApiError(error);
      return apiError(
        "The database needs the second-bank migration. Run supabase/migrations/20260818_add_second_bank_account.sql in the Supabase SQL Editor, then save again.",
        503
      );
    }
    if (error) throw error;
    return NextResponse.json({ settings: data });
  } catch (error) {
    logApiError(error);
    return apiRouteError(error, "Unable to save settings.", true);
  }
}
