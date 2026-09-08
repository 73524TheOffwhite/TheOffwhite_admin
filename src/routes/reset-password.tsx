import { useEffect, useState, type FormEvent } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import logo from "@/assets/logo-light.png";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { updatePassword, user, loading, configured } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);

  // Wait for auth to parse the recovery link session from the URL.
  useEffect(() => {
    if (loading) return;
    const t = window.setTimeout(() => setReady(true), 400);
    return () => window.clearTimeout(t);
  }, [loading]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (!user) {
      setError("This reset link is invalid or has expired. Request a new one.");
      return;
    }

    setSubmitting(true);
    const result = await updatePassword(password);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setDone(true);
  }

  if (loading || !ready) {
    return (
      <div className="min-h-dvh grid place-items-center bg-[#F7F2EB] text-sm text-muted-foreground">
        Verifying reset link…
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-[#F7F2EB] px-4 py-10">
      <div className="w-full max-w-md">
        <div className="bg-[#8B5B2A] px-6 py-8 flex flex-col items-center gap-3">
          <img src={logo} alt="The Off White" className="h-20 w-auto object-contain" />
          <div className="text-center">
            <p className="text-white text-lg font-semibold">Offwhite Admin</p>
            <p className="text-white/75 text-sm mt-1">Choose a new password</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="bg-card border border-border border-t-0 px-6 py-7 space-y-4">
          {!configured && (
            <p className="text-sm text-destructive">
              Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.
            </p>
          )}

          {done ? (
            <div className="space-y-4">
              <p className="text-sm text-foreground">
                Your password has been updated. You can continue to the dashboard.
              </p>
              <Button
                type="button"
                className="w-full"
                onClick={() => void navigate({ to: "/" })}
              >
                Go to dashboard
              </Button>
            </div>
          ) : !user ? (
            <div className="space-y-4">
              <p className="text-sm text-destructive">
                This reset link is invalid or has expired. Request a new password reset email.
              </p>
              <Button asChild type="button" className="w-full">
                <Link to="/forgot-password">Request new link</Link>
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                <Link to="/login" className="text-primary font-medium hover:underline">
                  Back to sign in
                </Link>
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="password">New password</Label>
                <PasswordInput
                  id="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm password</Label>
                <PasswordInput
                  id="confirm"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat new password"
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" className="w-full" disabled={submitting || !configured}>
                {submitting ? "Updating…" : "Update password"}
              </Button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
