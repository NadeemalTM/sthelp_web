import { NextRequest, NextResponse } from "next/server";
import { apiError, apiRouteError, logApiError } from "@/lib/api";
import { recordAssignmentActivity } from "@/lib/assignment-activity";
import { isProtectedPreviewPath, storeProtectedPreview } from "@/lib/preview-watermark";
import { getServiceSupabase } from "@/lib/supabase-server";

export const runtime = "nodejs";

const REVIEW_STATUSES = ["client_review", "revision", "completed", "delivered"];

export async function GET(_request: NextRequest, { params }: { params: Promise<{ token: string; fileId: string }> }) {
  try {
    const { token, fileId } = await params;
    const db = getServiceSupabase();
    const { data: link } = await db.from("client_links").select("id, client_id, expires_at").eq("token", token).maybeSingle();
    if (!link || (link.expires_at && new Date(link.expires_at) < new Date())) return apiError("Invalid or expired client link.", 401);
    const { data: assignment } = await db.from("assignments").select("id, status").eq("client_link_id", link.id).maybeSingle();
    if (!assignment) return apiError("Assignment not found.", 404);
    if (!REVIEW_STATUSES.includes(assignment.status)) return apiError("The revision preview is not available at this assignment stage.", 403);
    const { data: file } = await db.from("assignment_files").select("*").eq("id", fileId).eq("assignment_id", assignment.id).eq("kind", "preview").maybeSingle();
    if (!file) return apiError("Preview not found.", 404);
    let protectedFile = {
      storagePath: String(file.storage_path),
      mimeType: String(file.mime_type),
      sizeBytes: Number(file.size_bytes)
    };
    if (!isProtectedPreviewPath(protectedFile.storagePath)) {
      const originalPath = protectedFile.storagePath;
      protectedFile = await storeProtectedPreview(db, protectedFile, String(link.client_id || "CLIENT"));
      const { error: updateError } = await db.from("assignment_files").update({
        storage_path: protectedFile.storagePath,
        mime_type: protectedFile.mimeType,
        size_bytes: protectedFile.sizeBytes
      }).eq("id", file.id).eq("assignment_id", assignment.id);
      if (updateError) {
        await db.storage.from("assignment-files").remove([protectedFile.storagePath]);
        throw updateError;
      }
      await db.storage.from("assignment-files").remove([originalPath]);
    }
    const { data: signedPreview, error: signedUrlError } = await db.storage
      .from("assignment-files")
      .createSignedUrl(protectedFile.storagePath, 60);
    if (signedUrlError || !signedPreview) throw signedUrlError || new Error("Unable to open preview.");
    await recordAssignmentActivity(db, {
      assignmentId: assignment.id,
      actor: "client",
      visibility: "both",
      eventType: "preview_viewed",
      summary: `You viewed the protected revision preview: ${file.original_name}.`
    });

    const response = NextResponse.redirect(signedPreview.signedUrl);
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    return response;
  } catch (error) {
    logApiError(error);
    return apiRouteError(error, "Unable to open preview.");
  }
}
