import { NextRequest, NextResponse } from "next/server";
import { apiError, apiRouteError, logApiError, requiredText } from "@/lib/api";
import { createPayHereCheckoutHash, formatPayHereAmount, getPayHereConfig } from "@/lib/payhere";
import { getServiceSupabase } from "@/lib/supabase-server";

export const runtime = "nodejs";

function splitName(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || "Client",
    lastName: parts.slice(1).join(" ") || "StHelp"
  };
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const config = getPayHereConfig();
    const { token } = await params;
    const body = await request.json();
    const address = requiredText(body.address, "Billing address", 300);
    const city = requiredText(body.city, "City", 100);
    const db = getServiceSupabase();

    const { data: link, error: linkError } = await db
      .from("client_links")
      .select("id, expires_at")
      .eq("token", token)
      .maybeSingle();
    if (linkError) throw linkError;
    if (!link || (link.expires_at && new Date(link.expires_at) < new Date())) {
      return apiError("This client link is invalid or expired.", 404);
    }

    const { data: assignment, error } = await db
      .from("assignments")
      .select("id, student_name, contact_number, email, assignment_title, quoted_amount, currency, quote_status, payment_status")
      .eq("client_link_id", link.id)
      .maybeSingle();
    if (error) throw error;
    if (!assignment) return apiError("Submit your assignment requirements first.", 404);
    if (assignment.quote_status !== "accepted") return apiError("Accept the quotation before paying online.", 409);
    if (assignment.payment_status === "verified") return apiError("This payment has already been verified.", 409);

    const email = String(assignment.email || "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return apiError("Add a valid email address to your assignment details before paying online.", 400);
    }

    const phone = String(assignment.contact_number || "").replace(/[^0-9+]/g, "");
    if (phone.length < 9) return apiError("Add a valid contact number before paying online.", 400);

    const amount = formatPayHereAmount(assignment.quoted_amount);
    const currency = String(assignment.currency || "LKR").toUpperCase();
    if (!["LKR", "USD"].includes(currency)) return apiError("PayHere checkout supports this portal only for LKR or USD quotations.", 400);
    const orderId = String(assignment.id);
    const { firstName, lastName } = splitName(String(assignment.student_name || "Client"));

    const fields = {
      merchant_id: config.merchantId,
      return_url: `${config.appUrl}/portal/${encodeURIComponent(token)}?payment=returned`,
      cancel_url: `${config.appUrl}/portal/${encodeURIComponent(token)}?payment=cancelled`,
      notify_url: `${config.appUrl}/api/payhere/notify`,
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      address,
      city,
      country: "Sri Lanka",
      order_id: orderId,
      items: `StHelp service: ${String(assignment.assignment_title || "Assignment support").slice(0, 160)}`,
      currency,
      amount,
      hash: createPayHereCheckoutHash({
        merchantId: config.merchantId,
        merchantSecret: config.merchantSecret,
        orderId,
        amount,
        currency
      })
    };

    return NextResponse.json({ checkoutUrl: config.checkoutUrl, fields });
  } catch (error) {
    logApiError(error);
    return apiRouteError(error, "Unable to start PayHere checkout.", true);
  }
}
