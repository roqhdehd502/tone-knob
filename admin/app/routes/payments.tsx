import { redirect } from "react-router";

import type { Route } from "./+types/payments";

import { Topbar } from "~/components/layout/Topbar";
import { Badge } from "~/components/ui/Badge";
import { requireAdmin } from "~/service/session.server";
import { getSupabase } from "~/service/supabase.server";
import type { PaymentRow } from "~/types/db";

const PAGE_SIZE = 20;

export function meta() {
  return [{ title: "결제 관리 - Tone Knob Admin" }];
}

export async function action({ request }: Route.ActionArgs) {
  await requireAdmin(request);
  const formData = await request.formData();
  const id = formData.get("id") as string;
  const supabase = getSupabase();
  await supabase.from("payments").update({ status: "refunded" }).eq("id", id);
  return redirect(request.url);
}

export async function loader({ request }: Route.LoaderArgs) {
  const admin = await requireAdmin(request);
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
  const status = url.searchParams.get("status") ?? "all";

  const supabase = getSupabase();
  const from = (page - 1) * PAGE_SIZE;

  let query = supabase
    .from("payments")
    .select(
      "id, userId, type, amount, currency, status, provider, externalPaymentId, externalOrderId, createdAt",
      { count: "exact" },
    )
    .order("createdAt", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  if (status !== "all") query = query.eq("status", status);

  const { data, count } = await query;
  const payments = (data ?? []) as unknown as PaymentRow[];

  return {
    admin,
    payments,
    total: count ?? 0,
    page,
    status,
    totalPages: Math.ceil((count ?? 0) / PAGE_SIZE),
  };
}

function statusVariant(s: string) {
  if (s === "completed") return "success" as const;
  if (s === "refunded") return "warning" as const;
  if (s === "failed") return "danger" as const;
  return "default" as const;
}

function statusLabel(s: string) {
  if (s === "pending") return "대기";
  if (s === "completed") return "완료";
  if (s === "refunded") return "환불";
  if (s === "failed") return "실패";
  return s;
}

export default function PaymentsPage({ loaderData }: Route.ComponentProps) {
  const { admin, payments, total, page, status, totalPages } = loaderData;

  const buildHref = (overrides: Record<string, string | number>) => {
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    params.set("page", String(page));
    Object.entries(overrides).forEach(([k, v]) => params.set(k, String(v)));
    return `/payments?${params.toString()}`;
  };

  const statusOptions = ["all", "pending", "completed", "refunded", "failed"] as const;

  return (
    <>
      <Topbar adminName={admin.adminName} adminEmail={admin.adminEmail} title="결제 관리" />
      <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
        <div className="mx-auto max-w-7xl space-y-4">

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
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-5">타입</th>
                  <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-5">금액</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-5">상태</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-5">결제 ID (PortOne)</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-5">일시</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-5">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-slate-400">결제 내역이 없습니다.</td>
                  </tr>
                ) : (
                  payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 sm:px-5">
                        <Badge variant={payment.type === "subscription" ? "info" : "default"}>
                          {payment.type === "subscription" ? "구독" : "탭 구매"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-900 sm:px-5">
                        {payment.amount.toLocaleString()}원
                      </td>
                      <td className="px-4 py-3 sm:px-5">
                        <Badge variant={statusVariant(payment.status)}>
                          {statusLabel(payment.status)}
                        </Badge>
                      </td>
                      <td className="max-w-[200px] truncate px-4 py-3 font-mono text-xs text-slate-400 sm:px-5">
                        {payment.externalPaymentId ?? payment.externalOrderId ?? "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-400 sm:px-5">
                        {new Date(payment.createdAt).toLocaleDateString("ko-KR")}
                      </td>
                      <td className="px-4 py-3 sm:px-5">
                        {payment.status === "completed" && (
                          <form
                            method="post"
                            onSubmit={(e) => {
                              if (!confirm("환불 처리하시겠습니까? DB 상태만 변경되며 PG사 실취소는 별도로 진행해야 합니다.")) {
                                e.preventDefault();
                              }
                            }}
                          >
                            <input type="hidden" name="id" value={payment.id} />
                            <button
                              type="submit"
                              className="rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-200"
                            >
                              환불
                            </button>
                          </form>
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
