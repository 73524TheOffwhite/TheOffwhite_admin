import { useState, createContext, useContext, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard, Globe, BookOpen, Coffee, Building2, Images, CalendarDays, Users,
  Image as ImageIcon, Settings, LogOut, Search, Layers, Mail, Home,
  Menu as MenuIcon, X, PanelLeftOpen, PanelLeftClose, Pencil, ChevronDown, History, Clock,
  type LucideIcon,
} from "lucide-react";
import logo from "@/assets/logo-light.png";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const EDIT_NAV = [
  { icon: LayoutDashboard, label: "Dashboard", to: "/" as const },
  { icon: Globe, label: "Homepage", to: "/homepage" as const },
  { icon: BookOpen, label: "About", to: "/about" as const },
  { icon: Coffee, label: "Menu", to: "/menu" as const },
  { icon: Building2, label: "The Space", to: "/the-space" as const },
  { icon: Images, label: "Gallery", to: "/gallery" as const },
  { icon: CalendarDays, label: "Reservations", to: "/reservations" as const },
  { icon: Layers, label: "Level 4", to: "/level-4" as const },
  { icon: Layers, label: "Level 5", to: "/level-5" as const },
  { icon: Mail, label: "Contact", to: "/contact" as const },
  { icon: Users, label: "Customers" },
  { icon: ImageIcon, label: "Content" },
  { icon: Settings, label: "Settings", to: "/settings" as const },
];

type SearchPage = {
  icon: LucideIcon;
  label: string;
  to: "/" | "/homepage" | "/about" | "/menu" | "/the-space" | "/gallery" | "/reservations" | "/level-4" | "/level-5" | "/contact" | "/settings" | "/activity";
  keywords?: string[];
};

const SEARCH_PAGES: SearchPage[] = (() => {
  const pages: SearchPage[] = [
    { icon: Home, label: "Home", to: "/", keywords: ["dashboard", "home"] },
    { icon: History, label: "Activity Log", to: "/activity", keywords: ["activity", "log", "history"] },
  ];
  const seen = new Set(pages.map((p) => p.to));
  for (const item of EDIT_NAV) {
    if (!("to" in item) || !item.to || seen.has(item.to)) continue;
    seen.add(item.to);
    pages.push({ icon: item.icon, label: item.label, to: item.to });
  }
  return pages;
})();

const EDIT_PATHS = new Set(
  EDIT_NAV.filter((item): item is typeof item & { to: string } => "to" in item && Boolean(item.to)).map(
    (item) => item.to,
  ),
);

const SIDEBAR_COLLAPSED = 76;
const SIDEBAR_EXPANDED = 240;

type ShellCtx = {
  sidebarOpen: boolean;
  sidebarExpanded: boolean;
  toggleSidebar: () => void;
  toggleSidebarExpand: () => void;
  closeSidebar: () => void;
  title: string;
};

const AdminShellContext = createContext<ShellCtx | null>(null);

export function useAdminShell() {
  const ctx = useContext(AdminShellContext);
  if (!ctx) throw new Error("useAdminShell must be used within AdminLayout");
  return ctx;
}

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(min-width: 1024px)").matches : false,
  );

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const onChange = () => setIsDesktop(mql.matches);
    mql.addEventListener("change", onChange);
    setIsDesktop(mql.matches);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isDesktop;
}

