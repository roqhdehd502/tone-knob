-- RLS 미적용 테이블 3종 보완
--   badges, user_badges  — 20240103000000에서 테이블 생성 시 누락
--   schema_migrations    — scripts/migrate.js 가 동적 생성 시 누락
--
-- postgres (service role) 는 RLS 우회 → 백엔드·마이그레이션 스크립트 동작 무관
-- anon / authenticated 롤은 정책이 없으면 기본 DENY

-- ── badges ───────────────────────────────────────────────────────────────────
-- 뱃지 정의 테이블 — 공개 조회 허용 (프로필 페이지 뱃지 표시)
-- INSERT / UPDATE / DELETE 는 정책 없음 → 서비스 롤 전용
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "badges_public_read" ON badges
  FOR SELECT USING (true);

-- ── user_badges ──────────────────────────────────────────────────────────────
-- 사용자 뱃지 획득 기록 — 공개 조회 허용 (공개 프로필 뱃지 컬렉션)
-- 뱃지 수여는 community-svc 서비스 롤 전용 (정책 없음)
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_badges_public_read" ON user_badges
  FOR SELECT USING (true);

-- ── schema_migrations ────────────────────────────────────────────────────────
-- 내부 마이그레이션 추적 테이블 — API 접근 전면 차단
-- postgres (service role) 는 RLS 우회 → npm run migrate 동작 무관
ALTER TABLE schema_migrations ENABLE ROW LEVEL SECURITY;
-- 정책 없음 = anon / authenticated 롤 SELECT / INSERT / UPDATE / DELETE 전부 차단
