-- ============================================================
-- Tone Knob – Initial Schema Migration
-- Generated from TypeORM entities (20 tables)
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================
-- ENUM TYPES
-- ============================================================

create type operation_type_enum as enum ('insert', 'delete', 'update', 'cursor');
create type ai_job_type_enum    as enum ('tab_generation', 'audio_extraction');
create type ai_job_status_enum  as enum ('queued', 'processing', 'completed', 'failed');
create type payment_status_enum as enum ('pending', 'completed', 'failed', 'refunded');
create type payment_type_enum   as enum ('subscription', 'tab_purchase');
create type purchase_status_enum        as enum ('completed', 'refunded');
create type notification_type_enum      as enum ('like', 'comment', 'reply', 'follow', 'jam_invite');
create type recording_visibility_enum   as enum ('public', 'private', 'unlisted');
create type settlement_status_enum      as enum ('pending', 'processing', 'completed', 'failed');
create type subscription_plan_enum      as enum ('free', 'premium', 'pro');
create type subscription_status_enum    as enum ('active', 'cancelled', 'expired');

-- ============================================================
-- TABLES  (dependency order)
-- ============================================================

-- 1. users
create table if not exists users (
  id                    uuid primary key default gen_random_uuid(),
  email                 varchar(255) not null unique,
  username              varchar(50)  not null unique,
  "passwordHash"        varchar(255) not null,
  "displayName"         varchar(100),
  "avatarUrl"           text,
  bio                   varchar(500),
  role                  varchar(20)  not null default 'user',
  "subscriptionTier"    varchar(20)  not null default 'free',
  "subscriptionExpiresAt" timestamp,
  "createdAt"           timestamp    not null default now(),
  "updatedAt"           timestamp    not null default now()
);

-- 2. tabs
create table if not exists tabs (
  id             uuid primary key default gen_random_uuid(),
  "userId"       uuid not null references users(id) on delete cascade,
  title          varchar(200) not null,
  artist         varchar(100),
  content        jsonb        not null default '{}',
  "thumbnailUrl" text,
  "isPublic"     boolean      not null default false,
  "viewCount"    integer      not null default 0,
  "likeCount"    integer      not null default 0,
  "downloadCount" integer     not null default 0,
  price          integer      not null default 0,
  "createdAt"    timestamp    not null default now(),
  "updatedAt"    timestamp    not null default now()
);

-- 3. tab_versions
create table if not exists tab_versions (
  id                  uuid primary key default gen_random_uuid(),
  "tabId"             uuid         not null references tabs(id) on delete cascade,
  "versionNumber"     integer      not null,
  content             jsonb        not null default '{}',
  "changeDescription" text,
  "createdBy"         uuid references users(id),
  "createdAt"         timestamp    not null default now()
);

-- 4. jam_rooms
create table if not exists jam_rooms (
  id                   uuid primary key default gen_random_uuid(),
  name                 varchar(100) not null,
  description          text,
  "hostId"             uuid not null references users(id) on delete cascade,
  "tabId"              uuid,
  "maxParticipants"    integer   not null default 4,
  "currentParticipants" integer  not null default 0,
  "isActive"           boolean   not null default true,
  "isPrivate"          boolean   not null default false,
  password             varchar(50),
  bpm                  integer   not null default 120,
  "createdAt"          timestamp not null default now(),
  "updatedAt"          timestamp not null default now()
);

-- 5. jam_participants
create table if not exists jam_participants (
  id            uuid primary key default gen_random_uuid(),
  "roomId"      uuid not null references jam_rooms(id) on delete cascade,
  "userId"      uuid not null references users(id)     on delete cascade,
  "socketId"    varchar(100),
  "isMuted"     boolean  not null default false,
  volume        integer  not null default 100,
  "isConnected" boolean  not null default true,
  "joinedAt"    timestamp not null default now(),
  unique ("roomId", "userId")
);

-- 6. likes
create table if not exists likes (
  id         uuid primary key default gen_random_uuid(),
  "userId"   uuid not null references users(id) on delete cascade,
  "tabId"    uuid not null references tabs(id)  on delete cascade,
  "createdAt" timestamp not null default now(),
  unique ("userId", "tabId")
);

-- 7. comments
create table if not exists comments (
  id          uuid primary key default gen_random_uuid(),
  "userId"    uuid not null references users(id)    on delete cascade,
  "tabId"     uuid not null references tabs(id)     on delete cascade,
  content     text not null,
  "parentId"  uuid references comments(id)          on delete cascade,
  "createdAt" timestamp not null default now(),
  "updatedAt" timestamp not null default now()
);

