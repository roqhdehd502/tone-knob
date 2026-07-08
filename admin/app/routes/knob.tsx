import { redirect } from "react-router";

import { Topbar } from "~/components/layout/Topbar";
import { Badge } from "~/components/ui/Badge";
import { useI18n } from "~/context/i18n";
import { requireAdmin } from "~/service/session.server";
import { getSupabase } from "~/service/supabase.server";
import type { KnobTransactionRow } from "~/types/db";

import type { Route } from "./+types/knob";

const PAGE_SIZE = 20;

export function meta() {
  return [{ title: "Knob Currency - Tone Knob Admin" }];
}

export async function action({ request }: Route.ActionArgs) {
  await requireAdmin(request);
  const formData = await request.formData();
  const email = (formData.get("email") as string).trim();
  const amount = Number(formData.get("amount"));
  const reason = (formData.get("reason") as string).trim() || "관리자 수동 조정";

  if (!email || isNaN(amount) || amount === 0) return redirect("/knob");

  const supabase = getSupabase();
  const { data: user } = await supabase
    .from("users")
    .select("id, knobBalance")
    .eq("email", email)
    .single();

  if (!user) return redirect("/knob?error=user_not_found");

  const currentBalance = (user as { id: string; knobBalance: number }).knobBalance ?? 0;
  const newBalance = Math.max(0, currentBalance + amount);
  const type = amount > 0 ? "earn_community_activity" : "spend_premium_feature";
  const description = amount > 0 ? `관리자 지급: ${reason}` : `관리자 차감: ${reason}`;

  await supabase
    .from("users")
    .update({ knobBalance: newBalance })
    .eq("id", (user as { id: string }).id);

  await supabase.from("knob_transactions").insert({
    userId: (user as { id: string }).id,
    type,
    amount: Math.abs(amount),
    balanceAfter: newBalance,
    description,
  });

  return redirect("/knob");
}

