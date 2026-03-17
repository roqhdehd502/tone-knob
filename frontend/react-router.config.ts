import type { Config } from "@react-router/dev/config";

export default {
  // Config options...
  // SPA mode: static output to build/client → Vercel 정적 배포
  ssr: false,
} satisfies Config;
