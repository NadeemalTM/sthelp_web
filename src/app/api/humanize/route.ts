import { NextRequest, NextResponse } from "next/server";
import { isRateLimited } from "@/lib/rate-limit";
import {
  analyzeTextForensics,
  runHumanizerEngine,
  type HumanizerIntensity,
  type HumanizerMode,
  type HumanizerTier
} from "@/lib/humanizer-engine";
import {
  getHumanizerPlans,
  recordSubscriberUsage,
  verifyAndResolveSubscriberKey
} from "@/lib/humanizer-admin-store";

    export async function GET() {
      try {
        const plans = await getHumanizerPlans();
        return NextResponse.json({ plans });
      } catch {
        return NextResponse.json({ error: "Unable to load plans." }, { status: 500 });
      }
    }

    export async function POST(request: NextRequest) {
      try {
        if (isRateLimited(request, "humanizer-api", 45, 60_000)) {
          return NextResponse.json(
            { error: "Too many requests. Please wait a moment and try again." },
            { status: 429 }
          );
        }

        const body = await request.json().catch(() => null);
        if (!body || typeof body !== "object") {
          return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
        }

        const plans = await getHumanizerPlans();

        // 1. Access Code Verification Action
        if (body.action === "verify-key") {
            const check = await verifyAndResolveSubscriberKey(String(body.accessCode || ""));
            if (!check.valid || !check.plan) {
              return NextResponse.json(
                {
                  valid: false,
            error:
                    check.error ||
                    "Invalid access code. Contact StHelp on WhatsApp to receive your Academic Pro or Dissertation Ultra key."
                },
                { status: 400 }
              );
            }

            const sub = check.subscriber;
            const plan = check.plan;
            const maxWords = sub ? sub.maxWordsPerRun : plan.maxWordsPerRun;
            const totalDaily = sub ? sub.dailyCredits : plan.dailyCredits;
            const remainingCredits = sub ? Math.max(0, sub.dailyCredits - sub.creditsUsedToday) : plan.dailyCredits;

            return NextResponse.json({
              valid: true,
        tier: plan.tier,
              planName: plan.name,
              customerName: sub?.customerName || null,
              credits: remainingCredits,
              dailyCredits: totalDaily,
              maxWordsPerRun: maxWords,
              expiresAt: sub?.expiresAt || null
            });
          }

          const text = String(body.text || "").trim();
          if (!text) {
            return NextResponse.json({ error: "Please enter or paste text to process." }, { status: 400 });
          }

          if (text.length > 85_000) {
            return NextResponse.json(
              { error: "Text exceeds maximum single-pass character limit (85,000 characters)." },
              { status: 400 }
            );
          }

          const freezeKeywords: string[] = Array.isArray(body.freezeKeywords)
            ? body.freezeKeywords.map((w: unknown) => String(w || "").trim()).filter(Boolean).slice(0, 25)
            : [];

          // 2. Forensics / AI Scan Only Action
          if (body.action === "analyze") {
            const forensics = analyzeTextForensics(text, freezeKeywords);
            return NextResponse.json({ forensics });
          }

          // 3. Full Humanize Action
          const requestedTier = (["free", "pro", "ultra"].includes(body.tier) ? body.tier : "free") as HumanizerTier;
          const rawAccessCode = String(body.accessCode || "").trim();
          const keyCheck = rawAccessCode ? await verifyAndResolveSubscriberKey(rawAccessCode) : null;

          if (rawAccessCode && keyCheck && !keyCheck.valid) {
            return NextResponse.json({ error: keyCheck.error || "Invalid or expired access code." }, { status: 403 });
          }

          const activeTier: HumanizerTier =
          keyCheck?.valid && keyCheck.plan
            ? keyCheck.plan.tier
            : requestedTier;

          const tierRules = plans[activeTier] || plans.free;
          const effectiveMaxWords = keyCheck?.subscriber
            ? keyCheck.subscriber.maxWordsPerRun
            : tierRules.maxWordsPerRun;

          const wordCount = text.split(/\s+/).filter(Boolean).length;

            if (wordCount > effectiveMaxWords) {
              return NextResponse.json(
                {
          error: `Your current plan (${tierRules.name}) supports up to ${effectiveMaxWords.toLocaleString()} words per run. Your input has ${wordCount.toLocaleString()} words. Please upgrade to ${activeTier === "free"
                      ? `${plans.pro.name} (${plans.pro.maxWordsPerRun.toLocaleString()} words/run)`
                      : `${plans.ultra.name} (${plans.ultra.maxWordsPerRun.toLocaleString()} words/run)`
                    } or shorten the text.`
                },
                { status: 400 }
              );
            }

            const rawMode = String(body.mode || "academic") as HumanizerMode;
            const mode: HumanizerMode = tierRules.allowedModes.includes(rawMode) ? rawMode : "academic";

            const rawIntensity = String(body.intensity || "balanced") as HumanizerIntensity;
            const intensity: HumanizerIntensity = tierRules.allowedIntensities.includes(rawIntensity)
              ? rawIntensity
              : "balanced";

            const preserveCitations = body.preserveCitations !== false;
            const effectiveFreezeKeywords = tierRules.allowFreezeKeywords ? freezeKeywords : [];
            const variationSeed = typeof body.variationSeed === "number" ? body.variationSeed : 0;

            const result = runHumanizerEngine({
              text,
              tier: activeTier,
              mode,
              intensity,
              preserveCitations,
              freezeKeywords: effectiveFreezeKeywords,
              variationSeed
            });

            if (rawAccessCode && keyCheck?.valid) {
              await recordSubscriberUsage(rawAccessCode, wordCount);
            }

            return NextResponse.json(result);
          } catch (error) {
            console.error("Humanizer API error:", error);
            return NextResponse.json(
              { error: "Unable to process text right now. Please try again." },
              { status: 500 }
            );
          }
        }
