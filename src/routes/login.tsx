import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, Waves } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { type Persona, PersonaButtons, useAuthStore } from "@/features/auth";
import { useAppPreferences } from "@/hooks/use-app-preferences";
import { i18n } from "@/lib/i18n";

const FAKE_LATENCY_MS = 800;

export const Route = createFileRoute("/login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: i18n.t("auth:signIn.metaTitle") },
      { name: "description", content: i18n.t("auth:signIn.metaDescription") },
      { property: "og:title", content: i18n.t("auth:signIn.metaTitle") },
      { property: "og:description", content: i18n.t("auth:signIn.ogDescription") },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  useAppPreferences();

  const { t } = useTranslation(["auth", "nav"]);
  const navigate = useNavigate();
  const session = useAuthStore((s) => s.session);
  const signIn = useAuthStore((s) => s.signIn);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState<Persona | null>(null);

  useEffect(() => {
    if (session) navigate({ to: "/", replace: true });
  }, [session, navigate]);

  async function submit(persona: Persona) {
    setPending(persona);
    await new Promise((r) => setTimeout(r, FAKE_LATENCY_MS));
    signIn(email, persona);
    setPending(null);
    navigate({ to: "/", replace: true });
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="hidden flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
        <div className="flex items-center gap-2">
          <Waves className="size-6" />
          <span className="text-lg font-semibold">{t("nav:brand.name")}</span>
        </div>
        <div className="max-w-md space-y-4">
          <h2 className="text-3xl leading-tight font-semibold">{t("auth:brand.tagline")}</h2>
          <p className="text-sm opacity-90">{t("auth:brand.blurb")}</p>
        </div>
        <p className="text-xs opacity-75">{t("auth:brand.footnote")}</p>
      </aside>

      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-xl">{t("auth:signIn.title")}</CardTitle>
            <CardDescription>{t("auth:signIn.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                void submit("admin");
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="email">{t("auth:signIn.emailLabel")}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t("auth:signIn.emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t("auth:signIn.passwordLabel")}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t("auth:signIn.passwordPlaceholder")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={pending !== null}>
                {pending === "admin" ? <Loader2 className="size-4 animate-spin" /> : null}
                {t("auth:signIn.submit")}
              </Button>
            </form>

            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">{t("auth:signIn.divider")}</span>
              <Separator className="flex-1" />
            </div>

            <PersonaButtons pending={pending} onSelect={(p) => void submit(p)} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
