import { requireAdminPage } from "@/lib/auth";
import { AdminNav } from "@/components/AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdminPage();
  return <div className="admin-layout"><AdminNav/><div className="admin-main"><header className="admin-topbar"><div><strong>StHelp management</strong><div className="tiny muted">Secure administrator workspace</div></div><div className="small muted">{session.username}</div></header>{children}</div></div>;
}
