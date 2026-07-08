import { redirect } from "react-router";

import { Topbar } from "~/components/layout/Topbar";
import { Badge } from "~/components/ui/Badge";
import { useI18n } from "~/context/i18n";
import { requireAdmin } from "~/service/session.server";
import { getSupabase } from "~/service/supabase.server";
import type { TabRow } from "~/types/db";

import type { Route } from "./+types/tabs";

const PAGE_SIZE = 20;

export function meta() {
  return [{ title: "Tabs - Tone Knob Admin" }];
}

export async function action({ request }: Route.ActionArgs) {
  await requireAdmin(request);
  const formData = await request.formData();
  const _action = formData.get("_action") as string;
  const id = formData.get("id") as string;
  const supabase = getSupabase();

  if (_action === "forceHide") {
    await supabase.from("tabs").update({ isPublic: false }).eq("id", id);
  } else if (_action === "delete") {
    await supabase.from("tabs").delete().eq("id", id);
  }

  return redirect(request.url);
}

export async function loader({ request }: Route.LoaderArgs) {
  const admin = await requireAdmin(request);
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
  const search = url.searchParams.get("q") ?? "";
  const visibility = url.searchParams.get("visibility") ?? "all";

  const supabase = getSupabase();
  const from = (page - 1) * PAGE_SIZE;

  let query = supabase
    .from("tabs")
    .select(
      "id, title, artist, isPublic, viewCount, likeCount, downloadCount, price, createdAt, userId",
      { count: "exact" },
    )
    .order("createdAt", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  if (search) query = query.ilike("title", `%${search}%`);
  if (visibility === "public") query = query.eq("isPublic", true);
  if (visibility === "private") query = query.eq("isPublic", false);

  const { data, count } = await query;
  const tabs = (data ?? []) as unknown as TabRow[];

  return {
    admin,
    tabs,
    total: count ?? 0,
    page,
    search,
    visibility,
    totalPages: Math.ceil((count ?? 0) / PAGE_SIZE),
  };
}

export default function TabsPage({ loaderData }: Route.ComponentProps) {
  const { admin, tabs, total, page, search, visibility, totalPages } = loaderData;
  const { t, dateLocale } = useI18n();

  const buildHref = (overrides: Record<string, string | number>) => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (visibility !== "all") params.set("visibility", visibility);
    params.set("page", String(page));
    Object.entries(overrides).forEach(([k, v]) => params.set(k, String(v)));
    return `/tabs?${params.toString()}`;
  };

  return (
    <>
      <Topbar
        adminName={admin.adminName}
        adminEmail={admin.adminEmail}
        title={t("tabs.pageTitle")}
      />
      <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
        <div className="mx-auto max-w-7xl space-y-4">
          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <p className="text-sm text-slate-500">
                {t("tabs.total", { n: total.toLocaleString() })}
              </p>
              <div className="flex rounded-lg border border-slate-200 bg-white text-sm">
                {(["all", "public", "private"] as const).map((v) => (
                  <a
                    key={v}
                    href={buildHref({ visibility: v, page: 1 })}
                    className={`px-3 py-1.5 transition-colors ${
                      visibility === v
                        ? "bg-blue-600 text-white"
                        : "text-slate-600 hover:bg-slate-50"
                    } ${v === "all" ? "rounded-l-lg" : v === "private" ? "rounded-r-lg" : ""}`}
                  >
                    {v === "all"
                      ? t("common.all")
                      : v === "public"
                        ? t("common.public")
                        : t("common.private")}
                  </a>
                ))}
              </div>
            </div>
            <form method="get" className="flex gap-2">
              <input type="hidden" name="visibility" value={visibility} />
              <input
                name="q"
                defaultValue={search}
                placeholder={t("tabs.searchPlaceholder")}
                className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 sm:w-56 sm:flex-none"
              />
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 sm:px-4"
              >
                {t("common.search")}
              </button>
            </form>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[740px] text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-5">
                    {t("tabs.colTitle")}
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-5">
                    {t("tabs.colArtist")}
                  </th>
                  <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-5">
                    {t("tabs.colViews")}
                  </th>
                  <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-5">
                    {t("tabs.colLikes")}
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-5">
                    {t("tabs.colStatus")}
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-5">
                    {t("tabs.colDate")}
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-5">
                    {t("common.action")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {tabs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                      {t("tabs.noTabs")}
                    </td>
                  </tr>
                ) : (
                  tabs.map((tab) => (
                    <tr key={tab.id} className="hover:bg-slate-50">
                      <td className="max-w-[160px] truncate px-4 py-3 font-medium text-slate-900 sm:max-w-[200px] sm:px-5">
                        {tab.title}
                      </td>
                      <td className="px-4 py-3 text-slate-500 sm:px-5">
                        {tab.artist ?? <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600 sm:px-5">
                        {tab.viewCount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600 sm:px-5">
                        {tab.likeCount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 sm:px-5">
                        <div className="flex flex-wrap gap-1">
                          <Badge variant={tab.isPublic ? "success" : "default"}>
                            {tab.isPublic ? t("common.public") : t("common.private")}
                          </Badge>
                          {tab.price > 0 && (
                            <Badge variant="info">{tab.price.toLocaleString()}K</Badge>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-400 sm:px-5">
                        {new Date(tab.createdAt).toLocaleDateString(dateLocale)}
                      </td>
                      <td className="px-4 py-3 sm:px-5">
                        <div className="flex gap-1.5">
                          {tab.isPublic && (
                            <form method="post">
                              <input type="hidden" name="_action" value="forceHide" />
                              <input type="hidden" name="id" value={tab.id} />
                              <button
                                type="submit"
                                className="rounded bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-200"
                              >
                                {t("tabs.hide")}
                              </button>
                            </form>
                          )}
                          <form
                            method="post"
                            onSubmit={(e) => {
                              if (!confirm(t("tabs.confirmDelete", { title: tab.title }))) {
                                e.preventDefault();
                              }
                            }}
                          >
                            <input type="hidden" name="_action" value="delete" />
                            <input type="hidden" name="id" value={tab.id} />
                            <button
                              type="submit"
                              className="rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-200"
                            >
                              {t("common.delete")}
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1">
              {page > 1 && (
                <a
                  href={buildHref({ page: page - 1 })}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
                >
                  {t("common.prev")}
                </a>
              )}
              <span className="px-3 py-1.5 text-sm text-slate-500">
                {page} / {totalPages}
              </span>
              {page < totalPages && (
                <a
                  href={buildHref({ page: page + 1 })}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
                >
                  {t("common.next")}
                </a>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
