-- ============================================================
-- Tone Knob – Seed Data (개발/스테이징용)
-- ============================================================

-- 데모 유저
insert into users (id, email, username, "passwordHash", "displayName", "avatarUrl", bio, role, "subscriptionTier")
values
  (
    '00000000-0000-0000-0000-000000000001',
    'admin@toneknob.dev',
    'admin',
    '$2b$10$HT6U1HXFOsTnAatoon0O7e8IOuDAGkW1Zrim0EpiDMDLMb7L48wQu',
    'Tone Knob Admin',
    null,
    '플랫폼 관리자 계정입니다.',
    'admin',
    'pro'
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'demo@toneknob.dev',
    'demo_guitarist',
    '$2b$10$HT6U1HXFOsTnAatoon0O7e8IOuDAGkW1Zrim0EpiDMDLMb7L48wQu',
    '데모 기타리스트',
    null,
    '안녕하세요! Tone Knob 데모 계정입니다. 타브 제작과 온라인 합주를 즐겨요.',
    'user',
    'premium'
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'alice@toneknob.dev',
    'alice_bassist',
    '$2b$10$HT6U1HXFOsTnAatoon0O7e8IOuDAGkW1Zrim0EpiDMDLMb7L48wQu',
    'Alice (베이시스트)',
    null,
    '베이스 기타 10년차. 재즈와 펑크를 좋아합니다.',
    'user',
    'free'
  )
on conflict (id) do nothing;

-- 데모 탭
insert into tabs (id, "userId", title, artist, content, "isPublic", price)
values
  (
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000002',
    'Wonderwall',
    'Oasis',
    '{"tempo": 86, "timeSignature": "4/4", "tuning": "standard", "tracks": [{"instrument": "guitar", "measures": []}]}',
    true,
    0
  ),
  (
    '00000000-0000-0000-0000-000000000102',
    '00000000-0000-0000-0000-000000000002',
    'Hotel California (Solo)',
    'Eagles',
    '{"tempo": 75, "timeSignature": "4/4", "tuning": "standard", "tracks": [{"instrument": "guitar", "measures": []}]}',
    true,
    2000
  ),
  (
    '00000000-0000-0000-0000-000000000103',
    '00000000-0000-0000-0000-000000000003',
    'Teen Town',
    'Weather Report',
    '{"tempo": 120, "timeSignature": "4/4", "tuning": "standard", "tracks": [{"instrument": "bass", "measures": []}]}',
    true,
    0
  )
on conflict (id) do nothing;

-- 데모 구독
insert into subscriptions (id, "userId", plan, status, "priceMonthly")
values
  (
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000002',
    'premium',
    'active',
    9900
  )
on conflict (id) do nothing;

-- 데모 팔로우 관계
insert into follows ("followerId", "followingId")
values
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003')
on conflict ("followerId", "followingId") do nothing;

-- 데모 좋아요
insert into likes ("userId", "tabId")
values
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000101'),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000103')
on conflict ("userId", "tabId") do nothing;

-- 데모 연습 세션
insert into practice_sessions ("userId", "tabId", "durationSeconds", bpm, "speedMultiplier")
values
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000101', 1800, 86, 0.8),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000102', 3600, 75, 1.0),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000103', 2700, 120, 0.9);

-- 데모 리뷰
insert into reviews ("userId", "tabId", rating, content)
values
  (
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000101',
    5,
    '정확하고 깔끔한 타브입니다. 초보자도 따라할 수 있어요!'
  )
on conflict ("userId", "tabId") do nothing;
