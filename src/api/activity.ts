import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Activity } from "../lib/types";
import { keys, unwrap } from "./core";

export function useActivity(limit = 200) {
  return useQuery({
    queryKey: [...keys.activity, limit],
    queryFn: () =>
      unwrap<Activity[]>(
        supabase.from("activity_log").select("*").order("created_at", { ascending: false }).limit(limit),
      ),
  });
}
