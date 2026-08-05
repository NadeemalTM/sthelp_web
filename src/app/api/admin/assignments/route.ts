import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { apiError } from "@/lib/api";
import { getServiceSupabase } from "@/lib/supabase-server";

export async function GET() {
  const session = await requireAdminApi();
  if (!session) return apiError("Admin login required.", 401);
  try {
    const db = getServiceSupabase();
    const { data, error } = await db.from("assignments").select("*").order("created_at", { ascending: false }).limit(200);
    if (error) throw error;
    return NextResponse.json({ assignments: data || [] });
  } catch (error) {
    console.error(error);
    return apiError("Unable to load assignments.", 500);
  }
}
