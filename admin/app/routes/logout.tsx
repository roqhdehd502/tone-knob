import { redirect } from "react-router";

import { destroySession, getSession } from "~/service/session.server";

import type { Route } from "./+types/logout";

/**
 * 로그아웃 액션. 세션 쿠키를 파기하고 `/login`으로 리다이렉트한다.
 * 사이드바의 로그아웃 버튼이 `POST /logout`으로 이 액션을 호출한다.
 */
export async function action({ request }: Route.ActionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  throw redirect("/login", {
    headers: { "Set-Cookie": await destroySession(session) },
  });
}

/** GET 요청으로 직접 접근 시 로그인 페이지로 리다이렉트 */
export async function loader() {
  throw redirect("/login");
}
