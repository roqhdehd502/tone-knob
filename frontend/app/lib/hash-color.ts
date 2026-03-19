/**
 * Hash-based Color Mapping
 * 사용자 ID 또는 이름을 기반으로 일관된 헥스 컬러를 생성합니다.
 */

const AVATAR_COLORS = [
  "#F87171", // red-400
  "#FB923C", // orange-400
  "#FBBF24", // amber-400
  "#A3E635", // lime-400
  "#34D399", // emerald-400
  "#22D3EE", // cyan-400
  "#60A5FA", // blue-400
  "#818CF8", // indigo-400
  "#A78BFA", // violet-400
  "#C084FC", // purple-400
  "#E879F9", // fuchsia-400
  "#F472B6", // pink-400
  "#2DD4BF", // teal-400
  "#4ADE80", // green-400
  "#38BDF8", // sky-400
  "#FB7185", // rose-400
];

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getAvatarColor(identifier: string): string {
  const hash = simpleHash(identifier);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export function getAvatarInitial(displayName?: string | null, username?: string): string {
  const name = displayName || username || "?";
  return name.charAt(0).toUpperCase();
}
