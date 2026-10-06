import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Comment } from "../lib/types";
import { keys, unwrap, type CommentParent } from "./core";

const parentColumn = (kind: CommentParent) => (kind === "request" ? "request_id" : "filing_id");

export function useComments(kind: CommentParent, id: string) {
  return useQuery({
    queryKey: keys.comments(kind, id),
    queryFn: () =>
      unwrap<Comment[]>(supabase.from("comments").select("*").eq(parentColumn(kind), id).order("created_at")),
  });
}

export async function addComment(kind: CommentParent, parentId: string, body: string) {
  // area_id is filled in by a database trigger from the parent item
  return unwrap(supabase.from("comments").insert({ [parentColumn(kind)]: parentId, body }));
}
