import { data, redirect } from "react-router";

import { useI18n } from "~/context/i18n";
import { createT, getLocale } from "~/i18n";
import { verifyAdminCredentials } from "~/service/auth.server";
import { commitSession, getSession } from "~/service/session.server";

import type { Route } from "./+types/login";

export function meta() {
  return [{ title: "Admin Login - Tone Knob Admin" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  if (session.get("adminId")) throw redirect("/");
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  const t = createT(getLocale(request.headers.get("Cookie") ?? ""));
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");

  if (!email || !password) {
    return data({ error: t("login.error.required") }, { status: 400 });
  }

  const admin = await verifyAdminCredentials(email, password);
  if (!admin) {
    return data({ error: t("login.error.invalid") }, { status: 401 });
  }

  const session = await getSession(request.headers.get("Cookie"));
  session.set("adminId", admin.id);
  session.set("adminEmail", admin.email);
  session.set("adminName", admin.name);

  throw redirect("/", {
    headers: { "Set-Cookie": await commitSession(session) },
  });
}

export default function LoginPage({ actionData }: Route.ComponentProps) {
  const { t, locale } = useI18n();

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600">
            <svg
              className="h-6 w-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Tone Knob Admin</h1>
          <p className="mt-1 text-sm text-slate-400">{t("login.subtitle")}</p>

          {/* Language switcher */}
          <div className="mt-3 flex justify-center gap-1">
            {(["ko", "en"] as const).map((lng) => (
              <form key={lng} method="post" action="/set-locale">
                <input type="hidden" name="locale" value={lng} />
                <button
                  type="submit"
                  className={`rounded px-2.5 py-1 text-xs font-semibold transition-colors ${
                    locale === lng ? "text-blue-400" : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {lng === "ko" ? "한국어" : "English"}
                </button>
              </form>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
          <form method="post" className="space-y-4">
            {actionData?.error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {actionData.error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-300">
                {t("login.email")}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                placeholder="admin@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-300">
                {t("login.password")}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="mt-2 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              {t("login.submit")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
