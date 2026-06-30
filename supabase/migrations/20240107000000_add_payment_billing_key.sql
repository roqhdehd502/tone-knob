-- 결제 테이블에 PortOne V2 빌링키 컬럼 추가 (정기결제/구독용)
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS "billingKey" VARCHAR(255);
