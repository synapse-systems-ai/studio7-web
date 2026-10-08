import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt-auth";
import { getServiceRoleSupabase } from "@/lib/supabase-service-lazy";

async function enrichSupplierUser(user) {
  if (user.role !== "supplier" || user.supplier_id) return user;

  const { data } = await getServiceRoleSupabase()
    .from("users")
    .select("supplier_id")
    .eq("id", user.id)
    .maybeSingle();

  if (data?.supplier_id) {
    return { ...user, supplier_id: data.supplier_id };
  }
  return user;
}

/** Merge JWT claims with current DB fields (store_id, role) so stale tokens don't break store-scoped APIs. */
async function enrichDbUser(user) {
  const { data: dbUser, error } = await getServiceRoleSupabase()
    .from("users")
    .select("id, role, store_id, is_active, name")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !dbUser || !dbUser.is_active) {
    return null;
  }

  const merged = await enrichSupplierUser({
    ...user,
    role: dbUser.role ?? user.role,
    store_id: dbUser.store_id ?? user.store_id ?? null,
    name: dbUser.name ?? user.name,
    is_active: dbUser.is_active,
  });

  return merged;
}

/**
 * Verify the auth-token cookie and return the user payload.
 * Returns { user } on success, or { error: NextResponse } on failure.
 */
export async function authenticateRequest(request) {
  const token = request.cookies.get("auth-token")?.value;

  if (!token) {
    return {
      error: NextResponse.json({ error: "Authentication required" }, { status: 401 }),
    };
  }

  const payload = await verifyToken(token);

  if (!payload) {
    return {
      error: NextResponse.json({ error: "Invalid or expired token" }, { status: 401 }),
    };
  }

  const user = await enrichDbUser(payload);

  if (!user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { user };
}

/**
 * Verify the request is authenticated and the user has one of the required roles.
 * `admin` always passes, regardless of `allowedRoles` - the role-feature matrix
 * (lib/role-permissions.js) already declares admin = full access to every
 * feature, and per-route allowlists routinely forget to list "admin"
 * explicitly alongside e.g. "store_manager". Rather than audit every one of
 * the ~500 routes that call this, admin is treated as a universal bypass here
 * so that gap can't recur route-by-route.
 */
export async function authenticateWithRole(request, allowedRoles) {
  const { user, error } = await authenticateRequest(request);

  if (error) return { error };

  const role = String(user.role || "").toLowerCase();
  const isAdmin = role === "admin";

  if (!isAdmin && !allowedRoles.map(r => r.toLowerCase()).includes(role)) {
    return {
      error: NextResponse.json({ error: "Insufficient permissions" }, { status: 403 }),
    };
  }

  return { user };
}
