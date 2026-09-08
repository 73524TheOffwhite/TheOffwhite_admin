import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  CalendarDays,
  Check,
  Clock3,
  MapPin,
  Phone,
  Users,
  UtensilsCrossed,
  X,
  Hourglass,
  Table2,
} from "lucide-react";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import type { ReservationSubmission } from "@/data/reservations-content";
import {
  computeOpsStats,
  isReservationOnDay,
  loadOpsReservations,
  locationLabel,
  saveOpsReservations,
  tablesForGuests,
} from "@/lib/reservations-ops";
import { cn } from "@/lib/utils";
import { logActivity } from "@/lib/activity-log";
import { toast } from "sonner";

type Filter = "all" | "pending" | "confirmed" | "cancelled" | "today";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "pending", label: "Waiting" },
  { id: "confirmed", label: "Confirmed" },
  { id: "cancelled", label: "Cancelled" },
  { id: "all", label: "All" },
];

const ease = [0.22, 1, 0.36, 1] as const;

const stagger = {
  animate: { transition: { staggerChildren: 0.05, delayChildren: 0.04 } },
};

const rise = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

function StatusBadge({ status }: { status: ReservationSubmission["status"] }) {
  const map = {
    pending: "bg-amber-100 text-amber-800 ring-amber-200/80",
    confirmed: "bg-emerald-100 text-emerald-800 ring-emerald-200/80",
    cancelled: "bg-rose-100 text-rose-700 ring-rose-200/80",
  } as const;
  const label = { pending: "Waiting", confirmed: "Confirmed", cancelled: "Cancelled" } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset",
        map[status],
      )}
    >
      {label[status]}
    </span>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
  delay = 0,
}: {
  label: string;
  value: number | string;
  hint: string;
  icon: typeof Users;
  tone: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, delay, ease }}
      whileTap={{ scale: 0.98 }}
      className="min-w-[148px] sm:min-w-0 flex-1 rounded-2xl border border-border bg-card p-3.5 sm:p-4 shadow-[0_1px_2px_rgba(43,33,24,0.04)]"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] sm:text-xs text-muted-foreground font-medium">{label}</p>
        <span className={cn("size-8 rounded-xl grid place-items-center", tone)}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight tabular-nums">{value}</p>
      <p className="mt-1 text-[10px] sm:text-[11px] text-muted-foreground leading-snug">{hint}</p>
    </motion.div>
  );
}

