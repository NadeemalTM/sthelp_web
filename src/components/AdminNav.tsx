"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Settings2
} from "lucide-react";

const navigation = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, match: (path: string) => path === "/admin" },
  { href: "/admin#assignments", label: "Assignments", icon: ClipboardList, match: (path: string) => path.startsWith("/admin/assignments") },
  { href: "/admin/content", label: "Website", icon: Settings2, match: (path: string) => path.startsWith("/admin/content") }
];

export function AdminNav() {
  const pathname = usePathname();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  return (
    <aside className="admin-sidebar">
      <Link href="/admin" className="brand admin-brand">
        <Image className="brand-logo" src="/sthelp-mark.png" alt="" width={48} height={48} />
        <span className="brand-copy">
          StHelp
          <small>Admin</small>
        </span>
      </Link>

      <div className="admin-nav-label">Workspace</div>
      <nav className="admin-nav" aria-label="Admin navigation">
        {navigation.map(({ href, label, icon: Icon, match }) => {
          const isActive = match(pathname);
          return (
            <Link href={href} className={isActive ? "active" : undefined} key={href} title={label} aria-current={isActive ? "page" : undefined}>
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          );
        })}
        <Link href="/" target="_blank" title="View website">
          <ExternalLink size={18} />
          <span>View website</span>
        </Link>
      </nav>

      <div className="admin-sidebar-footer">
        <button type="button" className="admin-logout" onClick={logout} title="Sign out">
          <LogOut size={17} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
