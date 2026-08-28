import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useUpdatePerson } from "@/features/people/api/mutations";
import { FormField } from "@/features/people/components/form-field";
import type { Person } from "@/lib/api/types";

export function EditPersonDialog({
  person,
  open,
  onOpenChange,
}: {
  person: Person;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { t } = useTranslation(["people", "common"]);
  const update = useUpdatePerson(person.id);
  const [form, setForm] = useState(person);

  useEffect(() => setForm(person), [person]);

  const set = (k: keyof Person) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("people:dialog.edit.title")}</DialogTitle>
          <DialogDescription>{t("people:dialog.edit.description")}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <FormField id="ep-name" label={t("people:field.fullName")}>
            <Input id="ep-name" value={form.full_name} onChange={set("full_name")} />
          </FormField>
          <FormField id="ep-display" label={t("people:field.displayName")}>
            <Input id="ep-display" value={form.display_name} onChange={set("display_name")} />
          </FormField>
          <FormField id="ep-email" label={t("people:field.email")}>
            <Input id="ep-email" type="email" value={form.email} onChange={set("email")} />
          </FormField>
          <FormField id="ep-title" label={t("people:field.jobTitle")}>
            <Input id="ep-title" value={form.job_title} onChange={set("job_title")} />
          </FormField>
          <div className="sm:col-span-2">
            <FormField id="ep-address" label={t("people:field.address")}>
              <Input id="ep-address" value={form.address ?? ""} onChange={set("address")} />
            </FormField>
          </div>
          <FormField id="ep-start" label={t("people:field.employmentStart")}>
            <Input
              id="ep-start"
              type="date"
              value={form.employment_start ?? ""}
              onChange={set("employment_start")}
            />
          </FormField>
          <FormField id="ep-end" label={t("people:field.employmentEnd")}>
            <Input
              id="ep-end"
              type="date"
              value={form.employment_end ?? ""}
              onChange={set("employment_end")}
            />
          </FormField>
          <FormField id="ep-tz" label={t("people:field.timezone")}>
            <Input id="ep-tz" value={form.timezone} onChange={set("timezone")} />
          </FormField>
          <div className="flex items-center justify-between rounded-lg border px-3 py-2">
            <Label htmlFor="ep-active">{t("people:field.activeEmployee")}</Label>
            <Switch
              id="ep-active"
              checked={form.is_active}
              onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common:action.cancel")}
          </Button>
          <Button
            disabled={update.isPending}
            onClick={() =>
              update.mutate(
                {
                  full_name: form.full_name,
                  display_name: form.display_name,
                  email: form.email,
                  job_title: form.job_title,
                  address: form.address,
                  employment_start: form.employment_start || null,
                  employment_end: form.employment_end || null,
                  timezone: form.timezone,
                  is_active: form.is_active,
                },
                {
                  onSuccess: () => {
                    toast.success(t("people:dialog.edit.success"));
                    onOpenChange(false);
                  },
                  onError: () => toast.error(t("people:dialog.edit.error")),
                },
              )
            }
          >
            {update.isPending && <Loader2 className="size-4 animate-spin" />}{" "}
            {t("common:action.saveChanges")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