export default function ReservationsOps() {
  const [list, setList] = useState<ReservationSubmission[]>([]);
  const [filter, setFilter] = useState<Filter>("today");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setList(loadOpsReservations());
    setReady(true);
  }, []);

  const persist = (next: ReservationSubmission[]) => {
    setList(next);
    saveOpsReservations(next);
  };

  const stats = useMemo(() => computeOpsStats(list), [list]);

  const filtered = useMemo(() => {
    const today = new Date();
    let rows = [...list];
    if (filter === "today") rows = rows.filter((r) => isReservationOnDay(r, today));
    else if (filter !== "all") rows = rows.filter((r) => r.status === filter);
    return rows.sort((a, b) => {
      const statusRank = { pending: 0, confirmed: 1, cancelled: 2 } as const;
      if (statusRank[a.status] !== statusRank[b.status]) {
        return statusRank[a.status] - statusRank[b.status];
      }
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [list, filter]);

  const setStatus = (id: string, status: ReservationSubmission["status"]) => {
    persist(list.map((r) => (r.id === id ? { ...r, status } : r)));
    void logActivity(
      status === "confirmed"
        ? "Confirmed a reservation"
        : status === "cancelled"
          ? "Cancelled a reservation"
          : "Updated a reservation",
    );
    toast.success(status === "confirmed" ? "Reservation confirmed" : status === "cancelled" ? "Reservation cancelled" : "Updated");
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
        className="flex flex-col gap-1"
      >
        <p className="text-[11px] uppercase tracking-[0.14em] text-primary font-semibold">Operations</p>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Reservations floor</h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          {format(new Date(), "EEEE, d MMM yyyy")} · Live board for tables, waiting requests & covers
        </p>
      </motion.div>

      {/* Stats — horizontal scroll on mobile */}
      <div className="-mx-3 sm:mx-0 px-3 sm:px-0">
        <div className="flex gap-2.5 sm:gap-3 overflow-x-auto scrollbar-hide pb-1 sm:pb-0 sm:grid sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Waiting"
            value={stats.waiting}
            hint="Requests to review"
            icon={Hourglass}
            tone="bg-amber-100 text-amber-700"
            delay={0.05}
          />
          <StatCard
            label="Confirmed today"
            value={stats.confirmedToday}
            hint="Bookings locked in"
            icon={Check}
            tone="bg-emerald-100 text-emerald-700"
            delay={0.1}
          />
          <StatCard
            label="Tables booked"
            value={stats.tablesBooked}
            hint="Est. tables for today"
            icon={Table2}
            tone="bg-[#8B5B2A]/12 text-[#8B5B2A]"
            delay={0.15}
          />
          <StatCard
            label="Covers"
            value={stats.covers}
            hint="Guests expected today"
            icon={Users}
            tone="bg-sky-100 text-sky-700"
            delay={0.2}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="-mx-3 sm:mx-0 px-3 sm:px-0">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
          {FILTERS.map((f) => {
            const count =
              f.id === "today"
                ? list.filter((r) => isReservationOnDay(r, new Date())).length
                : f.id === "all"
                  ? list.length
                  : list.filter((r) => r.status === f.id).length;
            const active = filter === f.id;
            return (
              <motion.button
                key={f.id}
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={() => setFilter(f.id)}
                className={cn(
                  "shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold border transition-colors",
                  active
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-card border-border text-foreground/70 hover:bg-muted",
                )}
              >
                {f.label}
                <span className={cn("ml-1.5 tabular-nums", active ? "opacity-80" : "opacity-50")}>
                  {count}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* List */}
      <motion.div
        variants={stagger}
        initial="initial"
        animate="animate"
        className="space-y-2.5 sm:space-y-3"
      >
        <AnimatePresence mode="popLayout">
          {!ready ? (
            <motion.div
              key="loading"
              variants={rise}
              className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground"
            >
              Loading reservations…
            </motion.div>
          ) : filtered.length === 0 ? (
            <motion.div
              key="empty"
              variants={rise}
              className="rounded-2xl border border-dashed border-border bg-card/60 p-10 text-center"
            >
              <UtensilsCrossed className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <p className="mt-3 text-sm font-medium">No reservations here</p>
              <p className="mt-1 text-xs text-muted-foreground">Try another filter or check back later.</p>
            </motion.div>
          ) : (
            filtered.map((row, i) => (
              <motion.article
                key={row.id}
                layout
                variants={rise}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ layout: { duration: 0.28, ease } }}
                className="rounded-2xl border border-border bg-card p-3.5 sm:p-4 shadow-[0_1px_2px_rgba(43,33,24,0.04)] active:bg-muted/30"
                style={{ transitionDelay: `${Math.min(i, 8) * 20}ms` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm sm:text-base font-semibold truncate">{row.name}</h3>
                      <StatusBadge status={row.status} />
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground flex items-center gap-1.5">
                      <Phone className="h-3 w-3 shrink-0" />
                      +91 {row.phone}
                      <span className="opacity-40">·</span>
                      {row.source === "home_mini" ? "Home form" : "Full form"}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-semibold tabular-nums">{tablesForGuests(row.guests)} tbl</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {formatDistanceToNow(parseISO(row.createdAt), { addSuffix: true }).replace(/^about /, "")}
                    </p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <Meta icon={CalendarDays} label={format(parseISO(row.date), "EEE d MMM")} />
                  <Meta icon={Clock3} label={row.time} />
                  <Meta icon={Users} label={`${row.guests} guests`} />
                  <Meta icon={MapPin} label={locationLabel(row.locationId)} />
                </div>

                {(row.occasion || row.specialRequest) && (
                  <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
                    {row.occasion ? <span className="font-medium text-foreground/80">{row.occasion}</span> : null}
                    {row.occasion && row.specialRequest ? " · " : null}
                    {row.specialRequest}
                  </p>
                )}

                <div className="mt-3.5 flex flex-wrap gap-2">
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    disabled={row.status === "confirmed"}
                    onClick={() => setStatus(row.id, "confirmed")}
                    className={cn(
                      "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-xs font-semibold transition-colors",
                      row.status === "confirmed"
                        ? "bg-emerald-50 text-emerald-700/50 cursor-not-allowed"
                        : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm",
                    )}
                  >
                    <Check className="h-3.5 w-3.5" />
                    Confirm
                  </motion.button>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    disabled={row.status === "cancelled"}
                    onClick={() => setStatus(row.id, "cancelled")}
                    className={cn(
                      "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-xs font-semibold border transition-colors",
                      row.status === "cancelled"
                        ? "border-border text-muted-foreground/50 cursor-not-allowed"
                        : "border-rose-200 text-rose-700 bg-rose-50/80 hover:bg-rose-100",
                    )}
                  >
                    <X className="h-3.5 w-3.5" />
                    Cancel
                  </motion.button>
                </div>
              </motion.article>
            ))
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function Meta({ icon: Icon, label }: { icon: typeof Users; label: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-xl bg-muted/60 px-2.5 py-2 min-w-0">
      <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
      <span className="text-[11px] font-medium truncate">{label}</span>
    </div>
  );
}
