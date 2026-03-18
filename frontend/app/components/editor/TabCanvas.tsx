import { useCallback, useEffect, useRef, useState } from "react";

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
  onNotePreview?: (stringIndex: number, fret: number) => void;
  onNoteUpdate?: (
    noteId: string,
    updates: Partial<Pick<Note, "fret" | "string" | "position" | "duration">>,
  ) => void;
}

export function TabCanvas({
  sections,
  tuning,
  selectedNoteIds,
  selectedMeasureId,
  currentTool,
  currentDuration,
  currentFret,
  onNoteClick,
  onCellClick,
  onMeasureClick,
  onNotePreview,
  onNoteUpdate,
}: TabCanvasProps) {
  // 전체 캔버스 높이 계산
  let totalHeight = 0;
  for (const section of sections) {
    const rows = Math.ceil(section.measures.length / MEASURES_PER_ROW);
    totalHeight += SECTION_HEADER_HEIGHT + rows * ROW_HEIGHT + 16;
  }

  // 편집 모드 상태 (한 번 더 클릭 시 수정모드 진입)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  // 드래그 상태
  const [dragNoteId, setDragNoteId] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // 수정모드에서 바깥 클릭 시 해제 + Escape로 해제
  useEffect(() => {
    if (!editingNoteId) return;
    const handleOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // SVG 내부 note-group 또는 toolbar 내부 클릭은 무시
      if (
        target.closest(`[data-note-edit="${editingNoteId}"]`) ||
        target.closest("[data-toolbar]")
      ) {
        return;
      }
      setEditingNoteId(null);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setEditingNoteId(null);
      }
    };
    window.addEventListener("mousedown", handleOutside);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("mousedown", handleOutside);
      window.removeEventListener("keydown", handleKey);
    };
  }, [editingNoteId]);

  // 수정모드 중 toolbar에서 프렛 변경 시 해당 음표에 반영
  const prevFretRef = useRef(currentFret);
  useEffect(() => {
    if (editingNoteId && onNoteUpdate && prevFretRef.current !== currentFret) {
      onNoteUpdate(editingNoteId, { fret: currentFret });
    }
    prevFretRef.current = currentFret;
  }, [currentFret, editingNoteId, onNoteUpdate]);

  // 수정모드 중 toolbar에서 듀레이션 변경 시 해당 음표에 반영
  const prevDurationRef = useRef(currentDuration);
  useEffect(() => {
    if (editingNoteId && onNoteUpdate && prevDurationRef.current !== currentDuration) {
      onNoteUpdate(editingNoteId, { duration: currentDuration });
    }
    prevDurationRef.current = currentDuration;
  }, [currentDuration, editingNoteId, onNoteUpdate]);

  const handleNoteDoubleClick = useCallback((noteId: string) => {
    setEditingNoteId(noteId);
  }, []);

  // SVG 좌표 → 마디 내 string/position 변환 (드래그용)
  const svgPointToCell = useCallback(
    (clientX: number, clientY: number) => {
      if (!svgRef.current) return null;
      const pt = svgRef.current.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;
      const ctm = svgRef.current.getScreenCTM()?.inverse();
      if (!ctm) return null;
      const svgPt = pt.matrixTransform(ctm);

      // Find which measure the point is over
      let globalYOffset = 0;
      for (const section of sections) {
        const rows = Math.ceil(section.measures.length / MEASURES_PER_ROW);
        for (let mIdx = 0; mIdx < section.measures.length; mIdx++) {
          const row = Math.floor(mIdx / MEASURES_PER_ROW);
          const col = mIdx % MEASURES_PER_ROW;
          const mx = LEFT_LABEL_WIDTH + col * MEASURE_WIDTH;
          const my = globalYOffset + SECTION_HEADER_HEIGHT + row * ROW_HEIGHT;
          const innerWidth = MEASURE_WIDTH - 2;

          if (
            svgPt.x >= mx &&
            svgPt.x <= mx + MEASURE_WIDTH &&
            svgPt.y >= my + MEASURE_PADDING - 10 &&
            svgPt.y <= my + MEASURE_PADDING + (STRING_COUNT - 1) * STRING_GAP + 10
          ) {
            const relY = svgPt.y - (my + MEASURE_PADDING);
            const stringIndex = Math.round(relY / STRING_GAP);
            const clampedString = Math.max(0, Math.min(STRING_COUNT - 1, stringIndex));

            const relX = svgPt.x - mx - 10;
            const posRaw = relX / (innerWidth - 20);
            const posSnapped = Math.round(posRaw * NOTE_POSITIONS) / NOTE_POSITIONS;
            const clampedPos = Math.max(
              0,
              Math.min((NOTE_POSITIONS - 1) / NOTE_POSITIONS, posSnapped),
            );

            return { string: clampedString, position: clampedPos };
          }
        }
        globalYOffset += SECTION_HEADER_HEIGHT + rows * ROW_HEIGHT + 16;
      }
      return null;
    },
    [sections],
  );

  const handleDragMove = useCallback(() => {
    // 드래그 중 시각적 피드백은 .dragging CSS 클래스로 처리
  }, []);

  const handleDragEnd = useCallback(
    (e: React.MouseEvent) => {
      if (!dragNoteId || !onNoteUpdate) {
        setDragNoteId(null);
        return;
      }
      const cell = svgPointToCell(e.clientX, e.clientY);
      if (cell) {
        onNoteUpdate(dragNoteId, { string: cell.string, position: cell.position });
      }
      setDragNoteId(null);
    },
    [dragNoteId, onNoteUpdate, svgPointToCell],
  );

  return (
    <svg
      ref={svgRef}
      width="100%"
      viewBox={`0 0 ${LEFT_LABEL_WIDTH + MEASURES_PER_ROW * MEASURE_WIDTH + 20} ${totalHeight + 20}`}
      className="select-none"
      onMouseMove={handleDragMove}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
    >
      {/* CSS for hover effects (embedded in SVG) */}
      <defs>
        <style>{`
          .note-group { cursor: pointer; }
          .note-group:hover .note-bg { filter: brightness(0.95); }
          .note-group:hover .note-border-hover {
            opacity: 1;
          }
          .note-border-hover { opacity: 0; transition: opacity 0.15s; }
          .note-group.eraser-cursor { cursor: not-allowed; }
          .note-group.dragging { opacity: 0.5; }
          .cell-hover:hover rect { fill: rgba(10, 186, 181, 0.08); }
          .cell-hover:hover text { fill: rgba(10, 186, 181, 0.5); }
        `}</style>
      </defs>

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
            editingNoteId={editingNoteId}
            dragNoteId={dragNoteId}
            onNoteClick={onNoteClick}
            onCellClick={onCellClick}
            onMeasureClick={onMeasureClick}
            onNotePreview={onNotePreview}
            onNoteDoubleClick={handleNoteDoubleClick}
            onDragStart={setDragNoteId}
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
  editingNoteId,
  dragNoteId,
  onNoteClick,
  onCellClick,
  onMeasureClick,
  onNotePreview,
  onNoteDoubleClick,
  onDragStart,
}: {
  section: Section;
  tuning: string[];
  yOffset: number;
  selectedNoteIds: Set<string>;
  selectedMeasureId: string | null;
  currentTool: "select" | "note" | "eraser";
  currentFret: number;
  editingNoteId: string | null;
  dragNoteId: string | null;
  onNoteClick: (noteId: string, sectionId: string, measureId: string) => void;
  onCellClick: (
    sectionId: string,
    measureId: string,
    stringIndex: number,
    position: number,
  ) => void;
  onMeasureClick: (measureId: string) => void;
  onNotePreview?: (stringIndex: number, fret: number) => void;
  onNoteDoubleClick: (noteId: string) => void;
  onDragStart: (noteId: string) => void;
}) {
  return (
    <g transform={`translate(0, ${yOffset})`}>
      {/* 섹션 헤더 */}
      <text
        x={LEFT_LABEL_WIDTH}
        y={20}
        className="fill-miami-600 dark:fill-miami-400"
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
              editingNoteId={editingNoteId}
              dragNoteId={dragNoteId}
              onNoteClick={onNoteClick}
              onCellClick={onCellClick}
              onMeasureClick={onMeasureClick}
              onNotePreview={onNotePreview}
              onNoteDoubleClick={onNoteDoubleClick}
              onDragStart={onDragStart}
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
  editingNoteId,
  dragNoteId,
  onNoteClick,
  onCellClick,
  onMeasureClick,
  onNotePreview,
  onNoteDoubleClick,
  onDragStart,
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
  editingNoteId: string | null;
  dragNoteId: string | null;
  onNoteClick: (noteId: string, sectionId: string, measureId: string) => void;
  onCellClick: (
    sectionId: string,
    measureId: string,
    stringIndex: number,
    position: number,
  ) => void;
  onMeasureClick: (measureId: string) => void;
  onNotePreview?: (stringIndex: number, fret: number) => void;
  onNoteDoubleClick: (noteId: string) => void;
  onDragStart: (noteId: string) => void;
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
        className={isSelected ? "fill-miami-50 dark:fill-miami-950/30" : "fill-transparent"}
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
                className="cell-hover"
                onClick={() => handleCellClick(sIdx, position)}
                style={{ cursor: "crosshair" }}
              >
                <rect x={cx - 8} y={cy - 8} width={16} height={16} fill="transparent" rx={2} />
                <text
                  x={cx}
                  y={cy + 4}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight="bold"
                  fill="transparent"
                  className="pointer-events-none"
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
        const isEditing = editingNoteId === note.id;
        const isDragging = dragNoteId === note.id;

        return (
          <NoteRenderer
            key={note.id}
            note={note}
            cx={cx}
            cy={cy}
            isSelected={isNoteSelected}
            isEditing={isEditing}
            isDragging={isDragging}
            sectionId={sectionId}
            measureId={measure.id}
            currentTool={currentTool}
            onNoteClick={onNoteClick}
            onNotePreview={onNotePreview}
            onNoteDoubleClick={onNoteDoubleClick}
            onDragStart={onDragStart}
          />
        );
      })}
    </g>
  );
}

