"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { ArrowUpRight, Search, ShieldCheck, Sparkles } from "lucide-react";
import {
  RESOURCE_ACCESS_LABELS,
  RESOURCE_CATEGORIES,
  resourceFavicon,
  type StudentResource
} from "@/lib/student-resources";

function initials(title: string) {
  return title.split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
}

function ResourceCard({ resource }: { resource: StudentResource }) {
  const categoryIndex = Math.max(0, RESOURCE_CATEGORIES.indexOf(resource.category as (typeof RESOURCE_CATEGORIES)[number]));
  const thumbnail = resource.thumbnail_url || resourceFavicon(resource.url);

  return <a className="resource-card" href={resource.url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${resource.title} in a new tab`}>
    <div className={`resource-card-visual resource-tone-${categoryIndex % 6}`}>
      <span className="resource-monogram" aria-hidden="true">{initials(resource.title)}</span>
      {thumbnail ? <img src={thumbnail} alt="" width="72" height="72" loading="lazy" referrerPolicy="no-referrer"/> : null}
      <span className="resource-open-icon"><ArrowUpRight size={17}/></span>
    </div>
    <div className="resource-card-body">
      <div className="resource-card-meta"><span>{resource.category}</span><span className={`resource-access access-${resource.access_type}`}>{RESOURCE_ACCESS_LABELS[resource.access_type]}</span></div>
      <h2>{resource.title}</h2>
      <p>{resource.description}</p>
      <span className="resource-visit">Visit resource <ArrowUpRight size={14}/></span>
    </div>
  </a>;
}

export function ResourcesExplorer({ resources }: { resources: StudentResource[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All resources");
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  const filtered = useMemo(() => resources.filter((resource) => {
    const matchesCategory = category === "All resources" || resource.category === category;
    const searchable = `${resource.title} ${resource.category} ${resource.description}`.toLowerCase();
    return matchesCategory && (!deferredQuery || searchable.includes(deferredQuery));
  }), [category, deferredQuery, resources]);

  const featured = resources.filter((resource) => resource.is_featured).slice(0, 6);

  return <>
    <section className="resource-starter-section">
      <div className="container">
        <div className="resource-section-heading"><div><span className="eyebrow"><Sparkles size={15}/> Recommended starter kit</span><h2>A strong free stack for most assignments.</h2></div><p>Start small: one research tool, one reference manager and the right tool for your output.</p></div>
        <div className="resource-featured-grid">{featured.map((resource) => <ResourceCard resource={resource} key={resource.id}/>)}</div>
      </div>
    </section>

    <section className="resource-directory-section" id="directory">
      <div className="container">
        <div className="resource-directory-heading"><div><span className="eyebrow">Browse the directory</span><h2>Find the right tool for today&apos;s task.</h2></div><div className="resource-result-count"><strong>{filtered.length}</strong><span>matching resources</span></div></div>
        <div className="resource-toolbar">
          <label className="resource-search"><Search size={19}/><span className="sr-only">Search resources</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search research, citations, coding…"/></label>
          <div className="resource-categories" aria-label="Filter resources by category">
            {["All resources", ...RESOURCE_CATEGORIES].map((item) => <button type="button" className={category === item ? "active" : ""} onClick={() => setCategory(item)} aria-pressed={category === item} key={item}>{item}</button>)}
          </div>
        </div>
        {filtered.length ? <div className="resource-grid">{filtered.map((resource) => <ResourceCard resource={resource} key={resource.id}/>)}</div> : <div className="resource-empty"><Search size={28}/><h3>No matching resources</h3><p>Try a broader search or choose another category.</p><button type="button" className="btn btn-soft" onClick={() => { setQuery(""); setCategory("All resources"); }}>Clear filters</button></div>}
      </div>
    </section>

    <section className="resource-safety-section"><div className="container resource-safety-grid"><div><span className="resource-safety-icon"><ShieldCheck size={24}/></span><h2>Use every tool with academic judgment.</h2></div><div><p><strong>AI tools:</strong> Verify facts and references through the original paper, Crossref or the publisher. Follow your university&apos;s AI-use policy.</p><p><strong>Private work:</strong> Do not upload confidential data or unpublished research to public PDF and AI services without permission.</p><p><strong>Best source first:</strong> Prioritize your university library, lecturer material and peer-reviewed publications over random websites.</p></div></div></section>
  </>;
}
