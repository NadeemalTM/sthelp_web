import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, BookOpenCheck, LibraryBig, SearchCheck } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getPublicContent, getStudentResources } from "@/lib/data";
import { publicSiteUrl } from "@/lib/site-url";
import { ResourcesExplorer } from "./ResourcesExplorer";

export const metadata: Metadata = {
  title: "Free student tools and research resources",
  description: "Discover useful research, referencing, writing, data-analysis, coding and productivity tools for Sri Lankan university students.",
  alternates: { canonical: "/student-resources" },
  openGraph: {
    title: "Student Resources for Assignments | StHelp",
    description: "A curated directory of academic tools and websites for Sri Lankan university students.",
    url: "/student-resources"
  }
};

export const dynamic = "force-dynamic";

export default async function StudentResourcesPage() {
  const [{ settings }, resources] = await Promise.all([getPublicContent(), getStudentResources()]);
  const whatsapp = String(settings.whatsapp_number || "").replace(/\D/g, "");
  const categories = new Set(resources.map((resource) => resource.category)).size;
  const siteUrl = publicSiteUrl();

  return <main className="page-shell resources-page">
    <SiteHeader whatsapp={whatsapp}/>
    <section className="resources-hero">
      <div className="resource-hero-orb resource-hero-orb-one"/><div className="resource-hero-orb resource-hero-orb-two"/>
      <div className="container resources-hero-grid">
        <div><span className="eyebrow">The StHelp student toolkit</span><h1>Useful tools for better research, clearer work and calmer study days.</h1><p>Explore a carefully organized collection of academic websites for Sri Lankan university students—from finding papers and managing references to coding, data analysis and group projects.</p><div className="resources-hero-actions"><a className="btn btn-coral" href="#directory">Explore all resources <ArrowDown size={18}/></a><Link className="text-action" href="/place-assignment">Need personal support? <span>↗</span></Link></div></div>
        <div className="resource-hero-board" aria-label="Student resource directory summary"><div className="resource-board-top"><span><LibraryBig size={20}/></span><div><small>Curated directory</small><strong>Your study stack</strong></div></div><div className="resource-board-stats"><div><strong>{resources.length}+</strong><span>Useful tools</span></div><div><strong>{categories}</strong><span>Task categories</span></div></div><div className="resource-board-list"><span><SearchCheck size={17}/> Find trustworthy research</span><span><BookOpenCheck size={17}/> Build cleaner references</span><span><LibraryBig size={17}/> Discover Sri Lankan sources</span></div><p>Most tools include a free plan or may be available through your university account.</p></div>
      </div>
    </section>
    <ResourcesExplorer resources={resources}/>
    <SiteFooter settings={settings} note="Practical academic guidance and useful tools in one place."/>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "CollectionPage", name: "Student assignment resources", url: `${siteUrl}/student-resources`, mainEntity: { "@type": "ItemList", numberOfItems: resources.length, itemListElement: resources.slice(0, 50).map((resource, index) => ({ "@type": "ListItem", position: index + 1, name: resource.title, url: resource.url })) } }) }}/>
  </main>;
}