const TECHNIQUE_COLOR_MAP = new Map(
  TECHNIQUE_META.map((t) => [t.id, { symbol: t.symbol, color: t.color }]),
);

// Duration → visual stem/flag indicator
function DurationIndicator({
  duration,
  cx,
  cy,
  isSelected,
}: {
  duration: Duration;
  cx: number;
  cy: number;
  isSelected: boolean;
}) {
  const stemColor = isSelected ? "#0ABAB5" : "#9ca3af";
  const stemX = cx + 8;
  const stemTop = cy - 14;
  const stemBottom = cy + 2;
  const isRest = duration < 0;
  const abs = Math.abs(duration);

  // 쉼표: 간단한 텍스트 기호로 표시
  if (isRest) {
    const restSymbol =
      abs >= 1
        ? "𝄻" // 온쉼표
        : abs >= 0.5
          ? "𝄼" // 2분쉼표
          : abs >= 0.25
            ? "𝄽" // 4분쉼표
            : abs >= 0.125
              ? "𝄾" // 8분쉼표
              : abs >= 0.0625
                ? "𝄿" // 16분쉼표
                : "𝅀"; // 32분쉼표
    return (
      <text
        x={cx}
        y={cy + 15}
        textAnchor="middle"
        fontSize={10}
        fill={stemColor}
        className="pointer-events-none"
      >
        {restSymbol}
      </text>
    );
  }

  // 점음표 여부 판별
  const isDotted = abs === 0.75 || abs === 0.375 || abs === 0.1875;
  // 기본 duration으로 매핑 (점음표→기본형)
  const baseDur = isDotted ? (abs === 0.75 ? 0.5 : abs === 0.375 ? 0.25 : 0.125) : abs;

  // 깃발 수 계산
  const flags = baseDur <= 0.03125 ? 3 : baseDur <= 0.0625 ? 2 : baseDur <= 0.125 ? 1 : 0;
  const hasStem = baseDur < 1;
  const filled = baseDur <= 0.25;

  // 온음표: 동그라미만
  if (!hasStem) {
    return (
      <g className="pointer-events-none">
        <ellipse
          cx={cx}
          cy={cy + 12}
          rx={4}
          ry={3}
          fill="none"
          stroke={stemColor}
          strokeWidth={1}
        />
        {isDotted && <circle cx={cx + 6} cy={cy + 12} r={1} fill={stemColor} />}
      </g>
    );
  }

  return (
    <g className="pointer-events-none">
      {/* 줄기 */}
      <line x1={stemX} y1={stemTop} x2={stemX} y2={stemBottom} stroke={stemColor} strokeWidth={1} />
      {/* 머리 */}
      {filled ? (
        <ellipse cx={cx} cy={cy + 12} rx={3.5} ry={2.5} fill={stemColor} />
      ) : (
        <ellipse
          cx={cx}
          cy={cy + 12}
          rx={4}
          ry={3}
          fill="none"
          stroke={stemColor}
          strokeWidth={1}
        />
      )}
      {/* 깃발 */}
      {Array.from({ length: flags }).map((_, i) => (
        <path
          key={i}
          d={`M${stemX},${stemTop + i * 5} Q${stemX + 6},${stemTop + i * 5 + 4} ${stemX + 2},${stemTop + i * 5 + 8}`}
          fill="none"
          stroke={stemColor}
          strokeWidth={1}
        />
      ))}
      {/* 점 (점음표) */}
      {isDotted && <circle cx={cx + 6} cy={cy + 12} r={1} fill={stemColor} />}
    </g>
  );
}

