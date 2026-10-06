import { createClient } from "@supabase/supabase-js";

// The URL and publishable key are public by design — every browser that loads
// the app receives them. Data is protected by Row Level Security in the
// database, not by hiding these. Override with VITE_SUPABASE_* env vars.
const url = import.meta.env.VITE_SUPABASE_URL || "https://hietxqbfpjbbavupspvd.supabase.co";
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_6AJY1MstjjTf4eAOBVYGxw_D9cK0EaX";

export const supabase = createClient(url, key);

export const DOCUMENTS_BUCKET = "documents";
