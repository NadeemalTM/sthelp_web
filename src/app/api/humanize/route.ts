import { NextRequest, NextResponse } from "next/server";
import { isRateLimited } from "@/lib/rate-limit";
import {
  analyzeTextForensics,
  runHumanizerEngine,
  TIER_CONFIG,
  type HumanizerIntensity,
  type HumanizerMode,
  type HumanizerTier
} from "@/lib/humanizer-engine";

const BUILTIN_PRO_KEYS = new Set([
  "STHELP-PRO-2026",
  "PRO-SCHOLAR",
  "STHELP-ACADEMIC-PRO"
]);

const BUILTIN_ULTRA_KEYS = new Set([
  "STHELP-ULTRA-2026",
  "ULTRA-THESIS",
  "STHELP-DISSERTATION-ULTRA"
]);

function resolveAccessKeyTier(rawKey?: string): HumanizerTier | null {
  if (!rawKey) return null;
  const normalized = rawKey.trim().toUpperCase();
  if (!normalized) return null;

  const envUltra = (process.env.HUMANIZER_ULTRA_KEYS || "")
    .split(",")
    .map((k) => k.trim().toUpperCase())
    .filter(Boolean);
  const envPro = (process.env.HUMANIZER_PRO_KEYS || "")
    .split(",")
    .map((k) => k.trim().toUpperCase())
    .filter(Boolean);

  if (BUILTIN_ULTRA_KEYS.has(normalized) || envUltra.includes(normalized)) {
    return "ultra";
  }
  if (BUILTIN_PRO_KEYS.has(normalized) || envPro.includes(normalized)) {
    return "pro";
  }
  return null;
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

    // 1. Access Code Verification Action
    if (body.action === "verify-key") {
      const unlockedTier = resolveAccessKeyTier(String(body.accessCode || ""));
      if (!unlockedTier) {
        return NextResponse.json(
          {
            valid: false,
            error: "Invalid access code. Contact StHelp on WhatsApp to receive your Academic Pro or Dissertation Ultra key."
          },
          { status: 400 }
        );
      }
      const config = TIER_CONFIG[unlockedTier];
      return NextResponse.json({
        valid: true,
        tier: unlockedTier,
        planName: config.name,
        credits: config.dailyCredits,
        maxWordsPerRun: config.maxWordsPerRun
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
    const keyTier = resolveAccessKeyTier(String(body.accessCode || ""));

    // Allow requested tier if verified via key or preview/trial mode, otherwise enforce tier config
    const activeTier: HumanizerTier =
      keyTier === "ultra"
        ? "ultra"
        : keyTier === "pro" && requestedTier !== "free"
          ? "pro"
          : requestedTier;

    const tierRules = TIER_CONFIG[activeTier];
    const wordCount = text.split(/\s+/).filter(Boolean).length;

    if (wordCount > tierRules.maxWordsPerRun) {
      return NextResponse.json(
        {
          error: `Your current plan (${tierRules.name}) supports up to ${tierRules.maxWordsPerRun.toLocaleString()} words per run. Your input has ${wordCount.toLocaleString()} words. Please upgrade to ${
            activeTier === "free" ? "Academic Pro (2,500 words/run)" : "Dissertation Ultra (10,000 words/run)"
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

    const result = runHumanizerEngine({
      text,
      tier: activeTier,
      mode,
      intensity,
      preserveCitations,
      freezeKeywords: effectiveFreezeKeywords
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Humanizer API error:", error);
    return NextResponse.json(
      { error: "Unable to process text right now. Please try again." },
      { status: 500 }
    );
  }
}

