import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  Users,
  ChevronDown,
  MousePointerClick,
  LogOut,
  Globe,
  BookOpen,
  Coffee,
  Images,
  CalendarDays,
  Layers,
  Mail,
  ExternalLink,
  Phone,
  UserCog,
  Clock,
} from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
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
import { listAdminUsers } from "@/lib/admin-users";
import { loadRecentActivity, type ActivityItem } from "@/lib/activity-log";
import { formatVisitorCount, loadClickCount, loadVisitorCount } from "@/lib/site-analytics";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import spaceHero from "@/assets/space-hero.jpg";

const LIVE_SITE_URL = "https://theoffwhite.com";

const KPI_BASE = [
  { icon: Users, label: "Visitors", bar: "from-indigo-500 to-blue-500", chip: "bg-indigo-100 text-indigo-600" },
  { icon: MousePointerClick, label: "Clicks", bar: "from-amber-500 to-orange-500", chip: "bg-amber-100 text-amber-600" },
] as const;

const QUICK_LINKS = [
  { label: "Homepage", to: "/homepage" as const, icon: Globe },
  { label: "Menu", to: "/menu" as const, icon: Coffee },
  { label: "Gallery", to: "/gallery" as const, icon: Images },
  { label: "Reservations", to: "/reservations" as const, icon: CalendarDays },
  { label: "Contact", to: "/contact" as const, icon: Mail },
  { label: "Level 4", to: "/level-4" as const, icon: Layers },
  { label: "Level 5", to: "/level-5" as const, icon: Layers },
  { label: "About", to: "/about" as const, icon: BookOpen },
] as const;

const PAGE_LABELS: Record<string, string> = {
  home: "Homepage",
  about: "About",
  menu: "Menu",
  "the-space": "The Space",
  gallery: "Gallery",
  reservations: "Reservations",
  contact: "Contact",
  "level-4": "Level 4",
  "level-5": "Level 5",
};

const PAGE_ROUTES: Record<string, (typeof QUICK_LINKS)[number]["to"] | "/the-space"> = {
  home: "/homepage",
  about: "/about",
  menu: "/menu",
  "the-space": "/the-space",
  gallery: "/gallery",
  reservations: "/reservations",
  contact: "/contact",
  "level-4": "/level-4",
  "level-5": "/level-5",
};

type RecentPage = {
  id: string;
  slug: string;
  label: string;
  updatedAt: string;
  ago: string;
  to?: (typeof PAGE_ROUTES)[string];
};

type ContactSnapshot = {
  phoneDisplay: string;
  whatsappNumber: string;
};

function UserMenu() {
  const { displayName, avatarUrl, signOut } = useAuth();
  const navigate = useNavigate();
  const initials =
    displayName
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

const stagger = { animate: { transition: { staggerChildren: 0.06 } } };
const rise = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
};

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      variants={rise}
      className={`bg-card/90 backdrop-blur-sm border border-border rounded-2xl p-4 md:p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${className}`}
    >
      {children}
    </motion.div>
  );
}

function relativeAgo(iso: string) {
  try {
    return formatDistanceToNow(parseISO(iso), { addSuffix: true })
      .replace(/^about /i, "")
      .replace(" minutes", "m")
      .replace(" minute", "m")
      .replace(" hours", "hrs")
      .replace(" hour", "hr")
      .replace(" days", "d")
      .replace(" day", "d");
  } catch {
    return "";
  }
}

async function loadRecentPages(limit = 5): Promise<RecentPage[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from("page_content")
    .select("id,slug,updated_at")
    .not("updated_at", "is", null)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error || !data?.length) return [];

  return data.map((row) => {
    const slug = String(row.slug ?? "");
    return {
      id: String(row.id),
      slug,
      label: PAGE_LABELS[slug] || slug || "Page",
      updatedAt: row.updated_at,
      ago: relativeAgo(row.updated_at),
      to: PAGE_ROUTES[slug],
    };
  });
}

