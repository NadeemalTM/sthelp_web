import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { apiError, apiRouteError, logApiError, requiredText } from "@/lib/api";
import { getServiceSupabase } from "@/lib/supabase-server";

const CONFIRM_PHRASE = "DELETE ALL ASSIGNMENTS";
const STORAGE_BUCKET = "assignment-files";
const STORAGE_CHUNK_SIZE = 100;
const DELETE_CHUNK_SIZE = 100;

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) chunks.push(items.slice(index, index + size));
  return chunks;
}

export async function POST(request: NextRequest) {
  const session = await requireAdminApi();
  if (!session) return apiError("Admin login required.", 401);

  try {
    const body = await request.json().catch(() => ({}));
    const enabled = Boolean(body.enabled);
    const phrase = requiredText(body.confirmPhrase, "Confirmation phrase", 100).trim().toUpperCase();
    if (!enabled || phrase !== CONFIRM_PHRASE) {
      return apiError("Confirmation phrase does not match.");
    }

    const db = getServiceSupabase();
    const [{ data: assignments, error: assignmentsError }, { data: links, error: linksError }, { data: files, error: filesError }] = await Promise.all([
      db.from("assignments").select("id"),
      db.from("client_links").select("id"),
      db.from("assignment_files").select("storage_path")
    ]);

    if (assignmentsError) throw assignmentsError;
    if (linksError) throw linksError;
    if (filesError) throw filesError;

    const assignmentIds = (assignments || []).map((assignment) => assignment.id).filter(Boolean);
    const clientLinkIds = (links || []).map((link) => link.id).filter(Boolean);
    const storagePaths = (files || []).map((file) => file.storage_path).filter(Boolean);

    for (const paths of chunk(storagePaths, STORAGE_CHUNK_SIZE)) {
      const { error } = await db.storage.from(STORAGE_BUCKET).remove(paths);
      if (error) throw error;
    }

    for (const ids of chunk(clientLinkIds, DELETE_CHUNK_SIZE)) {
      const { error } = await db.from("client_links").delete().in("id", ids);
      if (error) throw error;
    }

    return NextResponse.json({
      ok: true,
      deletedAssignments: assignmentIds.length,
      deletedClientLinks: clientLinkIds.length,
      deletedFiles: storagePaths.length
    });
  } catch (error) {
    logApiError(error);
    return apiRouteError(error, "Unable to clear assignment data.", true);
  }
}
