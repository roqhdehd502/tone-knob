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
-- 기존 시드 탭 삭제 후 재삽입 (업데이트된 데이터)
delete from tabs where id in (
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000102',
  '00000000-0000-0000-0000-000000000103'
);

insert into tabs (id, "userId", title, artist, content, "isPublic", price)
values
  -- ═══════════════════════════════════════════════════════════════
  -- 1) Wonderwall – Oasis (BPM 87, 4/4)
  -- 실제 핑거피킹 아르페지오 패턴 기반
  -- Em7 → G → Dsus4 → A7sus4 진행
  -- ═══════════════════════════════════════════════════════════════
  (
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000002',
    'Wonderwall',
    'Oasis',
    '{
      "title": "Wonderwall",
      "artist": "Oasis",
      "bpm": 87,
      "timeSignature": [4, 4],
      "tuning": ["E", "B", "G", "D", "A", "E"],
      "sections": [
        {
          "id": "s-ww-intro",
          "name": "Intro",
          "measures": [
            {
              "id": "m-ww-i1",
              "notes": [
                {"id": "n-wi01", "string": 5, "fret": 0, "duration": 0.25, "position": 0, "techniques": ["let-ring"]},
                {"id": "n-wi02", "string": 4, "fret": 2, "duration": 0.125, "position": 0.125, "techniques": ["let-ring"]},
                {"id": "n-wi03", "string": 3, "fret": 2, "duration": 0.125, "position": 0.25, "techniques": ["let-ring"]},
                {"id": "n-wi04", "string": 2, "fret": 0, "duration": 0.125, "position": 0.375, "techniques": ["let-ring"]},
                {"id": "n-wi05", "string": 1, "fret": 0, "duration": 0.125, "position": 0.5},
                {"id": "n-wi06", "string": 0, "fret": 0, "duration": 0.125, "position": 0.625},
                {"id": "n-wi07", "string": 1, "fret": 0, "duration": 0.125, "position": 0.75},
                {"id": "n-wi08", "string": 2, "fret": 0, "duration": 0.125, "position": 0.875}
              ]
            },
            {
              "id": "m-ww-i2",
              "notes": [
                {"id": "n-wi09", "string": 5, "fret": 3, "duration": 0.25, "position": 0, "techniques": ["let-ring"]},
                {"id": "n-wi10", "string": 4, "fret": 2, "duration": 0.125, "position": 0.125, "techniques": ["let-ring"]},
                {"id": "n-wi11", "string": 3, "fret": 0, "duration": 0.125, "position": 0.25, "techniques": ["let-ring"]},
                {"id": "n-wi12", "string": 2, "fret": 0, "duration": 0.125, "position": 0.375},
                {"id": "n-wi13", "string": 1, "fret": 3, "duration": 0.125, "position": 0.5},
                {"id": "n-wi14", "string": 0, "fret": 3, "duration": 0.125, "position": 0.625},
                {"id": "n-wi15", "string": 1, "fret": 3, "duration": 0.125, "position": 0.75},
                {"id": "n-wi16", "string": 2, "fret": 0, "duration": 0.125, "position": 0.875}
              ]
            },
            {
              "id": "m-ww-i3",
              "notes": [
                {"id": "n-wi17", "string": 3, "fret": 0, "duration": 0.25, "position": 0, "techniques": ["let-ring"]},
                {"id": "n-wi18", "string": 2, "fret": 2, "duration": 0.125, "position": 0.125, "techniques": ["let-ring"]},
                {"id": "n-wi19", "string": 1, "fret": 3, "duration": 0.125, "position": 0.25, "techniques": ["let-ring"]},
                {"id": "n-wi20", "string": 0, "fret": 2, "duration": 0.125, "position": 0.375},
                {"id": "n-wi21", "string": 1, "fret": 3, "duration": 0.125, "position": 0.5},
                {"id": "n-wi22", "string": 2, "fret": 2, "duration": 0.125, "position": 0.625},
                {"id": "n-wi23", "string": 1, "fret": 3, "duration": 0.125, "position": 0.75},
                {"id": "n-wi24", "string": 0, "fret": 2, "duration": 0.125, "position": 0.875}
              ]
            },
            {
              "id": "m-ww-i4",
              "notes": [
                {"id": "n-wi25", "string": 4, "fret": 0, "duration": 0.25, "position": 0, "techniques": ["let-ring"]},
                {"id": "n-wi26", "string": 3, "fret": 2, "duration": 0.125, "position": 0.125, "techniques": ["let-ring"]},
                {"id": "n-wi27", "string": 2, "fret": 0, "duration": 0.125, "position": 0.25, "techniques": ["let-ring"]},
                {"id": "n-wi28", "string": 1, "fret": 0, "duration": 0.125, "position": 0.375},
                {"id": "n-wi29", "string": 0, "fret": 0, "duration": 0.125, "position": 0.5},
                {"id": "n-wi30", "string": 1, "fret": 0, "duration": 0.125, "position": 0.625},
                {"id": "n-wi31", "string": 2, "fret": 0, "duration": 0.125, "position": 0.75},
                {"id": "n-wi32", "string": 3, "fret": 2, "duration": 0.125, "position": 0.875}
              ],
              "directives": [{"type": "repeat-end", "position": "end"}]
            }
          ]
        },
        {
          "id": "s-ww-verse",
          "name": "Verse 1",
          "measures": [
            {
              "id": "m-ww-v1",
              "notes": [
                {"id": "n-wv01", "string": 5, "fret": 0, "duration": 0.5, "position": 0, "techniques": ["let-ring"]},
                {"id": "n-wv02", "string": 3, "fret": 2, "duration": 0.125, "position": 0.125, "techniques": ["let-ring"]},
                {"id": "n-wv03", "string": 2, "fret": 0, "duration": 0.125, "position": 0.25},
                {"id": "n-wv04", "string": 1, "fret": 0, "duration": 0.125, "position": 0.375},
                {"id": "n-wv05", "string": 0, "fret": 0, "duration": 0.25, "position": 0.5},
                {"id": "n-wv06", "string": 1, "fret": 0, "duration": 0.125, "position": 0.75},
                {"id": "n-wv07", "string": 2, "fret": 0, "duration": 0.125, "position": 0.875}
              ]
            },
            {
              "id": "m-ww-v2",
              "notes": [
                {"id": "n-wv08", "string": 5, "fret": 3, "duration": 0.5, "position": 0, "techniques": ["let-ring"]},
                {"id": "n-wv09", "string": 3, "fret": 0, "duration": 0.125, "position": 0.125},
                {"id": "n-wv10", "string": 2, "fret": 0, "duration": 0.125, "position": 0.25},
                {"id": "n-wv11", "string": 1, "fret": 3, "duration": 0.125, "position": 0.375},
                {"id": "n-wv12", "string": 0, "fret": 3, "duration": 0.25, "position": 0.5},
                {"id": "n-wv13", "string": 1, "fret": 3, "duration": 0.125, "position": 0.75},
                {"id": "n-wv14", "string": 2, "fret": 0, "duration": 0.125, "position": 0.875}
              ]
            },
            {
              "id": "m-ww-v3",
              "notes": [
                {"id": "n-wv15", "string": 3, "fret": 0, "duration": 0.375, "position": 0, "techniques": ["let-ring"]},
                {"id": "n-wv16", "string": 2, "fret": 2, "duration": 0.125, "position": 0.25},
                {"id": "n-wv17", "string": 1, "fret": 3, "duration": 0.125, "position": 0.375},
                {"id": "n-wv18", "string": 0, "fret": 2, "duration": 0.125, "position": 0.5},
                {"id": "n-wv19", "string": 1, "fret": 3, "duration": 0.125, "position": 0.625},
                {"id": "n-wv20", "string": 2, "fret": 2, "duration": 0.125, "position": 0.75},
                {"id": "n-wv21", "string": 3, "fret": 0, "duration": 0.125, "position": 0.875}
              ]
            },
            {
              "id": "m-ww-v4",
              "notes": [
                {"id": "n-wv22", "string": 4, "fret": 0, "duration": 0.375, "position": 0, "techniques": ["let-ring"]},
                {"id": "n-wv23", "string": 3, "fret": 2, "duration": 0.125, "position": 0.25},
                {"id": "n-wv24", "string": 2, "fret": 0, "duration": 0.125, "position": 0.375},
                {"id": "n-wv25", "string": 1, "fret": 0, "duration": 0.125, "position": 0.5},
                {"id": "n-wv26", "string": 0, "fret": 0, "duration": 0.25, "position": 0.625},
                {"id": "n-wv27", "string": 1, "fret": 0, "duration": 0.125, "position": 0.875}
              ]
            }
          ]
        },
        {
          "id": "s-ww-chorus",
          "name": "Chorus",
          "measures": [
            {
              "id": "m-ww-c1",
              "directives": [{"type": "crescendo"}],
              "notes": [
                {"id": "n-wc01", "string": 5, "fret": 0, "duration": 0.25, "position": 0},
                {"id": "n-wc02", "string": 4, "fret": 2, "duration": 0.25, "position": 0},
                {"id": "n-wc03", "string": 3, "fret": 2, "duration": 0.25, "position": 0},
                {"id": "n-wc04", "string": 2, "fret": 0, "duration": 0.25, "position": 0},
                {"id": "n-wc05", "string": 1, "fret": 0, "duration": 0.25, "position": 0},
                {"id": "n-wc06", "string": 0, "fret": 0, "duration": 0.25, "position": 0},
                {"id": "n-wc07", "string": 0, "fret": 0, "duration": 0.125, "position": 0.5},
                {"id": "n-wc08", "string": 1, "fret": 0, "duration": 0.125, "position": 0.625},
                {"id": "n-wc09", "string": 0, "fret": 0, "duration": 0.125, "position": 0.75},
                {"id": "n-wc10", "string": 1, "fret": 0, "duration": 0.125, "position": 0.875}
              ]
            },
            {
              "id": "m-ww-c2",
              "notes": [
                {"id": "n-wc11", "string": 5, "fret": 3, "duration": 0.25, "position": 0},
                {"id": "n-wc12", "string": 4, "fret": 2, "duration": 0.25, "position": 0},
                {"id": "n-wc13", "string": 3, "fret": 0, "duration": 0.25, "position": 0},
                {"id": "n-wc14", "string": 2, "fret": 0, "duration": 0.25, "position": 0},
                {"id": "n-wc15", "string": 1, "fret": 3, "duration": 0.25, "position": 0},
                {"id": "n-wc16", "string": 0, "fret": 3, "duration": 0.25, "position": 0},
                {"id": "n-wc17", "string": 0, "fret": 3, "duration": 0.125, "position": 0.5},
                {"id": "n-wc18", "string": 1, "fret": 3, "duration": 0.125, "position": 0.625},
                {"id": "n-wc19", "string": 0, "fret": 3, "duration": 0.125, "position": 0.75},
                {"id": "n-wc20", "string": 1, "fret": 3, "duration": 0.125, "position": 0.875}
              ]
            },
            {
              "id": "m-ww-c3",
              "notes": [
                {"id": "n-wc21", "string": 3, "fret": 0, "duration": 0.25, "position": 0},
                {"id": "n-wc22", "string": 2, "fret": 2, "duration": 0.25, "position": 0},
                {"id": "n-wc23", "string": 1, "fret": 3, "duration": 0.25, "position": 0},
                {"id": "n-wc24", "string": 0, "fret": 2, "duration": 0.25, "position": 0},
                {"id": "n-wc25", "string": 0, "fret": 2, "duration": 0.125, "position": 0.5},
                {"id": "n-wc26", "string": 1, "fret": 3, "duration": 0.125, "position": 0.625},
                {"id": "n-wc27", "string": 2, "fret": 2, "duration": 0.125, "position": 0.75},
                {"id": "n-wc28", "string": 1, "fret": 3, "duration": 0.125, "position": 0.875}
              ]
            },
            {
              "id": "m-ww-c4",
              "directives": [{"type": "decrescendo"}],
              "notes": [
                {"id": "n-wc29", "string": 4, "fret": 0, "duration": 0.25, "position": 0},
                {"id": "n-wc30", "string": 3, "fret": 2, "duration": 0.25, "position": 0},
                {"id": "n-wc31", "string": 2, "fret": 0, "duration": 0.25, "position": 0},
                {"id": "n-wc32", "string": 1, "fret": 0, "duration": 0.25, "position": 0},
                {"id": "n-wc33", "string": 0, "fret": 0, "duration": 0.5, "position": 0.5},
                {"id": "n-wc34", "string": 1, "fret": 0, "duration": 0.25, "position": 0.75}
              ]
            }
          ]
        }
      ]
    }',
    true,
    0
  ),

  -- ═══════════════════════════════════════════════════════════════
  -- 2) Hotel California (Solo) – Eagles (BPM 74, 4/4)
  -- Don Felder & Joe Walsh 듀얼 기타 솔로
  -- Bm → F#7 → A → E → G → D → Em → F#7 진행 위 멜로디
  -- ═══════════════════════════════════════════════════════════════
  (
    '00000000-0000-0000-0000-000000000102',
    '00000000-0000-0000-0000-000000000002',
    'Hotel California (Solo)',
    'Eagles',
    '{
      "title": "Hotel California (Solo)",
      "artist": "Eagles",
      "bpm": 74,
      "timeSignature": [4, 4],
      "tuning": ["E", "B", "G", "D", "A", "E"],
      "sections": [
        {
          "id": "s-hc-solo1",
          "name": "Solo – 1st Guitar (Felder)",
          "measures": [
            {
              "id": "m-hc-1",
              "notes": [
                {"id": "n-h101", "string": 1, "fret": 12, "duration": 0.25, "position": 0, "techniques": ["slide-up"]},
                {"id": "n-h102", "string": 1, "fret": 15, "duration": 0.375, "position": 0.25, "techniques": ["bend", "vibrato"]},
                {"id": "n-h103", "string": 1, "fret": 12, "duration": 0.125, "position": 0.625},
                {"id": "n-h104", "string": 0, "fret": 12, "duration": 0.25, "position": 0.75, "techniques": ["let-ring"]}
              ]
            },
            {
              "id": "m-hc-2",
              "notes": [
                {"id": "n-h105", "string": 0, "fret": 15, "duration": 0.375, "position": 0, "techniques": ["bend"]},
                {"id": "n-h106", "string": 0, "fret": 12, "duration": 0.125, "position": 0.375, "techniques": ["pull-off"]},
                {"id": "n-h107", "string": 1, "fret": 15, "duration": 0.0625, "position": 0.5},
                {"id": "n-h108", "string": 1, "fret": 12, "duration": 0.0625, "position": 0.5625, "techniques": ["pull-off"]},
                {"id": "n-h109", "string": 2, "fret": 14, "duration": 0.25, "position": 0.625, "techniques": ["slide-up"]},
                {"id": "n-h110", "string": 2, "fret": 12, "duration": 0.125, "position": 0.875}
              ]
            },
            {
              "id": "m-hc-3",
              "notes": [
                {"id": "n-h111", "string": 1, "fret": 12, "duration": 0.125, "position": 0},
                {"id": "n-h112", "string": 1, "fret": 14, "duration": 0.125, "position": 0.125, "techniques": ["hammer-on"]},
                {"id": "n-h113", "string": 1, "fret": 15, "duration": 0.25, "position": 0.25, "techniques": ["bend"]},
                {"id": "n-h114", "string": 0, "fret": 12, "duration": 0.125, "position": 0.5},
                {"id": "n-h115", "string": 0, "fret": 15, "duration": 0.125, "position": 0.625, "techniques": ["hammer-on"]},
                {"id": "n-h116", "string": 0, "fret": 12, "duration": 0.25, "position": 0.75, "techniques": ["pull-off"]}
              ]
            },
            {
              "id": "m-hc-4",
              "notes": [
                {"id": "n-h117", "string": 0, "fret": 15, "duration": 0.75, "position": 0, "techniques": ["bend", "vibrato"]},
                {"id": "n-h118", "string": 0, "fret": 12, "duration": 0.125, "position": 0.75},
                {"id": "n-h119", "string": 1, "fret": 12, "duration": 0.125, "position": 0.875}
              ]
            },
            {
              "id": "m-hc-5",
              "notes": [
                {"id": "n-h120", "string": 0, "fret": 17, "duration": 0.25, "position": 0, "techniques": ["bend"]},
                {"id": "n-h121", "string": 0, "fret": 15, "duration": 0.0625, "position": 0.25, "techniques": ["pull-off"]},
                {"id": "n-h122", "string": 0, "fret": 12, "duration": 0.0625, "position": 0.3125, "techniques": ["pull-off"]},
                {"id": "n-h123", "string": 1, "fret": 15, "duration": 0.125, "position": 0.375},
                {"id": "n-h124", "string": 1, "fret": 12, "duration": 0.125, "position": 0.5, "techniques": ["pull-off"]},
                {"id": "n-h125", "string": 2, "fret": 14, "duration": 0.125, "position": 0.625},
                {"id": "n-h126", "string": 2, "fret": 12, "duration": 0.25, "position": 0.75, "techniques": ["slide-down"]}
              ]
            },
            {
              "id": "m-hc-6",
              "notes": [
                {"id": "n-h127", "string": 2, "fret": 14, "duration": 0.125, "position": 0, "techniques": ["hammer-on"]},
                {"id": "n-h128", "string": 2, "fret": 12, "duration": 0.125, "position": 0.125, "techniques": ["pull-off"]},
                {"id": "n-h129", "string": 3, "fret": 14, "duration": 0.125, "position": 0.25},
                {"id": "n-h130", "string": 3, "fret": 12, "duration": 0.125, "position": 0.375, "techniques": ["pull-off"]},
                {"id": "n-h131", "string": 3, "fret": 11, "duration": 0.125, "position": 0.5},
                {"id": "n-h132", "string": 2, "fret": 12, "duration": 0.375, "position": 0.625, "techniques": ["vibrato"]}
              ]
            },
            {
              "id": "m-hc-7",
              "notes": [
                {"id": "n-h133", "string": 1, "fret": 12, "duration": 0.125, "position": 0},
                {"id": "n-h134", "string": 1, "fret": 15, "duration": 0.125, "position": 0.125, "techniques": ["hammer-on"]},
                {"id": "n-h135", "string": 0, "fret": 12, "duration": 0.125, "position": 0.25},
                {"id": "n-h136", "string": 0, "fret": 15, "duration": 0.25, "position": 0.375, "techniques": ["bend"]},
                {"id": "n-h137", "string": 0, "fret": 12, "duration": 0.125, "position": 0.625, "techniques": ["pull-off"]},
                {"id": "n-h138", "string": 1, "fret": 15, "duration": 0.125, "position": 0.75},
                {"id": "n-h139", "string": 1, "fret": 12, "duration": 0.125, "position": 0.875}
              ]
            },
            {
              "id": "m-hc-8",
              "directives": [{"type": "fermata"}],
              "notes": [
                {"id": "n-h140", "string": 0, "fret": 12, "duration": 1, "position": 0, "techniques": ["vibrato", "let-ring"]}
              ]
            }
          ]
        },
        {
          "id": "s-hc-solo2",
          "name": "Solo – 2nd Guitar (Walsh) Harmony",
          "measures": [
            {
              "id": "m-hc-9",
              "notes": [
                {"id": "n-h201", "string": 1, "fret": 10, "duration": 0.25, "position": 0, "techniques": ["slide-up"]},
                {"id": "n-h202", "string": 1, "fret": 12, "duration": 0.375, "position": 0.25, "techniques": ["bend", "vibrato"]},
                {"id": "n-h203", "string": 1, "fret": 10, "duration": 0.125, "position": 0.625},
                {"id": "n-h204", "string": 0, "fret": 10, "duration": 0.25, "position": 0.75}
              ]
            },
            {
              "id": "m-hc-10",
              "notes": [
                {"id": "n-h205", "string": 0, "fret": 12, "duration": 0.375, "position": 0, "techniques": ["bend"]},
                {"id": "n-h206", "string": 0, "fret": 10, "duration": 0.125, "position": 0.375},
                {"id": "n-h207", "string": 1, "fret": 12, "duration": 0.125, "position": 0.5},
                {"id": "n-h208", "string": 1, "fret": 10, "duration": 0.125, "position": 0.625, "techniques": ["pull-off"]},
                {"id": "n-h209", "string": 2, "fret": 12, "duration": 0.25, "position": 0.75, "techniques": ["slide-up"]}
              ]
            },
            {
              "id": "m-hc-11",
              "notes": [
                {"id": "n-h210", "string": 2, "fret": 9, "duration": 0.125, "position": 0},
                {"id": "n-h211", "string": 2, "fret": 12, "duration": 0.125, "position": 0.125, "techniques": ["hammer-on"]},
                {"id": "n-h212", "string": 1, "fret": 10, "duration": 0.25, "position": 0.25},
                {"id": "n-h213", "string": 0, "fret": 10, "duration": 0.125, "position": 0.5},
                {"id": "n-h214", "string": 0, "fret": 12, "duration": 0.25, "position": 0.625, "techniques": ["hammer-on"]},
                {"id": "n-h215", "string": 0, "fret": 10, "duration": 0.125, "position": 0.875}
              ]
            },
            {
              "id": "m-hc-12",
              "directives": [{"type": "fermata"}],
              "notes": [
                {"id": "n-h216", "string": 0, "fret": 10, "duration": 1, "position": 0, "techniques": ["vibrato", "let-ring"]}
              ]
            }
          ]
        }
      ]
    }',
    true,
    2000
  ),

  -- ═══════════════════════════════════════════════════════════════
  -- 3) Teen Town – Weather Report / Jaco Pastorius (BPM 116, 4/4)
  -- 베이스 4현 표준 튜닝 (G-D-A-E, 높은→낮은)
  -- 16분음표 주체의 빠른 펑크 패시지, 고스트노트, 해머온/풀오프
  -- ═══════════════════════════════════════════════════════════════
  (
    '00000000-0000-0000-0000-000000000103',
    '00000000-0000-0000-0000-000000000003',
    'Teen Town',
    'Weather Report',
    '{
      "title": "Teen Town",
      "artist": "Weather Report",
      "bpm": 116,
      "timeSignature": [4, 4],
      "tuning": ["G", "D", "A", "E"],
      "sections": [
        {
          "id": "s-tt-head",
          "name": "Head – A",
          "measures": [
            {
              "id": "m-tt-a1",
              "directives": [{"type": "repeat-start", "position": "start"}],
              "notes": [
                {"id": "n-ta01", "string": 3, "fret": 7, "duration": 0.0625, "position": 0},
                {"id": "n-ta02", "string": 3, "fret": 7, "duration": -0.0625, "position": 0.0625},
                {"id": "n-ta03", "string": 3, "fret": 10, "duration": 0.0625, "position": 0.125, "techniques": ["slide-up"]},
                {"id": "n-ta04", "string": 2, "fret": 7, "duration": 0.0625, "position": 0.1875},
                {"id": "n-ta05", "string": 2, "fret": 7, "duration": 0.0625, "position": 0.25, "techniques": ["ghost-note"]},
                {"id": "n-ta06", "string": 2, "fret": 9, "duration": 0.0625, "position": 0.3125, "techniques": ["hammer-on"]},
                {"id": "n-ta07", "string": 1, "fret": 7, "duration": 0.125, "position": 0.375},
                {"id": "n-ta08", "string": 1, "fret": 9, "duration": 0.0625, "position": 0.5, "techniques": ["hammer-on"]},
                {"id": "n-ta09", "string": 1, "fret": 7, "duration": 0.0625, "position": 0.5625, "techniques": ["pull-off"]},
                {"id": "n-ta10", "string": 0, "fret": 7, "duration": 0.0625, "position": 0.625},
                {"id": "n-ta11", "string": 0, "fret": 7, "duration": -0.0625, "position": 0.6875},
                {"id": "n-ta12", "string": 0, "fret": 9, "duration": 0.0625, "position": 0.75, "techniques": ["hammer-on"]},
                {"id": "n-ta13", "string": 0, "fret": 7, "duration": 0.0625, "position": 0.8125, "techniques": ["pull-off"]},
                {"id": "n-ta14", "string": 1, "fret": 9, "duration": 0.0625, "position": 0.875},
                {"id": "n-ta15", "string": 1, "fret": 7, "duration": 0.0625, "position": 0.9375, "techniques": ["pull-off"]}
              ]
            },
            {
              "id": "m-tt-a2",
              "notes": [
                {"id": "n-ta16", "string": 2, "fret": 9, "duration": 0.0625, "position": 0},
                {"id": "n-ta17", "string": 2, "fret": 7, "duration": 0.0625, "position": 0.0625, "techniques": ["pull-off"]},
                {"id": "n-ta18", "string": 3, "fret": 10, "duration": 0.0625, "position": 0.125},
                {"id": "n-ta19", "string": 3, "fret": 7, "duration": 0.125, "position": 0.1875},
                {"id": "n-ta20", "string": 3, "fret": 7, "duration": -0.0625, "position": 0.3125},
                {"id": "n-ta21", "string": 3, "fret": 5, "duration": 0.0625, "position": 0.375, "techniques": ["slide-down"]},
                {"id": "n-ta22", "string": 3, "fret": 7, "duration": 0.0625, "position": 0.4375, "techniques": ["hammer-on"]},
                {"id": "n-ta23", "string": 3, "fret": 5, "duration": 0.0625, "position": 0.5, "techniques": ["pull-off"]},
                {"id": "n-ta24", "string": 3, "fret": 7, "duration": 0.125, "position": 0.5625},
                {"id": "n-ta25", "string": 3, "fret": 5, "duration": 0.0625, "position": 0.6875, "techniques": ["ghost-note"]},
                {"id": "n-ta26", "string": 3, "fret": 7, "duration": 0.25, "position": 0.75, "techniques": ["vibrato"]}
              ]
            },
            {
              "id": "m-tt-a3",
              "notes": [
                {"id": "n-ta27", "string": 3, "fret": 5, "duration": 0.0625, "position": 0},
                {"id": "n-ta28", "string": 3, "fret": 7, "duration": 0.0625, "position": 0.0625, "techniques": ["hammer-on"]},
                {"id": "n-ta29", "string": 2, "fret": 5, "duration": 0.0625, "position": 0.125},
                {"id": "n-ta30", "string": 2, "fret": 7, "duration": 0.0625, "position": 0.1875, "techniques": ["hammer-on"]},
                {"id": "n-ta31", "string": 1, "fret": 5, "duration": 0.0625, "position": 0.25},
                {"id": "n-ta32", "string": 1, "fret": 7, "duration": 0.0625, "position": 0.3125, "techniques": ["slide-up"]},
                {"id": "n-ta33", "string": 0, "fret": 5, "duration": 0.0625, "position": 0.375},
                {"id": "n-ta34", "string": 0, "fret": 7, "duration": 0.125, "position": 0.4375},
                {"id": "n-ta35", "string": 0, "fret": 5, "duration": 0.0625, "position": 0.5625, "techniques": ["pull-off"]},
                {"id": "n-ta36", "string": 1, "fret": 7, "duration": 0.0625, "position": 0.625},
                {"id": "n-ta37", "string": 1, "fret": 5, "duration": 0.0625, "position": 0.6875, "techniques": ["ghost-note"]},
                {"id": "n-ta38", "string": 2, "fret": 7, "duration": 0.0625, "position": 0.75},
                {"id": "n-ta39", "string": 2, "fret": 5, "duration": 0.0625, "position": 0.8125, "techniques": ["pull-off"]},
                {"id": "n-ta40", "string": 3, "fret": 7, "duration": 0.0625, "position": 0.875},
                {"id": "n-ta41", "string": 3, "fret": 5, "duration": 0.0625, "position": 0.9375}
              ]
            },
            {
              "id": "m-tt-a4",
              "directives": [{"type": "repeat-end", "position": "end"}],
              "notes": [
                {"id": "n-ta42", "string": 3, "fret": 7, "duration": 0.0625, "position": 0},
                {"id": "n-ta43", "string": 3, "fret": 5, "duration": 0.0625, "position": 0.0625, "techniques": ["pull-off"]},
                {"id": "n-ta44", "string": 3, "fret": 3, "duration": 0.0625, "position": 0.125},
                {"id": "n-ta45", "string": 3, "fret": 5, "duration": 0.125, "position": 0.1875, "techniques": ["hammer-on"]},
                {"id": "n-ta46", "string": 3, "fret": 3, "duration": -0.0625, "position": 0.3125},
                {"id": "n-ta47", "string": 3, "fret": 7, "duration": 0.25, "position": 0.375, "techniques": ["slide-up", "vibrato"]},
                {"id": "n-ta48", "string": 3, "fret": 5, "duration": 0.0625, "position": 0.625, "techniques": ["pull-off"]},
                {"id": "n-ta49", "string": 3, "fret": 3, "duration": 0.0625, "position": 0.6875},
                {"id": "n-ta50", "string": 3, "fret": 5, "duration": 0.125, "position": 0.75, "techniques": ["hammer-on"]},
                {"id": "n-ta51", "string": 3, "fret": 7, "duration": 0.125, "position": 0.875, "techniques": ["slide-up"]}
              ]
            }
          ]
        },
        {
          "id": "s-tt-bridge",
          "name": "Bridge",
          "measures": [
            {
              "id": "m-tt-b1",
              "directives": [{"type": "crescendo"}],
              "notes": [
                {"id": "n-tb01", "string": 3, "fret": 5, "duration": 0.25, "position": 0},
                {"id": "n-tb02", "string": 3, "fret": 5, "duration": -0.0625, "position": 0.25},
                {"id": "n-tb03", "string": 2, "fret": 5, "duration": 0.125, "position": 0.3125},
                {"id": "n-tb04", "string": 2, "fret": 7, "duration": 0.0625, "position": 0.4375, "techniques": ["hammer-on"]},
                {"id": "n-tb05", "string": 1, "fret": 5, "duration": 0.125, "position": 0.5},
                {"id": "n-tb06", "string": 1, "fret": 7, "duration": 0.0625, "position": 0.625, "techniques": ["hammer-on"]},
                {"id": "n-tb07", "string": 0, "fret": 5, "duration": 0.125, "position": 0.6875},
                {"id": "n-tb08", "string": 0, "fret": 7, "duration": 0.125, "position": 0.8125, "techniques": ["hammer-on"]},
                {"id": "n-tb09", "string": 0, "fret": 9, "duration": 0.0625, "position": 0.9375, "techniques": ["slide-up"]}
              ]
            },
            {
              "id": "m-tt-b2",
              "notes": [
                {"id": "n-tb10", "string": 0, "fret": 12, "duration": 0.5, "position": 0, "techniques": ["vibrato"]},
                {"id": "n-tb11", "string": 0, "fret": 9, "duration": 0.125, "position": 0.5, "techniques": ["slide-down"]},
                {"id": "n-tb12", "string": 0, "fret": 7, "duration": 0.125, "position": 0.625},
                {"id": "n-tb13", "string": 1, "fret": 9, "duration": 0.125, "position": 0.75},
                {"id": "n-tb14", "string": 1, "fret": 7, "duration": 0.125, "position": 0.875, "techniques": ["pull-off"]}
              ]
            },
            {
              "id": "m-tt-b3",
              "notes": [
                {"id": "n-tb15", "string": 2, "fret": 7, "duration": 0.125, "position": 0},
                {"id": "n-tb16", "string": 3, "fret": 10, "duration": 0.125, "position": 0.125},
                {"id": "n-tb17", "string": 3, "fret": 7, "duration": 0.125, "position": 0.25},
                {"id": "n-tb18", "string": 3, "fret": 5, "duration": 0.125, "position": 0.375, "techniques": ["slide-down"]},
                {"id": "n-tb19", "string": 3, "fret": 3, "duration": 0.125, "position": 0.5},
                {"id": "n-tb20", "string": 3, "fret": 5, "duration": 0.125, "position": 0.625, "techniques": ["hammer-on"]},
                {"id": "n-tb21", "string": 3, "fret": 7, "duration": 0.25, "position": 0.75, "techniques": ["vibrato"]}
              ]
            },
            {
              "id": "m-tt-b4",
              "directives": [{"type": "dc-al-fine"}],
              "notes": [
                {"id": "n-tb22", "string": 3, "fret": 7, "duration": 0.75, "position": 0, "techniques": ["vibrato"]},
                {"id": "n-tb23", "string": 3, "fret": 5, "duration": 0.125, "position": 0.75, "techniques": ["slide-down"]},
                {"id": "n-tb24", "string": 3, "fret": 3, "duration": 0.125, "position": 0.875}
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
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000101', 1800, 87, 0.8),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000102', 3600, 74, 1.0),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000103', 2700, 116, 0.9);

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
