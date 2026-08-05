import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { apiError, optionalText, requiredText } from "@/lib/api";
import { STATUS_OPTIONS } from "@/lib/constants";
import { getServiceSupabase } from "@/lib/supabase-server";

async function assignmentExists(id: string) {
  const db = getServiceSupabase();
  const { data, error } = await db.from("assignments").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminApi();
  if (!session) return apiError("Admin login required.", 401);
  try {
    const { id } = await params;
    const db = getServiceSupabase();
    const assignment = await assignmentExists(id);
    if (!assignment) return apiError("Assignment not found.", 404);
    const [{ data: link }, { data: progress }, { data: comments }, { data: files }, { data: settings }] = await Promise.all([
      db.from("client_links").select("id, token, client_id, client_name, phone, status, created_at").eq("id", assignment.client_link_id).maybeSingle(),
      db.from("progress_updates").select("*").eq("assignment_id", id).order("created_at", { ascending: false }),
      db.from("comments").select("*").eq("assignment_id", id).order("created_at", { ascending: true }),
      db.from("assignment_files").select("id, kind, original_name, mime_type, size_bytes, created_at").eq("assignment_id", id).order("created_at", { ascending: true }),
      db.from("settings").select("*").eq("id", 1).maybeSingle()
    ]);
    return NextResponse.json({ assignment, link, progress: progress || [], comments: comments || [], files: files || [], settings });
  } catch (error) {
    console.error(error);
    return apiError("Unable to load assignment.", 500);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminApi();
  if (!session) return apiError("Admin login required.", 401);
  try {
    const { id } = await params;
    const body = await request.json();
    const assignment = await assignmentExists(id);
    if (!assignment) return apiError("Assignment not found.", 404);
    const db = getServiceSupabase();
    const update: Record<string, unknown> = {};

    if (body.status !== undefined) {
      const status = String(body.status);
      if (!STATUS_OPTIONS.some(([value]) => value === status)) return apiError("Invalid status.");
      update.status = status;
      if (status === "accepted" && !assignment.accepted_at) update.accepted_at = new Date().toISOString();
      if (["completed", "delivered"].includes(status) && !assignment.completed_at) update.completed_at = new Date().toISOString();
    }
    if (body.progress !== undefined) {
      const progress = Number(body.progress);
      if (!Number.isInteger(progress) || progress < 0 || progress > 100) return apiError("Progress must be between 0 and 100.");
      update.progress = progress;
    }
    if (body.quotedAmount !== undefined) {
      if (body.quotedAmount === "" || body.quotedAmount === null) update.quoted_amount = null;
      else {
        const amount = Number(body.quotedAmount);
        if (!Number.isFinite(amount) || amount < 0) return apiError("Enter a valid amount.");
        update.quoted_amount = amount;
      }
    }
    if (body.currency !== undefined) update.currency = requiredText(body.currency, "Currency", 10).toUpperCase();
    if (body.finalMessage !== undefined) update.final_message = optionalText(body.finalMessage, 3000);
    if (body.downloadUnlocked !== undefined) update.download_unlocked = Boolean(body.downloadUnlocked);

    const { data: updated, error } = await db.from("assignments").update(update).eq("id", id).select("*").single();
    if (error) throw error;
    if (update.status) {
      const linkStatus = update.status === "cancelled" || update.status === "delivered" ? "closed" : update.status === "submitted" ? "submitted" : "accepted";
      await db.from("client_links").update({ status: linkStatus }).eq("id", assignment.client_link_id);
    }
    return NextResponse.json({ assignment: updated });
  } catch (error) {
    console.error(error);
    return apiError(error instanceof Error ? error.message : "Unable to update assignment.", 500);
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminApi();
  if (!session) return apiError("Admin login required.", 401);
  try {
    const { id } = await params;
    const body = await request.json();
    const action = String(body.action || "");
    const assignment = await assignmentExists(id);
    if (!assignment) return apiError("Assignment not found.", 404);
    const db = getServiceSupabase();

    if (action === "progress") {
      const progress = Number(body.progress);
      if (!Number.isInteger(progress) || progress < 0 || progress > 100) return apiError("Progress must be between 0 and 100.");
      const title = requiredText(body.title, "Update title", 200);
      const details = optionalText(body.details, 3000);
      const status = body.status ? String(body.status) : assignment.status;
      if (!STATUS_OPTIONS.some(([value]) => value === status)) return apiError("Invalid status.");
      const { error } = await db.from("progress_updates").insert({ assignment_id: id, title, details, progress });
      if (error) throw error;
      await db.from("assignments").update({ progress, status }).eq("id", id);
      if (status !== "submitted") await db.from("client_links").update({ status: "accepted" }).eq("id", assignment.client_link_id);
      return NextResponse.json({ ok: true });
    }

    if (action === "comment") {
      const message = requiredText(body.message, "Comment", 1000);
      const { error } = await db.from("comments").insert({ assignment_id: id, author: "admin", message });
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    if (action === "registerFile") {
      const kind = String(body.kind || "");
      if (!['preview','final'].includes(kind)) return apiError("Invalid file kind.");
      const file = body.file;
      const path = String(file?.storagePath || "");
      const expected = `assignments/${id}/${kind}/`;
      if (!path.startsWith(expected)) return apiError("Invalid uploaded file path.");
      const { error } = await db.from("assignment_files").insert({
        assignment_id: id,
        kind,
        storage_path: path,
        original_name: requiredText(file.originalName, "File name", 255),
        mime_type: requiredText(file.mimeType, "File type", 150),
        size_bytes: Number(file.sizeBytes)
      });
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    if (action === "verifyPayment") {
      const { error } = await db.from("assignments").update({
        payment_status: "verified",
        payment_verified_at: new Date().toISOString(),
        download_unlocked: body.unlock !== false
      }).eq("id", id);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    if (action === "rejectPayment") {
      const { error } = await db.from("assignments").update({ payment_status: "rejected", download_unlocked: false }).eq("id", id);
      if (error) throw error;
      if (body.message) await db.from("comments").insert({ assignment_id: id, author: "admin", message: requiredText(body.message, "Message", 1000) });
      return NextResponse.json({ ok: true });
    }

    if (action === "deleteFile") {
      const fileId = requiredText(body.fileId, "File ID", 100);
      const { data: file } = await db.from("assignment_files").select("storage_path").eq("id", fileId).eq("assignment_id", id).maybeSingle();
      if (!file) return apiError("File not found.", 404);
      await db.storage.from("assignment-files").remove([file.storage_path]);
      const { error } = await db.from("assignment_files").delete().eq("id", fileId).eq("assignment_id", id);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    return apiError("Unknown action.");
  } catch (error) {
    console.error(error);
    return apiError(error instanceof Error ? error.message : "Unable to perform action.", 500);
  }
}
