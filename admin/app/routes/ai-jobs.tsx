import type { Route } from "./+types/ai-jobs";

import { Topbar } from "~/components/layout/Topbar";
import { Badge } from "~/components/ui/Badge";
import { requireAdmin } from "~/service/session.server";
import { getSupabase } from "~/service/supabase.server";
import type { AiJobRow } from "~/types/db";

const PAGE_SIZE = 20;

export function meta() {
  return [{ title: "AI 작업 - Tone Knob Admin" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const admin = await requireAdmin(request);
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
  const status = url.searchParams.get("status") ?? "all";
  const type = url.searchParams.get("type") ?? "all";

  const supabase = getSupabase();
  const from = (page - 1) * PAGE_SIZE;

  let query = supabase
    .from("ai_jobs")
    .select(
      "id, userId, type, status, errorMessage, progress, externalJobId, createdAt, updatedAt",
      { count: "exact" },
    )
    .order("createdAt", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  if (status !== "all") query = query.eq("status", status);
  if (type !== "all") query = query.eq("type", type);

  const { data, count } = await query;
  const jobs = (data ?? []) as unknown as AiJobRow[];

  const [queuedRes, failedRes] = await Promise.all([
    supabase.from("ai_jobs").select("*", { count: "exact", head: true }).eq("status", "queued"),
    supabase.from("ai_jobs").select("*", { count: "exact", head: true }).eq("status", "failed"),
  ]);

  return {
    admin,
    jobs,
    total: count ?? 0,
    page,
    status,
    type,
    totalPages: Math.ceil((count ?? 0) / PAGE_SIZE),
    queuedCount: queuedRes.count ?? 0,
    failedCount: failedRes.count ?? 0,
  };
}

function statusVariant(s: string) {
  if (s === "completed") return "success" as const;
  if (s === "processing") return "info" as const;
  if (s === "failed") return "danger" as const;
  if (s === "queued") return "warning" as const;
  return "default" as const;
}

function statusLabel(s: string) {
  if (s === "queued") return "대기";
  if (s === "processing") return "처리 중";
  if (s === "completed") return "완료";
  if (s === "failed") return "실패";
  return s;
}

function typeLabel(t: string) {
  if (t === "tab_generation") return "타브 생성";
  if (t === "audio_extraction") return "오디오 추출";
  return t;
}

export default function AiJobsPage({ loaderData }: Route.ComponentProps) {
  const { admin, jobs, total, page, status, type, totalPages, queuedCount, failedCount } = loaderData;

  const buildHref = (overrides: Record<string, string | number>) => {
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    if (type !== "all") params.set("type", type);
    params.set("page", String(page));
    Object.entries(overrides).forEach(([k, v]) => params.set(k, String(v)));
    return `/ai-jobs?${params.toString()}`;
  };

  const statusOptions = ["all", "queued", "processing", "completed", "failed"] as const;
  const typeOptions = ["all", "tab_generation", "audio_extraction"] as const;

  return (
    <>
      <Topbar adminName={admin.adminName} adminEmail={admin.adminEmail} title="AI 작업 모니터링" />
      <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
        <div className="mx-auto max-w-7xl space-y-4">

          {/* Summary */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium text-slate-500">전체</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{total.toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-medium text-amber-700">대기 중</p>
              <p className="mt-1 text-2xl font-bold text-amber-800">{queuedCount.toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-xs font-medium text-red-700">실패</p>
              <p className="mt-1 text-2xl font-bold text-red-800">{failedCount.toLocaleString()}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
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
                  {v === "all" ? "전체 상태" : statusLabel(v)}
                </a>
              ))}
            </div>
            <div className="flex rounded-lg border border-slate-200 bg-white text-sm">
              {typeOptions.map((v, i) => (
                <a
                  key={v}
                  href={buildHref({ type: v, page: 1 })}
                  className={`px-3 py-1.5 transition-colors ${
                    type === v ? "bg-violet-600 text-white" : "text-slate-600 hover:bg-slate-50"
                  } ${i === 0 ? "rounded-l-lg" : i === typeOptions.length - 1 ? "rounded-r-lg" : ""}`}
                >
                  {v === "all" ? "전체 타입" : typeLabel(v)}
                </a>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-5">타입</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-5">상태</th>
                  <th className="px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-5">진행률</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-5">에러 메시지</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-5">생성일</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-5">업데이트</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {jobs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-slate-400">AI 작업이 없습니다.</td>
                  </tr>
                ) : (
                  jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 sm:px-5">
                        <Badge variant={job.type === "tab_generation" ? "info" : "default"}>
                          {typeLabel(job.type)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 sm:px-5">
                        <Badge variant={statusVariant(job.status)}>{statusLabel(job.status)}</Badge>
                      </td>
                      <td className="px-4 py-3 text-center sm:px-5">
                        <div className="flex items-center justify-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-blue-500"
                              style={{ width: `${job.progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-500">{job.progress}%</span>
                        </div>
                      </td>
                      <td className="max-w-[200px] truncate px-4 py-3 text-xs text-red-500 sm:px-5">
                        {job.errorMessage ?? <span className="text-slate-300">—</span>}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-400 sm:px-5">
                        {new Date(job.createdAt).toLocaleDateString("ko-KR")}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-400 sm:px-5">
                        {new Date(job.updatedAt).toLocaleDateString("ko-KR")}
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
