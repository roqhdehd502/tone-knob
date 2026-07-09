import { Topbar } from "~/components/layout/Topbar";
import { Badge } from "~/components/ui/Badge";
import { useI18n } from "~/context/i18n";
import { requireAdmin } from "~/service/session.server";
import { getSupabase } from "~/service/supabase.server";
import type { TabPurchaseRow } from "~/types/db";

import type { Route } from "./+types/purchases";

/** 페이지당 표시할 행 수 */
const PAGE_SIZE = 20;

/** 브라우저 탭 제목 메타 */
export function meta() {
  return [{ title: "Purchases - Tone Knob Admin" }];
}

/**
 * 타브 구매 목록 로더.
 * 구매자 이메일·사용자명과 타브 제목을 조인하여 반환한다.
 * 쿼리 파라미터 `page`를 지원한다.
 */
export async function loader({ request }: Route.LoaderArgs) {
  const admin = await requireAdmin(request);
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));

  const supabase = getSupabase();
  const from = (page - 1) * PAGE_SIZE;

  const { data, count } = await supabase
    .from("tab_purchases")
    .select(
      "id, buyerId, sellerId, tabId, price, status, createdAt, buyer:users!buyerId(email, username), tab:tabs!tabId(title)",
      { count: "exact" },
    )
    .order("createdAt", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  const purchases = (data ?? []) as unknown as TabPurchaseRow[];

  const totalKnobRes = await supabase
    .from("tab_purchases")
    .select("price", { count: "exact", head: false });

  const totalKnob = ((totalKnobRes.data ?? []) as { price: number }[]).reduce(
    (acc, r) => acc + r.price,
    0,
  );

  return {
    admin,
    purchases,
    total: count ?? 0,
    page,
    totalPages: Math.ceil((count ?? 0) / PAGE_SIZE),
    totalKnob,
  };
}

/** 타브 구매 내역 페이지. 구매 목록과 구매자/타브 정보를 표시한다. */
export default function PurchasesPage({ loaderData }: Route.ComponentProps) {
  const { admin, purchases, total, page, totalPages, totalKnob } = loaderData;
  const { t, dateLocale } = useI18n();

  const buildHref = (overrides: Record<string, string | number>) => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    Object.entries(overrides).forEach(([k, v]) => params.set(k, String(v)));
    return `/purchases?${params.toString()}`;
  };

  return (
    <>
      <Topbar
        adminName={admin.adminName}
        adminEmail={admin.adminEmail}
        title={t("purchases.pageTitle")}
      />
      <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
        <div className="mx-auto max-w-7xl space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium text-slate-500">{t("purchases.cardTotalCount")}</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{total.toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium text-slate-500">{t("purchases.cardTotalKnob")}</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{totalKnob.toLocaleString()}</p>
            </div>
          </div>

          <p className="text-sm text-slate-500">
            {t("purchases.total", { n: total.toLocaleString() })}
          </p>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-5">
                    {t("purchases.colTab")}
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-5">
                    {t("purchases.colBuyer")}
                  </th>
                  <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-5">
                    {t("purchases.colKnob")}
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-5">
                    {t("purchases.colStatus")}
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-5">
                    {t("purchases.colDate")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {purchases.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                      {t("purchases.noPurchases")}
                    </td>
                  </tr>
                ) : (
                  purchases.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="max-w-[180px] truncate px-4 py-3 font-medium text-slate-900 sm:px-5">
                        {p.tab?.title ?? p.tabId.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3 text-slate-600 sm:px-5">
                        {p.buyer?.username ?? p.buyerId.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900 sm:px-5">
                        {p.price.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 sm:px-5">
                        <Badge variant={p.status === "completed" ? "success" : "warning"}>
                          {p.status === "completed"
                            ? t("purchases.completed")
                            : t("purchases.refunded")}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-400 sm:px-5">
                        {new Date(p.createdAt).toLocaleDateString(dateLocale)}
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
