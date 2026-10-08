import { SignJWT, jwtVerify } from "jose";

/** @type {Uint8Array | undefined} */
let cachedJwtSecret;
/** Env value, or "__dev_placeholder__" when using the dev fallback - tracks cache invalidation */
let cachedSecretKey = null;

const DEV_PLACEHOLDER_KEY = "__dev_placeholder__";
const DEV_PLACEHOLDER_SECRET = "__dev_jwt_secret_set_JWT_SECRET_in_env_local__";

function secretFromEnv() {
  return process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
}

/**
 * Secret for signing tokens. Production requires JWT_SECRET or NEXTAUTH_SECRET.
 * Development falls back to a fixed placeholder so middleware can load without .env.
 */
function getJwtSecretForSigning() {
  const fromEnv = secretFromEnv();
  if (fromEnv) {
    if (cachedSecretKey !== fromEnv) {
      cachedSecretKey = fromEnv;
      cachedJwtSecret = new TextEncoder().encode(fromEnv);
    }
    return cachedJwtSecret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET or NEXTAUTH_SECRET environment variable is required");
  }

  if (cachedSecretKey !== DEV_PLACEHOLDER_KEY) {
    console.warn(
      "[jwt-auth] JWT_SECRET/NEXTAUTH_SECRET not set; using a dev-only placeholder. Add JWT_SECRET to .env.local for real sessions.",
    );
    cachedSecretKey = DEV_PLACEHOLDER_KEY;
    cachedJwtSecret = new TextEncoder().encode(DEV_PLACEHOLDER_SECRET);
  }
  return cachedJwtSecret;
}

/**
 * Secret for verifying tokens. Same as signing in dev; in production returns null if unset
 * so middleware does not crash on import and unauthenticated behavior applies until env is fixed.
 */
function getJwtSecretForVerifying() {
  const fromEnv = secretFromEnv();
  if (fromEnv) {
    if (cachedSecretKey !== fromEnv) {
      cachedSecretKey = fromEnv;
      cachedJwtSecret = new TextEncoder().encode(fromEnv);
    }
    return cachedJwtSecret;
  }
  if (process.env.NODE_ENV === "production") {
    return null;
  }
  return getJwtSecretForSigning();
}

export const TOKEN_NAME = "auth-token";
export const TOKEN_MAX_AGE = 60 * 60 * 24 * 14; // 14 days (covers 2 full weeks including Sunday payroll)
/** Shorter session when "Remember me" is off (JWT + dev client cookie). */
export const SESSION_MAX_AGE = 60 * 60 * 24;

/**
 * Create a JWT token for a user.
 * When `user.test_mode` is true, optional impersonation / restore fields are embedded so
 * `/api/auth/me`, middleware, and `/api/auth/refresh` can honor test sessions.
 */
export async function createToken(user, { rememberMe = true } = {}) {
  const claims = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    store_id: user.store_id ?? null,
    store_name: user.store_name ?? null,
    store_code: user.store_code ?? null,
    supplier_id: user.supplier_id || null,
  };

  if (user.test_mode === true) {
    claims.test_mode = true;
    if (user.original_role != null) claims.original_role = user.original_role;
    if (user.original_store_id !== undefined) claims.original_store_id = user.original_store_id;
    if (user.original_store_name !== undefined) claims.original_store_name = user.original_store_name;
    if (user.original_store_code !== undefined) claims.original_store_code = user.original_store_code;
    if (user.original_id != null) claims.original_id = user.original_id;
  }

  const token = await new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(rememberMe ? "14d" : "24h")
    .sign(getJwtSecretForSigning());

  return token;
}

/**
 * Create a short-lived token for password resets (1 hour expiry)
 */
export async function createResetToken(payload) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(getJwtSecretForSigning());

  return token;
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(token) {
  try {
    const secret = getJwtSecretForVerifying();
    if (!secret) {
      console.error(
        "JWT_SECRET or NEXTAUTH_SECRET environment variable is required (verification skipped)",
      );
      return null;
    }
    const verified = await jwtVerify(token, secret);
    return verified.payload;
  } catch (error) {
    console.error("Token verification failed:", error.message);
    return null;
  }
}

/**
 * Get token name (for client-side)
 */
export function getTokenName() {
  return TOKEN_NAME;
}
