import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  configured: boolean;
  displayName: string;
  avatarUrl: string | null;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (name: string, email: string, password: string) => Promise<{ error: string | null; needsConfirmation?: boolean }>;
  signOut: () => Promise<void>;
  signOutOthers: () => Promise<{ error: string | null }>;
  getActiveSessionCount: () => Promise<number>;
  requestPasswordReset: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (password: string) => Promise<{ error: string | null }>;
  updateProfile: (input: {
    name: string;
    email: string;
    avatarUrl?: string | null;
  }) => Promise<{ error: string | null; emailConfirmationRequired?: boolean }>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function nameFromUser(user: User | null) {
  if (!user) return "";
  const meta = user.user_metadata ?? {};
  return (
    (typeof meta.full_name === "string" && meta.full_name) ||
    (typeof meta.name === "string" && meta.name) ||
    user.email?.split("@")[0] ||
    "Admin"
  );
}

function avatarFromUser(user: User | null) {
  if (!user) return null;
  const meta = user.user_metadata ?? {};
  return (typeof meta.avatar_url === "string" && meta.avatar_url) || null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setUser(next?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
      },
    });
    if (error) return { error: error.message };
    if (!data.session) return { error: null, needsConfirmation: true };
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut({ scope: "local" });
  }, []);

  const signOutOthers = useCallback(async () => {
    const { error } = await supabase.auth.signOut({ scope: "others" });
    return { error: error?.message ?? null };
  }, []);

  const getActiveSessionCount = useCallback(async () => {
    const { data, error } = await supabase.rpc("count_my_sessions");
    if (error) {
      console.warn("[auth] count_my_sessions:", error.message);
      return 1;
    }
    const n = typeof data === "number" ? data : Number(data);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    const redirectTo =
      typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    return { error: error?.message ?? null };
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error: error?.message ?? null };
  }, []);

  const updateProfile = useCallback(
    async (input: { name: string; email: string; avatarUrl?: string | null }) => {
      const name = input.name.trim();
      const email = input.email.trim();
      if (!name) return { error: "Name is required." };
      if (!email) return { error: "Email is required." };

      const data: Record<string, string> = {
        full_name: name,
        name,
      };
      if (input.avatarUrl) {
        data.avatar_url = input.avatarUrl;
      }

      const { data: result, error } = await supabase.auth.updateUser({
        email,
        data,
      });
      if (error) return { error: error.message };

      if (result.user) {
        setUser(result.user);
        setSession((prev) => (prev ? { ...prev, user: result.user! } : prev));
      }

      const emailConfirmationRequired = Boolean(
        result.user?.new_email && result.user.new_email !== result.user.email,
      );
      return { error: null, emailConfirmationRequired };
    },
    [],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      loading,
      configured: isSupabaseConfigured,
      displayName: nameFromUser(user),
      avatarUrl: avatarFromUser(user),
      signIn,
      signUp,
      signOut,
      signOutOthers,
      getActiveSessionCount,
      requestPasswordReset,
      updatePassword,
      updateProfile,
    }),
    [
      user,
      session,
      loading,
      signIn,
      signUp,
      signOut,
      signOutOthers,
      getActiveSessionCount,
      requestPasswordReset,
      updatePassword,
      updateProfile,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
