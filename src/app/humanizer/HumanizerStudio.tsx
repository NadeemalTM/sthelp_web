"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Crown,
  Download,
  Eye,
  FileCheck2,
  Flame,
  KeyRound,
  Layers,
  Lock,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Unlock,
  Wand2,
  X,
  Zap
} from "lucide-react";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import {
  analyzeTextForensics,
  SAMPLE_AI_TEXTS,
  TIER_CONFIG,
  type HumanizeResult,
  type HumanizerIntensity,
  type HumanizerMode,
  type HumanizerTier,
  type TextForensics
} from "@/lib/humanizer-engine";

interface CreditStorageState {
  date: string;
  freeRemaining: number;
  proRemaining: number;
  ultraRemaining: number;
  unlockedTier: HumanizerTier;
  accessCode: string;
  usedTrialPreview: boolean;
}

const STORAGE_KEY = "sthelp_humanizer_state_v1";

function getTodayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const MODE_META: {
  key: HumanizerMode;
  label: string;
  shortDesc: string;
  badge: string;
  minTier: HumanizerTier;
}[] = [
  {
    key: "academic",
    label: "Standard Academic",
    shortDesc: "Balanced university prose for essays, reports & reflections",
    badge: "Free",
    minTier: "free"
  },
  {
    key: "concise",
    label: "Concise & Direct",
    shortDesc: "Eliminates wordy AI padding for clear, tight academic arguments",
    badge: "Free",
    minTier: "free"
  },
  {
    key: "postgrad",
    label: "Postgraduate / Master's",
    shortDesc: "Level 7 scholarly register, nuanced hedging & critical syntax",
    badge: "Pro",
    minTier: "pro"
  },
  {
    key: "lit_review",
    label: "Literature Review",
    shortDesc: "Synthesizes citations & scholarly debates without robotic transitions",
    badge: "Pro",
    minTier: "pro"
  },
  {
    key: "methodology",
    label: "Methodology & Empirical",
    shortDesc: "Precise research design, SPSS/SmartPLS & empirical reporting tone",
    badge: "Pro",
    minTier: "pro"
  },
  {
    key: "business",
    label: "Executive & MBA",
    shortDesc: "Strategic case studies, financial analysis & corporate reports",
    badge: "Pro",
    minTier: "pro"
  }
];

const INTENSITY_META: {
  key: HumanizerIntensity;
  label: string;
  desc: string;
  minTier: HumanizerTier;
}[] = [
  {
    key: "balanced",
    label: "Balanced Polish",
    desc: "Removes AI clichés while keeping original sentence structure intact",
    minTier: "free"
  },
  {
    key: "enhanced",
    label: "Enhanced Academic",
    desc: "Deep lexical replacement + clause restructuring for higher perplexity",
    minTier: "pro"
  },
  {
    key: "stealth",
    label: "Deep Stealth (Turnitin Safe)",
    desc: "Maximum burstiness injection & participial tail splitting (<10% AI target)",
    minTier: "pro"
  }
];

