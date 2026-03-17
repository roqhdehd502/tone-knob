import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Controller('api/marketplace')
export class MarketplaceProxyController {
  constructor(
    @Inject('MARKETPLACE_SERVICE') private readonly marketplaceClient: ClientProxy,
  ) {}

  @Get('tabs')
  async listPaidTabs(@Query('page') page?: string, @Query('limit') limit?: string) {
    return firstValueFrom(
      this.marketplaceClient.send('marketplace.listPaidTabs', {
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
      }),
    );
  }

  @Post('tabs/:tabId/price')
  async setPrice(
    @Param('tabId', ParseUUIDPipe) tabId: string,
    @Request() req: { user: { id: string } },
    @Body() body: { price: number },
  ) {
    return firstValueFrom(
      this.marketplaceClient.send('marketplace.setPrice', { tabId, userId: req.user.id, price: body.price }),
    );
  }

  @Post('tabs/:tabId/purchase')
  async purchase(
    @Param('tabId', ParseUUIDPipe) tabId: string,
    @Request() req: { user: { id: string } },
  ) {
    return firstValueFrom(
      this.marketplaceClient.send('marketplace.purchase', { tabId, buyerId: req.user.id }),
    );
  }

  @Get('tabs/:tabId/purchased')
  async hasPurchased(
    @Param('tabId', ParseUUIDPipe) tabId: string,
    @Request() req: { user: { id: string } },
  ) {
    const purchased = await firstValueFrom(
      this.marketplaceClient.send('marketplace.hasPurchased', { tabId, userId: req.user.id }),
    );
    return { purchased };
  }

  @Get('my/purchases')
  async getMyPurchases(
    @Request() req: { user: { id: string } },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return firstValueFrom(
      this.marketplaceClient.send('marketplace.getMyPurchases', {
        userId: req.user.id,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
      }),
    );
  }

  @Get('my/sales')
  async getMySales(
    @Request() req: { user: { id: string } },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return firstValueFrom(
      this.marketplaceClient.send('marketplace.getMySales', {
        userId: req.user.id,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
      }),
    );
  }
}