function NoteRenderer({
  note,
  cx,
  cy,
  isSelected,
  isEditing,
  isDragging,
  sectionId,
  measureId,
  currentTool,
  onNoteClick,
  onNotePreview,
  onNoteDoubleClick,
  onDragStart,
}: {
  note: Note;
  cx: number;
  cy: number;
  isSelected: boolean;
  isEditing: boolean;
  isDragging: boolean;
  sectionId: string;
  measureId: string;
  currentTool: "select" | "note" | "eraser";
  onNoteClick: (noteId: string, sectionId: string, measureId: string) => void;
  onNotePreview?: (stringIndex: number, fret: number) => void;
  onNoteDoubleClick: (noteId: string) => void;
  onDragStart: (noteId: string) => void;
}) {
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clickCountRef = useRef(0);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      clickCountRef.current += 1;

      if (clickCountRef.current === 1) {
        clickTimerRef.current = setTimeout(() => {
          // 싱글 클릭: 선택 + 미리듣기
          onNoteClick(note.id, sectionId, measureId);
          onNotePreview?.(note.string, note.fret);
          clickCountRef.current = 0;
        }, 250);
      } else if (clickCountRef.current === 2) {
        // 더블 클릭: 수정 모드
        if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
        clickCountRef.current = 0;
        onNoteClick(note.id, sectionId, measureId);
        onNoteDoubleClick(note.id);
      }
    },
    [
      note.id,
      note.string,
      note.fret,
      sectionId,
      measureId,
      onNoteClick,
      onNotePreview,
      onNoteDoubleClick,
    ],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (currentTool !== "select" || isEditing) return;
      // 드래그 시작 (약간의 이동 감지 후)
      const startX = e.clientX;
      const startY = e.clientY;
      const onMove = (me: MouseEvent) => {
        const dx = me.clientX - startX;
        const dy = me.clientY - startY;
        if (Math.abs(dx) + Math.abs(dy) > 5) {
          onDragStart(note.id);
          window.removeEventListener("mousemove", onMove);
          window.removeEventListener("mouseup", onUp);
        }
      };
      const onUp = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [note.id, currentTool, isEditing, onDragStart],
  );

  const hasTechniques = note.techniques && note.techniques.length > 0;
  const displayFret = String(note.fret);

  return (
    <g
      className={`note-group${currentTool === "eraser" ? " eraser-cursor" : ""}${isDragging ? " dragging" : ""}`}
      data-note-edit={isEditing ? note.id : undefined}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
    >
      {/* 호버 시 보이는 테두리 */}
      <rect
        x={cx - 10}
        y={cy - 10}
        width={20}
        height={20}
        rx={4}
        fill="none"
        stroke="#0ABAB5"
        strokeWidth={1.5}
        strokeDasharray={isEditing ? "none" : "3 2"}
        className="note-border-hover"
      />
      {/* 배경 (줄 위 텍스트가 보이도록) */}
      <rect
        x={cx - 8}
        y={cy - 8}
        width={16}
        height={16}
        rx={2}
        className={`note-bg ${
          isEditing
            ? "fill-amber-100 dark:fill-amber-900/40"
            : isSelected
              ? "fill-miami-200 dark:fill-miami-800"
              : "fill-white dark:fill-gray-900"
        }`}
      />
      {/* 프렛 번호 */}
      <text
        x={cx}
        y={cy + 4}
        textAnchor="middle"
        fontSize={12}
        fontWeight="bold"
        className={
          isEditing
            ? "fill-amber-700 dark:fill-amber-200"
            : isSelected
              ? "fill-miami-700 dark:fill-miami-200"
              : "fill-gray-900 dark:fill-gray-100"
        }
      >
        {displayFret}
      </text>
      {/* 편집 모드 표시기 (툴바에서 프렛/듀레이션/기법 변경 시 반영됨) */}
      {isEditing && (
        <g className="pointer-events-none">
          <rect
            x={cx - 11}
            y={cy - 11}
            width={22}
            height={22}
            rx={4}
            fill="none"
            stroke="#d97706"
            strokeWidth={2}
            strokeDasharray="3 2"
          >
            <animate
              attributeName="stroke-opacity"
              values="1;0.4;1"
              dur="1.5s"
              repeatCount="indefinite"
            />
          </rect>
          <text x={cx} y={cy + 18} textAnchor="middle" fontSize={7} fill="#d97706" fontWeight="600">
            수정중
          </text>
        </g>
      )}
      {/* 선택 테두리 */}
      {isSelected && !isEditing && (
        <rect
          x={cx - 9}
          y={cy - 9}
          width={18}
          height={18}
          rx={3}
          fill="none"
          className="stroke-miami-500"
          strokeWidth={2}
        />
      )}
      {/* 편집 모드 테두리 */}
      {isEditing && (
        <rect
          x={cx - 9}
          y={cy - 9}
          width={18}
          height={18}
          rx={3}
          fill="none"
          stroke="#d97706"
          strokeWidth={2}
        />
      )}
      {/* 음표 길이 표시 */}
      <DurationIndicator duration={note.duration} cx={cx} cy={cy} isSelected={isSelected} />
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
