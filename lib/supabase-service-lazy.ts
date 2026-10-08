import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let serviceRoleSingleton: SupabaseClient | null = null;

/** URL + SUPABASE_SERVICE_ROLE_KEY only — server-side route handlers. */
export function getServiceRoleSupabase(): SupabaseClient {
  if (!serviceRoleSingleton) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    if (!url || !key) {
      throw new Error(
        "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in the environment",
      );
    }
    serviceRoleSingleton = createClient(url, key);
  }
  return serviceRoleSingleton;
}
