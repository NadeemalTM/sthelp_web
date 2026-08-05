import { AdminDashboard } from "./AdminDashboard";
import { isSupabaseConfigured } from "@/lib/supabase-server";

export const metadata = { title: "Admin dashboard" };
export const dynamic = "force-dynamic";

export default function AdminPage() {
  return <AdminDashboard supabaseConfigured={isSupabaseConfigured()}/>;
}
