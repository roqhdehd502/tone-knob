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
    '{
      "title": "Wonderwall",
      "artist": "Oasis",
      "bpm": 86,
      "timeSignature": [4, 4],
      "tuning": ["E", "B", "G", "D", "A", "E"],
      "sections": [
        {
          "id": "s-ww-intro",
          "name": "Intro",
          "measures": [
            {
              "id": "m-ww-1",
              "notes": [
                {"id": "n-ww-1", "string": 0, "fret": 0, "duration": 0.25, "position": 0},
                {"id": "n-ww-2", "string": 1, "fret": 3, "duration": 0.25, "position": 0},
                {"id": "n-ww-3", "string": 2, "fret": 0, "duration": 0.25, "position": 0},
                {"id": "n-ww-4", "string": 3, "fret": 0, "duration": 0.25, "position": 0},
                {"id": "n-ww-5", "string": 4, "fret": 2, "duration": 0.25, "position": 0},
                {"id": "n-ww-6", "string": 5, "fret": 3, "duration": 0.25, "position": 0}
              ]
            },
            {
              "id": "m-ww-2",
              "notes": [
                {"id": "n-ww-7", "string": 0, "fret": 3, "duration": 0.25, "position": 0},
                {"id": "n-ww-8", "string": 1, "fret": 3, "duration": 0.25, "position": 0},
                {"id": "n-ww-9", "string": 2, "fret": 0, "duration": 0.25, "position": 0},
                {"id": "n-ww-10", "string": 3, "fret": 0, "duration": 0.25, "position": 0},
                {"id": "n-ww-11", "string": 4, "fret": 0, "duration": 0.25, "position": 0},
                {"id": "n-ww-12", "string": 5, "fret": 2, "duration": 0.25, "position": 0}
              ]
            },
            {
              "id": "m-ww-3",
              "notes": [
                {"id": "n-ww-13", "string": 0, "fret": 0, "duration": 0.25, "position": 0},
                {"id": "n-ww-14", "string": 1, "fret": 3, "duration": 0.25, "position": 0},
                {"id": "n-ww-15", "string": 2, "fret": 2, "duration": 0.25, "position": 0},
                {"id": "n-ww-16", "string": 3, "fret": 0, "duration": 0.25, "position": 0},
                {"id": "n-ww-17", "string": 4, "fret": 0, "duration": 0.25, "position": 0},
                {"id": "n-ww-18", "string": 5, "fret": 0, "duration": 0.5, "position": 0}
              ]
            },
            {
              "id": "m-ww-4",
              "notes": [
                {"id": "n-ww-19", "string": 0, "fret": 0, "duration": 0.25, "position": 0},
                {"id": "n-ww-20", "string": 1, "fret": 0, "duration": 0.25, "position": 0},
                {"id": "n-ww-21", "string": 2, "fret": 0, "duration": 0.25, "position": 0},
                {"id": "n-ww-22", "string": 3, "fret": 2, "duration": 0.25, "position": 0},
                {"id": "n-ww-23", "string": 4, "fret": 0, "duration": 0.25, "position": 0},
                {"id": "n-ww-24", "string": 5, "fret": 0, "duration": 0.25, "position": 0}
              ]
            }
          ]
        },
        {
          "id": "s-ww-verse",
          "name": "Verse",
          "measures": [
            {
              "id": "m-ww-5",
              "notes": [
                {"id": "n-ww-25", "string": 0, "fret": 0, "duration": 0.25, "position": 0},
                {"id": "n-ww-26", "string": 1, "fret": 3, "duration": 0.25, "position": 0},
                {"id": "n-ww-27", "string": 2, "fret": 0, "duration": 0.25, "position": 0},
                {"id": "n-ww-28", "string": 3, "fret": 0, "duration": 0.25, "position": 0},
                {"id": "n-ww-29", "string": 4, "fret": 2, "duration": 0.25, "position": 0.25},
                {"id": "n-ww-30", "string": 5, "fret": 3, "duration": 0.25, "position": 0.5}
              ]
            },
            {
              "id": "m-ww-6",
              "notes": [
                {"id": "n-ww-31", "string": 0, "fret": 3, "duration": 0.25, "position": 0},
                {"id": "n-ww-32", "string": 1, "fret": 0, "duration": 0.25, "position": 0},
                {"id": "n-ww-33", "string": 2, "fret": 0, "duration": 0.25, "position": 0.25},
                {"id": "n-ww-34", "string": 3, "fret": 2, "duration": 0.25, "position": 0.5},
                {"id": "n-ww-35", "string": 4, "fret": 3, "duration": 0.25, "position": 0.75}
              ]
            },
            {
              "id": "m-ww-7",
              "notes": [
                {"id": "n-ww-36", "string": 2, "fret": 2, "duration": 0.25, "position": 0},
                {"id": "n-ww-37", "string": 3, "fret": 2, "duration": 0.25, "position": 0},
                {"id": "n-ww-38", "string": 4, "fret": 0, "duration": 0.25, "position": 0},
                {"id": "n-ww-39", "string": 1, "fret": 3, "duration": 0.25, "position": 0.5},
                {"id": "n-ww-40", "string": 0, "fret": 2, "duration": 0.25, "position": 0.75}
              ]
            },
            {
              "id": "m-ww-8",
              "notes": [
                {"id": "n-ww-41", "string": 0, "fret": 0, "duration": 0.25, "position": 0},
                {"id": "n-ww-42", "string": 1, "fret": 0, "duration": 0.25, "position": 0},
                {"id": "n-ww-43", "string": 2, "fret": 0, "duration": 0.25, "position": 0},
                {"id": "n-ww-44", "string": 3, "fret": 2, "duration": 0.25, "position": 0},
                {"id": "n-ww-45", "string": 4, "fret": 0, "duration": 0.25, "position": 0.5}
              ]
            }
          ]
        }
      ]
    }',
    true,
    0
  ),
  (
    '00000000-0000-0000-0000-000000000102',
    '00000000-0000-0000-0000-000000000002',
    'Hotel California (Solo)',
    'Eagles',
    '{
      "title": "Hotel California (Solo)",
      "artist": "Eagles",
      "bpm": 75,
      "timeSignature": [4, 4],
      "tuning": ["E", "B", "G", "D", "A", "E"],
      "sections": [
        {
          "id": "s-hc-solo1",
          "name": "Solo Part 1",
          "measures": [
            {
              "id": "m-hc-1",
              "notes": [
                {"id": "n-hc-1", "string": 1, "fret": 15, "duration": 0.25, "position": 0, "techniques": ["bend"]},
                {"id": "n-hc-2", "string": 1, "fret": 12, "duration": 0.125, "position": 0.25},
                {"id": "n-hc-3", "string": 0, "fret": 12, "duration": 0.25, "position": 0.375},
                {"id": "n-hc-4", "string": 1, "fret": 15, "duration": 0.25, "position": 0.625, "techniques": ["vibrato"]}
              ]
            },
            {
              "id": "m-hc-2",
              "notes": [
                {"id": "n-hc-5", "string": 0, "fret": 15, "duration": 0.25, "position": 0, "techniques": ["bend"]},
                {"id": "n-hc-6", "string": 0, "fret": 12, "duration": 0.125, "position": 0.25},
                {"id": "n-hc-7", "string": 1, "fret": 15, "duration": 0.125, "position": 0.375},
                {"id": "n-hc-8", "string": 1, "fret": 12, "duration": 0.125, "position": 0.5},
                {"id": "n-hc-9", "string": 2, "fret": 14, "duration": 0.25, "position": 0.625, "techniques": ["slide-up"]}
              ]
            },
            {
              "id": "m-hc-3",
              "notes": [
                {"id": "n-hc-10", "string": 2, "fret": 12, "duration": 0.25, "position": 0},
                {"id": "n-hc-11", "string": 1, "fret": 12, "duration": 0.125, "position": 0.25},
                {"id": "n-hc-12", "string": 1, "fret": 15, "duration": 0.25, "position": 0.375, "techniques": ["bend"]},
                {"id": "n-hc-13", "string": 0, "fret": 12, "duration": 0.25, "position": 0.75}
              ]
            },
            {
              "id": "m-hc-4",
              "notes": [
                {"id": "n-hc-14", "string": 0, "fret": 15, "duration": 0.5, "position": 0, "techniques": ["vibrato"]},
                {"id": "n-hc-15", "string": 0, "fret": 12, "duration": 0.25, "position": 0.5},
                {"id": "n-hc-16", "string": 1, "fret": 12, "duration": 0.25, "position": 0.75}
              ]
            }
          ]
        },
        {
          "id": "s-hc-solo2",
          "name": "Solo Part 2",
          "measures": [
            {
              "id": "m-hc-5",
              "notes": [
                {"id": "n-hc-17", "string": 0, "fret": 17, "duration": 0.25, "position": 0, "techniques": ["bend"]},
                {"id": "n-hc-18", "string": 0, "fret": 15, "duration": 0.125, "position": 0.25},
                {"id": "n-hc-19", "string": 0, "fret": 12, "duration": 0.125, "position": 0.375},
                {"id": "n-hc-20", "string": 1, "fret": 15, "duration": 0.25, "position": 0.5, "techniques": ["slide-down"]},
                {"id": "n-hc-21", "string": 1, "fret": 12, "duration": 0.25, "position": 0.75}
              ]
            },
            {
              "id": "m-hc-6",
              "notes": [
                {"id": "n-hc-22", "string": 2, "fret": 14, "duration": 0.25, "position": 0},
                {"id": "n-hc-23", "string": 2, "fret": 12, "duration": 0.125, "position": 0.25},
                {"id": "n-hc-24", "string": 3, "fret": 14, "duration": 0.125, "position": 0.375},
                {"id": "n-hc-25", "string": 3, "fret": 12, "duration": 0.25, "position": 0.5},
                {"id": "n-hc-26", "string": 2, "fret": 12, "duration": 0.25, "position": 0.75}
              ]
            },
            {
              "id": "m-hc-7",
              "notes": [
                {"id": "n-hc-27", "string": 1, "fret": 12, "duration": 0.125, "position": 0},
                {"id": "n-hc-28", "string": 1, "fret": 15, "duration": 0.25, "position": 0.125, "techniques": ["hammer-on"]},
                {"id": "n-hc-29", "string": 0, "fret": 12, "duration": 0.125, "position": 0.375},
                {"id": "n-hc-30", "string": 0, "fret": 15, "duration": 0.25, "position": 0.5, "techniques": ["bend"]},
                {"id": "n-hc-31", "string": 0, "fret": 12, "duration": 0.25, "position": 0.75}
              ]
            },
            {
              "id": "m-hc-8",
              "notes": [
                {"id": "n-hc-32", "string": 0, "fret": 12, "duration": 1, "position": 0, "techniques": ["vibrato"]}
              ]
            }
          ]
        }
      ]
    }',
    true,
    2000
  ),
  (
    '00000000-0000-0000-0000-000000000103',
    '00000000-0000-0000-0000-000000000003',
    'Teen Town',
    'Weather Report',
    '{
      "title": "Teen Town",
      "artist": "Weather Report",
      "bpm": 120,
      "timeSignature": [4, 4],
      "tuning": ["G", "D", "A", "E"],
      "sections": [
        {
          "id": "s-tt-main",
          "name": "Main Riff",
          "measures": [
            {
              "id": "m-tt-1",
              "notes": [
                {"id": "n-tt-1", "string": 3, "fret": 7, "duration": 0.125, "position": 0},
                {"id": "n-tt-2", "string": 3, "fret": 10, "duration": 0.125, "position": 0.125},
                {"id": "n-tt-3", "string": 2, "fret": 7, "duration": 0.125, "position": 0.25},
                {"id": "n-tt-4", "string": 2, "fret": 9, "duration": 0.125, "position": 0.375},
                {"id": "n-tt-5", "string": 1, "fret": 7, "duration": 0.125, "position": 0.5},
                {"id": "n-tt-6", "string": 1, "fret": 9, "duration": 0.125, "position": 0.625},
                {"id": "n-tt-7", "string": 0, "fret": 7, "duration": 0.125, "position": 0.75},
                {"id": "n-tt-8", "string": 0, "fret": 9, "duration": 0.125, "position": 0.875}
              ]
            },
            {
              "id": "m-tt-2",
              "notes": [
                {"id": "n-tt-9", "string": 0, "fret": 7, "duration": 0.125, "position": 0},
                {"id": "n-tt-10", "string": 1, "fret": 9, "duration": 0.125, "position": 0.125},
                {"id": "n-tt-11", "string": 1, "fret": 7, "duration": 0.125, "position": 0.25},
                {"id": "n-tt-12", "string": 2, "fret": 9, "duration": 0.125, "position": 0.375},
                {"id": "n-tt-13", "string": 2, "fret": 7, "duration": 0.125, "position": 0.5},
                {"id": "n-tt-14", "string": 3, "fret": 10, "duration": 0.125, "position": 0.625},
                {"id": "n-tt-15", "string": 3, "fret": 7, "duration": 0.25, "position": 0.75}
              ]
            },
            {
              "id": "m-tt-3",
              "notes": [
                {"id": "n-tt-16", "string": 3, "fret": 5, "duration": 0.125, "position": 0},
                {"id": "n-tt-17", "string": 3, "fret": 7, "duration": 0.125, "position": 0.125, "techniques": ["hammer-on"]},
                {"id": "n-tt-18", "string": 2, "fret": 5, "duration": 0.125, "position": 0.25},
                {"id": "n-tt-19", "string": 2, "fret": 7, "duration": 0.125, "position": 0.375, "techniques": ["hammer-on"]},
                {"id": "n-tt-20", "string": 1, "fret": 5, "duration": 0.125, "position": 0.5},
                {"id": "n-tt-21", "string": 1, "fret": 7, "duration": 0.125, "position": 0.625, "techniques": ["slide-up"]},
                {"id": "n-tt-22", "string": 0, "fret": 5, "duration": 0.125, "position": 0.75},
                {"id": "n-tt-23", "string": 0, "fret": 7, "duration": 0.125, "position": 0.875}
              ]
            },
            {
              "id": "m-tt-4",
              "notes": [
                {"id": "n-tt-24", "string": 3, "fret": 7, "duration": 0.125, "position": 0},
                {"id": "n-tt-25", "string": 3, "fret": 5, "duration": 0.125, "position": 0.125, "techniques": ["pull-off"]},
                {"id": "n-tt-26", "string": 3, "fret": 3, "duration": 0.125, "position": 0.25},
                {"id": "n-tt-27", "string": 3, "fret": 5, "duration": 0.25, "position": 0.375},
                {"id": "n-tt-28", "string": 3, "fret": 7, "duration": 0.25, "position": 0.625, "techniques": ["vibrato"]},
                {"id": "n-tt-29", "string": 3, "fret": 5, "duration": 0.125, "position": 0.875}
              ]
            }
          ]
        }
      ]
    }',
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
