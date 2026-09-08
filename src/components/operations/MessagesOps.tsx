import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { MessageSquare } from "lucide-react";
import { initials, SEED_MESSAGES, type InboxItem } from "@/lib/inbox-ops";
import { cn } from "@/lib/utils";

type Filter = "all" | "unread";

const ease = [0.22, 1, 0.36, 1] as const;

export default function MessagesOps() {
  const [filter, setFilter] = useState<Filter>("all");
  const [items] = useState<InboxItem[]>(SEED_MESSAGES);

  const filtered = useMemo(
    () => (filter === "unread" ? items.filter((i) => i.unread) : items),
    [filter, items],
  );

  return (
    <div className="space-y-4 sm:space-y-5">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }}>
        <p className="text-[11px] uppercase tracking-[0.14em] text-primary font-semibold">Operations</p>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Messages</h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          Guest conversations and concierge replies
        </p>
      </motion.div>

      <div className="flex gap-1.5">
        {(
          [
            { id: "all" as const, label: "All" },
            { id: "unread" as const, label: "Unread" },
          ] as const
        ).map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={cn(
              "rounded-full px-3.5 py-2 text-xs font-semibold border transition-colors",
              filter === f.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border text-foreground/70 hover:bg-muted",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <motion.ul
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.04 } } }}
        className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border/70"
      >
        <AnimatePresence mode="popLayout">
          {filtered.map((item) => (
            <motion.li
              key={item.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.28, ease }}
              className={cn("p-3.5 sm:p-4 flex gap-3 hover:bg-muted/40 transition-colors", item.unread && "bg-primary/[0.03]")}
            >
              <span
                className={cn(
                  "size-11 rounded-full grid place-items-center text-xs font-semibold shrink-0",
                  item.avatarTone ?? "bg-muted",
                )}
              >
                {initials(item.name)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className={cn("text-sm", item.unread ? "font-semibold" : "font-medium")}>{item.name}</p>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {formatDistanceToNow(parseISO(item.createdAt), { addSuffix: true }).replace(/^about /, "")}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{item.preview}</p>
              </div>
              {item.unread ? <span className="mt-2 size-2 rounded-full bg-primary shrink-0" /> : null}
            </motion.li>
          ))}
        </AnimatePresence>
        {filtered.length === 0 ? (
          <li className="px-4 py-12 text-center text-xs text-muted-foreground">
            <MessageSquare className="mx-auto h-7 w-7 opacity-40" />
            <p className="mt-2">No messages in this filter.</p>
          </li>
        ) : null}
      </motion.ul>
    </div>
  );
}
