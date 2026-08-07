"use client";

import { getBrowserSupabase } from "@/lib/supabase-browser";

type UploadScope = "client-support" | "client-payment" | "admin-preview" | "admin-final";

export async function uploadPrivateFile({
  file,
  scope,
  token,
  assignmentId
}: {
  file: File;
  scope: UploadScope;
  token?: string;
  assignmentId?: string;
}) {
  const response = await fetch("/api/upload/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      scope,
      token,
      assignmentId,
      name: file.name,
      mimeType: file.type || "application/octet-stream",
      size: file.size
    })
  });

  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "Unable to prepare the upload.");

  const supabase = getBrowserSupabase();
  const { error } = await supabase.storage
    .from("assignment-files")
    .uploadToSignedUrl(payload.path, payload.uploadToken, file, {
      contentType: file.type || "application/octet-stream"
    });

  if (error) throw new Error(error.message);

  return {
    storagePath: payload.path as string,
    originalName: file.name,
    mimeType: file.type || "application/octet-stream",
    sizeBytes: file.size
  };
}

export async function uploadPublicImage({ file }: { file: File }) {
  const response = await fetch("/api/upload/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      scope: "portfolio-image",
      name: file.name,
      mimeType: file.type || "application/octet-stream",
      size: file.size
    })
  });

  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "Unable to prepare the upload.");

  const supabase = getBrowserSupabase();
  const { error } = await supabase.storage
    .from(payload.bucket || "portfolio-images")
    .uploadToSignedUrl(payload.path, payload.uploadToken, file, {
      contentType: file.type || "application/octet-stream"
    });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(payload.bucket || "portfolio-images").getPublicUrl(payload.path);

  return {
    imageUrl: data.publicUrl,
    storagePath: payload.path as string,
    originalName: file.name,
    mimeType: file.type || "application/octet-stream",
    sizeBytes: file.size
  };
}
