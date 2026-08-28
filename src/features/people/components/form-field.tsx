import type { ReactNode } from "react";

import { Label } from "@/components/ui/label";

/** Label + control pair used across every person dialog. */
export function FormField({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}
