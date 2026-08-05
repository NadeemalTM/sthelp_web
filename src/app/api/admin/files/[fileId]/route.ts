import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { apiError, apiRouteError, logApiError } from "@/lib/api";
import { getServiceSupabase } from "@/lib/supabase-server";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ fileId: string }> }) {
  const session = await requireAdminApi();
  if (!session) return apiError("Admin login required.", 401);
  try {
    const { fileId } = await params;
    const db = getServiceSupabase();
    const { data: file } = await db.from("assignment_files").select("*").eq("id", fileId).maybeSingle();
    if (!file) return apiError("File not found.", 404);
    const { data, error } = await db.storage.from("assignment-files").createSignedUrl(file.storage_path, 60, { download: file.original_name });
    if (error || !data) throw error || new Error("Unable to create file link.");
    return NextResponse.redirect(data.signedUrl);
  } catch (error) {
    logApiError(error);
    return apiRouteError(error, "Unable to open file.");
  }
}
