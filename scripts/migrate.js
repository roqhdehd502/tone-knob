#!/usr/bin/env node
/**
 * supabase/migrations/*.sql 실행 스크립트
 *
 *   npm run migrate              — 전체 마이그레이션 일괄 실행 (파일명 순서대로)
 *   npm run migrate:file <파일명>  — 지정한 단일 SQL 파일만 실행
 *
 * 적용 이력은 DB의 public.schema_migrations 테이블에 기록되며,
 * 이미 적용된 마이그레이션은 재실행 시 건너뜁니다.
 */

const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

require("dotenv").config({
  path: path.join(__dirname, "../services/marketplace-svc/.env"),
});

const MIGRATIONS_DIR = path.join(__dirname, "../supabase/migrations");

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
};

function log(color, symbol, filename, message) {
  console.log(`${color}${symbol} ${filename}${colors.reset} — ${message}`);
}

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.schema_migrations (
      filename   text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    );
  `);
}

async function isApplied(client, filename) {
  const res = await client.query(
    "SELECT 1 FROM public.schema_migrations WHERE filename = $1",
    [filename],
  );
  return res.rowCount > 0;
}

async function markApplied(client, filename) {
  await client.query(
    "INSERT INTO public.schema_migrations (filename) VALUES ($1) ON CONFLICT (filename) DO NOTHING",
    [filename],
  );
}

// 이미 적용된 스키마 객체를 재생성하려 할 때 발생하는 Postgres 에러 코드
// duplicate_object / duplicate_column / duplicate_table / unique_violation
const ALREADY_EXISTS_CODES = new Set(["42710", "42701", "42P07", "23505"]);

async function runMigrationFile(client, filename) {
  const filePath = path.join(MIGRATIONS_DIR, filename);
  const sql = fs.readFileSync(filePath, "utf8");

  if (await isApplied(client, filename)) {
    log(colors.yellow, "⏭ 건너뜀 ", filename, "이미 적용된 마이그레이션입니다");
    return "skipped";
  }

  try {
    await client.query("BEGIN");
    await client.query(sql);
    await markApplied(client, filename);
    await client.query("COMMIT");
    log(colors.green, "✅ 성공  ", filename, "마이그레이션을 적용했습니다");
    return "applied";
  } catch (err) {
    await client.query("ROLLBACK");
    if (ALREADY_EXISTS_CODES.has(err.code)) {
      await markApplied(client, filename);
      log(
        colors.yellow,
        "⏭ 건너뜀 ",
        filename,
        `이미 적용된 마이그레이션으로 판단되어 건너뜁니다 (${err.message})`,
      );
      return "skipped";
    }
    log(colors.red, "❌ 실패  ", filename, err.message);
    return "failed";
  }
}

async function resolveTargetFiles() {
  const mode = process.argv[2];

  if (mode === "file") {
    const target = process.argv[3];
    if (!target) {
      console.error(
        `${colors.red}사용법: npm run migrate:file -- <파일명 또는 경로>${colors.reset}`,
      );
      process.exit(1);
    }
    const filename = path.basename(target);
    if (!fs.existsSync(path.join(MIGRATIONS_DIR, filename))) {
      console.error(`${colors.red}파일을 찾을 수 없습니다: ${filename}${colors.reset}`);
      process.exit(1);
    }
    return [filename];
  }

  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error(
      `${colors.red}DATABASE_URL 환경변수를 찾을 수 없습니다 (services/marketplace-svc/.env 확인 필요)${colors.reset}`,
    );
    process.exit(1);
  }

  const files = await resolveTargetFiles();
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  await ensureMigrationsTable(client);

  console.log(`${colors.cyan}── 마이그레이션 실행 시작 (${files.length}개) ──${colors.reset}`);

  const summary = { applied: 0, skipped: 0, failed: 0 };
  for (const filename of files) {
    const result = await runMigrationFile(client, filename);
    summary[result] += 1;
    if (result === "failed") break; // 이후 마이그레이션이 선행 변경에 의존할 수 있어 중단
  }

  console.log(
    `${colors.cyan}── 결과: 성공 ${summary.applied} / 건너뜀(이미 적용) ${summary.skipped} / 실패 ${summary.failed} ──${colors.reset}`,
  );

  await client.end();
  process.exit(summary.failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(`${colors.red}예기치 않은 오류: ${err.message}${colors.reset}`);
  process.exit(1);
});
