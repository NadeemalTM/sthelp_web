"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Calculator,
  Check,
  CheckCircle2,
  Clock3,
  FileCode,
  FileSpreadsheet,
  FileText,
  HelpCircle,
  Laptop,
  Layers,
  Minus,
  Plus,
  Presentation,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Zap
} from "lucide-react";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";

export type CategoryKey =
  | "report"
  | "research"
  | "web"
  | "mobile"
  | "presentation"
  | "analysis"
  | "other";

export type AcademicLevelKey = "diploma" | "undergrad" | "postgrad";
export type UrgencyKey = "express" | "standard" | "relaxed";

interface CategoryMeta {
  key: CategoryKey;
  label: string;
  badge: string;
  icon: string;
  desc: string;
}

const CATEGORIES: CategoryMeta[] = [
  {
    key: "report",
    label: "Reports & Essays",
    badge: "Word-based",
    icon: "📄",
    desc: "Essays, Coursework, Literature Reviews & Lab Reports"
  },
  {
    key: "research",
    label: "Research & Thesis",
    badge: "Proposal & Paper",
    icon: "🔬",
    desc: "Proposals, Dissertations, Papers & Data Collection"
  },
  {
    key: "web",
    label: "Web Development",
    badge: "Full-Stack & FYP",
    icon: "💻",
    desc: "Frontend, Backend, Frameworks, Final Projects & AI"
  },
  {
    key: "mobile",
    label: "Mobile Apps",
    badge: "Android & Flutter",
    icon: "📱",
    desc: "Flutter, React Native, Native Apps, FYP & AI models"
  },
  {
    key: "presentation",
    label: "Presentations",
    badge: "Per-slide rate",
    icon: "📑",
    desc: "PowerPoint & Canva Decks for Viva, Pitches & Class"
  },
  {
    key: "analysis",
    label: "Data & Statistics",
    badge: "SPSS & SmartPLS",
    icon: "📊",
    desc: "SPSS, SmartPLS, Advanced Excel Modeling & Python"
  },
  {
    key: "other",
    label: "UI/UX & Tech Tasks",
    badge: "Specialized",
    icon: "⚙️",
    desc: "Figma UI/UX, Database SQL, Case Studies & Simulations"
  }
];

const ACADEMIC_LEVELS: { key: AcademicLevelKey; label: string; subtitle: string; mult: number }[] = [
  { key: "diploma", label: "Foundation / Diploma", subtitle: "Level 3–4", mult: 0.95 },
  { key: "undergrad", label: "Undergraduate / Degree", subtitle: "Level 5–6", mult: 1.0 },
  { key: "postgrad", label: "Postgraduate / Master's / MBA", subtitle: "Level 7", mult: 1.25 }
];

const URGENCIES: { key: UrgencyKey; label: string; tag: string; mult: number }[] = [
  { key: "express", label: "Urgent Express", tag: "⚡ Within 24–48 Hours", mult: 1.2 },
  { key: "standard", label: "Standard Pace", tag: "⏱️ 3 to 5 Days", mult: 1.0 },
  { key: "relaxed", label: "Relaxed Pace", tag: "📅 1 to 2 Weeks+", mult: 0.95 }
];

// --- 1. Reports & Essays options ---
const REPORT_SCOPES = [
  { key: "w1500", label: "Up to 1,500 Words", desc: "Short essay, lab write-up, mini report", min: 2000, max: 2500 },
  { key: "w2500", label: "2,500 Words", desc: "Standard module coursework & critical essay", min: 3000, max: 4000 },
  { key: "w5000", label: "5,000 Words", desc: "Comprehensive project or extended report", min: 5000, max: 7000 },
  { key: "w10000", label: "10,000 Words", desc: "Major project, comprehensive portfolio", min: 10000, max: 15000 },
  { key: "w15000", label: "15,000+ Words", desc: "Extended academic treatise / dissertation", min: 16000, max: 22000 }
];

