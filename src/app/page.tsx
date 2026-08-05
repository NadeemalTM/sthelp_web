import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, FileLock2, MessageSquareText, ShieldCheck, Smartphone, UploadCloud } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { getPublicContent } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { settings, portfolio, testimonials } = await getPublicContent();
  const whatsapp = String(settings.whatsapp_number || "").replace(/\D/g, "");

  return (
    <main className="page-shell">
      <SiteHeader whatsapp={whatsapp} />
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <span className="eyebrow" style={{color:"#ffc95d"}}>Clear support from start to finish</span>
            <h1>One link for your entire assignment journey.</h1>
            <p className="lead">Submit your requirements, upload guidance documents, follow live progress, request revisions, confirm payment and securely receive your final files.</p>
            <div className="hero-actions">
              <Link className="btn btn-primary" href="/access">Place / track assignment <ArrowRight size={18}/></Link>
              {whatsapp ? <a className="btn btn-outline" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer">Contact on WhatsApp</a> : null}
            </div>
            <div className="trust-row">
              <span><CheckCircle2 size={17}/> Mobile responsive</span>
              <span><ShieldCheck size={17}/> Private client link</span>
              <span><Clock3 size={17}/> Progress updates</span>
            </div>
          </div>
          <div className="hero-panel">
            {[
              ["1", "Submit requirements", "Complete the guided form and attach one support document up to 5 MB."],
              ["2", "Track the work", "See acceptance, progress percentage, updates and messages on the same link."],
              ["3", "Review protected preview", "View a watermarked preview and request changes before payment verification."],
              ["4", "Download final files", "Submit the payment reference; downloads unlock after admin verification."]
            ].map(([n,t,d]) => <div className="flow-step" key={n}><span className="flow-number">{n}</span><div><strong>{t}</strong><p>{d}</p></div></div>)}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-title center"><span className="eyebrow">How it helps</span><h2>Less confusion. Better communication.</h2><p className="muted">Everything remains connected to one secure client portal instead of being scattered across messages.</p></div>
          <div className="feature-grid">
            <div className="card feature-card"><span className="icon-box"><UploadCloud/></span><h3>Guided submission</h3><p className="muted">Collect university, module, deadline, group details, instructions and a supporting file.</p></div>
            <div className="card feature-card"><span className="icon-box"><MessageSquareText/></span><h3>Revision comments</h3><p className="muted">Clients and admin can leave short, time-stamped comments throughout the work.</p></div>
            <div className="card feature-card"><span className="icon-box"><FileLock2/></span><h3>Controlled delivery</h3><p className="muted">Original files remain locked until payment is checked and downloads are enabled.</p></div>
            <div className="card feature-card"><span className="icon-box"><Smartphone/></span><h3>Built for phones</h3><p className="muted">Forms, dashboard cards, previews and admin controls adapt to mobile screens.</p></div>
          </div>
        </div>
      </section>

      <section className="section" id="work" style={{background:"#fff"}}>
        <div className="container">
          <div className="section-title"><span className="eyebrow">Previous work</span><h2>Support across different study needs</h2><p className="muted">Examples can be added, edited or hidden from the admin panel.</p></div>
          <div className="portfolio-grid">
            {portfolio.map((item: any) => <article className="card portfolio-card" key={item.id}><div className="portfolio-visual">{item.image_url ? <img src={item.image_url} alt=""/> : <FileLock2 size={46}/>}</div><span className="tag">{item.category}</span><h3>{item.title}</h3><p className="muted">{item.description}</p></article>)}
          </div>
        </div>
      </section>

      <section className="section" id="feedback">
        <div className="container">
          <div className="section-title center"><span className="eyebrow">Customer feedback</span><h2>What clients say</h2><p className="muted">Submitted feedback is reviewed by admin before it appears publicly.</p></div>
          <div className="testimonial-grid">
            {testimonials.map((item: any) => <article className="card testimonial-card" key={item.id}><div className="stars">{"★".repeat(item.rating || 5)}</div><p className="quote">“{item.feedback}”</p><div className="customer"><strong>{item.customer_name}</strong>{item.university ? ` · ${item.university}` : ""}</div></article>)}
          </div>
        </div>
      </section>

      <section className="cta-band"><div className="container cta-inner"><div><h2 style={{fontSize:"1.8rem"}}>Already received your StHelp client details?</h2><p>Open the link sent through WhatsApp or use your client ID and PIN.</p></div><Link className="btn btn-primary" href="/access">Open client portal <ArrowRight size={18}/></Link></div></section>
      <footer className="site-footer"><div className="container footer-inner"><div><strong style={{color:"#fff"}}>{settings.business_name}</strong><div className="small">Assignment guidance, technical support and learning assistance.</div></div><div className="small">© {new Date().getFullYear()} StHelp · {settings.support_notice}</div></div></footer>
    </main>
  );
}
