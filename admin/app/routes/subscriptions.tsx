import { Topbar } from "~/components/layout/Topbar";
import { Badge } from "~/components/ui/Badge";
import { useI18n } from "~/context/i18n";
import { requireAdmin } from "~/service/session.server";
import { getSupabase } from "~/service/supabase.server";
import type { SubscriptionRow } from "~/types/db";

import type { Route } from "./+types/subscriptions";

/** 페이지당 표시할 행 수 */
const PAGE_SIZE = 20;

/** 브라우저 탭 제목 메타 */
export function meta() {
  return [{ title: "Subscriptions - Tone Knob Admin" }];
}

/**
 * 구독 목록 로더.
 * 쿼리 파라미터 `status`(`all` | `active` | `cancelled` | `expired`), `page`를 지원한다.
 */
export async function loader({ request }: Route.LoaderArgs) {
  const admin = await requireAdmin(request);
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
  const status = url.searchParams.get("status") ?? "all";

  const supabase = getSupabase();
  const from = (page - 1) * PAGE_SIZE;

  let query = supabase
    .from("subscriptions")
    .select("id, userId, plan, status, startDate, endDate, createdAt", { count: "exact" })
    .order("createdAt", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  if (status !== "all") query = query.eq("status", status);

  const { data, count } = await query;
  const subs = (data ?? []) as unknown as SubscriptionRow[];

  return {
    admin,
    subs,
    total: count ?? 0,
    page,
    status,
    totalPages: Math.ceil((count ?? 0) / PAGE_SIZE),
  };
}

/** 구독 현황 페이지. 구독 목록과 상태 필터를 제공한다. */
export default function SubscriptionsPage({ loaderData }: Route.ComponentProps) {
  const { admin, subs, total, page, status, totalPages } = loaderData;
  const { t, dateLocale } = useI18n();

  const buildHref = (overrides: Record<string, string | number>) => {
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    params.set("page", String(page));
    Object.entries(overrides).forEach(([k, v]) => params.set(k, String(v)));
    return `/subscriptions?${params.toString()}`;
  };

  const statusVariant = (s: string) =>
    s === "active" ? "success" : s === "cancelled" ? "warning" : "danger";

  const planVariant = (p: string) =>
    p === "pro" ? "info" : p === "premium" ? "success" : "default";

  const statusLabel = (v: string) => {
    if (v === "active") return t("subscriptions.active");
    if (v === "cancelled") return t("subscriptions.cancelled");
    if (v === "expired") return t("subscriptions.expired");
    return v;
  };

  return (
    <>
      <Topbar
        adminName={admin.adminName}
        adminEmail={admin.adminEmail}
        title={t("subscriptions.pageTitle")}
      />
      <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
        <div className="mx-auto max-w-7xl space-y-4">
          <div className="flex items-center gap-3">
            <p className="text-sm text-slate-500">
              {t("subscriptions.total", { n: total.toLocaleString() })}
            </p>
            <div className="flex rounded-lg border border-slate-200 bg-white text-sm">
              {(["all", "active", "cancelled", "expired"] as const).map((v, i, arr) => (
                <a
                  key={v}
                  href={buildHref({ status: v, page: 1 })}
                  className={`px-3 py-1.5 transition-colors ${
                    status === v ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-50"
                  } ${i === 0 ? "rounded-l-lg" : i === arr.length - 1 ? "rounded-r-lg" : ""}`}
                >
                  {v === "all" ? t("common.all") : statusLabel(v)}
                </a>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-5">
                    {t("subscriptions.colId")}
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-5">
                    {t("subscriptions.colPlan")}
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-5">
                    {t("subscriptions.colStatus")}
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-5">
                    {t("subscriptions.colStart")}
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-5">
                    {t("subscriptions.colEnd")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {subs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                      {t("subscriptions.noSubs")}
                    </td>
                  </tr>
                ) : (
                  subs.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-xs text-slate-400 sm:px-5">
                        {sub.id.slice(0, 8)}…
                      </td>
                      <td className="px-4 py-3 sm:px-5">
                        <Badge variant={planVariant(sub.plan)}>{sub.plan}</Badge>
                      </td>
                      <td className="px-4 py-3 sm:px-5">
                        <Badge variant={statusVariant(sub.status)}>{sub.status}</Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-500 sm:px-5">
                        {sub.startDate
                          ? new Date(sub.startDate).toLocaleDateString(dateLocale)
                          : "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-500 sm:px-5">
                        {sub.endDate ? new Date(sub.endDate).toLocaleDateString(dateLocale) : "—"}
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
