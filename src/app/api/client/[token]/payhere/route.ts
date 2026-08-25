import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { apiError, apiRouteError, logApiError, requiredText } from "@/lib/api";
import { createPayHereCheckoutHash, formatPayHereAmount, getPayHereConfig } from "@/lib/payhere";
import { getServiceSupabase } from "@/lib/supabase-server";
import { recordAssignmentActivity } from "@/lib/assignment-activity";

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
      .select("id, student_name, contact_number, email, assignment_title, quoted_amount, currency, status, quote_status, payment_status, payment_reference")
      .eq("client_link_id", link.id)
      .maybeSingle();
    if (error) throw error;
    if (!assignment) return apiError("Submit your assignment requirements first.", 404);
    if (assignment.status === "cancelled") return apiError("This assignment has been cancelled and cannot accept payment.", 409);
    if (assignment.quote_status !== "accepted") return apiError("Accept the quotation before paying online.", 409);
    if (assignment.payment_status === "verified") return apiError("This payment has already been verified.", 409);
    if (assignment.payment_status === "submitted" && assignment.payment_reference) return apiError("A bank payment is already awaiting verification. Ask StHelp to reject it before switching to PayHere.", 409);

    const email = String(assignment.email || "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return apiError("Add a valid email address to your assignment details before paying online.", 400);
    }

    const phone = String(assignment.contact_number || "").replace(/[^0-9+]/g, "");
    if (phone.length < 9) return apiError("Add a valid contact number before paying online.", 400);

    const amount = formatPayHereAmount(assignment.quoted_amount);
    const currency = String(assignment.currency || "LKR").toUpperCase();
    if (!["LKR", "USD"].includes(currency)) return apiError("PayHere checkout supports this portal only for LKR or USD quotations.", 400);
    // PayHere does not enforce merchant order-ID uniqueness. A short random
    // suffix keeps retries distinct while the UUID prefix still identifies the
    // assignment during the signed server notification.
    const orderId = `${String(assignment.id)}-${randomBytes(4).toString("hex")}`;
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

    // Lock the accepted quotation before redirecting to PayHere. This prevents
    // an administrator from changing the amount while an external checkout is
    // in progress and keeps later notification verification deterministic.
    const now = new Date().toISOString();
    const pendingNote = `PayHere checkout ${orderId} started; awaiting secure payment confirmation.`;
    const { data: locked, error: lockError } = await db
      .from("assignments")
      .update({
        payment_status: "submitted",
        payment_reference: null,
        payment_note: pendingNote,
        payment_submitted_at: now
      })
      .eq("id", assignment.id)
      .eq("quote_status", "accepted")
      .eq("quoted_amount", assignment.quoted_amount)
      .eq("payment_status", assignment.payment_status)
      .neq("payment_status", "verified")
      .select("id")
      .maybeSingle();
    if (lockError) throw lockError;
    if (!locked) return apiError("The quotation changed before checkout started. Refresh the portal and try again.", 409);

    if (assignment.payment_status !== "submitted") {
      await recordAssignmentActivity(db, {
        assignmentId: assignment.id,
        actor: "client",
        visibility: "both",
        eventType: "payhere_checkout_started",
        summary: "You started secure online checkout with PayHere."
      });
    }

    return NextResponse.json({ checkoutUrl: config.checkoutUrl, fields });
  } catch (error) {
    logApiError(error);
    return apiRouteError(error, "Unable to start PayHere checkout.", true);
  }
}
