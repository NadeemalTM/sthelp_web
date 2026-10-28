import { NextRequest, NextResponse } from "next/server";
import { apiError, apiRouteError, logApiError, optionalText, publicFile, requiredText } from "@/lib/api";
import { getPublicContent } from "@/lib/data";
import { getServiceSupabase } from "@/lib/supabase-server";
import { recordAssignmentActivity } from "@/lib/assignment-activity";
import { isPayHereEnabled } from "@/lib/payhere";
import { findDefaultPricingService, getPublicPricingServices } from "@/lib/pricing";
import { FIVE_MB } from "@/lib/constants";
import { findUnresolvedPayHereAttempt, isMissingRelationError } from "@/lib/payhere-payment-state";

async function findLink(token: string) {
  const db = getServiceSupabase();
  const { data, error } = await db.from("client_links").select("*").eq("token", token).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  if (data.expires_at && new Date(data.expires_at) < new Date()) return null;
  return data;
}

function publicPayHereAttempt(attempt: any) {
  if (!attempt) return null;
  return {
    status: attempt.status,
    method: attempt.payment_method,
    expiresAt: attempt.expires_at,
    createdAt: attempt.created_at,
    paidAt: attempt.paid_at,
    applied: Boolean(attempt.applied_at)
  };
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const link = await findLink(token);
    if (!link) return apiError("This client link is invalid or expired.", 404);

    const db = getServiceSupabase();
    const [{ settings, portfolio, testimonials }, pricingServices] = await Promise.all([
      getPublicContent(),
      getPublicPricingServices()
    ]);
    const { data: assignment, error } = await db.from("assignments").select("*").eq("client_link_id", link.id).maybeSingle();
    if (error) throw error;

    const safeLink = { token: link.token, client_id: link.client_id, client_name: link.client_name, phone: link.phone, status: link.status };
    if (!assignment) return NextResponse.json({ link: safeLink, assignment: null, settings, portfolio, testimonials, pricingServices });
    if (!assignment.calculation_details && assignment.special_instructions?.includes("<!--CALC_DETAILS:")) {
      const match = assignment.special_instructions.match(/<!--CALC_DETAILS:([\s\S]*?)-->/);
      if (match) {
        try {
          assignment.calculation_details = JSON.parse(match[1]);
        } catch {}
      }
    }
    if (assignment.special_instructions) {
      assignment.special_instructions = assignment.special_instructions.replace(/<!--CALC_DETAILS:[\s\S]*?-->/g, "").trim();
    }

    const currentPayHereQuery = assignment.payhere_payment_attempt_id
      ? db.from("payhere_payment_attempts")
        .select("id, status, payment_method, expires_at, created_at, paid_at, applied_at")
        .eq("id", assignment.payhere_payment_attempt_id)
        .maybeSingle()
      : Promise.resolve({ data: null, error: null });
    const [{ data: progress }, { data: comments }, { data: files }, { data: latestPayHereAttempt, error: latestPayHereError }, { data: currentPayHereAttempt, error: currentPayHereError }, unresolvedPayHereAttempt] = await Promise.all([
      db.from("progress_updates").select("*").eq("assignment_id", assignment.id).order("created_at", { ascending: false }),
      db.from("comments").select("*").eq("assignment_id", assignment.id).order("created_at", { ascending: true }),
      db.from("assignment_files").select("*").eq("assignment_id", assignment.id).order("created_at", { ascending: true }),
      db.from("payhere_payment_attempts")
        .select("id, status, payment_method, expires_at, created_at, paid_at, applied_at")
        .eq("assignment_id", assignment.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      currentPayHereQuery,
      findUnresolvedPayHereAttempt(db, assignment.id)
    ]);
    if (latestPayHereError && !isMissingRelationError(latestPayHereError)) {
      console.warn("Unable to load latest PayHere attempt:", latestPayHereError.message || latestPayHereError);
    }
    if (currentPayHereError && !isMissingRelationError(currentPayHereError)) {
      console.warn("Unable to load current PayHere attempt:", currentPayHereError.message || currentPayHereError);
    }

    const effectivePayHereAttempt = unresolvedPayHereAttempt || currentPayHereAttempt;

    return NextResponse.json({
      link: safeLink,
      assignment,
      paymentOptions: { payHere: isPayHereEnabled() },
      payHerePayment: {
        current: publicPayHereAttempt(effectivePayHereAttempt),
        latest: publicPayHereAttempt(latestPayHereAttempt)
      },
      settings,
      portfolio,
      testimonials,
      pricingServices,
      progress: progress || [],
      comments: comments || [],
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

      // Admin-created legacy portal links still submit the old service label. Map
      // those labels to a managed service slug without ever accepting a price
      // from the browser.
      const legacyServiceSlugs: Record<string, string> = {
        "Computing / Software Development": "web-development",
        "Business Report": "report-writing",
        "Research Guidance": "research",
        "Presentation / PowerPoint": "presentation",
        "Document Formatting": "custom",
        "Excel / Data Analysis": "data-analysis",
        "Other Academic Support": "custom"
      };
      const submittedSlug = typeof body.pricingServiceSlug === "string"
        ? body.pricingServiceSlug.trim().toLowerCase()
        : "";
      const legacyServiceType = typeof body.serviceType === "string" ? body.serviceType.trim() : "";
      const pricingServiceSlug = submittedSlug || legacyServiceSlugs[legacyServiceType] || "";
      if (!pricingServiceSlug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(pricingServiceSlug)) {
        return apiError("Choose a valid support service.");
      }

      const { data: pricingRow, error: pricingError } = await db
        .from("pricing_services")
        .select("id, slug, name, starting_price, currency, is_custom")
        .eq("slug", pricingServiceSlug)
        .eq("is_published", true)
        .eq("is_deleted", false)
        .maybeSingle();
      const pricingErrorRecord = pricingError as { code?: unknown; message?: unknown; details?: unknown; hint?: unknown } | null;
      const pricingErrorText = pricingErrorRecord
        ? `${String(pricingErrorRecord.message || "")} ${String(pricingErrorRecord.details || "")} ${String(pricingErrorRecord.hint || "")}`.toLowerCase()
        : "";
      const pricingTableUnavailable = Boolean(pricingErrorRecord)
        && ["42P01", "PGRST205"].includes(String(pricingErrorRecord?.code || ""))
        && pricingErrorText.includes("pricing_services");
      if (pricingError && !pricingTableUnavailable) throw pricingError;

      const pricingService = pricingRow || (pricingTableUnavailable ? findDefaultPricingService(pricingServiceSlug) : null);
      if (!pricingService) return apiError("That support service is no longer available. Please choose another service.", 409);

      const serviceName = requiredText(pricingService.name, "Support service", 120);
      const rawStartingPrice = pricingService.starting_price;
      const numericStartingPrice = rawStartingPrice === null || rawStartingPrice === undefined
        ? null
        : Number(rawStartingPrice);
      const startingPrice = numericStartingPrice !== null && Number.isFinite(numericStartingPrice) && numericStartingPrice > 0
        ? numericStartingPrice
        : null;
      if (!pricingService.is_custom && startingPrice === null) {
        return apiError("This service does not have a valid starting price. Please choose another service.", 409);
      }
      const currency = String(pricingService.currency || "LKR").trim().toUpperCase();
      if (!/^[A-Z]{3}$/.test(currency)) return apiError("This service has an invalid currency configuration.", 409);

      // Parse calculated payment value from calculator process if present
      const calcDetails = body.calculationDetails && typeof body.calculationDetails === "object" ? body.calculationDetails : null;
      let calculatedPaymentValue: number | null = null;
      if (calcDetails) {
        const rawNum = Number(String(calcDetails.rawMin || calcDetails.minPrice || "").replace(/[^\d.]/g, ""));
        if (Number.isFinite(rawNum) && rawNum > 0) {
          calculatedPaymentValue = rawNum;
        }
      }

      const assignedPaymentValue = calculatedPaymentValue ?? startingPrice;

      const assignmentInsert: Record<string, unknown> = {
        client_link_id: link.id,
        student_name: requiredText(body.studentName, "Full name", 150),
        contact_number: requiredText(body.contactNumber, "Contact number", 50),
        email: optionalText(body.email, 200),
        university: requiredText(body.university, "University", 250),
        programme: optionalText(body.programme, 250),
        module_name: optionalText(body.moduleName, 250),
        assignment_title: requiredText(body.assignmentTitle, "Assignment title", 300),
        service_type: serviceName,
        academic_level: optionalText(body.academicLevel, 100),
        deadline: deadline.toISOString(),
        is_group: isGroup,
        group_members: groupMembers,
        description: requiredText(body.description, "Task description", 10000),
        special_instructions: (optionalText(body.specialInstructions, 5000) || "") + (calcDetails ? `\n\n<!--CALC_DETAILS:${JSON.stringify(calcDetails)}-->` : "") || null,
        quoted_amount: assignedPaymentValue,
        currency,
        status: "submitted",
        progress: 0
      };
      if (calcDetails) {
        assignmentInsert.calculation_details = calcDetails;
      }

      const pricingSnapshot: Record<string, unknown> = {
        pricing_service_id: pricingService.id || null,
        pricing_name_snapshot: serviceName,
        starting_price_snapshot: assignedPaymentValue,
        starting_currency_snapshot: currency
      };
      let insertResult = await db.from("assignments").insert({
        ...assignmentInsert,
        ...pricingSnapshot
      }).select("id").single();

      if (insertResult.error) {
        const insertError = insertResult.error as { code?: unknown; message?: unknown; details?: unknown; hint?: unknown };
        const insertErrorText = `${String(insertError.message || "")} ${String(insertError.details || "")} ${String(insertError.hint || "")}`.toLowerCase();
        const retryInsert: Record<string, unknown> = { ...assignmentInsert, ...pricingSnapshot };
        delete retryInsert.calculation_details;
        if (["pricing_service_id", "starting_price_snapshot"].some((col) => insertErrorText.includes(col))) {
          delete retryInsert.pricing_service_id;
          delete retryInsert.pricing_name_snapshot;
          delete retryInsert.starting_price_snapshot;
          delete retryInsert.starting_currency_snapshot;
        }
        const missingPricingColumns = ["PGRST204", "42703"].includes(String(insertError.code || ""))
          && ["pricing_service_id", "pricing_name_snapshot", "starting_price_snapshot", "starting_currency_snapshot", "calculation_details"].some((column) => insertErrorText.includes(column));
        if (missingPricingColumns) {
          insertResult = await db.from("assignments").insert(retryInsert).select("id").single();
        }
      }

      const { data: created, error } = insertResult;
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
      await recordAssignmentActivity(db, { assignmentId: created.id, actor: "client", visibility: "both", eventType: "request_submitted", summary: "You submitted the assignment requirements." });
      if (calcDetails) {
        const estimateSummary = calcDetails.estimateRange || (calcDetails.minPrice && calcDetails.maxPrice ? `LKR ${calcDetails.minPrice} – ${calcDetails.maxPrice}` : "");
        await recordAssignmentActivity(db, {
          assignmentId: created.id,
          actor: "system",
          visibility: "both",
          eventType: "calculator_estimate",
          summary: `Website Calculator Estimate: ${estimateSummary || "Estimate recorded"} • ${calcDetails.categoryLabel || "Area"}: ${calcDetails.scope || ""}`.trim()
        });
      }
      if (supportFiles.length) {
        await recordAssignmentActivity(db, {
          assignmentId: created.id,
          actor: "client",
          visibility: "both",
          eventType: "support_files_submitted",
          summary: `You submitted ${supportFiles.length} support document${supportFiles.length === 1 ? "" : "s"}.`
        });
      }
      return NextResponse.json({ ok: true });
    }

    if (!assignment) return apiError("Submit your assignment requirements first.", 404);

    if (action === "updateDetails") {
      if (["completed", "delivered", "cancelled"].includes(assignment.status)) {
        return apiError("These details can no longer be edited at the current assignment stage.", 409);
      }

      const deadline = new Date(String(body.deadline || ""));
      if (Number.isNaN(deadline.getTime())) return apiError("Enter a valid deadline.");
      const email = optionalText(body.email, 200);
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return apiError("Enter a valid email address.");

      const fields: Array<[string, string | null, string]> = [
        ["student_name", requiredText(body.studentName, "Full name", 150), "name"],
        ["contact_number", requiredText(body.contactNumber, "Contact number", 50), "contact number"],
        ["email", email, "email"],
        ["university", requiredText(body.university, "University", 250), "university"],
        ["programme", optionalText(body.programme, 250), "programme"],
        ["module_name", optionalText(body.moduleName, 250), "module"],
        ["assignment_title", requiredText(body.assignmentTitle, "Assignment title", 300), "assignment title"],
        ["deadline", deadline.toISOString(), "deadline"],
        ["description", requiredText(body.description, "Task description", 10000), "task description"],
        ["special_instructions", optionalText(body.specialInstructions, 5000), "special instructions"]
      ];
      const changedFields = fields
        .filter(([key, value]) => key === "deadline"
          ? new Date(String(assignment[key])).getTime() !== new Date(String(value)).getTime()
          : String(assignment[key] ?? "") !== String(value ?? ""));
      const changed = changedFields.map(([, , label]) => label);

      if (!changed.length) return NextResponse.json({ ok: true, unchanged: true });

      const quoteSensitiveFields = new Set(["programme", "module_name", "assignment_title", "deadline", "description", "special_instructions"]);
      const scopeChanged = changedFields.some(([key]) => quoteSensitiveFields.has(key));
      if (scopeChanged && ["submitted", "verified"].includes(String(assignment.payment_status))) {
        return apiError("Requirements that affect the quote cannot be changed while payment is awaiting verification or has been verified. Please send StHelp a message instead.", 409);
      }
      const unresolvedPayHere = scopeChanged
        ? await findUnresolvedPayHereAttempt(db, assignment.id)
        : null;
      if (unresolvedPayHere) {
        return apiError("Requirements that affect the quote cannot be changed while PayHere is processing or StHelp is reviewing a payment. Please message StHelp instead.", 409);
      }
      if (scopeChanged && assignment.payhere_payment_attempt_id) {
        try {
          const { data: currentAttempt, error: attemptError } = await db
            .from("payhere_payment_attempts")
            .select("status, expires_at, review_reason")
            .eq("id", assignment.payhere_payment_attempt_id)
            .maybeSingle();
          if (!attemptError && currentAttempt) {
            const checkoutActive = Boolean(currentAttempt)
              && (currentAttempt?.status === "pending"
                || (currentAttempt?.status === "initiated" && new Date(currentAttempt.expires_at).getTime() > Date.now()));
            const paidNeedsReview = currentAttempt?.status === "paid";
            const chargebackNeedsReview = currentAttempt?.status === "charged_back";
            if (checkoutActive || paidNeedsReview || chargebackNeedsReview) {
              return apiError("Requirements that affect the quote cannot be changed during an active PayHere checkout or payment review. Please try again later or message StHelp.", 409);
            }
          }
        } catch {
          // Table or attempt may not exist yet
        }
      }

      const update: Record<string, unknown> = Object.fromEntries(fields.map(([key, value]) => [key, value]));
      if (scopeChanged && assignment.quote_status !== "draft") {
        update.quote_status = "draft";
        update.quote_sent_at = null;
        update.quote_responded_at = null;
      }
      let updateQuery = db.from("assignments").update(update).eq("id", assignment.id);
      if (scopeChanged) {
        updateQuery = updateQuery
          .eq("payment_status", assignment.payment_status)
          .eq("quote_status", assignment.quote_status);
        if ("payhere_payment_attempt_id" in assignment) {
          updateQuery = assignment.payhere_payment_attempt_id
            ? updateQuery.eq("payhere_payment_attempt_id", assignment.payhere_payment_attempt_id)
            : updateQuery.is("payhere_payment_attempt_id", null);
        }
      }
      const { data: savedAssignment, error } = await updateQuery.select("id").maybeSingle();
      if (error) throw error;
      if (!savedAssignment) return apiError("The assignment changed while you were editing it. Refresh the portal and try again.", 409);
      const { error: linkError } = await db.from("client_links").update({
        client_name: update.student_name,
        phone: update.contact_number
      }).eq("id", link.id);
      if (linkError) throw linkError;
      await recordAssignmentActivity(db, {
        assignmentId: assignment.id,
        actor: "client",
        visibility: "both",
        eventType: "client_details_updated",
        summary: `You updated: ${changed.join(", ")}.`
      });
      if (scopeChanged && assignment.quote_status !== "draft") {
        await recordAssignmentActivity(db, {
          assignmentId: assignment.id,
          actor: "system",
          visibility: "both",
          eventType: "quote_review_required",
          summary: "Requirement changes need an updated quotation from StHelp before payment."
        });
      }
      return NextResponse.json({ ok: true });
    }

    if (action === "comment") {
      const message = requiredText(body.message, "Comment", 1000);
      const { error } = await db.from("comments").insert({ assignment_id: assignment.id, author: "client", message });
      if (error) throw error;
      await recordAssignmentActivity(db, { assignmentId: assignment.id, actor: "client", visibility: "both", eventType: "client_message", summary: "You sent a message to StHelp." });
      return NextResponse.json({ ok: true });
    }

    if (action === "payment") {
      if (assignment.status === "cancelled") return apiError("This assignment has been cancelled and cannot accept payment.", 409);
      if (assignment.payment_status === "verified") return apiError("This payment has already been verified.", 409);
      if (assignment.quote_status !== "accepted") return apiError("Accept the final quotation before submitting payment.", 409);
      const quotedAmount = Number(assignment.quoted_amount);
      if (!Number.isFinite(quotedAmount) || quotedAmount <= 0) return apiError("A valid final quotation is required before payment.", 409);
      const unresolvedPayHere = await findUnresolvedPayHereAttempt(db, assignment.id);
      if (unresolvedPayHere?.status === "paid") {
        return apiError("PayHere has reported a successful payment that StHelp is reviewing. Do not submit another payment.", 409);
      }
      if (unresolvedPayHere?.status === "pending") {
        return apiError("PayHere is still processing an earlier transaction. Contact StHelp before switching to bank transfer.", 409);
      }
      let payHerePending = assignment.payment_status === "submitted"
        && !assignment.payment_reference
        && String(assignment.payment_note || "").startsWith("PayHere checkout");
      if (assignment.payhere_payment_attempt_id) {
        try {
          const { data: activeAttempt, error: attemptError } = await db
            .from("payhere_payment_attempts")
            .select("status, expires_at")
            .eq("id", assignment.payhere_payment_attempt_id)
            .maybeSingle();
          if (!attemptError && activeAttempt) {
            payHerePending = Boolean(activeAttempt)
              && (activeAttempt?.status === "pending"
                || (activeAttempt?.status === "initiated" && new Date(activeAttempt.expires_at).getTime() > Date.now()));
            if (activeAttempt?.status === "paid") {
              return apiError("PayHere has reported a successful payment that StHelp is reviewing. Do not submit another payment.", 409);
            }
            if (activeAttempt?.status === "charged_back") {
              return apiError("The PayHere transaction has a chargeback under review. Contact StHelp before submitting another payment.", 409);
            }
          }
        } catch {
          // Table or attempt may not exist yet
        }
      }
      if (payHerePending) return apiError("PayHere checkout is already in progress. Contact StHelp before switching to bank transfer.", 409);
      const reference = requiredText(body.reference, "Payment reference", 250);
      const file = body.proofFile;
      if (!file) return apiError("Upload the bank payment slip before submitting for verification.");
      const path = String(file.storagePath || "");
      if (!path.startsWith(`assignments/${assignment.id}/payment/`)) return apiError("Invalid payment proof path.");
      const originalName = requiredText(file.originalName, "File name", 255);
      const mimeType = requiredText(file.mimeType, "File type", 150);
      if (!["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(mimeType)) return apiError("Payment slip must be a PDF or supported image.");
      const sizeBytes = Number(file.sizeBytes);
      if (!Number.isFinite(sizeBytes) || sizeBytes <= 0 || sizeBytes > FIVE_MB) return apiError("Payment slip must be 5 MB or smaller.");
      const update: Record<string, unknown> = {
        payment_reference: reference,
        payment_note: optionalText(body.note, 1500),
        payment_status: "submitted",
        payment_submitted_at: new Date().toISOString()
      };
      if ("payhere_payment_attempt_id" in assignment) {
        update.payhere_payment_attempt_id = null;
      }
      const { data: proofRecord, error: fileError } = await db.from("assignment_files").insert({
        assignment_id: assignment.id,
        kind: "payment_proof",
        storage_path: path,
        original_name: originalName,
        mime_type: mimeType,
        size_bytes: sizeBytes
      }).select("id").single();
      if (fileError) throw fileError;

      let paymentQuery = db
        .from("assignments")
        .update(update)
        .eq("id", assignment.id)
        .eq("status", assignment.status)
        .eq("quote_status", "accepted")
        .eq("quoted_amount", assignment.quoted_amount)
        .eq("payment_status", assignment.payment_status);
      if ("payhere_payment_attempt_id" in assignment) {
        paymentQuery = assignment.payhere_payment_attempt_id
          ? paymentQuery.eq("payhere_payment_attempt_id", assignment.payhere_payment_attempt_id)
          : paymentQuery.is("payhere_payment_attempt_id", null);
      }
      const { data: paymentLocked, error } = await paymentQuery.select("id").maybeSingle();
      if (error || !paymentLocked) {
        await db.from("assignment_files").delete().eq("id", proofRecord.id);
        await db.storage.from("assignment-files").remove([path]);
        if (error) throw error;
        return apiError("The quote or payment state changed. Refresh the portal before submitting again.", 409);
      }
      await recordAssignmentActivity(db, { assignmentId: assignment.id, actor: "client", visibility: "both", eventType: "payment_submitted", summary: "You submitted payment details for verification." });
      await recordAssignmentActivity(db, { assignmentId: assignment.id, actor: "client", visibility: "both", eventType: "payment_proof_submitted", summary: "You uploaded a payment proof document." });
      return NextResponse.json({ ok: true });
    }

    if (action === "quoteResponse") {
      if (assignment.status === "cancelled") return apiError("This assignment has been cancelled and the quote can no longer be accepted.", 409);
      if (assignment.quote_status !== "sent") return apiError("There is no pending quote to respond to.", 409);
      if (!assignment.quote_sent_at || body.quoteSentAt !== assignment.quote_sent_at) return apiError("This quotation has changed. Refresh the portal and review the latest quote.", 409);
      if (typeof body.accepted !== "boolean") return apiError("Choose whether to accept or decline the quote.");
      const accepted = body.accepted;
      if (accepted) {
        const quotedAmount = Number(assignment.quoted_amount);
        if (!Number.isFinite(quotedAmount) || quotedAmount <= 0) return apiError("This quotation is not valid. Please ask StHelp to send it again.", 409);
      }
      const now = new Date().toISOString();
      const update = accepted
        ? { quote_status: "accepted", quote_responded_at: now, status: assignment.status === "submitted" ? "accepted" : assignment.status, accepted_at: assignment.accepted_at || now }
        : { quote_status: "declined", quote_responded_at: now };
      const { data: responseSaved, error } = await db
        .from("assignments")
        .update(update)
        .eq("id", assignment.id)
        .eq("quote_status", "sent")
        .eq("quote_sent_at", assignment.quote_sent_at)
        .eq("quoted_amount", assignment.quoted_amount)
        .select("id")
        .maybeSingle();
      if (error) throw error;
      if (!responseSaved) return apiError("This quotation changed before your response was saved. Refresh the portal and review it again.", 409);
      if (accepted) await db.from("client_links").update({ status: "accepted" }).eq("id", link.id);
      await recordAssignmentActivity(db, { assignmentId: assignment.id, actor: "client", visibility: "both", eventType: accepted ? "quote_accepted" : "quote_declined", summary: accepted ? "The client accepted the quote." : "The client declined the quote." });
      return NextResponse.json({ ok: true });
    }

    if (action === "feedback") {
      if (assignment.payment_status !== "verified" || !assignment.download_unlocked) return apiError("Feedback becomes available after verified payment and final delivery.", 403);
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
      await recordAssignmentActivity(db, { assignmentId: assignment.id, actor: "client", visibility: "both", eventType: "feedback_submitted", summary: "You submitted feedback for review." });
      return NextResponse.json({ ok: true });
    }

    return apiError("Unknown action.");
  } catch (error) {
    logApiError(error);
    return apiRouteError(error, "Unable to process request.", true);
  }
}
