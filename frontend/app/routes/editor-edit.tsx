import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

import { InspectorPanel } from "~/components/editor/InspectorPanel";
import { PlaybackBar } from "~/components/editor/PlaybackBar";
import { TabCanvas } from "~/components/editor/TabCanvas";
import { Toolbar } from "~/components/editor/Toolbar";
import { useI18n } from "~/context/i18n";
import { api } from "~/lib/api";
import { getAudioEngine } from "~/lib/audio/audio-engine";
import { useAudioPlayer } from "~/lib/audio/use-audio-player";
import { useAuth } from "~/lib/auth";
import { useEditorStore } from "~/lib/editor-store";
import type { Duration } from "~/types/tab";
import { TECHNIQUE_META } from "~/types/tab";

export function meta() {
  return [{ title: "Edit Tab - Tone Knob" }, { name: "description", content: "Edit guitar tab" }];
}

export default function EditorEdit() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [isSaving, setIsSaving] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showInspector, setShowInspector] = useState(false);

  const editor = useEditorStore();
  const audio = useAudioPlayer(editor.tab);

  // 타브 데이터 로드
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.tabs
      .get(id)
      .then((tab) => {
        if (tab.content) {
          editor.setTab(tab.content);
        }
        setIsPublic(tab.isPublic);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA";

      if (!isInput) {
        if (e.key === "v" && !e.ctrlKey && !e.metaKey) editor.setTool("select");
        if (e.key === "n" && !e.ctrlKey && !e.metaKey) editor.setTool("note");
        if (e.key === "e" && !e.ctrlKey && !e.metaKey) editor.setTool("eraser");
        if (e.key === "m" && !e.ctrlKey && !e.metaKey && !e.shiftKey) audio.toggleMetronome();

        // Technique shortcuts
        if (editor.selectedNoteIds.size > 0) {
          const tech = TECHNIQUE_META.find((t) => t.shortcut === e.key);
          if (tech) {
            e.preventDefault();
            editor.toggleTechnique(tech.id);
          }
        }
        if (e.key === " ") {
          e.preventDefault();
          void audio.togglePlayPause();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        editor.undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        editor.redo();
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (!isInput && editor.selectedNoteIds.size > 0) {
          e.preventDefault();
          editor.deleteNotes([...editor.selectedNoteIds]);
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        void handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editor, audio]);

  const handleSave = useCallback(async () => {
    if (!user || !id) {
      navigate("/login");
      return;
    }
    setIsSaving(true);
    try {
      await api.tabs.update(id, {
        title: editor.tab.title,
        artist: editor.tab.artist || undefined,
        content: editor.tab,
        isPublic,
      });
      editor.markClean();
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setIsSaving(false);
    }
  }, [user, id, editor, isPublic, navigate]);

  const handleNoteClick = useCallback(
    (noteId: string) => {
      if (editor.currentTool === "eraser") {
        editor.deleteNotes([noteId]);
      } else {
        editor.setSelectedNote(noteId);
      }
    },
    [editor],
  );

  const handleCellClick = useCallback(
    (sectionId: string, measureId: string, stringIndex: number, position: number) => {
      if (editor.currentTool === "note") {
        editor.addNote(sectionId, measureId, {
          string: stringIndex,
          fret: editor.currentFret,
          duration: editor.currentDuration,
          position,
        });
      }
    },
    [editor],
  );

  const handleMeasureClick = useCallback(
    (measureId: string) => {
      editor.setSelectedMeasure(measureId);
    },
    [editor],
  );

  const handleAddMeasure = useCallback(() => {
    const sectionId = editor.selectedSectionId || editor.tab.sections[0]?.id;
    if (sectionId) editor.addMeasure(sectionId);
  }, [editor]);

  const handleAddSection = useCallback(() => {
    const num = editor.tab.sections.length + 1;
    editor.addSection(t("editor.defaultSection", { n: num }));
  }, [editor, t]);

  const handleTogglePublish = useCallback(() => {
    setIsPublic((prev) => !prev);
  }, []);

  const handleNotePreview = useCallback(
    (stringIndex: number, fret: number) => {
      const engine = getAudioEngine();
      engine.playNotePreview(stringIndex, fret, editor.tab.tuning, editor.currentDuration);
    },
    [editor.tab.tuning, editor.currentDuration],
  );

  const handleNoteUpdate = useCallback(
    (
      noteId: string,
      updates: Partial<
        Pick<import("~/types/tab").Note, "fret" | "string" | "position" | "duration">
      >,
    ) => {
      editor.updateNote(noteId, updates);
    },
    [editor],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-miami-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-gray-500 dark:text-gray-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-2 overflow-hidden lg:gap-4">
      <div className="flex min-w-0 flex-1 flex-col gap-2 overflow-hidden lg:gap-3">
        <Toolbar
          currentTool={editor.currentTool}
          currentDuration={editor.currentDuration}
          currentFret={editor.currentFret}
          canUndo={editor.canUndo}
          canRedo={editor.canRedo}
          isDirty={editor.isDirty}
          isPublic={isPublic}
          isSaving={isSaving}
          onToolChange={editor.setTool}
          onDurationChange={(d: Duration) => editor.setDuration(d)}
          onFretChange={(f: number) => editor.setFret(f)}
          onUndo={editor.undo}
          onRedo={editor.redo}
          onSave={handleSave}
          onTogglePublish={handleTogglePublish}
          onAddMeasure={handleAddMeasure}
          onAddSection={handleAddSection}
          selectedNoteTechniques={editor.selectedNoteTechniques}
          hasSelection={editor.selectedNoteIds.size > 0}
          onToggleTechnique={editor.toggleTechnique}
          onClearTechniques={editor.clearTechniques}
          onAddDirective={editor.addDirective}
        />

        <div className="flex-1 overflow-auto rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <TabCanvas
            sections={editor.tab.sections}
            tuning={editor.tab.tuning}
            selectedNoteIds={editor.selectedNoteIds}
            selectedMeasureId={editor.selectedMeasureId}
            currentTool={editor.currentTool}
            currentDuration={editor.currentDuration}
            currentFret={editor.currentFret}
            onNoteClick={handleNoteClick}
            onCellClick={handleCellClick}
            onMeasureClick={handleMeasureClick}
            onNotePreview={handleNotePreview}
            onNoteUpdate={handleNoteUpdate}
          />
        </div>

        <PlaybackBar
          state={audio.state}
          position={audio.position}
          bpm={editor.tab.bpm}
          metronome={audio.metronome}
          onPlay={() => void audio.play()}
          onPause={audio.pause}
          onStop={audio.stop}
          onToggleMetronome={audio.toggleMetronome}
        />
      </div>

      <button
        type="button"
        className="fixed bottom-4 right-4 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-miami-600 text-white shadow-lg lg:hidden"
        onClick={() => setShowInspector((v) => !v)}
        title={t("editor.mobileInspector")}
      >
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 3v18M3 12h18" />
        </svg>
      </button>

      {showInspector && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setShowInspector(false)}
        />
      )}

      <div
        className={`${
          showInspector ? "fixed inset-y-16 right-0 z-50" : "hidden"
        } lg:relative lg:inset-auto lg:z-auto lg:block`}
      >
        <InspectorPanel
          tab={editor.tab}
          onUpdateMeta={editor.updateTabMeta}
          onReorderSections={editor.reorderSections}
        />
      </div>
    </div>
  );
}
