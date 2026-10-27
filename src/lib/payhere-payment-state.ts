import "server-only";

/**
 * Finds provider transactions that make another payment unsafe. This checks
 * the whole assignment ledger, not only the attempt currently shown in the
 * portal, because PayHere may notify an older checkout after a retry.
 */
export async function findUnresolvedPayHereAttempt(db: any, assignmentId: string) {
  const [pendingResult, paidResult] = await Promise.all([
    db.from("payhere_payment_attempts")
      .select("id, status, expires_at, review_reason, applied_at, created_at")
      .eq("assignment_id", assignmentId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    db.from("payhere_payment_attempts")
      .select("id, status, expires_at, review_reason, applied_at, created_at")
      .eq("assignment_id", assignmentId)
      .eq("status", "paid")
      .is("applied_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
  ]);

  if (pendingResult.error) throw pendingResult.error;
  if (paidResult.error) throw paidResult.error;
  // A captured-but-unapplied payment always takes priority over a merely
  // pending one, even when the pending checkout was opened more recently.
  return paidResult.data || pendingResult.data || null;
}