export function HumanizerStudio({ whatsapp }: { whatsapp: string }) {
  // Plan & Credits State
  const [activeTier, setActiveTier] = useState<HumanizerTier>("free");
  const [unlockedTier, setUnlockedTier] = useState<HumanizerTier>("free");
  const [freeCredits, setFreeCredits] = useState<number>(3);
  const [proCredits, setProCredits] = useState<number>(50);
  const [ultraCredits, setUltraCredits] = useState<number>(200);
  const [savedAccessCode, setSavedAccessCode] = useState<string>("");
  const [usedTrialPreview, setUsedTrialPreview] = useState<boolean>(false);

  // Tool Configuration State
  const [inputText, setInputText] = useState<string>(SAMPLE_AI_TEXTS[0].text);
  const [mode, setMode] = useState<HumanizerMode>("academic");
  const [intensity, setIntensity] = useState<HumanizerIntensity>("balanced");
  const [preserveCitations, setPreserveCitations] = useState<boolean>(true);
  const [freezeInput, setFreezeInput] = useState<string>("");
  const [freezeKeywords, setFreezeKeywords] = useState<string[]>([
    "SmartPLS",
    "Cronbach's alpha"
  ]);

  // Output & Forensics State
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<HumanizeResult | null>(null);
  const [editedOutputText, setEditedOutputText] = useState<string>("");
  const [liveScan, setLiveScan] = useState<TextForensics | null>(null);
  const [outputTab, setOutputTab] = useState<"clean" | "diff" | "heatmap">("clean");
  const [selectedSentenceIdx, setSelectedSentenceIdx] = useState<number | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Modals State
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);
  const [modalTargetTier, setModalTargetTier] = useState<"pro" | "ultra">("pro");
  const [accessKeyInput, setAccessKeyInput] = useState<string>("");
  const [keyStatusMsg, setKeyStatusMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [verifyingKey, setVerifyingKey] = useState<boolean>(false);

  // Hydrate credits from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const today = getTodayKey();
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<CreditStorageState>;
        const isSameDay = parsed.date === today;
        const restoredFree = isSameDay && typeof parsed.freeRemaining === "number" ? parsed.freeRemaining : 3;
        const restoredPro = typeof parsed.proRemaining === "number" ? parsed.proRemaining : 50;
        const restoredUltra = typeof parsed.ultraRemaining === "number" ? parsed.ultraRemaining : 200;
        const restoredTier =
          parsed.unlockedTier === "ultra" || parsed.unlockedTier === "pro" ? parsed.unlockedTier : "free";

        setFreeCredits(restoredFree);
        setProCredits(restoredPro);
        setUltraCredits(restoredUltra);
        setUnlockedTier(restoredTier);
        setActiveTier(restoredTier);
        if (restoredTier !== "free") {
          setMode("lit_review");
          setIntensity("stealth");
        }
        if (parsed.accessCode) setSavedAccessCode(parsed.accessCode);
        if (parsed.usedTrialPreview) setUsedTrialPreview(true);
      } else {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            date: today,
            freeRemaining: 3,
            proRemaining: 50,
            ultraRemaining: 200,
            unlockedTier: "free",
            accessCode: "",
            usedTrialPreview: false
          } satisfies CreditStorageState)
        );
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  function persistState(partial: Partial<CreditStorageState>) {
    try {
      const next: CreditStorageState = {
        date: getTodayKey(),
        freeRemaining: partial.freeRemaining ?? freeCredits,
        proRemaining: partial.proRemaining ?? proCredits,
        ultraRemaining: partial.ultraRemaining ?? ultraCredits,
        unlockedTier: partial.unlockedTier ?? unlockedTier,
        accessCode: partial.accessCode ?? savedAccessCode,
        usedTrialPreview: partial.usedTrialPreview ?? usedTrialPreview
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }

  // Compute live input metrics client-side for instant feedback
  const inputForensics = useMemo(() => {
    return analyzeTextForensics(inputText, activeTier === "ultra" ? freezeKeywords : []);
  }, [inputText, activeTier, freezeKeywords]);

  const currentTierConfig = TIER_CONFIG[activeTier];
  const remainingCredits =
    activeTier === "ultra" ? ultraCredits : activeTier === "pro" ? proCredits : freeCredits;

  function canAccessTier(target: HumanizerTier): boolean {
    if (target === "free") return true;
    if (unlockedTier === "ultra") return true;
    if (unlockedTier === "pro" && target === "pro") return true;
    return false;
  }

  function handleSelectTierPill(target: HumanizerTier) {
    if (canAccessTier(target)) {
      setActiveTier(target);
      setErrorMsg(null);
      if (target === "free") {
        if (!TIER_CONFIG.free.allowedModes.includes(mode)) setMode("academic");
        setIntensity("balanced");
      }
    } else {
      setModalTargetTier(target === "ultra" ? "ultra" : "pro");
      setKeyStatusMsg(null);
      setShowUpgradeModal(true);
    }
  }

  function handleSelectMode(targetMode: HumanizerMode, minTier: HumanizerTier) {
    if (!canAccessTier(minTier) && activeTier === "free") {
      setModalTargetTier(minTier === "ultra" ? "ultra" : "pro");
      setKeyStatusMsg(null);
      setShowUpgradeModal(true);
      return;
    }
    setMode(targetMode);
  }

  function handleSelectIntensity(targetInt: HumanizerIntensity, minTier: HumanizerTier) {
    if (!canAccessTier(minTier) && activeTier === "free") {
      setModalTargetTier("pro");
      setKeyStatusMsg(null);
      setShowUpgradeModal(true);
      return;
    }
    setIntensity(targetInt);
  }

  function handleAddFreezeKeyword(e: React.FormEvent) {
    e.preventDefault();
    if (activeTier !== "ultra") {
      setModalTargetTier("ultra");
      setShowUpgradeModal(true);
      return;
    }
    const clean = freezeInput.trim();
    if (!clean) return;
    if (!freezeKeywords.includes(clean) && freezeKeywords.length < 15) {
      setFreezeKeywords([...freezeKeywords, clean]);
    }
    setFreezeInput("");
  }

  function handleRemoveFreezeKeyword(word: string) {
    setFreezeKeywords(freezeKeywords.filter((k) => k !== word));
  }

  async function handleRunForensicScan() {
    if (!inputText.trim()) {
      setErrorMsg("Please paste or type some text to scan.");
      return;
    }
    setErrorMsg(null);
    setIsScanning(true);
    try {
      const res = await fetch("/api/humanize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "analyze",
          text: inputText,
          freezeKeywords: activeTier === "ultra" ? freezeKeywords : []
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Scan failed.");
      setLiveScan(data.forensics);
    } catch (err: any) {
      setErrorMsg(err.message || "Unable to complete AI scan.");
    } finally {
      setIsScanning(false);
    }
  }

  async function handleHumanize() {
    if (!inputText.trim()) {
      setErrorMsg("Please enter or paste your AI-generated text first.");
      return;
    }

    if (inputForensics.wordCount > currentTierConfig.maxWordsPerRun) {
      setErrorMsg(
        `Your text is ${inputForensics.wordCount.toLocaleString()} words, which exceeds the ${currentTierConfig.name} limit of ${currentTierConfig.maxWordsPerRun.toLocaleString()} words per run. Upgrade to ${
          activeTier === "free" ? "Academic Pro (2,500 words)" : "Dissertation Ultra (10,000 words)"
        } to process longer documents.`
      );
      return;
    }

    if (remainingCredits <= 0) {
      setModalTargetTier(activeTier === "free" ? "pro" : "ultra");
      setShowUpgradeModal(true);
      setErrorMsg(
        `You have used all ${currentTierConfig.dailyCredits} credits on your ${currentTierConfig.name} plan. Upgrade to Academic Pro or Dissertation Ultra for high-volume academic humanization.`
      );
      return;
    }

    setErrorMsg(null);
    setIsProcessing(true);
    setSelectedSentenceIdx(null);

    try {
      const res = await fetch("/api/humanize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: inputText,
          tier: activeTier,
          mode,
          intensity,
          preserveCitations,
          freezeKeywords: activeTier === "ultra" ? freezeKeywords : [],
          accessCode: savedAccessCode
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to humanize text.");
      }

      const humResult = data as HumanizeResult;
      setResult(humResult);
      setEditedOutputText(humResult.humanizedText);
      setLiveScan(null);

      // Deduct 1 credit
      if (activeTier === "free") {
        const nextFree = Math.max(0, freeCredits - 1);
        setFreeCredits(nextFree);
        persistState({ freeRemaining: nextFree });
      } else if (activeTier === "pro") {
        const nextPro = Math.max(0, proCredits - 1);
        setProCredits(nextPro);
        persistState({ proRemaining: nextPro });
      } else if (activeTier === "ultra") {
        const nextUltra = Math.max(0, ultraCredits - 1);
        setUltraCredits(nextUltra);
        persistState({ ultraRemaining: nextUltra });
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong while humanizing.");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleVerifyAccessKey(e: React.FormEvent) {
    e.preventDefault();
    const cleanKey = accessKeyInput.trim();
    if (!cleanKey) return;
    setVerifyingKey(true);
    setKeyStatusMsg(null);
    try {
      const res = await fetch("/api/humanize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify-key",
          accessCode: cleanKey
        })
      });
      const data = await res.json();
      if (!res.ok || !data.valid) {
        setKeyStatusMsg({
          type: "err",
          text: data.error || "Invalid access key. Please check your code or request one on WhatsApp."
        });
        return;
      }

      const newTier = data.tier as HumanizerTier;
      setUnlockedTier(newTier);
      setActiveTier(newTier);
      setSavedAccessCode(cleanKey.toUpperCase());
      if (newTier === "pro") {
        setProCredits(50);
        setMode("lit_review");
        setIntensity("stealth");
        persistState({ unlockedTier: "pro", proRemaining: 50, accessCode: cleanKey.toUpperCase() });
      } else if (newTier === "ultra") {
        setUltraCredits(200);
        setMode("postgrad");
        setIntensity("stealth");
        persistState({ unlockedTier: "ultra", ultraRemaining: 200, accessCode: cleanKey.toUpperCase() });
      }

      setKeyStatusMsg({
        type: "ok",
        text: `Success! ${data.planName} unlocked with ${data.credits} priority credits.`
      });
      setTimeout(() => {
        setShowUpgradeModal(false);
      }, 1100);
    } catch {
      setKeyStatusMsg({ type: "err", text: "Could not verify key right now. Try again." });
    } finally {
      setVerifyingKey(false);
    }
  }

  function handleActivateOneRunPreview(targetTier: "pro" | "ultra") {
    setUnlockedTier(targetTier);
    setActiveTier(targetTier);
    setUsedTrialPreview(true);
    setMode(targetTier === "ultra" ? "postgrad" : "lit_review");
    setIntensity("stealth");
    if (targetTier === "pro") {
      setProCredits(2);
      persistState({ unlockedTier: "pro", proRemaining: 2, usedTrialPreview: true });
    } else {
      setUltraCredits(2);
      persistState({ unlockedTier: "ultra", ultraRemaining: 2, usedTrialPreview: true });
    }
    setShowUpgradeModal(false);
  }

  function handleSwapSentence(sentenceIndex: number, newSentenceText: string) {
    if (!result) return;
    const updatedSentences = result.afterMetrics.sentences.map((s, idx) =>
      idx === sentenceIndex ? { ...s, text: newSentenceText, aiScore: Math.max(4, s.aiScore - 8), riskLevel: "low" as const } : s
    );
    const joined = updatedSentences.map((s) => s.text).join(" ");
    setEditedOutputText(joined);
    setResult({
      ...result,
      humanizedText: joined,
      afterMetrics: {
        ...result.afterMetrics,
        sentences: updatedSentences
      }
    });
    setSelectedSentenceIdx(null);
  }

  function handleCopyOutput() {
    const textToCopy = editedOutputText || result?.humanizedText || "";
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }

  function handleDownloadReport(format: "txt" | "doc") {
    const textToSave = editedOutputText || result?.humanizedText || "";
    if (!textToSave || !result) return;

    if (format === "txt") {
      const blob = new Blob([textToSave], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `StHelp-Humanized-${new Date().toISOString().slice(0, 10)}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    // Forensic Audit .doc export for Pro & Ultra
    const reportContent = `STHELP VERBAFLOW™ — ACADEMIC AI HUMANIZATION & FORENSIC AUDIT REPORT
===================================================================
Date: ${new Date().toLocaleString()}
Plan Used: ${TIER_CONFIG[result.tierUsed].name}
Academic Mode: ${result.modeUsed.toUpperCase()} | Intensity: ${result.intensityUsed.toUpperCase()}

1. TELEMETRY SUMMARY (BEFORE VS. AFTER)
-------------------------------------------------------------------
• Human Originality Score : ${result.beforeMetrics.humanScore}%  -->  ${result.afterMetrics.humanScore}%
• Estimated AI Risk Score : ${result.beforeMetrics.aiProbability}%  -->  ${result.afterMetrics.aiProbability}%
• Sentence Burstiness     : ${result.beforeMetrics.burstinessScore}/100  -->  ${result.afterMetrics.burstinessScore}/100
• Lexical Perplexity      : ${result.beforeMetrics.perplexityScore}/100  -->  ${result.afterMetrics.perplexityScore}/100
• Academic Readability    : ${result.afterMetrics.academicGrade}
• AI Clichés Eliminated   : ${result.appliedTransformations.clichesRemoved}
• Clauses Restructured    : ${result.appliedTransformations.clausesRestructured}
• Protected Citations     : ${result.appliedTransformations.citationsProtected}

2. HUMANIZED ACADEMIC OUTPUT
-------------------------------------------------------------------
${textToSave}

3. ORIGINAL SOURCE INPUT
-------------------------------------------------------------------
${result.originalText}
`;
    const blob = new Blob([reportContent], { type: "application/msword;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `StHelp-Forensic-Humanized-Report-${new Date().toISOString().slice(0, 10)}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const wa = whatsapp.replace(/\D/g, "");
  const getPlanWaLink = (tierKey: "pro" | "ultra", customNote?: string) => {
    const plan = TIER_CONFIG[tierKey];
    const msg = encodeURIComponent(
      `✨ *StHelp VerbaFlow™ AI Humanizer — Plan Activation Request*\n\n` +
        `👋 *Hello StHelp Team,*\n` +
        `I would like to activate the *${plan.name}* plan on the StHelp AI Humanizer:\n\n` +
        `📦 *Selected Plan:* ${plan.name} (${plan.priceLkr}/month or ${plan.singlePassLkr})\n` +
        `⚡ *Allowance:* ${plan.monthlyWordsLabel}\n` +
        (customNote ? `📝 *Note:* ${customNote}\n` : "") +
        `\nPlease share the payment details and my instant Access Key. Thank you!`
    );
    return wa ? `https://wa.me/${wa}?text=${msg}` : "/place-assignment?service=custom";
  };

  return (
    <div className="humanizer-studio-wrap" id="humanizer-studio">
      {/* Top Tier & Credit Bar */}
      <div className="container">
        <div className="humanizer-tier-bar">
          <div className="humanizer-tier-switcher" role="tablist" aria-label="Select Humanizer Version">
            <button
              type="button"
              role="tab"
              aria-selected={activeTier === "free"}
              className={`tier-pill ${activeTier === "free" ? "active" : ""}`}
              onClick={() => handleSelectTierPill("free")}
            >
              <span className="tier-pill-dot free" />
              <div>
                <strong>Starter Free</strong>
                <small>400w / run · Limited Credit</small>
              </div>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTier === "pro"}
              className={`tier-pill ${activeTier === "pro" ? "active" : ""}`}
              onClick={() => handleSelectTierPill("pro")}
            >
              <span className="tier-pill-dot pro" />
              <div>
                <strong>
                  Academic Pro {!canAccessTier("pro") ? <Lock size={12} /> : <CheckCircle2 size={12} />}
                </strong>
                <small>2,500w / run · LKR 1,900</small>
              </div>
              <span className="tier-pill-tag">Popular</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTier === "ultra"}
              className={`tier-pill ${activeTier === "ultra" ? "active" : ""}`}
              onClick={() => handleSelectTierPill("ultra")}
            >
              <span className="tier-pill-dot ultra" />
              <div>
                <strong>
                  Dissertation Ultra {!canAccessTier("ultra") ? <Lock size={12} /> : <Crown size={12} />}
                </strong>
                <small>10,000w / run · LKR 4,500</small>
              </div>
              <span className="tier-pill-tag ultra-tag">Ultra</span>
            </button>
          </div>

          <div className="humanizer-credit-status">
            <div className="credit-meter-box">
              <div className="credit-meter-top">
                <span className="credit-plan-label">
                  <Zap size={14} /> {currentTierConfig.name}
                </span>
                <strong className="credit-count-badge">
                  {remainingCredits} / {currentTierConfig.dailyCredits} Credits Left
                </strong>
              </div>
              <div className="credit-progress-track">
                <div
                  className={`credit-progress-fill ${activeTier}`}
                  style={{
                    width: `${Math.min(100, Math.round((remainingCredits / currentTierConfig.dailyCredits) * 100))}%`
                  }}
                />
              </div>
            </div>

            <button
              type="button"
              className="btn-access-key"
              onClick={() => {
                setModalTargetTier(activeTier === "ultra" ? "ultra" : "pro");
                setKeyStatusMsg(null);
                setShowUpgradeModal(true);
              }}
            >
              <KeyRound size={15} />
              <span>{unlockedTier === "free" ? "Unlock Pro / Enter Key" : "Manage Plan / Key"}</span>
            </button>
          </div>
        </div>

        {/* Configuration Controls Deck */}
        <div className="humanizer-config-deck">
          {/* Discipline Modes */}
          <div className="config-group">
            <div className="config-group-header">
              <label className="config-label">
                <Layers size={15} /> 1. Academic Discipline & Register
              </label>
              <span className="config-hint">Tailors vocabulary, hedging, and syntactic cadence</span>
            </div>
            <div className="mode-pills-grid">
              {MODE_META.map((m) => {
                const locked = !canAccessTier(m.minTier);
                const isSelected = mode === m.key;
                return (
                  <button
                    key={m.key}
                    type="button"
                    className={`mode-pill-btn ${isSelected ? "selected" : ""} ${locked ? "locked" : ""}`}
                    onClick={() => handleSelectMode(m.key, m.minTier)}
                    title={m.shortDesc}
                  >
                    <div className="mode-pill-top">
                      <strong>{m.label}</strong>
                      <span className={`mode-tier-badge ${m.minTier}`}>
                        {locked ? <Lock size={10} /> : null} {m.badge}
                      </span>
                    </div>
                    <small>{m.shortDesc}</small>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Intensity + Citation Shield + Freeze Words */}
          <div className="config-secondary-row">
            <div className="config-group">
              <div className="config-group-header">
                <label className="config-label">
                  <Flame size={15} /> 2. Humanization Depth & Bypass Engine
                </label>
              </div>
              <div className="intensity-selector">
                {INTENSITY_META.map((item) => {
                  const locked = !canAccessTier(item.minTier);
                  const isSelected = intensity === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      className={`intensity-btn ${isSelected ? "selected" : ""} ${locked ? "locked" : ""}`}
                      onClick={() => handleSelectIntensity(item.key, item.minTier)}
                    >
                      <div className="intensity-btn-head">
                        <span>{item.label}</span>
                        {locked ? <Lock size={12} /> : isSelected ? <Check size={13} /> : null}
                      </div>
                      <small>{item.desc}</small>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="config-group shields-group">
              <div className="config-group-header">
                <label className="config-label">
                  <ShieldCheck size={15} /> 3. Academic Integrity Shields
                </label>
              </div>

              <label className="shield-toggle-card">
                <input
                  type="checkbox"
                  checked={preserveCitations}
                  onChange={(e) => setPreserveCitations(e.target.checked)}
                />
                <div>
                  <strong>Citation & Statistical Data Shield™</strong>
                  <small>
                    Locks APA/Harvard <code>(Smith, 2024)</code>, IEEE <code>[1]</code>, <code>p &lt; 0.05</code> &amp; direct quotes
                  </small>
                </div>
              </label>

              <div className={`freeze-keywords-box ${activeTier !== "ultra" ? "is-locked" : ""}`}>
                <div className="freeze-header">
                  <strong>
                    Custom Term Freeze Lock{" "}
                    {activeTier !== "ultra" ? (
                      <span className="ultra-lock-pill" onClick={() => handleSelectTierPill("ultra")}>
                        <Lock size={10} /> Ultra Plan
                      </span>
                    ) : (
                      <span className="ultra-unlocked-pill">Active</span>
                    )}
                  </strong>
                  <small>Prevent specific technical or domain terms from being paraphrased</small>
                </div>
                <form onSubmit={handleAddFreezeKeyword} className="freeze-form">
                  <input
                    type="text"
                    placeholder={
                      activeTier === "ultra"
                        ? "Add term to lock (e.g., SmartPLS, COVID-19)..."
                        : "Unlock Dissertation Ultra to freeze custom terms..."
                    }
                    value={freezeInput}
                    onChange={(e) => setFreezeInput(e.target.value)}
                    disabled={activeTier !== "ultra"}
                  />
                  <button
                    type="submit"
                    onClick={() => {
                      if (activeTier !== "ultra") {
                        setModalTargetTier("ultra");
                        setShowUpgradeModal(true);
                      }
                    }}
                  >
                    {activeTier === "ultra" ? "Lock Term" : "Unlock"}
                  </button>
                </form>
                {freezeKeywords.length > 0 && (
                  <div className="freeze-tags">
                    {freezeKeywords.map((kw) => (
                      <span key={kw} className="freeze-tag">
                        {kw}
                        {activeTier === "ultra" && (
                          <button type="button" onClick={() => handleRemoveFreezeKeyword(kw)} aria-label={`Remove ${kw}`}>
                            ×
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Error Alert Banner */}
        {errorMsg && (
          <div className="humanizer-alert-error" role="alert">
            <AlertTriangle size={18} />
            <span>{errorMsg}</span>
            <button type="button" onClick={() => setErrorMsg(null)} aria-label="Dismiss error">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Dual-Pane Workbench */}
        <div className="humanizer-workbench">
          {/* LEFT PANE: Source Input & AI Detector */}
          <div className="workbench-pane input-pane">
            <div className="pane-header">
              <div className="pane-title-wrap">
                <span className="pane-step-badge">INPUT</span>
                <h3>AI-Generated / Draft Content</h3>
              </div>
              <div className="sample-loader-pills">
                <span>Try sample:</span>
                {SAMPLE_AI_TEXTS.map((sample) => (
                  <button
                    key={sample.id}
                    type="button"
                    className="sample-pill-btn"
                    onClick={() => {
                      setInputText(sample.text);
                      if (canAccessTier("pro")) {
                        setMode(sample.mode);
                      }
                      setResult(null);
                      setLiveScan(null);
                      setErrorMsg(null);
                    }}
                  >
                    {sample.category}
                  </button>
                ))}
              </div>
            </div>

            <div className="textarea-wrapper">
              <textarea
                className="humanizer-textarea"
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  if (liveScan) setLiveScan(null);
                }}
                placeholder="Paste your ChatGPT, Claude, Gemini, or high-similarity academic draft here. Citations like (Silva, 2024) or [1] will be automatically shielded..."
                rows={13}
              />
              {inputText.length > 0 && (
                <button
                  type="button"
                  className="btn-clear-text"
                  onClick={() => {
                    setInputText("");
                    setResult(null);
                    setLiveScan(null);
                  }}
                >
                  Clear
                </button>
              )}
            </div>

            {/* Live Input Telemetry Strip */}
            <div className="input-telemetry-bar">
              <div className="word-counter-pill">
                <strong
                  className={
                    inputForensics.wordCount > currentTierConfig.maxWordsPerRun ? "over-limit" : ""
                  }
                >
                  {inputForensics.wordCount.toLocaleString()}
                </strong>
                <span>/ {currentTierConfig.maxWordsPerRun.toLocaleString()} words</span>
              </div>

              <div className="telemetry-mini-chips">
                <span title="Detected AI Risk Score before humanization">
                  AI Risk:{" "}
                  <strong
                    className={
                      inputForensics.aiProbability >= 60
                        ? "risk-high"
                        : inputForensics.aiProbability >= 35
                          ? "risk-med"
                          : "risk-low"
                    }
                  >
                    {inputForensics.aiProbability}%
                  </strong>
                </span>
                <span title="Sentence length variation (Burstiness)">
                  Burstiness: <strong>{inputForensics.burstinessScore}/100</strong>
                </span>
                <span title="Citations and statistical values automatically protected">
                  Shielded: <strong>{inputForensics.protectedItemsCount} items</strong>
                </span>
              </div>
            </div>

            {/* Detected AI Clichés Warning Bar */}
            {inputForensics.detectedCliches.length > 0 && (
              <div className="detected-cliches-strip">
                <span className="cliche-strip-label">
                  <AlertTriangle size={13} /> {inputForensics.detectedCliches.length} AI Watermarks Flagged:
                </span>
                <div className="cliche-tags-list">
                  {inputForensics.detectedCliches.slice(0, 8).map((c) => (
                    <span key={c} className="cliche-flag-chip">
                      “{c}”
                    </span>
                  ))}
                  {inputForensics.detectedCliches.length > 8 && (
                    <span className="cliche-flag-more">
                      +{inputForensics.detectedCliches.length - 8} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Primary Action Bar */}
            <div className="pane-actions-footer">
              <button
                type="button"
                className="btn-scan-ai"
                onClick={handleRunForensicScan}
                disabled={isScanning || isProcessing || !inputText.trim()}
              >
                <Eye size={16} />
                <span>{isScanning ? "Scanning..." : "Scan AI Probability (Free)"}</span>
              </button>

              <button
                type="button"
                className="btn-humanize-primary"
                onClick={handleHumanize}
                disabled={isProcessing || !inputText.trim()}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw size={17} className="spin-icon" />
                    <span>Restructuring &amp; Humanizing...</span>
                  </>
                ) : (
                  <>
                    <Wand2 size={17} />
                    <span>Humanize Content (1 Credit)</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* RIGHT PANE: Humanized Output & Forensic Comparison */}
          <div className="workbench-pane output-pane">
            <div className="pane-header">
              <div className="pane-title-wrap">
                <span className="pane-step-badge output">OUTPUT</span>
                <h3>Humanized Academic Studio</h3>
              </div>

              {result && (
                <div className="output-view-tabs" role="tablist">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={outputTab === "clean"}
                    className={outputTab === "clean" ? "active" : ""}
                    onClick={() => setOutputTab("clean")}
                  >
                    Clean Text
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={outputTab === "diff"}
                    className={outputTab === "diff" ? "active" : ""}
                    onClick={() => setOutputTab("diff")}
                  >
                    Highlighted Changes
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={outputTab === "heatmap"}
                    className={outputTab === "heatmap" ? "active" : ""}
                    onClick={() => setOutputTab("heatmap")}
                  >
                    Sentence Heatmap
                  </button>
                </div>
              )}
            </div>

            {/* Output Content Area */}
            {!result && !liveScan ? (
              <div className="output-empty-state">
                <div className="empty-orb-icon">
                  <Sparkles size={28} />
                </div>
                <h4>Ready to humanize your academic draft</h4>
                <p>
                  Click <strong>Humanize Content</strong> to run our multi-pass syntactic restructuring engine, eliminate LLM clichés, and inject natural human sentence burstiness while shielding your citations.
                </p>
                <div className="empty-feature-grid">
                  <div>
                    <CheckCircle2 size={15} />
                    <span>Turnitin &amp; GPTZero Rhythm Optimization</span>
                  </div>
                  <div>
                    <CheckCircle2 size={15} />
                    <span>100% APA / Harvard / IEEE Citation Lock</span>
                  </div>
                  <div>
                    <CheckCircle2 size={15} />
                    <span>Sentence-by-Sentence AI Risk Heatmap</span>
                  </div>
                  <div>
                    <CheckCircle2 size={15} />
                    <span>Interactive Clause Rephrasing Studio</span>
                  </div>
                </div>
              </div>
            ) : liveScan && !result ? (
              /* Pre-Humanization AI Scan Report */
              <div className="scan-only-view">
                <div className="scan-score-banner">
                  <div>
                    <span className="scan-eyebrow">PRE-HUMANIZATION FORENSIC SCAN</span>
                    <h4>
                      Estimated AI Probability: <strong className="risk-high">{liveScan.aiProbability}%</strong>
                    </h4>
                    <p>
                      Burstiness: <strong>{liveScan.burstinessScore}/100</strong> · Perplexity:{" "}
                      <strong>{liveScan.perplexityScore}/100</strong> · Readability:{" "}
                      <strong>{liveScan.academicGrade}</strong>
                    </p>
                  </div>
                  <button type="button" className="btn-humanize-primary" onClick={handleHumanize}>
                    <Wand2 size={16} /> Humanize Now
                  </button>
                </div>

                <div className="heatmap-legend">
                  <span>Sentence-by-Sentence AI Footprint Map:</span>
                  <span className="legend-dot high">High AI Signal</span>
                  <span className="legend-dot medium">Moderate Pattern</span>
                  <span className="legend-dot low">Human Cadence</span>
                </div>

                <div className="sentence-heatmap-box">
                  {liveScan.sentences.map((s) => (
                    <span
                      key={s.index}
                      className={`heatmap-sentence risk-${s.riskLevel}`}
                      title={`AI Risk: ${s.aiScore}% ${s.flags.length ? `(${s.flags.join(", ")})` : ""}`}
                    >
                      {s.text}{" "}
                    </span>
                  ))}
                </div>
              </div>
            ) : result ? (
              /* Full Humanized Studio Output */
              <div className="output-active-body">
                {/* Before -> After Score Telemetry Cards */}
                <div className="forensic-comparison-grid">
                  <div className="forensic-metric-card human-score-card">
                    <span className="metric-label">Human Originality</span>
                    <div className="metric-BeforeAfter">
                      <span className="old-val">{result.beforeMetrics.humanScore}%</span>
                      <ArrowRight size={13} />
                      <strong className="new-val">{result.afterMetrics.humanScore}%</strong>
                    </div>
                    <div className="mini-bar-track">
                      <div
                        className="mini-bar-fill success"
                        style={{ width: `${result.afterMetrics.humanScore}%` }}
                      />
                    </div>
                  </div>

                  <div className="forensic-metric-card">
                    <span className="metric-label">AI Detection Risk</span>
                    <div className="metric-BeforeAfter">
                      <span className="old-val">{result.beforeMetrics.aiProbability}%</span>
                      <ArrowRight size={13} />
                      <strong className="new-val low-risk">{result.afterMetrics.aiProbability}%</strong>
                    </div>
                    <small>Target: &lt;15% Turnitin AI</small>
                  </div>

                  <div className="forensic-metric-card">
                    <span className="metric-label">Burstiness (Rhythm)</span>
                    <div className="metric-BeforeAfter">
                      <span className="old-val">{result.beforeMetrics.burstinessScore}</span>
                      <ArrowRight size={13} />
                      <strong className="new-val">{result.afterMetrics.burstinessScore}/100</strong>
                    </div>
                    <small>Sentence length variance</small>
                  </div>

                  <div className="forensic-metric-card">
                    <span className="metric-label">Perplexity Index</span>
                    <div className="metric-BeforeAfter">
                      <span className="old-val">{result.beforeMetrics.perplexityScore}</span>
                      <ArrowRight size={13} />
                      <strong className="new-val">{result.afterMetrics.perplexityScore}/100</strong>
                    </div>
                    <small>{result.afterMetrics.academicGrade}</small>
                  </div>
                </div>

                {/* Transformation Counters Bar */}
                <div className="transformations-summary-bar">
                  <span>
                    <CheckCircle2 size={14} />{" "}
                    <strong>{result.appliedTransformations.clichesRemoved}</strong> AI footprints replaced
                  </span>
                  <span>
                    <TrendingUp size={14} />{" "}
                    <strong>{result.appliedTransformations.clausesRestructured + result.appliedTransformations.burstinessAdjustments}</strong>{" "}
                    clauses restructured
                  </span>
                  <span>
                    <ShieldCheck size={14} />{" "}
                    <strong>{result.appliedTransformations.citationsProtected}</strong> citations shielded
                  </span>
                </div>

                {/* Tab 1: Clean Editable Text */}
                {outputTab === "clean" && (
                  <div className="clean-output-container">
                    <textarea
                      className="humanizer-textarea output-clean-textarea"
                      value={editedOutputText}
                      onChange={(e) => setEditedOutputText(e.target.value)}
                      rows={10}
                    />
                  </div>
                )}

                {/* Tab 2: Highlighted Changes (Diff View) */}
                {outputTab === "diff" && (
                  <div className="diff-output-container">
                    <div className="diff-helper-note">
                      <Sparkles size={14} /> Highlighted phrases show where AI patterns were humanized and restructured. Hover any highlight to see the original text.
                    </div>
                    <div className="diff-text-body">
                      {result.diffSegments.map((seg, idx) =>
                        seg.type === "changed" ? (
                          <mark
                            key={idx}
                            className="diff-changed-mark"
                            title={seg.original ? `Original: "${seg.original.trim()}"` : "Humanized phrasing"}
                          >
                            {seg.text}
                          </mark>
                        ) : (
                          <span key={idx}>{seg.text}</span>
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* Tab 3: Sentence Heatmap & Interactive Alternative Swapper */}
                {outputTab === "heatmap" && (
                  <div className="heatmap-output-container">
                    <div className="heatmap-legend">
                      <span>Click any sentence below to inspect or swap with an alternative academic phrasing:</span>
                      <span className="legend-dot low">Human Cadence</span>
                      <span className="legend-dot medium">Moderate</span>
                    </div>

                    <div className="sentence-heatmap-box interactive">
                      {result.afterMetrics.sentences.map((s) => (
                        <span
                          key={s.index}
                          className={`heatmap-sentence risk-${s.riskLevel} ${
                            selectedSentenceIdx === s.index ? "selected-sentence" : ""
                          }`}
                          onClick={() => setSelectedSentenceIdx(s.index)}
                        >
                          {s.text}{" "}
                        </span>
                      ))}
                    </div>

                    {/* Sentence Alternative Picker Drawer */}
                    {selectedSentenceIdx !== null &&
                      result.afterMetrics.sentences[selectedSentenceIdx] && (
                        <div className="sentence-alternatives-drawer">
                          <div className="drawer-head">
                            <strong>
                              Sentence #{selectedSentenceIdx + 1} · Alternative Academic Phrasings
                            </strong>
                            <button
                              type="button"
                              onClick={() => setSelectedSentenceIdx(null)}
                              aria-label="Close sentence inspector"
                            >
                              <X size={15} />
                            </button>
                          </div>

                          {!canAccessTier("pro") ? (
                            <div className="drawer-pro-lock">
                              <Lock size={16} />
                              <span>
                                Interactive Sentence Rephrasing is an <strong>Academic Pro</strong> &amp;{" "}
                                <strong>Dissertation Ultra</strong> feature.
                              </span>
                              <button
                                type="button"
                                className="btn-tiny-upgrade"
                                onClick={() => {
                                  setModalTargetTier("pro");
                                  setShowUpgradeModal(true);
                                }}
                              >
                                Unlock Pro
                              </button>
                            </div>
                          ) : (
                            <div className="alternatives-list">
                              {(result.sentenceAlternatives[selectedSentenceIdx] || []).map(
                                (alt, altIdx) => (
                                  <button
                                    key={altIdx}
                                    type="button"
                                    className="alt-option-btn"
                                    onClick={() => handleSwapSentence(selectedSentenceIdx, alt)}
                                  >
                                    <span className="alt-badge">Option {altIdx + 1}</span>
                                    <p>{alt}</p>
                                  </button>
                                )
                              )}
                            </div>
                          )}
                        </div>
                      )}
                  </div>
                )}

                {/* Output Action Bar */}
                <div className="pane-actions-footer output-footer">
                  <div className="output-export-btns">
                    <button type="button" className="btn-output-action primary" onClick={handleCopyOutput}>
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                      <span>{copied ? "Copied to Clipboard!" : "Copy Humanized Text"}</span>
                    </button>

                    <button
                      type="button"
                      className="btn-output-action"
                      onClick={() => handleDownloadReport("txt")}
                    >
                      <Download size={15} />
                      <span>.TXT</span>
                    </button>

                    <button
                      type="button"
                      className="btn-output-action"
                      onClick={() => {
                        if (!canAccessTier("pro")) {
                          setModalTargetTier("pro");
                          setShowUpgradeModal(true);
                          return;
                        }
                        handleDownloadReport("doc");
                      }}
                    >
                      {!canAccessTier("pro") ? <Lock size={14} /> : <FileCheck2 size={15} />}
                      <span>Audit Report (.DOC)</span>
                    </button>
                  </div>

                  <Link
                    href={`/place-assignment?fromCalc=1&cat=turnitin&catLabel=${encodeURIComponent(
                      "Turnitin & AI Rewrite"
                    )}&title=${encodeURIComponent(
                      "Expert Manual Turnitin & AI Polish + Official Certificate"
                    )}&level=Undergraduate%20%2F%20Degree&urgency=Standard%20Pace&min=2,500&max=3,500&rawMin=2500&rawMax=3500`}
                    className="expert-verify-link"
                  >
                    Need an official Turnitin AI report? <span>Request human editor check ↗</span>
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* =====================================================================
          3-TIER PRICING SECTION: FREE LIMITED CREDIT + 2 PAID ADVANCED VERSIONS
          ===================================================================== */}
      <section className="humanizer-pricing-section" id="humanizer-plans">
        <div className="container">
          <div className="humanizer-pricing-header">
            <span className="eyebrow">CHOOSE YOUR HUMANIZER EDITION</span>
            <h2>Start with free daily credits. Upgrade for full assignments &amp; dissertations.</h2>
            <p>
              Every student receives <strong>3 free credits daily</strong> to test short sections. Unlock our two advanced paid editions—<strong>Academic Pro</strong> or <strong>Dissertation Ultra</strong>—for full coursework, deep Turnitin stealth modes, and custom keyword freezing.
            </p>
          </div>

          <div className="humanizer-plans-grid">
            {/* PLAN 1: LIMITED CREDIT FREE VERSION */}
            <article className={`humanizer-plan-card ${activeTier === "free" ? "current-plan" : ""}`}>
              <div className="plan-card-top">
                <span className="plan-tier-kicker">FREE EDITION · LIMITED CREDIT</span>
                <h3>Starter Free</h3>
                <p>For quick paragraph humanization, abstract checks, and testing the AI detector.</p>
              </div>

              <div className="plan-price-block">
                <strong>LKR 0</strong>
                <span>/ 3 Free Credits Every Day</span>
              </div>

              <div className="plan-allowance-pill">
                <Zap size={15} /> Up to <strong>400 words per run</strong> (1,200 words/day)
              </div>

              <ul className="plan-features-list">
                <li>
                  <CheckCircle2 size={16} />
                  <span>
                    <strong>3 Free Humanize Credits</strong> refreshed daily
                  </span>
                </li>
                <li>
                  <CheckCircle2 size={16} />
                  <span>
                    <strong>Unlimited Free AI Probability Scans</strong> &amp; Burstiness metrics
                  </span>
                </li>
                <li>
                  <CheckCircle2 size={16} />
                  <span>
                    <strong>2 Academic Modes:</strong> Standard Academic &amp; Concise
                  </span>
                </li>
                <li>
                  <CheckCircle2 size={16} />
                  <span>
                    <strong>Citation Shield™:</strong> Protects APA, Harvard &amp; IEEE references
                  </span>
                </li>
                <li className="muted-feature">
                  <Lock size={15} />
                  <span>No Deep Stealth Turnitin mode or Postgraduate register</span>
                </li>
                <li className="muted-feature">
                  <Lock size={15} />
                  <span>No interactive sentence swapper or custom keyword freeze</span>
                </li>
              </ul>

              <div className="plan-card-actions">
                <button
                  type="button"
                  className="btn btn-dark plan-btn-full"
                  onClick={() => {
                    setActiveTier("free");
                    document.getElementById("humanizer-studio")?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  {activeTier === "free" ? "Currently Active Plan" : "Switch to Starter Free"}
                </button>
              </div>
            </article>

            {/* PLAN 2: PAID ADVANCED VERSION 1 — ACADEMIC PRO */}
            <article className={`humanizer-plan-card featured-pro ${activeTier === "pro" ? "current-plan" : ""}`}>
              <div className="plan-popular-ribbon">MOST POPULAR · ADVANCED #1</div>
              <div className="plan-card-top">
                <span className="plan-tier-kicker">PAID ADVANCED EDITION 01</span>
                <h3>Academic Pro</h3>
                <p>Built for undergraduate &amp; postgraduate coursework, essays, and full module reports.</p>
              </div>

              <div className="plan-price-block">
                <strong>LKR 1,900</strong>
                <span>/ month · or LKR 1,200 single assignment pass</span>
              </div>

              <div className="plan-allowance-pill pro">
                <Flame size={15} /> <strong>50 Priority Credits</strong> · Up to <strong>2,500 words per run</strong>
              </div>

              <ul className="plan-features-list">
                <li>
                  <CheckCircle2 size={16} />
                  <span>
                    <strong>Up to 125,000 Words/Mo</strong> (2,500 words per single pass)
                  </span>
                </li>
                <li>
                  <CheckCircle2 size={16} />
                  <span>
                    <strong>Deep Stealth Engine v4:</strong> Targets &lt;10% AI score on Turnitin &amp; GPTZero
                  </span>
                </li>
                <li>
                  <CheckCircle2 size={16} />
                  <span>
                    <strong>All 6 Academic Disciplines:</strong> Postgraduate, Literature Review, Methodology &amp; MBA
                  </span>
                </li>
                <li>
                  <CheckCircle2 size={16} />
                  <span>
                    <strong>Interactive Sentence Studio:</strong> Click any sentence for 3 alternative scholarly rewrites
                  </span>
                </li>
                <li>
                  <CheckCircle2 size={16} />
                  <span>
                    <strong>Side-by-Side Diff Viewer &amp; Forensic .DOC Audit Export</strong>
                  </span>
                </li>
                <li>
                  <CheckCircle2 size={16} />
                  <span>
                    <strong>100% Citation, Statistic &amp; Direct Quote Preservation</strong>
                  </span>
                </li>
              </ul>

              <div className="plan-card-actions">
                <a
                  href={getPlanWaLink("pro")}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-coral plan-btn-full"
                >
                  <WhatsAppIcon />
                  <span>Get Pro Access Key on WhatsApp</span>
                </a>

                <div className="plan-secondary-links">
                  <Link
                    href={`/place-assignment?fromCalc=1&cat=turnitin&catLabel=${encodeURIComponent(
                      "Academic Pro AI Humanizer"
                    )}&title=${encodeURIComponent(
                      "StHelp VerbaFlow™ — Academic Pro Plan (50 Credits / 2,500w per run)"
                    )}&level=Undergraduate%20%2F%20Degree&urgency=Express&min=1,200&max=1,900&rawMin=1200&rawMax=1900`}
                  >
                    Order via Portal (PayHere / Bank) ↗
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setModalTargetTier("pro");
                      setKeyStatusMsg(null);
                      setShowUpgradeModal(true);
                    }}
                  >
                    Have a Pro Key?
                  </button>
                </div>
              </div>
            </article>

            {/* PLAN 3: PAID ADVANCED VERSION 2 — DISSERTATION ULTRA */}
            <article className={`humanizer-plan-card ultra-card ${activeTier === "ultra" ? "current-plan" : ""}`}>
              <div className="plan-popular-ribbon ultra">RESEARCH &amp; THESIS SUITE · ADVANCED #2</div>
              <div className="plan-card-top">
                <span className="plan-tier-kicker">PAID ADVANCED EDITION 02</span>
                <h3>Dissertation Ultra</h3>
                <p>Maximum capacity &amp; neural rhythm control for 10,000-word dissertations, FYPs, and journal papers.</p>
              </div>

              <div className="plan-price-block">
                <strong>LKR 4,500</strong>
                <span>/ month · or LKR 3,500 full dissertation pass</span>
              </div>

              <div className="plan-allowance-pill ultra">
                <Crown size={15} /> <strong>200 Ultra Credits</strong> · Up to <strong>10,000 words per run</strong>
              </div>

              <ul className="plan-features-list">
                <li>
                  <CheckCircle2 size={16} />
                  <span>
                    <strong>Full Chapter &amp; Thesis Capacity:</strong> Up to 10,000 words in a single click
                  </span>
                </li>
                <li>
                  <CheckCircle2 size={16} />
                  <span>
                    <strong>Ultra-Stealth Neural Rhythm Engine:</strong> Deep clause-level burstiness &amp; perplexity engineering
                  </span>
                </li>
                <li>
                  <CheckCircle2 size={16} />
                  <span>
                    <strong>Custom Keyword &amp; Terminology Freeze Lock:</strong> Lock domain terms, variables &amp; statutes
                  </span>
                </li>
                <li>
                  <CheckCircle2 size={16} />
                  <span>
                    <strong>All 6 Modes + Interactive Sentence Swapper + Full Forensic Report</strong>
                  </span>
                </li>
                <li>
                  <CheckCircle2 size={16} />
                  <span>
                    <strong>Priority StHelp Human Editor Support:</strong> Includes 20% off manual Turnitin verification
                  </span>
                </li>
                <li>
                  <CheckCircle2 size={16} />
                  <span>
                    <strong>Multi-Device Access Key</strong> valid across laptop &amp; mobile
                  </span>
                </li>
              </ul>

              <div className="plan-card-actions">
                <a
                  href={getPlanWaLink("ultra")}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-light plan-btn-full ultra-cta-btn"
                >
                  <WhatsAppIcon />
                  <span>Get Ultra Access Key on WhatsApp</span>
                </a>

                <div className="plan-secondary-links">
                  <Link
                    href={`/place-assignment?fromCalc=1&cat=turnitin&catLabel=${encodeURIComponent(
                      "Dissertation Ultra AI Humanizer"
                    )}&title=${encodeURIComponent(
                      "StHelp VerbaFlow™ — Dissertation Ultra Plan (200 Credits / 10,000w per run)"
                    )}&level=Postgraduate%20%2F%20Master's&urgency=Express&min=3,500&max=4,500&rawMin=3500&rawMax=4500`}
                  >
                    Order via Portal (PayHere / Bank) ↗
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setModalTargetTier("ultra");
                      setKeyStatusMsg(null);
                      setShowUpgradeModal(true);
                    }}
                  >
                    Have an Ultra Key?
                  </button>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* =====================================================================
          UPGRADE / ACCESS KEY ACTIVATION MODAL
          ===================================================================== */}
      {showUpgradeModal && (
        <div className="humanizer-modal-backdrop" role="dialog" aria-modal="true" aria-label="Unlock Advanced Humanizer Plan">
          <div className="humanizer-modal-card">
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setShowUpgradeModal(false)}
              aria-label="Close modal"
            >
              <X size={18} />
            </button>

            <div className="modal-tier-tabs">
              <button
                type="button"
                className={modalTargetTier === "pro" ? "active" : ""}
                onClick={() => setModalTargetTier("pro")}
              >
                <Flame size={15} /> Academic Pro (LKR 1,900)
              </button>
              <button
                type="button"
                className={modalTargetTier === "ultra" ? "active" : ""}
                onClick={() => setModalTargetTier("ultra")}
              >
                <Crown size={15} /> Dissertation Ultra (LKR 4,500)
              </button>
            </div>

            <div className="modal-body-content">
              <span className="eyebrow">
                {modalTargetTier === "ultra" ? "ADVANCED EDITION #2 · THESIS SUITE" : "ADVANCED EDITION #1 · MOST POPULAR"}
              </span>
              <h3>Unlock {TIER_CONFIG[modalTargetTier].name}</h3>
              <p>{TIER_CONFIG[modalTargetTier].tagline}</p>

              <div className="modal-highlights-box">
                <div>
                  <strong>{TIER_CONFIG[modalTargetTier].maxWordsPerRun.toLocaleString()} words</strong>
                  <small>Max per run</small>
                </div>
                <div>
                  <strong>{TIER_CONFIG[modalTargetTier].dailyCredits} credits</strong>
                  <small>Priority allowance</small>
                </div>
                <div>
                  <strong>{TIER_CONFIG[modalTargetTier].priceLkr}</strong>
                  <small>{TIER_CONFIG[modalTargetTier].singlePassLkr}</small>
                </div>
              </div>

              {/* Enter Access Key Form */}
              <form onSubmit={handleVerifyAccessKey} className="modal-key-form">
                <label htmlFor="humanizer-key-input">
                  <KeyRound size={14} /> Already received an Access Key from StHelp?
                </label>
                <div className="key-input-row">
                  <input
                    id="humanizer-key-input"
                    type="text"
                    placeholder="Enter Access Key (e.g. STHELP-PRO-2026)..."
                    value={accessKeyInput}
                    onChange={(e) => setAccessKeyInput(e.target.value)}
                  />
                  <button type="submit" disabled={verifyingKey}>
                    <Unlock size={15} />
                    <span>{verifyingKey ? "Checking..." : "Activate"}</span>
                  </button>
                </div>
                {keyStatusMsg && (
                  <p className={`key-feedback ${keyStatusMsg.type}`}>{keyStatusMsg.text}</p>
                )}
              </form>

              {/* Free 2-Credit Preview Trial Button for Evaluators */}
              {!usedTrialPreview && unlockedTier === "free" && (
                <div className="modal-preview-trial-box">
                  <div>
                    <strong>Want to test {TIER_CONFIG[modalTargetTier].name} features first?</strong>
                    <small>Activate a complimentary 2-credit preview pass right now in your browser.</small>
                  </div>
                  <button
                    type="button"
                    className="btn-trial-preview"
                    onClick={() => handleActivateOneRunPreview(modalTargetTier)}
                  >
                    <Sparkles size={14} /> Try 2 Free {modalTargetTier === "ultra" ? "Ultra" : "Pro"} Credits
                  </button>
                </div>
              )}

              <div className="modal-purchase-actions">
                <a
                  href={getPlanWaLink(modalTargetTier)}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-coral modal-wa-btn"
                >
                  <WhatsAppIcon />
                  <span>Get Instant Access Key via WhatsApp</span>
                </a>

                <Link
                  href={`/place-assignment?fromCalc=1&cat=turnitin&catLabel=${encodeURIComponent(
                    TIER_CONFIG[modalTargetTier].name
                  )}&title=${encodeURIComponent(
                    `StHelp VerbaFlow™ — ${TIER_CONFIG[modalTargetTier].name} Activation`
                  )}&level=Undergraduate%20%2F%20Degree&urgency=Express&min=${
                    modalTargetTier === "ultra" ? "3,500" : "1,200"
                  }&max=${modalTargetTier === "ultra" ? "4,500" : "1,900"}&rawMin=${
                    modalTargetTier === "ultra" ? "3500" : "1200"
                  }&rawMax=${modalTargetTier === "ultra" ? "4500" : "1900"}`}
                  className="btn btn-dark modal-portal-btn"
                  onClick={() => setShowUpgradeModal(false)}
                >
                  <span>Order via StHelp Portal</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

