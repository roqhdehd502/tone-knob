import { createClient } from "@supabase/supabase-js";

import type { Database } from "~/types/database";

/** 싱글턴 Supabase 클라이언트 인스턴스 */
let _client: ReturnType<typeof createClient<Database>> | null = null;

/**
 * Supabase 서비스 롤(service role) 클라이언트 싱글턴을 반환한다.
 * 최초 호출 시 환경 변수에서 URL/키를 읽어 초기화하며, 이후 호출은 캐시된 인스턴스를 반환한다.
 * `persistSession: false` — 서버 사이드에서 세션을 유지하지 않는다.
 *
 * @throws 환경 변수 `SUPABASE_URL` 또는 `SUPABASE_SERVICE_ROLE_KEY`가 없으면 에러를 던진다
 * @returns Supabase 클라이언트 인스턴스
 */
export function getSupabase() {
  if (!_client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
    _client = createClient<Database>(url, key, { auth: { persistSession: false } });
  }
  return _client;
}
