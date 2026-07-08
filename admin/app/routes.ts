import type { RouteConfig } from "@react-router/dev/routes";
import { index, layout, route } from "@react-router/dev/routes";

export default [
  route("login", "routes/login.tsx"),
  route("logout", "routes/logout.tsx"),
  route("set-locale", "routes/set-locale.tsx"),
  layout("components/layout/AdminLayout.tsx", [
    index("routes/dashboard.tsx"),
    route("users", "routes/users.tsx"),
    route("tabs", "routes/tabs.tsx"),
    route("jam-rooms", "routes/jam-rooms.tsx"),
    route("subscriptions", "routes/subscriptions.tsx"),
    route("recordings", "routes/recordings.tsx"),
    route("payments", "routes/payments.tsx"),
    route("settlements", "routes/settlements.tsx"),
    route("ai-jobs", "routes/ai-jobs.tsx"),
    route("badges", "routes/badges.tsx"),
    route("knob", "routes/knob.tsx"),
    route("purchases", "routes/purchases.tsx"),
  ]),
] satisfies RouteConfig;
