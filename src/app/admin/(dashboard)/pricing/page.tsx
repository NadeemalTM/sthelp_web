import { PricingManager } from "./PricingManager";
import { isSupabaseConfigured } from "@/lib/supabase-server";

export const metadata = { title: "Pricing management" };
export const dynamic = "force-dynamic";

export default function PricingPage() {
  return <PricingManager supabaseConfigured={isSupabaseConfigured()}/>;
}
