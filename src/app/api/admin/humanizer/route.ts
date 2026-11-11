import { NextRequest, NextResponse } from "next/server";
import { apiError, apiRouteError, logApiError } from "@/lib/api";
import { requireAdminApi } from "@/lib/auth";
import {
  deleteHumanizerSubscriber,
  getHumanizerPlans,
  getHumanizerSubscribers,
  updateHumanizerPlan,
  upsertHumanizerSubscriber,
  type SubscriberStatus
} from "@/lib/humanizer-admin-store";
import type { HumanizerIntensity, HumanizerMode, HumanizerTier } from "@/lib/humanizer-engine";

export async function GET() {
  const session = await requireAdminApi();
  if (!session) return apiError("Admin login required.", 401);

  try {
    const [plans, subscribers] = await Promise.all([
      getHumanizerPlans(),
      getHumanizerSubscribers()
    ]);

    return NextResponse.json({
      plans,
      subscribers
    });
  } catch (error) {
    logApiError(error);
    return apiRouteError(error, "Unable to load Humanizer admin data.", true);
  }
}

export async function POST(request: NextRequest) {
  const session = await requireAdminApi();
  if (!session) return apiError("Admin login required.", 401);

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const customerName = String(body.customerName || "").trim();
    const accessCode = String(body.accessCode || "").trim().toUpperCase();
    const tier = body.tier === "ultra" ? "ultra" : "pro";

    if (!customerName) return apiError("Customer / student name is required.");
    if (!accessCode || accessCode.length < 4) {
      return apiError("Access code must be at least 4 characters.");
    }

    const subscriber = await upsertHumanizerSubscriber({
      customerName,
      customerEmail: String(body.customerEmail || ""),
      customerWhatsapp: String(body.customerWhatsapp || ""),
      university: String(body.university || ""),
      tier,
      accessCode,
      status: (["active", "paused", "expired", "revoked"].includes(String(body.status))
        ? body.status
        : "active") as SubscriberStatus,
      dailyCredits: Number(body.dailyCredits) || undefined,
      maxWordsPerRun: Number(body.maxWordsPerRun) || undefined,
      amountPaidLkr: body.amountPaidLkr !== undefined ? Number(body.amountPaidLkr) : undefined,
      paymentReference: String(body.paymentReference || ""),
      startsAt: body.startsAt ? String(body.startsAt) : undefined,
      expiresAt: body.expiresAt ? String(body.expiresAt) : null,
      notes: String(body.notes || "")
    });

    return NextResponse.json({ subscriber }, { status: 201 });
  } catch (error) {
    logApiError(error);
    return apiError(error instanceof Error ? error.message : "Unable to create subscriber.", 400);
  }
}

export async function PATCH(request: NextRequest) {
  const session = await requireAdminApi();
  if (!session) return apiError("Admin login required.", 401);

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const type = String(body.type || "");

    if (type === "plan") {
      const tier = String(body.tier || "") as HumanizerTier;
      if (!["free", "pro", "ultra"].includes(tier)) {
        return apiError("Invalid plan tier.");
      }

      const features = Array.isArray(body.features)
        ? body.features.map((f) => String(f || "").trim()).filter(Boolean)
        : undefined;

      const allowedModes = Array.isArray(body.allowedModes)
        ? (body.allowedModes.map(String) as HumanizerMode[])
        : undefined;

      const allowedIntensities = Array.isArray(body.allowedIntensities)
        ? (body.allowedIntensities.map(String) as HumanizerIntensity[])
        : undefined;

      const plan = await updateHumanizerPlan(tier, {
        name: body.name !== undefined ? String(body.name) : undefined,
        badge: body.badge !== undefined ? String(body.badge) : undefined,
        tagline: body.tagline !== undefined ? String(body.tagline) : undefined,
        priceLkr: body.priceLkr !== undefined ? String(body.priceLkr) : undefined,
        priceNumeric: body.priceNumeric !== undefined ? Number(body.priceNumeric) : undefined,
        billingPeriod: body.billingPeriod !== undefined ? String(body.billingPeriod) : undefined,
        singlePassLkr: body.singlePassLkr !== undefined ? String(body.singlePassLkr) : undefined,
        dailyCredits: body.dailyCredits !== undefined ? Number(body.dailyCredits) : undefined,
        maxWordsPerRun: body.maxWordsPerRun !== undefined ? Number(body.maxWordsPerRun) : undefined,
        monthlyWordsLabel: body.monthlyWordsLabel !== undefined ? String(body.monthlyWordsLabel) : undefined,
        features,
        ctaLabel: body.ctaLabel !== undefined ? String(body.ctaLabel) : undefined,
        isFeatured: body.isFeatured !== undefined ? Boolean(body.isFeatured) : undefined,
        allowedModes,
        allowedIntensities,
        allowFreezeKeywords: body.allowFreezeKeywords !== undefined ? Boolean(body.allowFreezeKeywords) : undefined,
        allowSentenceAlternatives:
          body.allowSentenceAlternatives !== undefined ? Boolean(body.allowSentenceAlternatives) : undefined,
        allowReportDownload: body.allowReportDownload !== undefined ? Boolean(body.allowReportDownload) : undefined
      });

      return NextResponse.json({ plan });
    }

    if (type === "subscriber") {
      const id = String(body.id || "").trim();
      const customerName = String(body.customerName || "").trim();
      const accessCode = String(body.accessCode || "").trim().toUpperCase();
      const tier = body.tier === "ultra" ? "ultra" : "pro";

      if (!id) return apiError("Subscriber ID is required.");
      if (!customerName) return apiError("Customer name is required.");
      if (!accessCode) return apiError("Access code is required.");

      const subscriber = await upsertHumanizerSubscriber({
        id,
        customerName,
        customerEmail: body.customerEmail !== undefined ? String(body.customerEmail) : undefined,
        customerWhatsapp: body.customerWhatsapp !== undefined ? String(body.customerWhatsapp) : undefined,
        university: body.university !== undefined ? String(body.university) : undefined,
        tier,
        accessCode,
        status: (["active", "paused", "expired", "revoked"].includes(String(body.status))
          ? body.status
          : "active") as SubscriberStatus,
        dailyCredits: body.dailyCredits !== undefined ? Number(body.dailyCredits) : undefined,
        maxWordsPerRun: body.maxWordsPerRun !== undefined ? Number(body.maxWordsPerRun) : undefined,
        creditsUsedToday: body.creditsUsedToday !== undefined ? Number(body.creditsUsedToday) : undefined,
        amountPaidLkr: body.amountPaidLkr !== undefined ? Number(body.amountPaidLkr) : undefined,
        paymentReference: body.paymentReference !== undefined ? String(body.paymentReference) : undefined,
        startsAt: body.startsAt ? String(body.startsAt) : undefined,
        expiresAt: body.expiresAt ? String(body.expiresAt) : null,
        notes: body.notes !== undefined ? String(body.notes) : undefined
      });

      return NextResponse.json({ subscriber });
    }

    return apiError("Unsupported update type.");
  } catch (error) {
    logApiError(error);
    return apiError(error instanceof Error ? error.message : "Unable to update Humanizer record.", 400);
  }
}

export async function DELETE(request: NextRequest) {
  const session = await requireAdminApi();
  if (!session) return apiError("Admin login required.", 401);

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const id = String(body.id || "").trim();
    if (!id) return apiError("Subscriber ID is required.");

    await deleteHumanizerSubscriber(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    logApiError(error);
    return apiRouteError(error, "Unable to delete subscriber.", true);
  }
}

