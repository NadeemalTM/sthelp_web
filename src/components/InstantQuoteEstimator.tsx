"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Calculator,
  Check,
  Clock3,
  Minus,
  Plus,
  Sparkles
} from "lucide-react";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";

export type CategoryKey =
  | "report"
  | "research"
  | "web"
  | "mobile"
  | "uiux"
  | "database"
  | "engineering"
  | "analysis"
  | "presentation"
  | "business"
  | "law_nursing"
  | "turnitin";

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
    key: "uiux",
    label: "UI/UX & Figma",
    badge: "Prototypes",
    icon: "🎨",
    desc: "Mobile/Web Wireframes, Figma Prototypes & Design Systems"
  },
  {
    key: "database",
    label: "Database & Systems",
    badge: "SQL & ERD",
    icon: "🗄️",
    desc: "Relational Schemas, ERDs, Complex SQL, UML & SRS Docs"
  },
  {
    key: "engineering",
    label: "Engineering & Simulation",
    badge: "Cisco & MATLAB",
    icon: "🔌",
    desc: "Cisco Packet Tracer, MATLAB, AutoCAD & SolidWorks"
  },
  {
    key: "analysis",
    label: "Data & Statistics",
    badge: "SPSS & SmartPLS",
    icon: "📊",
    desc: "SPSS, SmartPLS, Advanced Excel Modeling & Python/R"
  },
  {
    key: "presentation",
    label: "Presentations",
    badge: "Per-slide rate",
    icon: "📑",
    desc: "PowerPoint & Canva Decks for Viva, Pitches & Class"
  },
  {
    key: "business",
    label: "Business & Finance",
    badge: "Finance & Strategy",
    icon: "💼",
    desc: "Case Studies, Financial Valuation, Ratios & Business Plans"
  },
  {
    key: "law_nursing",
    label: "Law & Healthcare",
    badge: "OSCOLA & Clinical",
    icon: "⚖️",
    desc: "Legal Problem Questions, Nursing Care Plans & Clinical Reviews"
  },
  {
    key: "turnitin",
    label: "Turnitin & AI Rewrite",
    badge: "Humanize & Polish",
    icon: "✍️",
    desc: "Turnitin Similarity Reduction, AI Humanizer & Proofreading"
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
    key: "prisma",
    label: "Systematic Literature Review (PRISMA Framework)",
    desc: "Structured search strategy, inclusion/exclusion matrix & qualitative synthesis",
    min: 10000,
    max: 15000
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
  },
  {
    key: "web_api",
    label: "RESTful API & Microservices Backend",
    desc: "Node/Express, FastAPI or Spring Boot with JWT authentication & Swagger docs",
    min: 10000,
    max: 16000
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

// --- 5. UI/UX Design options ---
const UIUX_TIERS = [
  {
    key: "ui_landing",
    label: "Landing Page & Web Wireframes (3–5 Screens)",
    desc: "Modern Figma layout, responsive auto-layout, wireframes & component styles",
    min: 4500,
    max: 6500
  },
  {
    key: "ui_app",
    label: "Complete Mobile App UI (10–15 Screens)",
    desc: "High-fidelity mobile UI screens, typography tokens, icons & design library",
    min: 7500,
    max: 12000
  },
  {
    key: "ui_prototype",
    label: "Full Web/App Clickable Interactive Prototype",
    desc: "Interactive Figma prototype with realistic micro-interactions & user journeys",
    min: 10000,
    max: 16000
  },
  {
    key: "ui_fyp",
    label: "Final Year Project (FYP) Design System + Usability Report",
    desc: "Complete component system, color tokens, SUS usability testing & UX evaluation",
    min: 14000,
    max: 22000
  }
];

// --- 6. Database & Systems options ---
const DATABASE_TIERS = [
  {
    key: "db_erd",
    label: "Database Design, ERD & Normalization (1NF–BCNF)",
    desc: "Entity-Relationship Diagrams, Relational Schema, dependency diagrams & 3NF normalization",
    min: 4500,
    max: 7000
  },
  {
    key: "db_sql",
    label: "Advanced SQL Database & Business Logic",
    desc: "Complex nested queries, Stored Procedures, Triggers, Views & Index optimization",
    min: 6000,
    max: 9500
  },
  {
    key: "db_srs",
    label: "Software Requirements Specification (SRS) Document",
    desc: "IEEE 830 formatted SRS, functional/non-functional requirements & acceptance criteria",
    min: 6500,
    max: 10000
  },
  {
    key: "db_uml",
    label: "Full UML System Architecture Suite",
    desc: "Use Case, Class, Sequence, Activity, State Machine & Deployment diagrams",
    min: 6500,
    max: 11000
  },
  {
    key: "db_nosql",
    label: "NoSQL & MongoDB Architecture",
    desc: "Document modeling, aggregation pipelines, indexing & Node/Python integration",
    min: 7500,
    max: 12000
  }
];

// --- 7. Engineering & Simulation options ---
const ENGINEERING_TIERS = [
  {
    key: "eng_cisco",
    label: "Cisco Packet Tracer Network Design & Topology",
    desc: "VLANs, Inter-VLAN routing, OSPF/EIGRP, NAT, DHCP & Access Control Lists (ACLs)",
    min: 6500,
    max: 10000
  },
  {
    key: "eng_matlab",
    label: "MATLAB & Simulink Modeling & Simulation",
    desc: "Mathematical modeling, control systems, signal processing & algorithm simulation",
    min: 8000,
    max: 14000
  },
  {
    key: "eng_autocad",
    label: "AutoCAD 2D/3D Engineering Drafting",
    desc: "Architectural floor plans, structural sections, elevations & mechanical drawings",
    min: 7000,
    max: 12000
  },
  {
    key: "eng_solidworks",
    label: "SolidWorks CAD 3D Mechanical Modeling",
    desc: "3D part modeling, mechanical assembly, motion study & exploded views",
    min: 8500,
    max: 15000
  },
  {
    key: "eng_iot",
    label: "IoT & Embedded Simulation (Arduino / Proteus)",
    desc: "Microcontroller circuits, sensor interfacing, C/C++ firmware & Proteus/Tinkercad test",
    min: 8000,
    max: 13000
  }
];

// --- 8. Data Analysis options ---
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
    key: "powerbi",
    label: "Power BI / Tableau Interactive BI Dashboards",
    desc: "Data modeling, DAX measures, automated ETL pipeline & executive interactive dashboards",
    min: 9000,
    max: 14000
  },
  {
    key: "python_r",
    label: "Python / R Data Science & Visualizations",
    desc: "Exploratory data analysis, predictive statistical models, Seaborn/Matplotlib visual charts",
    min: 12000,
    max: 16000
  }
];