// --- 2. Research & Thesis options ---
const RESEARCH_TYPES = [
  {
    key: "proposal",
    label: "Research Proposal (2,500 – 4,000 words)",
    desc: "Problem statement, literature review, conceptual framework & methodology",
    min: 4000,
    max: 6000
  },
  {
    key: "thesis_ug",
    label: "Undergraduate Dissertation (5,000 – 8,000 words)",
    desc: "Complete 5-chapter dissertation with analysis and discussion",
    min: 7000,
    max: 11000
  },
  {
    key: "thesis_pg",
    label: "Master's / MBA Dissertation (10,000 – 15,000 words)",
    desc: "Rigorous empirical research, high academic standards & critical analysis",
    min: 14000,
    max: 20000
  },
  {
    key: "paper",
    label: "Academic Research Paper (Journal / Conference)",
    desc: "Scopus / IEEE formatted paper ready for submission or publication",
    min: 12000,
    max: 18000
  }
];

// --- 3. Web Development options ---
const WEB_TIERS = [
  {
    key: "web_simple",
    label: "Simple Web (Frontend + Backend)",
    desc: "HTML5, CSS3, JavaScript, PHP/Node basic CRUD & contact database",
    min: 5000,
    max: 8000
  },
  {
    key: "web_mid",
    label: "Mid-Level Web App (Modern Framework)",
    desc: "React, Next.js, Node.js, Laravel, Vue or Tailwind with Auth & Database",
    min: 8000,
    max: 15000
  },
  {
    key: "web_adv",
    label: "Advanced Web System (No AI Model)",
    desc: "Custom full-stack architecture, RBAC, payment, dashboard, high complexity",
    min: 15000,
    max: 20000
  },
  {
    key: "web_fyp",
    label: "Final Year / Research Project Web App (FYP)",
    desc: "Comprehensive research system, novel architecture, clean code & viva ready",
    min: 25000,
    max: 35000
  },
  {
    key: "web_ai",
    label: "Advanced Web with AI/ML Models & Data Training",
    desc: "Custom machine learning model, PyTorch/TensorFlow, trained datasets & API",
    min: 30000,
    max: 50000
  }
];

// --- 4. Mobile Apps options ---
const MOBILE_TIERS = [
  {
    key: "app_simple",
    label: "Simple Mobile App (UI & Local Storage)",
    desc: "Flutter / Native Android, clean UI screens, SQLite / local storage",
    min: 7000,
    max: 10000
  },
  {
    key: "app_mid",
    label: "Mid-Level Mobile App (Cloud & REST API)",
    desc: "Flutter / React Native, User authentication, Firebase or REST backend",
    min: 12000,
    max: 18000
  },
  {
    key: "app_adv",
    label: "Advanced Full-Feature Mobile App",
    desc: "Payment integration, location/GPS, background services, custom APIs",
    min: 18000,
    max: 26000
  },
  {
    key: "app_fyp",
    label: "Final Year Project (FYP) Mobile Application",
    desc: "Complete research-grade mobile system, backend server, viva demo setup",
    min: 28000,
    max: 40000
  },
  {
    key: "app_ai",
    label: "Mobile App + On-Device AI/ML Models",
    desc: "TFLite / Vision / NLP integration, custom trained model & camera pipelines",
    min: 35000,
    max: 55000
  }
];

// --- 5. Presentation options ---
const PRESENTATION_STYLES = [
  {
    key: "standard",
    label: "Standard Academic Slides",
    rate: 150,
    desc: "LKR 150 / slide • Clear structured points, clean layout, charts & references"
  },
  {
    key: "advanced",
    label: "Advanced Executive & Animated Slides",
    rate: 175,
    desc: "LKR 175 / slide • Custom infographics, modern animations, speaker notes included"
  }
];

