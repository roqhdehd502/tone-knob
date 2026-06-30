-- 동일한 PortOne externalPaymentId가 두 개 이상의 결제 레코드에 사용되는 것을 DB 레벨에서 차단한다
-- (애플리케이션 레벨 중복 검사만으로는 동시 요청 경쟁 상태를 완전히 막을 수 없음).
CREATE UNIQUE INDEX IF NOT EXISTS payments_external_payment_id_unique
  ON public.payments ("externalPaymentId")
  WHERE "externalPaymentId" IS NOT NULL;
