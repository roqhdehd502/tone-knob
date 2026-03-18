import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

import { RegionService } from './region.service';

@ApiTags('media-regions')
@Controller('api/media/regions')
export class RegionController {
  constructor(private readonly regionService: RegionService) {}

  @Get()
  @ApiOperation({ summary: '전체 미디어 서버 리전 목록' })
  @ApiResponse({ status: 200, description: '리전 목록 반환' })
  getAllRegions() {
    return this.regionService.getAllRegions();
  }

  @Get('select')
  @ApiOperation({ summary: '클라이언트에 최적화된 리전 선택' })
  @ApiResponse({ status: 200, description: '최적 리전 반환' })
  @ApiQuery({
    name: 'lat',
    required: false,
    type: Number,
    description: '클라이언트 위도',
  })
  @ApiQuery({
    name: 'lng',
    required: false,
    type: Number,
    description: '클라이언트 경도',
  })
  selectRegion(@Query('lat') lat?: string, @Query('lng') lng?: string) {
    const latitude = lat ? parseFloat(lat) : undefined;
    const longitude = lng ? parseFloat(lng) : undefined;
    return this.regionService.selectRegion(latitude, longitude);
  }

  @Get('health')
  @ApiOperation({ summary: '모든 리전 헬스체크 실행' })
  @ApiResponse({ status: 200, description: '리전별 헬스 상태 반환' })
  async checkHealth() {
    await this.regionService.checkHealth();
    return this.regionService.getAllRegions().map((r) => ({
      id: r.id,
      name: r.name,
      healthy: r.healthy,
      latencyMs: r.latencyMs,
    }));
  }
}
