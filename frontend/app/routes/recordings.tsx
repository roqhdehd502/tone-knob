import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";

import {
  Clock,
  Globe,
  Headphones,
  Link2,
  Loader2,
  Lock,
  Mic,
  Pause,
  Play,
  Share2,
  Square,
  Trash2,
  Upload,
} from "lucide-react";

import { PageLoader } from "~/components/common/PageLoader";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { useI18n } from "~/context/i18n";
import { api } from "~/lib/api";
import { useAuth } from "~/lib/auth";
import { cn } from "~/lib/utils";

export function meta() {
  return [
    { title: "Recordings - Tone Knob" },
    { name: "description", content: "Record and share your performances" },
  ];
}

type RecordingItem = {
  id: string;
  title: string;
  audioUrl: string;
  durationSeconds: number;
  visibility: string;
  playCount: number;
  createdAt: string;
  user?: { id: string; displayName: string };
};

const VISIBILITY_ICONS: Record<string, React.ReactNode> = {
  public: <Globe className="h-3.5 w-3.5 text-green-500" />,
  private: <Lock className="h-3.5 w-3.5 text-gray-400" />,
  unlisted: <Link2 className="h-3.5 w-3.5 text-amber-500" />,
};

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function RecordingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();

  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [title, setTitle] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private" | "unlisted">("public");
  const [uploading, setUploading] = useState(false);

  const [tab, setTab] = useState<"my" | "public">("my");
  const [recordings, setRecordings] = useState<RecordingItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  const loadRecordings = useCallback(async () => {
    setLoading(true);
    try {
      const result =
        tab === "my"
          ? await api.recordings.getMy({ page })
          : await api.recordings.getPublic({ page });
      setRecordings(result.data as RecordingItem[]);
      setTotal(result.total);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [tab, page]);

  useEffect(() => {
    if (!user) return;
    loadRecordings();
  }, [user, loadRecordings]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setRecordedBlob(blob);
        setRecordedUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((trk) => trk.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime((prev) => prev + 1), 1000);
    } catch {
      alert(t("recordings.micError"));
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const discardRecording = () => {
    setRecordedBlob(null);
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedUrl(null);
    setRecordingTime(0);
    setTitle("");
  };

  const handleUpload = async () => {
    if (!recordedBlob || !title.trim()) return;
    setUploading(true);
    try {
      const { url: audioUrl } = await api.media.upload(recordedBlob, {
        category: "recordings",
        fileName: "recording.webm",
      });
      await api.recordings.create({
        title: title.trim(),
        audioUrl,
        durationSeconds: recordingTime,
        visibility,
      });
      discardRecording();
      loadRecordings();
    } catch {
      alert(t("recordings.uploadError"));
    } finally {
      setUploading(false);
    }
  };

  const togglePlay = (id: string, audioUrl: string) => {
    if (playingId === id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(audioUrl);
    audio.onended = () => setPlayingId(null);
    audio.play();
    audioRef.current = audio;
    setPlayingId(id);
    api.recordings.play(id).catch(() => {});
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("recordings.confirmDelete"))) return;
    try {
      await api.recordings.delete(id);
      loadRecordings();
    } catch {
      alert(t("recordings.deleteError"));
    }
  };

  const handleShare = async (id: string) => {
    try {
      const { url } = await api.recordings.getShareUrl(id);
      await navigator.clipboard.writeText(window.location.origin + url);
      alert(t("recordings.shareSuccess"));
    } catch {
      alert(t("recordings.shareError"));
    }
  };

  if (authLoading || !user) {
    return <PageLoader />;
  }

  const totalPages = Math.ceil(total / 20);

  const visibilityLabel: Record<"public" | "private" | "unlisted", string> = {
    public: t("common.public"),
    private: t("common.private"),
    unlisted: t("common.linkedShare"),
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          {t("recordings.heading")}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t("recordings.subtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Mic className="h-4 w-4 text-red-500" />
            {t("recordings.sectionTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!recordedBlob ? (
            <div className="flex flex-col items-center gap-4">
              <div className="text-3xl font-mono font-bold text-gray-700 dark:text-gray-300">
                {formatDuration(recordingTime)}
              </div>
              {isRecording ? (
                <Button
                  onClick={stopRecording}
                  className="h-14 w-14 rounded-full bg-red-600 hover:bg-red-700"
                >
                  <Square className="h-6 w-6" />
                </Button>
              ) : (
                <Button
                  onClick={startRecording}
                  className="h-14 w-14 rounded-full bg-red-600 hover:bg-red-700"
                >
                  <Mic className="h-6 w-6" />
                </Button>
              )}
              <p className="text-xs text-gray-400">
                {isRecording ? t("recordings.recording") : t("recordings.recordHint")}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recordedUrl && <audio controls src={recordedUrl} className="w-full" />}

              <Input
                placeholder={t("recordings.titlePlaceholder")}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              <div className="flex gap-2">
                {(["public", "private", "unlisted"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setVisibility(v)}
                    className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      visibility === v
                        ? "bg-miami-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
                    }`}
                  >
                    {VISIBILITY_ICONS[v]}
                    {visibilityLabel[v]}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleUpload}
                  disabled={uploading || !title.trim()}
                  className="flex-1 bg-miami-600 hover:bg-miami-700"
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Upload className="mr-1 h-4 w-4" /> {t("recordings.upload")}
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={discardRecording}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800/50">
        {(["my", "public"] as const).map((tabKey) => (
          <button
            key={tabKey}
            onClick={() => {
              setTab(tabKey);
              setPage(1);
            }}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
              tab === tabKey
                ? "bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-white"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300",
            )}
          >
            {tabKey === "my" ? t("recordings.myRecordings") : t("recordings.publicRecordings")}
          </button>
        ))}
      </div>

      {loading ? (
        <Card>
          <CardContent>
            <PageLoader size="sm" />
          </CardContent>
        </Card>
      ) : recordings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <Headphones className="h-10 w-10 text-gray-300 dark:text-gray-700" />
            <p className="mt-2 text-sm text-gray-400">{t("recordings.noRecordings")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {recordings.map((rec) => (
            <div
              key={rec.id}
              className="flex items-center gap-3 rounded-xl border border-gray-200/80 bg-white p-3 shadow-sm dark:border-gray-800/80 dark:bg-gray-900"
            >
              <button
                onClick={() => togglePlay(rec.id, rec.audioUrl)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-miami-100 text-miami-600 transition-colors hover:bg-miami-200 dark:bg-miami-900/30"
              >
                {playingId === rec.id ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="ml-0.5 h-4 w-4" />
                )}
              </button>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                  {rec.title}
                </p>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDuration(rec.durationSeconds)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Headphones className="h-3 w-3" />
                    {rec.playCount}
                  </span>
                  {VISIBILITY_ICONS[rec.visibility]}
                  {rec.user && tab === "public" && <span>{rec.user.displayName}</span>}
                </div>
              </div>

              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => handleShare(rec.id)}>
                  <Share2 className="h-4 w-4" />
                </Button>
                {tab === "my" && (
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(rec.id)}>
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </Button>
                )}
              </div>
            </div>
          ))}

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                {t("common.prev")}
              </Button>
              <span className="flex items-center text-xs text-gray-500">
                {page} / {totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                {t("common.next")}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
