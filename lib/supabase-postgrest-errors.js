export function isSupabaseInfraError(error) {
  const msg = String(error?.message || error || "");
  return msg.includes("522") || msg.includes("502") || msg.includes("503") || msg.includes("ECONNRESET");
}

export function summarizeSupabaseError(error) {
  return error?.message || String(error);
}
