import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { subDays } from "date-fns";
import { History } from "lucide-react";
import { loadRecentActivity, type ActivityItem } from "@/lib/activity-log";
import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

type RangeFilter = "6" | "12" | "30" | "older";

const RANGE_OPTIONS = [
  { id: "6" as const, label: "6 days ago" },
  { id: "12" as const, label: "12 days ago" },
  { id: "30" as const, label: "30 days ago" },
  { id: "older" as const, label: "30+ Days" },
];

function initialsFrom(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "A"
  );
}

function matchesRange(createdAt: string, range: RangeFilter, now: Date) {
  const at = new Date(createdAt).getTime();
  if (Number.isNaN(at)) return false;

  if (range === "older") {
    return at < subDays(now, 30).getTime();
  }

  const days = Number(range);
  return at >= subDays(now, days).getTime();
}

export default function ActivityLogPage() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<RangeFilter>("6");

  useEffect(() => {
    let alive = true;
    loadRecentActivity(200)
      .then((rows) => {
        if (alive) setItems(rows);
      })
      .catch(() => {
        if (alive) setItems([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const now = new Date();
    return items.filter((item) => matchesRange(item.createdAt, range, now));
  }, [items, range]);

  return (
    <div className="space-y-4 sm:space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
      >
        <p className="text-[11px] uppercase tracking-[0.14em] text-primary font-semibold">Dashboard</p>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Activity Log</h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          All CMS edits and admin actions
        </p>
      </motion.div>

      <div className="flex flex-wrap gap-1.5">
        {RANGE_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setRange(opt.id)}
            className={cn(
              "rounded-full px-3.5 py-2 text-xs font-semibold border transition-colors",
              range === opt.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border text-foreground/70 hover:bg-muted",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <motion.ul
        key={range}
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.03 } } }}
        className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border/70"
      >
        {loading && (
          <li className="px-4 py-10 text-center text-xs text-muted-foreground">Loading activity…</li>
        )}

        {!loading && items.length === 0 && (
          <li className="px-4 py-12 text-center text-xs text-muted-foreground">
            <History className="mx-auto h-7 w-7 opacity-40" />
            <p className="mt-2">No activity yet. Save a CMS page to see updates here.</p>
          </li>
        )}

        {!loading && items.length > 0 && filtered.length === 0 && (
          <li className="px-4 py-12 text-center text-xs text-muted-foreground">
            <History className="mx-auto h-7 w-7 opacity-40" />
            <p className="mt-2">No activity in this time range.</p>
          </li>
        )}

        {!loading &&
          filtered.map((a) => (
            <motion.li
              key={a.id}
              variants={{
                hidden: { opacity: 0, y: 8 },
                show: { opacity: 1, y: 0, transition: { duration: 0.28, ease } },
              }}
              className="p-3.5 sm:p-4 flex items-center gap-3 hover:bg-muted/40 transition-colors"
            >
              {a.avatarUrl ? (
                <img src={a.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
              ) : (
                <span className="w-10 h-10 rounded-full bg-primary/15 text-primary text-xs font-semibold grid place-items-center shrink-0">
                  {initialsFrom(a.name)}
                </span>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{a.name}</p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{a.note}</p>
              </div>
              <span className="text-[10px] sm:text-xs text-muted-foreground shrink-0">{a.ago}</span>
            </motion.li>
          ))}
      </motion.ul>
    </div>
  );
}
