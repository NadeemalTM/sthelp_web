import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { apiError, apiRouteError, logApiError, requiredText } from "@/lib/api";
import { createPayHereCheckoutHash, formatPayHereAmount, getPayHereConfig } from "@/lib/payhere";
import { getServiceSupabase } from "@/lib/supabase-server";
import { recordAssignmentActivity } from "@/lib/assignment-activity";
import { isRateLimited } from "@/lib/rate-limit";
import { findUnresolvedPayHereAttempt } from "@/lib/payhere-payment-state";

export const runtime = "nodejs";

function splitName(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || "Client",
    lastName: parts.slice(1).join(" ") || "StHelp"
  };
}

function payHereText(value: unknown, fallback: string, maxLength: number) {
  const cleaned = String(value || "")
    .normalize("NFKC")
    .replace(/[<>\u0000-\u001f\u007f\ud800-\udfff]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return (cleaned || fallback).slice(0, maxLength);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const config = getPayHereConfig();
    const { token } = await params;
    if (isRateLimited(request, "payhere-checkout", 8, 15 * 60 * 1000)) {
      return apiError("Too many checkout attempts. Please wait a few minutes and try again.", 429);
    }
    const body = await request.json();
    const address = payHereText(requiredText(body.address, "Billing address", 300), "Sri Lanka", 300);
    const city = payHereText(requiredText(body.city, "City", 100), "Colombo", 100);
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
      .select("*")
      .eq("client_link_id", link.id)
      .maybeSingle();
    if (error) throw error;
    if (!assignment) return apiError("Submit your assignment requirements first.", 404);
    if (assignment.status === "cancelled") return apiError("This assignment has been cancelled and cannot accept payment.", 409);
    if (assignment.quote_status !== "accepted") return apiError("Accept the quotation before paying online.", 409);
    if (assignment.payment_status === "verified") return apiError("This payment has already been verified.", 409);
    if (assignment.payment_status === "submitted" && assignment.payment_reference) return apiError("A bank payment is already awaiting verification. Ask StHelp to reject it before switching to PayHere.", 409);
    const unresolvedAttempt = await findUnresolvedPayHereAttempt(db, assignment.id);
    if (unresolvedAttempt?.status === "paid") {
      return apiError("PayHere has already reported a successful payment for this order. StHelp must review it before another payment can be started.", 409);
    }
    if (unresolvedAttempt?.status === "pending") {
      return apiError("PayHere is still processing an earlier transaction. Do not start another payment; contact StHelp if it does not update.", 409);
    }
    if (assignment.payhere_payment_attempt_id) {
      try {
        const { data: currentAttempt, error: currentAttemptError } = await db
          .from("payhere_payment_attempts")
          .select("status, expires_at")
          .eq("id", assignment.payhere_payment_attempt_id)
          .maybeSingle();
        if (!currentAttemptError && currentAttempt) {
          if (currentAttempt.status === "paid") {
            return apiError("PayHere has already reported a successful payment for this quotation. StHelp is reviewing it now.", 409);
          }
          if (currentAttempt.status === "pending") {
            return apiError("PayHere is still processing the current transaction. Do not start another payment; contact StHelp if it does not update.", 409);
          }
          if (currentAttempt.status === "initiated" && new Date(currentAttempt.expires_at).getTime() > Date.now()) {
            return apiError("A PayHere checkout is already open for this quotation. Complete it or wait briefly before trying again.", 409);
          }
          if (currentAttempt.status === "charged_back") {
            return apiError("This payment has a chargeback under review. Contact StHelp before making another payment.", 409);
          }
        }
      } catch {
        // Table or attempt may not exist yet
      }
    }

    const email = String(assignment.email || "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return apiError("Add a valid email address to your assignment details before paying online.", 400);
    }

    const phone = String(assignment.contact_number || "").replace(/[^0-9+]/g, "");
    if (!/^\+?[0-9]{9,15}$/.test(phone)) return apiError("Add a valid contact number before paying online.", 400);

    const amount = formatPayHereAmount(assignment.quoted_amount);
    const currency = String(assignment.currency || "LKR").toUpperCase();
    if (!["LKR", "USD"].includes(currency)) return apiError("PayHere checkout supports this portal only for LKR or USD quotations.", 400);
    // PayHere does not enforce merchant order-ID uniqueness. A short random
    // suffix gives each retry a distinct immutable ledger entry.
    const orderId = `${String(assignment.id)}-${randomBytes(4).toString("hex")}`;
    const { firstName, lastName } = splitName(payHereText(assignment.student_name, "Client StHelp", 150));

    const fields = {
      merchant_id: config.merchantId,
      // Keep the private portal token out of third-party URLs. The browser
      // stores its own return path immediately before leaving StHelp.
      return_url: `${config.appUrl}/payment/return?state=returned`,
      cancel_url: `${config.appUrl}/payment/return?state=cancelled`,
      notify_url: `${config.appUrl}/api/payhere/notify`,
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      address,
      city,
      country: "Sri Lanka",
      order_id: orderId,
      items: payHereText(`StHelp service: ${assignment.assignment_title || "Assignment support"}`, "StHelp assignment support", 160),
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

    // Persist the immutable quotation snapshot before redirecting to PayHere.
    // The assignment points at the active attempt so concurrent admin edits,
    // bank payments and retries can be resolved against the exact order.
    const { data: attempt, error: attemptError } = await db
      .from("payhere_payment_attempts")
      .insert({
        assignment_id: assignment.id,
        order_id: orderId,
        expected_amount: amount,
        expected_currency: currency,
        quote_sent_at_snapshot: assignment.quote_sent_at,
        quote_responded_at_snapshot: assignment.quote_responded_at,
        status: "initiated"
      })
      .select("id")
      .maybeSingle();
    if (attemptError) throw attemptError;
    if (!attempt) throw new Error("Unable to create a secure PayHere order.");

    const nextPaymentStatus = assignment.payment_status === "rejected" || !assignment.payment_reference
      ? "not_submitted"
      : assignment.payment_status;
    let lockQuery = db
      .from("assignments")
      .update({
        payment_status: nextPaymentStatus,
        payment_reference: null,
        payment_note: null,
        payhere_payment_attempt_id: attempt.id
      })
      .eq("id", assignment.id)
      .eq("quote_status", "accepted")
      .eq("quoted_amount", assignment.quoted_amount)
      .eq("payment_status", assignment.payment_status)
      .neq("payment_status", "verified");
    lockQuery = assignment.payhere_payment_attempt_id
      ? lockQuery.eq("payhere_payment_attempt_id", assignment.payhere_payment_attempt_id)
      : lockQuery.is("payhere_payment_attempt_id", null);
    const { data: locked, error: lockError } = await lockQuery.select("id").maybeSingle();
    if (lockError) {
      await db.from("payhere_payment_attempts").update({
        status: "failed",
        status_message: "Checkout could not lock the accepted quotation."
      }).eq("id", attempt.id).eq("status", "initiated");
      throw lockError;
    }
    if (!locked) {
      await db.from("payhere_payment_attempts").update({
        status: "failed",
        status_message: "Checkout was not opened because the assignment payment state changed."
      }).eq("id", attempt.id).eq("status", "initiated");
      return apiError("The quotation changed before checkout started. Refresh the portal and try again.", 409);
    }

    if (assignment.payhere_payment_attempt_id) {
      const { error: supersedeError } = await db.from("payhere_payment_attempts").update({
        status: "superseded",
        status_message: "A newer checkout attempt was opened for this quotation."
      }).eq("id", assignment.payhere_payment_attempt_id).eq("status", "initiated");
      if (supersedeError) throw supersedeError;
    }

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
    return apiRouteError(error, "Unable to start PayHere checkout.");
  }
}
