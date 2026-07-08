import { useEffect } from "react";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import { ErrorFallback } from "~/components/common/ErrorFallback";
import { I18nProvider } from "~/context/i18n";
import { getLocale } from "~/i18n";
import { AuthProvider } from "~/lib/auth";
import { captureException, initSentry } from "~/lib/sentry";
import { ThemeProvider } from "~/lib/theme";
import { TutorialProvider } from "~/lib/tutorial";

import type { Route } from "./+types/root";

import "./app.css";

initSentry();

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap",
  },
  { rel: "manifest", href: "/manifest.webmanifest" },
  { rel: "icon", href: "/images/logo-32.png", sizes: "32x32" },
  { rel: "apple-touch-icon", href: "/images/logo-192.png" },
];

// Inline script to apply theme before first paint to prevent flash
const themeScript = `(function(){try{var t=localStorage.getItem("tone-knob-theme")||"system";var d=t==="system"?window.matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light":t;document.documentElement.classList.toggle("dark",d==="dark");document.documentElement.style.colorScheme=d}catch(e){}})()`;

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0891b2" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
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

export default function App() {
  const locale = getLocale(document.cookie);

  // 개발 모드에서는 Vite HMR과 충돌할 수 있어 프로덕션 빌드에서만 등록한다.
  useEffect(() => {
    if (import.meta.env.PROD && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  return (
    <I18nProvider locale={locale}>
      <ThemeProvider>
        <AuthProvider>
          <TutorialProvider>
            <Outlet />
          </TutorialProvider>
        </AuthProvider>
      </ThemeProvider>
    </I18nProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let title = "문제가 발생했습니다";
  let description = "예상치 못한 오류가 발생했습니다. 다시 시도해주세요.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    title = error.status === 404 ? "페이지를 찾을 수 없습니다" : `오류 ${error.status}`;
    description =
      error.status === 404
        ? "요청하신 페이지가 존재하지 않거나 이동되었습니다."
        : error.statusText || description;
  } else {
    if (error instanceof Error) {
      captureException(error);
      if (import.meta.env.DEV) {
        description = error.message;
        stack = error.stack;
      }
    }
  }

  return <ErrorFallback title={title} description={description} stack={stack} />;
}
