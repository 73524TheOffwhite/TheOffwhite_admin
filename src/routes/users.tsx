import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown, Plus, UserPlus, Users } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import AdminLayout, { Topbar } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { createAdminUser, listAdminUsers, type AdminUserRow } from "@/lib/admin-users";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/users")({
  component: UsersPage,
});

async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? "";
}

function formatWhen(value: string | null) {
  if (!value) return "—";
  try {
    return format(parseISO(value), "d MMM yyyy, h:mm a");
  } catch {
    return value;
  }
}

function UsersListPanel({
  users,
  loading,
  currentUserId,
}: {
  users: AdminUserRow[];
  loading: boolean;
  currentUserId?: string;
}) {
  return (
    <div className="border-t border-border bg-muted/20 px-4 py-4 sm:px-5 sm:py-5 space-y-3">
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading users…</p>
      ) : users.length === 0 ? (
        <p className="text-sm text-muted-foreground">No admin users yet.</p>
      ) : (
        <ul className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
          {users.map((row) => {
            const initials =
              row.name
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((p) => p[0]?.toUpperCase() ?? "")
                .join("") || "A";
            const isYou = row.id === currentUserId;
            return (
              <li key={row.id} className="flex items-start gap-3 p-3.5 sm:p-4">
                <span className="grid place-items-center size-9 rounded-xl bg-muted text-foreground/70 text-xs font-semibold shrink-0">
                  {initials}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {row.name}
                    {isYou ? (
                      <span className="ml-2 text-[10px] uppercase tracking-wide font-semibold text-primary">
                        You
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{row.email}</p>
                  <p className="text-[11px] text-muted-foreground mt-1.5">
                    Created {formatWhen(row.createdAt)}
                    {row.lastSignInAt ? ` · Last login ${formatWhen(row.lastSignInAt)}` : ""}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function AddUserPanel({ onCreated }: { onCreated: (user: AdminUserRow) => void }) {
  const { configured } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) throw new Error("Not signed in.");
      const result = await createAdminUser({
        data: {
          accessToken,
          name: name.trim(),
          email: email.trim(),
          password,
        },
      });
      onCreated(result.user);
      setName("");
      setEmail("");
      setPassword("");
      toast.success(`User added — ${result.user.email} can sign in now`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create user";
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="border-t border-border bg-muted/20 px-4 py-4 sm:px-5 sm:py-5 space-y-4"
    >
      <p className="text-xs text-muted-foreground">
        New operators can sign in on the login page with the email and password you set here. No
        signup link is needed.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="user-name">Name</Label>
          <Input
            id="user-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            required
            autoComplete="off"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="user-email">Email</Label>
          <Input
            id="user-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="operator@example.com"
            required
            autoComplete="off"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="user-password">Password</Label>
          <PasswordInput
            id="user-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={6}
            autoComplete="new-password"
          />
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={submitting || !configured}>
          <Plus className="h-4 w-4" />
          {submitting ? "Adding…" : "Add user"}
        </Button>
      </div>
    </form>
  );
}

function UsersPage() {
  const { user, configured } = useAuth();
  const [openSection, setOpenSection] = useState<"list" | "add" | null>("list");
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) throw new Error("Not signed in.");
      const result = await listAdminUsers({ data: { accessToken } });
      setUsers(result.users);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load users";
      setLoadError(message);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      setLoadError("Supabase is not configured.");
      return;
    }
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once when auth is ready
  }, [configured]);

  return (
    <AdminLayout title="Users">
      <main className="flex-1 min-w-0 flex flex-col">
        <div className="flex-1 min-w-0 p-3 sm:p-4 md:p-6 lg:p-7 space-y-3 sm:space-y-5">
          <Topbar />

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Manage who can sign in to the Offwhite admin panel.
            </p>

            {loadError ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
                {loadError}
              </div>
            ) : null}

            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenSection((s) => (s === "list" ? null : "list"))}
                aria-expanded={openSection === "list"}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-muted/40 transition-colors"
              >
                <span className="grid place-items-center w-9 h-9 rounded-xl bg-muted text-foreground/70">
                  <Users className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">Admin users</span>
                  <span className="block text-xs text-muted-foreground">
                    {loading ? "Loading…" : `${users.length} account${users.length === 1 ? "" : "s"}`}
                  </span>
                </span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    openSection === "list" && "rotate-180",
                  )}
                />
              </button>
              {openSection === "list" ? (
                <UsersListPanel users={users} loading={loading} currentUserId={user?.id} />
              ) : null}

              <div className="border-t border-border">
                <button
                  type="button"
                  onClick={() => setOpenSection((s) => (s === "add" ? null : "add"))}
                  aria-expanded={openSection === "add"}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-muted/40 transition-colors"
                >
                  <span className="grid place-items-center w-9 h-9 rounded-xl bg-muted text-foreground/70">
                    <UserPlus className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">Add user</span>
                    <span className="block text-xs text-muted-foreground">
                      Name, email, and password
                    </span>
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform",
                      openSection === "add" && "rotate-180",
                    )}
                  />
                </button>
                {openSection === "add" ? (
                  <AddUserPanel
                    onCreated={(created) => {
                      setUsers((list) =>
                        [...list.filter((u) => u.id !== created.id), created].sort((a, b) =>
                          a.email.localeCompare(b.email),
                        ),
                      );
                      setOpenSection("list");
                    }}
                  />
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </main>
    </AdminLayout>
  );
}
