import { useQuery } from "@tanstack/react-query";
import { DOCUMENTS_BUCKET, supabase } from "../lib/supabase";
import type { SharedDocument } from "../lib/types";
import { keys, unwrap } from "./core";

export function useDocuments() {
  return useQuery({
    queryKey: keys.documents,
    queryFn: () =>
      unwrap<SharedDocument[]>(supabase.from("documents").select("*").order("created_at", { ascending: false })),
  });
}

export interface DocumentUpload {
  area_id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  request_id?: string | null;
  filing_id?: string | null;
  file?: File | null;
  external_url?: string | null;
}

function safeFileName(name: string) {
  return name.normalize("NFKD").replace(/[^\w.-]+/g, "_").slice(-120) || "file";
}

/** Upload the file (if any) to private storage, then record it. Objects live under "<area_id>/". */
export async function uploadDocument(input: DocumentUpload, userId: string) {
  let storage_path: string | null = null;
  if (input.file) {
    storage_path = `${input.area_id}/${crypto.randomUUID()}-${safeFileName(input.file.name)}`;
    const { error } = await supabase.storage.from(DOCUMENTS_BUCKET).upload(storage_path, input.file, {
      contentType: input.file.type || undefined,
    });
    if (error) throw error;
  }
  const { error } = await supabase.from("documents").insert({
    area_id: input.area_id,
    title: input.title,
    description: input.description || null,
    category: input.category || null,
    request_id: input.request_id || null,
    filing_id: input.filing_id || null,
    external_url: input.external_url || null,
    storage_path,
    file_name: input.file?.name ?? null,
    file_size: input.file?.size ?? null,
    mime_type: input.file?.type || null,
    uploaded_by: userId,
  });
  if (error) {
    if (storage_path) await supabase.storage.from(DOCUMENTS_BUCKET).remove([storage_path]);
    throw error;
  }
}

export async function deleteDocument(doc: SharedDocument) {
  await unwrap(supabase.from("documents").delete().eq("id", doc.id));
  if (doc.storage_path) await supabase.storage.from(DOCUMENTS_BUCKET).remove([doc.storage_path]);
}

/** Open a file via a short-lived signed URL (the bucket is private). */
export async function openDocument(doc: SharedDocument) {
  if (!doc.storage_path) {
    if (doc.external_url) window.open(doc.external_url, "_blank", "noopener");
    return;
  }
  const win = window.open("", "_blank");
  const { data, error } = await supabase.storage.from(DOCUMENTS_BUCKET).createSignedUrl(doc.storage_path, 120, {
    download: doc.file_name ?? true,
  });
  if (error || !data) {
    win?.close();
    throw error ?? new Error("Could not open file");
  }
  if (win) win.location.href = data.signedUrl;
  else window.location.href = data.signedUrl;
}
