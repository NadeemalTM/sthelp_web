import "server-only";

export function isMissingRelationError(error: any): boolean {
  if (!error) return false;
  const code = String(error.code || "");
  const message = String(error.message || "").toLowerCase();
  return (
    code === "42P01" ||
    code === "42703" ||
    code === "PGRST204" ||
    code === "PGRST205" ||
    message.includes("does not exist") ||
    message.includes("could not find the table") ||
    message.includes("could not find the column")
  );
}

/**
 * Finds provider transactions that make another payment unsafe. This checks
 * the whole assignment ledger, not only the attempt currently shown in the
 * portal, because PayHere may notify an older checkout after a retry.
 */
export async function findUnresolvedPayHereAttempt(db: any, assignmentId: string) {
  try {
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

    if (pendingResult?.error) {
      if (isMissingRelationError(pendingResult.error)) return null;
      console.warn("Unable to query pending PayHere attempts:", pendingResult.error.message || pendingResult.error);
      return null;
    }
    if (paidResult?.error) {
      if (isMissingRelationError(paidResult.error)) return null;
      console.warn("Unable to query paid PayHere attempts:", paidResult.error.message || paidResult.error);
      return null;
    }
    // A captured-but-unapplied payment always takes priority over a merely
    // pending one, even when the pending checkout was opened more recently.
    return paidResult.data || pendingResult.data || null;
  } catch (err) {
    if (isMissingRelationError(err)) return null;
    console.warn("Error checking unresolved PayHere attempt:", err);
    return null;
  }
}

