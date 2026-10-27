import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Calculator, CheckCircle2, FileCheck2, HelpCircle, ShieldCheck, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { InstantQuoteEstimator } from "@/components/InstantQuoteEstimator";
import { TrustGuarantees } from "@/components/TrustGuarantees";
import { getPublicContent } from "@/lib/data";

export const metadata: Metadata = {
  title: "Instant Assignment Price Calculator | StHelp Sri Lanka",
  description:
    "Calculate instant, transparent price estimates for university coursework, dissertations, full-stack web and mobile apps, SPSS data analysis, and presentations. No upfront payment required.",
  alternates: { canonical: "/calculator" }
};

export const dynamic = "force-dynamic";

export default async function CalculatorPage() {
  const { settings } = await getPublicContent();
  const whatsapp = String(settings.whatsapp_number || "").replace(/\D/g, "");

  return (
    <main className="page-shell calculator-page public-site-v2">
      <SiteHeader whatsapp={whatsapp} />

      <section className="request-hero" aria-label="Calculator hero">
        <div className="container request-hero-copy">
          <span className="eyebrow">
            <Calculator size={14} style={{ verticalAlign: "middle", marginRight: 6 }} />
            INSTANT ESTIMATE CALCULATOR
          </span>
          <h1>Calculate your assignment budget in seconds.</h1>
          <p className="lead">
            Transparent starting rates tailored for Sri Lankan university modules across reports, dissertations, full-stack web & mobile apps, data analysis, and presentations.
          </p>
          <div className="hero-proof" style={{ marginTop: 16 }}>
            <span><CheckCircle2 size={16} /> Zero upfront payment</span>
            <span><FileCheck2 size={16} /> Free Turnitin & AI report</span>
            <span><ShieldCheck size={16} /> 7 days free revisions</span>
          </div>
        </div>
      </section>

      {/* Main Interactive Calculator */}
      <InstantQuoteEstimator whatsapp={whatsapp} />

      {/* Trust & Guarantee highlights */}
      <TrustGuarantees />

      {/* How It Works & FAQs */}
      <section className="section" style={{ background: "#f8f5ec", borderTop: "1px solid rgba(24, 35, 30, .1)" }}>
        <div className="container" style={{ maxWidth: 840 }}>
          <div className="section-title" style={{ textAlign: "center", marginBottom: 36 }}>
            <span className="eyebrow">TRANSPARENT & HONEST PRICING</span>
            <h2>How our quotes work</h2>
            <p className="muted">Everything you need to know before continuing to your order.</p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <article className="card" style={{ padding: 22, background: "#fff", borderRadius: 14, border: "1px solid rgba(24, 35, 30, .12)" }}>
              <strong style={{ fontSize: "1.05rem", display: "block", marginBottom: 6, color: "var(--public-ink)" }}>
                1. Are these estimated prices final?
              </strong>
              <p style={{ margin: 0, fontSize: ".9rem", color: "rgba(24, 35, 30, .75)", lineHeight: 1.55 }}>
                The calculator provides real-world price ranges based on typical Sri Lankan university briefs. Once you submit your order, StHelp reviews your assignment rubric, datasets, and specific university instructions to confirm the exact price in your private portal. No payment is taken upfront.
              </p>
            </article>

            <article className="card" style={{ padding: 22, background: "#fff", borderRadius: 14, border: "1px solid rgba(24, 35, 30, .12)" }}>
              <strong style={{ fontSize: "1.05rem", display: "block", marginBottom: 6, color: "var(--public-ink)" }}>
                2. What happens after I click "Place order with this estimate"?
              </strong>
              <p style={{ margin: 0, fontSize: ".9rem", color: "rgba(24, 35, 30, .75)", lineHeight: 1.55 }}>
                Your calculated assignment scope, academic level, and price range will be carried over automatically to the order page. Once you submit, a private, secure client portal is instantly created for you to upload files, chat with StHelp, and track progress live.
              </p>
            </article>

            <article className="card" style={{ padding: 22, background: "#fff", borderRadius: 14, border: "1px solid rgba(24, 35, 30, .12)" }}>
              <strong style={{ fontSize: "1.05rem", display: "block", marginBottom: 6, color: "var(--public-ink)" }}>
                3. Are plagiarism checks and revisions included in the price?
              </strong>
              <p style={{ margin: 0, fontSize: ".9rem", color: "rgba(24, 35, 30, .75)", lineHeight: 1.55 }}>
                Yes! Every academic submission comes with a 100% free Turnitin similarity and AI originality report. You also receive 7 days of free unlimited revisions to ensure your work satisfies all rubric criteria.
              </p>
            </article>
          </div>

          <div style={{ textAlign: "center", marginTop: 38 }}>
            <Link className="btn btn-coral" href="#quote-calculator">
              <span>Calculate your estimate now</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter settings={settings} />
    </main>
  );
}
