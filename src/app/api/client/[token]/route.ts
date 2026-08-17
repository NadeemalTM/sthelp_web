import { NextRequest, NextResponse } from "next/server";
import { apiError, apiRouteError, logApiError, optionalText, publicFile, requiredText } from "@/lib/api";
import { getPublicContent } from "@/lib/data";
import { getServiceSupabase } from "@/lib/supabase-server";
import { recordAssignmentActivity } from "@/lib/assignment-activity";

async function findLink(token: string) {
  const db = getServiceSupabase();
  const { data, error } = await db.from("client_links").select("*").eq("token", token).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  if (data.expires_at && new Date(data.expires_at) < new Date()) return null;
  return data;
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const link = await findLink(token);
    if (!link) return apiError("This client link is invalid or expired.", 404);

    const db = getServiceSupabase();
    const { settings, portfolio, testimonials } = await getPublicContent();
    const { data: assignment, error } = await db.from("assignments").select("*").eq("client_link_id", link.id).maybeSingle();
    if (error) throw error;

    const safeLink = { client_id: link.client_id, client_name: link.client_name, phone: link.phone, status: link.status };
    if (!assignment) return NextResponse.json({ link: safeLink, assignment: null, settings, portfolio, testimonials });

    const [{ data: progress }, { data: comments }, { data: files }, { data: activity }] = await Promise.all([
      db.from("progress_updates").select("*").eq("assignment_id", assignment.id).order("created_at", { ascending: false }),
      db.from("comments").select("*").eq("assignment_id", assignment.id).order("created_at", { ascending: true }),
      db.from("assignment_files").select("*").eq("assignment_id", assignment.id).order("created_at", { ascending: true }),
      db.from("assignment_activity").select("*").eq("assignment_id", assignment.id).in("visibility", ["client", "both"]).order("created_at", { ascending: false }).limit(20)
    ]);

    return NextResponse.json({
      link: safeLink,
      assignment,
      settings,
      portfolio,
      testimonials,
      progress: progress || [],
      comments: comments || [],
      activity: activity || [],
      files: (files || []).map(publicFile)
    });
  } catch (error) {
    logApiError(error);
    return apiRouteError(error, "Unable to load portal.", true);
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const link = await findLink(token);
    if (!link) return apiError("This client link is invalid or expired.", 404);
    const body = await request.json();
    const action = String(body.action || "");
    const db = getServiceSupabase();
    const { data: assignment } = await db.from("assignments").select("*").eq("client_link_id", link.id).maybeSingle();

    if (action === "submit") {
      if (assignment) return apiError("Requirements have already been submitted.", 409);
      const deadline = new Date(String(body.deadline || ""));
      if (Number.isNaN(deadline.getTime())) return apiError("Enter a valid deadline.");
      const isGroup = Boolean(body.isGroup);
      const groupMembers = isGroup ? Number(body.groupMembers) : null;
      if (isGroup && (groupMembers === null || !Number.isInteger(groupMembers) || groupMembers < 2 || groupMembers > 100)) return apiError("Enter a valid number of group members.");

      const { data: created, error } = await db.from("assignments").insert({
        client_link_id: link.id,
        student_name: requiredText(body.studentName, "Full name", 150),
        contact_number: requiredText(body.contactNumber, "Contact number", 50),
        email: optionalText(body.email, 200),
        university: requiredText(body.university, "University", 250),
        programme: optionalText(body.programme, 250),
        module_name: optionalText(body.moduleName, 250),
        assignment_title: requiredText(body.assignmentTitle, "Assignment title", 300),
        service_type: requiredText(body.serviceType, "Support type", 200),
        academic_level: optionalText(body.academicLevel, 100),
        deadline: deadline.toISOString(),
        is_group: isGroup,
        group_members: groupMembers,
        description: requiredText(body.description, "Task description", 10000),
        special_instructions: optionalText(body.specialInstructions, 5000),
        status: "submitted",
        progress: 0
      }).select("id").single();
      if (error || !created) throw error || new Error("Unable to create assignment.");

      const supportFiles = Array.isArray(body.supportFiles)
        ? body.supportFiles
        : body.supportFile
          ? [body.supportFile]
          : [];
      for (const file of supportFiles) {
        const path = String(file?.storagePath || "");
        if (!path.startsWith(`clients/${link.id}/support/`)) return apiError("Invalid support file path.");
        const { error: fileError } = await db.from("assignment_files").insert({
          assignment_id: created.id,
          kind: "support",
          storage_path: path,
          original_name: requiredText(file.originalName, "File name", 255),
          mime_type: requiredText(file.mimeType, "File type", 150),
          size_bytes: Number(file.sizeBytes)
        });
        if (fileError) throw fileError;
      }
      await db.from("client_links").update({ status: "submitted", client_name: body.studentName, phone: body.contactNumber }).eq("id", link.id);
      await recordAssignmentActivity(db, { assignmentId: created.id, actor: "client", visibility: "admin", eventType: "request_submitted", summary: "A new assignment request was submitted." });
      return NextResponse.json({ ok: true });
    }

    if (!assignment) return apiError("Submit your assignment requirements first.", 404);

    if (action === "comment") {
      const message = requiredText(body.message, "Comment", 1000);
      const { error } = await db.from("comments").insert({ assignment_id: assignment.id, author: "client", message });
      if (error) throw error;
      await recordAssignmentActivity(db, { assignmentId: assignment.id, actor: "client", visibility: "admin", eventType: "client_message", summary: "The client sent a new message." });
      return NextResponse.json({ ok: true });
    }

    if (action === "payment") {
      const reference = requiredText(body.reference, "Payment reference", 250);
      const update = {
        payment_reference: reference,
        payment_note: optionalText(body.note, 1500),
        payment_status: "submitted",
        payment_submitted_at: new Date().toISOString()
      };
      const { error } = await db.from("assignments").update(update).eq("id", assignment.id);
      if (error) throw error;

      const file = body.proofFile;
      if (file) {
        const path = String(file.storagePath || "");
        if (!path.startsWith(`assignments/${assignment.id}/payment/`)) return apiError("Invalid payment proof path.");
        const { error: fileError } = await db.from("assignment_files").insert({
          assignment_id: assignment.id,
          kind: "payment_proof",
          storage_path: path,
          original_name: requiredText(file.originalName, "File name", 255),
          mime_type: requiredText(file.mimeType, "File type", 150),
          size_bytes: Number(file.sizeBytes)
        });
        if (fileError) throw fileError;
      }
      await recordAssignmentActivity(db, { assignmentId: assignment.id, actor: "client", visibility: "admin", eventType: "payment_submitted", summary: "The client submitted payment details for verification." });
      return NextResponse.json({ ok: true });
    }

    if (action === "quoteResponse") {
      if (assignment.quote_status !== "sent") return apiError("There is no pending quote to respond to.", 409);
      const accepted = Boolean(body.accepted);
      const now = new Date().toISOString();
      const update = accepted
        ? { quote_status: "accepted", quote_responded_at: now, status: "accepted", accepted_at: assignment.accepted_at || now }
        : { quote_status: "declined", quote_responded_at: now };
      const { error } = await db.from("assignments").update(update).eq("id", assignment.id);
      if (error) throw error;
      if (accepted) await db.from("client_links").update({ status: "accepted" }).eq("id", link.id);
      await recordAssignmentActivity(db, { assignmentId: assignment.id, actor: "client", visibility: "both", eventType: accepted ? "quote_accepted" : "quote_declined", summary: accepted ? "The client accepted the quote." : "The client declined the quote." });
      return NextResponse.json({ ok: true });
    }

    if (action === "feedback") {
      if (!assignment.download_unlocked) return apiError("Feedback becomes available after final delivery.", 403);
      if (assignment.feedback_submitted) return apiError("Feedback has already been submitted.", 409);
      const rating = Number(body.rating);
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) return apiError("Choose a rating from 1 to 5.");
      const feedback = requiredText(body.feedback, "Feedback", 1500);
      const { error } = await db.from("testimonials").insert({
        assignment_id: assignment.id,
        customer_name: assignment.student_name,
        university: assignment.university,
        rating,
        feedback,
        is_published: false
      });
      if (error) throw error;
      await db.from("assignments").update({ feedback_submitted: true }).eq("id", assignment.id);
      await recordAssignmentActivity(db, { assignmentId: assignment.id, actor: "client", visibility: "admin", eventType: "feedback_submitted", summary: "The client submitted feedback for review." });
      return NextResponse.json({ ok: true });
    }

    return apiError("Unknown action.");
  } catch (error) {
    logApiError(error);
    return apiRouteError(error, "Unable to process request.", true);
  }
}
