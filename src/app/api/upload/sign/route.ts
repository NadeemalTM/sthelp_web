import { NextRequest, NextResponse } from "next/server";
import { apiError, apiRouteError, logApiError } from "@/lib/api";
import { ACCEPTED_SUPPORT_TYPES, FIVE_MB, TWENTY_FIVE_MB } from "@/lib/constants";
import { requireAdminApi } from "@/lib/auth";
import { randomPathSegment, safeFileName } from "@/lib/security";
import { getServiceSupabase } from "@/lib/supabase-server";
import { findUnresolvedPayHereAttempt } from "@/lib/payhere-payment-state";

const previewTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const paymentTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const portfolioImageTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

async function ensureBucket(
  db: ReturnType<typeof getServiceSupabase>,
  bucket: string,
  options: { public: boolean; fileSizeLimit: number; allowedMimeTypes: string[] }
) {
  const { data, error } = await db.storage.getBucket(bucket);
  if (data) return data;

  const notFound = error && ("status" in error ? (error as { status?: number }).status === 404 : false);
  if (!error || notFound) {
    const { data: created, error: createError } = await db.storage.createBucket(bucket, {
      public: options.public,
      fileSizeLimit: options.fileSizeLimit,
      allowedMimeTypes: options.allowedMimeTypes
    });
    if (createError || !created) throw createError || new Error(`Could not create storage bucket "${bucket}".`);
    return created;
  }

  throw error;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const scope = String(body.scope || "");
    const name = safeFileName(String(body.name || "file"));
    const mimeType = String(body.mimeType || "application/octet-stream");
    const size = Number(body.size || 0);
    const db = getServiceSupabase();

    if (!Number.isFinite(size) || size <= 0) return apiError("The selected file is empty.");

    let path = "";
    let bucket = "assignment-files";
    let limit = FIVE_MB;
    let allowed = ACCEPTED_SUPPORT_TYPES;

    if (scope === "client-support") {
      const token = String(body.token || "");
      const { data: link } = await db.from("client_links").select("id").eq("token", token).maybeSingle();
      if (!link) return apiError("Invalid client link.", 401);
      const { data: existing } = await db.from("assignments").select("id").eq("client_link_id", link.id).maybeSingle();
      if (existing) return apiError("Requirements have already been submitted.", 409);
      path = `clients/${link.id}/support/${randomPathSegment()}-${name}`;
    } else if (scope === "client-payment") {
      const token = String(body.token || "");
      const { data: link } = await db.from("client_links").select("id").eq("token", token).maybeSingle();
      if (!link) return apiError("Invalid client link.", 401);
      const { data: assignment } = await db.from("assignments").select("id, status, quote_status, quoted_amount, payment_status, payment_reference, payment_note, payhere_payment_attempt_id").eq("client_link_id", link.id).maybeSingle();
      if (!assignment) return apiError("Assignment not found.", 404);
      if (assignment.status === "cancelled") return apiError("This assignment has been cancelled and cannot accept payment.", 409);
      if (assignment.quote_status !== "accepted") return apiError("Accept the final quotation before uploading a payment slip.", 409);
      if (!Number.isFinite(Number(assignment.quoted_amount)) || Number(assignment.quoted_amount) <= 0) return apiError("A valid final quotation is required before payment.", 409);
      if (assignment.payment_status === "verified") return apiError("This payment has already been verified.", 409);
      const unresolvedPayHere = await findUnresolvedPayHereAttempt(db, assignment.id);
      if (unresolvedPayHere?.status === "paid") {
        return apiError("PayHere has reported a successful payment that StHelp is reviewing. Do not upload another payment.", 409);
      }
      if (unresolvedPayHere?.status === "pending") {
        return apiError("PayHere is still processing an earlier transaction. Contact StHelp before switching to bank transfer.", 409);
      }
      let payHerePending = assignment.payment_status === "submitted"
        && !assignment.payment_reference
        && String(assignment.payment_note || "").startsWith("PayHere checkout");
      if (assignment.payhere_payment_attempt_id) {
        try {
          const { data: activeAttempt, error: attemptError } = await db
            .from("payhere_payment_attempts")
            .select("status, expires_at")
            .eq("id", assignment.payhere_payment_attempt_id)
            .maybeSingle();
          if (!attemptError && activeAttempt) {
            payHerePending = Boolean(activeAttempt)
              && (activeAttempt?.status === "pending"
                || (activeAttempt?.status === "initiated" && new Date(activeAttempt.expires_at).getTime() > Date.now()));
            if (activeAttempt?.status === "paid") {
              return apiError("PayHere has reported a successful payment that StHelp is reviewing. Do not submit another payment.", 409);
            }
            if (activeAttempt?.status === "charged_back") {
              return apiError("The PayHere transaction has a chargeback under review. Contact StHelp before submitting another payment.", 409);
            }
          }
        } catch {
          // Table or attempt may not exist yet
        }
      }
      if (payHerePending) {
        return apiError("PayHere checkout is already in progress. Contact StHelp before switching to bank transfer.", 409);
      }
      allowed = paymentTypes;
      path = `assignments/${assignment.id}/payment/${randomPathSegment()}-${name}`;
    } else if (scope === "admin-preview" || scope === "admin-final") {
      const session = await requireAdminApi();
      if (!session) return apiError("Admin login required.", 401);
      const assignmentId = String(body.assignmentId || "");
      const { data: assignment } = await db.from("assignments").select("id").eq("id", assignmentId).maybeSingle();
      if (!assignment) return apiError("Assignment not found.", 404);
      limit = TWENTY_FIVE_MB;
      allowed = scope === "admin-preview" ? previewTypes : ACCEPTED_SUPPORT_TYPES;
      path = `assignments/${assignment.id}/${scope === "admin-preview" ? "preview" : "final"}/${randomPathSegment()}-${name}`;
    } else if (scope === "portfolio-image" || scope === "resource-image") {
      const session = await requireAdminApi();
      if (!session) return apiError("Admin login required.", 401);
      limit = FIVE_MB;
      allowed = portfolioImageTypes;
      bucket = "portfolio-images";
      path = `${scope === "resource-image" ? "resources" : "portfolio"}/${randomPathSegment()}-${name}`;
    } else {
      return apiError("Unknown upload scope.");
    }

    if (size > limit) return apiError(`File must be ${Math.round(limit / 1024 / 1024)} MB or smaller.`);
    const allowsGenericBinary = mimeType === "application/octet-stream" && ["client-support", "admin-final"].includes(scope);
    if (!allowed.includes(mimeType) && !allowsGenericBinary) return apiError("This file type is not allowed.");

    await ensureBucket(db, bucket, {
      public: bucket === "portfolio-images",
      fileSizeLimit: limit,
      allowedMimeTypes: allowed
    });

    const { data, error } = await db.storage.from(bucket).createSignedUploadUrl(path, { upsert: false });
    if (error || !data) throw error || new Error("Could not create upload permission.");
    return NextResponse.json({ bucket, path, uploadToken: data.token });
  } catch (error) {
    logApiError(error);
    return apiRouteError(error, "Unable to prepare upload.", true);
  }
}
