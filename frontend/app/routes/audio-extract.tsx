import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";

import {
  AudioWaveform,
  CheckCircle2,
  ChevronDown,
  Clock,
  FileAudio,
  Loader2,
  Music,
  RefreshCw,
  Upload,
  XCircle,
} from "lucide-react";

import { PageLoader } from "~/components/common/PageLoader";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { useI18n } from "~/context/i18n";
import { api } from "~/lib/api";
import { useAuth } from "~/lib/auth";

export function meta() {
  return [
    { title: "Audio Tab Extractor - Tone Knob" },
    { name: "description", content: "Extract guitar tabs from audio files automatically" },
  ];
}

type AiJobStatus = "queued" | "processing" | "completed" | "failed";

interface AiJob {
  id: string;
  status: AiJobStatus;
  progress: number;
  inputData: { audioUrl?: string; instrument?: string; tuning?: string };
  outputData?: { title?: string; content?: string; confidence?: number } | null;
  errorMessage?: string | null;
  createdAt: string;
}

export default function AudioExtractPage() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const STATUS_CONFIG: Record<
    AiJobStatus,
    { icon: React.ReactNode; label: string; color: string }
  > = {
    queued: {
      icon: <Clock className="h-4 w-4" />,
      label: t("audioExtract.status.queued"),
      color: "text-amber-500",
    },
    processing: {
      icon: <Loader2 className="h-4 w-4 animate-spin" />,
      label: t("audioExtract.status.processing"),
      color: "text-blue-500",
    },
    completed: {
      icon: <CheckCircle2 className="h-4 w-4" />,
      label: t("audioExtract.status.completed"),
      color: "text-green-500",
    },
    failed: {
      icon: <XCircle className="h-4 w-4" />,
      label: t("audioExtract.status.failed"),
      color: "text-red-500",
    },
  };

  const INSTRUMENTS: { value: string; label: string }[] = [
    { value: "guitar", label: t("audioExtract.instrument.guitar") },
    { value: "bass", label: t("audioExtract.instrument.bass") },
    { value: "ukulele", label: t("audioExtract.instrument.ukulele") },
    { value: "banjo", label: t("audioExtract.instrument.banjo") },
  ];

  const TUNINGS: { value: string; label: string }[] = [
    { value: "standard", label: t("audioExtract.tuning.standard") },
    { value: "dropD", label: t("audioExtract.tuning.dropD") },
    { value: "openG", label: t("audioExtract.tuning.openG") },
    { value: "dadgad", label: t("audioExtract.tuning.dadgad") },
  ];

  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [instrument, setInstrument] = useState("guitar");
  const [tuning, setTuning] = useState("standard");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const [jobs, setJobs] = useState<AiJob[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading, navigate]);

  const loadJobs = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.aiGen.getMyJobs();
      const extracted = (res.data as AiJob[]).filter((j) => j.inputData.audioUrl !== undefined);
      setJobs(extracted);
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
    const timer = setInterval(loadJobs, 3000);
    return () => clearInterval(timer);
  }, [jobs, loadJobs]);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("audio/")) {
      alert(t("audioExtract.errorOnlyAudio"));
      return;
    }
    setAudioFile(file);
    setAudioUrl(URL.createObjectURL(file));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioFile) return;
    setUploading(true);
    try {
      const { url } = await api.media.upload(audioFile, { category: "audio-extract" });
      await api.aiGen.createAudioExtractionJob({
        audioUrl: url,
        instrument,
        tuning,
      });
      setAudioFile(null);
      setAudioUrl("");
      await loadJobs();
    } catch {
      alert(t("audioExtract.errorSubmit"));
    } finally {
      setUploading(false);
    }
  };

  if (authLoading || !user) {
    return <PageLoader />;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          {t("audioExtract.heading")}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t("audioExtract.subtitle")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AudioWaveform className="h-4 w-4 text-cyan-500" />
            {t("audioExtract.formTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed py-10 transition-colors ${
                dragOver
                  ? "border-cyan-400 bg-cyan-50 dark:bg-cyan-900/20"
                  : "border-gray-300 hover:border-gray-400 dark:border-gray-700 dark:hover:border-gray-600"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />

              {audioFile ? (
                <>
                  <FileAudio className="h-10 w-10 text-cyan-500" />
                  <p className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {audioFile.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  {audioUrl && <audio controls src={audioUrl} className="mt-3 w-full max-w-xs" />}
                </>
              ) : (
                <>
                  <Upload className="h-10 w-10 text-gray-300 dark:text-gray-600" />
                  <p className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t("audioExtract.dragHint")}
                  </p>
                  <p className="text-xs text-gray-400">{t("audioExtract.fileFormats")}</p>
                </>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  {t("audioExtract.instrumentLabel")}
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
                  {t("audioExtract.tuningLabel")}
                </label>
                <div className="relative">
                  <select
                    value={tuning}
                    onChange={(e) => setTuning(e.target.value)}
                    className="w-full appearance-none rounded-md border border-gray-300 bg-white px-3 py-2 pr-8 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  >
                    {TUNINGS.map((tun) => (
                      <option key={tun.value} value={tun.value}>
                        {tun.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={uploading || !audioFile}
              className="w-full bg-cyan-600 hover:bg-cyan-700"
            >
              {uploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <AudioWaveform className="mr-2 h-4 w-4" />
              )}
              {t("audioExtract.uploadBtn")}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          {t("audioExtract.historyTitle")}
        </h2>
        <Button size="sm" variant="ghost" onClick={loadJobs}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {loadingJobs ? (
        <Card>
          <CardContent className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-600" />
          </CardContent>
        </Card>
      ) : jobs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <Music className="h-10 w-10 text-gray-300 dark:text-gray-700" />
            <p className="mt-2 text-sm text-gray-400">{t("audioExtract.noHistory")}</p>
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
                      {job.inputData.audioUrl?.split("/").pop() ?? t("audioExtract.audioFile")}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-400">
                      {job.inputData.instrument && <span>{job.inputData.instrument}</span>}
                      {job.inputData.tuning && <span>{job.inputData.tuning}</span>}
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
                        className="h-full bg-cyan-500 transition-all duration-300"
                        style={{ width: `${job.progress}%` }}
                      />
                    </div>
                    <p className="mt-1 text-right text-xs text-gray-400">{job.progress}%</p>
                  </div>
                )}

                {job.status === "completed" && job.outputData?.title && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between rounded-md bg-green-50 px-3 py-2 dark:bg-green-900/20">
                      <span className="text-sm text-green-700 dark:text-green-400">
                        {job.outputData.title}
                      </span>
                      <Button size="sm" variant="ghost" onClick={() => navigate("/editor/new")}>
                        {t("audioExtract.openEditor")}
                      </Button>
                    </div>
                    {job.outputData.confidence != null && (
                      <p className="text-xs text-gray-400">
                        {t("audioExtract.confidence", {
                          n: Math.round((job.outputData.confidence as number) * 100),
                        })}
                      </p>
                    )}
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
