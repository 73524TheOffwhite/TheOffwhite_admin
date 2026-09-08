import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  Users, ChevronDown, ChevronLeft, ChevronRight,
  MousePointerClick, LogOut,
} from "lucide-react";
import {
  addDays,
  addWeeks,
  format,
  isSameDay,
  startOfWeek,
} from "date-fns";
import AdminLayout, { Topbar } from "@/components/AdminLayout";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth-context";
import { loadRecentActivity, type ActivityItem } from "@/lib/activity-log";
import { formatVisitorCount, loadClickCount, loadVisitorCount } from "@/lib/site-analytics";
import spaceHero from "@/assets/space-hero.jpg";

/* ------------------------------ data ------------------------------ */
const KPI_BASE = [
  { icon: Users, label: "Visitors", bar: "from-indigo-500 to-blue-500", chip: "bg-indigo-100 text-indigo-600" },
  { icon: MousePointerClick, label: "Clicks", bar: "from-amber-500 to-orange-500", chip: "bg-amber-100 text-amber-600" },
] as const;

function UserMenu() {
  const { displayName, avatarUrl, signOut } = useAuth();
  const navigate = useNavigate();
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "A";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 pl-0.5 pr-0.5 sm:pl-1 sm:pr-2 py-0.5 sm:py-1 rounded-full hover:bg-muted transition outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
          aria-label="Account menu"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground text-xs font-semibold grid place-items-center">
              {initials}
            </span>
          )}
          <span className="text-sm font-medium hidden lg:block">{displayName}</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground hidden sm:block" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 rounded-xl">
        <DropdownMenuLabel className="font-normal">
          <p className="text-sm font-medium truncate">{displayName}</p>
          <p className="text-xs text-muted-foreground">Signed in</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-destructive focus:text-destructive"
          onSelect={() => {
            void signOut().then(() => navigate({ to: "/login" }));
          }}
        >
          <LogOut className="h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* --------------------------- animations --------------------------- */
const stagger = { animate: { transition: { staggerChildren: 0.06 } } };
const rise = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
};

/* ------------------------------ UI ------------------------------ */

function IconBtn({
  children,
  onClick,
  "aria-label": ariaLabel,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  "aria-label"?: string;
}) {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      aria-label={ariaLabel}
      className="w-9 h-9 grid place-items-center rounded-xl bg-card border border-border text-foreground/70 hover:text-foreground"
    >
      {children}
    </motion.button>
  );
}

