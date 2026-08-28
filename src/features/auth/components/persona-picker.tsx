import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { type Persona, PERSONAS, SCOPES, useAuthStore } from "@/features/auth/store";

/** Settings-page control for switching the active persona. */
export function PersonaPicker() {
  const { t } = useTranslation(["settings", "auth"]);
  const persona = useAuthStore((s) => s.session?.persona) ?? "viewer";
  const setPersona = useAuthStore((s) => s.setPersona);

  return (
    <RadioGroup
      value={persona}
      onValueChange={(v) => {
        const next = v as Persona;
        setPersona(next);
        toast.success(
          t("settings:role.switched", { persona: t(`auth:persona.${next}.label` as never) }),
        );
      }}
      className="gap-3"
    >
      {PERSONAS.map((p) => (
        <label
          key={p}
          className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 hover:bg-accent hover:text-accent-foreground"
        >
          <RadioGroupItem value={p} className="mt-1" />
          <span>
            <span className="block text-sm font-medium">
              {t(`auth:persona.${p}.label` as never)}
            </span>
            <span className="block text-xs text-muted-foreground">
              {t(`settings:role.${p}` as never)}
            </span>
            <span className="mt-1 block font-mono text-xs text-muted-foreground">
              {SCOPES[p].join(" · ") || t("settings:role.noScopes")}
            </span>
          </span>
        </label>
      ))}
    </RadioGroup>
  );
}