// --- 9. Presentation options ---
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
  },
  {
    key: "viva",
    label: "Final Year Viva Defense Master Deck",
    rate: 200,
    desc: "LKR 200 / slide • High-impact academic defense presentation + question anticipation"
  }
];

// --- 10. Business & Finance options ---
const BUSINESS_TIERS = [
  {
    key: "biz_case",
    label: "Business Case Study & Strategic Analysis",
    desc: "SWOT, PESTEL, Porter's Five Forces, VRIO & strategic management recommendations",
    min: 4000,
    max: 7000
  },
  {
    key: "biz_finance",
    label: "Financial Statement Analysis & Ratios",
    desc: "Liquidity, profitability, solvency, efficiency ratios & executive commentary",
    min: 5000,
    max: 8500
  },
  {
    key: "biz_valuation",
    label: "Investment Appraisal & Financial Valuation",
    desc: "DCF modeling, NPV, IRR, Payback Period & financial sensitivity analysis",
    min: 6500,
    max: 10500
  },
  {
    key: "biz_plan",
    label: "Comprehensive Business Plan & Marketing Strategy",
    desc: "Executive summary, 4Ps/7Ps marketing mix, operational plan & 3-year financial forecast",
    min: 8000,
    max: 14000
  }
];

// --- 11. Law & Healthcare options ---
const LAW_NURSING_TIERS = [
  {
    key: "law_problem",
    label: "Legal Problem Question & Case Brief (OSCOLA)",
    desc: "IRAC methodology (Issue, Rule, Application, Conclusion) with primary UK/Sri Lankan case law",
    min: 4500,
    max: 7500
  },
  {
    key: "nursing_care",
    label: "Nursing Care Plan & Clinical Interventions",
    desc: "NANDA-I nursing diagnoses, SMART goals, evidence-based interventions & evaluations",
    min: 4500,
    max: 7500
  },
  {
    key: "nursing_reflection",
    label: "Healthcare Clinical Reflection (Gibbs / Johns)",
    desc: "Reflective cycle analysis, personal professional practice & clinical competency links",
    min: 4000,
    max: 6500
  },
  {
    key: "healthcare_review",
    label: "Evidence-Based Healthcare Critical Review",
    desc: "Critical appraisal of clinical trials, CASP checklists & healthcare policy evaluation",
    min: 6500,
    max: 10000
  }
];