// --- 6. Data Analysis options ---
const ANALYSIS_METHODS = [
  {
    key: "spss",
    label: "SPSS Statistical Analysis & Interpretation",
    desc: "Descriptive statistics, Reliability (Cronbach's alpha), ANOVA, T-Tests, Regression writeup",
    min: 10000,
    max: 14000
  },
  {
    key: "smartpls",
    label: "SmartPLS / SEM Path Modeling",
    desc: "Structural Equation Modeling, measurement & structural model assessment, mediation & moderation",
    min: 12000,
    max: 15000
  },
  {
    key: "excel",
    label: "Advanced Excel Modeling & Dynamic Dashboards",
    desc: "Dynamic KPI dashboards, Pivot automation, financial modeling & scenario solver",
    min: 10000,
    max: 13000
  },
  {
    key: "python_r",
    label: "Python / R Data Science & Visualizations",
    desc: "Exploratory data analysis, predictive statistical models, Seaborn/Matplotlib visual charts",
    min: 12000,
    max: 16000
  }
];

// --- 7. Other Tech & Specialized Tasks ---
const OTHER_SERVICES = [
  {
    key: "figma",
    label: "Figma UI/UX Prototyping & Wireframes",
    desc: "High-fidelity mobile/web interfaces, component design system, clickable prototype",
    min: 5000,
    max: 9000
  },
  {
    key: "database",
    label: "Database Design, ERD & Advanced SQL",
    desc: "Entity-Relationship Diagrams, Relational Schema, 1NF to BCNF Normalization, queries",
    min: 4500,
    max: 8000
  },
  {
    key: "casestudy",
    label: "Business Case Study & Strategic Analysis",
    desc: "SWOT, PESTEL, Porter's Five Forces, financial ratio analysis & strategic report",
    min: 4000,
    max: 7500
  },
  {
    key: "simulation",
    label: "Engineering & Network Simulation",
    desc: "Cisco Packet Tracer routing/switching, MATLAB algorithms, or technical lab simulation",
    min: 6500,
    max: 11000
  }
];

