import { redirect } from "react-router";

import type { Route } from "./+types/set-locale";

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  const locale = form.get("locale") as string;
  const redirectTo = request.headers.get("Referer") ?? "/";

  const valid = locale === "ko" || locale === "en" ? locale : "ko";

  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": `locale=${valid}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax; HttpOnly`,
    },
  });
}

export default function SetLocale() {
  return null;
}
