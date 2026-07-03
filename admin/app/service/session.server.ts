import { createCookieSessionStorage, redirect } from "react-router";

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

export const { getSession, commitSession, destroySession } = sessionStorage;

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
