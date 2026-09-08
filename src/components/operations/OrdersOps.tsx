import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Check,
  ChefHat,
  Clock3,
  ShoppingBag,
  Table2,
  UserRound,
  BellRing,
  Utensils,
} from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import {
  computeOrderStats,
  formatInr,
  groupOrdersByTable,
  loadOpsOrders,
  saveOpsOrders,
  type CafeOrder,
  type OrderStatus,
} from "@/lib/orders-ops";
import { cn } from "@/lib/utils";
import { logActivity } from "@/lib/activity-log";
import { toast } from "sonner";

type Filter = "active" | "preparing" | "ready" | "served" | "all";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "active", label: "Open tables" },
  { id: "preparing", label: "Kitchen" },
  { id: "ready", label: "Ready" },
  { id: "served", label: "Served" },
  { id: "all", label: "All" },
];

const ease = [0.22, 1, 0.36, 1] as const;

const rise = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.42, ease } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.18 } },
};

function statusLabel(status: OrderStatus) {
  return (
    {
      preparing: "Preparing",
      ready: "Ready",
      served: "Served",
      cancelled: "Cancelled",
    } as const
  )[status];
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const map = {
    preparing: "bg-amber-100 text-amber-800 ring-amber-200/80",
    ready: "bg-sky-100 text-sky-800 ring-sky-200/80",
    served: "bg-emerald-100 text-emerald-800 ring-emerald-200/80",
    cancelled: "bg-rose-100 text-rose-700 ring-rose-200/80",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset",
        map[status],
      )}
    >
      {statusLabel(status)}
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
  value: number;
  hint: string;
  icon: typeof Table2;
  tone: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay, ease }}
      whileTap={{ scale: 0.98 }}
      className="min-w-[140px] sm:min-w-0 flex-1 rounded-2xl border border-border bg-card p-3.5 sm:p-4 shadow-[0_1px_2px_rgba(43,33,24,0.04)]"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] sm:text-xs text-muted-foreground font-medium">{label}</p>
        <span className={cn("size-8 rounded-xl grid place-items-center", tone)}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight tabular-nums">{value}</p>
      <p className="mt-1 text-[10px] sm:text-[11px] text-muted-foreground">{hint}</p>
    </motion.div>
  );
}

