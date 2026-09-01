import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BarChart3, BookOpenCheck, CheckCircle2, Clock3, Code2, FileLock2, MessageSquareText, Smartphone, UploadCloud } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getPublicContent } from "@/lib/data";
import { publicSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

const journey = [
  { number: "01", title: "Share the brief", copy: "Start with your deadline, task details and any guidance documents.", icon: UploadCloud },
  { number: "02", title: "Stay in the loop", copy: "See progress and keep every question or revision in one private space.", icon: MessageSquareText },
  { number: "03", title: "Receive with confidence", copy: "Review protected files and access final deliverables once payment is verified.", icon: FileLock2 }
];

export default async function HomePage() {
  const { settings, portfolio, testimonials } = await getPublicContent();
  const whatsapp = String(settings.whatsapp_number || "").replace(/\D/g, "");
  const siteUrl = publicSiteUrl();
  const organizationId = `${siteUrl}/#organization`;
  const websiteId = `${siteUrl}/#website`;

  return <main className="page-shell home-page public-site-v2">
    <SiteHeader whatsapp={whatsapp} suppressFloatingCtaNear="[data-primary-request-cta]" />
    <section className="studio-hero">
      <div className="studio-hero-media"><Image src="/images/public/sthelp-study-studio-hero.webp" alt="A calm study desk with research notes, a laptop and a student organising assignment work" fill sizes="100vw" preload /></div>
      <div className="studio-hero-shade" aria-hidden="true" />
      <div className="container studio-grid">
        <div className="studio-copy">
          <div className="availability"><span className="availability-dot" /> Made for Sri Lankan university students</div>
          <h1>Assignment support,<br />without the <em>scramble.</em></h1>
          <p className="studio-lead">Share the brief once. See the quote, progress, questions and final files in one private workspace.</p>
          <div className="hero-actions"><Link className="btn btn-coral" href="/place-assignment" data-primary-request-cta>Share your brief <ArrowRight size={18} /></Link><Link className="text-action" href="/access" prefetch={false}>Track an existing request <span>↗</span></Link></div>
          <div className="hero-proof"><span><CheckCircle2 size={16} /> Private by default</span><span><Smartphone size={16} /> Made for mobile</span><span><Clock3 size={16} /> Updates in one place</span></div>
        </div>
        <aside className="hero-field-note"><span>One clear place</span><strong>Brief → quote → progress → delivery</strong><p>No scattered screenshots. No wondering which file is current.</p></aside>
      </div>
    </section>

    <section className="signal-strip" aria-label="StHelp service highlights"><div className="container signal-track"><span><b>01</b> Brief-led support</span><span><b>02</b> Reviewed quotation</span><span><b>03</b> Private progress</span><span><b>04</b> Connected revisions</span></div></section>

    <section className="resource-home-teaser" data-public-reveal><div className="container resource-home-teaser-inner"><figure className="resource-home-image"><Image src="/images/public/sthelp-study-process.webp" alt="A university student comparing research notes and diagrams while studying" fill sizes="(max-width: 760px) 100vw, 42vw"/><figcaption><span>Study note / 01</span><strong>Use the right tool.<br/>Keep your judgment.</strong></figcaption></figure><div className="resource-home-copy"><span className="eyebrow">Free student toolkit</span><h2>Not every study problem needs paid support.</h2><p>Explore useful research, citation, writing, coding and data tools selected for Sri Lankan university students.</p><Link className="btn btn-dark" href="/student-resources">Browse student resources <ArrowRight size={17}/></Link></div><div className="resource-home-topics"><span><BookOpenCheck size={20}/><strong>Research & references</strong><small>Find papers and build cleaner citations.</small></span><span><BarChart3 size={20}/><strong>Data & surveys</strong><small>Collect, analyse and present evidence.</small></span><span><Code2 size={20}/><strong>Coding & productivity</strong><small>Build projects and organise group work.</small></span></div></div></section>

    <section className="section process-section" data-public-reveal><div className="container"><div className="process-heading"><div><span className="eyebrow">A simpler rhythm</span><h2>One request. One workspace.<br /><em>Nothing gets lost.</em></h2></div><p>Designed to make the process feel transparent from the moment you send your brief.</p></div><div className="journey-grid">{journey.map(({ number, title, copy, icon: Icon }) => <article className="journey-card" key={number}><div className="journey-top"><span>{number}</span><Icon size={23} strokeWidth={1.8} /></div><h3>{title}</h3><p>{copy}</p><div className="journey-line" /></article>)}</div></div></section>

    <section className="section service-showcase" id="services" data-public-reveal><div className="container"><div className="service-heading"><span className="eyebrow">Support, shaped around the work</span><h2>Where you need momentum,<br />we bring structure.</h2><Link className="text-action pricing-inline-link" href="/pricing">View starting prices <span>↗</span></Link></div><div className="service-bento"><article className="bento-main"><span className="bento-index">01 / Technical</span><div><h3>Software &<br /><em>web projects</em></h3><p>Planning, development guidance, debugging, documentation and project presentation support.</p></div><span className="bento-arrow">↗</span></article><article className="bento-side bento-warm"><span className="bento-index">02 / Written</span><h3>Research<br />& reports</h3><p>Better structure, editing, formatting and reference guidance for academic work.</p></article><article className="bento-side bento-dark"><span className="bento-index">03 / Analytical</span><h3>Data, Excel<br />& slides</h3><p>Spreadsheets, dashboards, analysis and presentation support made clearer.</p></article><div className="bento-note"><span className="note-spark">✦</span><p>Support is always aligned with your institution’s academic-integrity rules.</p></div></div></div></section>

    <section className="section work-section" id="work" data-public-reveal><div className="container"><div className="work-heading"><div><span className="eyebrow">Work in focus</span><h2>A closer look at<br />what we support.</h2></div><p className="muted">A cross-section of the projects and learning support clients bring to StHelp.</p></div><div className="work-list">{portfolio.map((item: any, index: number) => <article className="work-item" key={item.id}><div className="work-number">{String(index + 1).padStart(2, "0")}</div><div className="work-visual">{item.image_url ? <img src={item.image_url} alt={item.title} loading="lazy" decoding="async" /> : <span>{item.category.slice(0, 1)}</span>}</div><div className="work-copy"><span className="tag">{item.category}</span><h3>{item.title}</h3><p>{item.description}</p></div><span className="work-arrow">↗</span></article>)}</div></div></section>

    <section className="section testimonial-section" id="feedback" data-public-reveal><div className="container"><div className="testimonial-heading"><span className="eyebrow">A note from clients</span><h2>Less uncertainty.<br /><em>More clarity.</em></h2></div><div className="testimonial-stage">{testimonials.map((item: any, index: number) => <article className={`client-note note-${index + 1}`} key={item.id}><div className="note-meta"><span className="stars">{"★".repeat(item.rating || 5)}</span><span>{String(index + 1).padStart(2, "0")}</span></div><p>“{item.feedback}”</p><div><strong>{item.customer_name}</strong>{item.university ? <span> · {item.university}</span> : null}</div></article>)}</div></div></section>

    <section className="closing-section"><div className="container closing-inner"><div><span className="eyebrow" style={{ color: "#ffad9f" }}>A good place to begin</span><h2>Your next step<br />doesn’t have to be <em>messy.</em></h2><p>Send your assignment details when you’re ready. We’ll give the work a clear place to move forward.</p></div><div className="closing-actions"><Link className="btn btn-light" href="/place-assignment">Place an assignment <ArrowRight size={18} /></Link>{whatsapp ? <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer">Prefer WhatsApp? <span>↗</span></a> : null}</div></div></section>

    <SiteFooter settings={settings}/>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@graph": [
      { "@type": "WebSite", "@id": websiteId, url: `${siteUrl}/`, name: "StHelp", alternateName: "StHelp Assignment Support", publisher: { "@id": organizationId } },
      { "@type": "Organization", "@id": organizationId, name: "StHelp", alternateName: settings.business_name && settings.business_name !== "StHelp" ? settings.business_name : undefined, url: `${siteUrl}/`, logo: { "@type": "ImageObject", url: `${siteUrl}/sthelp-logo.png`, contentUrl: `${siteUrl}/sthelp-logo.png`, width: 1254, height: 1254 } },
      { "@type": "Service", name: "Assignment Support", provider: { "@id": organizationId }, description: "Academic support, research guidance, technical project help and assignment progress tracking." }
    ] }) }} />
  </main>;
}
