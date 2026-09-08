import { useEffect, useState, type FormEvent } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import logo from "@/assets/logo-light.png";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { signIn, user, loading, configured } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      void navigate({ to: "/" });
    }
  }, [loading, user, navigate]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await signIn(email.trim(), password);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    void navigate({ to: "/" });
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
            <p className="text-white/75 text-sm mt-1">Sign in to continue</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="bg-card border border-border border-t-0 px-6 py-7 space-y-4">
          {!configured && (
            <p className="text-sm text-destructive">
              Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.
            </p>
          )}

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

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="password">Password</Label>
              <Link
                to="/forgot-password"
                search={email.trim() ? { email: email.trim() } : undefined}
                className="text-xs font-medium text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <PasswordInput
              id="password"
              autoComplete="current-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={submitting || !configured}>
            {submitting ? "Signing in…" : "Sign in"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link to="/signup" className="text-primary font-medium hover:underline">
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