export default function OrdersOps() {
  const [orders, setOrders] = useState<CafeOrder[]>([]);
  const [filter, setFilter] = useState<Filter>("active");
  const [expandedTable, setExpandedTable] = useState<number | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const seed = loadOpsOrders();
    setOrders(seed);
    const firstActive = groupOrdersByTable(seed).find((g) => g.activeCount > 0);
    setExpandedTable(firstActive?.tableNumber ?? seed[0]?.tableNumber ?? null);
    setReady(true);
  }, []);

  const persist = (next: CafeOrder[]) => {
    setOrders(next);
    saveOpsOrders(next);
  };

  const stats = useMemo(() => computeOrderStats(orders), [orders]);

  const groups = useMemo(() => {
    let list = [...orders];
    if (filter === "active") {
      list = list.filter((o) => o.status === "preparing" || o.status === "ready");
    } else if (filter !== "all") {
      list = list.filter((o) => o.status === filter);
    }
    return groupOrdersByTable(list);
  }, [orders, filter]);

  const setStatus = (id: string, status: OrderStatus) => {
    persist(orders.map((o) => (o.id === id ? { ...o, status } : o)));
    void logActivity(`Marked order ${statusLabel(status).toLowerCase()}`);
    toast.success(`Order marked ${statusLabel(status).toLowerCase()}`);
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
      >
        <p className="text-[11px] uppercase tracking-[0.14em] text-primary font-semibold">Operations</p>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Orders by table</h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          See who’s seating where — tickets grouped by table number and guest name
        </p>
      </motion.div>

      <div className="-mx-3 sm:mx-0 px-3 sm:px-0">
        <div className="flex gap-2.5 sm:gap-3 overflow-x-auto scrollbar-hide pb-1 sm:pb-0 sm:grid sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Open tables"
            value={stats.openTables}
            hint="With live tickets"
            icon={Table2}
            tone="bg-[#8B5B2A]/12 text-[#8B5B2A]"
            delay={0.05}
          />
          <StatCard
            label="In kitchen"
            value={stats.preparing}
            hint="Being prepared"
            icon={ChefHat}
            tone="bg-amber-100 text-amber-700"
            delay={0.1}
          />
          <StatCard
            label="Ready"
            value={stats.ready}
            hint="Awaiting serve"
            icon={BellRing}
            tone="bg-sky-100 text-sky-700"
            delay={0.15}
          />
          <StatCard
            label="Tickets"
            value={stats.tickets}
            hint="Active + served today"
            icon={ShoppingBag}
            tone="bg-emerald-100 text-emerald-700"
            delay={0.2}
          />
        </div>
      </div>

      <div className="-mx-3 sm:mx-0 px-3 sm:px-0">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
          {FILTERS.map((f) => {
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
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2.5 sm:space-y-3">
        <AnimatePresence mode="popLayout">
          {!ready ? (
            <motion.div
              key="loading"
              variants={rise}
              initial="initial"
              animate="animate"
              className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground"
            >
              Loading orders…
            </motion.div>
          ) : groups.length === 0 ? (
            <motion.div
              key="empty"
              variants={rise}
              initial="initial"
              animate="animate"
              className="rounded-2xl border border-dashed border-border bg-card/60 p-10 text-center"
            >
              <Utensils className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <p className="mt-3 text-sm font-medium">No orders in this view</p>
              <p className="mt-1 text-xs text-muted-foreground">Try another filter.</p>
            </motion.div>
          ) : (
            groups.map((group, i) => {
              const open = expandedTable === group.tableNumber;
              return (
                <motion.section
                  key={group.tableNumber}
                  layout
                  variants={rise}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ layout: { duration: 0.28, ease } }}
                  className="rounded-2xl border border-border bg-card overflow-hidden shadow-[0_1px_2px_rgba(43,33,24,0.04)]"
                  style={{ transitionDelay: `${Math.min(i, 8) * 18}ms` }}
                >
                  <button
                    type="button"
                    onClick={() => setExpandedTable(open ? null : group.tableNumber)}
                    className="w-full text-left p-3.5 sm:p-4 flex items-center gap-3 hover:bg-muted/40 transition-colors"
                  >
                    <div className="size-12 sm:size-14 rounded-2xl bg-primary text-primary-foreground grid place-items-center shrink-0 shadow-sm">
                      <div className="text-center leading-none">
                        <p className="text-[9px] uppercase tracking-wider opacity-80">Table</p>
                        <p className="text-xl sm:text-2xl font-bold tabular-nums mt-0.5">{group.tableNumber}</p>
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <UserRound className="h-3.5 w-3.5 text-primary shrink-0" />
                        <p className="text-sm sm:text-base font-semibold truncate">
                          {group.guestNames.join(" · ")}
                        </p>
                      </div>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {group.orders.length} order{group.orders.length === 1 ? "" : "s"}
                        {group.activeCount > 0 ? ` · ${group.activeCount} live` : ""}
                        {" · "}
                        {formatInr(group.total)}
                      </p>
                    </div>

                    <motion.span
                      animate={{ rotate: open ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-muted-foreground text-lg leading-none shrink-0"
                      aria-hidden
                    >
                      ▾
                    </motion.span>
                  </button>

                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28, ease }}
                        className="overflow-hidden border-t border-border"
                      >
                        <ul className="divide-y divide-border">
                          {group.orders.map((order) => (
                            <li key={order.id} className="p-3.5 sm:p-4 space-y-3 bg-background/40">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-sm font-semibold">{order.guestName}</p>
                                    <StatusBadge status={order.status} />
                                  </div>
                                  <p className="mt-1 text-[11px] text-muted-foreground flex items-center gap-1.5">
                                    <Clock3 className="h-3 w-3" />
                                    {formatDistanceToNow(parseISO(order.placedAt), { addSuffix: true }).replace(
                                      /^about /,
                                      "",
                                    )}
                                    {order.server ? ` · ${order.server}` : ""}
                                  </p>
                                </div>
                                <p className="text-sm font-bold tabular-nums shrink-0">{formatInr(order.total)}</p>
                              </div>

                              <ul className="space-y-1.5 rounded-xl bg-muted/50 p-2.5">
                                {order.items.map((item) => (
                                  <li key={item.id} className="flex items-start justify-between gap-2 text-xs">
                                    <span className="min-w-0">
                                      <span className="font-medium tabular-nums text-primary">{item.qty}×</span>{" "}
                                      <span className="text-foreground">{item.name}</span>
                                      {item.note ? (
                                        <span className="block text-muted-foreground mt-0.5 pl-5">{item.note}</span>
                                      ) : null}
                                    </span>
                                  </li>
                                ))}
                              </ul>

                              <div className="flex flex-wrap gap-2">
                                <ActionBtn
                                  disabled={order.status === "ready" || order.status === "served" || order.status === "cancelled"}
                                  onClick={() => setStatus(order.id, "ready")}
                                  className="bg-sky-600 text-white hover:bg-sky-700 disabled:bg-sky-50 disabled:text-sky-700/40"
                                >
                                  <BellRing className="h-3.5 w-3.5" />
                                  Ready
                                </ActionBtn>
                                <ActionBtn
                                  disabled={order.status === "served" || order.status === "cancelled"}
                                  onClick={() => setStatus(order.id, "served")}
                                  className="bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-emerald-50 disabled:text-emerald-700/40"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  Served
                                </ActionBtn>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.section>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ActionBtn({
  children,
  onClick,
  disabled,
  className,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <motion.button
      type="button"
      whileTap={disabled ? undefined : { scale: 0.96 }}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-xs font-semibold transition-colors disabled:cursor-not-allowed shadow-sm disabled:shadow-none",
        className,
      )}
    >
      {children}
    </motion.button>
  );
}
