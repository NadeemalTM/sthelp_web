import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Menu } from "lucide-react";

function WhatsAppIcon() {
  return <svg aria-hidden="true" viewBox="0 0 32 32" width="19" height="19" fill="currentColor"><path d="M16.04 3A12.84 12.84 0 0 0 5.1 22.56L3.2 29l6.61-1.73A12.84 12.84 0 1 0 16.04 3Zm0 23.5c-1.9 0-3.76-.51-5.39-1.47l-.39-.23-3.92 1.03 1.05-3.82-.25-.4a10.62 10.62 0 1 1 8.9 4.89Zm5.83-7.95c-.32-.16-1.89-.93-2.18-1.04-.29-.11-.5-.16-.72.16-.21.32-.82 1.04-1.01 1.25-.19.21-.37.24-.69.08-.32-.16-1.35-.5-2.57-1.58a9.67 9.67 0 0 1-1.78-2.21c-.19-.32-.02-.49.14-.65.14-.14.32-.37.48-.56.16-.19.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.72-1.73-.98-2.37-.26-.62-.52-.54-.72-.55h-.61c-.21 0-.56.08-.85.4-.29.32-1.12 1.09-1.12 2.66s1.14 3.08 1.3 3.29c.16.21 2.24 3.42 5.43 4.8.76.33 1.35.52 1.81.67.76.24 1.45.21 2 .13.61-.09 1.89-.77 2.16-1.52.27-.74.27-1.38.19-1.52-.08-.13-.29-.21-.61-.37Z"/></svg>;
}

function displayPhoneNumber(number: string) {
  const sriLankan = number.match(/^94(\d{2})(\d{3})(\d{4})$/);
  if (sriLankan) return `+94 ${sriLankan[1]} ${sriLankan[2]} ${sriLankan[3]}`;
  return `+${number.replace(/(\d{3})(?=\d)/g, "$1 ")}`;
}

const navigation = [
  { href: "/assignment-support", label: "Assignment support" },
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
