import { useEffect, useRef, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Camera,
  ChevronDown,
  KeyRound,
  Lock,
  LogOut,
  MonitorSmartphone,
  User,
} from "lucide-react";
import { toast } from "sonner";
import AdminLayout, { Topbar } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { uploadMediaFile } from "@/lib/media";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function ProfilePanel() {
  const { user, displayName, avatarUrl, updateProfile, configured } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(displayName);
  const [email, setEmail] = useState(user?.email ?? "");
  const [preview, setPreview] = useState<string | null>(avatarUrl);
  const [pendingAvatarUrl, setPendingAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(displayName);
    setEmail(user?.email ?? "");
    setPreview(avatarUrl);
    setPendingAvatarUrl(null);
  }, [displayName, user?.email, avatarUrl]);

  const initials =
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "A";

  async function onPickAvatar(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5 MB.");
      return;
    }

    setError(null);
    setUploading(true);
    try {
      const local = URL.createObjectURL(file);
      setPreview(local);
      const uploaded = await uploadMediaFile(file, "avatars");
      setPendingAvatarUrl(uploaded.publicUrl);
      setPreview(uploaded.publicUrl);
      URL.revokeObjectURL(local);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Avatar upload failed");
      setPreview(avatarUrl);
    } finally {
      setUploading(false);
    }
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const result = await updateProfile({
      name: name.trim(),
      email: email.trim(),
      avatarUrl: pendingAvatarUrl ?? preview,
    });
    setSaving(false);

    if (result.error) {
      setError(result.error);
      toast.error(result.error);
      return;
    }

    setPendingAvatarUrl(null);
    if (result.emailConfirmationRequired) {
      toast.success("Profile saved. Check your inbox to confirm the new email.");
    } else {
      toast.success("Profile updated");
    }
  }

  return (
    <form onSubmit={onSave} className="border-t border-border bg-muted/20 px-4 py-4 sm:px-5 sm:py-5 space-y-4">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading || !configured}
          className="relative size-16 rounded-full overflow-hidden bg-primary text-primary-foreground grid place-items-center shrink-0 ring-2 ring-border hover:opacity-90 transition disabled:opacity-60"
          aria-label="Change profile photo"
        >
          {preview ? (
            <img src={preview} alt="" className="absolute inset-0 size-full object-cover" />
          ) : (
            <span className="text-lg font-semibold">{initials}</span>
          )}
          <span className="absolute inset-x-0 bottom-0 py-1 bg-black/45 text-white grid place-items-center">
            <Camera className="h-3.5 w-3.5" />
          </span>
        </button>
        <div className="min-w-0">
          <p className="text-sm font-medium">Profile photo</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {uploading ? "Uploading…" : "JPG or PNG, up to 5 MB"}
          </p>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading || !configured}
            className="mt-1.5 text-xs font-medium text-primary hover:underline disabled:opacity-50"
          >
            {preview ? "Change photo" : "Upload photo"}
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => void onPickAvatar(e.target.files?.[0])}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="profile-name">Username</Label>
          <Input
            id="profile-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            required
            autoComplete="name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="profile-email">Email</Label>
          <Input
            id="profile-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
        </div>
      </div>

      {user?.new_email ? (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          Pending email change to <span className="font-medium">{user.new_email}</span>. Confirm via the
          link we sent.
        </p>
      ) : null}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={saving || uploading || !configured}>
          {saving ? "Saving…" : "Save profile"}
        </Button>
      </div>
    </form>
  );
}

