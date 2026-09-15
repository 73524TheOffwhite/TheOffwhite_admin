import { formatDistanceToNow } from "date-fns";
import { listAdminUsers } from "@/lib/admin-users";
import { supabase } from "@/lib/supabase";

export type ActivityItem = {
  id: string;
  name: string;
  note: string;
  ago: string;
  createdAt: string;
  avatarUrl: string | null;
};

const SLUG_NOTES: Record<string, string> = {
  home: "Updated the homepage",
  about: "Edited about page",
  "the-space": "Updated The Space page",
  reservations: "Edited reservation page",
  contact: "Updated contact page",
  "level-4": "Updated Level 4 page",
  "level-5": "Updated Level 5 page",
  menu: "Updated menu items",
  gallery: "Updated gallery",
};

const UNKNOWN = "Unknown user";

/** Original operator account used before multi-user admin — for unlabeled history only. */
const LEGACY_OPERATOR = {
  name: "Binaryvisionai",
  emailHint: "binaryvision",
};

function relativeAgo(iso: string) {
  try {
    const label = formatDistanceToNow(new Date(iso), { addSuffix: true });
    return label
      .replace(/^about /i, "")
      .replace(" minutes", "m")
      .replace(" minute", "m")
      .replace(" hours", "hrs")
      .replace(" hour", "hr")
      .replace(" days", "d")
      .replace(" day", "d")
      .replace("less than a minute ago", "Just now")
      .replace("a minute ago", "1m ago");
  } catch {
    return "";
  }
}

function prettifyUsername(raw: string) {
  const cleaned = raw.replace(/[._-]+/g, " ").trim();
  if (!cleaned) return raw;
  return cleaned
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function displayNameFromUser(user: {
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
} | null) {
  if (!user) return null;
  const meta = user.user_metadata ?? {};
  const fullName = typeof meta.full_name === "string" ? meta.full_name.trim() : "";
  const name = typeof meta.name === "string" ? meta.name.trim() : "";
  if (fullName) return fullName;
  if (name) return name;
  if (user.email) return prettifyUsername(user.email.split("@")[0] || user.email);
  return null;
}

function isGenericName(name: string) {
  const n = name.trim();
  return !n || /^admin$/i.test(n) || /^unknown user$/i.test(n);
}

async function currentActor() {
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) {
    return { id: null as string | null, name: UNKNOWN, avatarUrl: null as string | null };
  }
  const meta = user.user_metadata ?? {};
  const name = displayNameFromUser(user) || UNKNOWN;
  const avatarUrl = typeof meta.avatar_url === "string" ? meta.avatar_url : null;
  return { id: user.id, name, avatarUrl };
}

/**
 * Historical page_content rows never stored an author. Prefer:
 * 1) Most common real name already logged in admin_activity
 * 2) Original Binaryvision account / oldest admin user (not the current viewer)
 */
async function resolveHistoricalOperator(): Promise<{
  name: string;
  avatarUrl: string | null;
} | null> {
  const { data: past } = await supabase
    .from("admin_activity")
    .select("actor_name,avatar_url")
    .order("created_at", { ascending: false })
    .limit(200);

  if (past?.length) {
    const counts = new Map<string, { count: number; avatarUrl: string | null }>();
    for (const row of past) {
      const name = (row.actor_name || "").trim();
      if (isGenericName(name)) continue;
      const prev = counts.get(name) || { count: 0, avatarUrl: null };
      counts.set(name, {
        count: prev.count + 1,
        avatarUrl: prev.avatarUrl || row.avatar_url || null,
      });
    }
    let best: { name: string; count: number; avatarUrl: string | null } | null = null;
    for (const [name, info] of counts) {
      if (!best || info.count > best.count) {
        best = { name, count: info.count, avatarUrl: info.avatarUrl };
      }
    }
    if (best?.avatarUrl) return { name: best.name, avatarUrl: best.avatarUrl };
    if (best) {
      const avatarUrl = await avatarForOperator(best.name, LEGACY_OPERATOR.emailHint);
      return { name: best.name, avatarUrl };
    }
  }

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (accessToken) {
      const { users } = await listAdminUsers({ data: { accessToken } });
      if (users?.length) {
        const binary = users.find((u) =>
          (u.email || "").toLowerCase().includes(LEGACY_OPERATOR.emailHint),
        );
        if (binary) {
          return {
            name: binary.name || prettifyUsername(binary.email.split("@")[0]),
            avatarUrl: binary.avatarUrl,
          };
        }

        const oldest = [...users].sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
        if (oldest) {
          return {
            name: oldest.name || prettifyUsername(oldest.email.split("@")[0]),
            avatarUrl: oldest.avatarUrl,
          };
        }
      }
    }
  } catch (err) {
    console.warn("[activity-log] resolveHistoricalOperator:", err);
  }

  const avatarUrl = await avatarForOperator(LEGACY_OPERATOR.name, LEGACY_OPERATOR.emailHint);
  return { name: LEGACY_OPERATOR.name, avatarUrl };
}

