import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/signup")({
  component: SignupRedirectPage,
});

/** Public signup is disabled — operators are created from Admin → Users. */
function SignupRedirectPage() {
  const navigate = useNavigate();

  useEffect(() => {
    void navigate({ to: "/login", replace: true });
  }, [navigate]);

  return (
    <div className="min-h-dvh grid place-items-center bg-[#F7F2EB] text-sm text-muted-foreground">
      Redirecting to sign in…
    </div>
  );
}
