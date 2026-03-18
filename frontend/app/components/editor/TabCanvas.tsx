import { useCallback } from "react";

import type { Duration, Measure, Note, Section } from "~/types/tab";
import { TECHNIQUE_META } from "~/types/tab";

// 레이아웃 상수
const STRING_COUNT = 6;
const STRING_GAP = 20;
const MEASURE_WIDTH = 200;
const MEASURE_PADDING = 16;
const SECTION_HEADER_HEIGHT = 32;
const MEASURES_PER_ROW = 4;
const ROW_HEIGHT = STRING_COUNT * STRING_GAP + 40;
const LEFT_LABEL_WIDTH = 30;
const NOTE_POSITIONS = 8; // 한 마디당 입력 가능 위치 수

interface TabCanvasProps {
  sections: Section[];
  tuning: string[];
  selectedNoteIds: Set<string>;
  selectedMeasureId: string | null;
  currentTool: "select" | "note" | "eraser";
  currentDuration: Duration;
  currentFret: number;
  onNoteClick: (noteId: string, sectionId: string, measureId: string) => void;
  onCellClick: (
    sectionId: string,
    measureId: string,
    stringIndex: number,
    position: number,
  ) => void;
  onMeasureClick: (measureId: string) => void;
}

export function TabCanvas({
  sections,
  tuning,
  selectedNoteIds,
  selectedMeasureId,
  currentTool,
  currentFret,
  onNoteClick,
  onCellClick,
  onMeasureClick,
}: TabCanvasProps) {
  // 전체 캔버스 높이 계산
  let totalHeight = 0;
  for (const section of sections) {
    const rows = Math.ceil(section.measures.length / MEASURES_PER_ROW);
    totalHeight += SECTION_HEADER_HEIGHT + rows * ROW_HEIGHT + 16;
  }

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${LEFT_LABEL_WIDTH + MEASURES_PER_ROW * MEASURE_WIDTH + 20} ${totalHeight + 20}`}
      className="select-none"
    >
      {sections.map((section, sIdx) => {
        let yOffset = 0;
        for (let i = 0; i < sIdx; i++) {
          const rows = Math.ceil(sections[i].measures.length / MEASURES_PER_ROW);
          yOffset += SECTION_HEADER_HEIGHT + rows * ROW_HEIGHT + 16;
        }
        return (
          <SectionRenderer
            key={section.id}
            section={section}
            tuning={tuning}
            yOffset={yOffset}
            selectedNoteIds={selectedNoteIds}
            selectedMeasureId={selectedMeasureId}
            currentTool={currentTool}
            currentFret={currentFret}
            onNoteClick={onNoteClick}
            onCellClick={onCellClick}
            onMeasureClick={onMeasureClick}
          />
        );
      })}
    </svg>
  );
}

function SectionRenderer({
  section,
  tuning,
  yOffset,
  selectedNoteIds,
  selectedMeasureId,
  currentTool,
  currentFret,
  onNoteClick,
  onCellClick,
  onMeasureClick,
}: {
  section: Section;
  tuning: string[];
  yOffset: number;
  selectedNoteIds: Set<string>;
  selectedMeasureId: string | null;
  currentTool: "select" | "note" | "eraser";
  currentFret: number;
  onNoteClick: (noteId: string, sectionId: string, measureId: string) => void;
  onCellClick: (
    sectionId: string,
    measureId: string,
    stringIndex: number,
    position: number,
  ) => void;
  onMeasureClick: (measureId: string) => void;
}) {
  return (
    <g transform={`translate(0, ${yOffset})`}>
      {/* 섹션 헤더 */}
      <text
        x={LEFT_LABEL_WIDTH}
        y={20}
        className="fill-violet-600 dark:fill-violet-400"
        fontSize={14}
        fontWeight="bold"
      >
        {section.name}
      </text>

      {section.measures.map((measure, mIdx) => {
        const row = Math.floor(mIdx / MEASURES_PER_ROW);
        const col = mIdx % MEASURES_PER_ROW;
        const mx = LEFT_LABEL_WIDTH + col * MEASURE_WIDTH;
        const my = SECTION_HEADER_HEIGHT + row * ROW_HEIGHT;

        return (
          <g key={measure.id}>
            {/* 줄 이름 라벨 (각 줄 첫 마디에만) */}
            {col === 0 &&
              tuning.map((name, sIdx) => (
                <text
                  key={sIdx}
                  x={8}
                  y={my + MEASURE_PADDING + sIdx * STRING_GAP + 5}
                  fontSize={11}
                  className="fill-gray-400"
                  textAnchor="middle"
                >
                  {name}
                </text>
              ))}

            <MeasureRenderer
              measure={measure}
              sectionId={section.id}
              measureIndex={mIdx}
              x={mx}
              y={my}
              isSelected={selectedMeasureId === measure.id}
              selectedNoteIds={selectedNoteIds}
              currentTool={currentTool}
              currentFret={currentFret}
              onNoteClick={onNoteClick}
              onCellClick={onCellClick}
              onMeasureClick={onMeasureClick}
            />
          </g>
        );
      })}
    </g>
  );
}

function MeasureRenderer({
  measure,
  sectionId,
  measureIndex,
  x,
  y,
  isSelected,
  selectedNoteIds,
  currentTool,
  currentFret,
  onNoteClick,
  onCellClick,
  onMeasureClick,
}: {
  measure: Measure;
  sectionId: string;
  measureIndex: number;
  x: number;
  y: number;
  isSelected: boolean;
  selectedNoteIds: Set<string>;
  currentTool: "select" | "note" | "eraser";
  currentFret: number;
  onNoteClick: (noteId: string, sectionId: string, measureId: string) => void;
  onCellClick: (
    sectionId: string,
    measureId: string,
    stringIndex: number,
    position: number,
  ) => void;
  onMeasureClick: (measureId: string) => void;
}) {
  const innerWidth = MEASURE_WIDTH - 2;
  const handleMeasureClick = useCallback(() => {
    onMeasureClick(measure.id);
  }, [measure.id, onMeasureClick]);

  const handleCellClick = useCallback(
    (stringIndex: number, position: number) => {
      onCellClick(sectionId, measure.id, stringIndex, position);
    },
    [sectionId, measure.id, onCellClick],
  );

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* 마디 배경 */}
      <rect
        x={0}
        y={MEASURE_PADDING - 8}
        width={MEASURE_WIDTH}
        height={STRING_COUNT * STRING_GAP + 16}
        rx={4}
        className={isSelected ? "fill-violet-50 dark:fill-violet-950/30" : "fill-transparent"}
        onClick={handleMeasureClick}
        style={{ cursor: "pointer" }}
      />

      {/* 마디 번호 */}
      <text x={4} y={MEASURE_PADDING - 12} fontSize={9} className="fill-gray-400">
        {measureIndex + 1}
      </text>

      {/* 6줄 그리기 */}
      {Array.from({ length: STRING_COUNT }).map((_, sIdx) => {
        const sy = MEASURE_PADDING + sIdx * STRING_GAP;
        return (
          <line
            key={sIdx}
            x1={1}
            y1={sy}
            x2={innerWidth}
            y2={sy}
            className="stroke-gray-300 dark:stroke-gray-600"
            strokeWidth={1}
          />
        );
      })}

      {/* 마디 시작/끝 세로선 */}
      <line
        x1={1}
        y1={MEASURE_PADDING}
        x2={1}
        y2={MEASURE_PADDING + (STRING_COUNT - 1) * STRING_GAP}
        className="stroke-gray-400 dark:stroke-gray-500"
        strokeWidth={1.5}
      />
      <line
        x1={innerWidth}
        y1={MEASURE_PADDING}
        x2={innerWidth}
        y2={MEASURE_PADDING + (STRING_COUNT - 1) * STRING_GAP}
        className="stroke-gray-400 dark:stroke-gray-500"
        strokeWidth={1.5}
      />

      {/* 입력 가능 셀 (투명 클릭 영역) */}
      {currentTool === "note" &&
        Array.from({ length: STRING_COUNT }).map((_, sIdx) =>
          Array.from({ length: NOTE_POSITIONS }).map((_, pIdx) => {
            const cx = 10 + (pIdx / NOTE_POSITIONS) * (innerWidth - 20);
            const cy = MEASURE_PADDING + sIdx * STRING_GAP;
            const position = pIdx / NOTE_POSITIONS;
            return (
              <g
                key={`${sIdx}-${pIdx}`}
                onClick={() => handleCellClick(sIdx, position)}
                style={{ cursor: "crosshair" }}
              >
                <rect
                  x={cx - 8}
                  y={cy - 8}
                  width={16}
                  height={16}
                  className="fill-transparent hover:fill-violet-100/50 dark:hover:fill-violet-900/30"
                  rx={2}
                />
                {/* 프렛 번호 미리보기 (호버 시) */}
                <text
                  x={cx}
                  y={cy + 4}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight="bold"
                  className="fill-transparent hover:fill-violet-400 pointer-events-none"
                >
                  {currentFret}
                </text>
              </g>
            );
          }),
        )}

      {/* 음표 렌더링 */}
      {measure.notes.map((note) => {
        const cx = 10 + note.position * (innerWidth - 20);
        const cy = MEASURE_PADDING + note.string * STRING_GAP;
        const isNoteSelected = selectedNoteIds.has(note.id);

        return (
          <NoteRenderer
            key={note.id}
            note={note}
            cx={cx}
            cy={cy}
            isSelected={isNoteSelected}
            sectionId={sectionId}
            measureId={measure.id}
            currentTool={currentTool}
            onNoteClick={onNoteClick}
          />
        );
      })}
    </g>
  );
}

const TECHNIQUE_COLOR_MAP = new Map(
  TECHNIQUE_META.map((t) => [t.id, { symbol: t.symbol, color: t.color }]),
);

function NoteRenderer({
  note,
  cx,
  cy,
  isSelected,
  sectionId,
  measureId,
  currentTool,
  onNoteClick,
}: {
  note: Note;
  cx: number;
  cy: number;
  isSelected: boolean;
  sectionId: string;
  measureId: string;
  currentTool: "select" | "note" | "eraser";
  onNoteClick: (noteId: string, sectionId: string, measureId: string) => void;
}) {
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onNoteClick(note.id, sectionId, measureId);
    },
    [note.id, sectionId, measureId, onNoteClick],
  );

  const hasTechniques = note.techniques && note.techniques.length > 0;

  return (
    <g
      onClick={handleClick}
      style={{ cursor: currentTool === "eraser" ? "not-allowed" : "pointer" }}
    >
      {/* 배경 (줄 위 텍스트가 보이도록) */}
      <rect
        x={cx - 8}
        y={cy - 8}
        width={16}
        height={16}
        rx={2}
        className={
          isSelected ? "fill-violet-200 dark:fill-violet-800" : "fill-white dark:fill-gray-900"
        }
      />
      {/* 프렛 번호 */}
      <text
        x={cx}
        y={cy + 4}
        textAnchor="middle"
        fontSize={12}
        fontWeight="bold"
        className={
          isSelected ? "fill-violet-700 dark:fill-violet-200" : "fill-gray-900 dark:fill-gray-100"
        }
      >
        {note.fret}
      </text>
      {/* 선택 테두리 */}
      {isSelected && (
        <rect
          x={cx - 9}
          y={cy - 9}
          width={18}
          height={18}
          rx={3}
          fill="none"
          className="stroke-violet-500"
          strokeWidth={2}
        />
      )}
      {/* 기법 표시 */}
      {hasTechniques &&
        note.techniques!.map((techId, tIdx) => {
          const meta = TECHNIQUE_COLOR_MAP.get(techId);
          if (!meta) return null;
          return (
            <text
              key={techId}
              x={cx}
              y={cy - 12 - tIdx * 9}
              textAnchor="middle"
              fontSize={8}
              fontWeight="bold"
              fill={meta.color}
              className="pointer-events-none"
            >
              {meta.symbol}
            </text>
          );
        })}
    </g>
  );
}
