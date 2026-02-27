import {
  type RouteConfig,
  index,
  route,
  layout,
} from "@react-router/dev/routes";

export default [
  // 인증 페이지 (레이아웃 없음)
  route("login", "routes/login.tsx"),
  route("register", "routes/register.tsx"),

  // 메인 레이아웃 적용 페이지
  layout("components/common/MainLayout.tsx", [
    index("routes/home.tsx"),
    route("editor", "routes/editor.tsx"),
    route("editor/new", "routes/editor-new.tsx"),
    route("jamroom", "routes/jamroom.tsx"),
    route("community", "routes/community.tsx"),
    route("profile", "routes/profile.tsx"),
    route("settings", "routes/settings.tsx"),
  ]),
] satisfies RouteConfig;
