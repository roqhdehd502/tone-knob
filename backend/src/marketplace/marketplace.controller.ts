import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
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

import { MarketplaceService } from './marketplace.service';

@ApiTags('marketplace')
@Controller('api/marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Get('tabs')
  @ApiOperation({ summary: '유료 타브 목록 조회' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  listPaidTabs(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.marketplaceService.listPaidTabs(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Post('tabs/:tabId/price')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '타브 가격 설정' })
  setPrice(
    @Param('tabId', ParseUUIDPipe) tabId: string,
    @Request() req: { user: { id: string } },
    @Body() body: { price: number },
  ) {
    return this.marketplaceService.setPrice(tabId, req.user.id, body.price);
  }

  @Post('tabs/:tabId/purchase')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '타브 구매' })
  purchase(
    @Param('tabId', ParseUUIDPipe) tabId: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.marketplaceService.purchase(tabId, req.user.id);
  }

  @Get('tabs/:tabId/purchased')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '타브 구매 여부 확인' })
  async hasPurchased(
    @Param('tabId', ParseUUIDPipe) tabId: string,
    @Request() req: { user: { id: string } },
  ) {
    const purchased = await this.marketplaceService.hasPurchased(
      tabId,
      req.user.id,
    );
    return { purchased };
  }

  @Get('my/purchases')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 구매 내역' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getMyPurchases(
    @Request() req: { user: { id: string } },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.marketplaceService.getMyPurchases(
      req.user.id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('my/sales')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 판매 내역 및 수익' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getMySales(
    @Request() req: { user: { id: string } },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.marketplaceService.getMySales(
      req.user.id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }
}
