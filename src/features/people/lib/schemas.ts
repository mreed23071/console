import type { TFunction } from "i18next";
import { z } from "zod";

/**
 * Fields shared by "add" and "edit": both need a name and a valid email.
 * Everything else is a plain (never-undefined) string, not `.optional()` —
 * `useForm`'s `defaultValues` always supplies `""` for an unset field, so the
 * value is never actually `undefined` at runtime. Marking these `.optional()`
 * would make the inferred type `string | undefined`, which then fails to
 * satisfy the mutation input types under `exactOptionalPropertyTypes` even
 * though the form itself never produces `undefined`.
 *
 * `t` is passed in rather than imported because the schema is rebuilt inside
 * the component on every render — `useTranslation` only works inside a
 * component, and passing `t` keeps this a plain function instead of another
 * hook.
 */
export function personFormSchema(t: TFunction<["people", "common"]>) {
  return z.object({
    full_name: z.string().trim().min(1, t("common:validation.required")),
    email: z
      .string()
      .trim()
      .min(1, t("common:validation.required"))
      .email(t("common:validation.email")),
    job_title: z.string().trim(),
    address: z.string().trim(),
    timezone: z.string().trim(),
    employment_start: z.string(),
  });
}

export type AddPersonFormValues = z.infer<ReturnType<typeof personFormSchema>>;

/** Edit carries every add field, plus the ones only an existing person has. */
export function editPersonFormSchema(t: TFunction<["people", "common"]>) {
  return personFormSchema(t).extend({
    display_name: z.string().trim(),
    employment_end: z.string(),
    is_active: z.boolean(),
  });
}

export type EditPersonFormValues = z.infer<ReturnType<typeof editPersonFormSchema>>;

export function accountFormSchema(t: TFunction<["people", "common"]>) {
  return z.object({
    platform: z.enum(["slack", "github", "teams", "email", "linear", "other"]),
    external_handle: z.string().trim().min(1, t("common:validation.required")),
    external_email: z.union([z.string().trim().email(t("common:validation.email")), z.literal("")]),
  });
}

export type AccountFormValues = z.infer<ReturnType<typeof accountFormSchema>>;
