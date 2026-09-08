import { useEffect, useState, type FormEvent } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import logo from "@/assets/logo-light.png";

type ForgotSearch = {
  email?: string;
};

export const Route = createFileRoute("/forgot-password")({
  validateSearch: (search: Record<string, unknown>): ForgotSearch => ({
    email: typeof search.email === "string" ? search.email : undefined,
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const { requestPasswordReset, user, loading, configured } = useAuth();
  const navigate = useNavigate();
  const { email: emailFromSearch } = Route.useSearch();
  const [email, setEmail] = useState(emailFromSearch ?? "");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      void navigate({ to: "/" });
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    if (emailFromSearch) setEmail(emailFromSearch);
  }, [emailFromSearch]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await requestPasswordReset(email.trim());
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSent(true);
  }

  if (loading || user) {
    return (
      <div className="min-h-dvh grid place-items-center bg-[#F7F2EB] text-sm text-muted-foreground">
        Loading…
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
            <p className="text-white/75 text-sm mt-1">Reset your password</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="bg-card border border-border border-t-0 px-6 py-7 space-y-4">
          {!configured && (
            <p className="text-sm text-destructive">
              Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.
            </p>
          )}

          {sent ? (
            <div className="space-y-4">
              <p className="text-sm text-foreground">
                If an account exists for <span className="font-medium">{email.trim()}</span>, a reset
                link has been sent. Check your inbox and follow the link to choose a new password.
              </p>
              <Button asChild type="button" className="w-full">
                <Link to="/login">Back to sign in</Link>
              </Button>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Enter your account email and we&apos;ll send you a link to reset your password.
              </p>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" className="w-full" disabled={submitting || !configured}>
                {submitting ? "Sending…" : "Send reset link"}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Remembered it?{" "}
                <Link to="/login" className="text-primary font-medium hover:underline">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
