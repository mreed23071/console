import { queryOptions, useQuery } from "@tanstack/react-query";

import { getOrgNodes } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/query-keys";

export const orgNodesQueryOptions = () =>
  queryOptions({ queryKey: queryKeys.org.nodes(), queryFn: () => getOrgNodes() });

export function useOrgNodes() {
  return useQuery(orgNodesQueryOptions());
}