/** Profile photo for an operator — from auth users list, or current session if same account. */
async function avatarForOperator(name: string, emailHint?: string): Promise<string | null> {
  const actor = await currentActor();
  const { data: userData } = await supabase.auth.getUser();
  const email = (userData.user?.email || "").toLowerCase();
  const sameAccount =
    (!!emailHint && email.includes(emailHint)) ||
    (!!name && actor.name.toLowerCase() === name.toLowerCase());
  if (sameAccount && actor.avatarUrl) return actor.avatarUrl;

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) return sameAccount ? actor.avatarUrl : null;

    const { users } = await listAdminUsers({ data: { accessToken } });
    const match =
      users.find((u) => emailHint && u.email.toLowerCase().includes(emailHint)) ||
      users.find((u) => u.name.toLowerCase() === name.toLowerCase());
    if (match?.avatarUrl) return match.avatarUrl;
  } catch {
    /* soft-fail */
  }

  return null;
}

function withResolvedAvatar(
  item: ActivityItem,
  historical: { name: string; avatarUrl: string | null } | null,
): ActivityItem {
  if (item.avatarUrl) return item;
  if (
    historical?.avatarUrl &&
    (item.name.toLowerCase() === historical.name.toLowerCase() ||
      item.name.toLowerCase() === LEGACY_OPERATOR.name.toLowerCase())
  ) {
    return { ...item, avatarUrl: historical.avatarUrl };
  }
  return item;
}

/** Soft-fail so CMS saves never break if the table is missing. */
export async function logActivity(note: string) {
  try {
    const actor = await currentActor();
    const { error } = await supabase.from("admin_activity").insert({
      actor_id: actor.id,
      actor_name: actor.name,
      action: note,
      avatar_url: actor.avatarUrl,
    });
    if (error) {
      console.warn("[activity-log]", error.message);
    }
  } catch (err) {
    console.warn("[activity-log]", err);
  }
}

export function activityNoteForSlug(slug: string) {
  return SLUG_NOTES[slug] ?? `Updated ${slug} page`;
}

async function loadFromActivityTable(limit: number): Promise<ActivityItem[] | null> {
  const { data, error } = await supabase
    .from("admin_activity")
    .select("id,actor_name,action,avatar_url,created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return null;
  if (data.length === 0) return [];

  const historical = await resolveHistoricalOperator();

  return data.map((row) => {
    const stored = (row.actor_name || "").trim();
    const useHistorical = isGenericName(stored) && historical;
    const item: ActivityItem = {
      id: String(row.id),
      name: useHistorical ? historical.name : stored || historical?.name || UNKNOWN,
      note: row.action || "Made a change",
      ago: relativeAgo(row.created_at),
      createdAt: row.created_at,
      avatarUrl: row.avatar_url ?? null,
    };
    return withResolvedAvatar(item, historical);
  });
}

/** Fallback when admin_activity is empty — page_content has no author column. */
async function loadFromPageContent(limit: number): Promise<ActivityItem[]> {
  const [{ data, error }, historical] = await Promise.all([
    supabase
      .from("page_content")
      .select("id,slug,updated_at")
      .not("updated_at", "is", null)
      .order("updated_at", { ascending: false })
      .limit(limit),
    resolveHistoricalOperator(),
  ]);

  if (error || !data?.length) return [];

  const name = historical?.name || UNKNOWN;
  const avatarUrl = historical?.avatarUrl ?? null;

  return data.map((row) => ({
    id: `page-${row.id}`,
    name,
    note: activityNoteForSlug(String(row.slug ?? "")),
    ago: relativeAgo(row.updated_at),
    createdAt: row.updated_at,
    avatarUrl,
  }));
}

export async function loadRecentActivity(limit = 8): Promise<ActivityItem[]> {
  const fromTable = await loadFromActivityTable(limit);
  if (fromTable && fromTable.length > 0) return fromTable;
  return loadFromPageContent(limit);
}
