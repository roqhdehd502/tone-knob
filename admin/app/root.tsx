import { Links, Meta, Outlet, Scripts, ScrollRestoration, useRouteLoaderData } from "react-router";

import { I18nProvider } from "~/context/i18n";
import { createT, getLocale } from "~/i18n";

import type { Route } from "./+types/root";

import "./app.css";

export async function loader({ request }: Route.LoaderArgs) {
  const locale = getLocale(request.headers.get("Cookie") ?? "");
  return { locale };
}

export function Layout({ children }: { children: React.ReactNode }) {
  const data = useRouteLoaderData<typeof loader>("root");
  const locale = data?.locale ?? "ko";

  return (
    <html lang={locale}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App({ loaderData }: Route.ComponentProps) {
  return (
    <I18nProvider locale={loaderData.locale}>
      <Outlet />
    </I18nProvider>
  );
}

export function ErrorBoundary({ error }: { error: unknown }) {
  const data = useRouteLoaderData<typeof loader>("root");
  const t = createT(data?.locale ?? "ko");
  const message = error instanceof Error ? error.message : t("error.unknown");

  return (
    <html lang={data?.locale ?? "ko"}>
      <head>
        <meta charSet="utf-8" />
        <title>{t("error.title")} - Tone Knob Admin</title>
      </head>
      <body className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-red-600">{t("error.title")}</h1>
          <p className="mt-2 text-sm text-slate-600">{message}</p>
        </div>
      </body>
    </html>
  );
}
