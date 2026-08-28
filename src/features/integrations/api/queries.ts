import { queryOptions, useQuery } from "@tanstack/react-query";

import { getConnectors } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/query-keys";

export const connectorsQueryOptions = () =>
  queryOptions({ queryKey: queryKeys.connectors.list(), queryFn: () => getConnectors() });

export function useConnectors() {
  return useQuery(connectorsQueryOptions());
}
