import * as Sentry from "@sentry/react";

let initialized = false;

/** VITE_SENTRY_DSN 미설정 시 아무 동작도 하지 않는다 (개발/데모 환경 기본값). */
export function initSentry() {
  if (initialized || typeof window === "undefined") return;
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
  });
  initialized = true;
}

export function captureException(error: unknown) {
  if (!initialized) return;
  Sentry.captureException(error);
}
