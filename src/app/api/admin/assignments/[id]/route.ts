import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { apiError, apiRouteError, logApiError, optionalText, requiredText } from "@/lib/api";
import { STATUS_OPTIONS } from "@/lib/constants";
import { getServiceSupabase } from "@/lib/supabase-server";
import { recordAssignmentActivity } from "@/lib/assignment-activity";

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
    const [{ data: link }, { data: progress }, { data: comments }, { data: files }, { data: settings }, { data: activity }] = await Promise.all([
      db.from("client_links").select("id, token, client_id, client_name, phone, status, created_at").eq("id", assignment.client_link_id).maybeSingle(),
      db.from("progress_updates").select("*").eq("assignment_id", id).order("created_at", { ascending: false }),
      db.from("comments").select("*").eq("assignment_id", id).order("created_at", { ascending: true }),
      db.from("assignment_files").select("id, kind, original_name, mime_type, size_bytes, created_at").eq("assignment_id", id).order("created_at", { ascending: true }),
      db.from("settings").select("*").eq("id", 1).maybeSingle(),
      db.from("assignment_activity").select("*").eq("assignment_id", id).order("created_at", { ascending: false }).limit(100)
    ]);
    return NextResponse.json({ assignment, link, progress: progress || [], comments: comments || [], files: files || [], settings, activity: activity || [] });
  } catch (error) {
    logApiError(error);
    return apiRouteError(error, "Unable to load assignment.", true);
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
    if (body.priority !== undefined) {
      const priority = String(body.priority);
      if (!["low", "normal", "high", "urgent"].includes(priority)) return apiError("Invalid priority.");
      update.priority = priority;
    }
    if (body.assignedTo !== undefined) update.assigned_to = optionalText(body.assignedTo, 120);
    if (body.quoteNote !== undefined) update.quote_note = optionalText(body.quoteNote, 1500);

    if (body.quoteAction === "send") {
      const quotedAmount = update.quoted_amount === undefined ? assignment.quoted_amount : update.quoted_amount;
      if (quotedAmount === null || quotedAmount === undefined || !Number.isFinite(Number(quotedAmount))) return apiError("Enter a quote amount before sending it.");
      update.quote_status = "sent";
      update.quote_sent_at = new Date().toISOString();
      update.quote_responded_at = null;
    } else if (body.quoteAction !== undefined) return apiError("Invalid quote action.");

    const { data: updated, error } = await db.from("assignments").update(update).eq("id", id).select("*").single();
    if (error) throw error;
    if (update.status) {
      const linkStatus = update.status === "cancelled" || update.status === "delivered" ? "closed" : update.status === "submitted" ? "submitted" : "accepted";
      await db.from("client_links").update({ status: linkStatus }).eq("id", assignment.client_link_id);
    }
    if (update.status && update.status !== assignment.status) await recordAssignmentActivity(db, { assignmentId: id, actor: "admin", visibility: "client", eventType: "status_changed", summary: `Assignment status changed to ${String(update.status).replace(/_/g, " ")}.` });
    if (body.quoteAction === "send") await recordAssignmentActivity(db, { assignmentId: id, actor: "admin", visibility: "client", eventType: "quote_sent", summary: "A quote is ready for your review in the client portal." });
    if (update.assigned_to !== undefined || update.priority !== undefined) await recordAssignmentActivity(db, { assignmentId: id, actor: "admin", visibility: "admin", eventType: "assignment_updated", summary: "Priority or assignment owner was updated." });
    return NextResponse.json({ assignment: updated });
  } catch (error) {
    logApiError(error);
    return apiRouteError(error, "Unable to update assignment.", true);
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
      await recordAssignmentActivity(db, { assignmentId: id, actor: "admin", visibility: "client", eventType: "progress_update", summary: `Progress update: ${title}` });
      return NextResponse.json({ ok: true });
    }

    if (action === "comment") {
      const message = requiredText(body.message, "Comment", 1000);
      const { error } = await db.from("comments").insert({ assignment_id: id, author: "admin", message });
      if (error) throw error;
      await recordAssignmentActivity(db, { assignmentId: id, actor: "admin", visibility: "client", eventType: "admin_message", summary: "StHelp sent you a new message." });
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
      await recordAssignmentActivity(db, { assignmentId: id, actor: "admin", visibility: kind === "preview" ? "client" : "admin", eventType: "file_uploaded", summary: `${kind === "preview" ? "A protected preview" : "A final file"} was uploaded.` });
      return NextResponse.json({ ok: true });
    }

    if (action === "verifyPayment") {
      const { error } = await db.from("assignments").update({
        payment_status: "verified",
        payment_verified_at: new Date().toISOString(),
        download_unlocked: body.unlock !== false
      }).eq("id", id);
      if (error) throw error;
      await recordAssignmentActivity(db, { assignmentId: id, actor: "admin", visibility: "client", eventType: "payment_verified", summary: "Your payment was verified. Final downloads are now available." });
      return NextResponse.json({ ok: true });
    }

    if (action === "rejectPayment") {
      const { error } = await db.from("assignments").update({ payment_status: "rejected", download_unlocked: false }).eq("id", id);
      if (error) throw error;
      if (body.message) await db.from("comments").insert({ assignment_id: id, author: "admin", message: requiredText(body.message, "Message", 1000) });
      await recordAssignmentActivity(db, { assignmentId: id, actor: "admin", visibility: "client", eventType: "payment_rejected", summary: "Payment details need your attention. Please check the message in your portal." });
      return NextResponse.json({ ok: true });
    }

    if (action === "deleteFile") {
      const fileId = requiredText(body.fileId, "File ID", 100);
      const { data: file } = await db.from("assignment_files").select("storage_path").eq("id", fileId).eq("assignment_id", id).maybeSingle();
      if (!file) return apiError("File not found.", 404);
      await db.storage.from("assignment-files").remove([file.storage_path]);
      const { error } = await db.from("assignment_files").delete().eq("id", fileId).eq("assignment_id", id);
      if (error) throw error;
      await recordAssignmentActivity(db, { assignmentId: id, actor: "admin", visibility: "admin", eventType: "file_deleted", summary: "A stored assignment file was deleted." });
      return NextResponse.json({ ok: true });
    }

    return apiError("Unknown action.");
  } catch (error) {
    logApiError(error);
    return apiRouteError(error, "Unable to perform action.", true);
  }
}
