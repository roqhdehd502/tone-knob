import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  Sparkles,
  Send,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  Music,
  RefreshCw,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { useAuth } from "~/lib/auth";
import { api } from "~/lib/api";

export function meta() {
  return [
    { title: "AI 타브 생성 - Tone Knob" },
    { name: "description", content: "AI로 타브를 자동 생성하세요" },
  ];
}

type AiJobStatus = "queued" | "processing" | "completed" | "failed";

interface AiJob {
  id: string;
  status: AiJobStatus;
  progress: number;
  inputData: { prompt?: string; genre?: string; instrument?: string; difficulty?: string; measures?: number };
  outputData?: { title?: string; content?: string; instrument?: string } | null;
  errorMessage?: string | null;
  createdAt: string;
}

const STATUS_CONFIG: Record<AiJobStatus, { icon: React.ReactNode; label: string; color: string }> = {
  queued: { icon: <Clock className="h-4 w-4" />, label: "대기 중", color: "text-amber-500" },
  processing: { icon: <Loader2 className="h-4 w-4 animate-spin" />, label: "생성 중", color: "text-blue-500" },
  completed: { icon: <CheckCircle2 className="h-4 w-4" />, label: "완료", color: "text-green-500" },
  failed: { icon: <XCircle className="h-4 w-4" />, label: "실패", color: "text-red-500" },
};

const GENRES = ["록", "팝", "재즈", "블루스", "클래식", "메탈", "컨트리", "R&B"];
const INSTRUMENTS = ["기타", "베이스", "우쿨렐레", "밴조"];
const DIFFICULTIES = ["초급", "중급", "고급"];

export default function AiGeneratePage() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [prompt, setPrompt] = useState("");
  const [genre, setGenre] = useState("");
  const [instrument, setInstrument] = useState("기타");
  const [difficulty, setDifficulty] = useState("중급");
  const [measures, setMeasures] = useState(16);
  const [submitting, setSubmitting] = useState(false);

  const [jobs, setJobs] = useState<AiJob[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading, navigate]);

  const loadJobs = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.aiGen.getMyJobs();
      setJobs(res.data as AiJob[]);
    } catch {
      // ignore
    } finally {
      setLoadingJobs(false);
    }
  }, [user]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  // 진행 중인 작업 폴링
  useEffect(() => {
    const hasActive = jobs.some(
      (j) => j.status === "queued" || j.status === "processing",
    );
    if (!hasActive) return;

    const timer = setInterval(async () => {
      await loadJobs();
    }, 3000);

    return () => clearInterval(timer);
  }, [jobs, loadJobs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setSubmitting(true);
    try {
      await api.aiGen.createTabJob({
        prompt: prompt.trim(),
        genre: genre || undefined,
        instrument,
        difficulty,
        measures,
      });
      setPrompt("");
      await loadJobs();
    } catch {
      alert("생성 요청 중 오류가 발생했습니다");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6 flex items-center gap-2">
        <Sparkles className="h-6 w-6 text-violet-500" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          AI 타브 생성
        </h1>
      </div>

      {/* 생성 폼 */}
      <form
        onSubmit={handleSubmit}
        className="mb-8 space-y-4 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            프롬프트 <span className="text-red-500">*</span>
          </label>
          <Input
            placeholder="예: 쓸쓸한 느낌의 마이너 발라드, G 마이너 코드 진행으로..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {/* 장르 */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              장르
            </label>
            <div className="relative">
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full appearance-none rounded-md border border-gray-300 bg-white px-3 py-2 pr-8 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value="">선택 안함</option>
                {GENRES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>

          {/* 악기 */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              악기
            </label>
            <div className="relative">
              <select
                value={instrument}
                onChange={(e) => setInstrument(e.target.value)}
                className="w-full appearance-none rounded-md border border-gray-300 bg-white px-3 py-2 pr-8 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                {INSTRUMENTS.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>

          {/* 난이도 */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              난이도
            </label>
            <div className="relative">
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full appearance-none rounded-md border border-gray-300 bg-white px-3 py-2 pr-8 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>

          {/* 마디 수 */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              마디 수
            </label>
            <Input
              type="number"
              min={4}
              max={64}
              value={measures}
              onChange={(e) => setMeasures(parseInt(e.target.value, 10))}
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={submitting || !prompt.trim()}
          className="w-full bg-violet-600 hover:bg-violet-700"
        >
          {submitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          생성 요청
        </Button>
      </form>

      {/* 작업 목록 */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-gray-900 dark:text-white">
          생성 내역
        </h2>
        <Button size="sm" variant="ghost" onClick={loadJobs}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {loadingJobs ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <Music className="h-10 w-10 text-gray-300 dark:text-gray-700" />
          <p className="mt-2 text-sm text-gray-400">생성 내역이 없습니다</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => {
            const cfg = STATUS_CONFIG[job.status];
            return (
              <div
                key={job.id}
                className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                      {job.inputData.prompt ?? "–"}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-400">
                      {job.inputData.instrument && (
                        <span>{job.inputData.instrument}</span>
                      )}
                      {job.inputData.genre && (
                        <span>{job.inputData.genre}</span>
                      )}
                      {job.inputData.difficulty && (
                        <span>{job.inputData.difficulty}</span>
                      )}
                      {job.inputData.measures && (
                        <span>{job.inputData.measures}마디</span>
                      )}
                    </div>
                  </div>
                  <span className={`flex items-center gap-1 text-xs font-medium ${cfg.color}`}>
                    {cfg.icon}
                    {cfg.label}
                  </span>
                </div>

                {/* 진행바 */}
                {(job.status === "queued" || job.status === "processing") && (
                  <div className="mt-3">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                      <div
                        className="h-full bg-violet-500 transition-all duration-300"
                        style={{ width: `${job.progress}%` }}
                      />
                    </div>
                    <p className="mt-1 text-right text-xs text-gray-400">
                      {job.progress}%
                    </p>
                  </div>
                )}

                {/* 완료 결과 */}
                {job.status === "completed" && job.outputData?.title && (
                  <div className="mt-3 flex items-center justify-between rounded-md bg-green-50 px-3 py-2 dark:bg-green-900/20">
                    <span className="text-sm text-green-700 dark:text-green-400">
                      {job.outputData.title}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => navigate("/editor/new")}
                    >
                      에디터에서 열기
                    </Button>
                  </div>
                )}

                {/* 실패 메시지 */}
                {job.status === "failed" && job.errorMessage && (
                  <p className="mt-2 text-xs text-red-500">{job.errorMessage}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