function SecurityPanel() {
  const {
    user,
    configured,
    getActiveSessionCount,
    signOutOthers,
    requestPasswordReset,
  } = useAuth();
  const [sessionCount, setSessionCount] = useState<number | null>(null);
  const [loadingCount, setLoadingCount] = useState(true);
  const [signingOutOthers, setSigningOutOthers] = useState(false);
  const [resetting, setResetting] = useState(false);

  const refreshCount = async () => {
    setLoadingCount(true);
    try {
      const n = await getActiveSessionCount();
      setSessionCount(n);
    } catch {
      setSessionCount(1);
    } finally {
      setLoadingCount(false);
    }
  };

  useEffect(() => {
    void refreshCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refresh when panel opens / auth helper identity
  }, [getActiveSessionCount]);

  const otherCount = sessionCount != null ? Math.max(sessionCount - 1, 0) : 0;

  async function onLogoutOthers() {
    setSigningOutOthers(true);
    const result = await signOutOthers();
    setSigningOutOthers(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Signed out of all other devices");
    await refreshCount();
  }

  async function onResetPassword() {
    const email = user?.email?.trim();
    if (!email) {
      toast.error("No email on this account.");
      return;
    }
    setResetting(true);
    const result = await requestPasswordReset(email);
    setResetting(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(`Password reset link sent to ${email}`);
  }

  return (
    <div className="border-t border-border bg-muted/20 px-4 py-4 sm:px-5 sm:py-5 space-y-4">
      <div className="rounded-xl border border-border bg-card p-3.5 sm:p-4 flex items-start gap-3">
        <span className="grid place-items-center size-9 rounded-xl bg-muted text-foreground/70 shrink-0">
          <MonitorSmartphone className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Active logins</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {loadingCount || sessionCount == null
              ? "Checking devices…"
              : sessionCount === 1
                ? "Signed in on 1 system (this device only)."
                : `Signed in on ${sessionCount} systems — ${otherCount} other than this one.`}
          </p>
        </div>
        <p className="text-xl font-bold tabular-nums shrink-0">
          {loadingCount || sessionCount == null ? "—" : sessionCount}
        </p>
      </div>

      <div className="space-y-2">
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start h-auto py-3 px-3.5"
          disabled={!configured || signingOutOthers || loadingCount || otherCount === 0}
          onClick={() => void onLogoutOthers()}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span className="text-left min-w-0">
            <span className="block text-sm font-medium">
              {signingOutOthers ? "Signing out…" : "Log out other devices"}
            </span>
            <span className="block text-xs text-muted-foreground font-normal mt-0.5">
              {otherCount === 0
                ? "No other active sessions"
                : `End ${otherCount} other login${otherCount === 1 ? "" : "s"} for this account`}
            </span>
          </span>
        </Button>

        <Button
          type="button"
          variant="outline"
          className="w-full justify-start h-auto py-3 px-3.5"
          disabled={!configured || resetting || !user?.email}
          onClick={() => void onResetPassword()}
        >
          <KeyRound className="h-4 w-4 shrink-0" />
          <span className="text-left min-w-0">
            <span className="block text-sm font-medium">
              {resetting ? "Sending…" : "Reset password"}
            </span>
            <span className="block text-xs text-muted-foreground font-normal mt-0.5">
              Email a reset link to {user?.email ?? "your account"}
            </span>
          </span>
        </Button>
      </div>
    </div>
  );
}

function SettingsPage() {
  const [openSection, setOpenSection] = useState<"profile" | "security" | null>("profile");

  return (
    <AdminLayout title="Settings">
      <main className="flex-1 min-w-0 flex flex-col">
        <div className="flex-1 min-w-0 p-3 sm:p-4 md:p-6 lg:p-7 space-y-3 sm:space-y-5">
          <Topbar />

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Manage your admin account and preferences.
            </p>

            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenSection((s) => (s === "profile" ? null : "profile"))}
                aria-expanded={openSection === "profile"}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-muted/40 transition-colors"
              >
                <span className="grid place-items-center w-9 h-9 rounded-xl bg-muted text-foreground/70">
                  <User className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">Profile</span>
                  <span className="block text-xs text-muted-foreground">Name, email, avatar</span>
                </span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    openSection === "profile" && "rotate-180",
                  )}
                />
              </button>
              {openSection === "profile" ? <ProfilePanel /> : null}

              <div className="border-t border-border">
                <button
                  type="button"
                  onClick={() => setOpenSection((s) => (s === "security" ? null : "security"))}
                  aria-expanded={openSection === "security"}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-muted/40 transition-colors"
                >
                  <span className="grid place-items-center w-9 h-9 rounded-xl bg-muted text-foreground/70">
                    <Lock className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">Security</span>
                    <span className="block text-xs text-muted-foreground">Password and sessions</span>
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform",
                      openSection === "security" && "rotate-180",
                    )}
                  />
                </button>
                {openSection === "security" ? <SecurityPanel /> : null}
              </div>
            </div>
          </div>
        </div>
      </main>
    </AdminLayout>
  );
}
