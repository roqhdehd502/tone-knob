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

import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import type { Section, TabDocument } from "~/types/tab";

interface InspectorPanelProps {
  tab: TabDocument;
  onUpdateMeta: (
    updates: Partial<Pick<TabDocument, "title" | "artist" | "bpm" | "tuning" | "timeSignature">>,
  ) => void;
  onReorderSections?: (oldIndex: number, newIndex: number) => void;
}

export function InspectorPanel({ tab, onUpdateMeta, onReorderSections }: InspectorPanelProps) {
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
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">타브 정보</h3>

      <div className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="tab-title" className="text-xs">
            제목
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
            아티스트
          </Label>
          <Input
            id="tab-artist"
            value={tab.artist}
            onChange={(e) => onUpdateMeta({ artist: e.target.value })}
            className="h-8 text-sm"
            placeholder="아티스트명"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="tab-bpm" className="text-xs">
            BPM
          </Label>
          <Input
            id="tab-bpm"
            type="number"
            min={20}
            max={300}
            value={tab.bpm}
            onChange={(e) =>
              onUpdateMeta({
                bpm: Math.max(20, Math.min(300, parseInt(e.target.value) || 120)),
              })
            }
            className="h-8 text-sm"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">박자</Label>
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
        <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300">튜닝</h4>
        <div className="grid grid-cols-6 gap-1">
          {tab.tuning.map((note, idx) => (
            <div key={idx} className="text-center">
              <span className="text-[10px] text-gray-400">{idx + 1}번</span>
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
          섹션 <span className="font-normal text-gray-400">(드래그로 순서 변경)</span>
        </h4>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={tab.sections.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-1">
              {tab.sections.map((section) => (
                <SortableSectionItem key={section.id} section={section} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      <Separator />

      <div className="text-[10px] text-gray-400">
        <p className="font-semibold">단축키:</p>
        <p>V - 선택 도구</p>
        <p>N - 음표 도구</p>
        <p>E - 지우개</p>
        <p>Ctrl+Z - 실행 취소</p>
        <p>Ctrl+Shift+Z - 다시 실행</p>
        <p>Delete - 선택 삭제</p>
        <p className="mt-1.5 font-semibold">기법 (음표 선택 후):</p>
        <p>H - 해머온 / P - 풀오프</p>
        <p>B - 벤딩 / ~ - 비브라토</p>
        <p>/ - 슬라이드↑ / \ - 슬라이드↓</p>
        <p>X - 뮤트 / O - 하모닉스</p>
        <p>T - 탭핑 / R - 트릴</p>
        <p>M - 팜뮤트 / G - 고스트노트</p>
        <p>L - 렛링 / W - 트레몰로</p>
        <p>D - 글리산도</p>
      </div>
    </div>
  );
}

function SortableSectionItem({ section }: { section: Section }) {
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
      <span className="text-gray-400">{section.measures.length}마디</span>
    </div>
  );
}
