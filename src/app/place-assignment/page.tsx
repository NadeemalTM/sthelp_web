import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { getPublicContent } from "@/lib/data";
import { PublicAssignmentForm } from "./PublicAssignmentForm";

export const metadata: Metadata = {
  title: "Place an assignment support request",
  description: "Request academic support online, upload your brief, and receive a private StHelp portal to track updates, revisions and final delivery.",
  alternates: { canonical: "/place-assignment" }
};

export const dynamic = "force-dynamic";

export default async function PlaceAssignmentPage() {
  const { settings } = await getPublicContent();
  return <main className="page-shell">
    <SiteHeader whatsapp={String(settings.whatsapp_number || "")} />
    <section className="request-hero"><div className="container request-hero-copy"><span className="eyebrow" style={{ color: "#ffc95d" }}>Online assignment support request</span><h1>Place your request in a few clear steps.</h1><p className="lead">Tell us what support you need, add your brief if you have one, and receive a private portal for updates, comments and delivery.</p></div></section>
    <section className="section compact"><div className="container request-layout"><aside className="request-aside"><h2>What happens next?</h2><ol className="request-steps"><li><strong>Send your requirements</strong><span>Include the deadline, subject, brief and expected outcome.</span></li><li><strong>We review the request</strong><span>StHelp will confirm whether the requested support is available.</span></li><li><strong>Track everything privately</strong><span>Use your personal portal for progress, messages, payment and files.</span></li></ol><p className="small">Please use this service responsibly and follow your institution’s academic-integrity rules.</p></aside><PublicAssignmentForm /></div></section>
  </main>;
}
