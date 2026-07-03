import { redirect } from "react-router";

import type { Route } from "./+types/users";

import { Topbar } from "~/components/layout/Topbar";
import { Badge } from "~/components/ui/Badge";
import { requireAdmin } from "~/service/session.server";
import { getSupabase } from "~/service/supabase.server";
import type { UserDetailRow, UserRow } from "~/types/db";

const PAGE_SIZE = 20;

export function meta() {
  return [{ title: "유저 관리 - Tone Knob Admin" }];
}

export async function action({ request }: Route.ActionArgs) {
  await requireAdmin(request);
  const formData = await request.formData();
  const _action = formData.get("_action") as string;
  const id = formData.get("id") as string;
  const supabase = getSupabase();

  if (_action === "ban") {
    await supabase.from("users").update({ role: "banned" }).eq("id", id);
  } else if (_action === "unban") {
    await supabase.from("users").update({ role: "user" }).eq("id", id);
  } else if (_action === "setPlan") {
    const plan = formData.get("plan") as string;
    await supabase.from("users").update({ subscriptionTier: plan }).eq("id", id);
    await supabase
      .from("subscriptions")
      .update({ plan })
      .eq("userId", id)
      .eq("status", "active");
  }

  return redirect(request.url);
}

export async function loader({ request }: Route.LoaderArgs) {
  const admin = await requireAdmin(request);
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
  const search = url.searchParams.get("q") ?? "";
  const selectedId = url.searchParams.get("selected") ?? null;

  const supabase = getSupabase();
  const from = (page - 1) * PAGE_SIZE;

  let query = supabase
    .from("users")
    .select("id, email, username, displayName, role, subscriptionTier, createdAt", { count: "exact" })
    .order("createdAt", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  if (search) {
    query = query.or(`email.ilike.%${search}%,username.ilike.%${search}%`);
  }

  const { data, count } = await query;
  const users = (data ?? []) as unknown as UserRow[];

  let detail: UserDetailRow | null = null;
  if (selectedId) {
    const [userRes, tabCountRes, badgeCountRes] = await Promise.all([
      supabase
        .from("users")
        .select("id, email, username, displayName, role, subscriptionTier, createdAt, knobBalance")
        .eq("id", selectedId)
        .single(),
      supabase.from("tabs").select("*", { count: "exact", head: true }).eq("userId", selectedId),
      supabase.from("user_badges").select("*", { count: "exact", head: true }).eq("userId", selectedId),
    ]);
    if (userRes.data) {
      detail = {
        ...(userRes.data as unknown as UserRow & { knobBalance: number }),
        tabCount: tabCountRes.count ?? 0,
        badgeCount: badgeCountRes.count ?? 0,
      };
    }
  }

  return {
    admin,
    users,
    total: count ?? 0,
    page,
    search,
    totalPages: Math.ceil((count ?? 0) / PAGE_SIZE),
    selectedId,
    detail,
  };
}

function detailHref(search: string, page: number, id: string | null) {
  const params = new URLSearchParams();
  if (search) params.set("q", search);
  params.set("page", String(page));
  if (id) params.set("selected", id);
  return `/users?${params.toString()}`;
}

export default function UsersPage({ loaderData }: Route.ComponentProps) {
  const { admin, users, total, page, search, totalPages, selectedId, detail } = loaderData;

  return (
    <>
      <Topbar adminName={admin.adminName} adminEmail={admin.adminEmail} title="유저 관리" />
      <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
        <div className="mx-auto max-w-7xl space-y-4">

          {/* Detail panel */}
          {detail && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-200 text-sm font-bold text-blue-700">
                    {(detail.displayName || detail.username)[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{detail.displayName || detail.username}</p>
                    <p className="text-xs text-slate-500">{detail.email}</p>
                  </div>
                </div>
                <a
                  href={detailHref(search, page, null)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  닫기 ×
                </a>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div className="rounded-lg bg-white p-3">
                  <p className="text-xs text-slate-500">Knob 잔액</p>
                  <p className="mt-0.5 font-bold text-slate-900">{((detail as UserDetailRow & { knobBalance?: number }).knobBalance ?? 0).toLocaleString()}</p>
                </div>
                <div className="rounded-lg bg-white p-3">
                  <p className="text-xs text-slate-500">제작 타브</p>
                  <p className="mt-0.5 font-bold text-slate-900">{detail.tabCount}</p>
                </div>
                <div className="rounded-lg bg-white p-3">
                  <p className="text-xs text-slate-500">보유 뱃지</p>
                  <p className="mt-0.5 font-bold text-slate-900">{detail.badgeCount}</p>
                </div>
                <div className="rounded-lg bg-white p-3">
                  <p className="text-xs text-slate-500">가입일</p>
                  <p className="mt-0.5 font-bold text-slate-900">
                    {new Date(detail.createdAt).toLocaleDateString("ko-KR")}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {/* Ban / Unban */}
                {detail.role !== "admin" && (
                  <form method="post">
                    <input type="hidden" name="_action" value={detail.role === "banned" ? "unban" : "ban"} />
                    <input type="hidden" name="id" value={detail.id} />
                    <button
                      type="submit"
                      className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                        detail.role === "banned"
                          ? "bg-emerald-600 text-white hover:bg-emerald-700"
                          : "bg-red-600 text-white hover:bg-red-700"
                      }`}
                      onClick={(e) => {
                        const msg = detail.role === "banned"
                          ? "계정을 활성화하시겠습니까?"
                          : "계정을 정지하시겠습니까?";
                        if (!confirm(msg)) e.preventDefault();
                      }}
                    >
                      {detail.role === "banned" ? "계정 활성화" : "계정 정지"}
                    </button>
                  </form>
                )}

                {/* Subscription plan change */}
                <form method="post" className="flex items-center gap-2">
                  <input type="hidden" name="_action" value="setPlan" />
                  <input type="hidden" name="id" value={detail.id} />
                  <select
                    name="plan"
                    defaultValue={detail.subscriptionTier}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="free">Free</option>
                    <option value="premium">Premium</option>
                    <option value="pro">Pro</option>
                  </select>
                  <button
                    type="submit"
                    className="rounded-lg bg-slate-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
                  >
                    구독 변경
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Search & Summary */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              총 <span className="font-semibold text-slate-900">{total.toLocaleString()}</span>명
            </p>
            <form method="get" className="flex gap-2">
              {selectedId && <input type="hidden" name="selected" value={selectedId} />}
              <input
                name="q"
                defaultValue={search}
                placeholder="이메일 또는 유저명 검색"
                className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 sm:w-64 sm:flex-none"
              />
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 sm:px-4"
              >
                검색
              </button>
              {search && (
                <a
                  href="/users"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  초기화
                </a>
              )}
            </form>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[620px] text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-5">유저</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-5">이메일</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-5">권한</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-5">구독</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-5">가입일</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-5">상세</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                      유저가 없습니다.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr
                      key={user.id}
                      className={`hover:bg-slate-50 ${selectedId === user.id ? "bg-blue-50/60" : ""}`}
                    >
                      <td className="px-4 py-3 sm:px-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-600">
                            {(user.displayName || user.username)[0]?.toUpperCase()}
                          </div>
                          <span className="font-medium text-slate-900">
                            {user.displayName || user.username}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 sm:px-5">{user.email}</td>
                      <td className="px-4 py-3 sm:px-5">
                        <Badge
                          variant={
                            user.role === "admin" ? "danger" : user.role === "banned" ? "warning" : "default"
                          }
                        >
                          {user.role === "banned" ? "정지" : user.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 sm:px-5">
                        <Badge
                          variant={
                            user.subscriptionTier === "pro"
                              ? "info"
                              : user.subscriptionTier === "premium"
                                ? "success"
                                : "default"
                          }
                        >
                          {user.subscriptionTier}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-400 sm:px-5">
                        {new Date(user.createdAt).toLocaleDateString("ko-KR")}
                      </td>
                      <td className="px-4 py-3 sm:px-5">
                        {selectedId === user.id ? (
                          <a
                            href={detailHref(search, page, null)}
                            className="text-xs font-medium text-blue-600 hover:underline"
                          >
                            닫기
                          </a>
                        ) : (
                          <a
                            href={detailHref(search, page, user.id)}
                            className="text-xs font-medium text-blue-600 hover:underline"
                          >
                            자세히
                          </a>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1">
              {page > 1 && (
                <a
                  href={`/users?page=${page - 1}${search ? `&q=${search}` : ""}${selectedId ? `&selected=${selectedId}` : ""}`}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
                >
                  이전
                </a>
              )}
              <span className="px-3 py-1.5 text-sm text-slate-500">{page} / {totalPages}</span>
              {page < totalPages && (
                <a
                  href={`/users?page=${page + 1}${search ? `&q=${search}` : ""}${selectedId ? `&selected=${selectedId}` : ""}`}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
                >
                  다음
                </a>
              )}
            </div>
          )}

        </div>
      </main>
    </>
  );
}
