import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  CheckCircle2,
  Code2,
  FileText,
  MessageSquareText,
  ShieldCheck,
  Smartphone,
  UploadCloud
} from "lucide-react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getPublicContent } from "@/lib/data";
import { getPublicPricingServices, type PricingService } from "@/lib/pricing";
import { publicSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Assignment Support Pricing in Sri Lanka",
  description: "View StHelp starting prices for web and mobile projects, research, reports, presentations, data analysis and custom university assignment support.",
  alternates: { canonical: "/pricing" },
  keywords: ["assignment help prices Sri Lanka", "assignment support pricing", "report writing price Sri Lanka", "research support price", "university project support"],
  openGraph: {
    title: "Assignment Support Pricing in Sri Lanka | StHelp",
    description: "Clear starting prices, a reviewed final quotation and flexible payment options for assignment support.",
    url: "/pricing",
    type: "website"
  }
};

export const dynamic = "force-dynamic";

const quoteSteps = [
  { number: "01", title: "Choose a starting point", copy: "Select the service closest to your task, or choose a custom order when it does not fit a category." },
  { number: "02", title: "Share the full brief", copy: "Send the requirements, deadline and supporting documents through the secure request form." },
  { number: "03", title: "Review your final quote", copy: "StHelp reviews the workload and confirms the final amount in your private client portal before payment." },
  { number: "04", title: "Confirm and pay", copy: "Pay using the options shown in your portal. Bank transfer with slip upload remains available, with PayHere checkout when active." }
];

function formatPrice(service: PricingService) {
  if (service.starting_price === null) return null;
  const decimals = Number.isInteger(service.starting_price) ? 0 : 2;
  return `${service.currency} ${new Intl.NumberFormat("en-LK", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(service.starting_price)}`;
}

function serviceIcon(service: PricingService) {
  const key = `${service.slug} ${service.name}`.toLowerCase();
  if (key.includes("mobile") || key.includes("app")) return Smartphone;
  if (key.includes("web") || key.includes("software") || key.includes("comput")) return Code2;
  if (key.includes("research")) return BookOpenCheck;
  if (key.includes("report") || key.includes("document")) return FileText;
  if (key.includes("present") || key.includes("slide")) return MessageSquareText;
  if (key.includes("data") || key.includes("analy") || key.includes("excel")) return BarChart3;
  if (service.is_custom) return UploadCloud;
  return ShieldCheck;
}

