import Link from "next/link";
import { ArrowRight, BarChart3, BookOpenCheck, CheckCircle2, Clock3, Code2, FileLock2, MessageSquareText, ShieldCheck, Smartphone, UploadCloud } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
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

  return <main className="page-shell home-page">
    <SiteHeader whatsapp={whatsapp} />
    <section className="studio-hero">
      <div className="hero-grain" />
      <div className="hero-orb hero-orb-one" />
      <div className="hero-orb hero-orb-two" />
      <div className="container studio-grid">
        <div className="studio-copy">
          <div className="availability"><span className="availability-dot" /> Assignment support for students in Sri Lanka</div>
          <h1>Assignment support<br />that feels <em>possible.</em></h1>
          <p className="studio-lead">StHelp gives your assignment support one calm, private home — from the first brief to the final delivery.</p>
          <div className="hero-actions"><Link className="btn btn-coral" href="/place-assignment">Start a request <ArrowRight size={18} /></Link><Link className="text-action" href="/access" prefetch={false}>Open your portal <span>↗</span></Link></div>
          <div className="hero-proof"><span><CheckCircle2 size={16} /> Private by default</span><span><Smartphone size={16} /> Made for mobile</span><span><Clock3 size={16} /> Updates in one place</span></div>
        </div>
        <div className="workspace-wrap" aria-label="Illustration of an assignment tracking workspace">
          <div className="workspace-glow" />
          <div className="workspace-card"><div className="workspace-top"><div><span className="workspace-overline">Your workspace</span><strong>Research report</strong></div><span className="workspace-status">In progress</span></div><div className="workspace-rule" /><div className="workspace-progress"><div><span>Project progress</span><strong>68%</strong></div><div className="workspace-track"><i /></div></div><div className="workspace-update"><span className="update-mark">↗</span><div><strong>Outline complete</strong><p>Your structure and research plan are ready to review.</p></div><time>Today</time></div><div className="workspace-message"><span className="message-avatar">S</span><p>Everything is looking good. I’ve left one question for you in the portal.</p></div><div className="workspace-footer"><span><ShieldCheck size={15} /> Private client link</span><span>•••</span></div></div>
          <div className="floating-note floating-note-top"><span>01</span><strong>Brief received</strong></div><div className="floating-note floating-note-bottom"><span className="note-check">✓</span><strong>Progress, minus the chase</strong></div>
        </div>
      </div>
    </section>

    <section className="signal-strip" aria-label="StHelp service highlights"><div className="signal-track"><span>Guided requests</span><i>✦</i><span>Private workspaces</span><i>✦</i><span>Clear progress updates</span><i>✦</i><span>Feedback that stays connected</span><i>✦</i><span>Guided requests</span><i>✦</i><span>Private workspaces</span><i>✦</i></div></section>

    <section className="resource-home-teaser"><div className="container resource-home-teaser-inner"><div className="resource-home-copy"><span className="eyebrow">Free student toolkit</span><h2>Not every study problem needs paid support.</h2><p>Explore useful research, citation, writing, coding and data tools selected for Sri Lankan university students.</p><Link className="btn btn-dark" href="/student-resources">Browse student resources <ArrowRight size={17}/></Link></div><div className="resource-home-topics"><span><BookOpenCheck size={20}/><strong>Research & references</strong><small>Find papers and build cleaner citations.</small></span><span><BarChart3 size={20}/><strong>Data & surveys</strong><small>Collect, analyse and present evidence.</small></span><span><Code2 size={20}/><strong>Coding & productivity</strong><small>Build projects and organize group work.</small></span></div></div></section>

    <section className="section process-section"><div className="container"><div className="process-heading"><div><span className="eyebrow">A simpler rhythm</span><h2>One request. One workspace.<br /><em>Nothing gets lost.</em></h2></div><p>Designed to make the process feel transparent from the moment you send your brief.</p></div><div className="journey-grid">{journey.map(({ number, title, copy, icon: Icon }) => <article className="journey-card" key={number}><div className="journey-top"><span>{number}</span><Icon size={23} strokeWidth={1.8} /></div><h3>{title}</h3><p>{copy}</p><div className="journey-line" /></article>)}</div></div></section>

    <section className="section service-showcase" id="services"><div className="container"><div className="service-heading"><span className="eyebrow">Support, shaped around the work</span><h2>Where you need momentum,<br />we bring structure.</h2></div><div className="service-bento"><article className="bento-main"><span className="bento-index">01 / Technical</span><div><h3>Software &<br /><em>web projects</em></h3><p>Planning, development guidance, debugging, documentation and project presentation support.</p></div><span className="bento-arrow">↗</span></article><article className="bento-side bento-warm"><span className="bento-index">02 / Written</span><h3>Research<br />& reports</h3><p>Better structure, editing, formatting and reference guidance for academic work.</p></article><article className="bento-side bento-dark"><span className="bento-index">03 / Analytical</span><h3>Data, Excel<br />& slides</h3><p>Spreadsheets, dashboards, analysis and presentation support made clearer.</p></article><div className="bento-note"><span className="note-spark">✦</span><p>Support is always aligned with your institution’s academic-integrity rules.</p></div></div></div></section>

    <section className="section work-section" id="work"><div className="container"><div className="work-heading"><div><span className="eyebrow">Work in focus</span><h2>A closer look at<br />what we support.</h2></div><p className="muted">A cross-section of the projects and learning support clients bring to StHelp.</p></div><div className="work-list">{portfolio.map((item: any, index: number) => <article className="work-item" key={item.id}><div className="work-number">0{index + 1}</div><div className="work-visual">{item.image_url ? <img src={item.image_url} alt="" /> : <span>{item.category.slice(0, 1)}</span>}</div><div className="work-copy"><span className="tag">{item.category}</span><h3>{item.title}</h3><p>{item.description}</p></div><span className="work-arrow">↗</span></article>)}</div></div></section>

    <section className="section testimonial-section" id="feedback"><div className="container"><div className="testimonial-heading"><span className="eyebrow">A note from clients</span><h2>Less uncertainty.<br /><em>More clarity.</em></h2></div><div className="testimonial-stage">{testimonials.map((item: any, index: number) => <article className={`client-note note-${index + 1}`} key={item.id}><div className="note-meta"><span className="stars">{"★".repeat(item.rating || 5)}</span><span>0{index + 1}</span></div><p>“{item.feedback}”</p><div><strong>{item.customer_name}</strong>{item.university ? <span> · {item.university}</span> : null}</div></article>)}</div></div></section>

    <section className="closing-section"><div className="container closing-inner"><div><span className="eyebrow" style={{ color: "#ffad9f" }}>A good place to begin</span><h2>Your next step<br />doesn’t have to be <em>messy.</em></h2><p>Send your assignment details when you’re ready. We’ll give the work a clear place to move forward.</p></div><div className="closing-actions"><Link className="btn btn-light" href="/place-assignment">Place an assignment <ArrowRight size={18} /></Link>{whatsapp ? <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer">Prefer WhatsApp? <span>↗</span></a> : null}</div></div></section>

    <footer className="site-footer home-footer"><div className="container footer-inner"><div><strong>{settings.business_name}</strong><div className="small">Assignment guidance, technical support and learning assistance.</div><Link className="footer-policy" href="/policies">Privacy, service terms & academic integrity</Link></div><div className="small">© {new Date().getFullYear()} StHelp · {settings.support_notice}</div></div></footer>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@graph": [{ "@type": "Organization", name: settings.business_name || "StHelp", url: siteUrl, logo: `${siteUrl}/sthelp-logo.png` }, { "@type": "Service", name: "Assignment Support", provider: { "@type": "Organization", name: settings.business_name || "StHelp" }, description: "Academic support, research guidance, technical project help and assignment progress tracking." }] }) }} />
  </main>;
}
