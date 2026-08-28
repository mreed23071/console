import { Loader2 } from "lucide-react";
import { useState } from "react";
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
import { useCreatePerson } from "@/features/people/api/mutations";
import { FormField } from "@/features/people/components/form-field";

const emptyForm = () => ({
  full_name: "",
  email: "",
  job_title: "",
  address: "",
  timezone: "UTC",
  employment_start: new Date().toISOString().slice(0, 10),
});

export function AddPersonDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { t } = useTranslation(["people", "common"]);
  const create = useCreatePerson();
  const [form, setForm] = useState(emptyForm);

  const set = (k: keyof ReturnType<typeof emptyForm>) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("people:dialog.add.title")}</DialogTitle>
          <DialogDescription>{t("people:dialog.add.description")}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <FormField id="np-name" label={t("people:field.fullName")}>
            <Input
              id="np-name"
              value={form.full_name}
              onChange={set("full_name")}
              placeholder={t("people:field.fullNamePlaceholder")}
            />
          </FormField>
          <FormField id="np-email" label={t("people:field.email")}>
            <Input
              id="np-email"
              type="email"
              value={form.email}
              onChange={set("email")}
              placeholder={t("people:field.emailPlaceholder")}
            />
          </FormField>
          <FormField id="np-title" label={t("people:field.jobTitle")}>
            <Input
              id="np-title"
              value={form.job_title}
              onChange={set("job_title")}
              placeholder={t("people:field.jobTitlePlaceholder")}
            />
          </FormField>
          <FormField id="np-tz" label={t("people:field.timezone")}>
            <Input id="np-tz" value={form.timezone} onChange={set("timezone")} />
          </FormField>
          <div className="sm:col-span-2">
            <FormField id="np-address" label={t("people:field.address")}>
              <Input
                id="np-address"
                value={form.address}
                onChange={set("address")}
                placeholder={t("people:field.addressPlaceholder")}
              />
            </FormField>
          </div>
          <FormField id="np-start" label={t("people:field.employmentStart")}>
            <Input
              id="np-start"
              type="date"
              value={form.employment_start}
              onChange={set("employment_start")}
            />
          </FormField>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common:action.cancel")}
          </Button>
          <Button
            disabled={create.isPending || !form.full_name.trim() || !form.email.trim()}
            onClick={() =>
              create.mutate(form, {
                onSuccess: (p) => {
                  toast.success(t("people:dialog.add.success", { name: p.full_name }));
                  onOpenChange(false);
                  setForm(emptyForm());
                },
                onError: (e) =>
                  toast.error(e instanceof Error ? e.message : t("people:dialog.add.error")),
              })
            }
          >
            {create.isPending && <Loader2 className="size-4 animate-spin" />}{" "}
            {t("people:dialog.add.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