export default async function PricingPage() {
  const [{ settings }, services] = await Promise.all([getPublicContent(), getPublicPricingServices()]);
  const whatsapp = String(settings.whatsapp_number || "").replace(/\D/g, "");
  const siteUrl = publicSiteUrl();
  const pricedServices = services.filter((service) => service.starting_price !== null && !service.is_custom);
  const customService = services.find((service) => service.is_custom) || null;

  return <main className="page-shell pricing-page">
    <SiteHeader whatsapp={whatsapp} />

    <section className="pricing-hero">
      <div className="pricing-hero-orb" aria-hidden="true" />
      <div className="container pricing-hero-grid">
        <div className="pricing-hero-copy">
          <span className="eyebrow">StHelp starting prices · LKR</span>
          <h1>Clear starting prices.<br/><em>A quote shaped to your task.</em></h1>
          <p>Choose the support that best matches your work. We review every brief and confirm the final amount in your private portal before you pay.</p>
          <div className="pricing-hero-actions">
            <Link className="btn btn-coral" href="#pricing-services">Explore prices <ArrowRight size={18}/></Link>
            {customService ? <Link className="text-action" href={`/place-assignment?service=${encodeURIComponent(customService.slug)}`}>Request a custom quote <span>↗</span></Link> : null}
          </div>
        </div>
        <aside className="pricing-hero-note" aria-label="How starting prices work">
          <span className="pricing-note-kicker">Before you pay</span>
          <h2>Your final price is confirmed after review.</h2>
          <ul>
            <li><CheckCircle2 size={17}/><span>See the quotation in your private portal</span></li>
            <li><CheckCircle2 size={17}/><span>Pay only after the amount is confirmed</span></li>
            <li><CheckCircle2 size={17}/><span>Use bank transfer or PayHere when available</span></li>
          </ul>
        </aside>
      </div>
    </section>

    <section className="pricing-catalog" id="pricing-services">
      <div className="container">
        <div className="pricing-section-heading">
          <div><span className="eyebrow">Services and starting prices</span><h2>Find the closest fit for your assignment.</h2></div>
          <p>Starting prices help you plan. The final quote depends on the scope, deadline, complexity, word count, data and required outputs.</p>
        </div>

        {services.length ? <div className="pricing-grid">
          {services.map((service, index) => {
            const Icon = serviceIcon(service);
            const price = formatPrice(service);
            return <article id={`service-${service.slug}`} className={`pricing-card${service.is_featured ? " pricing-card-featured" : ""}${service.is_custom ? " pricing-card-custom" : ""}`} key={service.id || service.slug}>
              <div className="pricing-card-top"><span className="pricing-card-number">{String(index + 1).padStart(2, "0")}</span>{service.is_featured ? <span className="pricing-featured-label">Popular</span> : null}<span className="pricing-card-icon"><Icon size={22} strokeWidth={1.8}/></span></div>
              <div className="pricing-card-copy"><h3>{service.name}</h3><p>{service.short_description}</p></div>
              <div className="pricing-price">{price ? <><small>Starting at</small><strong>{price}</strong></> : <><small>Built around your brief</small><strong>Custom quote</strong></>}</div>
              {service.features.length ? <ul className="pricing-features">{service.features.map((feature, featureIndex) => <li key={`${featureIndex}-${feature}`}><CheckCircle2 size={15}/><span>{feature}</span></li>)}</ul> : null}
              <Link className="pricing-card-link" aria-label={`Request ${service.name}`} href={`/place-assignment?service=${encodeURIComponent(service.slug)}`}>{service.is_custom ? "Start a custom request" : "Request this service"}<ArrowRight size={17}/></Link>
            </article>;
          })}
        </div> : <div className="pricing-empty"><h3>Pricing is being updated.</h3><p>No services are currently published. Please contact StHelp before sending a new request.</p>{whatsapp ? <a className="btn btn-dark" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer">Contact StHelp <ArrowRight size={17}/></a> : <Link className="btn btn-dark" href="/">Return home <ArrowRight size={17}/></Link>}</div>}

        <div className="pricing-disclaimer"><ShieldCheck size={22}/><div><strong>Starting price, not an automatic final charge</strong><p>Submitting a request does not charge you. StHelp first reviews your requirements. If the starting price does not cover the scope, an updated quotation is shown in your client portal for your confirmation before payment.</p></div></div>
      </div>
    </section>

    <section className="pricing-process">
      <div className="container">
        <div className="pricing-process-heading"><span className="eyebrow">From price to payment</span><h2>A clear decision at every step.</h2></div>
        <ol>{quoteSteps.map((step) => <li key={step.number}><span>{step.number}</span><div><strong>{step.title}</strong><p>{step.copy}</p></div></li>)}</ol>
      </div>
    </section>

    {customService ? <section className="pricing-custom-cta">
      <div className="container pricing-custom-inner">
        <div><span className="eyebrow">Something different?</span><h2>Not every assignment fits inside a card.</h2><p>Describe the result you need and attach the brief. We will review it and prepare a tailored quotation.</p></div>
        <Link className="btn btn-light" href={`/place-assignment?service=${encodeURIComponent(customService.slug)}`}>Place a custom order <ArrowRight size={18}/></Link>
      </div>
    </section> : null}

    <SiteFooter settings={settings}/>

    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
      "@context": "https://schema.org",
      "@graph": [
        { "@type": "BreadcrumbList", itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}/` },
          { "@type": "ListItem", position: 2, name: "Pricing", item: `${siteUrl}/pricing` }
        ] },
        { "@type": "ItemList", name: "StHelp assignment support starting prices", itemListElement: pricedServices.map((service, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "Service",
            name: service.name,
            description: service.short_description,
            url: `${siteUrl}/pricing#pricing-services`,
            provider: { "@id": `${siteUrl}/#organization` },
            offers: { "@type": "Offer", priceCurrency: service.currency, price: service.starting_price, description: "Starting price; final quotation is confirmed after reviewing the requirements." }
          }
        })) }
      ]
    }) }} />
  </main>;
}
