import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";

type PublicSettings = {
  business_name?: string | null;
  business_phone?: string | null;
  business_email?: string | null;
  business_address?: string | null;
  whatsapp_number?: string | null;
};

const policyLinks = [
  { href: "/refund-policy", label: "Refund Policy" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms-and-conditions", label: "Terms & Conditions" }
];

function phoneHref(phone: string) {
  const normalized = phone.replace(/[^0-9+]/g, "");
  return normalized.startsWith("+") ? normalized : `+${normalized}`;
}

export function SiteFooter({ settings, note = "Assignment guidance, technical support and learning assistance." }: { settings: PublicSettings; note?: string }) {
  const businessName = String(settings.business_name || "StHelp").trim();
  const phone = String(settings.business_phone || settings.whatsapp_number || "").trim();
  const email = String(settings.business_email || "").trim();
  const address = String(settings.business_address || "").trim();

  return <footer className="site-footer public-footer">
    <div className="container public-footer-grid">
      <div className="public-footer-brand"><strong>{businessName}</strong><p>{note}</p><Link href="/policies">Policy centre</Link></div>
      <div className="public-footer-contact"><strong>Business contact</strong><address>
        {phone ? <a href={`tel:${phoneHref(phone)}`}><Phone size={15}/><span>{phone}</span></a> : null}
        {email ? <a href={`mailto:${email}`}><Mail size={15}/><span>{email}</span></a> : null}
        {address ? <span><MapPin size={15}/><span>{address}</span></span> : null}
      </address></div>
      <nav className="public-footer-policies" aria-label="Business policies"><strong>Policies</strong>{policyLinks.map((item) => <Link href={item.href} key={item.href}>{item.label}</Link>)}</nav>
    </div>
    <div className="container public-footer-bottom"><span>© {new Date().getFullYear()} {businessName}. All rights reserved.</span><span>Digital support services · Sri Lanka</span></div>
  </footer>;
}
