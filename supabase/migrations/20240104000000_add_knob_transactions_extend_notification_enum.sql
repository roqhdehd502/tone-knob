-- ============================================================
-- Knob Transactions 테이블 + Notification Type Enum 확장
-- ============================================================

-- 1. knob_transaction_type_enum
create type knob_transaction_type_enum as enum (
  'earn_tab_created',
  'earn_jam_participated',
  'earn_community_activity',
  'earn_daily_login',
  'earn_tab_sale',
  'spend_tab_purchase',
  'spend_premium_feature'
);

-- 2. knob_transactions 테이블
create table if not exists knob_transactions (
  id              uuid primary key default gen_random_uuid(),
  "userId"        uuid not null references users(id) on delete cascade,
  type            knob_transaction_type_enum not null,
  amount          integer not null,
  "balanceAfter"  integer not null,
  description     varchar(500),
  "referenceId"   uuid,
  "createdAt"     timestamp not null default now()
);

create index if not exists idx_knob_transactions_user_id on knob_transactions("userId");
create index if not exists idx_knob_transactions_created_at on knob_transactions("createdAt");

alter table knob_transactions enable row level security;

-- 3. notification_type_enum 확장
-- 기존: 'like', 'comment', 'reply', 'follow', 'jam_invite'
-- 추가: 'purchase', 'payment', 'ai_job', 'tab_forked', 'tab_published'
alter type notification_type_enum add value if not exists 'purchase';
alter type notification_type_enum add value if not exists 'payment';
alter type notification_type_enum add value if not exists 'ai_job';
alter type notification_type_enum add value if not exists 'tab_forked';
alter type notification_type_enum add value if not exists 'tab_published';
