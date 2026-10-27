"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Calculator, Check, Clock3, FileText, Sparkles, Zap } from "lucide-react";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";

type SubjectKey = "software" | "business" | "data" | "engineering" | "law_nursing" | "general";
type LevelKey = "diploma" | "undergrad" | "postgrad";
type ScopeKey = "small" | "medium" | "large" | "dissertation";
type UrgencyKey = "express" | "standard" | "relaxed";

const SUBJECTS: { key: SubjectKey; label: string; icon: string }[] = [
  { key: "software", label: "Software & Web Projects", icon: "💻" },
  { key: "business", label: "Business, Management & HRM", icon: "📊" },
  { key: "data", label: "Data, Statistics & Excel", icon: "📈" },
  { key: "engineering", label: "Engineering & Technical", icon: "⚙️" },
  { key: "law_nursing", label: "Law, Nursing & Health", icon: "⚖️" },
  { key: "general", label: "General Essays & Reports", icon: "📝" }
];

const LEVELS: { key: LevelKey; label: string; subtitle: string }[] = [
  { key: "diploma", label: "Foundation / Diploma", subtitle: "Level 3–4" },
  { key: "undergrad", label: "Undergraduate / Degree", subtitle: "Level 5–6" },
  { key: "postgrad", label: "Postgraduate / Master's / MBA", subtitle: "Level 7" }
];

const SCOPES: { key: ScopeKey; label: string; desc: string }[] = [
  { key: "small", label: "Up to 1,500 Words", desc: "Short essay, lab task, mini code" },
  { key: "medium", label: "1,500 – 3,000 Words", desc: "Standard module coursework" },
  { key: "large", label: "3,000 – 5,000 Words", desc: "Comprehensive project or report" },
  { key: "dissertation", label: "5,000+ Words", desc: "Final dissertation, thesis, major system" }
];

const URGENCIES: { key: UrgencyKey; label: string; tag: string }[] = [
  { key: "express", label: "Urgent Express", tag: "⚡ Within 24–48 Hours" },
  { key: "standard", label: "Standard Pace", tag: "⏱️ 3 to 5 Days" },
  { key: "relaxed", label: "Relaxed Pace", tag: "📅 1 to 2 Weeks+" }
];

const BASE_PRICES: Record<SubjectKey, Record<ScopeKey, number>> = {
  software: { small: 6500, medium: 12000, large: 21000, dissertation: 38000 },
  business: { small: 4500, medium: 8500, large: 15500, dissertation: 28000 },
  data: { small: 5500, medium: 10000, large: 18000, dissertation: 32000 },
  engineering: { small: 6000, medium: 11500, large: 19500, dissertation: 35000 },
  law_nursing: { small: 5000, medium: 9500, large: 17000, dissertation: 30000 },
  general: { small: 4000, medium: 7500, large: 14000, dissertation: 25000 }
};

const LEVEL_MULTIPLIERS: Record<LevelKey, number> = {
  diploma: 0.9,
  undergrad: 1.0,
  postgrad: 1.3
};

const URGENCY_MULTIPLIERS: Record<UrgencyKey, number> = {
  express: 1.35,
  standard: 1.0,
  relaxed: 0.92
};

