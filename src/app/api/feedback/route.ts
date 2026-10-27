import { NextRequest, NextResponse } from "next/server";
import { apiError, apiRouteError, logApiError, optionalText, requiredText } from "@/lib/api";
import { getServiceSupabase, isSupabaseConfigured } from "@/lib/supabase-server";
import { demoTestimonials } from "@/lib/data";

// Simple in-memory rate limiter per IP to prevent spam attacks
const submissionWindowMs = 15 * 60 * 1000; // 15 minutes
const maxSubmissionsPerWindow = 6;
const ipSubmissions = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = ipSubmissions.get(ip) || [];
  const recent = timestamps.filter((t) => now - t < submissionWindowMs);
  if (recent.length >= maxSubmissionsPerWindow) {
    ipSubmissions.set(ip, recent);
    return true;
  }
  recent.push(now);
  ipSubmissions.set(ip, recent);
  return false;
}

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ratingFilter = searchParams.get("rating");
    const limit = Math.min(Number(searchParams.get("limit")) || 30, 100);

    if (!isSupabaseConfigured()) {
      let filtered = [...demoTestimonials];
      if (ratingFilter) {
        filtered = filtered.filter((t) => t.rating === Number(ratingFilter));
      }
      return NextResponse.json({
        testimonials: filtered.slice(0, limit),
        stats: {
          total: demoTestimonials.length,
          average: 5.0,
          breakdown: { 5: demoTestimonials.length, 4: 0, 3: 0, 2: 0, 1: 0 }
        }
      });
    }

    const db = getServiceSupabase();
    let query = db
      .from("testimonials")
      .select("id, customer_name, university, rating, feedback, created_at")
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (ratingFilter && [1, 2, 3, 4, 5].includes(Number(ratingFilter))) {
      query = query.eq("rating", Number(ratingFilter));
    }

    const { data: testimonials, error } = await query.limit(limit);
    if (error) throw error;

    // Aggregate statistics across all published testimonials
    const { data: allPublished, error: statsError } = await db
      .from("testimonials")
      .select("rating")
      .eq("is_published", true);

    const breakdown: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sum = 0;
    const totalCount = allPublished?.length || 0;

    if (!statsError && allPublished) {
      for (const row of allPublished) {
        const r = row.rating || 5;
        if (breakdown[r] !== undefined) breakdown[r]++;
        sum += r;
      }
    }

    const average = totalCount > 0 ? Number((sum / totalCount).toFixed(1)) : 5.0;

    return NextResponse.json({
      testimonials: testimonials || [],
      stats: {
        total: totalCount,
        average,
        breakdown
      }
    });
  } catch (error) {
    logApiError(error);
    return apiRouteError(error, "Unable to load feedback.", true);
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    if (isRateLimited(ip)) {
      return apiError("Too many feedback submissions. Please wait a few minutes before trying again.", 429);
    }

    const body = await request.json().catch(() => ({}));

    // Honeypot check: Bots usually fill in hidden fields
    if (body.hpWebsite || body.hpCompany) {
      // Return synthetic success so bots think their submission succeeded
      return NextResponse.json({
        ok: true,
        message: "Thank you for your feedback! It will appear on the site after moderation."
      });
    }

    // Minimum submission time check (under 2 seconds is almost certainly a bot)
    if (body.formStartTime && Number.isFinite(Number(body.formStartTime))) {
      const elapsed = Date.now() - Number(body.formStartTime);
      if (elapsed > 0 && elapsed < 1800) {
        return NextResponse.json({
          ok: true,
          message: "Thank you for your feedback! It will appear on the site after moderation."
        });
      }
    }

    const rating = Number(body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return apiError("Please select a rating between 1 and 5 stars.");
    }

    const rawCustomerName = optionalText(body.customerName, 100);
    const customerName = rawCustomerName || "Verified Student";
    const university = optionalText(body.university, 150);
    const serviceCategory = optionalText(body.serviceCategory, 80);
    const rawFeedback = requiredText(body.feedback, "Feedback", 1500);

    if (rawFeedback.length < 10) {
      return apiError("Please write at least 10 characters of feedback.");
    }

    // If a service category was picked and isn't already prefixed, format it cleanly
    let formattedFeedback = rawFeedback;
    if (serviceCategory && !rawFeedback.toLowerCase().startsWith(`[${serviceCategory.toLowerCase()}]`)) {
      formattedFeedback = `[${serviceCategory}] ${rawFeedback}`;
    }

    const db = getServiceSupabase();
    const { error: insertError } = await db.from("testimonials").insert({
      customer_name: customerName,
      university: university || null,
      rating,
      feedback: formattedFeedback,
      is_published: false // Strictly false: requires admin review before publishing
    });

    if (insertError) throw insertError;

    return NextResponse.json({
      ok: true,
      message: "Thank you! Your feedback has been received and will be displayed once verified by our team."
    });
  } catch (error) {
    logApiError(error);
    return apiRouteError(error, "Unable to submit feedback at this time.", true);
  }
}
