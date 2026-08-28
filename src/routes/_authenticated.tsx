import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { AppShell } from "@/components/layout/app-shell";
import { useAuthStore } from "@/features/auth";

/**
 * Layout route for everything behind sign-in. `ssr: false` because the session
 * lives in persisted client state, so the guard can only run in the browser.
 */
export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: () => {
    if (!useAuthStore.getState().session) {
      throw redirect({ to: "/login" });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
