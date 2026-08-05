import { NextResponse } from "next/server";
import { SupabaseConfigurationError } from "@/lib/supabase-server";

export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function apiRouteError(error: unknown, fallback: string, exposeMessage = false) {
  if (error instanceof SupabaseConfigurationError) {
    return apiError(error.message, 503);
  }
  if (exposeMessage && error instanceof Error) {
    return apiError(error.message, 500);
  }
  return apiError(fallback, 500);
}

export function logApiError(error: unknown) {
  if (!(error instanceof SupabaseConfigurationError)) {
    console.error(error);
  }
}

export function requiredText(value: unknown, label: string, max = 5000) {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) throw new Error(`${label} is required.`);
  if (text.length > max) throw new Error(`${label} is too long.`);
  return text;
}

export function optionalText(value: unknown, max = 5000) {
  const text = typeof value === "string" ? value.trim() : "";
  if (text.length > max) throw new Error("A submitted value is too long.");
  return text || null;
}

export function publicFile(file: any) {
  return {
    id: file.id,
    kind: file.kind,
    original_name: file.original_name,
    mime_type: file.mime_type,
    size_bytes: file.size_bytes,
    created_at: file.created_at
  };
}
