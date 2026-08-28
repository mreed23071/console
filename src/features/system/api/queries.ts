import { queryOptions, useQuery } from "@tanstack/react-query";

import { getHealth, getReadiness } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/query-keys";

export const healthQueryOptions = () =>
  queryOptions({ queryKey: queryKeys.system.health(), queryFn: () => getHealth() });

export const readinessQueryOptions = () =>
  queryOptions({ queryKey: queryKeys.system.readiness(), queryFn: () => getReadiness() });

export function useHealth() {
  return useQuery(healthQueryOptions());
}

export function useReadiness() {
  return useQuery(readinessQueryOptions());
}
