import { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { TabCanvas } from "~/components/editor/TabCanvas";
import { Toolbar } from "~/components/editor/Toolbar";
import { InspectorPanel } from "~/components/editor/InspectorPanel";
import { useEditorStore } from "~/lib/editor-store";
import { useAuth } from "~/lib/auth";
import { api } from "~/lib/api";
import type { Duration } from "~/types/tab";

export function meta() {
  return [
    { title: "타브 편집 - Tone Knob" },
    { name: "description", content: "타브 편집" },
  ];
}

export default function EditorEdit() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const editor = useEditorStore();

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "v" && !e.ctrlKey && !e.metaKey) editor.setTool("select");
      if (e.key === "n" && !e.ctrlKey && !e.metaKey) editor.setTool("note");
      if (e.key === "e" && !e.ctrlKey && !e.metaKey) editor.setTool("eraser");
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        editor.undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        editor.redo();
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (editor.selectedNoteIds.size > 0) {
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
  }, [editor]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
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
    <div className="flex h-[calc(100vh-4rem)] gap-4 overflow-hidden">
      <div className="flex flex-1 flex-col gap-3 overflow-hidden">
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
      </div>

      <InspectorPanel
        tab={editor.tab}
        onUpdateMeta={editor.updateTabMeta}
        onReorderSections={editor.reorderSections}
      />
    </div>
  );
}
