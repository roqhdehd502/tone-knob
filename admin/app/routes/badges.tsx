import { redirect } from "react-router";

import { Topbar } from "~/components/layout/Topbar";
import { Badge as BadgeUI } from "~/components/ui/Badge";
import { useI18n } from "~/context/i18n";
import { requireAdmin } from "~/service/session.server";
import { getSupabase } from "~/service/supabase.server";
import type { BadgeRow } from "~/types/db";

import type { Route } from "./+types/badges";

/** 브라우저 탭 제목 메타 */
export function meta() {
  return [{ title: "Badges - Tone Knob Admin" }];
}

/**
 * 배지 관리 액션.
 * - `award`: 이메일로 사용자를 조회한 뒤 특정 배지를 수여
 * - `revoke`: 사용자에게서 배지를 회수
 * - `create`: 새 배지를 생성
 */
export async function action({ request }: Route.ActionArgs) {
  await requireAdmin(request);
  const formData = await request.formData();
  const _action = formData.get("_action") as string;
  const supabase = getSupabase();

  if (_action === "award") {
    const email = (formData.get("email") as string).trim();
    const badgeId = formData.get("badgeId") as string;

    const { data: user } = await supabase.from("users").select("id").eq("email", email).single();

    if (!user) return { error: "badges.errorUserNotFound" };

    await supabase
      .from("user_badges")
      .upsert({ userId: user.id, badgeId }, { onConflict: "userId,badgeId" });
  } else if (_action === "create") {
    const code = (formData.get("code") as string).trim();
    const name = (formData.get("name") as string).trim();
    const description = (formData.get("description") as string).trim() || null;
    const icon = (formData.get("icon") as string).trim() || null;
    const category = formData.get("category") as string;

    await supabase.from("badges").insert({ code, name, description, icon, category });
  }

  return redirect("/badges");
}

/** 배지 목록 및 수여 현황 로더. 전체 배지 목록과 최근 수여 이력을 반환한다. */
export async function loader({ request }: Route.LoaderArgs) {
  const admin = await requireAdmin(request);
  const supabase = getSupabase();

  const { data } = await supabase
    .from("badges")
    .select("id, code, name, description, icon, category, sortOrder, createdAt")
    .order("category", { ascending: true })
    .order("sortOrder", { ascending: true });

  const badges = (data ?? []) as unknown as BadgeRow[];

  return { admin, badges };
}

/** 배지 관리 페이지. 배지 목록, 수여 폼, 생성 폼을 제공한다. */
export default function BadgesPage({ loaderData, actionData }: Route.ComponentProps) {
  const { admin, badges } = loaderData;
  const { t } = useI18n();

  const categoryLabel = (cat: string) => {
    if (cat === "achievement") return t("badges.catAchievement");
    if (cat === "contribution") return t("badges.catContribution");
    if (cat === "social") return t("badges.catSocial");
    if (cat === "special") return t("badges.catSpecial");
    return cat;
  };

  const grouped = badges.reduce<Record<string, BadgeRow[]>>((acc, b) => {
    if (!acc[b.category]) acc[b.category] = [];
    acc[b.category].push(b);
    return acc;
  }, {});

  const errorKey = (actionData as { error?: string } | undefined)?.error;

  return (
    <>
      <Topbar
        adminName={admin.adminName}
        adminEmail={admin.adminEmail}
        title={t("badges.pageTitle")}
      />
      <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Actions */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Award badge */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold text-slate-900">
                {t("badges.awardTitle")}
              </h2>
              <form method="post" className="space-y-3">
                <input type="hidden" name="_action" value="award" />
                {errorKey && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                    {t(errorKey as any)}
                  </p>
                )}
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    {t("badges.userEmail")}
                  </label>
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="user@example.com"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    {t("badges.selectBadge")}
                  </label>
                  <select
                    name="badgeId"
                    required
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">{t("badges.selectBadgePlaceholder")}</option>
                    {badges.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.icon} {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  {t("badges.award")}
                </button>
              </form>
            </div>

            {/* Create badge */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold text-slate-900">
                {t("badges.createTitle")}
              </h2>
              <form method="post" className="space-y-3">
                <input type="hidden" name="_action" value="create" />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      {t("badges.code")}
                    </label>
                    <input
                      name="code"
                      required
                      placeholder="first_tab"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      {t("common.name")}
                    </label>
                    <input
                      name="name"
                      required
                      placeholder="First Tab"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    {t("common.description")}
                  </label>
                  <input
                    name="description"
                    placeholder="Created the first tab"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      {t("badges.icon")}
                    </label>
                    <input
                      name="icon"
                      placeholder="🎸"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      {t("common.category")}
                    </label>
                    <select
                      name="category"
                      required
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="achievement">{t("badges.catAchievement")}</option>
                      <option value="contribution">{t("badges.catContribution")}</option>
                      <option value="social">{t("badges.catSocial")}</option>
                      <option value="special">{t("badges.catSpecial")}</option>
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  {t("common.create")}
                </button>
              </form>
            </div>
          </div>

          {/* Badge list by category */}
          <div className="space-y-4">
            {Object.entries(grouped).map(([cat, items]) => (
              <div key={cat} className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-5">
                  <h2 className="text-sm font-semibold text-slate-900">
                    {categoryLabel(cat)}
                    <span className="ml-2 text-xs font-normal text-slate-400">
                      ({items.length})
                    </span>
                  </h2>
                </div>
                <div className="divide-y divide-slate-50">
                  {items.map((b) => (
                    <div key={b.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                      <span className="text-xl">{b.icon ?? "🏆"}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900">{b.name}</p>
                        <p className="text-xs text-slate-400">{b.code}</p>
                        {b.description && (
                          <p className="mt-0.5 text-xs text-slate-400">{b.description}</p>
                        )}
                      </div>
                      <BadgeUI variant="default">{categoryLabel(b.category)}</BadgeUI>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
