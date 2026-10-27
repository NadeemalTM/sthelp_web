import Link from "next/link";
import Image from "next/image";
import { Menu } from "lucide-react";
import { FloatingAssignmentCta } from "@/components/FloatingAssignmentCta";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";

function displayPhoneNumber(number: string) {
  const sriLankan = number.match(/^94(\d{2})(\d{3})(\d{4})$/);
  if (sriLankan) return `+94 ${sriLankan[1]} ${sriLankan[2]} ${sriLankan[3]}`;
  return `+${number.replace(/(\d{3})(?=\d)/g, "$1 ")}`;
}

const navigation = [
  { href: "/assignment-support", label: "Assignment support" },
  { href: "/pricing", label: "Pricing" },
  { href: "/calculator", label: "Calculator" },
  { href: "/student-resources", label: "Student resources" },
  { href: "/#work", label: "Previous work" },
  { href: "/#feedback", label: "Feedback" },
  { href: "/access", label: "Track assignment", prefetch: false }
];

export function SiteHeader({ whatsapp, suppressFloatingCtaNear }: { whatsapp?: string; suppressFloatingCtaNear?: string }) {
  const wa = (whatsapp || "").replace(/\D/g, "");
  const displayedWhatsapp = wa ? displayPhoneNumber(wa) : "";
  return <>
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="brand">
          <Image className="brand-logo" src="/sthelp-mark.png" alt="" width={48} height={48} />
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
    <FloatingAssignmentCta watchSelector={suppressFloatingCtaNear}/>
    {wa ? (
      <a
        className="floating-whatsapp"
        href={`https://wa.me/${wa}?text=${encodeURIComponent("Hi StHelp! I need university assignment support. Can you review my requirements and provide a quote?")}`}
        target="_blank"
        rel="noreferrer"
        aria-label={`Chat with StHelp on WhatsApp at ${displayedWhatsapp}`}
        title={`WhatsApp ${displayedWhatsapp}`}
      >
        <WhatsAppIcon />
        <span className="sr-only">WhatsApp {displayedWhatsapp}</span>
      </a>
    ) : null}
  </>;
}
