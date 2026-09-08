import { formatDistanceToNow } from "date-fns";
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

async function currentActor() {
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) {
    return { id: null as string | null, name: "Unknown user", avatarUrl: null as string | null };
  }
  const meta = user.user_metadata ?? {};
  const name = displayNameFromUser(user) || "Unknown user";
  const avatarUrl = typeof meta.avatar_url === "string" ? meta.avatar_url : null;
  return { id: user.id, name, avatarUrl };
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

  const actor = await currentActor();

  return data.map((row) => {
    const stored = (row.actor_name || "").trim();
    const isGeneric = !stored || /^admin$/i.test(stored) || /^unknown user$/i.test(stored);
    return {
      id: String(row.id),
      name: isGeneric ? actor.name : stored,
      note: row.action || "Made a change",
      ago: relativeAgo(row.created_at),
      createdAt: row.created_at,
      avatarUrl: row.avatar_url ?? actor.avatarUrl,
    };
  });
}

async function loadFromPageContent(limit: number): Promise<ActivityItem[]> {
  const [{ data, error }, actor] = await Promise.all([
    supabase
      .from("page_content")
      .select("id,slug,updated_at")
      .not("updated_at", "is", null)
      .order("updated_at", { ascending: false })
      .limit(limit),
    currentActor(),
  ]);

  if (error || !data?.length) return [];

  return data.map((row) => ({
    id: `page-${row.id}`,
    name: actor.name,
    note: activityNoteForSlug(String(row.slug ?? "")),
    ago: relativeAgo(row.updated_at),
    createdAt: row.updated_at,
    avatarUrl: actor.avatarUrl,
  }));
}

export async function loadRecentActivity(limit = 8): Promise<ActivityItem[]> {
  const fromTable = await loadFromActivityTable(limit);
  if (fromTable && fromTable.length > 0) return fromTable;
  return loadFromPageContent(limit);
}
