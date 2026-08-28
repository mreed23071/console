import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  assignOrgMember,
  createOrgNode,
  type CreateOrgNodeInput,
  deleteOrgNode,
  removeOrgMember,
  updateOrgNode,
  type UpdateOrgNodePatch,
} from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/query-keys";

/**
 * Every org mutation reshapes the same tree, so they all invalidate the whole
 * branch rather than trying to patch individual nodes. The tree is one small
 * request; precision here would buy nothing and drift from the server.
 */
function useInvalidateOrg() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: queryKeys.org.all });
}

export function useCreateOrgNode() {
  const invalidate = useInvalidateOrg();
  return useMutation({
    mutationFn: (input: CreateOrgNodeInput) => createOrgNode(input),
    onSuccess: invalidate,
  });
}

export function useUpdateOrgNode() {
  const invalidate = useInvalidateOrg();
  return useMutation({
    mutationFn: (vars: { id: string; patch: UpdateOrgNodePatch }) =>
      updateOrgNode(vars.id, vars.patch),
    onSuccess: invalidate,
  });
}

export function useDeleteOrgNode() {
  const invalidate = useInvalidateOrg();
  return useMutation({
    mutationFn: (id: string) => deleteOrgNode(id),
    onSuccess: invalidate,
  });
}

export function useAssignOrgMember() {
  const invalidate = useInvalidateOrg();
  return useMutation({
    mutationFn: (vars: { nodeId: string; userId: string }) =>
      assignOrgMember(vars.nodeId, vars.userId),
    onSuccess: invalidate,
  });
}

export function useRemoveOrgMember() {
  const invalidate = useInvalidateOrg();
  return useMutation({
    mutationFn: (vars: { nodeId: string; userId: string }) =>
      removeOrgMember(vars.nodeId, vars.userId),
    onSuccess: invalidate,
  });
}
