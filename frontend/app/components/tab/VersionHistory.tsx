import { useEffect, useState } from "react";

import { Clock, GitCompare, History, RotateCcw } from "lucide-react";

import { Button } from "~/components/ui/button";
import { useI18n } from "~/context/i18n";
import { api } from "~/lib/api";
import type { TabDocument, TabVersion } from "~/types/tab";

interface VersionHistoryProps {
  tabId: string;
  isOwner: boolean;
  onRestore: (content: TabDocument) => void;
}

export function VersionHistory({ tabId, isOwner, onRestore }: VersionHistoryProps) {
  const { t, dateLocale } = useI18n();
  const [versions, setVersions] = useState<TabVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<TabVersion | null>(null);
  const [compareMode, setCompareMode] = useState(false);

  useEffect(() => {
    loadVersions();
  }, [tabId]);

  const loadVersions = async () => {
    setLoading(true);
    try {
      const data = await api.tabs.versions(tabId);
      setVersions(data);
    } catch {
      // 에러 무시
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = (version: TabVersion) => {
    if (!isOwner) return;
    onRestore(version.content);
  };

  const getSectionDiff = (
    oldDoc: TabDocument,
    newDoc: TabDocument,
  ): { added: number; removed: number; modified: number } => {
    const oldSections = new Set(oldDoc.sections.map((s) => s.id));
    const newSections = new Set(newDoc.sections.map((s) => s.id));

    let added = 0;
    let removed = 0;
    let modified = 0;

    newSections.forEach((id) => {
      if (!oldSections.has(id)) added++;
    });
    oldSections.forEach((id) => {
      if (!newSections.has(id)) removed++;
    });

    oldDoc.sections.forEach((oldSection) => {
      const newSection = newDoc.sections.find((s) => s.id === oldSection.id);
      if (newSection) {
        const oldNotes = oldSection.measures.reduce((sum, m) => sum + m.notes.length, 0);
        const newNotes = newSection.measures.reduce((sum, m) => sum + m.notes.length, 0);
        if (oldNotes !== newNotes) modified++;
      }
    });

    return { added, removed, modified };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-sm text-gray-400">{t("versionHistory.loading")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {t("versionHistory.title", { n: versions.length })}
          </h3>
        </div>
        {versions.length > 1 && (
          <Button
            variant={compareMode ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setCompareMode(!compareMode);
              setSelectedVersion(null);
            }}
          >
            <GitCompare className="mr-1 h-4 w-4" />
            {t("versionHistory.compare")}
          </Button>
        )}
      </div>

      {versions.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-400">{t("versionHistory.noVersions")}</p>
      ) : (
        <div className="space-y-2">
          {versions.map((version, index) => {
            const prevVersion = versions[index + 1];
            const diff =
              prevVersion && compareMode
                ? getSectionDiff(prevVersion.content, version.content)
                : null;

            const noteCount = version.content.sections.reduce(
              (sum, s) => sum + s.measures.reduce((ms, m) => ms + m.notes.length, 0),
              0,
            );
            const barCount = version.content.sections.reduce(
              (sum, s) => sum + s.measures.length,
              0,
            );

            return (
              <div
                key={version.id}
                className={`rounded-lg border p-3 transition-colors ${
                  selectedVersion?.id === version.id
                    ? "border-miami-500 bg-miami-50 dark:border-miami-400 dark:bg-miami-900/20"
                    : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-miami-100 text-xs font-bold text-miami-700 dark:bg-miami-900/40 dark:text-miami-300">
                      {version.versionNumber}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {version.changeDescription ||
                          t("versionHistory.default", { n: version.versionNumber })}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        {new Date(version.createdAt).toLocaleString(dateLocale, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {version.creator && (
                          <span className="ml-1">
                            · {version.creator.displayName || version.creator.username}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-1">
                    {compareMode && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setSelectedVersion(selectedVersion?.id === version.id ? null : version)
                        }
                      >
                        {t("versionHistory.select")}
                      </Button>
                    )}
                    {isOwner && index > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRestore(version)}
                        title={t("versionHistory.restore")}
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>

                {compareMode && diff && (
                  <div className="mt-2 flex gap-3 text-xs">
                    {diff.added > 0 && (
                      <span className="text-green-600">
                        {t("versionHistory.diffAdded", { n: diff.added })}
                      </span>
                    )}
                    {diff.removed > 0 && (
                      <span className="text-red-500">
                        {t("versionHistory.diffRemoved", { n: diff.removed })}
                      </span>
                    )}
                    {diff.modified > 0 && (
                      <span className="text-amber-500">
                        {t("versionHistory.diffModified", { n: diff.modified })}
                      </span>
                    )}
                    {diff.added === 0 && diff.removed === 0 && diff.modified === 0 && (
                      <span className="text-gray-400">{t("versionHistory.noChange")}</span>
                    )}
                  </div>
                )}

                {compareMode && selectedVersion?.id === version.id && (
                  <div className="mt-3 rounded border border-gray-200 bg-gray-50 p-2 dark:border-gray-600 dark:bg-gray-700">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
                      {t("versionHistory.summary")}
                    </p>
                    <div className="mt-1 grid grid-cols-2 gap-2 text-xs text-gray-500">
                      <div>
                        {t("versionHistory.sections", { n: version.content.sections.length })}
                      </div>
                      <div>BPM: {version.content.bpm}</div>
                      <div>{t("versionHistory.noteCount", { n: noteCount })}</div>
                      <div>{t("versionHistory.barCount", { n: barCount })}</div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
