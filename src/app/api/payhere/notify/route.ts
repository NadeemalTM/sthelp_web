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

    // PayHere status 2 is the only successful payment state. Other signed states
    // are acknowledged without changing the assignment's verified status.
    if (statusCode !== "2") return new Response("Notification acknowledged.", { status: 200 });

    const db = getServiceSupabase();
    const { data: assignment, error } = await db
      .from("assignments")
      .select("id, quoted_amount, currency, payment_status")
      .eq("id", orderId)
      .maybeSingle();
    if (error) throw error;
    if (!assignment) return new Response("Unknown order.", { status: 404 });

    const expectedAmount = formatPayHereAmount(assignment.quoted_amount);
    const expectedCurrency = String(assignment.currency || "LKR").toUpperCase();
    if (amount !== expectedAmount || currency !== expectedCurrency) {
      return new Response("Payment amount or currency does not match the quotation.", { status: 400 });
    }
    if (assignment.payment_status === "verified") return new Response("Payment already verified.", { status: 200 });

    const now = new Date().toISOString();
    const { error: updateError } = await db.from("assignments").update({
      payment_status: "verified",
      payment_reference: paymentId || `PayHere ${orderId}`,
      payment_note: "Paid online and verified automatically through PayHere.",
      payment_submitted_at: now,
      payment_verified_at: now
    }).eq("id", assignment.id).neq("payment_status", "verified");
    if (updateError) throw updateError;

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
