import { NextRequest, NextResponse } from "next/server";
import { apiError, apiRouteError, logApiError, optionalText, requiredText } from "@/lib/api";
import { getServiceSupabase } from "@/lib/supabase-server";

async function findFeedbackLink(token: string) {
  const db = getServiceSupabase();
  const { data, error } = await db.from("feedback_links").select("*").eq("token", token).maybeSingle();
  if (error) throw error;
  if (!data || data.submitted_at || (data.expires_at && new Date(data.expires_at) < new Date())) return null;
  return data;
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const link = await findFeedbackLink(token);
    if (!link) return apiError("This feedback link is invalid, expired, or has already been used.", 404);
    return NextResponse.json({ customerName: link.customer_name, university: link.university });
  } catch (error) {
    logApiError(error);
    return apiRouteError(error, "Unable to open feedback link.", true);
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const link = await findFeedbackLink(token);
    if (!link) return apiError("This feedback link is invalid, expired, or has already been used.", 404);
    const body = await request.json();
    const rating = Number(body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return apiError("Choose a rating from 1 to 5.");
    const customerName = optionalText(body.customerName, 150) || link.customer_name || "Verified Customer";
    const university = optionalText(body.university, 250) || link.university;
    const feedback = requiredText(body.feedback, "Feedback", 1500);
    const db = getServiceSupabase();
    const { error: testimonialError } = await db.from("testimonials").insert({
      feedback_link_id: link.id,
      customer_name: customerName,
      university,
      rating,
      feedback,
      is_published: false
    });
    if (testimonialError?.code === "23505") return apiError("Feedback has already been submitted through this link.", 409);
    if (testimonialError) throw testimonialError;
    const { error: updateError } = await db.from("feedback_links").update({ submitted_at: new Date().toISOString() }).eq("id", link.id).is("submitted_at", null);
    if (updateError) throw updateError;
    return NextResponse.json({ ok: true });
  } catch (error) {
    logApiError(error);
    return apiRouteError(error, "Unable to submit feedback.", true);
  }
}
