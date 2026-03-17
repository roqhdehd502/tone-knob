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
  requestSettlement(@Request() req: { user: { id: string } }) {
    return this.settlementService.requestSettlement(req.user.id);
  }

  @Get('my')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 정산 내역 조회' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
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
  getSummary(@Request() req: { user: { id: string } }) {
    return this.settlementService.getSummary(req.user.id);
  }
}
