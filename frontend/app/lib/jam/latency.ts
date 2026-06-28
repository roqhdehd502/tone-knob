/** 핑(ms)에 따른 색상 클래스 — 합주방 내 본인/상대방 지연시간 표시에 공용으로 사용 */
export function getLatencyColor(ms: number | null): string {
  if (ms === null) return "text-gray-400";
  if (ms < 50) return "text-green-500";
  if (ms < 100) return "text-yellow-500";
  return "text-red-500";
}
