import Link from "next/link";

export function SiteHeader({ whatsapp }: { whatsapp?: string }) {
  const wa = (whatsapp || "").replace(/\D/g, "");
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="brand">
          <span className="brand-mark">St</span>
          <span className="brand-copy">StHelp<small>Assignment Support</small></span>
        </Link>
        <nav className="nav-links" aria-label="Main navigation">
          <Link href="/#work">Previous work</Link>
          <Link href="/#feedback">Feedback</Link>
          <Link href="/access">Track assignment</Link>
          {wa ? <a className="btn btn-primary btn-sm" href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer">WhatsApp</a> : null}
        </nav>
      </div>
    </header>
  );
}
