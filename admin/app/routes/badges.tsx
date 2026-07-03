import { redirect } from "react-router";

import type { Route } from "./+types/badges";

import { Topbar } from "~/components/layout/Topbar";
import { Badge as BadgeUI } from "~/components/ui/Badge";
import { requireAdmin } from "~/service/session.server";
import { getSupabase } from "~/service/supabase.server";
import type { BadgeRow } from "~/types/db";

export function meta() {
  return [{ title: "뱃지 관리 - Tone Knob Admin" }];
}

export async function action({ request }: Route.ActionArgs) {
  await requireAdmin(request);
  const formData = await request.formData();
  const _action = formData.get("_action") as string;
  const supabase = getSupabase();

  if (_action === "award") {
    const email = (formData.get("email") as string).trim();
    const badgeId = formData.get("badgeId") as string;

    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (!user) return { error: "해당 이메일의 유저를 찾을 수 없습니다." };

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

const categoryLabel: Record<string, string> = {
  achievement: "업적",
  contribution: "기여",
  social: "소셜",
  special: "스페셜",
};

export default function BadgesPage({ loaderData }: Route.ComponentProps) {
  const { admin, badges } = loaderData;

  const grouped = badges.reduce<Record<string, BadgeRow[]>>((acc, b) => {
    if (!acc[b.category]) acc[b.category] = [];
    acc[b.category].push(b);
    return acc;
  }, {});

  return (
    <>
      <Topbar adminName={admin.adminName} adminEmail={admin.adminEmail} title="뱃지 관리" />
      <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
        <div className="mx-auto max-w-7xl space-y-6">

          {/* Actions */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

            {/* Award badge */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold text-slate-900">뱃지 수동 수여</h2>
              <form method="post" className="space-y-3">
                <input type="hidden" name="_action" value="award" />
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">유저 이메일</label>
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="user@example.com"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">뱃지 선택</label>
                  <select
                    name="badgeId"
                    required
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">-- 뱃지 선택 --</option>
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
                  수여
                </button>
              </form>
            </div>

            {/* Create badge */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold text-slate-900">새 뱃지 생성</h2>
              <form method="post" className="space-y-3">
                <input type="hidden" name="_action" value="create" />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">코드 (영문, 고유값)</label>
                    <input
                      name="code"
                      required
                      placeholder="first_tab"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">이름</label>
                    <input
                      name="name"
                      required
                      placeholder="첫 타브"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">설명</label>
                  <input
                    name="description"
                    placeholder="첫 번째 타브를 제작했습니다"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">아이콘 (이모지)</label>
                    <input
                      name="icon"
                      placeholder="🎸"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">카테고리</label>
                    <select
                      name="category"
                      required
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="achievement">업적</option>
                      <option value="contribution">기여</option>
                      <option value="social">소셜</option>
                      <option value="special">스페셜</option>
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  생성
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
                    {categoryLabel[cat] ?? cat}
                    <span className="ml-2 text-xs font-normal text-slate-400">({items.length})</span>
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
                      <BadgeUI variant="default">{categoryLabel[b.category] ?? b.category}</BadgeUI>
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
