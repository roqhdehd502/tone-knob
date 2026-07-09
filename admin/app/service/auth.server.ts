import bcrypt from "bcryptjs";

import { getSupabase } from "./supabase.server";

/** Supabase `users` 테이블에서 조회하는 어드민 계정 형태 */
type AdminUser = {
  /** UUID 기본키 */
  id: string;
  /** 로그인 이메일 */
  email: string;
  /** 사용자명 */
  username: string;
  /** 표시 이름 (선택) */
  displayName: string | null;
  /** bcrypt 해시된 비밀번호 */
  passwordHash: string;
  /** 계정 역할 — 반드시 `"admin"` 이어야 한다 */
  role: string;
};

/**
 * 이메일·비밀번호로 어드민 계정을 인증한다.
 * `role = "admin"` 인 계정만 조회하므로 일반 사용자는 통과할 수 없다.
 *
 * @param email - 로그인 이메일
 * @param password - 평문 비밀번호
 * @returns 인증 성공 시 `{ id, email, name }`, 실패 시 `null`
 */
export async function verifyAdminCredentials(email: string, password: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .eq("role", "admin")
    .single();

  if (error || !data) return null;

  const user = data as unknown as AdminUser;
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.displayName || user.username,
  };
}
