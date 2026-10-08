/**
 * One-off CLI: upsert a Studio 7 user (uses .env.local Supabase service role).
 * Usage: node scripts/upsert-studio7-user.mjs "Full Name" email@example.com "password" admin
 */
import { readFileSync } from "fs";
import { resolve } from "path";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  const text = readFileSync(path, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
}

const [, , name, email, password, role = "marketing"] = process.argv;

if (!name || !email || !password) {
  console.error('Usage: node scripts/upsert-studio7-user.mjs "Name" email password [role]');
  process.exit(1);
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key);
const normalizedEmail = email.trim().toLowerCase();
const password_hash = await bcrypt.hash(password, 10);

const { data: existing } = await supabase
  .from("users")
  .select("id")
  .eq("email", normalizedEmail)
  .maybeSingle();

let user;
if (existing?.id) {
  const { data, error } = await supabase
    .from("users")
    .update({
      name: name.trim(),
      password_hash,
      role: role.toLowerCase(),
      is_active: true,
    })
    .eq("id", existing.id)
    .select("id, email, name, role, is_active")
    .single();
  if (error) {
    console.error("Update failed:", error.message);
    process.exit(1);
  }
  user = data;
  console.log("Updated user:", user.email, user.role);
} else {
  const { data, error } = await supabase
    .from("users")
    .insert({
      name: name.trim(),
      email: normalizedEmail,
      password_hash,
      role: role.toLowerCase(),
      is_active: true,
    })
    .select("id, email, name, role, is_active")
    .single();
  if (error) {
    console.error("Insert failed:", error.message);
    process.exit(1);
  }
  user = data;
  console.log("Created user:", user.email, user.role);
}
