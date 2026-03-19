-- Add OAuth provider columns and knobBalance to users table
-- Required for social login (Google, GitHub) and Knob currency system

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS provider     varchar(50)  NOT NULL DEFAULT 'local',
  ADD COLUMN IF NOT EXISTS "providerId" varchar(255),
  ADD COLUMN IF NOT EXISTS "knobBalance" integer     NOT NULL DEFAULT 0;

-- Allow passwordHash to be nullable (social login users have no password)
ALTER TABLE users
  ALTER COLUMN "passwordHash" DROP NOT NULL;