// --- 12. Turnitin & AI Rewrite options ---
const TURNITIN_TIERS = [
  {
    key: "turn_2500",
    label: "Up to 2,500 Words AI & Similarity Reduction",
    desc: "Thorough human rewriting & phrasing to reduce Turnitin similarity and AI score to under 10%",
    min: 2500,
    max: 3500
  },
  {
    key: "turn_5000",
    label: "Up to 5,000 Words AI & Similarity Reduction",
    desc: "Complete coursework/report rewrite, academic tone preservation & reference retention",
    min: 4500,
    max: 6500
  },
  {
    key: "turn_10000",
    label: "Up to 10,000 Words Full Dissertation Rewrite",
    desc: "Comprehensive dissertation polishing, humanization, syntax restructuring & Turnitin clearance",
    min: 8500,
    max: 13000
  },
  {
    key: "turn_proofread",
    label: "Academic Proofreading & Harvard/APA Formatting",
    desc: "Grammar, sentence flow, academic vocabulary, citation cross-checking & typography cleanup",
    min: 2000,
    max: 4000
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

  const [uiuxTier, setUiuxTier] = useState<string>("ui_app");
  const [uiuxUserTesting, setUiuxUserTesting] = useState<boolean>(false);

  const [databaseTier, setDatabaseTier] = useState<string>("db_sql");
  const [databaseTestData, setDatabaseTestData] = useState<boolean>(false);

  const [engineeringTier, setEngineeringTier] = useState<string>("eng_cisco");
  const [engineeringVideoDemo, setEngineeringVideoDemo] = useState<boolean>(false);

  const [analysisMethod, setAnalysisMethod] = useState<string>("spss");
  const [analysisDataEntry, setAnalysisDataEntry] = useState<boolean>(false);

  const [presentationStyle, setPresentationStyle] = useState<string>("standard");
  const [slideCount, setSlideCount] = useState<number>(15);
  const [presentationNotes, setPresentationNotes] = useState<boolean>(false);

  const [businessTier, setBusinessTier] = useState<string>("biz_case");
  const [businessExcelModel, setBusinessExcelModel] = useState<boolean>(false);

  const [lawNursingTier, setLawNursingTier] = useState<string>("law_problem");
  const [lawCitationsBundle, setLawCitationsBundle] = useState<boolean>(false);

  const [turnitinTier, setTurnitinTier] = useState<string>("turn_2500");
  const [turnitinCertificate, setTurnitinCertificate] = useState<boolean>(false);

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
    } else if (category === "uiux") {
      const match = UIUX_TIERS.find((u) => u.key === uiuxTier) || UIUX_TIERS[1];
      baseMin = match.min;
      baseMax = match.max;
      categorySummary = `UI/UX: ${match.label}`;

      if (uiuxUserTesting) {
        baseMin += 3000;
        baseMax += 4000;
      }
    } else if (category === "database") {
      const match = DATABASE_TIERS.find((d) => d.key === databaseTier) || DATABASE_TIERS[1];
      baseMin = match.min;
      baseMax = match.max;
      categorySummary = `Database / System: ${match.label}`;

      if (databaseTestData) {
        baseMin += 2500;
        baseMax += 3500;
      }
    } else if (category === "engineering") {
      const match = ENGINEERING_TIERS.find((e) => e.key === engineeringTier) || ENGINEERING_TIERS[0];
      baseMin = match.min;
      baseMax = match.max;
      categorySummary = `Engineering: ${match.label}`;

      if (engineeringVideoDemo) {
        baseMin += 3000;
        baseMax += 4000;
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
    } else if (category === "business") {
      const match = BUSINESS_TIERS.find((b) => b.key === businessTier) || BUSINESS_TIERS[0];
      baseMin = match.min;
      baseMax = match.max;
      categorySummary = `Business/Finance: ${match.label}`;

      if (businessExcelModel) {
        baseMin += 2500;
        baseMax += 3500;
      }
    } else if (category === "law_nursing") {
      const match = LAW_NURSING_TIERS.find((l) => l.key === lawNursingTier) || LAW_NURSING_TIERS[0];
      baseMin = match.min;
      baseMax = match.max;
      categorySummary = `Law/Healthcare: ${match.label}`;

      if (lawCitationsBundle) {
        baseMin += 2000;
        baseMax += 3000;
      }
    } else if (category === "turnitin") {
      const match = TURNITIN_TIERS.find((t) => t.key === turnitinTier) || TURNITIN_TIERS[0];
      baseMin = match.min;
      baseMax = match.max;
      categorySummary = `Turnitin Polish: ${match.label}`;

      if (turnitinCertificate) {
        baseMin += 1000;
        baseMax += 1500;
      }
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
    uiuxTier,
    uiuxUserTesting,
    databaseTier,
    databaseTestData,
    engineeringTier,
    engineeringVideoDemo,
    analysisMethod,
    analysisDataEntry,
    presentationStyle,
    slideCount,
    presentationNotes,
    businessTier,
    businessExcelModel,
    lawNursingTier,
    lawCitationsBundle,
    turnitinTier,
    turnitinCertificate
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
  } else if (category === "uiux" && uiuxUserTesting) {
    addOnsList.push("Usability Testing & Personas Report");
  } else if (category === "database" && databaseTestData) {
    addOnsList.push("Realistic Test Data Generation");
  } else if (category === "engineering" && engineeringVideoDemo) {
    addOnsList.push("Simulation Video Walkthrough & Report");
  } else if (category === "analysis" && analysisDataEntry) {
    addOnsList.push("Raw Questionnaire Data Entry");
  } else if (category === "presentation" && presentationNotes) {
    addOnsList.push("Full Viva Speech Notes");
  } else if (category === "business" && businessExcelModel) {
    addOnsList.push("Excel Financial Models");
  } else if (category === "law_nursing" && lawCitationsBundle) {
    addOnsList.push("Authorities & Citations Bundle");
  } else if (category === "turnitin" && turnitinCertificate) {
    addOnsList.push("Official Turnitin Certificate");
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

  const orderParams = new URLSearchParams({
    fromCalc: "1",
    cat: category,
    catLabel: activeCategoryMeta.label,
    title: calculation.summary,
    level: activeLevelMeta.label,
    urgency: activeUrgencyMeta.tag,
    min: calculation.min,
    max: calculation.max,
    turnaround: calculation.turnaround,
    addons: addOnsList.join(", ")
  });
  const orderHref = `/place-assignment?${orderParams.toString()}`;

  // Deliverables based on category
  const isCodeOrSystem = category === "web" || category === "mobile" || category === "database" || category === "engineering";
  const isPresentation = category === "presentation";
  const isUiUx = category === "uiux";

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
            Real Sri Lankan university rates across all assignment types — Reports, Dissertations, Web, Mobile, UI/UX, Engineering, SPSS, and Law.
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

              {/* Category 5: UI/UX & Figma */}
              {category === "uiux" && (
                <>
                  <div className="control-group">
                    <label className="control-label">
                      <span>2. Select UI/UX Design Level</span>
                    </label>
                    <div className="selector-grid selector-vertical">
                      {UIUX_TIERS.map((ut) => (
                        <button
                          type="button"
                          key={ut.key}
                          className={`selector-btn ${uiuxTier === ut.key ? "active" : ""}`}
                          onClick={() => setUiuxTier(ut.key)}
                        >
                          <div className="selector-btn-header">
                            <strong>{ut.label}</strong>
                            <span className="selector-price-badge">
                              LKR {ut.min.toLocaleString()} – {ut.max.toLocaleString()}
                            </span>
                          </div>
                          <small>{ut.desc}</small>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="control-group">
                    <label className="control-label">
                      <span>Optional UX Research Add-on</span>
                    </label>
                    <div className="addons-grid">
                      <label className={`addon-checkbox-card ${uiuxUserTesting ? "checked" : ""}`}>
                        <input
                          type="checkbox"
                          checked={uiuxUserTesting}
                          onChange={(e) => setUiuxUserTesting(e.target.checked)}
                        />
                        <div className="addon-info">
                          <strong>Usability Testing & User Personas Report</strong>
                          <small>User personas, empathy maps, task flows and System Usability Scale (SUS) analysis</small>
                        </div>
                        <span className="addon-fee">+ LKR 3,000</span>
                      </label>
                    </div>
                  </div>
                </>
              )}

              {/* Category 6: Database & Systems */}
              {category === "database" && (
                <>
                  <div className="control-group">
                    <label className="control-label">
                      <span>2. Select Database / Systems Requirement</span>
                    </label>
                    <div className="selector-grid selector-vertical">
                      {DATABASE_TIERS.map((dt) => (
                        <button
                          type="button"
                          key={dt.key}
                          className={`selector-btn ${databaseTier === dt.key ? "active" : ""}`}
                          onClick={() => setDatabaseTier(dt.key)}
                        >
                          <div className="selector-btn-header">
                            <strong>{dt.label}</strong>
                            <span className="selector-price-badge">
                              LKR {dt.min.toLocaleString()} – {dt.max.toLocaleString()}
                            </span>
                          </div>
                          <small>{dt.desc}</small>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="control-group">
                    <label className="control-label">
                      <span>Optional Dataset Add-on</span>
                    </label>
                    <div className="addons-grid">
                      <label className={`addon-checkbox-card ${databaseTestData ? "checked" : ""}`}>
                        <input
                          type="checkbox"
                          checked={databaseTestData}
                          onChange={(e) => setDatabaseTestData(e.target.checked)}
                        />
                        <div className="addon-info">
                          <strong>Include Realistic Synthetic Test Dataset (50–100 records)</strong>
                          <small>Populated mock tables ready to demonstrate query results and normalization proofs</small>
                        </div>
                        <span className="addon-fee">+ LKR 2,500</span>
                      </label>
                    </div>
                  </div>
                </>
              )}

              {/* Category 7: Engineering & Simulation */}
              {category === "engineering" && (
                <>
                  <div className="control-group">
                    <label className="control-label">
                      <span>2. Select Engineering Software & Tool</span>
                    </label>
                    <div className="selector-grid selector-vertical">
                      {ENGINEERING_TIERS.map((et) => (
                        <button
                          type="button"
                          key={et.key}
                          className={`selector-btn ${engineeringTier === et.key ? "active" : ""}`}
                          onClick={() => setEngineeringTier(et.key)}
                        >
                          <div className="selector-btn-header">
                            <strong>{et.label}</strong>
                            <span className="selector-price-badge">
                              LKR {et.min.toLocaleString()} – {et.max.toLocaleString()}
                            </span>
                          </div>
                          <small>{et.desc}</small>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="control-group">
                    <label className="control-label">
                      <span>Optional Simulation Walkthrough</span>
                    </label>
                    <div className="addons-grid">
                      <label className={`addon-checkbox-card ${engineeringVideoDemo ? "checked" : ""}`}>
                        <input
                          type="checkbox"
                          checked={engineeringVideoDemo}
                          onChange={(e) => setEngineeringVideoDemo(e.target.checked)}
                        />
                        <div className="addon-info">
                          <strong>Video Walkthrough & Simulation Verification Report</strong>
                          <small>Screen recorded execution proof explaining configuration parameters & ping/trace test results</small>
                        </div>
                        <span className="addon-fee">+ LKR 3,000</span>
                      </label>
                    </div>
                  </div>
                </>
              )}

              {/* Category 8: Data & Statistics */}
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

              {/* Category 9: Presentations */}
              {category === "presentation" && (
                <>
                  <div className="control-group">
                    <label className="control-label">
                      <span>2. Select Slide Design Level</span>
                    </label>
                    <div className="selector-grid selector-vertical">
                      {PRESENTATION_STYLES.map((ps) => (
                        <button
                          type="button"
                          key={ps.key}
                          className={`selector-btn ${presentationStyle === ps.key ? "active" : ""}`}
                          onClick={() => setPresentationStyle(ps.key)}
                        >
                          <div className="selector-btn-header">
                            <strong>{ps.label}</strong>
                            <span className="selector-price-badge">LKR {ps.rate} / slide</span>
                          </div>
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

              {/* Category 10: Business & Finance */}
              {category === "business" && (
                <>
                  <div className="control-group">
                    <label className="control-label">
                      <span>2. Select Business / Finance Task</span>
                    </label>
                    <div className="selector-grid selector-vertical">
                      {BUSINESS_TIERS.map((bt) => (
                        <button
                          type="button"
                          key={bt.key}
                          className={`selector-btn ${businessTier === bt.key ? "active" : ""}`}
                          onClick={() => setBusinessTier(bt.key)}
                        >
                          <div className="selector-btn-header">
                            <strong>{bt.label}</strong>
                            <span className="selector-price-badge">
                              LKR {bt.min.toLocaleString()} – {bt.max.toLocaleString()}
                            </span>
                          </div>
                          <small>{bt.desc}</small>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="control-group">
                    <label className="control-label">
                      <span>Optional Financial Model Add-on</span>
                    </label>
                    <div className="addons-grid">
                      <label className={`addon-checkbox-card ${businessExcelModel ? "checked" : ""}`}>
                        <input
                          type="checkbox"
                          checked={businessExcelModel}
                          onChange={(e) => setBusinessExcelModel(e.target.checked)}
                        />
                        <div className="addon-info">
                          <strong>Include Dynamic Excel Financial Valuation Model (.xlsx)</strong>
                          <small>Fully linked DCF/NPV spreadsheet with formulas, sensitivity tables and clean charts</small>
                        </div>
                        <span className="addon-fee">+ LKR 2,500</span>
                      </label>
                    </div>
                  </div>
                </>
              )}

              {/* Category 11: Law & Healthcare */}
              {category === "law_nursing" && (
                <>
                  <div className="control-group">
                    <label className="control-label">
                      <span>2. Select Law / Healthcare Task</span>
                    </label>
                    <div className="selector-grid selector-vertical">
                      {LAW_NURSING_TIERS.map((lt) => (
                        <button
                          type="button"
                          key={lt.key}
                          className={`selector-btn ${lawNursingTier === lt.key ? "active" : ""}`}
                          onClick={() => setLawNursingTier(lt.key)}
                        >
                          <div className="selector-btn-header">
                            <strong>{lt.label}</strong>
                            <span className="selector-price-badge">
                              LKR {lt.min.toLocaleString()} – {lt.max.toLocaleString()}
                            </span>
                          </div>
                          <small>{lt.desc}</small>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="control-group">
                    <label className="control-label">
                      <span>Optional Citations Add-on</span>
                    </label>
                    <div className="addons-grid">
                      <label className={`addon-checkbox-card ${lawCitationsBundle ? "checked" : ""}`}>
                        <input
                          type="checkbox"
                          checked={lawCitationsBundle}
                          onChange={(e) => setLawCitationsBundle(e.target.checked)}
                        />
                        <div className="addon-info">
                          <strong>Comprehensive OSCOLA Table of Authorities / Clinical Bibliography</strong>
                          <small>Full table of cases, legislation and peer-reviewed clinical guidelines</small>
                        </div>
                        <span className="addon-fee">+ LKR 2,000</span>
                      </label>
                    </div>
                  </div>
                </>
              )}

              {/* Category 12: Turnitin & AI Polish */}
              {category === "turnitin" && (
                <>
                  <div className="control-group">
                    <label className="control-label">
                      <span>2. Select Rewrite / Humanizing Scope</span>
                    </label>
                    <div className="selector-grid selector-vertical">
                      {TURNITIN_TIERS.map((tt) => (
                        <button
                          type="button"
                          key={tt.key}
                          className={`selector-btn ${turnitinTier === tt.key ? "active" : ""}`}
                          onClick={() => setTurnitinTier(tt.key)}
                        >
                          <div className="selector-btn-header">
                            <strong>{tt.label}</strong>
                            <span className="selector-price-badge">
                              LKR {tt.min.toLocaleString()} – {tt.max.toLocaleString()}
                            </span>
                          </div>
                          <small>{tt.desc}</small>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="control-group">
                    <label className="control-label">
                      <span>Optional Report Certificate</span>
                    </label>
                    <div className="addons-grid">
                      <label className={`addon-checkbox-card ${turnitinCertificate ? "checked" : ""}`}>
                        <input
                          type="checkbox"
                          checked={turnitinCertificate}
                          onChange={(e) => setTurnitinCertificate(e.target.checked)}
                        />
                        <div className="addon-info">
                          <strong>Include Turnitin Similarity & AI Originality PDF Certificate</strong>
                          <small>Official Turnitin scan report showing clean 0%–5% similarity and verified human writing</small>
                        </div>
                        <span className="addon-fee">+ LKR 1,000</span>
                      </label>
                    </div>
                  </div>
                </>
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
                {isCodeOrSystem ? (
                  <>
                    <li><Check size={14} /> Clean, well-commented source code / config</li>
                    <li><Check size={14} /> Step-by-step setup guide & execution demo</li>
                    <li><Check size={14} /> 7 days free bug fixes & minor revisions</li>
                    <li><Check size={14} /> Private workspace & live progress tracking</li>
                  </>
                ) : isUiUx ? (
                  <>
                    <li><Check size={14} /> Figma source file with organized components</li>
                    <li><Check size={14} /> Responsive layouts & interactive prototype link</li>
                    <li><Check size={14} /> 7 days free design tweaks & revisions</li>
                    <li><Check size={14} /> Direct designer consultation on WhatsApp</li>
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
                    <li><Check size={14} /> Harvard / APA / IEEE / OSCOLA referencing</li>
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
              <Link className="btn btn-estimator-online" href={orderHref}>
                <span>Place order with this estimate (LKR {calculation.min} – {calculation.max})</span>
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
