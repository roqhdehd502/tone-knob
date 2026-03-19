-- Add badges and user_badges tables for badge collection system

-- Badge category enum
DO $$ BEGIN
  CREATE TYPE badge_category_enum AS ENUM ('achievement', 'contribution', 'social', 'special');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- badges table
CREATE TABLE IF NOT EXISTS badges (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code        varchar(50)  NOT NULL UNIQUE,
  name        varchar(100) NOT NULL,
  description varchar(500),
  icon        varchar(100),
  category    badge_category_enum NOT NULL DEFAULT 'achievement',
  "sortOrder" integer      NOT NULL DEFAULT 0,
  "createdAt" timestamp    NOT NULL DEFAULT now()
);

-- user_badges table
CREATE TABLE IF NOT EXISTS user_badges (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "badgeId"   uuid NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  "isFeatured" boolean NOT NULL DEFAULT false,
  "earnedAt"  timestamp NOT NULL DEFAULT now(),
  UNIQUE ("userId", "badgeId")
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges ("userId");
