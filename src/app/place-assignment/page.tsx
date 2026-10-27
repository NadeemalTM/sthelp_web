import type { Metadata } from "next";
import Image from "next/image";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getPublicContent } from "@/lib/data";
import { getPublicPricingServices } from "@/lib/pricing";
import { PublicAssignmentForm } from "./PublicAssignmentForm";

export const metadata: Metadata = {
  title: "Place an assignment support request",
  description: "Request academic support online, upload your brief, and receive a private StHelp portal to track updates, revisions and final delivery.",
  alternates: { canonical: "/place-assignment" }
};

export const dynamic = "force-dynamic";

function getFirst(param?: string | string[]): string | undefined {
  if (!param) return undefined;
  return Array.isArray(param) ? param[0] : param;
}

export default async function PlaceAssignmentPage({
  searchParams
}: {
  searchParams: Promise<{
    service?: string | string[];
    fromCalc?: string | string[];
    cat?: string | string[];
    catLabel?: string | string[];
    title?: string | string[];
    level?: string | string[];
    urgency?: string | string[];
    min?: string | string[];
    max?: string | string[];
    turnaround?: string | string[];
    addons?: string | string[];
  }>;
}) {
  const [{ settings }, pricingServices, query] = await Promise.all([
    getPublicContent(),
    getPublicPricingServices(),
    searchParams
  ]);

  const requestedService = getFirst(query.service);
  const fromCalc = getFirst(query.fromCalc) === "1";

  // Calculator estimate parameters
  const calcData = fromCalc
    ? {
        fromCalc: true,
        category: getFirst(query.cat),
        categoryLabel: getFirst(query.catLabel),
        title: getFirst(query.title),
        level: getFirst(query.level),
        urgency: getFirst(query.urgency),
        minPrice: getFirst(query.min),
        maxPrice: getFirst(query.max),
        turnaround: getFirst(query.turnaround),
        addons: getFirst(query.addons)
      }
    : undefined;

  // Initial service mapping: either explicit service or derived from category
  let initialServiceSlug = requestedService && pricingServices.some((service) => service.slug === requestedService)
    ? requestedService
    : undefined;

  if (!initialServiceSlug && calcData?.category) {
    const cat = calcData.category.toLowerCase();
    if (cat === "web") {
      initialServiceSlug = pricingServices.find((s) => s.slug.includes("web") || s.slug.includes("software"))?.slug;
    } else if (cat === "report") {
      initialServiceSlug = pricingServices.find((s) => s.slug.includes("report") || s.slug.includes("essay"))?.slug;
    } else if (cat === "research") {
      initialServiceSlug = pricingServices.find((s) => s.slug.includes("research") || s.slug.includes("thesis"))?.slug;
    } else if (cat === "analysis") {
      initialServiceSlug = pricingServices.find((s) => s.slug.includes("analysis") || s.slug.includes("data") || s.slug.includes("spss"))?.slug;
    } else if (cat === "presentation") {
      initialServiceSlug = pricingServices.find((s) => s.slug.includes("presentation") || s.slug.includes("slide"))?.slug;
    }
    if (!initialServiceSlug) {
      initialServiceSlug = pricingServices.find((s) => s.is_custom || s.slug === "custom")?.slug || pricingServices[0]?.slug;
    }
  }

  return (
    <main className="page-shell request-page public-site-v2">
      <SiteHeader whatsapp={String(settings.whatsapp_number || "")} />
      <section className="request-hero">
        <div className="request-hero-media" aria-hidden="true">
          <Image src="/images/public/sthelp-study-studio-hero.webp" alt="" fill sizes="100vw" loading="eager" />
        </div>
        <div className="container request-hero-copy">
          <span className="eyebrow">Online assignment support request</span>
          <h1>Place your request in a few clear steps.</h1>
          <p className="lead">
            {fromCalc
              ? "Your calculated estimate has been locked in below. Complete your assignment details to initiate your private workspace."
              : "Tell us what support you need, add your brief if you have one, and receive a private portal for updates, comments and delivery."}
          </p>
          <span className="request-hero-note">No payment is taken when you submit the form.</span>
        </div>
      </section>
      <section className="section compact" data-public-reveal>
        <div className="container request-layout">
          <aside className="request-aside">
            <span className="request-aside-kicker">After you submit</span>
            <h2>What happens next?</h2>
            <ol className="request-steps">
              <li>
                <strong>Send your requirements</strong>
                <span>Include the deadline, subject, brief and expected outcome.</span>
              </li>
              <li>
                <strong>We review the request</strong>
                <span>StHelp will confirm availability and quote details in your portal.</span>
              </li>
              <li>
                <strong>Track everything privately</strong>
                <span>Use your personal portal for progress, direct WhatsApp sync, and files.</span>
              </li>
            </ol>
            <p className="small">Please use this service responsibly and follow your institution’s academic-integrity rules.</p>
          </aside>
          <PublicAssignmentForm
            pricingServices={pricingServices}
            initialServiceSlug={initialServiceSlug}
            calcEstimate={calcData}
          />
        </div>
      </section>
      <SiteFooter settings={settings} />
    </main>
  );
}
