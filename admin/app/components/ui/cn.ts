import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * 여러 클래스 값을 병합하여 충돌 없는 단일 Tailwind 클래스 문자열을 반환한다.
 * 내부적으로 `clsx`로 조건부 클래스를 처리하고 `tailwind-merge`로 중복/충돌을 제거한다.
 *
 * @param inputs - 클래스 값 목록 (문자열, 객체, 배열 등 `clsx` 지원 형식)
 * @returns 병합된 Tailwind 클래스 문자열
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
