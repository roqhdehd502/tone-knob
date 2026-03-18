import {
  Controller,
  Get,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { SettlementService } from './settlement.service';

@ApiTags('settlements')
@Controller('api/settlements')
export class SettlementController {
  constructor(private readonly settlementService: SettlementService) {}

  @Post('request')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '정산 요청' })
  @ApiResponse({ status: 201, description: '정산 요청 성공' })
  @ApiResponse({ status: 400, description: '정산 가능 금액 없음' })
  requestSettlement(@Request() req: { user: { id: string } }) {
    return this.settlementService.requestSettlement(req.user.id);
  }

  @Get('my')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 정산 내역 조회' })
  @ApiResponse({ status: 200, description: '정산 내역 반환' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: '페이지 번호',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: '페이지당 항목 수',
  })
  getMySettlements(
    @Request() req: { user: { id: string } },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.settlementService.getMySettlements(
      req.user.id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('summary')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '정산 요약 (총 수익, 수수료, 지급액, 대기금)' })
  @ApiResponse({ status: 200, description: '정산 요약 반환' })
  getSummary(@Request() req: { user: { id: string } }) {
    return this.settlementService.getSummary(req.user.id);
  }
}
