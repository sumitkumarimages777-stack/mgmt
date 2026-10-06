import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";

/** True until the first admin account exists. */
export function useSetupRequired() {
  return useQuery({
    queryKey: ["setup_required"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("setup_required");
      if (error) throw error;
      return data as boolean;
    },
  });
}