-- 8. follows
create table if not exists follows (
  id            uuid primary key default gen_random_uuid(),
  "followerId"  uuid not null references users(id) on delete cascade,
  "followingId" uuid not null references users(id) on delete cascade,
  "createdAt"   timestamp not null default now(),
  unique ("followerId", "followingId")
);

-- 9. notifications
create table if not exists notifications (
  id            uuid primary key default gen_random_uuid(),
  "recipientId" uuid not null references users(id) on delete cascade,
  "actorId"     uuid not null references users(id) on delete cascade,
  type          notification_type_enum not null,
  "referenceId" uuid,
  message       varchar(500) not null,
  "isRead"      boolean   not null default false,
  "createdAt"   timestamp not null default now()
);

-- 10. reviews
create table if not exists reviews (
  id          uuid primary key default gen_random_uuid(),
  "userId"    uuid not null references users(id) on delete cascade,
  "tabId"     uuid not null references tabs(id)  on delete cascade,
  rating      integer   not null check (rating between 1 and 5),
  content     text,
  "createdAt" timestamp not null default now(),
  "updatedAt" timestamp not null default now(),
  unique ("userId", "tabId")
);

-- 11. tab_purchases
create table if not exists tab_purchases (
  id           uuid primary key default gen_random_uuid(),
  "buyerId"    uuid not null references users(id) on delete cascade,
  "sellerId"   uuid not null references users(id) on delete cascade,
  "tabId"      uuid not null references tabs(id)  on delete cascade,
  price        integer not null,
  status       purchase_status_enum not null default 'completed',
  "createdAt"  timestamp not null default now(),
  unique ("buyerId", "tabId")
);

-- 12. subscriptions
create table if not exists subscriptions (
  id                   uuid primary key default gen_random_uuid(),
  "userId"             uuid not null references users(id) on delete cascade,
  plan                 subscription_plan_enum   not null default 'free',
  status               subscription_status_enum not null default 'active',
  "priceMonthly"       integer   not null default 0,
  "currentPeriodStart" timestamp,
  "currentPeriodEnd"   timestamp,
  "externalPaymentId"  varchar(255),
  "createdAt"          timestamp not null default now(),
  "updatedAt"          timestamp not null default now()
);

-- 13. settlements
create table if not exists settlements (
  id                   uuid primary key default gen_random_uuid(),
  "sellerId"           uuid not null references users(id) on delete cascade,
  "totalAmount"        integer not null,
  "platformFee"        integer not null default 0,
  "netAmount"          integer not null,
  status               settlement_status_enum not null default 'pending',
  "periodStart"        date not null,
  "periodEnd"          date not null,
  "externalTransferId" varchar(255),
  note                 text,
  "createdAt"          timestamp not null default now()
);

-- 14. practice_sessions
create table if not exists practice_sessions (
  id                 uuid primary key default gen_random_uuid(),
  "userId"           uuid not null references users(id) on delete cascade,
  "tabId"            uuid references tabs(id) on delete set null,
  "durationSeconds"  integer not null,
  bpm                integer,
  "speedMultiplier"  double precision,
  "loopStartMeasure" integer,
  "loopEndMeasure"   integer,
  "createdAt"        timestamp not null default now()
);

-- 15. recordings
create table if not exists recordings (
  id                uuid primary key default gen_random_uuid(),
  "userId"          uuid not null references users(id) on delete cascade,
  "tabId"           uuid references tabs(id) on delete set null,
  title             varchar(200) not null,
  description       text,
  "audioUrl"        varchar(500) not null,
  "durationSeconds" integer      not null,
  visibility        recording_visibility_enum not null default 'public',
  "playCount"       integer   not null default 0,
  "createdAt"       timestamp not null default now(),
  "updatedAt"       timestamp not null default now()
);

-- 16. payments
create table if not exists payments (
  id                  uuid primary key default gen_random_uuid(),
  "userId"            uuid not null references users(id) on delete cascade,
  type                payment_type_enum   not null,
  amount              integer             not null,
  currency            varchar(10)         not null default 'KRW',
  status              payment_status_enum not null default 'pending',
  provider            varchar(50)         not null default 'toss_payments',
  "externalPaymentId" varchar(255),
  "externalOrderId"   varchar(255),
  metadata            jsonb,
  "createdAt"         timestamp not null default now()
);

-- 17. collab_sessions
create table if not exists collab_sessions (
  id              uuid primary key default gen_random_uuid(),
  "tabId"         uuid not null unique references tabs(id) on delete cascade,
  revision        integer   not null default 0,
  snapshot        jsonb,
  "activeUserIds" text,   -- TypeORM simple-array: comma-separated text
  "createdAt"     timestamp not null default now(),
  "updatedAt"     timestamp not null default now()
);

