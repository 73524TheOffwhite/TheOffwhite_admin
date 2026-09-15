import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

export type AdminUserRow = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  createdAt: string;
  lastSignInAt: string | null;
};

function env(name: string) {
  const fromProcess =
    typeof process !== "undefined" ? process.env?.[name]?.trim() : undefined;
  if (fromProcess) return fromProcess;
  try {
    const meta = import.meta.env as Record<string, string | undefined>;
    return meta[name]?.trim() || undefined;
  } catch {
    return undefined;
  }
}

function getSupabaseUrl() {
  return (
    env("SUPABASE_URL") ||
    env("VITE_SUPABASE_URL")?.replace(/\/$/, "") ||
    ""
  ).replace(/\/$/, "");
}

function getServiceRoleKey() {
  return env("SUPABASE_SERVICE_ROLE_KEY") || "";
}

function adminClient() {
  const url = getSupabaseUrl();
  const key = getServiceRoleKey();
  if (!url || !key) {
    throw new Error(
      "Server is missing SUPABASE_SERVICE_ROLE_KEY. Add it as a Cloudflare Worker secret (and locally in .env), then redeploy admin.",
    );
  }
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function requireCaller(accessToken: string) {
  const token = accessToken?.trim();
  if (!token) throw new Error("Not signed in.");
  const { data, error } = await adminClient().auth.getUser(token);
  if (error || !data.user) throw new Error("Session expired. Sign in again.");
  return data.user;
}

function mapUser(user: {
  id: string;
  email?: string | null;
  created_at: string;
  last_sign_in_at?: string | null;
  user_metadata?: Record<string, unknown> | null;
}): AdminUserRow {
  const meta = user.user_metadata ?? {};
  const name =
    (typeof meta.full_name === "string" && meta.full_name) ||
    (typeof meta.name === "string" && meta.name) ||
    user.email?.split("@")[0] ||
    "Admin";
  const avatarUrl = typeof meta.avatar_url === "string" ? meta.avatar_url : null;
  return {
    id: user.id,
    email: user.email ?? "",
    name,
    avatarUrl,
    createdAt: user.created_at,
    lastSignInAt: user.last_sign_in_at ?? null,
  };
}

export const listAdminUsers = createServerFn({ method: "POST" })
  .inputValidator((data: { accessToken: string }) => data)
  .handler(async ({ data }) => {
    await requireCaller(data.accessToken);
    const client = adminClient();
    const { data: listed, error } = await client.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    if (error) throw new Error(error.message);
    const users = (listed.users ?? []).map(mapUser).sort((a, b) =>
      a.email.localeCompare(b.email),
    );
    return { users };
  });

export const createAdminUser = createServerFn({ method: "POST" })
  .inputValidator(
    (data: { accessToken: string; name: string; email: string; password: string }) => data,
  )
  .handler(async ({ data }) => {
    await requireCaller(data.accessToken);

    const name = data.name.trim();
    const email = data.email.trim().toLowerCase();
    const password = data.password;

    if (!name) throw new Error("Name is required.");
    if (!email || !email.includes("@")) throw new Error("A valid email is required.");
    if (!password || password.length < 6) {
      throw new Error("Password must be at least 6 characters.");
    }

    const client = adminClient();
    const { data: created, error } = await client.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name },
    });
    if (error) throw new Error(error.message);
    if (!created.user) throw new Error("User was not created.");
    return { user: mapUser(created.user) };
  });
