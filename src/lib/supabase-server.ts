import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let serviceClient: SupabaseClient | null = null;

function getSupabaseServerEnvironment() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
    publishableKey:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    secretKey: process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  };
}

export function isSupabaseConfigured() {
  const { url, publishableKey, secretKey } = getSupabaseServerEnvironment();
  return Boolean(url && publishableKey && secretKey);
}

export function getServiceSupabase() {
  if (serviceClient) return serviceClient;

  const { url, secretKey } = getSupabaseServerEnvironment();
  if (!url || !secretKey) {
    throw new Error(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in Vercel, then redeploy."
    );
  }

  serviceClient = createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  return serviceClient;
}
