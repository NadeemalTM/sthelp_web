import { ContentManager } from "./ContentManager";
import { isSupabaseConfigured } from "@/lib/supabase-server";

export const metadata = { title: "Content and settings" };
export const dynamic = "force-dynamic";

export default function ContentPage() {
  return <ContentManager supabaseConfigured={isSupabaseConfigured()}/>;
}
