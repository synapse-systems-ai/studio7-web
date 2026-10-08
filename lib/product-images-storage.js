/** Public bucket for product photos, promo heroes, and customer profile avatars. */
export const PRODUCT_IMAGES_BUCKET = "product-images";

const BUCKET_OPTIONS = {
  public: true,
  fileSizeLimit: 5 * 1024 * 1024,
  allowedMimeTypes: ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"],
};

/**
 * Create the bucket if missing (local/dev projects often skip manual Storage setup).
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase - service role
 */
export async function ensureProductImagesBucket(supabase) {
  const { data: buckets, error: listErr } = await supabase.storage.listBuckets();
  if (listErr) {
    return { ok: false, error: listErr.message };
  }
  if ((buckets || []).some((b) => b.name === PRODUCT_IMAGES_BUCKET)) {
    return { ok: true };
  }
  const { error: createErr } = await supabase.storage.createBucket(PRODUCT_IMAGES_BUCKET, BUCKET_OPTIONS);
  if (createErr) {
    return { ok: false, error: createErr.message };
  }
  return { ok: true };
}
