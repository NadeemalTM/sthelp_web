import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, FileText, MessageSquareText, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { getPublicContent } from "@/lib/data";
import { publicSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Assignment Support in Sri Lanka",
  description: "Looking for assignment support in Sri Lanka? StHelp provides academic project guidance, research support, software project assistance and a private workspace to track requests.",
  alternates: { canonical: "/assignment-support" },
  openGraph: { title: "Assignment Support in Sri Lanka | StHelp", description: "Academic project guidance, research support, technical project assistance and private assignment tracking." }
};

export const dynamic = "force-dynamic";

const questions = [
  ["What does assignment support include?", "StHelp can help organise a brief, clarify requirements, improve structure, support research planning, assist with technical projects, format documents and explain data-analysis work."],
  ["Can I submit an assignment brief online?", "Yes. Use the request form to share your deadline, subject, requirements and supporting documents. A private portal is created to keep your updates and files organised."],
  ["How do I track the request?", "Your private portal shows progress updates, comments, quotes, payment information and delivery files in one place."],
  ["Does StHelp follow academic-integrity standards?", "Yes. The service is intended for tutoring, editing, research guidance, technical support and learning assistance. Students remain responsible for following their institution’s rules."]
];

export default async function AssignmentSupportPage() {
  const { settings } = await getPublicContent();
  const whatsapp = String(settings.whatsapp_number || "").replace(/\D/g, "");
  const siteUrl = publicSiteUrl();

  return <main className="page-shell support-page"><SiteHeader whatsapp={whatsapp} />
    <section className="support-hero"><div className="container"><span className="eyebrow" style={{color:"#bde8d4"}}>StHelp · Sri Lanka</span><h1>Assignment support for students who want a clearer way forward.</h1><p>StHelp is an online assignment-support service for students in Sri Lanka. Share your brief, receive a clear quote, and keep the full process in one private workspace.</p><div className="support-actions"><Link className="btn btn-coral" href="/place-assignment">Request assignment support <ArrowRight size={18}/></Link><Link className="text-action" href="/policies">Read our academic-integrity approach <span>↗</span></Link></div></div></section>
    <section className="section support-intro"><div className="container support-grid"><div><span className="eyebrow">Online assignment help, responsibly delivered</span><h2>Support for the work around the assignment—not shortcuts around your learning.</h2></div><div><p>Students often search for “assignment help” when a brief is unclear, a deadline is close, or a project feels too large to manage. StHelp provides practical academic and technical support that helps you understand, organise and progress with your work.</p><p>Every request begins with your actual requirements. You can then follow updates, ask questions and review files through a private client portal.</p></div></div></section>
    <section className="section support-services"><div className="container"><div className="section-title"><span className="eyebrow">Ways we can help</span><h2>Assignment and academic project support</h2></div><div className="support-cards"><article><FileText/><h3>Research & report guidance</h3><p>Plan a stronger structure, organise sources, improve clarity, apply formatting and understand referencing requirements.</p></article><article><MessageSquareText/><h3>Software project support</h3><p>Get help planning, debugging, documenting and presenting computing or web-development coursework projects.</p></article><article><CheckCircle2/><h3>Data, Excel & presentations</h3><p>Work through spreadsheet formulas, charts, dashboards, data interpretation and clear presentation materials.</p></article></div></div></section>
    <section className="section support-flow"><div className="container"><div className="support-flow-title"><span className="eyebrow">How StHelp works</span><h2>Clear from brief to delivery.</h2></div><ol><li><span>01</span><div><strong>Send your requirements</strong><p>Tell us the subject, task, deadline and the kind of support you need.</p></div></li><li><span>02</span><div><strong>Review your quote</strong><p>We confirm the scope and price in your client portal before moving forward.</p></div></li><li><span>03</span><div><strong>Stay connected</strong><p>Track progress, exchange messages and access files through one private link.</p></div></li></ol></div></section>
    <section className="section support-faq"><div className="container"><div className="section-title"><span className="eyebrow">Common questions</span><h2>Assignment support FAQs</h2></div><div className="faq-grid">{questions.map(([question, answer])=><details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div></div></section>
    <section className="support-closing"><div className="container"><div><ShieldCheck size={28}/><h2>Start with the brief you already have.</h2><p>We’ll give it a private, organised place to move forward.</p></div><Link className="btn btn-light" href="/place-assignment">Place an assignment request <ArrowRight size={18}/></Link></div></section>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify({"@context":"https://schema.org","@graph":[{"@type":"Service",name:"Assignment Support in Sri Lanka",url:`${siteUrl}/assignment-support`,areaServed:{"@type":"Country",name:"Sri Lanka"},provider:{"@type":"Organization",name:settings.business_name || "StHelp",url:siteUrl},serviceType:["Academic support","Research guidance","Software project support","Data analysis support"]},{"@type":"FAQPage",mainEntity:questions.map(([name,text])=>({"@type":"Question",name,acceptedAnswer:{"@type":"Answer",text}}))}]})}} />
  </main>;
}
