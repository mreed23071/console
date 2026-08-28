import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { PersonaPicker, useAuthStore } from "@/features/auth";
import { i18n } from "@/lib/i18n";
import { type Language, LANGUAGE_LABELS, SUPPORTED_LANGUAGES } from "@/lib/i18n/config";
import { useUIStore } from "@/stores/ui";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: i18n.t("settings:meta.title") },
      { name: "description", content: i18n.t("settings:meta.description") },
      { property: "og:title", content: i18n.t("settings:meta.title") },
      { property: "og:description", content: i18n.t("settings:meta.ogDescription") },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { t } = useTranslation("settings");
  const session = useAuthStore((s) => s.session);
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const language = useUIStore((s) => s.language);
  const setLanguage = useUIStore((s) => s.setLanguage);

  const buildRows: Array<[string, string]> = [
    [t("build.app"), t("build.appValue")],
    [t("build.build"), t("build.buildValue")],
    [t("build.dataSource"), t("build.dataSourceValue")],
    [t("build.apiBase"), t("build.apiBaseValue")],
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("description")} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("profile.title")}</CardTitle>
          <CardDescription>{t("profile.description")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">{t("profile.displayName")}</Label>
            <Input id="name" defaultValue={session?.name ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mail">{t("profile.email")}</Label>
            <Input
              id="mail"
              value={session?.email ?? ""}
              readOnly
              disabled
              className="bg-muted text-muted-foreground"
            />
            <p className="text-xs text-muted-foreground">{t("profile.emailHint")}</p>
          </div>
          <div className="sm:col-span-2">
            <Button onClick={() => toast.success(t("profile.saved"))}>{t("profile.save")}</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("role.title")}</CardTitle>
          <CardDescription>{t("role.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <PersonaPicker />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("language.title")}</CardTitle>
          <CardDescription>{t("language.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 sm:max-w-xs">
            <Label htmlFor="language">{t("language.label")}</Label>
            <Select
              value={language}
              onValueChange={(v) => {
                const next = v as Language;
                setLanguage(next);
                toast.success(t("language.changed", { language: LANGUAGE_LABELS[next] }));
              }}
            >
              <SelectTrigger id="language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_LANGUAGES.map((l) => (
                  <SelectItem key={l} value={l}>
                    {LANGUAGE_LABELS[l]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("appearance.title")}</CardTitle>
          <CardDescription>{t("appearance.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">{t("appearance.darkMode")}</p>
              <p className="text-xs text-muted-foreground">{t("appearance.current", { theme })}</p>
            </div>
            <Switch
              checked={theme === "dark"}
              onCheckedChange={(v) => setTheme(v ? "dark" : "light")}
              aria-label={t("appearance.toggleLabel")}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("build.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 text-sm sm:grid-cols-4">
            {buildRows.map(([k, v]) => (
              <div key={k} className="rounded-lg border p-3">
                <dt className="text-xs text-muted-foreground">{k}</dt>
                <dd className="font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
