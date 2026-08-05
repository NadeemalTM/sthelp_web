import { AssignmentManager } from "./AssignmentManager";
import { isSupabaseConfigured } from "@/lib/supabase-server";

export const metadata = { title: "Manage assignment" };
export const dynamic = "force-dynamic";

export default async function AssignmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AssignmentManager assignmentId={id} supabaseConfigured={isSupabaseConfigured()}/>;
}
