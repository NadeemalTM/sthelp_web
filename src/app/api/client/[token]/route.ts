import { NextRequest, NextResponse } from "next/server";
import { apiError, optionalText, publicFile, requiredText } from "@/lib/api";
import { getPublicContent } from "@/lib/data";
import { getServiceSupabase } from "@/lib/supabase-server";

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

    const [{ data: progress }, { data: comments }, { data: files }] = await Promise.all([
      db.from("progress_updates").select("*").eq("assignment_id", assignment.id).order("created_at", { ascending: false }),
      db.from("comments").select("*").eq("assignment_id", assignment.id).order("created_at", { ascending: true }),
      db.from("assignment_files").select("*").eq("assignment_id", assignment.id).order("created_at", { ascending: true })
    ]);

    return NextResponse.json({
      link: safeLink,
      assignment,
      settings,
      portfolio,
      testimonials,
      progress: progress || [],
      comments: comments || [],
      files: (files || []).map(publicFile)
    });
  } catch (error) {
    console.error(error);
    return apiError(error instanceof Error ? error.message : "Unable to load portal.", 500);
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

      const file = body.supportFile;
      if (file) {
        const path = String(file.storagePath || "");
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
      return NextResponse.json({ ok: true });
    }

    if (!assignment) return apiError("Submit your assignment requirements first.", 404);

    if (action === "comment") {
      const message = requiredText(body.message, "Comment", 1000);
      const { error } = await db.from("comments").insert({ assignment_id: assignment.id, author: "client", message });
      if (error) throw error;
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
      return NextResponse.json({ ok: true });
    }

    return apiError("Unknown action.");
  } catch (error) {
    console.error(error);
    return apiError(error instanceof Error ? error.message : "Unable to process request.", 500);
  }
}
