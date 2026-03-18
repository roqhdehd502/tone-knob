import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';

import { DataSource } from 'typeorm';

@ApiTags('health')
@Controller('api/health')
export class HealthController {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  @Get()
  @ApiOperation({ summary: '서비스 헬스체크' })
  @ApiResponse({ status: 200, description: '서비스 상태 반환 (ok / degraded)' })
  async check() {
    const dbOk = await this.dataSource
      .query('SELECT 1')
      .then(() => true)
      .catch(() => false);

    const status = dbOk ? 'ok' : 'degraded';
    return {
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: {
        database: dbOk ? 'ok' : 'error',
      },
    };
  }

  @Get('ready')
  @ApiOperation({ summary: '배포 준비 상태 확인 (블루-그린 트래픽 전환용)' })
  @ApiResponse({ status: 200, description: '준비 상태 반환' })
  async readiness() {
    const dbOk = await this.dataSource
      .query('SELECT 1')
      .then(() => true)
      .catch(() => false);

    if (!dbOk) {
      return { ready: false, reason: 'database_unavailable' };
    }
    return { ready: true };
  }

  @Get('live')
  @ApiOperation({ summary: '활성 상태 확인 (Kubernetes liveness probe용)' })
  @ApiResponse({ status: 200, description: '활성 상태 반환' })
  liveness() {
    return { alive: true, timestamp: new Date().toISOString() };
  }
}
