// main.ts에서 가장 먼저 import 되어야 한다 (Sentry가 다른 모듈을 계측하기 전에 초기화되어야 함).
import "dotenv/config";

import * as Sentry from "@sentry/nestjs";

// SENTRY_DSN 미설정 시 Sentry SDK는 자동으로 비활성화된다 (전송하지 않음, 에러 발생 없음).
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV ?? "development",
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
});