function Sidebar({
  open,
  expanded,
  onClose,
  onToggleExpand,
}: {
  open: boolean;
  expanded: boolean;
  onClose: () => void;
  onToggleExpand: () => void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isDesktop = useIsDesktop();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(() => EDIT_PATHS.has(pathname));

  // Mobile drawer always labeled; desktop follows expand toggle
  const showExpanded = !isDesktop || expanded;
  const width = showExpanded ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED;
  const drawerVisible = isDesktop || open;

  useEffect(() => {
    if (EDIT_PATHS.has(pathname)) setEditOpen(true);
  }, [pathname]);

  const handleNavClick = () => {
    // Read viewport at click time so a stale isDesktop can't skip closing
    if (!window.matchMedia("(min-width: 1024px)").matches) onClose();
  };

  const handleClose = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onClose();
  };

  const toggleEdit = () => {
    if (isDesktop && !expanded) {
      onToggleExpand();
      setEditOpen(true);
      return;
    }
    setEditOpen((prev) => !prev);
  };

  return (
    <>
      <AnimatePresence>
        {open && !isDesktop && (
          <motion.button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-40 bg-black/40 border-0 cursor-default"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />
        )}
      </AnimatePresence>

      {/* Desktop spacer only */}
      <motion.div
        initial={false}
        animate={{ width: open ? width : 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="hidden lg:block shrink-0 overflow-hidden"
        aria-hidden
      />

      <motion.aside
        initial={false}
        animate={{ x: drawerVisible ? 0 : "-100%" }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        style={{ width: isDesktop ? width : undefined }}
        className={cn(
          "fixed top-0 left-0 z-50 h-dvh bg-sidebar text-sidebar-foreground",
          "flex flex-col py-5 border-r border-border/40",
          "rounded-r-3xl lg:rounded-none",
          // Mobile: fixed drawer width. Desktop: icon or expanded.
          isDesktop
            ? showExpanded
              ? "items-stretch px-3"
              : "items-center px-0"
            : "w-[min(240px,85vw)] items-stretch px-3",
          drawerVisible ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!drawerVisible}
      >
        <div
          className={cn(
            "flex items-center gap-3 shrink-0",
            isDesktop && !showExpanded ? "justify-center" : "px-1",
          )}
        >
          <div className="flex items-center justify-center w-14 h-14 shrink-0">
            <img src={logo} alt="The Off White" className="w-full h-full object-contain" />
          </div>
          {(!isDesktop || showExpanded) && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate leading-tight">Offwhite</p>
              <p className="text-[11px] text-sidebar-foreground truncate">Admin</p>
            </div>
          )}
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close menu"
            className="lg:hidden grid place-items-center size-10 text-sidebar-foreground hover:bg-white/10 shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <button
          type="button"
          onClick={onToggleExpand}
          aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
          aria-expanded={expanded}
          title={expanded ? "Collapse sidebar" : "Expand sidebar"}
          className={cn(
            "mt-4 hidden lg:flex items-center gap-2 rounded-xl text-sidebar-foreground hover:bg-white/10 transition-colors",
            showExpanded ? "h-10 px-3 w-full" : "w-11 h-11 justify-center",
          )}
        >
          {showExpanded ? (
            <>
              <PanelLeftClose className="h-5 w-5 shrink-0" />
              <span className="text-sm font-medium">Collapse</span>
            </>
          ) : (
            <PanelLeftOpen className="h-5 w-5" />
          )}
        </button>

        <nav
          className={cn(
            "flex-1 flex flex-col gap-1 mt-4 overflow-y-auto scrollbar-hide",
            isDesktop && !showExpanded && "items-center",
          )}
        >
          <Link
            to="/"
            title="Home"
            onClick={handleNavClick}
            className={cn(
              "relative rounded-xl transition-colors text-sidebar-foreground hover:bg-white/10",
              showExpanded
                ? "flex items-center gap-3 h-11 px-3 w-full"
                : "w-11 h-11 grid place-items-center",
              pathname === "/" && "bg-white/15",
            )}
          >
            <Home className="h-5 w-5 shrink-0 text-white" />
            {showExpanded ? (
              <span className="text-sm font-medium text-white flex-1 text-left">Home</span>
            ) : (
              <span className="sr-only">Home</span>
            )}
          </Link>

          <button
            type="button"
            onClick={toggleEdit}
            aria-expanded={editOpen}
            title="Edit"
            className={cn(
              "relative rounded-xl transition-colors text-sidebar-foreground hover:bg-white/10",
              showExpanded
                ? "flex items-center gap-3 h-11 px-3 w-full"
                : "w-11 h-11 grid place-items-center",
              (editOpen || EDIT_PATHS.has(pathname)) && "bg-white/15",
            )}
          >
            <Pencil className="h-5 w-5 shrink-0 text-white" />
            {showExpanded ? (
              <>
                <span className="text-sm font-medium text-white flex-1 text-left">Edit</span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-white/80 transition-transform",
                    editOpen && "rotate-180",
                  )}
                />
              </>
            ) : (
              <span className="sr-only">Edit</span>
            )}
          </button>

          <AnimatePresence initial={false}>
            {editOpen && showExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden flex flex-col gap-0.5 pl-2"
              >
                {EDIT_NAV.map((item) => {
                  const active = "to" in item && item.to ? pathname === item.to : false;
                  const className = cn(
                    "relative flex items-center gap-3 h-10 px-3 w-full rounded-xl transition-colors",
                    active
                      ? "bg-white/15 text-sidebar-foreground"
                      : "text-sidebar-foreground hover:bg-white/10",
                  );

                  const inner = (
                    <>
                      {active && (
                        <motion.span
                          layoutId="nav-pill"
                          className="absolute -left-0.5 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-white"
                        />
                      )}
                      <item.icon className="h-4 w-4 shrink-0 text-white" />
                      <span className="text-sm font-medium truncate text-white">{item.label}</span>
                    </>
                  );

                  if ("to" in item && item.to) {
                    return (
                      <Link
                        key={item.label}
                        to={item.to}
                        title={item.label}
                        onClick={handleNavClick}
                        className={className}
                      >
                        {inner}
                      </Link>
                    );
                  }

                  return (
                    <button key={item.label} type="button" className={className} title={item.label}>
                      {inner}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </nav>

        <div className={cn("flex flex-col gap-1 pb-1", isDesktop && !showExpanded && "items-center")}>
          {(() => {
            const labeled = !isDesktop || showExpanded;
            return (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    title="Account"
                    aria-label="Account menu"
                    className={cn(
                      "rounded-xl transition-colors text-sidebar-foreground hover:bg-white/10 outline-none focus-visible:ring-2 focus-visible:ring-white/30",
                      labeled
                        ? "flex items-center gap-3 h-11 px-3 w-full"
                        : "w-11 h-11 grid place-items-center",
                    )}
                  >
                    <LogOut className="h-5 w-5 shrink-0 text-white" />
                    {labeled ? <span className="text-sm font-medium text-white">Account</span> : null}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="top"
                  align={labeled ? "start" : "center"}
                  sideOffset={8}
                  className="w-44 rounded-xl"
                >
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
          })()}
        </div>
      </motion.aside>
    </>
  );
}

const SEARCH_RECENTS_KEY = "admin-quick-search-recents";
const MAX_RECENTS = 6;

function loadSearchRecents(): SearchPage["to"][] {
  try {
    const raw = localStorage.getItem(SEARCH_RECENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const allowed = new Set(SEARCH_PAGES.map((p) => p.to));
    return parsed.filter((v): v is SearchPage["to"] => typeof v === "string" && allowed.has(v as SearchPage["to"]));
  } catch {
    return [];
  }
}

function saveSearchRecent(to: SearchPage["to"]) {
  try {
    const next = [to, ...loadSearchRecents().filter((t) => t !== to)].slice(0, MAX_RECENTS);
    localStorage.setItem(SEARCH_RECENTS_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

function highlightMatch(label: string, query: string) {
  const q = query.trim();
  if (!q) return label;
  const idx = label.toLowerCase().indexOf(q.toLowerCase());
  if (idx < 0) return label;
  return (
    <>
      {label.slice(0, idx)}
      <span className="font-semibold text-foreground">{label.slice(idx, idx + q.length)}</span>
      {label.slice(idx + q.length)}
    </>
  );
}

export function Topbar({ trailing }: { trailing?: React.ReactNode } = {}) {
  const { sidebarOpen, sidebarExpanded, toggleSidebar, toggleSidebarExpand, title } = useAdminShell();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [recents, setRecents] = useState<SearchPage["to"][]>([]);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setRecents(loadSearchRecents());
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      const recentPages = recents
        .map((to) => SEARCH_PAGES.find((p) => p.to === to))
        .filter((p): p is SearchPage => Boolean(p));
      if (recentPages.length > 0) return recentPages;
      return SEARCH_PAGES.slice(0, 6);
    }
    return SEARCH_PAGES.filter((page) => {
      const haystack = [page.label, ...(page.keywords ?? [])].join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [query, recents]);

  const showingRecents = !query.trim() && recents.length > 0;

  useEffect(() => {
    setActiveIndex(0);
  }, [query, showingRecents]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const goTo = (to: SearchPage["to"]) => {
    saveSearchRecent(to);
    setRecents(loadSearchRecents());
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
    if (to !== pathname) void navigate({ to });
  };

  const clearRecents = () => {
    try {
      localStorage.removeItem(SEARCH_RECENTS_KEY);
    } catch {
      /* ignore */
    }
    setRecents([]);
  };

  return (
    <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
      {/* Mobile only: hamburger opens drawer */}
      <button
        type="button"
        onClick={toggleSidebar}
        aria-label={sidebarOpen ? "Close menu" : "Open menu"}
        aria-expanded={sidebarOpen}
        className="shrink-0 grid place-items-center w-10 h-10 rounded-xl bg-card border border-border text-foreground/70 hover:text-foreground transition-colors lg:hidden"
      >
        {sidebarOpen ? <X className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
      </button>

      {/* Desktop only: expand / collapse */}
      <button
        type="button"
        onClick={toggleSidebarExpand}
        aria-label={sidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
        aria-expanded={sidebarExpanded}
        title={sidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
        className="hidden lg:grid shrink-0 place-items-center w-10 h-10 rounded-xl bg-card border border-border text-foreground/70 hover:text-foreground transition-colors"
      >
        {sidebarExpanded ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
      </button>

      <h1 className="text-lg font-semibold hidden sm:block shrink-0">{title}</h1>

      <div className="flex-1 min-w-0 max-w-md sm:mx-auto lg:mx-4">
        <div ref={rootRef} className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
                setOpen(true);
                return;
              }
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveIndex((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveIndex((i) => Math.max(i - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                const hit = results[activeIndex];
                if (hit) goTo(hit.to);
              }
            }}
            placeholder="Search pages..."
            role="combobox"
            aria-expanded={open}
            aria-controls="quick-search-results"
            aria-autocomplete="list"
            className={cn(
              "w-full h-11 pl-10 pr-4 bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring/20",
              open ? "rounded-t-full rounded-b-none border-b-transparent shadow-[0_1px_6px_rgba(32,33,36,0.12)]" : "rounded-full",
            )}
          />

          <AnimatePresence>
            {open && (
              <motion.div
                id="quick-search-results"
                role="listbox"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="absolute left-0 right-0 top-11 z-50 rounded-b-[24px] border border-t-0 border-border bg-card shadow-[0_4px_12px_rgba(32,33,36,0.18)] overflow-hidden"
              >
                <div className="h-px bg-border/80 mx-3" />
                {showingRecents ? (
                  <div className="flex items-center justify-between px-4 pt-2.5 pb-1">
                    <p className="text-xs font-medium text-muted-foreground">Recent</p>
                    <button
                      type="button"
                      onClick={clearRecents}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                ) : !query.trim() ? (
                  <p className="px-4 pt-2.5 pb-1 text-xs font-medium text-muted-foreground">Suggestions</p>
                ) : null}

                <ul className="max-h-72 overflow-y-auto pb-2">
                  {results.length === 0 ? (
                    <li className="px-4 py-3 text-sm text-muted-foreground">No results for “{query.trim()}”</li>
                  ) : (
                    results.map((page, index) => {
                      const active = index === activeIndex;
                      const RowIcon = showingRecents ? Clock : Search;
                      return (
                        <li key={`${page.to}-${page.label}`} role="option" aria-selected={active}>
                          <button
                            type="button"
                            onMouseEnter={() => setActiveIndex(index)}
                            onClick={() => goTo(page.to)}
                            className={cn(
                              "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                              active ? "bg-muted" : "hover:bg-muted/70",
                            )}
                          >
                            <RowIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="min-w-0 flex-1 text-sm text-foreground/90 truncate">
                              {highlightMatch(page.label, query)}
                            </span>
                          </button>
                        </li>
                      );
                    })
                  )}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {trailing ? <div className="shrink-0 lg:hidden">{trailing}</div> : null}
    </div>
  );
}

const MOBILE_TABS = [
  { icon: LayoutDashboard, label: "Dashboard", to: "/" as const },
  { icon: History, label: "Activity", to: "/activity" as const },
  { icon: Settings, label: "Settings", to: "/settings" as const },
];

function MobileBottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-sidebar text-white"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      aria-label="Primary"
    >
      <div className="grid grid-cols-3 h-14 max-w-lg mx-auto">
        {MOBILE_TABS.map(({ icon: Icon, label, to }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "relative flex flex-col items-center justify-center gap-0.5 transition-colors text-white",
                active ? "bg-white/15" : "hover:bg-white/10",
              )}
            >
              {active && (
                <motion.span
                  layoutId="mobile-tab"
                  className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 bg-white"
                />
              )}
              <Icon className={cn("h-5 w-5 text-white", active && "stroke-[2.25px]")} />
              <span className={cn("text-[10px] leading-none text-white", active ? "font-semibold" : "font-medium")}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default function AdminLayout({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  // Mobile: closed until hamburger. Desktop: open after mount.
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && !user) {
      void navigate({ to: "/login" });
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const sync = () => {
      if (mql.matches) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
        setSidebarExpanded(false);
      }
    };
    sync();
    mql.addEventListener("change", sync);
    return () => mql.removeEventListener("change", sync);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    if (!window.matchMedia("(min-width: 1024px)").matches) {
      setSidebarOpen(false);
    }
  }, [pathname]);

  // Escape closes mobile drawer; lock body scroll while open
  useEffect(() => {
    const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
    if (!sidebarOpen || isDesktop) {
      document.body.style.overflow = "";
      return;
    }
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [sidebarOpen]);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const toggleSidebarExpand = () => {
    setSidebarExpanded((prev) => !prev);
    setSidebarOpen(true);
  };
  const closeSidebar = () => setSidebarOpen(false);

  if (loading || !user) {
    return (
      <div className="min-h-screen grid place-items-center bg-mesh text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <AdminShellContext.Provider
      value={{
        sidebarOpen,
        sidebarExpanded,
        toggleSidebar,
        toggleSidebarExpand,
        closeSidebar,
        title,
      }}
    >
      <div className="min-h-screen bg-mesh flex">
        <Sidebar
          open={sidebarOpen}
          expanded={sidebarExpanded}
          onClose={closeSidebar}
          onToggleExpand={toggleSidebarExpand}
        />
        <div className="flex-1 min-w-0 flex flex-col pb-[calc(3.5rem+env(safe-area-inset-bottom))] lg:pb-0">
          {children}
        </div>
        <MobileBottomNav />
      </div>
    </AdminShellContext.Provider>
  );
}
