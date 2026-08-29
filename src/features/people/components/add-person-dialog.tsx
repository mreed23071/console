import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
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
import { useCreatePerson } from "@/features/people/api/mutations";
import { type AddPersonFormValues, personFormSchema } from "@/features/people/lib/schemas";

const defaultValues: AddPersonFormValues = {
  full_name: "",
  email: "",
  job_title: "",
  address: "",
  timezone: "UTC",
  employment_start: new Date().toISOString().slice(0, 10),
};

export function AddPersonDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { t } = useTranslation(["people", "common"]);
  const create = useCreatePerson();
  const form = useForm<AddPersonFormValues>({
    resolver: zodResolver(personFormSchema(t)),
    defaultValues,
  });

  const onSubmit = form.handleSubmit((values) => {
    create.mutate(values, {
      onSuccess: (p) => {
        toast.success(t("people:dialog.add.success", { name: p.full_name }));
        onOpenChange(false);
        form.reset(defaultValues);
      },
      onError: (e) => toast.error(e instanceof Error ? e.message : t("people:dialog.add.error")),
    });
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) form.reset(defaultValues);
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("people:dialog.add.title")}</DialogTitle>
          <DialogDescription>{t("people:dialog.add.description")}</DialogDescription>
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
                    <Input placeholder={t("people:field.fullNamePlaceholder")} {...field} />
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
                    <Input
                      type="email"
                      placeholder={t("people:field.emailPlaceholder")}
                      {...field}
                    />
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
                    <Input placeholder={t("people:field.jobTitlePlaceholder")} {...field} />
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
            <div className="sm:col-span-2">
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("people:field.address")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("people:field.addressPlaceholder")} {...field} />
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
          </form>
        </Form>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common:action.cancel")}
          </Button>
          <Button disabled={create.isPending} onClick={onSubmit}>
            {create.isPending && <Loader2 className="size-4 animate-spin" />}{" "}
            {t("people:dialog.add.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
