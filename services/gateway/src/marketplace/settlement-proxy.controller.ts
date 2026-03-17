import {
  Controller,
  Get,
  Inject,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Controller('api/settlements')
export class SettlementProxyController {
  constructor(
    @Inject('MARKETPLACE_SERVICE') private readonly marketplaceClient: ClientProxy,
  ) {}

  @Post('request')
  async requestSettlement(@Request() req: { user: { id: string } }) {
    return firstValueFrom(
      this.marketplaceClient.send('settlement.request', { sellerId: req.user.id }),
    );
  }

  @Get('my')
  async getMySettlements(
    @Request() req: { user: { id: string } },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return firstValueFrom(
      this.marketplaceClient.send('settlement.getMy', {
        sellerId: req.user.id,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
      }),
    );
  }

  @Get('summary')
  async getSummary(@Request() req: { user: { id: string } }) {
    return firstValueFrom(
      this.marketplaceClient.send('settlement.summary', { sellerId: req.user.id }),
    );
  }
}
