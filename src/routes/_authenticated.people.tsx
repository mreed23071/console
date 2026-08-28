import { createFileRoute, Outlet } from "@tanstack/react-router";

/** Pathless wrapper so `/people` and `/people/$id` share a segment. */
export const Route = createFileRoute("/_authenticated/people")({
  component: () => <Outlet />,
});
