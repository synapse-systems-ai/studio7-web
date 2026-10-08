/** Public Supabase project ref for admin error messages (from NEXT_PUBLIC_SUPABASE_URL). */
export function getSupabaseProjectLabel() {
  const url = String(process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  if (!url) return "not configured";
  try {
    const host = new URL(url.startsWith("http") ? url : `https://${url}`).hostname;
    const ref = host.replace(/\.supabase\.co$/i, "");
    return ref || host;
  } catch {
    return "invalid URL";
  }
}