export function InstantQuoteEstimator({ whatsapp }: { whatsapp: string }) {
  const [subject, setSubject] = useState<SubjectKey>("software");
  const [level, setLevel] = useState<LevelKey>("undergrad");
  const [scope, setScope] = useState<ScopeKey>("medium");
  const [urgency, setUrgency] = useState<UrgencyKey>("standard");

  const calculation = useMemo(() => {
    const base = BASE_PRICES[subject][scope];
    const levelMult = LEVEL_MULTIPLIERS[level];
    const urgencyMult = URGENCY_MULTIPLIERS[urgency];
    const calculated = Math.round((base * levelMult * urgencyMult) / 250) * 250;
    const minPrice = Math.round((calculated * 0.9) / 250) * 250;
    const maxPrice = Math.round((calculated * 1.15) / 250) * 250;
    return {
      min: minPrice.toLocaleString("en-LK"),
      max: maxPrice.toLocaleString("en-LK"),
      turnaround: urgency === "express" ? "Within 24–48 Hours" : urgency === "standard" ? "In 3–5 Days" : "In 7–12 Days"
    };
  }, [subject, level, scope, urgency]);

  const wa = whatsapp.replace(/\D/g, "");
  const selectedSubject = SUBJECTS.find((s) => s.key === subject)?.label;
  const selectedLevel = LEVELS.find((l) => l.key === level)?.label;
  const selectedScope = SCOPES.find((s) => s.key === scope)?.label;
  const selectedUrgency = URGENCIES.find((u) => u.key === urgency)?.tag;

  const prefilledWaMessage = encodeURIComponent(
    `Hi StHelp! I calculated an estimate on your website:\n` +
      `• Subject: ${selectedSubject}\n` +
      `• Level: ${selectedLevel}\n` +
      `• Scope: ${selectedScope}\n` +
      `• Timeline: ${selectedUrgency}\n` +
      `• Estimated Price: LKR ${calculation.min} – ${calculation.max}\n\n` +
      `Can I share my assignment brief with you for an exact quotation?`
  );

  const whatsappHref = wa ? `https://wa.me/${wa}?text=${prefilledWaMessage}` : "#";

  return (
    <section className="section quote-estimator-section" id="quote-calculator" data-public-reveal aria-label="Instant Price Estimator">
      <div className="container">
        <div className="estimator-heading">
          <span className="eyebrow">
            <Calculator size={14} style={{ verticalAlign: "middle", marginRight: 5 }} />
            INSTANT COST CALCULATOR
          </span>
          <h2>Calculate your estimate in 10 seconds.</h2>
          <p>Transparent starting rates tailored for Sri Lankan university modules. Zero guesswork before you order.</p>
        </div>

        <div className="estimator-card">
          <div className="estimator-controls">
            {/* Step 1: Subject */}
            <div className="control-group">
              <label className="control-label">
                <span>1. Select subject area</span>
              </label>
              <div className="selector-grid selector-subjects">
                {SUBJECTS.map((s) => (
                  <button
                    type="button"
                    key={s.key}
                    className={`selector-btn ${subject === s.key ? "active" : ""}`}
                    onClick={() => setSubject(s.key)}
                  >
                    <span className="selector-icon">{s.icon}</span>
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Academic Level */}
            <div className="control-group">
              <label className="control-label">
                <span>2. Select academic level</span>
              </label>
              <div className="selector-grid selector-levels">
                {LEVELS.map((l) => (
                  <button
                    type="button"
                    key={l.key}
                    className={`selector-btn ${level === l.key ? "active" : ""}`}
                    onClick={() => setLevel(l.key)}
                  >
                    <strong>{l.label}</strong>
                    <small>{l.subtitle}</small>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Scope */}
            <div className="control-group">
              <label className="control-label">
                <span>3. Assignment scope / volume</span>
              </label>
              <div className="selector-grid selector-scopes">
                {SCOPES.map((sc) => (
                  <button
                    type="button"
                    key={sc.key}
                    className={`selector-btn ${scope === sc.key ? "active" : ""}`}
                    onClick={() => setScope(sc.key)}
                  >
                    <strong>{sc.label}</strong>
                    <small>{sc.desc}</small>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 4: Urgency */}
            <div className="control-group">
              <label className="control-label">
                <span>4. Required turnaround time</span>
              </label>
              <div className="selector-grid selector-urgency">
                {URGENCIES.map((u) => (
                  <button
                    type="button"
                    key={u.key}
                    className={`selector-btn ${urgency === u.key ? "active" : ""}`}
                    onClick={() => setUrgency(u.key)}
                  >
                    <strong>{u.label}</strong>
                    <small>{u.tag}</small>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Result Panel */}
          <div className="estimator-result-panel">
            <div className="result-kicker">
              <Sparkles size={16} />
              <span>ESTIMATED PRICE RANGE</span>
            </div>

            <div className="result-price">
              <small>Starting from</small>
              <strong>LKR {calculation.min} – {calculation.max}</strong>
              <span className="turnaround-tag">
                <Clock3 size={14} /> Expected turnaround: {calculation.turnaround}
              </span>
            </div>

            <div className="result-features">
              <span>Included at this price:</span>
              <ul>
                <li><Check size={14} /> Free Turnitin similarity & AI report</li>
                <li><Check size={14} /> Harvard / APA / IEEE referencing</li>
                <li><Check size={14} /> Private workspace & live progress tracking</li>
                <li><Check size={14} /> 7 days free unlimited revisions</li>
              </ul>
            </div>

            <div className="result-actions">
              <a
                className="btn btn-estimator-wa"
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
              >
                <WhatsAppIcon size={20} />
                <span>Lock this quote on WhatsApp</span>
              </a>
              <Link className="btn btn-estimator-online" href="/place-assignment">
                <span>Place assignment online</span>
                <ArrowRight size={17} />
              </Link>
            </div>

            <p className="result-disclaimer">
              * Final quote is confirmed after StHelp reviews your assignment brief and marking rubric. No payment is taken upfront.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
