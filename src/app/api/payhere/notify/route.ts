import { recordAssignmentActivity } from "@/lib/assignment-activity";
import { formatPayHereAmount, getPayHereConfig, verifyPayHereNotification } from "@/lib/payhere";
import { getServiceSupabase } from "@/lib/supabase-server";

export const runtime = "nodejs";

function formValue(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === "string" ? value : "";
}

export async function POST(request: Request) {
  try {
    const config = getPayHereConfig();
    const form = await request.formData();
    const merchantId = formValue(form, "merchant_id");
    const orderId = formValue(form, "order_id");
    const paymentId = formValue(form, "payment_id");
    const amount = formValue(form, "payhere_amount");
    const currency = formValue(form, "payhere_currency").toUpperCase();
    const statusCode = formValue(form, "status_code");
    const statusMessage = formValue(form, "status_message").slice(0, 300);
    const signature = formValue(form, "md5sig");

    if (!merchantId || !orderId || !amount || !currency || !statusCode || !signature) {
      return new Response("Missing payment notification fields.", { status: 400 });
    }
    if (merchantId !== config.merchantId || !verifyPayHereNotification({
      merchantId,
      orderId,
      amount,
      currency,
      statusCode,
      signature,
      merchantSecret: config.merchantSecret
    })) {
      return new Response("Invalid payment notification signature.", { status: 400 });
    }

    const db = getServiceSupabase();
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const assignmentId = uuidPattern.test(orderId) ? orderId : orderId.slice(0, 36);
    if (!uuidPattern.test(assignmentId) || (orderId !== assignmentId && !orderId.startsWith(`${assignmentId}-`))) {
      return new Response("Unknown order format.", { status: 400 });
    }
    const { data: assignment, error } = await db
      .from("assignments")
      .select("id, quoted_amount, currency, quote_status, payment_status, payment_note")
      .eq("id", assignmentId)
      .maybeSingle();
    if (error) throw error;
    if (!assignment) return new Response("Unknown order.", { status: 404 });

    const expectedAmount = formatPayHereAmount(assignment.quoted_amount);
    const expectedCurrency = String(assignment.currency || "LKR").toUpperCase();
    if (amount !== expectedAmount || currency !== expectedCurrency) {
      return new Response("Payment amount or currency does not match the quotation.", { status: 400 });
    }

    const currentNote = String(assignment.payment_note || "");
    const activeAttempt = assignment.payment_status === "submitted"
      && currentNote.startsWith("PayHere checkout")
      && (currentNote.includes(orderId) || orderId === assignment.id);

    if (statusCode === "0") return new Response("Pending payment acknowledged.", { status: 200 });

    if (statusCode === "-1" || statusCode === "-2") {
      if (activeAttempt) {
        const label = statusCode === "-1" ? "cancelled" : "failed";
        const { data: updated, error: updateError } = await db.from("assignments").update({
          payment_status: "rejected",
          payment_reference: null,
          payment_note: `PayHere checkout ${label}.${statusMessage ? ` ${statusMessage}` : ""}`,
          download_unlocked: false
        }).eq("id", assignment.id).eq("payment_status", "submitted").eq("payment_note", currentNote).select("id").maybeSingle();
        if (updateError) throw updateError;
        if (updated) await recordAssignmentActivity(db, {
          assignmentId: assignment.id,
          actor: "system",
          visibility: "both",
          eventType: statusCode === "-1" ? "payhere_checkout_cancelled" : "payhere_payment_failed",
          summary: statusCode === "-1" ? "PayHere reported that online checkout was cancelled." : "PayHere reported that the online payment failed."
        });
      }
      return new Response("Unsuccessful payment acknowledged.", { status: 200 });
    }

    if (statusCode === "-3") {
      const { data: updated, error: updateError } = await db.from("assignments").update({
        payment_status: "rejected",
        payment_note: `PayHere reported a payment chargeback.${statusMessage ? ` ${statusMessage}` : ""}`,
        download_unlocked: false
      }).eq("id", assignment.id).eq("payment_status", "verified").select("id").maybeSingle();
      if (updateError) throw updateError;
      if (updated) await recordAssignmentActivity(db, {
        assignmentId: assignment.id,
        actor: "system",
        visibility: "both",
        eventType: "payhere_payment_charged_back",
        summary: "PayHere reported a chargeback. Final downloads were locked for admin review."
      });
      return new Response("Chargeback acknowledged.", { status: 200 });
    }

    if (statusCode !== "2") return new Response("Notification acknowledged.", { status: 200 });
    if (assignment.payment_status === "verified") return new Response("Payment already verified.", { status: 200 });
    if (assignment.quote_status !== "accepted") return new Response("The quotation is no longer accepted.", { status: 409 });

    const now = new Date().toISOString();
    const { data: verified, error: updateError } = await db.from("assignments").update({
      payment_status: "verified",
      payment_reference: paymentId || `PayHere ${orderId}`,
      payment_note: "Paid online and verified automatically through PayHere.",
      payment_submitted_at: now,
      payment_verified_at: now
    }).eq("id", assignment.id).eq("quote_status", "accepted").eq("quoted_amount", assignment.quoted_amount).neq("payment_status", "verified").select("id").maybeSingle();
    if (updateError) throw updateError;
    if (!verified) return new Response("Payment state changed before verification.", { status: 409 });

    await recordAssignmentActivity(db, {
      assignmentId: assignment.id,
      actor: "system",
      visibility: "both",
      eventType: "payhere_payment_verified",
      summary: "PayHere confirmed and verified the online payment."
    });

    return new Response("Payment verified.", { status: 200 });
  } catch (error) {
    console.error("PayHere notification failed:", error instanceof Error ? error.message : error);
    return new Response("Unable to process payment notification.", { status: 500 });
  }
}
