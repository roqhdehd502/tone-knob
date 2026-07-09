import { createCookieSessionStorage, redirect } from "react-router";

/**
 * 어드민 세션 쿠키 스토리지.
 * HttpOnly + SameSite=Lax 설정으로 CSRF·XSS 위험을 최소화한다.
 * 최대 유효 기간은 8시간이다.
 */
const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "_tk_admin",
    sameSite: "lax",
    path: "/",
    httpOnly: true,
    secrets: [process.env.SESSION_SECRET ?? "fallback-secret-change-me"],
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 8, // 8 hours
  },
});

/** 세션 읽기·커밋·파기 헬퍼 (React Router `createCookieSessionStorage` 반환값) */
export const { getSession, commitSession, destroySession } = sessionStorage;

/**
 * 요청 쿠키에서 어드민 세션을 검증하고, 인증된 어드민 정보를 반환한다.
 * 세션이 없거나 `adminId`가 없으면 `/login`으로 리다이렉트한다.
 *
 * @param request - 현재 HTTP 요청
 * @returns `{ adminId, adminEmail, adminName }`
 * @throws `adminId` 미존재 시 `/login` 리다이렉트
 */
export async function requireAdmin(request: Request) {
  const session = await getSession(request.headers.get("Cookie"));
  const adminId = session.get("adminId") as string | undefined;
  if (!adminId) throw redirect("/login");
  return {
    adminId,
    adminEmail: session.get("adminEmail") as string,
    adminName: session.get("adminName") as string,
  };
}
