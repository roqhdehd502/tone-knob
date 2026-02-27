import {
  MousePointer2,
  PenTool,
  Eraser,
  Undo2,
  Redo2,
  Plus,
  Save,
  Globe,
  GlobeLock,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import type { Duration } from "~/types/tab";

const DURATION_LABELS: { value: Duration; label: string }[] = [
  { value: 1, label: "𝅝" },
  { value: 0.5, label: "𝅗𝅥" },
  { value: 0.25, label: "♩" },
  { value: 0.125, label: "♪" },
  { value: 0.0625, label: "𝅘𝅥𝅯" },
];

interface ToolbarProps {
  currentTool: "select" | "note" | "eraser";
  currentDuration: Duration;
  currentFret: number;
  canUndo: boolean;
  canRedo: boolean;
  isDirty: boolean;
  isPublic: boolean;
  isSaving: boolean;
  onToolChange: (tool: "select" | "note" | "eraser") => void;
  onDurationChange: (duration: Duration) => void;
  onFretChange: (fret: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onTogglePublish: () => void;
  onAddMeasure: () => void;
  onAddSection: () => void;
}

export function Toolbar({
  currentTool,
  currentDuration,
  currentFret,
  canUndo,
  canRedo,
  isDirty,
  isPublic,
  isSaving,
  onToolChange,
  onDurationChange,
  onFretChange,
  onUndo,
  onRedo,
  onSave,
  onTogglePublish,
  onAddMeasure,
  onAddSection,
}: ToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-1 rounded-lg border border-gray-200 bg-white p-2 dark:border-gray-800 dark:bg-gray-900">
      {/* 도구 선택 */}
      <div className="flex items-center gap-0.5 border-r border-gray-200 pr-2 dark:border-gray-700">
        <ToolButton
          icon={<MousePointer2 className="h-4 w-4" />}
          label="선택"
          active={currentTool === "select"}
          onClick={() => onToolChange("select")}
        />
        <ToolButton
          icon={<PenTool className="h-4 w-4" />}
          label="음표"
          active={currentTool === "note"}
          onClick={() => onToolChange("note")}
        />
        <ToolButton
          icon={<Eraser className="h-4 w-4" />}
          label="지우개"
          active={currentTool === "eraser"}
          onClick={() => onToolChange("eraser")}
        />
      </div>

      {/* 음표 길이 */}
      <div className="flex items-center gap-0.5 border-r border-gray-200 pr-2 dark:border-gray-700">
        {DURATION_LABELS.map(({ value, label }) => (
          <ToolButton
            key={value}
            icon={<span className="text-base">{label}</span>}
            label=""
            active={currentDuration === value}
            onClick={() => onDurationChange(value)}
          />
        ))}
      </div>

      {/* 프렛 번호 */}
      <div className="flex items-center gap-1 border-r border-gray-200 pr-2 dark:border-gray-700">
        <span className="text-xs text-gray-500 dark:text-gray-400">프렛:</span>
        <input
          type="number"
          min={0}
          max={24}
          value={currentFret}
          onChange={(e) => onFretChange(Math.max(0, Math.min(24, parseInt(e.target.value) || 0)))}
          className="h-7 w-12 rounded border border-gray-200 bg-gray-50 text-center text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
      </div>

      {/* 실행 취소/다시 실행 */}
      <div className="flex items-center gap-0.5 border-r border-gray-200 pr-2 dark:border-gray-700">
        <ToolButton
          icon={<Undo2 className="h-4 w-4" />}
          label="실행 취소"
          disabled={!canUndo}
          onClick={onUndo}
        />
        <ToolButton
          icon={<Redo2 className="h-4 w-4" />}
          label="다시 실행"
          disabled={!canRedo}
          onClick={onRedo}
        />
      </div>

      {/* 추가 */}
      <div className="flex items-center gap-0.5 border-r border-gray-200 pr-2 dark:border-gray-700">
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={onAddMeasure}>
          <Plus className="h-3 w-3" /> 마디
        </Button>
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={onAddSection}>
          <Plus className="h-3 w-3" /> 섹션
        </Button>
      </div>

      {/* 저장 & 공개 */}
      <div className="ml-auto flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 text-xs"
          onClick={onTogglePublish}
        >
          {isPublic ? <Globe className="h-3.5 w-3.5" /> : <GlobeLock className="h-3.5 w-3.5" />}
          {isPublic ? "공개" : "비공개"}
        </Button>
        <Button
          size="sm"
          className="h-7 gap-1 text-xs"
          onClick={onSave}
          disabled={!isDirty || isSaving}
        >
          <Save className="h-3.5 w-3.5" />
          {isSaving ? "저장 중..." : "저장"}
        </Button>
      </div>
    </div>
  );
}

function ToolButton({
  icon,
  label,
  active,
  disabled,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-7 w-7 items-center justify-center rounded transition-colors ${
        active
          ? "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300"
          : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
      } ${disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"}`}
    >
      {icon}
    </button>
  );
}
