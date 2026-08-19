import Link from "next/link";
import Image from "next/image";
import { Menu } from "lucide-react";

const navigation = [
  { href: "/assignment-support", label: "Assignment support" },
  { href: "/student-resources", label: "Student resources" },
  { href: "/place-assignment", label: "Place assignment" },
  { href: "/#work", label: "Previous work" },
  { href: "/#feedback", label: "Feedback" },
  { href: "/access", label: "Track assignment", prefetch: false }
];

export function SiteHeader({ whatsapp }: { whatsapp?: string }) {
  const wa = (whatsapp || "").replace(/\D/g, "");
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="brand">
          <Image className="brand-logo" src="/sthelp-mark.png" alt="" width={48} height={48} priority />
          <span className="brand-copy">StHelp<small>Assignment Support</small></span>
        </Link>
        <nav className="nav-links" aria-label="Main navigation">
          {navigation.map((item) => <Link href={item.href} prefetch={item.prefetch} key={item.href}>{item.label}</Link>)}
          {wa ? <a className="btn btn-primary btn-sm" href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer">WhatsApp</a> : null}
        </nav>
        <details className="mobile-nav">
          <summary><Menu size={19} /><span>Menu</span></summary>
          <nav className="mobile-nav-panel" aria-label="Mobile navigation">
            {navigation.map((item) => <Link href={item.href} prefetch={item.prefetch} key={item.href}>{item.label}</Link>)}
            {wa ? <a className="mobile-nav-whatsapp" href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer">Chat on WhatsApp</a> : null}
          </nav>
        </details>
      </div>
    </header>
  );
}
