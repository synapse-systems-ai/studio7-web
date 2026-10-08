import { NextResponse } from "next/server";
import { authenticateWithRole } from "@/lib/api-auth";
import { getServiceRoleSupabase } from "@/lib/supabase-service-lazy";
import { PROMOTIONS_ACCESS_ROLES } from "@/lib/promotions-auth";
import { PRODUCT_IMAGES_BUCKET, ensureProductImagesBucket } from "@/lib/product-images-storage";

/** POST /api/admin/promotions/upload-image - hero image for a campaign landing page */
export async function POST(request) {
  const { error } = await authenticateWithRole(request, PROMOTIONS_ACCESS_ROLES);
  if (error) return error;

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: "Use JPG, PNG, WebP, or GIF" }, { status: 400 });
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Image must be under 5MB" }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
  const filePath = `promos/${fileName}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const supabase = getServiceRoleSupabase();

  const bucketReady = await ensureProductImagesBucket(supabase);
  if (!bucketReady.ok) {
    return NextResponse.json(
      {
        error:
          bucketReady.error ||
          "Storage bucket missing. Run Supabase migration 20261007120000_product_images_storage_bucket or create a public product-images bucket.",
      },
      { status: 500 },
    );
  }

  const { error: uploadErr } = await supabase.storage.from(PRODUCT_IMAGES_BUCKET).upload(filePath, buffer, {
    contentType: file.type,
    cacheControl: "3600",
    upsert: false,
  });

  if (uploadErr) {
    return NextResponse.json({ error: uploadErr.message }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(filePath);

  return NextResponse.json({ success: true, url: publicUrl, path: filePath });
}
