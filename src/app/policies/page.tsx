import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, LockKeyhole, Scale, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { getPublicContent } from "@/lib/data";

export const metadata: Metadata = {
  title: "Privacy, service terms and academic integrity",
  description: "Read StHelp's privacy information, support terms, revision approach and academic-integrity commitment.",
  alternates: { canonical: "/policies" }
};

export const dynamic = "force-dynamic";

export default async function PoliciesPage() {
  const { settings } = await getPublicContent();
  return <main className="page-shell policy-page"><SiteHeader whatsapp={String(settings.whatsapp_number || "")} />
    <section className="policy-hero"><div className="container"><span className="eyebrow" style={{color:"#bde8d4"}}>StHelp policy centre</span><h1>Clear expectations.<br /><em>Better support.</em></h1><p>How we handle assignment requests, private information, revisions and academic integrity.</p></div></section>
    <section className="section compact"><div className="container policy-layout"><aside className="policy-nav"><strong>On this page</strong><a href="#privacy">Privacy and data</a><a href="#support">Support terms</a><a href="#revisions">Quotes and revisions</a><a href="#integrity">Academic integrity</a></aside><div className="policy-content"><section id="privacy"><span className="policy-icon"><LockKeyhole size={20}/></span><h2>Privacy and client data</h2><p>We collect the contact details, assignment information, messages, payment references and files you choose to provide so we can assess, manage and deliver your requested support. Your client portal uses a private link, and uploaded assignment documents are stored in a private file area.</p><p>We do not publish your assignment details or sell personal information. Keep your client portal link private. If you need a correction or deletion request, contact StHelp through the support contact shown on this website.</p></section><section id="support"><span className="policy-icon"><ShieldCheck size={20}/></span><h2>Support terms</h2><p>StHelp provides tutoring, editing, research guidance, technical project support, formatting and learning assistance. Availability, scope, timing and price are confirmed after we review a request. A quote is not accepted until the client confirms it through their portal.</p><p>Clients are responsible for checking that requested support, use of materials and final submission comply with their institution’s policies and assessment rules.</p></section><section id="revisions"><span className="policy-icon"><Scale size={20}/></span><h2>Quotes, delivery and revisions</h2><p>Quotes apply to the described scope. New requirements, changed deadlines, missing instructions or a substantially different brief may require a revised quote or timeline. Use the client portal to keep revision questions and feedback connected to the request.</p><p>Preview files may be provided before final delivery. Final files remain private and are released only after payment information is verified, unless StHelp agrees otherwise in writing.</p></section><section id="integrity"><span className="policy-icon"><ShieldCheck size={20}/></span><h2>Academic integrity</h2><p>StHelp is designed to support learning—not to replace a student’s own work or judgment. Clients must use support responsibly, follow their university’s academic-integrity requirements and submit only work permitted by their institution.</p><p>We may decline requests that appear to conflict with these principles, applicable rules, or the service scope.</p></section><div className="policy-cta"><div><strong>Ready to share your requirements?</strong><span>Start in a private workspace and keep the conversation organised.</span></div><Link className="btn btn-coral" href="/place-assignment">Place a request <ArrowRight size={17}/></Link></div></div></div></section>
  </main>;
}
