-- "tabId" 컬럼이 초기 스키마에 있지만, 테이블이 이전 버전으로 생성됐을 경우
-- 컬럼이 누락될 수 있어 IF NOT EXISTS로 안전하게 추가합니다.
alter table jam_rooms add column if not exists "tabId" uuid;
