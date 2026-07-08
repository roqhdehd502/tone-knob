import { useState } from "react";

import {
  ChevronDown,
  ChevronUp,
  Eraser,
  Globe,
  GlobeLock,
  MousePointer2,
  Music,
  PenTool,
  Plus,
  Redo2,
  Repeat,
  Save,
  Undo2,
  X,
  Zap,
} from "lucide-react";

import { Button } from "~/components/ui/button";
import { useI18n } from "~/context/i18n";
import type { Duration, MusicDirective, Technique } from "~/types/tab";
import { DIRECTIVE_META, TECHNIQUE_META } from "~/types/tab";

import {
  DottedEighthNote,
  DottedHalfNote,
  DottedQuarterNote,
  EighthNote,
  EighthRest,
  HalfNote,
  HalfRest,
  QuarterNote,
  QuarterRest,
  SixteenthNote,
  SixteenthRest,
  ThirtySecondNote,
  ThirtySecondRest,
  WholeNote,
  WholeRest,
} from "./NoteIcons";

interface DurationOption {
  value: Duration;
  icon: React.ReactNode;
  name: string;
}

interface ToolbarProps {
  currentTool: "select" | "note" | "eraser";
  currentDuration: Duration;
  currentFret: number;
  canUndo: boolean;
  canRedo: boolean;
  isDirty: boolean;
  isPublic: boolean;
  isSaving: boolean;
  selectedNoteTechniques: Technique[];
  hasSelection: boolean;
  onToolChange: (tool: "select" | "note" | "eraser") => void;
  onDurationChange: (duration: Duration) => void;
  onFretChange: (fret: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onTogglePublish: () => void;
  onAddMeasure: () => void;
  onAddSection: () => void;
  onToggleTechnique: (technique: Technique) => void;
  onClearTechniques?: () => void;
  onAddDirective?: (directive: MusicDirective) => void;
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
  selectedNoteTechniques,
  hasSelection,
  onToolChange,
  onDurationChange,
  onFretChange,
  onUndo,
  onRedo,
  onSave,
  onTogglePublish,
  onAddMeasure,
  onAddSection,
  onToggleTechnique,
  onClearTechniques,
  onAddDirective,
}: ToolbarProps) {
  const { t } = useI18n();
  const [showTechniques, setShowTechniques] = useState(false);
  const [showDirectives, setShowDirectives] = useState(false);
  const [showRests, setShowRests] = useState(false);

  const NOTE_DURATIONS: DurationOption[] = [
    { value: 1, icon: <WholeNote size={16} />, name: t("note.whole") },
    { value: 0.75, icon: <DottedHalfNote size={16} />, name: t("note.dottedHalf") },
    { value: 0.5, icon: <HalfNote size={16} />, name: t("note.half") },
    { value: 0.375, icon: <DottedQuarterNote size={16} />, name: t("note.dottedQuarter") },
    { value: 0.25, icon: <QuarterNote size={16} />, name: t("note.quarter") },
    { value: 0.1875, icon: <DottedEighthNote size={16} />, name: t("note.dottedEighth") },
    { value: 0.125, icon: <EighthNote size={16} />, name: t("note.eighth") },
    { value: 0.0625, icon: <SixteenthNote size={16} />, name: t("note.sixteenth") },
    { value: 0.03125, icon: <ThirtySecondNote size={16} />, name: t("note.thirtySecond") },
  ];

  const REST_DURATIONS: DurationOption[] = [
    { value: -1, icon: <WholeRest size={16} />, name: t("rest.whole") },
    { value: -0.5, icon: <HalfRest size={16} />, name: t("rest.half") },
    { value: -0.25, icon: <QuarterRest size={16} />, name: t("rest.quarter") },
    { value: -0.125, icon: <EighthRest size={16} />, name: t("rest.eighth") },
    { value: -0.0625, icon: <SixteenthRest size={16} />, name: t("rest.sixteenth") },
    { value: -0.03125, icon: <ThirtySecondRest size={16} />, name: t("rest.thirtySecond") },
  ];

  const isRest = currentDuration < 0;
  const durations = showRests ? REST_DURATIONS : NOTE_DURATIONS;

  return (
    <div className="space-y-1.5" data-toolbar>
      {/* 메인 툴바 */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 dark:border-gray-800 dark:bg-gray-900">
        {/* 도구 선택 */}
        <ToolGroup label={t("toolbar.tools")}>
          <ToolButton
            icon={<MousePointer2 className="h-4 w-4" />}
            label={t("toolbar.selectTool")}
            shortcut="V"
            active={currentTool === "select"}
            onClick={() => onToolChange("select")}
          />
          <ToolButton
            icon={<PenTool className="h-4 w-4" />}
            label={t("toolbar.noteTool")}
            shortcut="N"
            active={currentTool === "note"}
            onClick={() => onToolChange("note")}
          />
          <ToolButton
            icon={<Eraser className="h-4 w-4" />}
            label={t("toolbar.eraser")}
            shortcut="E"
            active={currentTool === "eraser"}
            onClick={() => onToolChange("eraser")}
          />
        </ToolGroup>

        <ToolDivider />

        {/* 음표/쉼표 길이 */}
        <ToolGroup label={showRests ? t("toolbar.rests") : t("toolbar.notes")}>
          <div className="flex items-center gap-0.5">
            {/* 음표/쉼표 전환 토글 */}
            <button
              type="button"
              title={showRests ? t("toolbar.toNotes") : t("toolbar.toRests")}
              onClick={() => {
                setShowRests((v) => !v);
                // 현재 duration의 부호를 전환
                if (!showRests && currentDuration > 0) {
                  const restMap: Record<number, Duration> = {
                    1: -1,
                    0.75: -0.5,
                    0.5: -0.5,
                    0.375: -0.25,
                    0.25: -0.25,
                    0.1875: -0.125,
                    0.125: -0.125,
                    0.0625: -0.0625,
                    0.03125: -0.03125,
                  };
                  onDurationChange(restMap[currentDuration] ?? (-0.25 as Duration));
                } else if (showRests && currentDuration < 0) {
                  const noteMap: Record<number, Duration> = {
                    [-1]: 1,
                    [-0.5]: 0.5,
                    [-0.25]: 0.25,
                    [-0.125]: 0.125,
                    [-0.0625]: 0.0625,
                    [-0.03125]: 0.03125,
                  } as Record<number, Duration>;
                  onDurationChange(noteMap[currentDuration] ?? (0.25 as Duration));
                }
              }}
              className={`mr-1 flex h-7 items-center gap-0.5 rounded-md border px-1.5 text-[10px] font-medium transition-all ${
                isRest
                  ? "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                  : "border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400"
              }`}
            >
              {showRests ? (
                <>
                  <QuarterRest size={12} />
                  {t("toolbar.rests")}
                </>
              ) : (
                <>
                  <QuarterNote size={12} />
                  {t("toolbar.notes")}
                </>
              )}
            </button>
            {durations.map(({ value, icon, name }) => (
              <ToolButton
                key={value}
                icon={icon}
                label={name}
                active={currentDuration === value}
                onClick={() => onDurationChange(value)}
              />
            ))}
          </div>
        </ToolGroup>

        <ToolDivider />

        {/* 프렛 번호 */}
        <ToolGroup label={t("toolbar.fret")}>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onFretChange(Math.max(0, currentFret - 1))}
              disabled={currentFret <= 0}
              className="flex h-7 w-6 items-center justify-center rounded text-gray-400 transition-colors hover:bg-gray-100 disabled:opacity-30 dark:hover:bg-gray-800"
            >
              −
            </button>
            <input
              type="number"
              min={0}
              max={24}
              value={currentFret}
              onChange={(e) =>
                onFretChange(Math.max(0, Math.min(24, parseInt(e.target.value) || 0)))
              }
              className="h-7 w-10 rounded border border-gray-200 bg-gray-50 text-center text-sm font-semibold tabular-nums dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            <button
              type="button"
              onClick={() => onFretChange(Math.min(24, currentFret + 1))}
              disabled={currentFret >= 24}
              className="flex h-7 w-6 items-center justify-center rounded text-gray-400 transition-colors hover:bg-gray-100 disabled:opacity-30 dark:hover:bg-gray-800"
            >
              +
            </button>
          </div>
        </ToolGroup>

        <ToolDivider />

        {/* 실행 취소/다시 실행 */}
        <ToolGroup label={t("toolbar.history")}>
          <ToolButton
            icon={<Undo2 className="h-4 w-4" />}
            label={t("toolbar.undo")}
            shortcut="⌘Z"
            disabled={!canUndo}
            onClick={onUndo}
          />
          <ToolButton
            icon={<Redo2 className="h-4 w-4" />}
            label={t("toolbar.redo")}
            shortcut="⌘⇧Z"
            disabled={!canRedo}
            onClick={onRedo}
          />
        </ToolGroup>

        <ToolDivider />

        {/* 추가 */}
        <ToolGroup label={t("toolbar.add")}>
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={onAddMeasure}>
            <Plus className="h-3 w-3" /> {t("toolbar.addBar")}
          </Button>
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={onAddSection}>
            <Plus className="h-3 w-3" /> {t("toolbar.addSection")}
          </Button>
        </ToolGroup>

        <ToolDivider />

        {/* 패널 토글 버튼들 */}
        <div className="flex items-center gap-1">
          <Button
            variant={showTechniques ? "default" : "ghost"}
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={() => {
              setShowTechniques((v) => !v);
              setShowDirectives(false);
            }}
          >
            <Zap className="h-3 w-3" />
            {t("toolbar.techniques")}
            {showTechniques ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </Button>
          <Button
            variant={showDirectives ? "default" : "ghost"}
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={() => {
              setShowDirectives((v) => !v);
              setShowTechniques(false);
            }}
          >
            <Music className="h-3 w-3" />
            {t("toolbar.directives")}
            {showDirectives ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </Button>
        </div>

        {/* 저장 & 공개 */}
        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={onTogglePublish}>
            {isPublic ? <Globe className="h-3.5 w-3.5" /> : <GlobeLock className="h-3.5 w-3.5" />}
            {isPublic ? t("common.public") : t("common.private")}
          </Button>
          <Button
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={onSave}
            disabled={!isDirty || isSaving}
          >
            <Save className="h-3.5 w-3.5" />
            {isSaving ? t("toolbar.saving") : t("common.save")}
          </Button>
        </div>
      </div>

      {/* 기법 패널 */}
      {showTechniques && (
        <div className="rounded-lg border border-gray-200 bg-white p-2 dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-1.5 flex items-center gap-1.5 px-1">
            <Zap className="h-3 w-3 text-gray-400" />
            <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
              {t("toolbar.techniqueLabel")} {!hasSelection && t("toolbar.selectNoteFirst")}
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {/* 없음 (기법 제거) 버튼 */}
            {hasSelection && selectedNoteTechniques.length > 0 && (
              <button
                type="button"
                title={t("toolbar.clearAll")}
                onClick={onClearTechniques}
                className="flex h-7 items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-2.5 text-xs font-medium text-red-600 transition-all hover:border-red-300 hover:bg-red-100 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400 dark:hover:border-red-700"
              >
                <X className="h-3 w-3" />
                <span>{t("toolbar.none")}</span>
              </button>
            )}
            {TECHNIQUE_META.map((tech) => {
              const isActive = selectedNoteTechniques.includes(tech.id);
              return (
                <button
                  key={tech.id}
                  type="button"
                  title={`${tech.label} (단축키: ${tech.shortcut})`}
                  disabled={!hasSelection}
                  onClick={() => onToggleTechnique(tech.id)}
                  className={`flex h-7 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-all ${
                    isActive
                      ? "border-transparent text-white shadow-sm"
                      : hasSelection
                        ? "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:bg-gray-800"
                        : "cursor-not-allowed border-gray-100 text-gray-300 dark:border-gray-800 dark:text-gray-600"
                  }`}
                  style={isActive ? { backgroundColor: tech.color } : undefined}
                >
                  <span className="font-mono text-sm">{tech.symbol}</span>
                  <span>{tech.label}</span>
                  <kbd className="ml-0.5 hidden rounded bg-black/10 px-1 py-0.5 font-sans text-[9px] sm:inline">
                    {tech.shortcut}
                  </kbd>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 오선보 지시사항 패널 */}
      {showDirectives && (
        <div className="rounded-lg border border-gray-200 bg-white p-2 dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-1.5 flex items-center gap-1.5 px-1">
            <Repeat className="h-3 w-3 text-gray-400" />
            <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
              {t("toolbar.directivesHint")}
            </span>
          </div>
          <div className="space-y-2">
            {(["repeat", "navigation", "dynamics"] as const).map((cat) => {
              const items = DIRECTIVE_META.filter((d) => d.category === cat);
              const catLabel =
                cat === "repeat"
                  ? t("toolbar.categoryRepeat")
                  : cat === "navigation"
                    ? t("toolbar.categoryNavigation")
                    : t("toolbar.categoryDynamics");
              return (
                <div key={cat}>
                  <div className="mb-1 text-[9px] font-semibold uppercase tracking-wider text-gray-400">
                    {catLabel}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {items.map((dir) => (
                      <button
                        key={dir.id}
                        type="button"
                        title={dir.label}
                        onClick={() => onAddDirective?.(dir.id)}
                        className="flex h-7 items-center gap-1.5 rounded-md border border-gray-200 px-2.5 text-xs font-medium text-gray-600 transition-all hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:bg-gray-800"
                      >
                        <span className="text-sm">{dir.symbol}</span>
                        <span>{dir.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function ToolGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="flex items-center gap-0.5">{children}</div>
      <span className="text-[9px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
        {label}
      </span>
    </div>
  );
}

function ToolDivider() {
  return <div className="mx-0.5 h-10 w-px bg-gray-200 dark:bg-gray-700" />;
}

function ToolButton({
  icon,
  label,
  shortcut,
  active,
  disabled,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  const tooltip = shortcut ? `${label} (${shortcut})` : label;
  return (
    <button
      type="button"
      title={tooltip}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded-md transition-all ${
        active
          ? "bg-miami-100 text-miami-700 shadow-sm ring-1 ring-miami-200 dark:bg-miami-900/40 dark:text-miami-300 dark:ring-miami-800"
          : "text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
      } ${disabled ? "cursor-not-allowed opacity-30" : "cursor-pointer"}`}
    >
      {icon}
    </button>
  );
}
