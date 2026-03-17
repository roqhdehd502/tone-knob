import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router";
import { TabCanvas } from "~/components/editor/TabCanvas";
import { Toolbar } from "~/components/editor/Toolbar";
import { InspectorPanel } from "~/components/editor/InspectorPanel";
import { PlaybackBar } from "~/components/editor/PlaybackBar";
import { useEditorStore } from "~/lib/editor-store";
import { useAudioPlayer } from "~/lib/audio/use-audio-player";
import { useAuth } from "~/lib/auth";
import { api } from "~/lib/api";
import type { Duration } from "~/types/tab";

export function meta() {
  return [
    { title: "새 타브 만들기 - Tone Knob" },
    { name: "description", content: "새 타브 만들기" },
  ];
}

export default function EditorNew() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [tabId, setTabId] = useState<string | null>(null);
  const [showInspector, setShowInspector] = useState(false);

  const editor = useEditorStore();
  const audio = useAudioPlayer(editor.tab);

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" || target.tagName === "TEXTAREA";

      if (!isInput) {
        if (e.key === "v" && !e.ctrlKey && !e.metaKey) editor.setTool("select");
        if (e.key === "n" && !e.ctrlKey && !e.metaKey) editor.setTool("note");
        if (e.key === "e" && !e.ctrlKey && !e.metaKey) editor.setTool("eraser");
        if (e.key === "m" && !e.ctrlKey && !e.metaKey) audio.toggleMetronome();
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
    if (!user) {
      navigate("/login");
      return;
    }
    setIsSaving(true);
    try {
      if (tabId) {
        await api.tabs.update(tabId, {
          title: editor.tab.title,
          artist: editor.tab.artist || undefined,
          content: editor.tab,
          isPublic,
        });
      } else {
        const result = await api.tabs.create({
          title: editor.tab.title,
          artist: editor.tab.artist || undefined,
          content: editor.tab,
          isPublic,
        });
        setTabId(result.id);
      }
      editor.markClean();
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setIsSaving(false);
    }
  }, [user, tabId, editor, isPublic, navigate]);

  const handleNoteClick = useCallback(
    (noteId: string, _sectionId: string, _measureId: string) => {
      if (editor.currentTool === "eraser") {
        editor.deleteNotes([noteId]);
      } else {
        editor.setSelectedNote(noteId);
      }
    },
    [editor],
  );

  const handleCellClick = useCallback(
    (
      sectionId: string,
      measureId: string,
      stringIndex: number,
      position: number,
    ) => {
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
    editor.addSection(`섹션 ${num}`);
  }, [editor]);

  const handleTogglePublish = useCallback(() => {
    setIsPublic((prev) => !prev);
  }, []);

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

      {/* 모바일 인스펙터 토글 */}
      <button
        type="button"
        className="fixed bottom-4 right-4 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-violet-600 text-white shadow-lg lg:hidden"
        onClick={() => setShowInspector((v) => !v)}
        title="타브 정보"
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

      {/* 모바일 오버레이 */}
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
