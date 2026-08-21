import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileText, LockKeyhole, Scale } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getPublicContent } from "@/lib/data";

export const metadata: Metadata = {
  title: "Business Policy Centre",
  description: "Access StHelp's Refund Policy, Privacy Policy, and Business Terms and Conditions.",
  alternates: { canonical: "/policies" }
};

export const dynamic = "force-dynamic";

const policies = [
  { href: "/refund-policy", title: "Refund Policy", copy: "Cancellations, customised work, duplicate payments, eligibility and processing times.", icon: Scale },
  { href: "/privacy-policy", title: "Privacy Policy", copy: "Contact data, university information, uploads, payment references, cookies and deletion requests.", icon: LockKeyhole },
  { href: "/terms-and-conditions", title: "Terms & Conditions", copy: "Quotations, payment methods, delivery, revisions, responsibilities and academic integrity.", icon: FileText }
];

export default async function PoliciesPage() {
  const { settings } = await getPublicContent();
  return <main className="page-shell policy-page">
    <SiteHeader whatsapp={String(settings.whatsapp_number || "")} />
    <section className="policy-hero"><div className="container"><span className="eyebrow" style={{color:"#bde8d4"}}>StHelp policy centre</span><h1>Clear policies.<br/><em>Confident decisions.</em></h1><p>Review the policies that apply when you request, pay for and receive StHelp&apos;s digital support services.</p></div></section>
    <section className="section"><div className="container"><div className="support-cards policy-centre-grid">{policies.map(({href,title,copy,icon:Icon}) => <article key={href}><Icon/><h2>{title}</h2><p>{copy}</p><Link href={href}>Read the full policy <ArrowRight size={16}/></Link></article>)}</div></div></section>
    <SiteFooter settings={settings}/>
  </main>;
}
