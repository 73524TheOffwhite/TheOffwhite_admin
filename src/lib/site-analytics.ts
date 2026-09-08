import { isSupabaseConfigured, supabase } from "@/lib/supabase";

/** Format counts for dashboard KPI cards (e.g. 19000 → "19K"). */
export function formatVisitorCount(n: number): string {
  if (!Number.isFinite(n) || n < 0) return "0";
  if (n < 1000) return String(Math.floor(n));
  if (n < 1_000_000) {
    const k = n / 1000;
    const rounded = k >= 10 ? Math.round(k) : Math.round(k * 10) / 10;
    return `${rounded}K`.replace(/\.0K$/, "K");
  }
  const m = n / 1_000_000;
  const rounded = m >= 10 ? Math.round(m) : Math.round(m * 10) / 10;
  return `${rounded}M`.replace(/\.0M$/, "M");
}

export const formatAnalyticsCount = formatVisitorCount;

async function loadEventCount(eventType: "page_view" | "click"): Promise<number> {
  if (!isSupabaseConfigured) return 0;

  const { count, error } = await supabase
    .from("site_analytics")
    .select("*", { count: "exact", head: true })
    .eq("event_type", eventType);

  if (error) {
    console.warn(`[site-analytics] load ${eventType} failed:`, error.message);
    return 0;
  }

  return count ?? 0;
}

/**
 * Total page opens recorded by the public cafe website into `site_analytics`.
 * Returns 0 if Supabase is missing or the table is empty / not created yet.
 */
export async function loadVisitorCount(): Promise<number> {
  return loadEventCount("page_view");
}

/** Total clicks recorded by the public cafe website. */
export async function loadClickCount(): Promise<number> {
  return loadEventCount("click");
}
