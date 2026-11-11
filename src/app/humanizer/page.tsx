import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  Cpu,
  FileCheck2,
  Layers,
  ShieldCheck,
  Sparkles,
  Wand2
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { TrustGuarantees } from "@/components/TrustGuarantees";
import { getPublicContent } from "@/lib/data";
import { getHumanizerPlans } from "@/lib/humanizer-admin-store";
import { publicSiteUrl } from "@/lib/site-url";
import { HumanizerStudio } from "./HumanizerStudio";

export const metadata: Metadata = {
  title: "VerbaFlow™ Advanced AI Content Humanizer & Turnitin Polish | StHelp",
  description:
    "Transform robotic ChatGPT, Claude, and Gemini drafts into natural, high-burstiness academic prose. Includes a limited-credit Free tier plus Academic Pro and Dissertation Ultra plans with 100% APA/Harvard citation shielding.",
  alternates: { canonical: "/humanizer" },
  keywords: [
    "AI humanizer Sri Lanka",
    "academic AI text humanizer",
    "Turnitin AI bypass tool",
    "humanize ChatGPT essay",
    "StHelp VerbaFlow",
    "burstiness and perplexity optimizer"
  ],
  openGraph: {
    title: "StHelp VerbaFlow™ — Advanced Academic AI Content Humanizer",
    description:
      "Restructure AI-generated essays, literature reviews, and dissertations into authentic scholarly prose while keeping all citations intact.",
    url: "/humanizer",
    type: "website"
  }
};

export const dynamic = "force-dynamic";

const engineSteps = [
  {
    number: "01",
    title: "Citation & Statistical Data Shield™",
    copy: "Before touching a single word, VerbaFlow™ locks your APA, Harvard, and IEEE references, direct quotes, and statistical values (p < 0.05) so your bibliography and empirical data never break.",
    icon: ShieldCheck
  },
  {
    number: "02",
    title: "LLM Watermark & Cliché Eradication",
    copy: "Scans for over 250 predictable AI tokens ('delve into', 'tapestry', 'underscores', 'moreover', participial -ing tails) and replaces them with discipline-specific academic phrasing.",
    icon: Wand2
  },
  {
    number: "03",
    title: "Burstiness & Syntactic Rhythm Engineering",
    copy: "AI detectors flag uniform 20-word sentences. Our engine dynamically varies clause lengths, splits predictable compound tails, and introduces authentic scholarly cadence.",
    icon: Cpu
  },
  {
    number: "04",
    title: "Forensic Heatmap & Clause-Level Studio",
    copy: "Inspect your before-and-after Human Originality score, sentence-by-sentence AI risk heatmap, and click any sentence to swap between 3 alternative academic rewrites.",
    icon: Layers
  }
];

