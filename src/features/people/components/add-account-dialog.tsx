import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { PLATFORMS, usePlatformLabels } from "@/components/common/platform";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateAccount } from "@/features/people/api/accounts";
import { accountFormSchema, type AccountFormValues } from "@/features/people/lib/schemas";

const defaultValues: AccountFormValues = {
  platform: "github",
  external_handle: "",
  external_email: "",
};

/** Manually attaches a brand-new platform identity to a person. */
export function AddAccountDialog({
  userId,
  open,
  onOpenChange,
}: {
  userId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { t } = useTranslation(["people", "common"]);
  const platformLabels = usePlatformLabels();
  const create = useCreateAccount();
  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema(t)),
    defaultValues,
  });

  const onSubmit = form.handleSubmit((values) => {
    create.mutate(
      {
        user_id: userId,
        platform: values.platform,
        external_handle: values.external_handle,
        // `exactOptionalPropertyTypes` treats an explicit `undefined` as
        // different from an omitted key — spread it in only when non-empty,
        // rather than setting the key to `undefined`.
        ...(values.external_email ? { external_email: values.external_email } : {}),
      },
      {
        onSuccess: () => {
          toast.success(t("people:dialog.addAccount.success"));
          form.reset(defaultValues);
          onOpenChange(false);
        },
        onError: () => toast.error(t("people:dialog.addAccount.error")),
      },
    );
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) form.reset(defaultValues);
        onOpenChange(v);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("people:dialog.addAccount.title")}</DialogTitle>
          <DialogDescription>{t("people:dialog.addAccount.description")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="grid gap-3">
            <FormField
              control={form.control}
              name="platform"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("people:field.platform")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PLATFORMS.map((p) => (
                        <SelectItem key={p} value={p}>
                          {platformLabels[p]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="external_handle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("people:dialog.addAccount.handleLabel")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("people:dialog.addAccount.handlePlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="external_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("people:dialog.addAccount.emailLabel")}</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
            {t("people:dialog.addAccount.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