async function loadContactSnapshot(): Promise<ContactSnapshot> {
  if (!isSupabaseConfigured) {
    return { phoneDisplay: "—", whatsappNumber: "—" };
  }
  const { data, error } = await supabase
    .from("site_settings")
    .select("key,value")
    .in("key", ["phone_display", "whatsapp_number"]);

  if (error || !data?.length) {
    return { phoneDisplay: "—", whatsappNumber: "—" };
  }

  const map = Object.fromEntries(data.map((row) => [row.key, row.value]));
  return {
    phoneDisplay: (map.phone_display || "").trim() || "—",
    whatsappNumber: (map.whatsapp_number || "").trim() || "—",
  };
}

async function loadAdminUserCount(): Promise<number | null> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) return null;
    const { users } = await listAdminUsers({ data: { accessToken } });
    return users.length;
  } catch {
    return null;
  }
}

export default function Dashboard() {
  const { displayName } = useAuth();
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [visitorValue, setVisitorValue] = useState("—");
  const [clickValue, setClickValue] = useState("—");
  const [recentPages, setRecentPages] = useState<RecentPage[]>([]);
  const [pagesLoading, setPagesLoading] = useState(true);
  const [contact, setContact] = useState<ContactSnapshot>({
    phoneDisplay: "—",
    whatsappNumber: "—",
  });
  const [userCount, setUserCount] = useState<number | null>(null);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  }, []);

  const kpis = useMemo(
    () =>
      KPI_BASE.map((k) => ({
        ...k,
        value: k.label === "Visitors" ? visitorValue : clickValue,
      })),
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

  useEffect(() => {
    let alive = true;
    loadRecentPages(5)
      .then((pages) => {
        if (alive) setRecentPages(pages);
      })
      .catch(() => {
        if (alive) setRecentPages([]);
      })
      .finally(() => {
        if (alive) setPagesLoading(false);
      });

    loadContactSnapshot()
      .then((snap) => {
        if (alive) setContact(snap);
      })
      .catch(() => {
        if (alive) setContact({ phoneDisplay: "—", whatsappNumber: "—" });
      });

    loadAdminUserCount()
      .then((n) => {
        if (alive) setUserCount(n);
      })
      .catch(() => {
        if (alive) setUserCount(null);
      });

    return () => {
      alive = false;
    };
  }, []);

  const whatsappHref =
    contact.whatsappNumber && contact.whatsappNumber !== "—"
      ? `https://wa.me/${contact.whatsappNumber.replace(/\D/g, "")}`
      : null;

  return (
    <AdminLayout title="Dashboard">
      <main className="relative flex-1 min-w-0 flex flex-col lg:flex-row overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${spaceHero})` }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-background/70" aria-hidden />

        <div className="relative z-10 flex-1 min-w-0 p-3 sm:p-4 md:p-6 lg:p-7 space-y-3 sm:space-y-5 overflow-y-auto">
          <Topbar trailing={<UserMenu />} />

          <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-3 sm:space-y-5">
            <motion.div variants={rise}>
              <h2 className="text-xl sm:text-2xl md:text-[28px] font-bold tracking-tight leading-tight">
                Hello {displayName || "there"}, {greeting}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
                Let&apos;s check your cafe.
              </p>
            </motion.div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-xl">
              {kpis.map((k, i) => (
                <motion.div
                  key={k.label}
                  variants={rise}
                  whileHover={{ y: -3 }}
                  className="bg-card/90 backdrop-blur-sm border border-border rounded-2xl p-3.5"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-8 h-8 rounded-lg grid place-items-center ${k.chip}`}>
                      <k.icon className="h-4 w-4" />
                    </span>
                    <span className="text-xs text-muted-foreground">{k.label}</span>
                  </div>
                  <p className="mt-3 text-2xl font-bold tracking-tight">{k.value}</p>
                  <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden relative">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${55 + i * 8}%` }}
                      transition={{ duration: 1, delay: 0.3 + i * 0.1, ease: "easeOut" }}
                      className={`h-full rounded-full bg-gradient-to-r ${k.bar} relative`}
                    >
                      <span className="absolute inset-0 shimmer" />
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </div>

            <Card>
              <p className="font-semibold">Quick links</p>
              <p className="text-xs text-muted-foreground mt-0.5">Jump to a page editor</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {QUICK_LINKS.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background/70 px-3 py-2 text-xs font-medium hover:bg-muted transition-colors"
                  >
                    <item.icon className="h-3.5 w-3.5 text-muted-foreground" />
                    {item.label}
                  </Link>
                ))}
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <Card>
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg grid place-items-center bg-muted text-foreground/70">
                    <Clock className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-semibold text-sm">Last saved</p>
                    <p className="text-[11px] text-muted-foreground">Recent CMS updates</p>
                  </div>
                </div>
                <ul className="mt-3 space-y-2">
                  {pagesLoading ? (
                    <li className="text-[11px] text-muted-foreground py-1">Loading…</li>
                  ) : recentPages.length === 0 ? (
                    <li className="text-[11px] text-muted-foreground py-1">No page saves yet.</li>
                  ) : (
                    recentPages.map((page) => (
                      <li key={page.id} className="flex items-center justify-between gap-2 text-sm">
                        {page.to ? (
                          <Link to={page.to} className="font-medium hover:underline truncate">
                            {page.label}
                          </Link>
                        ) : (
                          <span className="font-medium truncate">{page.label}</span>
                        )}
                        <span className="text-[10px] text-muted-foreground shrink-0">{page.ago}</span>
                      </li>
                    ))
                  )}
                </ul>
              </Card>

              <Card>
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg grid place-items-center bg-muted text-foreground/70">
                    <ExternalLink className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-semibold text-sm">Site health</p>
                    <p className="text-[11px] text-muted-foreground">Live site & admin access</p>
                  </div>
                </div>
                <div className="mt-3 space-y-2.5">
                  <a
                    href={LIVE_SITE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-2 rounded-xl border border-border bg-background/60 px-3 py-2.5 text-sm hover:bg-muted transition-colors"
                  >
                    <span className="font-medium truncate">theoffwhite.com</span>
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  </a>
                  <Link
                    to="/users"
                    className="flex items-center justify-between gap-2 rounded-xl border border-border bg-background/60 px-3 py-2.5 text-sm hover:bg-muted transition-colors"
                  >
                    <span className="inline-flex items-center gap-2 font-medium">
                      <UserCog className="h-3.5 w-3.5 text-muted-foreground" />
                      Admin users
                    </span>
                    <span className="text-sm font-semibold tabular-nums">
                      {userCount == null ? "—" : userCount}
                    </span>
                  </Link>
                </div>
              </Card>
            </div>

            <Card>
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg grid place-items-center bg-muted text-foreground/70">
                  <Phone className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-semibold text-sm">Public contact</p>
                  <p className="text-[11px] text-muted-foreground">From site settings</p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="rounded-xl border border-border bg-background/60 px-3 py-2.5">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
                    Phone
                  </p>
                  <p className="text-sm font-medium mt-0.5 break-all">{contact.phoneDisplay}</p>
                </div>
                <div className="rounded-xl border border-border bg-background/60 px-3 py-2.5">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
                    WhatsApp
                  </p>
                  {whatsappHref ? (
                    <a
                      href={whatsappHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium mt-0.5 break-all hover:underline inline-block"
                    >
                      {contact.whatsappNumber}
                    </a>
                  ) : (
                    <p className="text-sm font-medium mt-0.5 break-all">{contact.whatsappNumber}</p>
                  )}
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <Link to="/contact" className="text-xs font-medium hover:underline" style={{ color: "var(--brand)" }}>
                  Edit in Contact
                </Link>
                <Link
                  to="/reservations"
                  className="text-xs font-medium hover:underline"
                  style={{ color: "var(--brand)" }}
                >
                  Edit in Reservations
                </Link>
              </div>
            </Card>
          </motion.div>
        </div>

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
                {!activityLoading &&
                  activity.map((a) => {
                    const initials =
                      a.name
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