export default async function HumanizerPage() {
  const [{ settings }, plans] = await Promise.all([
    getPublicContent(),
    getHumanizerPlans()
  ]);
  const whatsapp = String(settings.whatsapp_number || "").replace(/\D/g, "");
  const siteUrl = publicSiteUrl();

  return (
    <main className="page-shell humanizer-page public-site-v2">
      <SiteHeader whatsapp={whatsapp} />

      {/* Hero Section */}
      <section className="humanizer-hero" aria-label="VerbaFlow AI Humanizer Hero">
        <div className="humanizer-hero-orb" aria-hidden="true" />
        <div className="container humanizer-hero-inner">
          <div className="humanizer-hero-copy">
            <span className="eyebrow">
              <Sparkles size={14} style={{ verticalAlign: "middle", marginRight: 6 }} />
              STHELP VERBAFLOW™ · ACADEMIC AI HUMANIZER STUDIO
            </span>
            <h1>
              Turn robotic AI drafts into <em>authentic scholarship.</em>
            </h1>
            <p className="humanizer-hero-lead">
              Built specifically for university essays, literature reviews, and dissertations. Eliminate predictable LLM footprints, boost sentence burstiness, and protect 100% of your APA, Harvard, and IEEE citations.
            </p>
            <div className="humanizer-hero-badges">
              <span>
                <CheckCircle2 size={16} /> {plans.free.dailyCredits} Free Daily Credits Included
              </span>
              <span>
                <ShieldCheck size={16} /> 100% Citation &amp; Stats Lock
              </span>
              <span>
                <FileCheck2 size={16} /> {plans.pro.name} &amp; {plans.ultra.name} Editions
              </span>
            </div>
          </div>

          <aside className="humanizer-hero-aside" aria-label="Quick edition overview">
            <div className="hero-edition-row">
              <span className="edition-tag free">Free</span>
              <div>
                <strong>{plans.free.name} ({plans.free.badge})</strong>
                <small>{plans.free.dailyCredits} credits/day · {plans.free.maxWordsPerRun.toLocaleString()} words/run</small>
              </div>
            </div>
            <div className="hero-edition-row">
              <span className="edition-tag pro">Pro</span>
              <div>
                <strong>{plans.pro.name} · {plans.pro.priceLkr}</strong>
                <small>{plans.pro.dailyCredits} credits · {plans.pro.maxWordsPerRun.toLocaleString()} words/run · Deep Stealth</small>
              </div>
            </div>
            <div className="hero-edition-row">
              <span className="edition-tag ultra">Ultra</span>
              <div>
                <strong>{plans.ultra.name} · {plans.ultra.priceLkr}</strong>
                <small>{plans.ultra.dailyCredits} credits · {plans.ultra.maxWordsPerRun.toLocaleString()} words/run · Term Freeze</small>
              </div>
            </div>
            <a href="#humanizer-plans" className="hero-compare-link">
              Compare Free, Pro &amp; Ultra editions <ArrowRight size={15} />
            </a>
          </aside>
        </div>
      </section>

      {/* Main Interactive Humanizer Studio + 3-Tier Plans */}
      <HumanizerStudio whatsapp={whatsapp} initialPlans={plans} />

      {/* How the Engine Works */}
      <section className="section humanizer-methodology-section" data-public-reveal>
        <div className="container">
          <div className="humanizer-section-heading">
            <div>
              <span className="eyebrow">LINGUISTIC FORENSICS &amp; RESTRUCTURING</span>
              <h2>Why generic spinners fail—and how VerbaFlow™ works.</h2>
            </div>
            <p>
              Basic synonym spinners destroy academic meaning and corrupt citations. VerbaFlow™ restructures syntax at the clause level while preserving scholarly rigor.
            </p>
          </div>

          <div className="humanizer-steps-grid">
            {engineSteps.map(({ number, title, copy, icon: Icon }) => (
              <article className="humanizer-step-card" key={number}>
                <div className="step-card-top">
                  <span className="step-num">{number}</span>
                  <span className="step-icon">
                    <Icon size={21} strokeWidth={1.8} />
                  </span>
                </div>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Guarantee Highlights */}
      <TrustGuarantees />

      {/* Human Editor + Official Turnitin CTA Banner */}
      <section className="humanizer-human-cta">
        <div className="container humanizer-human-cta-inner">
          <div>
            <span className="eyebrow" style={{ color: "#f7d27e" }}>
              NEED 100% MANUAL REWRITING + OFFICIAL TURNITIN REPORT?
            </span>
            <h2>Let our academic editors rewrite &amp; certify your paper.</h2>
            <p>
              For high-stakes final year dissertations and postgraduate submissions, StHelp’s subject specialists provide complete manual human rewriting paired with an official Turnitin similarity and AI originality certificate.
            </p>
          </div>
          <div className="humanizer-human-cta-actions">
            <Link
              className="btn btn-coral"
              href={`/place-assignment?fromCalc=1&cat=turnitin&catLabel=${encodeURIComponent(
                "Turnitin & AI Rewrite"
              )}&title=${encodeURIComponent(
                "Manual Academic AI Rewrite & Official Turnitin Clearance"
              )}&level=Undergraduate%20%2F%20Degree&urgency=Standard%20Pace&min=2,500&max=3,500&rawMin=2500&rawMax=3500`}
            >
              <span>Book Manual Rewrite &amp; Turnitin Check</span>
              <ArrowRight size={18} />
            </Link>
            <Link className="btn btn-light" href="/calculator">
              <span>Open Price Calculator</span>
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter settings={settings} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "StHelp VerbaFlow™ Advanced Academic AI Humanizer",
            applicationCategory: "EducationalApplication",
            operatingSystem: "Web",
            url: `${siteUrl}/humanizer`,
            description:
              "Advanced academic AI content humanizer and linguistic forensics studio with citation shielding, burstiness optimization, and Free, Academic Pro, and Dissertation Ultra tiers.",
            offers: [
              {
                "@type": "Offer",
                name: "Starter Free (Limited Credit)",
                price: "0",
                priceCurrency: "LKR"
              },
              {
                "@type": "Offer",
                name: "Academic Pro",
                price: "1900",
                priceCurrency: "LKR"
              },
              {
                "@type": "Offer",
                name: "Dissertation Ultra",
                price: "4500",
                priceCurrency: "LKR"
              }
            ]
          })
        }}
      />
    </main>
  );
}

