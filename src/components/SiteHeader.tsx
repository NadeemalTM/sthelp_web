import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Menu } from "lucide-react";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";

function displayPhoneNumber(number: string) {
  const sriLankan = number.match(/^94(\d{2})(\d{3})(\d{4})$/);
  if (sriLankan) return `+94 ${sriLankan[1]} ${sriLankan[2]} ${sriLankan[3]}`;
  return `+${number.replace(/(\d{3})(?=\d)/g, "$1 ")}`;
}

const navigation = [
  { href: "/assignment-support", label: "Assignment support" },
  { href: "/pricing", label: "Pricing" },
  { href: "/student-resources", label: "Student resources" },
  { href: "/#work", label: "Previous work" },
  { href: "/#feedback", label: "Feedback" },
  { href: "/access", label: "Track assignment", prefetch: false }
];

export function SiteHeader({ whatsapp }: { whatsapp?: string }) {
  const wa = (whatsapp || "").replace(/\D/g, "");
  const displayedWhatsapp = wa ? displayPhoneNumber(wa) : "";
  return <>
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="brand">
          <Image className="brand-logo" src="/sthelp-mark.png" alt="" width={48} height={48} priority />
          <span className="brand-copy">StHelp<small>Assignment Support</small></span>
        </Link>
        <nav className="nav-links" aria-label="Main navigation">
          {navigation.map((item) => <Link href={item.href} prefetch={item.prefetch} key={item.href}>{item.label}</Link>)}
        </nav>
        <details className="mobile-nav">
          <summary><Menu size={19} /><span>Menu</span></summary>
          <nav className="mobile-nav-panel" aria-label="Mobile navigation">
            {navigation.map((item) => <Link href={item.href} prefetch={item.prefetch} key={item.href}>{item.label}</Link>)}
          </nav>
        </details>
      </div>
    </header>
    <Link className="floating-assignment-cta" href="/place-assignment" aria-label="Start a new assignment request"><span><small>Need support?</small><strong>Start your assignment</strong></span><i><ArrowUpRight size={20}/></i></Link>
    {wa ? <a className="floating-whatsapp" href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" aria-label={`Chat with StHelp on WhatsApp at ${displayedWhatsapp}`} title={`WhatsApp ${displayedWhatsapp}`}><WhatsAppIcon/><span className="sr-only">WhatsApp {displayedWhatsapp}</span></a> : null}
  </>;
}
