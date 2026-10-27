import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, MessageSquareText, ShieldCheck, Sparkles, Star } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getPublicContent } from "@/lib/data";
import { publicSiteUrl } from "@/lib/site-url";
import { FeedbackPageClient } from "./FeedbackPageClient";

export const metadata: Metadata = {
  title: "Student Reviews & Client Feedback | StHelp Sri Lanka",
  description: "Read verified feedback and real reviews from university students across Sri Lanka who used StHelp assignment, coding, research and data support. Add your feedback.",
  alternates: { canonical: "/feedback" },
  keywords: [
    "StHelp reviews",
    "assignment support reviews Sri Lanka",
    "student feedback Sri Lanka",
    "university assignment help reviews",
    "StHelp client testimonials"
  ],
  openGraph: {
    title: "Student Reviews & Client Feedback | StHelp Sri Lanka",
    description: "Real reviews and ratings from Sri Lankan university students who used StHelp for assignment guidance and project support.",
    url: "/feedback",
    type: "website"
  }
};

export const dynamic = "force-dynamic";

export default async function FeedbackPage() {
  const { settings, testimonials } = await getPublicContent();
  const whatsapp = String(settings.whatsapp_number || "").replace(/\D/g, "");
  const siteUrl = publicSiteUrl();
  const organizationId = `${siteUrl}/#organization`;

  // Aggregate ratings for JSON-LD structured data
  const totalReviews = testimonials.length || 1;
  const avgRating = totalReviews > 0
    ? Number((testimonials.reduce((sum, t) => sum + (t.rating || 5), 0) / totalReviews).toFixed(1))
    : 5.0;

  return (
    <main className="page-shell feedback-page public-site-v2">
      <SiteHeader whatsapp={whatsapp} />

      {/* Hero Section */}
      <section className="support-hero feedback-hero">
        <div className="container">
          <div className="feedback-hero-content">
            <span className="eyebrow">
              <Sparkles size={14} style={{ display: "inline-block", verticalAlign: "middle", marginRight: 6 }} />
              Client Reviews & Community Feedback
            </span>
            <h1>
              Straightforward support,<br />
              <em>in our students&rsquo; words.</em>
            </h1>
            <p className="studio-lead">
              Every review below is shared by university students in Sri Lanka who needed assignment momentum, code guidance, report structuring, or research assistance.
            </p>

            <div className="feedback-hero-metrics">
              <div className="metric-pill">
                <Star size={16} fill="#e7bd63" stroke="#c29333" />
                <strong>{avgRating} / 5.0</strong>
                <span>Average Student Rating</span>
              </div>
              <div className="metric-pill">
                <CheckCircle2 size={16} color="#15805d" />
                <span>Verified Reviews</span>
              </div>
              <div className="metric-pill">
                <ShieldCheck size={16} color="#28684f" />
                <span>Transparent Moderation</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Hub: Form + Reviews Stream */}
      <section className="section feedback-hub-section">
        <div className="container">
          <FeedbackPageClient testimonials={testimonials} />
        </div>
      </section>

      {/* FAQ / Trust Information */}
      <section className="section feedback-faq-section">
        <div className="container">
          <div className="feedback-faq-header">
            <span className="eyebrow">Commitment to Integrity</span>
            <h2>How reviews work at StHelp</h2>
            <p className="muted">
              We believe students deserve honest, unmanipulated feedback when deciding where to seek academic guidance.
            </p>
          </div>

          <div className="feedback-faq-grid">
            <article className="faq-card">
              <div className="faq-icon"><ShieldCheck size={24} color="#15805d" /></div>
              <h3>Who can leave feedback?</h3>
              <p>
                Anyone who has requested assignment guidance, used our student resources, or collaborated with our tutors can submit feedback directly using the form above.
              </p>
            </article>

            <article className="faq-card">
              <div className="faq-icon"><MessageSquareText size={24} color="#28684f" /></div>
              <h3>Are submissions moderated?</h3>
              <p>
                Yes. To prevent spam, vulgarity, or competitors submitting malicious posts, our staff verifies each submission before it is published on the site.
              </p>
            </article>

            <article className="faq-card">
              <div className="faq-icon"><CheckCircle2 size={24} color="#ed6353" /></div>
              <h3>Can I review anonymously?</h3>
              <p>
                Yes. If you prefer privacy, leave the name field blank and your review will appear as &ldquo;Verified Student&rdquo; with your university tag.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="closing-section">
        <div className="container closing-inner">
          <div>
            <span className="eyebrow" style={{ color: "#ffad9f" }}>Experience it yourself</span>
            <h2>
              Ready for clear,<br />
              stress-free <em>assignment support?</em>
            </h2>
            <p>
              Send your brief today and track your quote, progress updates and protected deliverables in one private portal.
            </p>
          </div>
          <div className="closing-actions">
            <Link className="btn btn-light" href="/place-assignment">
              Place an assignment <ArrowRight size={18} />
            </Link>
            {whatsapp ? (
              <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer">
                Prefer WhatsApp? <span>↗</span>
              </a>
            ) : null}
          </div>
        </div>
      </section>

      <SiteFooter settings={settings} />

      {/* JSON-LD Schema for SEO Rich Results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: "StHelp Assignment Support Services",
            description: "Assignment guidance, computing projects, research support and data analysis for university students in Sri Lanka.",
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: avgRating,
              reviewCount: totalReviews,
              bestRating: "5",
              worstRating: "1"
            },
            review: testimonials.slice(0, 10).map((t) => ({
              "@type": "Review",
              reviewRating: {
                "@type": "Rating",
                ratingValue: t.rating || 5,
                bestRating: "5"
              },
              author: {
                "@type": "Person",
                name: t.customer_name || "Verified Student"
              },
              reviewBody: t.feedback
            }))
          })
        }}
      />
    </main>
  );
}
