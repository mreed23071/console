import { useMutation, useQuery } from "@tanstack/react-query";

import {
  createAccount,
  type CreateAccountInput,
  deleteAccount,
  getUnlinkedAccounts,
  linkAccount,
  unlinkAccount,
} from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/query-keys";

import { useInvalidatePeople } from "./mutations";

export function useUnlinkedAccounts() {
  return useQuery({
    queryKey: queryKeys.accounts.unlinked(),
    queryFn: () => getUnlinkedAccounts(),
  });
}

export function useLinkAccount() {
  const invalidate = useInvalidatePeople();
  return useMutation({
    mutationFn: (vars: { accountId: string; userId: string }) =>
      linkAccount(vars.accountId, vars.userId),
    onSuccess: invalidate,
  });
}

export function useUnlinkAccount() {
  const invalidate = useInvalidatePeople();
  return useMutation({
    mutationFn: (accountId: string) => unlinkAccount(accountId),
    onSuccess: invalidate,
  });
}

export function useDeleteAccount() {
  const invalidate = useInvalidatePeople();
  return useMutation({
    mutationFn: (accountId: string) => deleteAccount(accountId),
    onSuccess: invalidate,
  });
}

export function useCreateAccount() {
  // `useInvalidatePeople` clears `queryKeys.users.all`, which is a prefix of
  // the per-person accounts key, so the new account shows up without an
  // extra invalidation here.
  const invalidate = useInvalidatePeople();
  return useMutation({
    mutationFn: (input: CreateAccountInput) => createAccount(input),
    onSuccess: invalidate,
  });
}
