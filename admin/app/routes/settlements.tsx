import { redirect } from "react-router";

import type { Route } from "./+types/settlements";

import { Topbar } from "~/components/layout/Topbar";
import { Badge } from "~/components/ui/Badge";
import { requireAdmin } from "~/service/session.server";
import { getSupabase } from "~/service/supabase.server";
import type { SettlementRow } from "~/types/db";

const PAGE_SIZE = 20;

export function meta() {
  return [{ title: "정산 관리 - Tone Knob Admin" }];
}

export async function action({ request }: Route.ActionArgs) {
  await requireAdmin(request);
  const formData = await request.formData();
  const _action = formData.get("_action") as string;
  const id = formData.get("id") as string;
  const supabase = getSupabase();

  if (_action === "approve") {
    await supabase.from("settlements").update({ status: "processing" }).eq("id", id);
  } else if (_action === "reject") {
    await supabase.from("settlements").update({ status: "failed" }).eq("id", id);
  }
  return redirect(request.url);
}

export async function loader({ request }: Route.LoaderArgs) {
  const admin = await requireAdmin(request);
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
  const status = url.searchParams.get("status") ?? "all";
  const search = url.searchParams.get("q") ?? "";

  const supabase = getSupabase();
  const from = (page - 1) * PAGE_SIZE;

  let query = supabase
    .from("settlements")
    .select(
      "id, sellerId, totalAmount, platformFee, netAmount, status, periodStart, periodEnd, note, createdAt, seller:users!sellerId(email, username, displayName)",
      { count: "exact" },
    )
    .order("createdAt", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  if (status !== "all") query = query.eq("status", status);

  const { data, count } = await query;
  let settlements = (data ?? []) as unknown as SettlementRow[];

  if (search) {
    settlements = settlements.filter((s) => {
      const seller = s.seller;
      if (!seller) return false;
      return (
        seller.email.toLowerCase().includes(search.toLowerCase()) ||
        seller.username.toLowerCase().includes(search.toLowerCase())
      );
    });
  }

  const pendingTotal = await supabase
    .from("settlements")
    .select("netAmount", { count: "exact", head: false })
    .eq("status", "pending");

  const pendingSum = ((pendingTotal.data ?? []) as { netAmount: number }[]).reduce(
    (acc, r) => acc + r.netAmount,
    0,
  );

  return {
    admin,
    settlements,
    total: count ?? 0,
    page,
    status,
    search,
    totalPages: Math.ceil((count ?? 0) / PAGE_SIZE),
    pendingSum,
  };
}

function statusVariant(s: string) {
  if (s === "completed") return "success" as const;
  if (s === "processing") return "info" as const;
  if (s === "failed") return "danger" as const;
  return "default" as const;
}

function statusLabel(s: string) {
  if (s === "pending") return "대기";
  if (s === "processing") return "처리 중";
  if (s === "completed") return "완료";
  if (s === "failed") return "거절";
  return s;
}

export default function SettlementsPage({ loaderData }: Route.ComponentProps) {
  const { admin, settlements, total, page, status, search, totalPages, pendingSum } = loaderData;

  const buildHref = (overrides: Record<string, string | number>) => {
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    if (search) params.set("q", search);
    params.set("page", String(page));
    Object.entries(overrides).forEach(([k, v]) => params.set(k, String(v)));
    return `/settlements?${params.toString()}`;
  };

  const statusOptions = ["all", "pending", "processing", "completed", "failed"] as const;

  return (
    <>
      <Topbar adminName={admin.adminName} adminEmail={admin.adminEmail} title="정산 관리" />
      <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
        <div className="mx-auto max-w-7xl space-y-4">

          {/* Summary */}
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            대기 중 정산 합계 (netAmount): <span className="font-semibold">{pendingSum.toLocaleString()}원</span>
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <p className="text-sm text-slate-500">
                총 <span className="font-semibold text-slate-900">{total.toLocaleString()}</span>건
              </p>
              <div className="flex rounded-lg border border-slate-200 bg-white text-sm">
                {statusOptions.map((v, i) => (
                  <a
                    key={v}
                    href={buildHref({ status: v, page: 1 })}
                    className={`px-3 py-1.5 transition-colors ${
                      status === v ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-50"
                    } ${i === 0 ? "rounded-l-lg" : i === statusOptions.length - 1 ? "rounded-r-lg" : ""}`}
                  >
                    {v === "all" ? "전체" : statusLabel(v)}
                  </a>
                ))}
              </div>
            </div>
            <form method="get" className="flex gap-2">
              <input type="hidden" name="status" value={status} />
              <input
                name="q"
                defaultValue={search}
                placeholder="판매자 이메일/유저명 검색"
                className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 sm:w-60 sm:flex-none"
              />
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                검색
              </button>
            </form>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-5">판매자</th>
                  <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-5">총액</th>
                  <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-5">수수료</th>
                  <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-5">지급액</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-5">기간</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-5">상태</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-5">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {settlements.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-slate-400">정산 내역이 없습니다.</td>
                  </tr>
                ) : (
                  settlements.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 sm:px-5">
                        <p className="font-medium text-slate-900">
                          {s.seller?.displayName || s.seller?.username || s.sellerId.slice(0, 8)}
                        </p>
                        <p className="text-xs text-slate-400">{s.seller?.email ?? ""}</p>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-700 sm:px-5">{s.totalAmount.toLocaleString()}원</td>
                      <td className="px-4 py-3 text-right text-slate-500 sm:px-5">{s.platformFee.toLocaleString()}원</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900 sm:px-5">{s.netAmount.toLocaleString()}원</td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-400 sm:px-5">
                        {s.periodStart} ~ {s.periodEnd}
                      </td>
                      <td className="px-4 py-3 sm:px-5">
                        <Badge variant={statusVariant(s.status)}>{statusLabel(s.status)}</Badge>
                      </td>
                      <td className="px-4 py-3 sm:px-5">
                        {s.status === "pending" && (
                          <div className="flex gap-1.5">
                            <form method="post">
                              <input type="hidden" name="_action" value="approve" />
                              <input type="hidden" name="id" value={s.id} />
                              <button
                                type="submit"
                                className="rounded bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-200"
                              >
                                승인
                              </button>
                            </form>
                            <form
                              method="post"
                              onSubmit={(e) => { if (!confirm("정산을 거절하시겠습니까?")) e.preventDefault(); }}
                            >
                              <input type="hidden" name="_action" value="reject" />
                              <input type="hidden" name="id" value={s.id} />
                              <button
                                type="submit"
                                className="rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-200"
                              >
                                거절
                              </button>
                            </form>
                          </div>
                        )}
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
                <a href={buildHref({ page: page - 1 })} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">이전</a>
              )}
              <span className="px-3 py-1.5 text-sm text-slate-500">{page} / {totalPages}</span>
              {page < totalPages && (
                <a href={buildHref({ page: page + 1 })} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">다음</a>
              )}
            </div>
          )}

        </div>
      </main>
    </>
  );
}
