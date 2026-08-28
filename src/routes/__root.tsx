import { type QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  HeadContent,
  Link,
  Outlet,
  useRouter,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { I18nextProvider, useTranslation } from "react-i18next";

import { Toaster } from "@/components/ui/sonner";
import { i18n } from "@/lib/i18n";
import { reportLovableError } from "@/lib/lovable-error-reporting";

function NotFoundComponent() {
  const { t } = useTranslation("common");
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">{t("error.notFoundTitle")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("error.notFoundDescription")}</p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t("action.goHome")}
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const { t } = useTranslation("common");
  const router = useRouter();

  useEffect(() => {
    console.error(error);
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {t("error.pageTitle")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("error.pageDescription")}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t("action.tryAgain")}
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            {t("action.goHome")}
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  // Static charset/viewport/favicon/font links live in index.html — this only
  // manages the SEO metadata that could vary per route.
  head: () => ({
    meta: [
      { title: i18n.t("nav:brand.console") },
      {
        name: "description",
        content:
          "Threadline Console resolves scattered platform identities into one record and summarises recent activity.",
      },
      { name: "author", content: "Threadline" },
      { property: "og:title", content: i18n.t("nav:brand.console") },
      {
        property: "og:description",
        content: "Identity resolution, message ingestion and pipeline monitoring console.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        {/* React 19 hoists title/meta rendered anywhere in the tree into <head>. */}
        <HeadContent />
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
        <Toaster position="top-right" richColors />
      </QueryClientProvider>
    </I18nextProvider>
  );
}
