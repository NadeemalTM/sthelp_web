"use client";

import Link from "next/link";
import Image from "next/image";
import { ClipboardList, ExternalLink, LayoutDashboard, LogOut, Settings2 } from "lucide-react";

export function AdminNav() {
  async function logout() {
    await fetch("/api/admin/logout", { method:"POST" });
    window.location.href = "/admin/login";
  }
  return <aside className="admin-sidebar"><Link href="/admin" className="brand"><Image className="brand-logo" src="/sthelp-mark.png" alt="" width={48} height={48}/><span className="brand-copy">StHelp<small>Admin panel</small></span></Link><nav className="admin-nav"><Link href="/admin"><LayoutDashboard size={18}/> Dashboard</Link><Link href="/admin#assignments"><ClipboardList size={18}/> Assignments</Link><Link href="/admin/content"><Settings2 size={18}/> Content & settings</Link><Link href="/" target="_blank"><ExternalLink size={18}/> View website</Link></nav><div className="admin-sidebar-footer"><button className="btn btn-outline btn-sm" onClick={logout}><LogOut size={16}/> Logout</button></div></aside>;
}
