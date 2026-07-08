import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";

import {
  CheckCircle2,
  ChevronDown,
  Clock,
  Loader2,
  Music,
  RefreshCw,
  Send,
  Sparkles,
  XCircle,
} from "lucide-react";

import { PageLoader } from "~/components/common/PageLoader";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { useI18n } from "~/context/i18n";
import { api } from "~/lib/api";
import { useAuth } from "~/lib/auth";

export function meta() {
  return [
    { title: "AI Tab Generator - Tone Knob" },
    { name: "description", content: "Generate guitar tabs automatically with AI" },
  ];
}

type AiJobStatus = "queued" | "processing" | "completed" | "failed";

interface AiJob {
  id: string;
  status: AiJobStatus;
  progress: number;
  inputData: {
    prompt?: string;
    genre?: string;
    instrument?: string;
    difficulty?: string;
    measures?: number;
  };
  outputData?: { title?: string; content?: string; instrument?: string } | null;
  errorMessage?: string | null;
  createdAt: string;
}

export default function AiGeneratePage() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();

  const STATUS_CONFIG: Record<
    AiJobStatus,
    { icon: React.ReactNode; label: string; color: string }
  > = {
    queued: {
      icon: <Clock className="h-4 w-4" />,
      label: t("aiGenerate.status.queued"),
      color: "text-amber-500",
    },
    processing: {
      icon: <Loader2 className="h-4 w-4 animate-spin" />,
      label: t("aiGenerate.status.processing"),
      color: "text-blue-500",
    },
    completed: {
      icon: <CheckCircle2 className="h-4 w-4" />,
      label: t("aiGenerate.status.completed"),
      color: "text-green-500",
    },
    failed: {
      icon: <XCircle className="h-4 w-4" />,
      label: t("aiGenerate.status.failed"),
      color: "text-red-500",
    },
  };

  const GENRES: { value: string; label: string }[] = [
    { value: "rock", label: t("aiGenerate.genre.rock") },
    { value: "pop", label: t("aiGenerate.genre.pop") },
    { value: "jazz", label: t("aiGenerate.genre.jazz") },
    { value: "blues", label: t("aiGenerate.genre.blues") },
    { value: "classical", label: t("aiGenerate.genre.classical") },
    { value: "metal", label: t("aiGenerate.genre.metal") },
    { value: "country", label: t("aiGenerate.genre.country") },
    { value: "rnb", label: t("aiGenerate.genre.rnb") },
  ];

  const INSTRUMENTS: { value: string; label: string }[] = [
    { value: "guitar", label: t("aiGenerate.instrument.guitar") },
    { value: "bass", label: t("aiGenerate.instrument.bass") },
    { value: "ukulele", label: t("aiGenerate.instrument.ukulele") },
    { value: "banjo", label: t("aiGenerate.instrument.banjo") },
  ];

  const DIFFICULTIES: { value: string; label: string }[] = [
    { value: "beginner", label: t("aiGenerate.difficulty.beginner") },
    { value: "intermediate", label: t("aiGenerate.difficulty.intermediate") },
    { value: "advanced", label: t("aiGenerate.difficulty.advanced") },
  ];

  const [prompt, setPrompt] = useState("");
  const [genre, setGenre] = useState("");
  const [instrument, setInstrument] = useState("guitar");
  const [difficulty, setDifficulty] = useState("intermediate");
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

  useEffect(() => {
    const hasActive = jobs.some((j) => j.status === "queued" || j.status === "processing");
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
      alert(t("aiGenerate.errorSubmit"));
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || !user) {
    return <PageLoader />;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          {t("aiGenerate.heading")}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t("aiGenerate.subtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-miami-500" />
            {t("aiGenerate.formTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("aiGenerate.promptLabel")}{" "}
                <span className="text-red-500">{t("aiGenerate.promptRequired")}</span>
              </label>
              <Input
                placeholder={t("aiGenerate.promptPlaceholder")}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  {t("aiGenerate.genreLabel")}
                </label>
                <div className="relative">
                  <select
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="w-full appearance-none rounded-md border border-gray-300 bg-white px-3 py-2 pr-8 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="">{t("aiGenerate.genreNone")}</option>
                    {GENRES.map((g) => (
                      <option key={g.value} value={g.value}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  {t("aiGenerate.instrumentLabel")}
                </label>
                <div className="relative">
                  <select
                    value={instrument}
                    onChange={(e) => setInstrument(e.target.value)}
                    className="w-full appearance-none rounded-md border border-gray-300 bg-white px-3 py-2 pr-8 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  >
                    {INSTRUMENTS.map((i) => (
                      <option key={i.value} value={i.value}>
                        {i.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  {t("aiGenerate.difficultyLabel")}
                </label>
                <div className="relative">
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full appearance-none rounded-md border border-gray-300 bg-white px-3 py-2 pr-8 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  >
                    {DIFFICULTIES.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  {t("aiGenerate.barsLabel")}
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
              className="w-full bg-miami-600 hover:bg-miami-700"
            >
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              {t("aiGenerate.submitBtn")}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          {t("aiGenerate.historyTitle")}
        </h2>
        <Button size="sm" variant="ghost" onClick={loadJobs}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {loadingJobs ? (
        <Card>
          <CardContent>
            <PageLoader size="sm" />
          </CardContent>
        </Card>
      ) : jobs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <Music className="h-10 w-10 text-gray-300 dark:text-gray-700" />
            <p className="mt-2 text-sm text-gray-400">{t("aiGenerate.noHistory")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {jobs.map((job) => {
            const cfg = STATUS_CONFIG[job.status];
            return (
              <div
                key={job.id}
                className="rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm dark:border-gray-800/80 dark:bg-gray-900"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                      {job.inputData.prompt ?? "–"}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-400">
                      {job.inputData.instrument && <span>{job.inputData.instrument}</span>}
                      {job.inputData.genre && <span>{job.inputData.genre}</span>}
                      {job.inputData.difficulty && <span>{job.inputData.difficulty}</span>}
                      {job.inputData.measures && (
                        <span>{t("aiGenerate.bars", { n: job.inputData.measures })}</span>
                      )}
                    </div>
                  </div>
                  <span className={`flex items-center gap-1 text-xs font-medium ${cfg.color}`}>
                    {cfg.icon}
                    {cfg.label}
                  </span>
                </div>

                {(job.status === "queued" || job.status === "processing") && (
                  <div className="mt-3">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                      <div
                        className="h-full bg-miami-500 transition-all duration-300"
                        style={{ width: `${job.progress}%` }}
                      />
                    </div>
                    <p className="mt-1 text-right text-xs text-gray-400">{job.progress}%</p>
                  </div>
                )}

                {job.status === "completed" && job.outputData?.title && (
                  <div className="mt-3 flex items-center justify-between rounded-md bg-green-50 px-3 py-2 dark:bg-green-900/20">
                    <span className="text-sm text-green-700 dark:text-green-400">
                      {job.outputData.title}
                    </span>
                    <Button size="sm" variant="ghost" onClick={() => navigate("/editor/new")}>
                      {t("aiGenerate.openEditor")}
                    </Button>
                  </div>
                )}

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
