import {
  Controller,
  Get,
  Inject,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { firstValueFrom } from 'rxjs';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Knob')
@Controller('api/knob')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class KnobProxyController {
  constructor(
    @Inject('MARKETPLACE_SERVICE') private readonly marketplaceClient: ClientProxy,
  ) {}

  @Get('balance')
  @ApiOperation({ summary: 'Knob 잔액 조회' })
  async getBalance(@Request() req: { user: { id: string } }) {
    return firstValueFrom(
      this.marketplaceClient.send('knob.getBalance', { userId: req.user.id }),
    );
  }

  @Get('history')
  @ApiOperation({ summary: 'Knob 거래 내역 조회' })
  async getHistory(
    @Request() req: { user: { id: string } },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return firstValueFrom(
      this.marketplaceClient.send('knob.getHistory', {
        userId: req.user.id,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
      }),
    );
  }
}
