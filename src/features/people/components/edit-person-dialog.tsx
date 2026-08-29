import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useUpdatePerson } from "@/features/people/api/mutations";
import { editPersonFormSchema, type EditPersonFormValues } from "@/features/people/lib/schemas";
import type { Person } from "@/lib/api/types";

function formValuesFor(person: Person): EditPersonFormValues {
  return {
    full_name: person.full_name,
    display_name: person.display_name,
    email: person.email,
    job_title: person.job_title,
    address: person.address ?? "",
    employment_start: person.employment_start ?? "",
    employment_end: person.employment_end ?? "",
    timezone: person.timezone,
    is_active: person.is_active,
  };
}

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
  const form = useForm<EditPersonFormValues>({
    resolver: zodResolver(editPersonFormSchema(t)),
    defaultValues: formValuesFor(person),
  });

  // The dialog is opened from one place per person but stays mounted across
  // opens, so the form has to be re-seeded whenever the underlying person
  // record changes (a fresh fetch, or opening it for a different person).
  useEffect(() => form.reset(formValuesFor(person)), [person, form]);

  const onSubmit = form.handleSubmit((values) => {
    update.mutate(
      {
        full_name: values.full_name,
        display_name: values.display_name,
        email: values.email,
        job_title: values.job_title,
        address: values.address,
        employment_start: values.employment_start || null,
        employment_end: values.employment_end || null,
        timezone: values.timezone,
        is_active: values.is_active,
      },
      {
        onSuccess: () => {
          toast.success(t("people:dialog.edit.success"));
          onOpenChange(false);
        },
        onError: () => toast.error(t("people:dialog.edit.error")),
      },
    );
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("people:dialog.edit.title")}</DialogTitle>
          <DialogDescription>{t("people:dialog.edit.description")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("people:field.fullName")}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="display_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("people:field.displayName")}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("people:field.email")}</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="job_title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("people:field.jobTitle")}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="sm:col-span-2">
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("people:field.address")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="employment_start"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("people:field.employmentStart")}</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="employment_end"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("people:field.employmentEnd")}</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="timezone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("people:field.timezone")}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border px-3 py-2">
                  <FormLabel>{t("people:field.activeEmployee")}</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </form>
        </Form>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common:action.cancel")}
          </Button>
          <Button disabled={update.isPending} onClick={onSubmit}>
            {update.isPending && <Loader2 className="size-4 animate-spin" />}{" "}
            {t("common:action.saveChanges")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
