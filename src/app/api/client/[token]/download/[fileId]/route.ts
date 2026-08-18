import { NextRequest, NextResponse } from "next/server";
import { apiError, apiRouteError, logApiError } from "@/lib/api";
import { getServiceSupabase } from "@/lib/supabase-server";
import { recordAssignmentActivity } from "@/lib/assignment-activity";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ token: string; fileId: string }> }) {
  try {
    const { token, fileId } = await params;
    const db = getServiceSupabase();
    const { data: link } = await db.from("client_links").select("id, expires_at").eq("token", token).maybeSingle();
    if (!link || (link.expires_at && new Date(link.expires_at) < new Date())) return apiError("Invalid or expired client link.", 401);
    const { data: assignment } = await db.from("assignments").select("id, download_unlocked, payment_status").eq("client_link_id", link.id).maybeSingle();
    if (!assignment) return apiError("Assignment not found.", 404);
    const { data: file } = await db.from("assignment_files").select("*").eq("id", fileId).eq("assignment_id", assignment.id).in("kind", ["support", "payment_proof", "final"]).maybeSingle();
    if (!file) return apiError("File not found.", 404);
    if (file.kind === "final" && (!assignment.download_unlocked || assignment.payment_status !== "verified")) return apiError("This download is still locked.", 403);
    const { data, error } = await db.storage.from("assignment-files").createSignedUrl(file.storage_path, 60, { download: file.original_name });
    if (error || !data) throw error || new Error("Unable to create download.");
    await recordAssignmentActivity(db, {
      assignmentId: assignment.id,
      actor: "client",
      visibility: "both",
      eventType: "file_downloaded",
      summary: `You downloaded ${file.original_name}.`
    });
    return NextResponse.redirect(data.signedUrl);
  } catch (error) {
    logApiError(error);
    return apiRouteError(error, "Unable to download this file.");
  }
}
