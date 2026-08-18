import { AdminNav } from "@/components/AdminNav";
import { requireAdminPage } from "@/lib/auth";

export const metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdminPage();

  return (
    <div className="admin-layout">
      <AdminNav />
      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-title">
            <strong>Management workspace</strong>
            <span>StHelp operations</span>
          </div>
          <div className="admin-user" title={`Signed in as ${session.username}`}>
            <span>{session.username.slice(0, 1).toUpperCase()}</span>
            <div>
              <small>Signed in as</small>
              <strong>{session.username}</strong>
            </div>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
