import { redirect } from "react-router";

import { Topbar } from "~/components/layout/Topbar";
import { Badge } from "~/components/ui/Badge";
import { useI18n } from "~/context/i18n";
import { requireAdmin } from "~/service/session.server";
import { getSupabase } from "~/service/supabase.server";
import type { JamRoomRow } from "~/types/db";

import type { Route } from "./+types/jam-rooms";

/** 페이지당 표시할 행 수 */
const PAGE_SIZE = 20;

/** 브라우저 탭 제목 메타 */
export function meta() {
  return [{ title: "Jam Rooms - Tone Knob Admin" }];
}

/**
 * 합주방 강제 종료 액션.
 * `isActive`를 `false`로, `currentParticipants`를 `0`으로 초기화한다.
 */
export async function action({ request }: Route.ActionArgs) {
  await requireAdmin(request);
  const formData = await request.formData();
  const id = formData.get("id") as string;
  const supabase = getSupabase();
  await supabase.from("jam_rooms").update({ isActive: false, currentParticipants: 0 }).eq("id", id);
  return redirect(request.url);
}

/**
 * 합주방 목록 로더.
 * 쿼리 파라미터 `active`(`all` | `true` | `false`), `page`를 지원한다.
 */
export async function loader({ request }: Route.LoaderArgs) {
  const admin = await requireAdmin(request);
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
  const filter = url.searchParams.get("filter") ?? "all";

  const supabase = getSupabase();
  const from = (page - 1) * PAGE_SIZE;

  let query = supabase
    .from("jam_rooms")
    .select(
      "id, name, description, hostId, maxParticipants, currentParticipants, isActive, isPrivate, bpm, createdAt",
      { count: "exact" },
    )
    .order("createdAt", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  if (filter === "active") query = query.eq("isActive", true);
  if (filter === "inactive") query = query.eq("isActive", false);

  const { data, count } = await query;
  const rooms = (data ?? []) as unknown as JamRoomRow[];

  return {
    admin,
    rooms,
    total: count ?? 0,
    page,
    filter,
    totalPages: Math.ceil((count ?? 0) / PAGE_SIZE),
  };
}

/** 합주방 관리 페이지. 목록 조회와 강제 종료 액션을 제공한다. */
export default function JamRoomsPage({ loaderData }: Route.ComponentProps) {
  const { admin, rooms, total, page, filter, totalPages } = loaderData;
  const { t, dateLocale } = useI18n();

  const buildHref = (overrides: Record<string, string | number>) => {
    const params = new URLSearchParams();
    if (filter !== "all") params.set("filter", filter);
    params.set("page", String(page));
    Object.entries(overrides).forEach(([k, v]) => params.set(k, String(v)));
    return `/jam-rooms?${params.toString()}`;
  };

  return (
    <>
      <Topbar
        adminName={admin.adminName}
        adminEmail={admin.adminEmail}
        title={t("jamRooms.pageTitle")}
      />
      <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
        <div className="mx-auto max-w-7xl space-y-4">
          <div className="flex items-center gap-3">
            <p className="text-sm text-slate-500">
              {t("jamRooms.total", { n: total.toLocaleString() })}
            </p>
            <div className="flex rounded-lg border border-slate-200 bg-white text-sm">
              {(["all", "active", "inactive"] as const).map((v) => (
                <a
                  key={v}
                  href={buildHref({ filter: v, page: 1 })}
                  className={`px-3 py-1.5 transition-colors ${
                    filter === v ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-50"
                  } ${v === "all" ? "rounded-l-lg" : v === "inactive" ? "rounded-r-lg" : ""}`}
                >
                  {v === "all"
                    ? t("common.all")
                    : v === "active"
                      ? t("jamRooms.active")
                      : t("jamRooms.inactive")}
                </a>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[620px] text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-5">
                    {t("jamRooms.colName")}
                  </th>
                  <th className="px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-5">
                    {t("jamRooms.colParticipants")}
                  </th>
                  <th className="px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-5">
                    {t("jamRooms.colBpm")}
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-5">
                    {t("jamRooms.colStatus")}
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-5">
                    {t("jamRooms.colPublic")}
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-5">
                    {t("jamRooms.colCreated")}
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-5">
                    {t("common.action")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rooms.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                      {t("jamRooms.noRooms")}
                    </td>
                  </tr>
                ) : (
                  rooms.map((room) => (
                    <tr key={room.id} className="hover:bg-slate-50">
                      <td className="max-w-[180px] truncate px-4 py-3 font-medium text-slate-900 sm:max-w-[220px] sm:px-5">
                        {room.name}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-600 sm:px-5">
                        {room.currentParticipants} / {room.maxParticipants}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-600 sm:px-5">{room.bpm}</td>
                      <td className="px-4 py-3 sm:px-5">
                        <Badge variant={room.isActive ? "success" : "default"}>
                          {room.isActive ? t("jamRooms.active") : t("jamRooms.closed")}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 sm:px-5">
                        <Badge variant={room.isPrivate ? "warning" : "default"}>
                          {room.isPrivate ? t("jamRooms.isPrivate") : t("common.public")}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-400 sm:px-5">
                        {new Date(room.createdAt).toLocaleDateString(dateLocale)}
                      </td>
                      <td className="px-4 py-3 sm:px-5">
                        {room.isActive && (
                          <form
                            method="post"
                            onSubmit={(e) => {
                              if (!confirm(t("jamRooms.confirmClose", { name: room.name }))) {
                                e.preventDefault();
                              }
                            }}
                          >
                            <input type="hidden" name="id" value={room.id} />
                            <button
                              type="submit"
                              className="rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-200"
                            >
                              {t("jamRooms.forceClose")}
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
