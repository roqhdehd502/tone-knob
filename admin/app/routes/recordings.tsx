import type { Route } from "./+types/recordings";

import { Topbar } from "~/components/layout/Topbar";
import { Badge } from "~/components/ui/Badge";
import { requireAdmin } from "~/service/session.server";
import { getSupabase } from "~/service/supabase.server";
import type { RecordingRow } from "~/types/db";

const PAGE_SIZE = 20;

export function meta() {
  return [{ title: "녹음 관리 - Tone Knob Admin" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const admin = await requireAdmin(request);
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
  const visibility = url.searchParams.get("visibility") ?? "all";

  const supabase = getSupabase();
  const from = (page - 1) * PAGE_SIZE;

  let query = supabase
    .from("recordings")
    .select("id, title, userId, visibility, duration, fileSize, createdAt", { count: "exact" })
    .order("createdAt", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  if (visibility !== "all") query = query.eq("visibility", visibility);

  const { data, count } = await query;
  const recordings = (data ?? []) as unknown as RecordingRow[];

  return {
    admin,
    recordings,
    total: count ?? 0,
    page,
    visibility,
    totalPages: Math.ceil((count ?? 0) / PAGE_SIZE),
  };
}

export default function RecordingsPage({ loaderData }: Route.ComponentProps) {
  const { admin, recordings, total, page, visibility, totalPages } = loaderData;

  const buildHref = (overrides: Record<string, string | number>) => {
    const params = new URLSearchParams();
    if (visibility !== "all") params.set("visibility", visibility);
    params.set("page", String(page));
    Object.entries(overrides).forEach(([k, v]) => params.set(k, String(v)));
    return `/recordings?${params.toString()}`;
  };

  const visibilityVariant = (v: string) =>
    v === "public" ? "success" : v === "unlisted" ? "warning" : "default";

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "—";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "—";
    if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(0)} KB`;
  };

  return (
    <>
      <Topbar adminName={admin.adminName} adminEmail={admin.adminEmail} title="녹음 관리" />
      <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
        <div className="mx-auto max-w-7xl space-y-4">

          <div className="flex items-center gap-3">
            <p className="text-sm text-slate-500">
              총 <span className="font-semibold text-slate-900">{total.toLocaleString()}</span>개
            </p>
            <div className="flex rounded-lg border border-slate-200 bg-white text-sm">
              {(["all", "public", "unlisted", "private"] as const).map((v, i, arr) => (
                <a
                  key={v}
                  href={buildHref({ visibility: v, page: 1 })}
                  className={`px-3 py-1.5 transition-colors ${
                    visibility === v ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-50"
                  } ${i === 0 ? "rounded-l-lg" : i === arr.length - 1 ? "rounded-r-lg" : ""}`}
                >
                  {v === "all" ? "전체" : v === "public" ? "공개" : v === "unlisted" ? "미등록" : "비공개"}
                </a>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-5">제목</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-5">공개 설정</th>
                  <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-5">재생 시간</th>
                  <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-5">파일 크기</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-5">업로드일</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recordings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-slate-400">녹음이 없습니다.</td>
                  </tr>
                ) : (
                  recordings.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50">
                      <td className="max-w-[200px] truncate px-4 py-3 font-medium text-slate-900 sm:max-w-[240px] sm:px-5">
                        {rec.title ?? <span className="text-slate-300">제목 없음</span>}
                      </td>
                      <td className="px-4 py-3 sm:px-5">
                        <Badge variant={visibilityVariant(rec.visibility)}>
                          {rec.visibility === "public" ? "공개" : rec.visibility === "unlisted" ? "미등록" : "비공개"}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-slate-600 sm:px-5">
                        {formatDuration(rec.duration)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-slate-600 sm:px-5">
                        {formatSize(rec.fileSize)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-400 sm:px-5">
                        {new Date(rec.createdAt).toLocaleDateString("ko-KR")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1">
              {page > 1 && <a href={buildHref({ page: page - 1 })} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">이전</a>}
              <span className="px-3 py-1.5 text-sm text-slate-500">{page} / {totalPages}</span>
              {page < totalPages && <a href={buildHref({ page: page + 1 })} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">다음</a>}
            </div>
          )}

        </div>
      </main>
    </>
  );
}
