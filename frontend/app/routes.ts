import { index, layout, route, type RouteConfig } from "@react-router/dev/routes";

export default [
  // 인증 페이지 (레이아웃 없음)
  route("login", "routes/login.tsx"),
  route("register", "routes/register.tsx"),
  route("auth/callback", "routes/auth-callback.tsx"),
  route("terms", "routes/terms.tsx"),
  route("privacy", "routes/privacy.tsx"),

  // 메인 레이아웃 적용 페이지
  layout("components/common/MainLayout.tsx", [
    index("routes/home.tsx"),
    route("tabs", "routes/tabs.tsx"),
    route("tabs/my", "routes/tabs-my.tsx"),
    route("tabs/:id", "routes/tabs-detail.tsx"),
    route("editor", "routes/editor.tsx"),
    route("editor/new", "routes/editor-new.tsx"),
    route("editor/:id", "routes/editor-edit.tsx"),
    route("jamroom", "routes/jamroom.tsx"),
    route("jamroom/create", "routes/jamroom-create.tsx"),
    route("jamroom/:id", "routes/jamroom-detail.tsx"),
    route("community", "routes/community.tsx"),
    route("marketplace", "routes/marketplace.tsx"),
    route("subscription", "routes/subscription.tsx"),
    route("dashboard", "routes/dashboard.tsx"),
    route("recordings", "routes/recordings.tsx"),
    route("ai-generate", "routes/ai-generate.tsx"),
    route("audio-extract", "routes/audio-extract.tsx"),
    route("profile", "routes/profile.tsx"),
    route("settings", "routes/settings.tsx"),
  ]),
] satisfies RouteConfig;
