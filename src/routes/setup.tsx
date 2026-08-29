import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Loader2, Waves } from "lucide-react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  type AddPersonFormValues,
  peopleQueryOptions,
  personFormSchema,
  useCreatePerson,
} from "@/features/people";
import { i18n } from "@/lib/i18n";

const defaultValues: AddPersonFormValues = {
  full_name: "",
  email: "",
  job_title: "",
  address: "",
  timezone: "UTC",
  employment_start: new Date().toISOString().slice(0, 10),
};

export const Route = createFileRoute("/setup")({
  ssr: false,
  // Once somebody exists, this screen has nothing left to do - send visitors
  // straight to the app rather than letting them re-run onboarding.
  // `fetchQuery`, not `ensureQueryData` - see the comment in `_authenticated.tsx`.
  beforeLoad: async ({ context }) => {
    const people = await context.queryClient.fetchQuery(peopleQueryOptions());
    if (people.length > 0) {
      throw redirect({ to: "/" });
    }
  },
  head: () => ({
    meta: [
      { title: i18n.t("people:setup.metaTitle") },
      { name: "description", content: i18n.t("people:setup.metaDescription") },
    ],
  }),
  component: SetupPage,
});

function SetupPage() {
  const { t } = useTranslation(["people", "common", "nav"]);
  const navigate = useNavigate();
  const create = useCreatePerson();
  const form = useForm<AddPersonFormValues>({
    resolver: zodResolver(personFormSchema(t)),
    defaultValues,
  });

  const onSubmit = form.handleSubmit((values) => {
    create.mutate(values, {
      onSuccess: (p) => {
        toast.success(t("people:setup.success", { name: p.full_name }));
        void navigate({ to: "/", replace: true });
      },
      onError: (e) => toast.error(e instanceof Error ? e.message : t("people:setup.error")),
    });
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center gap-2 text-primary">
            <Waves className="size-5" />
            <span className="text-sm font-semibold">{t("nav:brand.name")}</span>
          </div>
          <CardTitle className="text-xl">{t("people:setup.title")}</CardTitle>
          <CardDescription>{t("people:setup.description")}</CardDescription>
        </CardHeader>
        <CardContent>
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
                <Button type="submit" className="w-full" disabled={create.isPending}>
                  {create.isPending && <Loader2 className="size-4 animate-spin" />}{" "}
                  {t("people:setup.submit")}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