export function InstantQuoteEstimator({ whatsapp }: { whatsapp: string }) {
  const [category, setCategory] = useState<CategoryKey>("report");
  const [level, setLevel] = useState<AcademicLevelKey>("undergrad");
  const [urgency, setUrgency] = useState<UrgencyKey>("standard");

  // Dynamic category states
  const [reportScope, setReportScope] = useState<string>("w2500");
  const [researchType, setResearchType] = useState<string>("proposal");
  const [researchDataCollection, setResearchDataCollection] = useState<boolean>(false);
  const [researchStatsAnalysis, setResearchStatsAnalysis] = useState<boolean>(false);

  const [webTier, setWebTier] = useState<string>("web_mid");
  const [webDocumentation, setWebDocumentation] = useState<boolean>(false);

  const [mobileTier, setMobileTier] = useState<string>("app_mid");
  const [mobileDocumentation, setMobileDocumentation] = useState<boolean>(false);

  const [presentationStyle, setPresentationStyle] = useState<string>("standard");
  const [slideCount, setSlideCount] = useState<number>(15);
  const [presentationNotes, setPresentationNotes] = useState<boolean>(false);

  const [analysisMethod, setAnalysisMethod] = useState<string>("spss");
  const [analysisDataEntry, setAnalysisDataEntry] = useState<boolean>(false);

  const [otherService, setOtherService] = useState<string>("figma");

  // Calculation Engine
  const calculation = useMemo(() => {
    let baseMin = 3000;
    let baseMax = 4000;
    let categorySummary = "";

    const levelObj = ACADEMIC_LEVELS.find((l) => l.key === level) || ACADEMIC_LEVELS[1];
    const urgencyObj = URGENCIES.find((u) => u.key === urgency) || URGENCIES[1];

    if (category === "report") {
      const match = REPORT_SCOPES.find((s) => s.key === reportScope) || REPORT_SCOPES[1];
      baseMin = match.min * levelObj.mult;
      baseMax = match.max * levelObj.mult;
      categorySummary = `Report / Essay: ${match.label}`;
    } else if (category === "research") {
      const match = RESEARCH_TYPES.find((r) => r.key === researchType) || RESEARCH_TYPES[0];
      baseMin = match.min;
      baseMax = match.max;
      categorySummary = `${match.label}`;

      if (researchDataCollection) {
        baseMin += 4500;
        baseMax += 6000;
      }
      if (researchStatsAnalysis) {
        baseMin += 8000;
        baseMax += 10000;
      }
    } else if (category === "web") {
      const match = WEB_TIERS.find((w) => w.key === webTier) || WEB_TIERS[1];
      baseMin = match.min;
      baseMax = match.max;
      categorySummary = `Web Dev: ${match.label}`;

      if (webDocumentation) {
        baseMin += 4000;
        baseMax += 5000;
      }
    } else if (category === "mobile") {
      const match = MOBILE_TIERS.find((m) => m.key === mobileTier) || MOBILE_TIERS[1];
      baseMin = match.min;
      baseMax = match.max;
      categorySummary = `Mobile App: ${match.label}`;

      if (mobileDocumentation) {
        baseMin += 4000;
        baseMax += 5000;
      }
    } else if (category === "presentation") {
      const styleMatch = PRESENTATION_STYLES.find((p) => p.key === presentationStyle) || PRESENTATION_STYLES[0];
      const count = Math.max(5, Math.min(60, slideCount));
      const calculated = count * styleMatch.rate;
      baseMin = calculated;
      baseMax = Math.round((calculated * 1.15) / 50) * 50;
      categorySummary = `${styleMatch.label} (${count} slides)`;

      if (presentationNotes) {
        baseMin += 800;
        baseMax += 1000;
      }
    } else if (category === "analysis") {
      const match = ANALYSIS_METHODS.find((a) => a.key === analysisMethod) || ANALYSIS_METHODS[0];
      baseMin = match.min;
      baseMax = match.max;
      categorySummary = `Data Analysis: ${match.label}`;

      if (analysisDataEntry) {
        baseMin += 3000;
        baseMax += 4500;
      }
    } else if (category === "other") {
      const match = OTHER_SERVICES.find((o) => o.key === otherService) || OTHER_SERVICES[0];
      baseMin = match.min;
      baseMax = match.max;
      categorySummary = `Tech Task: ${match.label}`;
    }

    // Apply urgency modifier
    const finalMin = Math.round((baseMin * urgencyObj.mult) / 100) * 100;
    const finalMax = Math.round((baseMax * urgencyObj.mult) / 100) * 100;

    let turnaroundText = "In 3–5 Days";
    if (urgency === "express") turnaroundText = "Within 24–48 Hours (Express)";
    else if (urgency === "relaxed") turnaroundText = "In 7–14 Days (Standard/Relaxed)";

    return {
      min: finalMin.toLocaleString("en-LK"),
      max: finalMax.toLocaleString("en-LK"),
      summary: categorySummary,
      turnaround: turnaroundText
    };
  }, [
    category,
    level,
    urgency,
    reportScope,
    researchType,
    researchDataCollection,
    researchStatsAnalysis,
    webTier,
    webDocumentation,
    mobileTier,
    mobileDocumentation,
    presentationStyle,
    slideCount,
    presentationNotes,
    analysisMethod,
    analysisDataEntry,
    otherService
  ]);

  const activeCategoryMeta = CATEGORIES.find((c) => c.key === category) || CATEGORIES[0];
  const activeLevelMeta = ACADEMIC_LEVELS.find((l) => l.key === level) || ACADEMIC_LEVELS[1];
  const activeUrgencyMeta = URGENCIES.find((u) => u.key === urgency) || URGENCIES[1];

  // WhatsApp prefilled message
  const wa = whatsapp.replace(/\D/g, "");
  const addOnsList: string[] = [];
  if (category === "research") {
    if (researchDataCollection) addOnsList.push("Primary Data Collection");
    if (researchStatsAnalysis) addOnsList.push("Statistical Data Analysis");
  } else if (category === "web" && webDocumentation) {
    addOnsList.push("System Documentation & Viva Slides");
  } else if (category === "mobile" && mobileDocumentation) {
    addOnsList.push("System Documentation & Viva Slides");
  } else if (category === "presentation" && presentationNotes) {
    addOnsList.push("Full Viva Speech Notes");
  } else if (category === "analysis" && analysisDataEntry) {
    addOnsList.push("Raw Questionnaire Data Entry");
  }

  const addOnsText = addOnsList.length > 0 ? `\n• Add-ons: ${addOnsList.join(", ")}` : "";

  const prefilledWaMessage = encodeURIComponent(
    `Hi StHelp! I used the price calculator on your website:\n` +
      `• Category: ${activeCategoryMeta.label}\n` +
      `• Details: ${calculation.summary}\n` +
      (category === "report" ? `• Level: ${activeLevelMeta.label}\n` : "") +
      `• Timeline: ${activeUrgencyMeta.tag}${addOnsText}\n` +
      `• Estimated Price: LKR ${calculation.min} – ${calculation.max}\n\n` +
      `Can I share my assignment brief with you for an exact quotation?`
  );

  const whatsappHref = wa ? `https://wa.me/${wa}?text=${prefilledWaMessage}` : "#";

  // Deliverables based on category
  const isSoftwareOrWeb = category === "web" || category === "mobile";
  const isPresentation = category === "presentation";

  return (
    <section className="section quote-estimator-section" id="quote-calculator" data-public-reveal aria-label="Instant Price Estimator">
      <div className="container">
        <div className="estimator-heading">
          <span className="eyebrow">
            <Calculator size={14} style={{ verticalAlign: "middle", marginRight: 5 }} />
            INSTANT ESTIMATE CALCULATOR
          </span>
          <h2>Calculate your exact budget in 10 seconds.</h2>
          <p>
            Real university assignment rates across reports, research theses, web & mobile development, SPSS analysis, and presentations.
          </p>
        </div>

        <div className="estimator-card">
          <div className="estimator-controls">
            {/* Step 1: Select Category */}
            <div className="control-group">
              <label className="control-label">
                <span>1. Choose Assignment / Project Type</span>
              </label>
              <div className="estimator-category-pills" role="tablist">
                {CATEGORIES.map((c) => (
                  <button
                    type="button"
                    key={c.key}
                    role="tab"
                    aria-selected={category === c.key}
                    className={`category-pill-btn ${category === c.key ? "active" : ""}`}
                    onClick={() => setCategory(c.key)}
                  >
                    <span className="category-pill-icon">{c.icon}</span>
                    <span className="category-pill-content">
                      <strong>{c.label}</strong>
                      <small>{c.badge}</small>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Dynamic Category-Specific Configuration */}
            <div className="category-config-box">
              {/* Category 1: Reports & Essays */}
              {category === "report" && (
                <>
                  <div className="control-group">
                    <label className="control-label">
                      <span>2. Select Word Count Scope</span>
                    </label>
                    <div className="selector-grid selector-scopes">
                      {REPORT_SCOPES.map((sc) => (
                        <button
                          type="button"
                          key={sc.key}
                          className={`selector-btn ${reportScope === sc.key ? "active" : ""}`}
                          onClick={() => setReportScope(sc.key)}
                        >
                          <strong>{sc.label}</strong>
                          <small>{sc.desc}</small>
                          <span className="selector-price-badge">
                            LKR {sc.min.toLocaleString()} – {sc.max.toLocaleString()}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="control-group">
                    <label className="control-label">
                      <span>3. Select Academic Level</span>
                    </label>
                    <div className="selector-grid selector-levels">
                      {ACADEMIC_LEVELS.map((l) => (
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
                </>
              )}

              {/* Category 2: Research Proposal & Thesis */}
              {category === "research" && (
                <>
                  <div className="control-group">
                    <label className="control-label">
                      <span>2. Select Research / Thesis Type</span>
                    </label>
                    <div className="selector-grid selector-vertical">
                      {RESEARCH_TYPES.map((rt) => (
                        <button
                          type="button"
                          key={rt.key}
                          className={`selector-btn ${researchType === rt.key ? "active" : ""}`}
                          onClick={() => setResearchType(rt.key)}
                        >
                          <div className="selector-btn-header">
                            <strong>{rt.label}</strong>
                            <span className="selector-price-badge">
                              LKR {rt.min.toLocaleString()} – {rt.max.toLocaleString()}
                            </span>
                          </div>
                          <small>{rt.desc}</small>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="control-group">
                    <label className="control-label">
                      <span>Research Add-ons & Data Services</span>
                    </label>
                    <div className="addons-grid">
                      <label className={`addon-checkbox-card ${researchDataCollection ? "checked" : ""}`}>
                        <input
                          type="checkbox"
                          checked={researchDataCollection}
                          onChange={(e) => setResearchDataCollection(e.target.checked)}
                        />
                        <div className="addon-info">
                          <strong>Include Primary Data Collection Fee</strong>
                          <small>Google forms questionnaire design, targeted response distribution & collection</small>
                        </div>
                        <span className="addon-fee">+ LKR 4,500 – 6,000</span>
                      </label>

                      <label className={`addon-checkbox-card ${researchStatsAnalysis ? "checked" : ""}`}>
                        <input
                          type="checkbox"
                          checked={researchStatsAnalysis}
                          onChange={(e) => setResearchStatsAnalysis(e.target.checked)}
                        />
                        <div className="addon-info">
                          <strong>Include Statistical Tool Analysis (SPSS / SmartPLS)</strong>
                          <small>Reliability testing, regression models, mediation/moderation hypotheses & write-up</small>
                        </div>
                        <span className="addon-fee">+ LKR 8,000 – 10,000</span>
                      </label>
                    </div>
                  </div>
                </>
              )}

              {/* Category 3: Web Development */}
              {category === "web" && (
                <>
                  <div className="control-group">
                    <label className="control-label">
                      <span>2. Select Web Project Complexity</span>
                    </label>
                    <div className="selector-grid selector-vertical">
                      {WEB_TIERS.map((wt) => (
                        <button
                          type="button"
                          key={wt.key}
                          className={`selector-btn ${webTier === wt.key ? "active" : ""}`}
                          onClick={() => setWebTier(wt.key)}
                        >
                          <div className="selector-btn-header">
                            <strong>{wt.label}</strong>
                            <span className="selector-price-badge">
                              LKR {wt.min.toLocaleString()} – {wt.max.toLocaleString()}
                            </span>
                          </div>
                          <small>{wt.desc}</small>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="control-group">
                    <label className="control-label">
                      <span>Optional Documentation Add-on</span>
                    </label>
                    <div className="addons-grid">
                      <label className={`addon-checkbox-card ${webDocumentation ? "checked" : ""}`}>
                        <input
                          type="checkbox"
                          checked={webDocumentation}
                          onChange={(e) => setWebDocumentation(e.target.checked)}
                        />
                        <div className="addon-info">
                          <strong>Full Project Report & Architecture Documentation</strong>
                          <small>ERD, architecture diagram, API documentation, testing report & viva slides</small>
                        </div>
                        <span className="addon-fee">+ LKR 4,000 – 5,000</span>
                      </label>
                    </div>
                  </div>
                </>
              )}

              {/* Category 4: Mobile Apps */}
              {category === "mobile" && (
                <>
                  <div className="control-group">
                    <label className="control-label">
                      <span>2. Select Mobile App Scope</span>
                    </label>
                    <div className="selector-grid selector-vertical">
                      {MOBILE_TIERS.map((mt) => (
                        <button
                          type="button"
                          key={mt.key}
                          className={`selector-btn ${mobileTier === mt.key ? "active" : ""}`}
                          onClick={() => setMobileTier(mt.key)}
                        >
                          <div className="selector-btn-header">
                            <strong>{mt.label}</strong>
                            <span className="selector-price-badge">
                              LKR {mt.min.toLocaleString()} – {mt.max.toLocaleString()}
                            </span>
                          </div>
                          <small>{mt.desc}</small>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="control-group">
                    <label className="control-label">
                      <span>Optional Documentation Add-on</span>
                    </label>
                    <div className="addons-grid">
                      <label className={`addon-checkbox-card ${mobileDocumentation ? "checked" : ""}`}>
                        <input
                          type="checkbox"
                          checked={mobileDocumentation}
                          onChange={(e) => setMobileDocumentation(e.target.checked)}
                        />
                        <div className="addon-info">
                          <strong>Full Mobile App Documentation & Viva Presentation</strong>
                          <small>Complete SRS report, system architecture, database schema & demo slides</small>
                        </div>
                        <span className="addon-fee">+ LKR 4,000 – 5,000</span>
                      </label>
                    </div>
                  </div>
                </>
              )}

              {/* Category 5: Presentations */}
              {category === "presentation" && (
                <>
                  <div className="control-group">
                    <label className="control-label">
                      <span>2. Select Slide Design Level</span>
                    </label>
                    <div className="selector-grid selector-scopes">
                      {PRESENTATION_STYLES.map((ps) => (
                        <button
                          type="button"
                          key={ps.key}
                          className={`selector-btn ${presentationStyle === ps.key ? "active" : ""}`}
                          onClick={() => setPresentationStyle(ps.key)}
                        >
                          <strong>{ps.label}</strong>
                          <small>{ps.desc}</small>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="control-group">
                    <label className="control-label">
                      <span>3. Number of Slides: <strong>{slideCount} Slides</strong></span>
                    </label>
                    <div className="slide-counter-wrapper">
                      <div className="slide-counter-controls">
                        <button
                          type="button"
                          className="counter-btn"
                          onClick={() => setSlideCount((c) => Math.max(5, c - 1))}
                          aria-label="Decrease slide count"
                        >
                          <Minus size={18} />
                        </button>
                        <div className="counter-display">
                          <span className="counter-number">{slideCount}</span>
                          <span className="counter-unit">SLIDES</span>
                        </div>
                        <button
                          type="button"
                          className="counter-btn"
                          onClick={() => setSlideCount((c) => Math.min(60, c + 1))}
                          aria-label="Increase slide count"
                        >
                          <Plus size={18} />
                        </button>
                      </div>

                      <div className="slide-preset-chips">
                        {[10, 15, 20, 25, 30, 40].map((num) => (
                          <button
                            type="button"
                            key={num}
                            className={`preset-chip ${slideCount === num ? "active" : ""}`}
                            onClick={() => setSlideCount(num)}
                          >
                            {num} slides
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="control-group">
                    <label className="control-label">
                      <span>Optional Script Add-on</span>
                    </label>
                    <div className="addons-grid">
                      <label className={`addon-checkbox-card ${presentationNotes ? "checked" : ""}`}>
                        <input
                          type="checkbox"
                          checked={presentationNotes}
                          onChange={(e) => setPresentationNotes(e.target.checked)}
                        />
                        <div className="addon-info">
                          <strong>Include Word-for-Word Viva Speech Script</strong>
                          <small>Complete spoken cue notes written for each slide to practice your presentation</small>
                        </div>
                        <span className="addon-fee">+ LKR 800</span>
                      </label>
                    </div>
                  </div>
                </>
              )}

              {/* Category 6: Data & Statistics */}
              {category === "analysis" && (
                <>
                  <div className="control-group">
                    <label className="control-label">
                      <span>2. Select Analysis Software & Scope</span>
                    </label>
                    <div className="selector-grid selector-vertical">
                      {ANALYSIS_METHODS.map((am) => (
                        <button
                          type="button"
                          key={am.key}
                          className={`selector-btn ${analysisMethod === am.key ? "active" : ""}`}
                          onClick={() => setAnalysisMethod(am.key)}
                        >
                          <div className="selector-btn-header">
                            <strong>{am.label}</strong>
                            <span className="selector-price-badge">
                              LKR {am.min.toLocaleString()} – {am.max.toLocaleString()}
                            </span>
                          </div>
                          <small>{am.desc}</small>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="control-group">
                    <label className="control-label">
                      <span>Optional Data Entry Add-on</span>
                    </label>
                    <div className="addons-grid">
                      <label className={`addon-checkbox-card ${analysisDataEntry ? "checked" : ""}`}>
                        <input
                          type="checkbox"
                          checked={analysisDataEntry}
                          onChange={(e) => setAnalysisDataEntry(e.target.checked)}
                        />
                        <div className="addon-info">
                          <strong>Raw Questionnaire Coding & Data Entry</strong>
                          <small>Manual variable coding and entry from printed or online forms into SPSS/Excel dataset</small>
                        </div>
                        <span className="addon-fee">+ LKR 3,000 – 4,500</span>
                      </label>
                    </div>
                  </div>
                </>
              )}

              {/* Category 7: UI/UX & Specialized Tasks */}
              {category === "other" && (
                <div className="control-group">
                  <label className="control-label">
                    <span>2. Select Specialized Assignment Type</span>
                  </label>
                  <div className="selector-grid selector-vertical">
                    {OTHER_SERVICES.map((os) => (
                      <button
                        type="button"
                        key={os.key}
                        className={`selector-btn ${otherService === os.key ? "active" : ""}`}
                        onClick={() => setOtherService(os.key)}
                      >
                        <div className="selector-btn-header">
                          <strong>{os.label}</strong>
                          <span className="selector-price-badge">
                            LKR {os.min.toLocaleString()} – {os.max.toLocaleString()}
                          </span>
                        </div>
                        <small>{os.desc}</small>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Universal Step: Turnaround Time */}
            <div className="control-group">
              <label className="control-label">
                <span>Select Required Turnaround Time</span>
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

          {/* Sticky Result Panel */}
          <div className="estimator-result-panel">
            <div className="result-kicker">
              <Sparkles size={16} />
              <span>ESTIMATED PRICE RANGE</span>
            </div>

            <div className="result-price">
              <small>Starting from</small>
              <strong>LKR {calculation.min} – {calculation.max}</strong>
              <div className="result-selection-summary">
                <span>{calculation.summary}</span>
              </div>
              <span className="turnaround-tag">
                <Clock3 size={14} /> Expected turnaround: {calculation.turnaround}
              </span>
            </div>

            <div className="result-features">
              <span>Included at this price:</span>
              <ul>
                {isSoftwareOrWeb ? (
                  <>
                    <li><Check size={14} /> Clean, well-commented source code</li>
                    <li><Check size={14} /> Step-by-step setup guide & execution demo</li>
                    <li><Check size={14} /> 7 days free bug fixes & minor revisions</li>
                    <li><Check size={14} /> Private workspace & live progress tracking</li>
                  </>
                ) : isPresentation ? (
                  <>
                    <li><Check size={14} /> Editable PowerPoint (.pptx) & PDF</li>
                    <li><Check size={14} /> Custom academic or corporate visual theme</li>
                    <li><Check size={14} /> 7 days free slide tweaks & revisions</li>
                    <li><Check size={14} /> Direct WhatsApp support for quick edits</li>
                  </>
                ) : (
                  <>
                    <li><Check size={14} /> Free Turnitin similarity & AI originality report</li>
                    <li><Check size={14} /> Harvard / APA / IEEE referencing included</li>
                    <li><Check size={14} /> 7 days free unlimited revisions</li>
                    <li><Check size={14} /> Private workspace & live progress tracking</li>
                  </>
                )}
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
              * Final quote is verified once StHelp reviews your assignment rubric & datasets. Zero payment is taken upfront.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
