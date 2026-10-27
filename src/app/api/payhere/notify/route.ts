import { recordAssignmentActivity } from "@/lib/assignment-activity";
import { formatPayHereAmount, getPayHereCredentials, verifyPayHereNotification } from "@/lib/payhere";
import { getServiceSupabase } from "@/lib/supabase-server";

export const runtime = "nodejs";

function formValue(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === "string" ? value : "";
}

function sameTimestamp(left: unknown, right: unknown) {
  return String(left || "") === String(right || "");
}

export async function POST(request: Request) {
  try {
    // Keep accepting genuine delayed notifications even when new checkouts are
    // temporarily hidden with PAYHERE_ENABLED=false.
    const credentials = getPayHereCredentials();
    const form = await request.formData();
    const merchantId = formValue(form, "merchant_id");
    const orderId = formValue(form, "order_id");
    const paymentId = formValue(form, "payment_id").slice(0, 150);
    const amount = formValue(form, "payhere_amount");
    const currencyForSignature = formValue(form, "payhere_currency");
    const currency = currencyForSignature.toUpperCase();
    const statusCode = formValue(form, "status_code");
    const statusMessage = formValue(form, "status_message").slice(0, 500);
    const paymentMethod = formValue(form, "method").slice(0, 80);
    const signature = formValue(form, "md5sig");

    if (!merchantId || !orderId || !amount || !currencyForSignature || !statusCode || !signature) {
      return new Response("Missing payment notification fields.", { status: 400 });
    }
    if (merchantId !== credentials.merchantId || !verifyPayHereNotification({
      merchantId,
      orderId,
      amount,
      currency: currencyForSignature,
      statusCode,
      signature,
      merchantSecret: credentials.merchantSecret
    })) {
      return new Response("Invalid payment notification signature.", { status: 400 });
    }

    const db = getServiceSupabase();
    const { data: attempt, error: attemptError } = await db
      .from("payhere_payment_attempts")
      .select("*")
      .eq("order_id", orderId)
      .maybeSingle();
    if (attemptError) throw attemptError;
    if (!attempt) return new Response("Unknown PayHere order.", { status: 404 });

    const { data: assignment, error: assignmentError } = await db
      .from("assignments")
      .select("id, status, quoted_amount, currency, quote_status, quote_sent_at, quote_responded_at, payment_status, payment_reference, payhere_payment_attempt_id")
      .eq("id", attempt.assignment_id)
      .maybeSingle();
    if (assignmentError) throw assignmentError;
    if (!assignment) return new Response("Unknown assignment.", { status: 404 });

    const now = new Date().toISOString();
    const reportedAmount = Number(amount);
    const amountMatches = Number.isFinite(reportedAmount)
      && reportedAmount > 0
      && reportedAmount.toFixed(2) === formatPayHereAmount(attempt.expected_amount);
    const currencyMatches = currency === String(attempt.expected_currency).toUpperCase();
    const paymentIdPresent = Boolean(paymentId);
    const numericStatusCode = Number(statusCode);
    const providerUpdate: Record<string, unknown> = {
      payhere_currency: currency,
      payment_method: paymentMethod || null,
      status_code: Number.isFinite(numericStatusCode) ? numericStatusCode : null,
      status_message: statusMessage || null,
      notified_at: now
    };
    if (Number.isFinite(reportedAmount)) providerUpdate.payhere_amount = reportedAmount;
    if (paymentId) providerUpdate.payhere_payment_id = paymentId;

    // A PayHere payment ID must never identify two local orders, and an order
    // that was already paid must never silently change to another payment ID.
    if (paymentId) {
      const { data: collision, error: collisionError } = await db
        .from("payhere_payment_attempts")
        .select("id")
        .eq("payhere_payment_id", paymentId)
        .neq("id", attempt.id)
        .limit(1)
        .maybeSingle();
      if (collisionError) throw collisionError;
      if (collision || (attempt.payhere_payment_id && attempt.payhere_payment_id !== paymentId)) {
        const { error: reviewError } = await db.from("payhere_payment_attempts").update({
          ...providerUpdate,
          payhere_payment_id: attempt.payhere_payment_id || null,
          ...(statusCode === "2" && !["refunded", "charged_back"].includes(String(attempt.status))
            ? { status: "paid", paid_at: attempt.paid_at || now }
            : {}),
          review_reason: "PayHere reported a payment ID already associated with another checkout."
        }).eq("id", attempt.id);
        if (reviewError) throw reviewError;
        await recordAssignmentActivity(db, {
          assignmentId: assignment.id,
          actor: "system",
          visibility: "admin",
          eventType: "payhere_payment_review_required",
          summary: "A PayHere callback reported a conflicting payment ID and requires manual review."
        });
        return new Response("Payment notification recorded for review.", { status: 200 });
      }
    }

    // A refund is confirmed manually only after it is completed in PayHere.
    // Delayed or replayed callbacks must never reopen or reapply that payment.
    if (attempt.status === "refunded") {
      const { error } = await db.from("payhere_payment_attempts").update(providerUpdate).eq("id", attempt.id);
      if (error) throw error;
      return new Response("Refunded payment already recorded.", { status: 200 });
    }

    if (statusCode === "0") {
      const { error: metadataError } = await db.from("payhere_payment_attempts").update(providerUpdate).eq("id", attempt.id);
      if (metadataError) throw metadataError;
      const { error } = await db.from("payhere_payment_attempts")
        .update({ status: "pending" })
        .eq("id", attempt.id)
        .in("status", ["initiated", "pending", "superseded"]);
      if (error) throw error;
      return new Response("Pending payment acknowledged.", { status: 200 });
    }

    if (statusCode === "-1" || statusCode === "-2") {
      const nextStatus = statusCode === "-1" ? "cancelled" : "failed";
      const { error: metadataError } = await db.from("payhere_payment_attempts").update(providerUpdate).eq("id", attempt.id);
      if (metadataError) throw metadataError;
      const { data: changed, error } = await db.from("payhere_payment_attempts")
        .update({ status: nextStatus, review_reason: null })
        .eq("id", attempt.id)
        .in("status", ["initiated", "pending", "superseded", "cancelled", "failed"])
        .select("id")
        .maybeSingle();
      if (error) throw error;

      if (changed && assignment.payhere_payment_attempt_id === attempt.id && assignment.payment_status !== "verified") {
        const { error: clearError } = await db.from("assignments")
          .update({ payhere_payment_attempt_id: null })
          .eq("id", assignment.id)
          .eq("payhere_payment_attempt_id", attempt.id)
          .neq("payment_status", "verified");
        if (clearError) throw clearError;
      }
      if (changed && !["cancelled", "failed"].includes(String(attempt.status))) {
        await recordAssignmentActivity(db, {
          assignmentId: assignment.id,
          actor: "system",
          visibility: "both",
          eventType: statusCode === "-1" ? "payhere_checkout_cancelled" : "payhere_payment_failed",
          summary: statusCode === "-1"
            ? "PayHere reported that online checkout was cancelled."
            : "PayHere reported that the online payment failed."
        });
      }
      return new Response("Unsuccessful payment acknowledged.", { status: 200 });
    }

    if (statusCode === "-3") {
      const firstChargeback = attempt.status !== "charged_back";
      const { error } = await db.from("payhere_payment_attempts").update({
        ...providerUpdate,
        status: "charged_back",
        review_reason: "PayHere reported a chargeback for this exact transaction."
      }).eq("id", attempt.id);
      if (error) throw error;

      const { data: chargebackAssignment, error: chargebackAssignmentError } = await db
        .from("assignments")
        .select("id, quoted_amount, currency, quote_sent_at, quote_responded_at, payment_status, payment_reference, payhere_payment_attempt_id")
        .eq("id", assignment.id)
        .maybeSingle();
      if (chargebackAssignmentError) throw chargebackAssignmentError;

      if (chargebackAssignment?.payment_status === "verified" && chargebackAssignment.payhere_payment_attempt_id === attempt.id) {
        const { data: replacementCandidates, error: replacementError } = await db
          .from("payhere_payment_attempts")
          .select("id, payhere_payment_id, expected_amount, expected_currency, payhere_amount, payhere_currency, quote_sent_at_snapshot, quote_responded_at_snapshot")
          .eq("assignment_id", assignment.id)
          .eq("status", "paid")
          .neq("id", attempt.id)
          .order("paid_at", { ascending: false })
          .limit(25);
        if (replacementError) throw replacementError;
        const replacement = (replacementCandidates || []).find((candidate: any) => {
          const expected = Number(candidate.expected_amount);
          const reported = Number(candidate.payhere_amount);
          const current = Number(chargebackAssignment.quoted_amount);
          return Number.isFinite(expected)
            && Number.isFinite(reported)
            && Number.isFinite(current)
            && expected.toFixed(2) === reported.toFixed(2)
            && expected.toFixed(2) === current.toFixed(2)
            && String(candidate.expected_currency).toUpperCase() === String(candidate.payhere_currency).toUpperCase()
            && String(candidate.expected_currency).toUpperCase() === String(chargebackAssignment.currency || "LKR").toUpperCase()
            && sameTimestamp(candidate.quote_sent_at_snapshot, chargebackAssignment.quote_sent_at)
            && sameTimestamp(candidate.quote_responded_at_snapshot, chargebackAssignment.quote_responded_at);
        });

        if (replacement) {
          const { data: replaced, error: replaceError } = await db.from("assignments").update({
            payhere_payment_attempt_id: replacement.id,
            payment_reference: replacement.payhere_payment_id || chargebackAssignment.payment_reference,
            payment_note: "Paid online and verified automatically through PayHere."
          }).eq("id", assignment.id).eq("payment_status", "verified").eq("payhere_payment_attempt_id", attempt.id).select("id").maybeSingle();
          if (replaceError) throw replaceError;
          let replacementIsCurrent = Boolean(replaced);
          if (!replacementIsCurrent) {
            const { data: concurrentAssignment, error: concurrentError } = await db
              .from("assignments")
              .select("payment_status, payhere_payment_attempt_id")
              .eq("id", assignment.id)
              .maybeSingle();
            if (concurrentError) throw concurrentError;
            replacementIsCurrent = concurrentAssignment?.payment_status === "verified"
              && concurrentAssignment.payhere_payment_attempt_id === replacement.id;
            if (concurrentAssignment?.payment_status === "verified"
              && concurrentAssignment.payhere_payment_attempt_id === attempt.id) {
              throw new Error("Chargeback replacement could not be applied.");
            }
          }
          if (replacementIsCurrent) {
            const { data: appliedReplacement, error: applyReplacementError } = await db.from("payhere_payment_attempts")
              .update({ applied_at: now, review_reason: null })
              .eq("id", replacement.id)
              .eq("status", "paid")
              .select("id")
              .maybeSingle();
            if (applyReplacementError) throw applyReplacementError;
            if (!appliedReplacement) throw new Error("Chargeback replacement payment changed before it was applied.");
          }
        } else {
          const { data: revoked, error: revokeError } = await db.from("assignments").update({
            payment_status: "rejected",
            payment_note: `PayHere reported a payment chargeback.${statusMessage ? ` ${statusMessage}` : ""}`,
            download_unlocked: false
          }).eq("id", assignment.id).eq("payment_status", "verified").eq("payhere_payment_attempt_id", attempt.id).select("id").maybeSingle();
          if (revokeError) throw revokeError;
          if (!revoked) {
            const { data: concurrentAssignment, error: concurrentError } = await db
              .from("assignments")
              .select("payment_status, payhere_payment_attempt_id")
              .eq("id", assignment.id)
              .maybeSingle();
            if (concurrentError) throw concurrentError;
            if (concurrentAssignment?.payment_status === "verified"
              && concurrentAssignment.payhere_payment_attempt_id === attempt.id) {
              throw new Error("Charged-back payment could not be revoked.");
            }
          }
        }
      }

      if (firstChargeback) await recordAssignmentActivity(db, {
        assignmentId: assignment.id,
        actor: "system",
        visibility: "both",
        eventType: "payhere_payment_charged_back",
        summary: assignment.payhere_payment_attempt_id === attempt.id
          ? "PayHere reported a chargeback for the payment applied to this assignment."
          : "PayHere reported a chargeback for an unapplied or older checkout."
      });
      return new Response("Chargeback acknowledged.", { status: 200 });
    }

    if (statusCode !== "2") {
      const { error } = await db.from("payhere_payment_attempts").update(providerUpdate).eq("id", attempt.id);
      if (error) throw error;
      return new Response("Payment notification acknowledged.", { status: 200 });
    }

    if (attempt.status === "charged_back" || attempt.status === "refunded") {
      const { error } = await db.from("payhere_payment_attempts").update(providerUpdate).eq("id", attempt.id);
      if (error) throw error;
      return new Response("Terminal payment status already recorded.", { status: 200 });
    }

    const firstPaidNotification = attempt.status !== "paid";
    const { data: paidAttempt, error: paidError } = await db.from("payhere_payment_attempts").update({
      ...providerUpdate,
      status: "paid",
      paid_at: attempt.paid_at || now,
      review_reason: amountMatches && currencyMatches && paymentIdPresent
        ? attempt.review_reason
        : "The successful callback is missing a payment ID or does not match the checkout amount/currency snapshot."
    }).eq("id", attempt.id)
      .in("status", ["initiated", "pending", "superseded", "cancelled", "failed", "paid"])
      .select("id")
      .maybeSingle();
    if (paidError) throw paidError;
    if (!paidAttempt) return new Response("Terminal payment status already recorded.", { status: 200 });

    if (!amountMatches || !currencyMatches || !paymentIdPresent) {
      if (firstPaidNotification) await recordAssignmentActivity(db, {
        assignmentId: assignment.id,
        actor: "system",
        visibility: "admin",
        eventType: "payhere_payment_review_required",
        summary: "PayHere reported a successful payment with missing or mismatched transaction details. Review it in PayHere."
      });
      return new Response("Paid transaction recorded for manual review.", { status: 200 });
    }

    const currentQuotedAmount = Number(assignment.quoted_amount);
    const quoteStillMatches = assignment.status !== "cancelled"
      && assignment.quote_status === "accepted"
      && Number.isFinite(currentQuotedAmount)
      && currentQuotedAmount > 0
      && currentQuotedAmount.toFixed(2) === formatPayHereAmount(attempt.expected_amount)
      && String(assignment.currency || "LKR").toUpperCase() === String(attempt.expected_currency).toUpperCase()
      && sameTimestamp(assignment.quote_sent_at, attempt.quote_sent_at_snapshot)
      && sameTimestamp(assignment.quote_responded_at, attempt.quote_responded_at_snapshot);

    if (assignment.payment_status === "verified") {
      if (assignment.payhere_payment_attempt_id === attempt.id) {
        const { error } = await db.from("payhere_payment_attempts")
          .update({ applied_at: attempt.applied_at || now, review_reason: null })
          .eq("id", attempt.id)
          .eq("status", "paid");
        if (error) throw error;
        return new Response("Payment already verified.", { status: 200 });
      }
      const { error } = await db.from("payhere_payment_attempts").update({
        review_reason: "This is an additional successful payment; another payment already verifies the assignment."
      }).eq("id", attempt.id);
      if (error) throw error;
      if (firstPaidNotification) await recordAssignmentActivity(db, {
        assignmentId: assignment.id,
        actor: "system",
        visibility: "admin",
        eventType: "payhere_duplicate_payment_received",
        summary: "An additional successful PayHere payment was received. Review it for a possible refund."
      });
      return new Response("Additional payment recorded for review.", { status: 200 });
    }

    if (!quoteStillMatches) {
      const { error } = await db.from("payhere_payment_attempts").update({
        review_reason: "Payment was received after the assignment or quotation changed; manual reconciliation is required."
      }).eq("id", attempt.id);
      if (error) throw error;
      if (firstPaidNotification) await recordAssignmentActivity(db, {
        assignmentId: assignment.id,
        actor: "system",
        visibility: "admin",
        eventType: "payhere_payment_review_required",
        summary: "A successful PayHere payment belongs to an older quotation state and requires manual reconciliation."
      });
      return new Response("Payment recorded for manual reconciliation.", { status: 200 });
    }

    let verifyQuery = db.from("assignments").update({
      payment_status: "verified",
      payment_reference: paymentId || `PayHere ${orderId}`,
      payment_note: "Paid online and verified automatically through PayHere.",
      payment_submitted_at: now,
      payment_verified_at: now,
      payhere_payment_attempt_id: attempt.id
    }).eq("id", assignment.id)
      .eq("quote_status", "accepted")
      .eq("quoted_amount", attempt.expected_amount)
      .eq("currency", assignment.currency)
      .neq("payment_status", "verified")
      .neq("status", "cancelled");
    verifyQuery = attempt.quote_sent_at_snapshot
      ? verifyQuery.eq("quote_sent_at", attempt.quote_sent_at_snapshot)
      : verifyQuery.is("quote_sent_at", null);
    verifyQuery = attempt.quote_responded_at_snapshot
      ? verifyQuery.eq("quote_responded_at", attempt.quote_responded_at_snapshot)
      : verifyQuery.is("quote_responded_at", null);
    const { data: verified, error: verifyError } = await verifyQuery.select("id").maybeSingle();
    if (verifyError) throw verifyError;

    if (!verified) {
      const { data: concurrentAssignment, error: concurrentError } = await db
        .from("assignments")
        .select("payment_status, payhere_payment_attempt_id")
        .eq("id", assignment.id)
        .maybeSingle();
      if (concurrentError) throw concurrentError;
      if (concurrentAssignment?.payment_status === "verified" && concurrentAssignment.payhere_payment_attempt_id === attempt.id) {
        const { error: idempotentError } = await db.from("payhere_payment_attempts")
          .update({ applied_at: attempt.applied_at || now, review_reason: null })
          .eq("id", attempt.id)
          .eq("status", "paid");
        if (idempotentError) throw idempotentError;
        return new Response("Payment already verified.", { status: 200 });
      }
      const { error: reviewError } = await db.from("payhere_payment_attempts").update({
        review_reason: "Payment was received, but the assignment changed before it could be applied."
      }).eq("id", attempt.id);
      if (reviewError) throw reviewError;
      if (firstPaidNotification) await recordAssignmentActivity(db, {
        assignmentId: assignment.id,
        actor: "system",
        visibility: "admin",
        eventType: "payhere_payment_review_required",
        summary: "A successful PayHere payment could not be applied because the assignment state changed concurrently."
      });
      return new Response("Payment recorded for manual reconciliation.", { status: 200 });
    }

    const { data: applied, error: applyError } = await db.from("payhere_payment_attempts")
      .update({ applied_at: now, review_reason: null })
      .eq("id", attempt.id)
      .eq("status", "paid")
      .select("id")
      .maybeSingle();
    if (applyError) throw applyError;
    if (!applied) throw new Error("Verified PayHere transaction changed before it was marked as applied.");

    await recordAssignmentActivity(db, {
      assignmentId: assignment.id,
      actor: "system",
      visibility: "both",
      eventType: "payhere_payment_verified",
      summary: "PayHere confirmed and automatically verified the online payment."
    });
    if (assignment.payment_status === "submitted" && assignment.payment_reference) {
      await recordAssignmentActivity(db, {
        assignmentId: assignment.id,
        actor: "system",
        visibility: "admin",
        eventType: "possible_duplicate_payment",
        summary: "PayHere verified an online payment while bank-transfer details were awaiting review. Check for a possible duplicate payment."
      });
    }

    return new Response("Payment verified.", { status: 200 });
  } catch (error) {
    console.error("PayHere notification failed:", error instanceof Error ? error.message : error);
    return new Response("Unable to process payment notification.", { status: 500 });
  }
}