-- 18. collab_operations
create table if not exists collab_operations (
  id            uuid primary key default gen_random_uuid(),
  "sessionId"   uuid not null references collab_sessions(id) on delete cascade,
  "userId"      uuid not null,
  revision      integer               not null,
  type          operation_type_enum   not null,
  payload       jsonb                 not null,
  "createdAt"   timestamp not null default now()
);

-- 19. ai_jobs
create table if not exists ai_jobs (
  id              uuid primary key default gen_random_uuid(),
  "userId"        uuid not null references users(id) on delete cascade,
  type            ai_job_type_enum   not null,
  status          ai_job_status_enum not null default 'queued',
  "inputData"     jsonb              not null default '{}',
  "outputData"    jsonb,
  "errorMessage"  text,
  progress        integer            not null default 0,
  "externalJobId" varchar(255),
  "createdAt"     timestamp not null default now(),
  "updatedAt"     timestamp not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================

-- tabs
create index if not exists idx_tabs_user_id  on tabs("userId");
create index if not exists idx_tabs_is_public on tabs("isPublic");

-- tab_versions
create index if not exists idx_tab_versions_tab_id on tab_versions("tabId");

-- jam_rooms
create index if not exists idx_jam_rooms_host_id   on jam_rooms("hostId");
create index if not exists idx_jam_rooms_is_active on jam_rooms("isActive");

-- jam_participants
create index if not exists idx_jam_participants_room_id on jam_participants("roomId");
create index if not exists idx_jam_participants_user_id on jam_participants("userId");

-- likes
create index if not exists idx_likes_user_id on likes("userId");
create index if not exists idx_likes_tab_id  on likes("tabId");

-- comments
create index if not exists idx_comments_user_id on comments("userId");
create index if not exists idx_comments_tab_id  on comments("tabId");

-- follows
create index if not exists idx_follows_follower_id  on follows("followerId");
create index if not exists idx_follows_following_id on follows("followingId");

-- notifications
create index if not exists idx_notifications_recipient_id on notifications("recipientId");
create index if not exists idx_notifications_is_read      on notifications("isRead");

-- reviews
create index if not exists idx_reviews_tab_id on reviews("tabId");

-- tab_purchases
create index if not exists idx_tab_purchases_buyer_id on tab_purchases("buyerId");
create index if not exists idx_tab_purchases_tab_id   on tab_purchases("tabId");

-- subscriptions
create index if not exists idx_subscriptions_user_id on subscriptions("userId");

-- settlements
create index if not exists idx_settlements_seller_id on settlements("sellerId");

-- practice_sessions
create index if not exists idx_practice_sessions_user_id on practice_sessions("userId");

-- recordings
create index if not exists idx_recordings_user_id on recordings("userId");

-- payments
create index if not exists idx_payments_user_id on payments("userId");

-- collab_operations
create index if not exists idx_collab_ops_session_id          on collab_operations("sessionId");
create index if not exists idx_collab_ops_session_revision    on collab_operations("sessionId", revision);

-- ai_jobs
create index if not exists idx_ai_jobs_user_id on ai_jobs("userId");

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
-- NestJS 백엔드는 postgres(service role)로 직접 연결하므로
-- RLS는 무시되지만, Supabase 대시보드 / REST API 직접 접근 차단용으로 활성화

alter table users              enable row level security;
alter table tabs               enable row level security;
alter table tab_versions       enable row level security;
alter table jam_rooms          enable row level security;
alter table jam_participants   enable row level security;
alter table likes              enable row level security;
alter table comments           enable row level security;
alter table follows            enable row level security;
alter table notifications      enable row level security;
alter table reviews            enable row level security;
alter table tab_purchases      enable row level security;
alter table subscriptions      enable row level security;
alter table settlements        enable row level security;
alter table practice_sessions  enable row level security;
alter table recordings         enable row level security;
alter table payments           enable row level security;
alter table collab_sessions    enable row level security;
alter table collab_operations  enable row level security;
alter table ai_jobs            enable row level security;

-- 백엔드 서비스 롤(postgres)은 RLS 우회 – 별도 정책 불필요
-- anon / authenticated 롤에 대한 기본 정책은 모두 DENY (RLS enabled = 기본 deny)

-- 공개 탭은 누구나 읽을 수 있도록 허용 (PostgREST 활용 시)
create policy "public_tabs_read" on tabs
  for select using ("isPublic" = true);

-- 공개 녹음은 누구나 읽을 수 있도록 허용
create policy "public_recordings_read" on recordings
  for select using (visibility = 'public');
