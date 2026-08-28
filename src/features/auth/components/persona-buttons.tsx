import { Loader2, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";

import { type Persona, PERSONAS } from "@/features/auth/store";

/** Quick sign-in shortcuts, one per mocked persona. */
export function PersonaButtons({
  pending,
  onSelect,
}: {
  pending: Persona | null;
  onSelect: (persona: Persona) => void;
}) {
  const { t } = useTranslation("auth");

  return (
    <div className="space-y-2">
      {PERSONAS.map((persona) => (
        <button
          key={persona}
          type="button"
          disabled={pending !== null}
          onClick={() => onSelect(persona)}
          className="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-60"
        >
          <ShieldCheck className="size-4 shrink-0 text-primary" />
          <span className="min-w-0">
            <span className="block text-sm font-medium">
              {t("signIn.continueAs", { persona: t(`persona.${persona}.label` as never) })}
            </span>
            <span className="block text-xs text-muted-foreground">
              {t(`persona.${persona}.blurb` as never)}
            </span>
          </span>
          {pending === persona && <Loader2 className="ml-auto size-4 animate-spin" />}
        </button>
      ))}
    </div>
  );
}
