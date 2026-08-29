import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { AppShell } from "@/components/layout/app-shell";
import { useAuthStore } from "@/features/auth";
import { peopleQueryOptions } from "@/features/people";

/**
 * Layout route for everything behind sign-in. `ssr: false` because the session
 * lives in persisted client state, so the guard can only run in the browser.
 */
export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ context }) => {
    if (!useAuthStore.getState().session) {
      throw redirect({ to: "/login" });
    }
    // No auth model backs the directory yet - just an empty one. Until
    // somebody exists to be the console's first employee, there's nothing
    // else here to show.
    //
    // `fetchQuery`, not `ensureQueryData`: the latter returns whatever is
    // already cached and only *starts* a background refetch when stale, so
    // right after creating the first person this would still see the old
    // empty list and bounce straight back to `/setup`. `fetchQuery` awaits
    // a real refetch whenever the query is stale or invalidated, which it
    // always is here (default staleTime is 0, and `useCreatePerson`
    // invalidates this query on success).
    const people = await context.queryClient.fetchQuery(peopleQueryOptions());
    if (people.length === 0) {
      throw redirect({ to: "/setup" });
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
