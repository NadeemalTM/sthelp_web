import Link from "next/link";
import Image from "next/image";

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
          <Link href="/assignment-support">Assignment support</Link>
          <Link href="/place-assignment">Place assignment</Link>
          <Link href="/#work">Previous work</Link>
          <Link href="/#feedback">Feedback</Link>
          <Link href="/access" prefetch={false}>Track assignment</Link>
          {wa ? <a className="btn btn-primary btn-sm" href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer">WhatsApp</a> : null}
        </nav>
      </div>
    </header>
  );
}
