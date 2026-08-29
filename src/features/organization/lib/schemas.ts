import type { TFunction } from "i18next";
import { z } from "zod";

/** Select needs a non-empty string value, so a root node gets a sentinel. */
export const NO_PARENT = "__root__";

export function nodeFormSchema(t: TFunction<["organization", "common"]>) {
  return z.object({
    name: z.string().trim().min(1, t("common:validation.required")),
    // Not `.optional()`: `defaultValues` always supplies "", so this is never
    // actually `undefined` — see the identical note in features/people/lib/schemas.ts.
    subtitle: z.string().trim(),
    parentId: z.string(),
  });
}

export type NodeFormValues = z.infer<ReturnType<typeof nodeFormSchema>>;
