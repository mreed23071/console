import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  type CreatePersonInput,
  createUser,
  createUserNote,
  deleteUserNote,
  forgetUser,
  regenerateUserSummary,
  updateUser,
} from "@/lib/api/endpoints";
import type { Person, SummaryRange } from "@/lib/api/types";
import { queryKeys } from "@/lib/query-keys";

/**
 * Identity changes ripple outward: a person's messages, the unresolved account
 * pool and connector counts all shift. This invalidates the whole affected set
 * so no screen is left showing stale attribution.
 */
export function useInvalidatePeople() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: queryKeys.users.all });
    qc.invalidateQueries({ queryKey: queryKeys.messages.all });
    qc.invalidateQueries({ queryKey: queryKeys.accounts.all });
    qc.invalidateQueries({ queryKey: queryKeys.connectors.all });
  };
}

export function useCreatePerson() {
  const invalidate = useInvalidatePeople();
  return useMutation({
    mutationFn: (input: CreatePersonInput) => createUser(input),
    onSuccess: invalidate,
  });
}

export function useUpdatePerson(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<Person>) => updateUser(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}

export function useForgetPerson() {
  const invalidate = useInvalidatePeople();
  return useMutation({ mutationFn: (id: string) => forgetUser(id), onSuccess: invalidate });
}

export function useRegenerateSummary(id: string, range: SummaryRange = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => regenerateUserSummary(id, range),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.users.summary(id, range), data);
    },
  });
}

export function useCreatePersonNote(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { body: string; author: string }) =>
      createUserNote(id, vars.body, vars.author),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.users.notes(id) }),
  });
}

export function useDeletePersonNote(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (noteId: string) => deleteUserNote(noteId),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.users.notes(id) }),
  });
}
