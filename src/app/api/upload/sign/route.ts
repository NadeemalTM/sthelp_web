import { NextRequest, NextResponse } from "next/server";
import { apiError, apiRouteError, logApiError } from "@/lib/api";
import { ACCEPTED_SUPPORT_TYPES, FIVE_MB, TWENTY_FIVE_MB } from "@/lib/constants";
import { requireAdminApi } from "@/lib/auth";
import { randomPathSegment, safeFileName } from "@/lib/security";
import { getServiceSupabase } from "@/lib/supabase-server";

const previewTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const paymentTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const portfolioImageTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

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
      const { data: assignment } = await db.from("assignments").select("id").eq("client_link_id", link.id).maybeSingle();
      if (!assignment) return apiError("Assignment not found.", 404);
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
    } else if (scope === "portfolio-image") {
      const session = await requireAdminApi();
      if (!session) return apiError("Admin login required.", 401);
      limit = FIVE_MB;
      allowed = portfolioImageTypes;
      bucket = "portfolio-images";
      path = `portfolio/${randomPathSegment()}-${name}`;
    } else {
      return apiError("Unknown upload scope.");
    }

    if (size > limit) return apiError(`File must be ${Math.round(limit / 1024 / 1024)} MB or smaller.`);
    if (!allowed.includes(mimeType) && mimeType !== "application/octet-stream") return apiError("This file type is not allowed.");

    const { data, error } = await db.storage.from(bucket).createSignedUploadUrl(path, { upsert: false });
    if (error || !data) throw error || new Error("Could not create upload permission.");
    return NextResponse.json({ bucket, path, uploadToken: data.token });
  } catch (error) {
    logApiError(error);
    return apiRouteError(error, "Unable to prepare upload.", true);
  }
}
