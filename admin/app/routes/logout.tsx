import { redirect } from "react-router";

import type { Route } from "./+types/logout";

import { destroySession, getSession } from "~/service/session.server";

export async function action({ request }: Route.ActionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  throw redirect("/login", {
    headers: { "Set-Cookie": await destroySession(session) },
  });
}

export async function loader() {
  throw redirect("/login");
}
