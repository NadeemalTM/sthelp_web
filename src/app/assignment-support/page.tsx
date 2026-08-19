import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, FileText, MessageSquareText, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { getPublicContent } from "@/lib/data";
import { publicSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Assignment Help & Student Support in Sri Lanka",
  description: "Assignment help for Sri Lankan university students, including report writing support, research guidance, formatting, data analysis and software project assistance.",
  alternates: { canonical: "/assignment-support" },
  keywords: ["assignment help Sri Lanka", "assignment support Sri Lanka", "student support Sri Lanka", "university assignment help", "report writing support", "academic project support"],
  openGraph: { title: "Assignment Help & Student Support in Sri Lanka | StHelp", description: "Responsible university assignment guidance, report writing support, research help and technical project assistance for students in Sri Lanka.", url: "/assignment-support", type: "website" }
};

export const dynamic = "force-dynamic";

const questions = [
  ["What does assignment support include?", "StHelp can help organise a brief, clarify requirements, improve structure, support research planning, assist with technical projects, format documents and explain data-analysis work."],
  ["Do you provide report writing support?", "Yes. Report writing support can include planning the structure, improving clarity, organising evidence, checking formatting and explaining referencing. The student remains responsible for the ideas, learning and final submission."],
  ["Can you help with university assignments in Sri Lanka?", "Yes. Support is available for students working on university reports, research projects, presentations, spreadsheets and computing assignments. Every request is reviewed against its own brief and institutional requirements."],
  ["Is this service suitable for undergraduate and postgraduate students?", "StHelp can support undergraduate and postgraduate work when the requested guidance is within the student’s institution rules and our academic-integrity policy."],
  ["Can I submit an assignment brief online?", "Yes. Use the request form to share your deadline, subject, requirements and supporting documents. A private portal is created to keep your updates and files organised."],
  ["How do I track the request?", "Your private portal shows progress updates, comments, quotes, payment information and delivery files in one place."],
  ["Does StHelp follow academic-integrity standards?", "Yes. The service is intended for tutoring, editing, research guidance, technical support and learning assistance. Students remain responsible for following their institution’s rules."]
];

export default async function AssignmentSupportPage() {
  const { settings } = await getPublicContent();
  const whatsapp = String(settings.whatsapp_number || "").replace(/\D/g, "");
  const siteUrl = publicSiteUrl();

  return <main className="page-shell support-page"><SiteHeader whatsapp={whatsapp} />
    <section className="support-hero"><div className="container"><span className="eyebrow" style={{color:"#bde8d4"}}>StHelp · Sri Lanka</span><h1>Assignment help and student support for university work.</h1><p>Get responsible support with university assignments, report writing, research, data analysis and software projects. Share your brief, receive a clear quote, and follow the full process in one private workspace.</p><div className="support-actions"><Link className="btn btn-coral" href="/place-assignment">Request assignment support <ArrowRight size={18}/></Link><Link className="text-action" href="/policies">Read our academic-integrity approach <span>↗</span></Link></div></div></section>
    <section className="section support-intro"><div className="container support-grid"><div><span className="eyebrow">Online assignment help, responsibly delivered</span><h2>Support for the work around the assignment—not shortcuts around your learning.</h2></div><div><p>Students often search for “assignment help” when a brief is unclear, a deadline is close, or a project feels too large to manage. StHelp provides practical academic and technical support that helps you understand, organise and progress with your work.</p><p>Every request begins with your actual requirements. You can then follow updates, ask questions and review files through a private client portal.</p></div></div></section>
    <section className="section support-services"><div className="container"><div className="section-title"><span className="eyebrow">Ways we can help</span><h2>Support for university assignments and reports</h2></div><div className="support-cards"><article><FileText/><h3>Report writing support</h3><p>Plan a logical report structure, organise sources and evidence, improve clarity, check formatting and understand Harvard, APA or institution-specific referencing.</p></article><article><MessageSquareText/><h3>University assignment guidance</h3><p>Break down the marking criteria, clarify the brief and plan manageable steps for essays, case studies, research projects and presentations.</p></article><article><CheckCircle2/><h3>Technical and data support</h3><p>Get guided help with software projects, documentation, spreadsheets, charts, dashboards, data interpretation and presentation materials.</p></article></div></div></section>
    <section className="section support-intro"><div className="container support-grid"><div><span className="eyebrow">Student support built around your brief</span><h2>A clearer process for complex academic work.</h2></div><div><p>University assignments can combine research, writing, analysis, referencing and technical requirements in one deadline. StHelp starts with the actual assignment brief so the support is relevant to the subject, assessment criteria and stage of work.</p><p>Our role is to guide, explain, edit and help students develop their work responsibly. We do not offer exam assistance or promise grades, and students must follow their university’s academic-integrity requirements.</p></div></div></section>
    <section className="section support-flow"><div className="container"><div className="support-flow-title"><span className="eyebrow">How StHelp works</span><h2>Clear from brief to delivery.</h2></div><ol><li><span>01</span><div><strong>Send your requirements</strong><p>Tell us the subject, task, deadline and the kind of support you need.</p></div></li><li><span>02</span><div><strong>Review your quote</strong><p>We confirm the scope and price in your client portal before moving forward.</p></div></li><li><span>03</span><div><strong>Stay connected</strong><p>Track progress, exchange messages and access files through one private link.</p></div></li></ol></div></section>
    <section className="section support-faq"><div className="container"><div className="section-title"><span className="eyebrow">Common questions</span><h2>Assignment support FAQs</h2></div><div className="faq-grid">{questions.map(([question, answer])=><details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div></div></section>
    <section className="support-closing"><div className="container"><div><ShieldCheck size={28}/><h2>Start with the brief you already have.</h2><p>We’ll give it a private, organised place to move forward.</p></div><Link className="btn btn-light" href="/place-assignment">Place an assignment request <ArrowRight size={18}/></Link></div></section>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify({"@context":"https://schema.org","@graph":[{"@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:"Home",item:`${siteUrl}/`},{"@type":"ListItem",position:2,name:"Assignment Help & Student Support",item:`${siteUrl}/assignment-support`}]},{"@type":"Service",name:"Assignment Help and Student Support in Sri Lanka",url:`${siteUrl}/assignment-support`,areaServed:{"@type":"Country",name:"Sri Lanka"},audience:{"@type":"EducationalAudience",educationalRole:"student"},provider:{"@id":`${siteUrl}/#organization`},serviceType:["Assignment support","University assignment guidance","Report writing support","Research guidance","Software project support","Data analysis support"]},{"@type":"FAQPage",mainEntity:questions.map(([name,text])=>({"@type":"Question",name,acceptedAnswer:{"@type":"Answer",text}}))}]})}} />
  </main>;
}
