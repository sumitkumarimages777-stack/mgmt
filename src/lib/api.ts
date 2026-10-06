// Data access. Every query runs as the signed-in user, so Row Level Security
// in the database decides what comes back — the UI never sees rows the user
// isn't allowed to.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DOCUMENTS_BUCKET, supabase } from "./supabase";
import type {
  Activity, Area, AreaMember, Comment, DocumentRequest, Filing, Profile, SharedDocument,
} from "./types";

async function unwrap<T>(p: PromiseLike<{ data: T | null; error: unknown }>): Promise<T> {
  const { data, error } = await p;
  if (error) throw error;
  return data as T;
}

export const keys = {
  areas: ["areas"] as const,
  profiles: ["profiles"] as const,
  members: ["area_members"] as const,
  filings: ["filings"] as const,
  requests: ["requests"] as const,
  documents: ["documents"] as const,
  activity: ["activity"] as const,
  comments: (kind: "request" | "filing", id: string) => ["comments", kind, id] as const,
};

export function useAreas() {
  return useQuery({
    queryKey: keys.areas,
    queryFn: () => unwrap<Area[]>(supabase.from("areas").select("*").order("name")),
  });
}

export function useProfiles() {
  return useQuery({
    queryKey: keys.profiles,
    queryFn: () => unwrap<Profile[]>(supabase.from("profiles").select("*").order("full_name")),
  });
}

export function useAreaMembers(enabled = true) {
  return useQuery({
    queryKey: keys.members,
    enabled,
    queryFn: () => unwrap<AreaMember[]>(supabase.from("area_members").select("area_id, user_id, permission")),
  });
}

export function useFilings() {
  return useQuery({
    queryKey: keys.filings,
    queryFn: () => unwrap<Filing[]>(supabase.from("filings").select("*").order("due_date")),
  });
}

export function useRequests() {
  return useQuery({
    queryKey: keys.requests,
    queryFn: () =>
      unwrap<DocumentRequest[]>(supabase.from("document_requests").select("*").order("created_at", { ascending: false })),
  });
}

export function useDocuments() {
  return useQuery({
    queryKey: keys.documents,
    queryFn: () =>
      unwrap<SharedDocument[]>(supabase.from("documents").select("*").order("created_at", { ascending: false })),
  });
}

export function useActivity(limit = 200) {
  return useQuery({
    queryKey: [...keys.activity, limit],
    queryFn: () =>
      unwrap<Activity[]>(
        supabase.from("activity_log").select("*").order("created_at", { ascending: false }).limit(limit),
      ),
  });
}

export function useComments(kind: "request" | "filing", id: string) {
  return useQuery({
    queryKey: keys.comments(kind, id),
    queryFn: () =>
      unwrap<Comment[]>(
        supabase.from("comments").select("*").eq(kind === "request" ? "request_id" : "filing_id", id).order("created_at"),
      ),
  });
}

/** Lookup maps used all over the UI. */
export function useLookups() {
  const areas = useAreas();
  const profiles = useProfiles();
  const areaById = new Map((areas.data ?? []).map((a) => [a.id, a]));
  const personById = new Map((profiles.data ?? []).map((p) => [p.id, p]));
  return {
    areas: areas.data ?? [],
    areaById,
    personById,
    personName: (id: string | null | undefined) => {
      if (!id) return "—";
      const p = personById.get(id);
      return p ? p.full_name || p.email : "Unknown";
    },
  };
}

/**
 * Wrap a write so the listed caches refresh afterwards. Activity is always
 * refreshed because database triggers write to it.
 */
export function useWrite<TArgs>(fn: (args: TArgs) => Promise<unknown>, invalidate: ReadonlyArray<readonly unknown[]>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: async () => {
      await Promise.all([...invalidate, keys.activity].map((k) => qc.invalidateQueries({ queryKey: k })));
    },
  });
}

// ---------- writes ----------

export type FilingInput = Partial<Omit<Filing, "id" | "created_at" | "updated_at" | "created_by">>;

export async function saveFiling(id: string | null, input: FilingInput) {
  if (id) return unwrap(supabase.from("filings").update(input).eq("id", id).select().single());
  return unwrap(supabase.from("filings").insert(input).select().single());
}

export async function deleteFiling(id: string) {
  return unwrap(supabase.from("filings").delete().eq("id", id));
}

/** Bulk-insert filings, silently skipping ones that already exist (same area + title + period). */
export async function insertFilingsSkippingExisting(rows: FilingInput[]) {
  const { data, error } = await supabase
    .from("filings")
    .upsert(rows, { onConflict: "area_id,title,period", ignoreDuplicates: true })
    .select("id");
  if (error) throw error;
  return data?.length ?? 0;
}

export type RequestInput = Partial<Pick<DocumentRequest, "area_id" | "title" | "description" | "filing_id" | "due_date" | "status">>;

export async function saveRequest(id: string | null, input: RequestInput) {
  if (id) return unwrap(supabase.from("document_requests").update(input).eq("id", id).select().single());
  return unwrap(supabase.from("document_requests").insert(input).select().single());
}

export async function deleteRequest(id: string) {
  return unwrap(supabase.from("document_requests").delete().eq("id", id));
}

export async function addComment(kind: "request" | "filing", parentId: string, body: string) {
  return unwrap(
    supabase.from("comments").insert({
      [kind === "request" ? "request_id" : "filing_id"]: parentId,
      body,
      // area_id is filled in by a database trigger from the parent item
    }),
  );
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

/** Upload the file (if any) to private storage, then record it. */
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

export function formatBytes(n: number | null | undefined) {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function errorMessage(e: unknown): string {
  if (!e) return "";
  if (e instanceof Error) return e.message;
  if (typeof e === "object" && "message" in e) return String((e as { message: unknown }).message);
  return String(e);
}
