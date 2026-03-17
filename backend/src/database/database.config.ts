import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

/**
 * TypeORM 데이터베이스 설정
 *
 * 우선순위:
 *   1) DATABASE_URL 환경변수가 있으면 → Supabase / 프로덕션 모드
 *      - SSL 강제 (rejectUnauthorized: false)
 *      - synchronize: false (Supabase CLI 마이그레이션으로 관리)
 *   2) DATABASE_URL 없으면 → 로컬 개발 모드
 *      - 개별 DB_* 환경변수 사용
 *      - synchronize: true (개발 편의)
 *      - DB_REPLICA_HOST 가 있으면 Read Replica 활성화
 */
export function buildTypeOrmConfig(
  configService: ConfigService,
): TypeOrmModuleOptions {
  const isDev = configService.get<string>('NODE_ENV') !== 'production';
  const databaseUrl = configService.get<string>('DATABASE_URL');

  // ── Supabase / Production: DATABASE_URL 사용 ──────────────────
  if (databaseUrl) {
    return {
      type: 'postgres' as const,
      url: databaseUrl,
      ssl: { rejectUnauthorized: false },
      synchronize: false, // Supabase CLI 마이그레이션으로 관리
      logging: isDev ? ['error'] : false,
      extra: {
        max: configService.get<number>('DB_POOL_MAX', 10),
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      },
    };
  }

  // ── 로컬 개발: 개별 환경변수 사용 ────────────────────────────
  const primary = {
    host: configService.get<string>('DB_HOST', 'localhost'),
    port: configService.get<number>('DB_PORT', 5432),
    username: configService.get<string>('DB_USERNAME', 'postgres'),
    password: configService.get<string>('DB_PASSWORD', 'postgres'),
    database: configService.get<string>('DB_NAME', 'tone_knob'),
  };

  const replicaHost = configService.get<string>('DB_REPLICA_HOST');

  const baseConfig: TypeOrmModuleOptions = {
    type: 'postgres' as const,
    host: primary.host,
    port: primary.port,
    username: primary.username,
    password: primary.password,
    database: primary.database,
    synchronize: isDev,
    logging: isDev ? ['query', 'error'] : ['error'],
    extra: {
      max: configService.get<number>('DB_POOL_MAX', 20),
      min: configService.get<number>('DB_POOL_MIN', 2),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    },
  };

  if (replicaHost) {
    return {
      ...baseConfig,
      replication: {
        master: {
          host: primary.host,
          port: primary.port,
          username: primary.username,
          password: primary.password,
          database: primary.database,
        },
        slaves: [
          {
            host: replicaHost,
            port: configService.get<number>('DB_REPLICA_PORT', 5432),
            username: configService.get<string>(
              'DB_REPLICA_USERNAME',
              primary.username,
            ),
            password: configService.get<string>(
              'DB_REPLICA_PASSWORD',
              primary.password,
            ),
            database: primary.database,
          },
        ],
      },
    };
  }

  return baseConfig;
}
