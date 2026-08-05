import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { getServiceSupabase } from "@/lib/supabase-server";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ token: string; fileId: string }> }) {
  try {
    const { token, fileId } = await params;
    const db = getServiceSupabase();
    const { data: link } = await db.from("client_links").select("id").eq("token", token).maybeSingle();
    if (!link) return apiError("Invalid client link.", 401);
    const { data: assignment } = await db.from("assignments").select("id, download_unlocked, payment_status").eq("client_link_id", link.id).maybeSingle();
    if (!assignment) return apiError("Assignment not found.", 404);
    if (!assignment.download_unlocked || assignment.payment_status !== "verified") return apiError("This download is still locked.", 403);
    const { data: file } = await db.from("assignment_files").select("*").eq("id", fileId).eq("assignment_id", assignment.id).eq("kind", "final").maybeSingle();
    if (!file) return apiError("Final file not found.", 404);
    const { data, error } = await db.storage.from("assignment-files").createSignedUrl(file.storage_path, 60, { download: file.original_name });
    if (error || !data) throw error || new Error("Unable to create download.");
    return NextResponse.redirect(data.signedUrl);
  } catch (error) {
    console.error(error);
    return apiError("Unable to download this file.", 500);
  }
}
