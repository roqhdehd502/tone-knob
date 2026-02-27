import { useState, useCallback } from "react";
import type {
  TabDocument,
  Note,
  Measure,
  Section,
  Duration,
} from "~/types/tab";
import { createEmptyTabDocument } from "~/types/tab";

interface EditorState {
  tab: TabDocument;
  selectedNoteIds: Set<string>;
  selectedMeasureId: string | null;
  selectedSectionId: string | null;
  currentTool: "select" | "note" | "eraser";
  currentDuration: Duration;
  currentFret: number;
  currentString: number;
  history: TabDocument[];
  historyIndex: number;
  isDirty: boolean;
}

export function useEditorStore(initialTab?: TabDocument) {
  const [state, setState] = useState<EditorState>(() => {
    const tab = initialTab ?? createEmptyTabDocument();
    return {
      tab,
      selectedNoteIds: new Set<string>(),
      selectedMeasureId: null,
      selectedSectionId: tab.sections[0]?.id ?? null,
      currentTool: "select",
      currentDuration: 0.25 as Duration,
      currentFret: 0,
      currentString: 0,
      history: [structuredClone(tab)],
      historyIndex: 0,
      isDirty: false,
    };
  });

  const pushHistory = useCallback((newTab: TabDocument) => {
    setState((prev) => {
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push(structuredClone(newTab));
      if (newHistory.length > 50) newHistory.shift();
      return {
        ...prev,
        tab: newTab,
        history: newHistory,
        historyIndex: newHistory.length - 1,
        isDirty: true,
      };
    });
  }, []);

  const undo = useCallback(() => {
    setState((prev) => {
      if (prev.historyIndex <= 0) return prev;
      const newIndex = prev.historyIndex - 1;
      return {
        ...prev,
        tab: structuredClone(prev.history[newIndex]),
        historyIndex: newIndex,
        isDirty: true,
      };
    });
  }, []);

  const redo = useCallback(() => {
    setState((prev) => {
      if (prev.historyIndex >= prev.history.length - 1) return prev;
      const newIndex = prev.historyIndex + 1;
      return {
        ...prev,
        tab: structuredClone(prev.history[newIndex]),
        historyIndex: newIndex,
        isDirty: true,
      };
    });
  }, []);

  const addNote = useCallback(
    (sectionId: string, measureId: string, note: Omit<Note, "id">) => {
      setState((prev) => {
        const newTab = structuredClone(prev.tab);
        const section = newTab.sections.find(
          (s: Section) => s.id === sectionId,
        );
        if (!section) return prev;
        const measure = section.measures.find(
          (m: Measure) => m.id === measureId,
        );
        if (!measure) return prev;

        const existingIdx = measure.notes.findIndex(
          (n: Note) => n.string === note.string && n.position === note.position,
        );
        const newNote: Note = { ...note, id: crypto.randomUUID() };
        if (existingIdx >= 0) {
          measure.notes[existingIdx] = newNote;
        } else {
          measure.notes.push(newNote);
        }

        const newHistory = prev.history.slice(0, prev.historyIndex + 1);
        newHistory.push(structuredClone(newTab));
        if (newHistory.length > 50) newHistory.shift();
        return {
          ...prev,
          tab: newTab,
          history: newHistory,
          historyIndex: newHistory.length - 1,
          isDirty: true,
        };
      });
    },
    [],
  );

  const deleteNotes = useCallback((noteIds: string[]) => {
    const idSet = new Set(noteIds);
    setState((prev) => {
      const newTab = structuredClone(prev.tab);
      for (const section of newTab.sections) {
        for (const measure of section.measures) {
          measure.notes = measure.notes.filter((n: Note) => !idSet.has(n.id));
        }
      }
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push(structuredClone(newTab));
      if (newHistory.length > 50) newHistory.shift();
      return {
        ...prev,
        tab: newTab,
        selectedNoteIds: new Set<string>(),
        history: newHistory,
        historyIndex: newHistory.length - 1,
        isDirty: true,
      };
    });
  }, []);

  const addMeasure = useCallback((sectionId: string) => {
    setState((prev) => {
      const newTab = structuredClone(prev.tab);
      const section = newTab.sections.find((s: Section) => s.id === sectionId);
      if (!section) return prev;
      const newMeasure: Measure = { id: crypto.randomUUID(), notes: [] };
      section.measures.push(newMeasure);
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push(structuredClone(newTab));
      if (newHistory.length > 50) newHistory.shift();
      return {
        ...prev,
        tab: newTab,
        history: newHistory,
        historyIndex: newHistory.length - 1,
        isDirty: true,
      };
    });
  }, []);

  const addSection = useCallback((name: string) => {
    setState((prev) => {
      const newTab = structuredClone(prev.tab);
      const newSection: Section = {
        id: crypto.randomUUID(),
        name,
        measures: [{ id: crypto.randomUUID(), notes: [] }],
      };
      newTab.sections.push(newSection);
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push(structuredClone(newTab));
      if (newHistory.length > 50) newHistory.shift();
      return {
        ...prev,
        tab: newTab,
        selectedSectionId: newSection.id,
        history: newHistory,
        historyIndex: newHistory.length - 1,
        isDirty: true,
      };
    });
  }, []);

  const reorderMeasures = useCallback(
    (sectionId: string, oldIndex: number, newIndex: number) => {
      if (oldIndex === newIndex) return;
      setState((prev) => {
        const newTab = structuredClone(prev.tab);
        const section = newTab.sections.find(
          (s: Section) => s.id === sectionId,
        );
        if (!section) return prev;
        const [moved] = section.measures.splice(oldIndex, 1);
        section.measures.splice(newIndex, 0, moved);
        const newHistory = prev.history.slice(0, prev.historyIndex + 1);
        newHistory.push(structuredClone(newTab));
        if (newHistory.length > 50) newHistory.shift();
        return {
          ...prev,
          tab: newTab,
          history: newHistory,
          historyIndex: newHistory.length - 1,
          isDirty: true,
        };
      });
    },
    [],
  );

  const reorderSections = useCallback((oldIndex: number, newIndex: number) => {
    if (oldIndex === newIndex) return;
    setState((prev) => {
      const newTab = structuredClone(prev.tab);
      const [moved] = newTab.sections.splice(oldIndex, 1);
      newTab.sections.splice(newIndex, 0, moved);
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push(structuredClone(newTab));
      if (newHistory.length > 50) newHistory.shift();
      return {
        ...prev,
        tab: newTab,
        history: newHistory,
        historyIndex: newHistory.length - 1,
        isDirty: true,
      };
    });
  }, []);

  const updateTabMeta = useCallback(
    (
      updates: Partial<
        Pick<
          TabDocument,
          "title" | "artist" | "bpm" | "tuning" | "timeSignature"
        >
      >,
    ) => {
      pushHistory({ ...state.tab, ...updates });
    },
    [state.tab, pushHistory],
  );

  const setTool = useCallback((tool: EditorState["currentTool"]) => {
    setState((prev) => ({ ...prev, currentTool: tool }));
  }, []);

  const setDuration = useCallback((duration: Duration) => {
    setState((prev) => ({ ...prev, currentDuration: duration }));
  }, []);

  const setFret = useCallback((fret: number) => {
    setState((prev) => ({ ...prev, currentFret: fret }));
  }, []);

  const setSelectedNote = useCallback((noteId: string | null) => {
    setState((prev) => ({
      ...prev,
      selectedNoteIds: noteId ? new Set([noteId]) : new Set<string>(),
    }));
  }, []);

  const setSelectedMeasure = useCallback((measureId: string | null) => {
    setState((prev) => ({ ...prev, selectedMeasureId: measureId }));
  }, []);

  const setTab = useCallback((tab: TabDocument) => {
    setState((prev) => ({
      ...prev,
      tab,
      history: [structuredClone(tab)],
      historyIndex: 0,
      isDirty: false,
    }));
  }, []);

  const markClean = useCallback(() => {
    setState((prev) => ({ ...prev, isDirty: false }));
  }, []);

  return {
    ...state,
    undo,
    redo,
    addNote,
    deleteNotes,
    addMeasure,
    addSection,
    reorderMeasures,
    reorderSections,
    updateTabMeta,
    setTool,
    setDuration,
    setFret,
    setSelectedNote,
    setSelectedMeasure,
    setTab,
    markClean,
    canUndo: state.historyIndex > 0,
    canRedo: state.historyIndex < state.history.length - 1,
  };
}
