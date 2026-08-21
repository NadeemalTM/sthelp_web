import type { ReactNode } from "react";
import { ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export type PolicySection = { id: string; title: string; content: ReactNode };

export function PolicyDocument({ settings, eyebrow, title, summary, sections, updated = "21 August 2026" }: { settings: any; eyebrow: string; title: ReactNode; summary: string; sections: PolicySection[]; updated?: string }) {
  return <main className="page-shell policy-page">
    <SiteHeader whatsapp={String(settings.whatsapp_number || "")} />
    <section className="policy-hero"><div className="container"><span className="eyebrow" style={{color:"#bde8d4"}}>{eyebrow}</span><h1>{title}</h1><p>{summary}</p><span className="policy-updated">Last updated: {updated}</span></div></section>
    <section className="section compact"><div className="container policy-layout">
      <aside className="policy-nav"><strong>On this page</strong>{sections.map((section) => <a href={`#${section.id}`} key={section.id}>{section.title}</a>)}</aside>
      <div className="policy-content">{sections.map((section) => <section id={section.id} key={section.id}><span className="policy-icon"><ShieldCheck size={20}/></span><h2>{section.title}</h2>{section.content}</section>)}</div>
    </div></section>
    <SiteFooter settings={settings}/>
  </main>;
}