function WeekCalendar() {
  const today = useMemo(() => new Date(), []);
  const [weekAnchor, setWeekAnchor] = useState(today);
  const [selected, setSelected] = useState(today);

  const weekStart = startOfWeek(weekAnchor, { weekStartsOn: 0 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const headerLabel = format(selected, "MMM yyyy");

  return (
    <Card>
      <div className="flex items-center justify-between">
        <p className="font-semibold">{headerLabel}</p>
        <div className="flex items-center gap-1">
          <IconBtn
            aria-label="Previous week"
            onClick={() => setWeekAnchor((d) => addWeeks(d, -1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </IconBtn>
          <IconBtn
            aria-label="Next week"
            onClick={() => setWeekAnchor((d) => addWeeks(d, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </IconBtn>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-7 gap-1.5">
        {days.map((day) => {
          const active = isSameDay(day, selected);
          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => setSelected(day)}
              className="relative flex flex-col items-center py-2 rounded-xl transition
                data-[active=true]:bg-primary data-[active=true]:text-primary-foreground hover:bg-muted"
              data-active={active || undefined}
              aria-pressed={active}
              aria-label={format(day, "EEEE, MMM d yyyy")}
            >
              <span className="text-[10px] opacity-70">{format(day, "EEE")}</span>
              <span className="text-sm font-semibold mt-0.5">{format(day, "d")}</span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div variants={rise}
      className={`bg-card/90 backdrop-blur-sm border border-border rounded-2xl p-4 md:p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${className}`}>
      {children}
    </motion.div>
  );
}

/* ------------------------------ Page ------------------------------ */

export default function Dashboard() {
  const { displayName } = useAuth();
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [visitorValue, setVisitorValue] = useState("—");
  const [clickValue, setClickValue] = useState("—");

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  }, []);

  const kpis = useMemo(
    () =>
      KPI_BASE.map((k) => {
        if (k.label === "Visitors") return { ...k, value: visitorValue };
        if (k.label === "Clicks") return { ...k, value: clickValue };
        return { ...k, value: "—" };
      }),
    [visitorValue, clickValue],
  );

  useEffect(() => {
    let alive = true;
    loadRecentActivity(6)
      .then((items) => {
        if (alive) setActivity(items);
      })
      .catch(() => {
        if (alive) setActivity([]);
      })
      .finally(() => {
        if (alive) setActivityLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    loadVisitorCount()
      .then((count) => {
        if (alive) setVisitorValue(formatVisitorCount(count));
      })
      .catch(() => {
        if (alive) setVisitorValue("0");
      });
    loadClickCount()
      .then((count) => {
        if (alive) setClickValue(formatVisitorCount(count));
      })
      .catch(() => {
        if (alive) setClickValue("0");
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <AdminLayout title="Dashboard">
      <main className="relative flex-1 min-w-0 flex flex-col lg:flex-row overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${spaceHero})` }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-background/70" aria-hidden />

        {/* Center column */}
        <div className="relative z-10 flex-1 min-w-0 p-3 sm:p-4 md:p-6 lg:p-7 space-y-3 sm:space-y-5">
          <Topbar trailing={<UserMenu />} />

          <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-3 sm:space-y-5">
            {/* Greeting */}
            <motion.div variants={rise}>
              <h2 className="text-xl sm:text-2xl md:text-[28px] font-bold tracking-tight leading-tight">
                Hello {displayName || "there"}, {greeting}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">Let's check your cafe.</p>
            </motion.div>

            {/* KPI cards */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-xl">
              {kpis.map((k, i) => (
                <motion.div key={k.label} variants={rise} whileHover={{ y: -3 }}
                  className="bg-card/90 backdrop-blur-sm border border-border rounded-2xl p-3.5">
                  <div className="flex items-center gap-2">
                    <span className={`w-8 h-8 rounded-lg grid place-items-center ${k.chip}`}>
                      <k.icon className="h-4 w-4" />
                    </span>
                    <span className="text-xs text-muted-foreground">{k.label}</span>
                  </div>
                  <p className="mt-3 text-2xl font-bold tracking-tight">{k.value}</p>
                  <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden relative">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${55 + i * 8}%` }}
                      transition={{ duration: 1, delay: 0.3 + i * 0.1, ease: "easeOut" }}
                      className={`h-full rounded-full bg-gradient-to-r ${k.bar} relative`}>
                      <span className="absolute inset-0 shimmer" />
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </div>

            <WeekCalendar />
          </motion.div>
        </div>

        {/* Right column */}
        <aside className="relative z-10 w-full lg:w-[360px] xl:w-[380px] shrink-0 p-3 pt-1 sm:p-4 md:p-6 lg:pl-2 lg:pr-6 lg:py-7 space-y-3 sm:space-y-5">
          <div className="hidden lg:flex items-center justify-end gap-2 relative z-20">
            <UserMenu />
          </div>

          <motion.div variants={stagger} initial="initial" animate="animate">
            <Card>
              <div className="flex items-center justify-between">
                <p className="font-semibold">Activity Log</p>
                <Link
                  to="/activity"
                  className="text-xs font-medium hover:underline"
                  style={{ color: "var(--brand)" }}
                >
                  View All
                </Link>
              </div>
              <ul className="mt-3 space-y-3">
                {activityLoading && (
                  <li className="text-[11px] text-muted-foreground py-2">Loading activity…</li>
                )}
                {!activityLoading && activity.length === 0 && (
                  <li className="text-[11px] text-muted-foreground py-2">
                    No activity yet. Save a CMS page to see updates here.
                  </li>
                )}
                {!activityLoading && activity.map((a) => {
                  const initials = a.name
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((p) => p[0]?.toUpperCase() ?? "")
                    .join("") || "A";
                  return (
                    <motion.li key={a.id} variants={rise} className="flex items-center gap-3">
                      {a.avatarUrl ? (
                        <img src={a.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover" />
                      ) : (
                        <span className="w-9 h-9 rounded-full bg-primary/15 text-primary text-[11px] font-semibold grid place-items-center shrink-0">
                          {initials}
                        </span>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{a.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{a.note}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0">{a.ago}</span>
                    </motion.li>
                  );
                })}
              </ul>
            </Card>
          </motion.div>
        </aside>
      </main>
    </AdminLayout>
  );
}