export async function loader({ request }: Route.LoaderArgs) {
  const admin = await requireAdmin(request);
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
  const typeFilter = url.searchParams.get("type") ?? "all";
  const error = url.searchParams.get("error") ?? null;

  const supabase = getSupabase();
  const from = (page - 1) * PAGE_SIZE;

  const { data: topUsers } = await supabase
    .from("users")
    .select("id, email, username, displayName, knobBalance")
    .order("knobBalance", { ascending: false })
    .limit(10);

  let txQuery = supabase
    .from("knob_transactions")
    .select("id, userId, type, amount, balanceAfter, description, createdAt", { count: "exact" })
    .order("createdAt", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  if (typeFilter !== "all") txQuery = txQuery.eq("type", typeFilter);

  const { data: txData, count: txCount } = await txQuery;
  const transactions = (txData ?? []) as unknown as KnobTransactionRow[];

  const users = (topUsers ?? []) as {
    id: string;
    email: string;
    username: string;
    displayName: string | null;
    knobBalance: number;
  }[];

  return {
    admin,
    topUsers: users,
    transactions,
    txTotal: txCount ?? 0,
    page,
    typeFilter,
    txTotalPages: Math.ceil((txCount ?? 0) / PAGE_SIZE),
    error,
  };
}

const TX_TYPE_OPTIONS = [
  "all",
  "earn_tab_created",
  "earn_jam_participated",
  "earn_community_activity",
  "earn_daily_login",
  "earn_tab_sale",
  "spend_tab_purchase",
  "spend_premium_feature",
] as const;

function txVariant(tp: string) {
  return tp.startsWith("earn") ? ("success" as const) : ("warning" as const);
}

export default function KnobPage({ loaderData }: Route.ComponentProps) {
  const { admin, topUsers, transactions, txTotal, page, typeFilter, txTotalPages, error } =
    loaderData;
  const { t, dateLocale } = useI18n();

  const txTypeLabel = (tp: string) => {
    if (tp === "earn_tab_created") return t("knob.typeEarnTabCreated");
    if (tp === "earn_jam_participated") return t("knob.typeEarnJamParticipated");
    if (tp === "earn_community_activity") return t("knob.typeEarnCommunityActivity");
    if (tp === "earn_daily_login") return t("knob.typeEarnDailyLogin");
    if (tp === "earn_tab_sale") return t("knob.typeEarnTabSale");
    if (tp === "spend_tab_purchase") return t("knob.typeSpendTabPurchase");
    if (tp === "spend_premium_feature") return t("knob.typeSpendPremiumFeature");
    return tp;
  };

  const buildHref = (overrides: Record<string, string | number>) => {
    const params = new URLSearchParams();
    if (typeFilter !== "all") params.set("type", typeFilter);
    params.set("page", String(page));
    Object.entries(overrides).forEach(([k, v]) => params.set(k, String(v)));
    return `/knob?${params.toString()}`;
  };

  return (
    <>
      <Topbar
        adminName={admin.adminName}
        adminEmail={admin.adminEmail}
        title={t("knob.pageTitle")}
      />
      <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {/* Manual Adjustment Form */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold text-slate-900">{t("knob.adjustTitle")}</h2>
              {error === "user_not_found" && (
                <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                  {t("knob.errorUserNotFound")}
                </p>
              )}
              <form method="post" className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    {t("common.email")}
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
                    {t("knob.amountHelp")}
                  </label>
                  <input
                    name="amount"
                    type="number"
                    required
                    placeholder="1000"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    {t("common.reason")}
                  </label>
                  <input
                    name="reason"
                    placeholder={t("knob.reasonPlaceholder")}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  {t("common.apply")}
                </button>
              </form>
            </div>

            {/* Top users */}
            <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-4 py-3 sm:px-5">
                <h2 className="text-sm font-semibold text-slate-900">{t("knob.topUsers")}</h2>
              </div>
              <div className="divide-y divide-slate-50">
                {topUsers.length === 0 ? (
                  <p className="px-5 py-6 text-sm text-slate-400">{t("common.noData")}</p>
                ) : (
                  topUsers.map((u, idx) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between px-4 py-2.5 sm:px-5"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-5 text-center text-xs font-bold text-slate-400">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {u.displayName || u.username}
                          </p>
                          <p className="text-xs text-slate-400">{u.email}</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-slate-900">
                        {(u.knobBalance ?? 0).toLocaleString()} K
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Transactions */}
          <div>
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                {t("knob.txTotal", { n: txTotal.toLocaleString() })}
              </p>
              <div className="flex flex-wrap gap-1">
                {TX_TYPE_OPTIONS.map((v) => (
                  <a
                    key={v}
                    href={buildHref({ type: v, page: 1 })}
                    className={`rounded-lg border px-2.5 py-1 text-xs transition-colors ${
                      typeFilter === v
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {v === "all" ? t("common.all") : txTypeLabel(v)}
                  </a>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full min-w-[580px] text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-5">
                      {t("knob.colType")}
                    </th>
                    <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-5">
                      {t("knob.colAmount")}
                    </th>
                    <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-5">
                      {t("knob.colBalanceAfter")}
                    </th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-5">
                      {t("knob.colDescription")}
                    </th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-5">
                      {t("knob.colDate")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                        {t("knob.noTransactions")}
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 sm:px-5">
                          <Badge variant={txVariant(tx.type)}>{txTypeLabel(tx.type)}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right font-medium sm:px-5">
                          <span
                            className={
                              tx.type.startsWith("earn") ? "text-emerald-600" : "text-red-500"
                            }
                          >
                            {tx.type.startsWith("earn") ? "+" : "-"}
                            {tx.amount.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-600 sm:px-5">
                          {tx.balanceAfter.toLocaleString()}
                        </td>
                        <td className="max-w-[180px] truncate px-4 py-3 text-slate-400 sm:px-5">
                          {tx.description ?? "—"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-400 sm:px-5">
                          {new Date(tx.createdAt).toLocaleDateString(dateLocale)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {txTotalPages > 1 && (
              <div className="mt-3 flex items-center justify-center gap-1">
                {page > 1 && (
                  <a
                    href={buildHref({ page: page - 1 })}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
                  >
                    {t("common.prev")}
                  </a>
                )}
                <span className="px-3 py-1.5 text-sm text-slate-500">
                  {page} / {txTotalPages}
                </span>
                {page < txTotalPages && (
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
        </div>
      </main>
    </>
  );
}
