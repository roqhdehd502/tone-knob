import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

import { BpmDial } from "~/components/editor/BpmDial";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import { useI18n } from "~/context/i18n";
import type { Section, TabDocument } from "~/types/tab";

interface InspectorPanelProps {
  tab: TabDocument;
  onUpdateMeta: (
    updates: Partial<Pick<TabDocument, "title" | "artist" | "bpm" | "tuning" | "timeSignature">>,
  ) => void;
  onReorderSections?: (oldIndex: number, newIndex: number) => void;
}

export function InspectorPanel({ tab, onUpdateMeta, onReorderSections }: InspectorPanelProps) {
  const { t } = useI18n();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !onReorderSections) return;
    const oldIndex = tab.sections.findIndex((s) => s.id === active.id);
    const newIndex = tab.sections.findIndex((s) => s.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      onReorderSections(oldIndex, newIndex);
    }
  };

  return (
    <div className="w-64 shrink-0 space-y-4 overflow-y-auto rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
        {t("inspector.tabInfo")}
      </h3>

      <div className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="tab-title" className="text-xs">
            {t("inspector.titleLabel")}
          </Label>
          <Input
            id="tab-title"
            value={tab.title}
            onChange={(e) => onUpdateMeta({ title: e.target.value })}
            className="h-8 text-sm"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="tab-artist" className="text-xs">
            {t("inspector.artist")}
          </Label>
          <Input
            id="tab-artist"
            value={tab.artist}
            onChange={(e) => onUpdateMeta({ artist: e.target.value })}
            className="h-8 text-sm"
            placeholder={t("inspector.artistPlaceholder")}
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">BPM</Label>
          <BpmDial value={tab.bpm} min={20} max={300} onChange={(bpm) => onUpdateMeta({ bpm })} />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">{t("inspector.timeSignature")}</Label>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              min={1}
              max={16}
              value={tab.timeSignature[0]}
              onChange={(e) =>
                onUpdateMeta({
                  timeSignature: [parseInt(e.target.value) || 4, tab.timeSignature[1]],
                })
              }
              className="h-8 w-14 text-center text-sm"
            />
            <span className="text-gray-500">/</span>
            <Input
              type="number"
              min={1}
              max={16}
              value={tab.timeSignature[1]}
              onChange={(e) =>
                onUpdateMeta({
                  timeSignature: [tab.timeSignature[0], parseInt(e.target.value) || 4],
                })
              }
              className="h-8 w-14 text-center text-sm"
            />
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300">
          {t("inspector.tuning")}
        </h4>
        <div className="grid grid-cols-6 gap-1">
          {tab.tuning.map((note, idx) => (
            <div key={idx} className="text-center">
              <span className="text-[10px] text-gray-400">
                {t("inspector.stringLabel", { n: idx + 1 })}
              </span>
              <Input
                value={note}
                onChange={(e) => {
                  const newTuning = [...tab.tuning];
                  newTuning[idx] = e.target.value.toUpperCase();
                  onUpdateMeta({ tuning: newTuning });
                }}
                className="h-7 text-center text-xs"
                maxLength={2}
              />
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300">
          {t("inspector.sections")}{" "}
          <span className="font-normal text-gray-400">{t("inspector.sectionsDragHint")}</span>
        </h4>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={tab.sections.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-1">
              {tab.sections.map((section) => (
                <SortableSectionItem
                  key={section.id}
                  section={section}
                  measureLabel={t("inspector.sectionMeasures", { n: section.measures.length })}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      <Separator />

      <div className="text-[10px] text-gray-400">
        <p className="font-semibold">{t("inspector.shortcuts")}</p>
        <p>{t("inspector.vShortcut")}</p>
        <p>{t("inspector.nShortcut")}</p>
        <p>{t("inspector.eShortcut")}</p>
        <p>{t("inspector.undoShortcut")}</p>
        <p>{t("inspector.redoShortcut")}</p>
        <p>{t("inspector.deleteShortcut")}</p>
        <p className="mt-1.5 font-semibold">{t("inspector.techniques")}</p>
        <p>{t("inspector.hammerPull")}</p>
        <p>{t("inspector.bendVibrato")}</p>
        <p>
          {t("inspector.slideUp")} / {t("inspector.slideDown")}
        </p>
        <p>{t("inspector.mute")}</p>
        <p>{t("inspector.tapping")}</p>
        <p>{t("inspector.palmMute")}</p>
        <p>{t("inspector.letRing")}</p>
        <p>{t("inspector.glissando")}</p>
      </div>
    </div>
  );
}

function SortableSectionItem({
  section,
  measureLabel,
}: {
  section: Section;
  measureLabel: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-1 rounded bg-gray-50 px-1 py-1 text-xs dark:bg-gray-800"
    >
      <button
        type="button"
        className="cursor-grab touch-none text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-3 w-3" />
      </button>
      <span className="flex-1 text-gray-700 dark:text-gray-300">{section.name}</span>
      <span className="text-gray-400">{measureLabel}</span>
    </div>
  );
}
