-- ============================================================
-- notification_type_enum 확장: badge_awarded
-- ============================================================
-- BADGE_EVENTS.AWARDED 발행/구독 연동 시 뱃지 획득 알림에 사용
alter type notification_type_enum add value if not exists 'badge_awarded';
